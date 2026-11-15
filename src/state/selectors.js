// Values derived from the state. The evaluation is never stored: it is always
// recalculated from the player's choices (PRD section 6.7). No DOM.

import { parts } from '../data/parts.js';
import { rockets } from '../data/rockets.js';
import { orbits } from '../data/orbits.js';
import { scenarios } from '../data/scenarios.js';
import { events } from '../data/events.js';
import { content } from '../data/content.js';
import { resolveDesign } from '../engine/resolve.js';
import { validateMission } from '../engine/validation.js';
import { simulateMission } from '../engine/simulate.js';
import { scoreMission } from '../engine/scoring.js';
import { hashDesign } from '../engine/random.js';

/** All game data in one object. Tests can pass their own data instead. */
export const gameData = Object.freeze({ parts, rockets, orbits, scenarios, events, content });

export function selectScenario(state, data = gameData) {
  const scenario = data.scenarios.find((item) => item.id === state.scenarioId);
  if (!scenario) throw new Error(`Unknown scenario id: ${state.scenarioId}`);
  return scenario;
}

/** The player's choices as data objects: { parts, rocket, orbit }. */
export function selectMission(state, data = gameData) {
  return resolveDesign(state.design, data);
}

/** Meters and issues for the current design: { ok, issues, budget }. */
export function selectEvaluation(state, data = gameData) {
  return validateMission(selectMission(state, data), selectScenario(state, data));
}

/**
 * Run the simulation for the current design. The same design and the same `reroll`
 * always give the same random events, so players can compare their changes fairly.
 */
export function runSimulation(state, data = gameData) {
  const seed = (hashDesign(state.design, state.scenarioId) + state.reroll * 7919) >>> 0;
  // "Rebuild, same conditions": replay the surprises of an earlier flight (see actions.redesign).
  const eventIds = state.conditions?.eventIds ?? null;
  return simulateMission(selectMission(state, data), selectScenario(state, data), data.events ?? [], seed, { eventIds });
}

/** Score for the simulation stored in the state (0 to 100). */
export function selectScore(state, data = gameData) {
  return scoreMission(selectMission(state, data), selectScenario(state, data), state.simulation);
}

/** Score the current design would get before random events (0 to 100). Shown live while designing. */
export function selectProjectedScore(state, data = gameData) {
  return scoreMission(selectMission(state, data), selectScenario(state, data));
}
