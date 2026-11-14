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
