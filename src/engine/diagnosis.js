// Why a simulated mission failed, in words a player can act on. Pure functions, no DOM.
// It does not change any rule: it only reads the simulation result (simulate.js) and names the cause.
//
// Causes, in flight order:
//   'budget'  over budget: the mission never left the ground
//   'launch'  no rocket, or the rocket cannot carry the spacecraft to the orbit
//   'orbit'   no orbit, or an orbit this mission does not allow
//   'power'   not enough power (or no power source): the instruments shut down
//   'time'    the trip and the science phase do not fit the time limit
//   'data'    no antenna, or the antenna is too slow: the science stays on board
//   'science' the instruments cannot reach the science goal, even with all the data home
//   'events'  the design reached the goal, but random events took it below
// Events happen only in the science phase, so they are never the cause of an earlier failure.

import { effectiveScience } from './resources.js';

const BY_CODE = {
  OVER_BUDGET: 'budget',
  NO_ROCKET: 'launch',
  ROCKET_CANNOT_REACH_ORBIT: 'launch',
  PAYLOAD_TOO_HEAVY: 'launch',
  NO_ORBIT: 'orbit',
  ORBIT_NOT_ALLOWED: 'orbit',
  POWER_DEFICIT: 'power',
  OVER_TIME: 'time',
  NO_COMMS: 'data',
};

const MISSING_TYPE = { power: 'power', comms: 'data', instrument: 'science' };

/** The cause behind one engine issue (LOW_SCIENCE needs the whole simulation: see diagnoseFailure). */
export function causeOfIssue(issue) {
  if (issue.code === 'MISSING_REQUIRED_TYPE') return MISSING_TYPE[issue.type] ?? 'science';
  return BY_CODE[issue.code] ?? null;
}

/**
 * @param {object} simulation result of simulateMission
 * @param {{ minScience?: number }} scenario
 * @returns {null | { cause: string, issue: object, designScience: number, beforeEvents: number,
 *   delivered: number, goal: number, harmed: object[] }} null when the mission succeeded
 */
export function diagnoseFailure(simulation, scenario) {
  const issue = simulation?.failedIssue;
  if (!simulation || simulation.outcome !== 'failure' || !issue) return null;
  const goal = scenario.minScience ?? 0;
  const designScience = simulation.budget?.scienceValue ?? 0; // every instrument, if all data got home
  const beforeEvents = simulation.budget ? Math.round(effectiveScience(simulation.budget) * 10) / 10 : 0;
  const delivered = simulation.scienceDelivered ?? 0;
  const harmed = (simulation.events ?? []).filter((event) => event.harmed);

  let cause = BY_CODE[issue.code] ?? null;
  if (issue.code === 'MISSING_REQUIRED_TYPE') cause = MISSING_TYPE[issue.type] ?? 'science';
  if (issue.code === 'LOW_SCIENCE') {
    if (designScience < goal) cause = 'science';
    else if (beforeEvents < goal) cause = 'data'; // the antenna could not send enough of it home
    else cause = harmed.length ? 'events' : 'science';
  }
  return { cause: cause ?? 'science', issue, designScience, beforeEvents, delivered, goal, harmed };
}
