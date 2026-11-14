import { describe, it, expect } from 'vitest';
import {
  ROLES, ROLE_ORDER, assignRoles, createTeam, resizeTeam, renamePlayer, isTeamPlay, roleForStep, playerFor,
  resourceCall, consoleCall, pollConsoles, pollPassed, teamDebrief,
} from '../src/engine/team.js';

// A budget like computeBudget's: ratio is the share of the limit in use.
const budget = (overrides = {}) => ({
  mass: { ratio: 0.5, status: 'ok' },
  power: { ratio: 0.5, status: 'ok' },
  budget: { ratio: 0.5, status: 'ok' },
  data: { ratio: 0.5, status: 'ok' },
  time: { ratio: 0.5, status: 'ok' },
  comms: { ok: true, ratio: null, status: 'ok' },
  science: { value: 20, goal: 12, ok: true },
  ...overrides,
});

describe('team roles', () => {
  it('gives every role to exactly one player, for 1 to 4 players', () => {
    for (let size = 1; size <= 4; size += 1) {
      const roles = assignRoles(size);
      expect(roles).toHaveLength(size);
      expect(roles.flat().sort()).toEqual([...ROLE_ORDER].sort());
    }
  });

  it('keeps sizes between 1 and 4', () => {
    expect(assignRoles(0)).toHaveLength(1);
    expect(assignRoles(9)).toHaveLength(4);
  });

  it('keeps typed names when the team grows or shrinks, and trims them', () => {
    let team = createTeam(2, ['  Ana  ', 'Bia']);
    expect(team.players.map((player) => player.name)).toEqual(['Ana', 'Bia']);
    team = resizeTeam(team, 4);
    expect(team.players.map((player) => player.name)).toEqual(['Ana', 'Bia', '', '']);
    team = renamePlayer(team, 2, 'Caio');
    expect(team.players[2]).toMatchObject({ name: 'Caio', roles: ['engineer'] });
    expect(isTeamPlay(team)).toBe(true);
    expect(isTeamPlay(createTeam(1))).toBe(false);
    expect(isTeamPlay(null)).toBe(false);
  });

  it('says who leads each decision', () => {
    expect(roleForStep('objective')).toBe('director');
    expect(roleForStep('launch')).toBe('director');
    expect(roleForStep('spacecraft', 'instrument')).toBe('scientist');
    expect(roleForStep('spacecraft', 'power')).toBe('engineer');
    expect(roleForStep('spacecraft', 'comms')).toBe('comms');
    expect(roleForStep('report')).toBeNull();
    const team = createTeam(3);
    expect(playerFor(team, 'comms')).toBe(0); // with 3 players, player 1 also handles communications
    expect(playerFor(team, 'engineer')).toBe(2);
  });

  it('every resource the game tracks is watched by some role', () => {
    const watched = Object.values(ROLES).flatMap((role) => role.resources).sort();
    expect(watched).toEqual(['budget', 'comms', 'data', 'mass', 'power', 'science', 'time']);
  });
});

describe('GO / NO-GO poll', () => {
  it('warns when a resource has less than 15% margin, the margin that protects from surprises', () => {
    expect(resourceCall(budget(), 'power')).toBe('go');
    expect(resourceCall(budget({ power: { ratio: 0.9, status: 'tight' } }), 'power')).toBe('risky');
    expect(resourceCall(budget({ power: { ratio: 1.2, status: 'over' } }), 'power')).toBe('no-go');
    expect(resourceCall(budget({ data: { ratio: null, status: 'pending' } }), 'data')).toBe('no-go');
  });

  it('checks the science goal and the antenna', () => {
    expect(resourceCall(budget({ science: { value: 10, goal: 12 } }), 'science')).toBe('no-go');
    expect(resourceCall(budget({ science: { value: 12, goal: 12 } }), 'science')).toBe('risky'); // exactly at the goal
    expect(resourceCall(budget({ comms: { ok: false } }), 'comms')).toBe('no-go');
  });

  it('a console reports its worst resource', () => {
    expect(consoleCall(budget({ mass: { ratio: 0.95, status: 'tight' } }), 'engineer')).toBe('risky');
    expect(consoleCall(budget({ mass: { ratio: 0.95, status: 'tight' }, power: { ratio: 1.1, status: 'over' } }), 'engineer')).toBe('no-go');
  });

  it('lists one console per role, grouped by player', () => {
    const consoles = pollConsoles(createTeam(2), budget());
    expect(consoles.map((entry) => [entry.player, entry.role])).toEqual([[0, 'director'], [0, 'comms'], [1, 'scientist'], [1, 'engineer']]);
  });

  it('launches only when every player says GO', () => {
    expect(pollPassed(['go', 'go'], 2)).toBe(true);
    expect(pollPassed(['go', 'no-go'], 2)).toBe(false);
    expect(pollPassed(['go'], 2)).toBe(false);
  });
});

describe('team debrief', () => {
  it('tells each console which surprises hit it and which its margin absorbed', () => {
    const simulation = {
      budget: budget(),
      events: [
        { id: 'solar-storm', protectedBy: 'power', harmed: true },
        { id: 'ground-station-outage', protectedBy: 'data', harmed: false },
      ],
    };
    const debrief = teamDebrief(createTeam(4), simulation);
    const byRole = Object.fromEntries(debrief.map((entry) => [entry.role, entry]));
    expect(byRole.engineer.hits).toEqual(['solar-storm']);
    expect(byRole.comms.saves).toEqual(['ground-station-outage']);
    expect(byRole.director).toMatchObject({ hits: [], saves: [] });
  });
});

describe('team views', async () => {
  const { teamPicker, turnChip, pollOverlay, teamDebriefSection } = await import('../src/ui/components/team.js');
  const { gameData } = await import('../src/state/selectors.js');
  const team = createTeam(3, ['Ana', '', 'Caio']);

  it('shows 1 to 4 players, names and roles', () => {
    const html = teamPicker(team);
    expect(html.match(/data-action="team-size"/g)).toHaveLength(4);
    expect(html.match(/data-input="player-name"/g)).toHaveLength(3);
    expect(html).toContain('value="Ana"');
    expect(html).toContain('Mission Director');
    expect(teamPicker(createTeam(1))).not.toContain('data-input="player-name"');
  });

  it("shows whose turn it is only in team play", () => {
    expect(turnChip(team, 'spacecraft', 'power')).toContain('Caio&#39;s turn');
    expect(turnChip(team, 'spacecraft', 'instrument')).toContain('Player 2&#39;s turn'); // no name typed
    expect(turnChip(createTeam(1), 'objective')).toBe('');
    expect(turnChip(team, 'report')).toBe('');
  });

  it('asks every player for GO or NO-GO, with their consoles', () => {
    const html = pollOverlay(team, pollConsoles(team, budget({ power: { ratio: 0.95, status: 'tight' } })), ['go']);
    expect(html.match(/data-action="poll-vote"/g)).toHaveLength(6); // 3 players x GO / NO-GO
    expect(html).toContain('1 of 3 players have voted');
    expect(html).toContain('less than 15% margin'); // the engineer's power console warns
  });

  it('adds a team debrief to the report', () => {
    const simulation = { budget: budget(), events: [{ id: 'solar-storm', protectedBy: 'power', harmed: true }] };
    const html = teamDebriefSection(team, teamDebrief(team, simulation), gameData);
    expect(html).toContain('Team debrief');
    expect(html).toContain('Hit by: Solar Storm');
    expect(teamDebriefSection(createTeam(1), [], gameData)).toBe('');
  });
});
