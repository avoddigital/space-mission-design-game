import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { makeCode, normalizeCode, isValidCode, snapshot, handleMessage, CODE_ALPHABET, REMOTE_ACTIONS } from '../src/net/protocol.js';
import { createTeam } from '../src/engine/team.js';

describe('room codes', () => {
  it('makes 5-character codes without look-alike letters', () => {
    for (let index = 0; index < 50; index += 1) {
      const code = makeCode();
      expect(code).toMatch(/^[A-Z2-9]{5}$/);
      expect(isValidCode(code)).toBe(true);
    }
    expect(CODE_ALPHABET).not.toMatch(/[01IOL]/);
  });

  it('cleans what the player typed', () => {
    expect(normalizeCode(' k7q-2m ')).toBe('K7Q2M');
    expect(normalizeCode('abcdefgh')).toBe('ABCDE');
    expect(isValidCode('K7Q2')).toBe(false);
    expect(isValidCode('k7q2m')).toBe(false); // must be cleaned first
  });
});

describe('room messages', () => {
  const room = (claims = new Map(), pollOpen = false) => ({ claims, size: 3, pollOpen });

  it('lets a device take a free player, but not one already on another device', () => {
    expect(handleMessage(room(), 'device-a', { type: 'claim', player: 1 })).toEqual({ claim: 1 });
    const taken = new Map([['device-a', 1]]);
    expect(handleMessage(room(taken), 'device-b', { type: 'claim', player: 1 })).toEqual({ reply: { type: 'claim-denied', player: 1 } });
    expect(handleMessage(room(taken), 'device-a', { type: 'claim', player: 1 })).toEqual({ claim: 1 }); // same device again
    expect(handleMessage(room(), 'device-a', { type: 'claim', player: 7 }).reply.type).toBe('claim-denied');
  });

  it('accepts a vote only from the device that holds the player, while the poll is open', () => {
    const claims = new Map([['device-a', 2]]);
    expect(handleMessage(room(claims, true), 'device-a', { type: 'vote', player: 2, vote: 'go' })).toEqual({ vote: '2:go' });
    expect(handleMessage(room(claims, true), 'device-a', { type: 'vote', player: 0, vote: 'go' })).toEqual({}); // someone else's seat
    expect(handleMessage(room(claims, false), 'device-a', { type: 'vote', player: 2, vote: 'go' })).toEqual({}); // no poll
    expect(handleMessage(room(claims, true), 'device-a', { type: 'vote', player: 2, vote: 'maybe' })).toEqual({});
    expect(handleMessage(room(), 'x', null)).toEqual({});
  });

  it('sends every connected device the team, who is connected and what is happening', () => {
    const message = snapshot({ team: createTeam(2, ['Ana', 'Bia']), claims: new Map([['device-a', 1]]), screen: 'launch', turn: { role: 'director', player: 0 } });
    expect(message).toMatchObject({ type: 'snapshot', screen: 'launch', turn: { player: 0 }, poll: null, outcome: null });
    expect(message.players.map((player) => [player.name, player.connected])).toEqual([['Ana', false], ['Bia', true]]);
    expect(message.mirror).toBeNull();
  });

  it('carries the main screen so every device can draw it too', () => {
    const mirror = { state: { screen: 'hub' }, ui: { opsTab: 'research' } };
    const message = snapshot({ team: createTeam(2), claims: new Map(), screen: 'hub', mirror });
    expect(message.mirror).toEqual(mirror);
  });
});

describe('network code stays optional', () => {
  it('loads PeerJS only on demand, and the game only opens the player console from a ?sala link', () => {
    const room = readFileSync('src/net/room.js', 'utf8');
    expect(room).toMatch(/await import\('peerjs'\)/);
    expect(room).not.toMatch(/^import .*peerjs/m);
    const main = readFileSync('src/main.js', 'utf8');
    expect(main).toMatch(/import\('\.\/ui\/remote\.js'\)/);
  });

  it('lets only the player whose turn it is make choices, and only with game actions', () => {
    const room = { claims: new Map([['device-a', 0], ['device-b', 1]]), size: 2, pollOpen: false, actor: 0 };
    expect(handleMessage(room, 'device-a', { type: 'act', action: 'toggle-part', value: 'hd-camera' })).toEqual({ act: { action: 'toggle-part', value: 'hd-camera' } });
    expect(handleMessage(room, 'device-a', { type: 'act', action: 'launch' })).toEqual({ act: { action: 'launch' } });
    expect(handleMessage(room, 'device-b', { type: 'act', action: 'launch' })).toEqual({}); // not their turn
    expect(handleMessage({ ...room, actor: null }, 'device-a', { type: 'act', action: 'launch' })).toEqual({}); // nobody's turn
    expect(handleMessage(room, 'stranger', { type: 'act', action: 'launch' })).toEqual({});
    expect(handleMessage(room, 'device-a', { type: 'act', action: 'room-close' })).toEqual({});
    expect(handleMessage(room, 'device-a', { type: 'act', action: 'tab', value: 42 })).toEqual({});
    expect(REMOTE_ACTIONS.has('language')).toBe(false);
    expect(REMOTE_ACTIONS.has('meter')).toBe(false); // details open on the player's own screen
  });
});
