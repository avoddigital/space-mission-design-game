// The mission debrief: what worked, what stopped the mission (or the biggest risk), the resource that
// limited it, the change worth testing, the events, and how this attempt compares with the last one.
// Pure functions, no DOM. Every statement comes from the simulation result: a system is called "ok"
// only when the flight reached the phase where the engine checks it and found no problem there.
// This is not a score: the mission score (scoring.js) stays the operational result.

import { diagnoseFailure, causeOfIssue } from './diagnosis.js';
import { EVENT_SAFE_MARGIN } from './constants.js';

/** The systems of a mission and the flight phase where the engine checks each one. */
export const SYSTEMS = Object.freeze([
  { key: 'budget', phase: 'launch' },
  { key: 'launch', phase: 'launch' },
  { key: 'orbit', phase: 'transfer' },
  { key: 'power', phase: 'operations' },
  { key: 'time', phase: 'operations' },
  { key: 'data', phase: 'data' },
]);

/** The resource behind each cause of failure (orbit is a choice, not a resource). */
const LIMIT_OF_CAUSE = { budget: 'budget', launch: 'mass', power: 'power', time: 'time', data: 'data', science: 'science', orbit: null };

const RESOURCES = ['budget', 'mass', 'power', 'data', 'time'];

/** Room left in a resource, 0 to 1 (null if the meter has no limit yet). */
export function marginOf(budget, key) {
  const ratio = budget?.[key]?.ratio;
  return typeof ratio === 'number' ? Math.max(0, 1 - ratio) : null;
}

/**
 * Status of each system after the flight:
 * 'failed'      an error of this system stopped (or was found in) the phase that failed
 * 'ok'          the flight reached its phase and the engine found no problem with it
 * 'not-reached' the flight stopped before its phase, so it was never tested
 */
function systemStatus(simulation, diagnosis) {
  return SYSTEMS.map(({ key, phase }) => {
    const result = simulation.phases.find((item) => item.id === phase);
    const failed = (result?.issues ?? []).some((issue) => {
      if (issue.code === 'LOW_SCIENCE') return diagnosis?.cause === key; // only a slow antenna makes it a data failure
      return causeOfIssue(issue) === key;
    });
    if (failed) return { key, status: 'failed' };
    if (!result || result.ok === null) return { key, status: 'not-reached' };
    return { key, status: 'ok' };
  });
}

/**
 * @param {object} simulation result of simulateMission
 * @param {object} scenario
 * @returns {{
 *   outcome: string, goal: { reached: boolean, delivered: number, goal: number },
 *   systems: { key: string, status: string }[],
 *   diagnosis: object|null,
 *   limit: { resource: string|null, marginPct: number|null },
 *   risk: { resource: string, marginPct: number, event: object|null } | null,
 *   events: { id: string, protectedBy: string, marginPct: number, harmed: boolean, scienceLossPct: number }[],
 * }}
 */
/**
 * Science that really reached Earth. A mission that stopped before the data phase sent nothing home, even though
 * the engine still computes what the design could have sent (same rule as the science gauge, meter.js).
 */
export function scienceHome(simulation) {
  const { failedPhase, scienceDelivered = 0 } = simulation;
  return failedPhase && failedPhase !== 'data' ? 0 : scienceDelivered;
}

export function debriefMission(simulation, scenario) {
  const diagnosis = diagnoseFailure(simulation, scenario);
  const goal = scenario.minScience ?? 0;
  const budget = simulation.budget;
  const events = simulation.events ?? [];
  let limit;
  let risk = null;
  if (diagnosis) {
    const resource = diagnosis.cause === 'events'
      ? diagnosis.harmed[0]?.protectedBy ?? null
      : LIMIT_OF_CAUSE[diagnosis.cause] ?? null;
    const margin = resource && resource !== 'science' ? marginOf(budget, resource) : null;
    limit = { resource, marginPct: margin === null ? null : Math.round(margin * 100) };
  } else {
    // A success: the resource with the least room left is the next limit, and the biggest risk.
    const tightest = RESOURCES
      .map((key) => ({ key, margin: marginOf(budget, key) }))
      .filter((entry) => entry.margin !== null)
      .sort((a, b) => a.margin - b.margin)[0] ?? null;
    const hurt = events.find((event) => event.harmed) ?? null;
    limit = tightest ? { resource: tightest.key, marginPct: Math.round(tightest.margin * 100) } : { resource: null, marginPct: null };
    if (hurt) risk = { resource: hurt.protectedBy, marginPct: hurt.marginPct, event: hurt };
    else if (tightest && tightest.margin < EVENT_SAFE_MARGIN) risk = { resource: tightest.key, marginPct: Math.round(tightest.margin * 100), event: null };
  }
  return {
    outcome: simulation.outcome,
    goal: { reached: simulation.outcome === 'success', delivered: scienceHome(simulation), goal },
    systems: systemStatus(simulation, diagnosis),
    diagnosis,
    limit,
    risk,
    events,
  };
}

/**
 * A short record of one flight, kept to compare attempts (in the game state, not saved).
 * @param {object} simulation @param {object} scenario
 * @param {{ run: number, conditionsFrom?: number|null }} meta conditionsFrom: the flight whose events were replayed
 */
export function attemptSummary(simulation, scenario, { run, conditionsFrom = null }) {
  const diagnosis = diagnoseFailure(simulation, scenario);
  return {
    run,
    outcome: simulation.outcome,
    cause: diagnosis?.cause ?? null,
    delivered: scienceHome(simulation),
    reachedScience: simulation.phases.some((phase) => phase.id === 'operations' && phase.ok !== null),
    eventIds: (simulation.events ?? []).map((event) => event.id),
    systemsOk: systemStatus(simulation, diagnosis).filter((item) => item.status === 'ok').map((item) => item.key),
    conditionsFrom,
  };
}

/**
 * How this attempt compares with the previous one. `conditions` says if the comparison is fair:
 * 'same'      the same external events were replayed (or both flights met exactly the same ones)
 * 'different' the events changed, so part of the difference may come from the conditions
 * 'unknown'   one of the flights ended before the science phase, where events happen
 */
export function compareAttempts(previous, current) {
  if (!previous || !current) return null;
  let conditions;
  if (!previous.reachedScience || !current.reachedScience) conditions = 'unknown';
  else if (current.conditionsFrom === previous.run) conditions = 'same';
  else conditions = previous.eventIds.join('|') === current.eventIds.join('|') ? 'same' : 'different';
  return {
    previousRun: previous.run,
    scienceBefore: previous.delivered,
    scienceNow: current.delivered,
    outcomeBefore: previous.outcome,
    outcomeNow: current.outcome,
    causeBefore: previous.cause,
    causeNow: current.cause,
    nowWorking: current.systemsOk.filter((key) => !previous.systemsOk.includes(key)),
    conditions,
  };
}
