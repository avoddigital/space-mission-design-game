// Team play: 1 to 4 players on one device, each with a role (a "console", like in a real mission
// control room). Pure functions, no DOM. The rules of the mission do not change in team mode:
// roles only decide who leads each decision and who checks which resources before launch.

import { EVENT_SAFE_MARGIN } from './constants.js';
import { resourceMargin } from './simulate.js';

export const MAX_PLAYERS = 4;

/**
 * The four roles and the resources each one watches.
 * - director: mission objective, orbit and rocket; owns the budget and the schedule
 * - engineer: power source and launch mass
 * - scientist: instruments and the science goal
 * - comms: antenna and the data that must reach Earth
 */
export const ROLES = Object.freeze({
  director: { resources: ['budget', 'time'] },
  engineer: { resources: ['mass', 'power'] },
  scientist: { resources: ['science'] },
  comms: { resources: ['data', 'comms'] },
});

export const ROLE_ORDER = Object.freeze(['director', 'scientist', 'engineer', 'comms']);

/** Roles for each team size: every role always has someone in charge. */
const SPLITS = {
  1: [['director', 'scientist', 'engineer', 'comms']],
  2: [['director', 'comms'], ['scientist', 'engineer']],
  3: [['director', 'comms'], ['scientist'], ['engineer']],
  4: [['director'], ['scientist'], ['engineer'], ['comms']],
};

/** Roles of each player, for a team of `size` players (1 to 4). */
export function assignRoles(size) {
  const count = Math.min(MAX_PLAYERS, Math.max(1, Math.round(size) || 1));
  return SPLITS[count].map((roles) => [...roles]);
}

/**
 * A team of `size` players. Names are optional; empty names show as "Player 1", "Player 2"...
 * @returns {{ players: Array<{ name: string, roles: string[] }> }}
 */
export function createTeam(size = 1, names = []) {
  return { players: assignRoles(size).map((roles, index) => ({ name: (names[index] ?? '').trim().slice(0, 20), roles })) };
}

/** Change the number of players, keeping the names already typed. */
export function resizeTeam(team, size) {
  return createTeam(size, (team?.players ?? []).map((player) => player.name));
}

export function renamePlayer(team, index, name) {
  return createTeam(team.players.length, team.players.map((player, at) => (at === index ? name : player.name)));
}

export const isTeamPlay = (team) => (team?.players?.length ?? 1) > 1;

/** The role that leads a decision: step screen, and on the spacecraft step, the open tab. */
export function roleForStep(screen, tab = 'instrument') {
  if (screen === 'objective' || screen === 'launch') return 'director';
  if (screen === 'spacecraft') return { instrument: 'scientist', power: 'engineer', comms: 'comms' }[tab] ?? 'scientist';
  return null;
}

/** Index of the player who holds a role. */
export function playerFor(team, role) {
  const index = (team?.players ?? []).findIndex((player) => player.roles.includes(role));
  return index === -1 ? 0 : index;
}

/**
 * How one resource looks from its console before launch:
 * 'no-go' (broken or missing), 'risky' (works, but less than 15% margin, so a surprise can hurt it) or 'go'.
 */
export function resourceCall(budget, key) {
  if (key === 'science') {
    const { value, goal } = budget.science;
    if (value < goal) return 'no-go';
    return goal > 0 && value < goal * (1 + EVENT_SAFE_MARGIN) ? 'risky' : 'go';
  }
  if (key === 'comms') return budget.comms.ok ? 'go' : 'no-go';
  const entry = budget[key];
  if (!entry || entry.status === 'pending' || entry.status === 'over') return 'no-go';
  return resourceMargin(budget, key) < EVENT_SAFE_MARGIN ? 'risky' : 'go';
}

const WORST = { 'no-go': 2, risky: 1, go: 0 };

/** A console's recommendation: the worst call among its resources. */
export function consoleCall(budget, role) {
  return ROLES[role].resources.map((key) => resourceCall(budget, key)).reduce((worst, call) => (WORST[call] > WORST[worst] ? call : worst), 'go');
}

/**
 * Everyone's consoles before launch (the GO / NO-GO poll).
 * @returns {Array<{ player: number, role: string, call: string, resources: Array<{ key: string, call: string }> }>}
 */
export function pollConsoles(team, budget) {
  return team.players.flatMap((player, index) =>
    player.roles.map((role) => ({
      player: index,
      role,
      call: consoleCall(budget, role),
      resources: ROLES[role].resources.map((key) => ({ key, call: resourceCall(budget, key) })),
    })),
  );
}

/** The launch goes ahead only when every player votes GO. */
export function pollPassed(votes, size) {
  return votes.length === size && votes.every((vote) => vote === 'go');
}

/**
 * After the flight: how each console did. A surprise "hit" a console when it hurt one of its resources.
 * @param {object} simulation result of simulateMission
 * @returns {Array<{ player: number, role: string, call: string, hits: string[], saves: string[] }>}
 */
export function teamDebrief(team, simulation) {
  return pollConsoles(team, simulation.budget).map((entry) => {
    const watched = ROLES[entry.role].resources;
    const mine = simulation.events.filter((event) => watched.includes(event.protectedBy));
    return {
      ...entry,
      hits: mine.filter((event) => event.harmed).map((event) => event.id),
      saves: mine.filter((event) => !event.harmed).map((event) => event.id),
    };
  });
}
