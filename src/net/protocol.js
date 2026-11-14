// Messages between the main device (the room) and the players' own devices. Pure functions, no network.
//
// Room → device:  { type: 'snapshot', players, turn, actor, screen, poll, outcome, mirror }   (sent after every change)
//                actor = the player who may make choices now (null: nobody, for example during the poll)
//                mirror = { state, ui, progress, best }: what the main screen shows, so every device can draw it too
//                { type: 'claim-denied', player }
// Device → room:  { type: 'claim', player }    (I am player N)
//                { type: 'vote', player, vote } ('go' or 'no-go')
//                { type: 'act', action, value } (a choice on the player's own screen, made on their turn)
//
// The room is the only source of truth: devices just show the snapshot and send intentions.

/**
 * Game actions a player's device may send. The main device runs them exactly as its own clicks, and only for the
 * player whose turn it is (snapshot.actor). 'tab' on the spacecraft step passes the turn to the role of the new tab.
 * Left out on purpose: the room and team setup, the Library and Badges, language and sound, and what each device
 * looks at on its own screen (src/ui/remote.js LOCAL_ACTIONS: tabs it only browses, numbers, meter details).
 */
export const REMOTE_ACTIONS = new Set([
  'select-scenario', 'start', 'confirm', 'go-step', 'menu', 'hub', 'free-play', 'new-campaign', 'confirm-new-campaign',
  'continue-campaign', 'pick-country', 'pick-focus', 'found-agency', 'plan', 'side-job', 'research', 'restart',
  'pause', 'tab', 'toggle-part', 'set-power', 'set-comms', 'set-orbit', 'set-rocket', 'launch', 'skip',
  'see-report', 'redesign', 'new-conditions', 'next-mission', 'quiz', 'close-modal',
]);
const MAX_VALUE_LENGTH = 64;

/** Letters and digits that are hard to confuse when read aloud or typed (no 0/O, 1/I/L). */
export const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 5;

/** A new room code, like "K7Q2M". */
export function makeCode(random = Math.random) {
  return Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)]).join('');
}

/** Clean up what the player typed: upper case, only valid characters, at most 5. */
export function normalizeCode(text = '') {
  return String(text)
    .toUpperCase()
    .split('')
    .filter((char) => CODE_ALPHABET.includes(char))
    .join('')
    .slice(0, CODE_LENGTH);
}

export const isValidCode = (code) => normalizeCode(code).length === CODE_LENGTH && normalizeCode(code) === code;

/**
 * What the players' devices need to know right now.
 * @param {{ team: object, claims: Map<string, number>, screen: string, turn: { player: number, role: string }|null,
 *   poll: { votes: string[], consoles: object[] }|null, outcome: string|null, pollResult: string|null, mirror?: object|null }} room
 */
export function snapshot({ team, claims, screen, turn = null, actor = null, poll = null, outcome = null, pollResult = null, mirror = null }) {
  const claimed = new Set(claims.values());
  return {
    type: 'snapshot',
    players: (team?.players ?? []).map((player, index) => ({ name: player.name, roles: player.roles, connected: claimed.has(index) })),
    screen,
    turn,
    actor,
    poll,
    pollResult,
    outcome,
    mirror,
  };
}

/**
 * The room's answer to a device's message. Pure: returns what to change, the network code applies it.
 * @param {{ claims: Map<string, number>, size: number, pollOpen: boolean, actor?: number|null }} room
 * @param {string} peerId the device that sent it
 * @param {object} message
 * @returns {{ claim?: number, release?: boolean, vote?: string, act?: { action: string, value?: string }, reply?: object }}
 */
export function handleMessage({ claims, size, pollOpen, actor = null }, peerId, message) {
  if (!message || typeof message !== 'object') return {};
  if (message.type === 'claim') {
    const player = Number(message.player);
    if (!Number.isInteger(player) || player < 0 || player >= size) return { reply: { type: 'claim-denied', player } };
    const takenBy = [...claims].find(([id, index]) => index === player && id !== peerId);
    if (takenBy) return { reply: { type: 'claim-denied', player } };
    return { claim: player };
  }
  if (message.type === 'vote') {
    // Only the device that holds this player can vote for them, and only while the poll is open
    if (!pollOpen || claims.get(peerId) !== Number(message.player)) return {};
    if (message.vote !== 'go' && message.vote !== 'no-go') return {};
    return { vote: `${claims.get(peerId)}:${message.vote}` };
  }
  if (message.type === 'act') {
    // Only the device of the player whose turn it is, and only the known game actions
    if (actor === null || claims.get(peerId) !== actor || !REMOTE_ACTIONS.has(message.action)) return {};
    const value = message.value;
    if (value !== undefined && (typeof value !== 'string' || value.length > MAX_VALUE_LENGTH)) return {};
    return { act: value === undefined ? { action: message.action } : { action: message.action, value } };
  }
  return {};
}
