// Mission simulation: 4 phases, random events and the science that reaches Earth.
// Pure functions, no DOM. The UI only animates the result (PRD sections 6.6, 7.2 and 7.3).

import { validateMission } from './validation.js';
import { effectiveScience } from './scoring.js';
import { PHASES, issueRoute } from './phases.js';
import { EVENT_SAFE_MARGIN } from './constants.js';
import { mulberry32 } from './random.js';

/**
 * Share of a resource that is still free (0 to 1), used to decide if an event hurts.
 * A resource that is over its limit or not set has no margin.
 */
export function resourceMargin(budget, key) {
  const entry = budget[key];
  if (!entry || entry.ratio === null || entry.ratio === undefined) return 0;
  return Math.max(0, 1 - entry.ratio);
}

/** Events that can happen in this scenario. */
function eventsFor(scenario, events) {
  return events.filter((event) => event.scenarios.includes('all') || event.scenarios.includes(scenario.id));
}

/** Pick 1 or 2 different events with the seeded generator. */
function pickEvents(pool, random) {
  if (pool.length === 0) return [];
  const count = Math.min(pool.length, random() < 0.5 ? 1 : 2);
  const left = [...pool];
  const picked = [];
  for (let index = 0; index < count; index += 1) {
    picked.push(left.splice(Math.floor(random() * left.length), 1)[0]);
  }
  return picked;
}

/**
 * @param {{ parts: object[], rocket?: object, orbit?: object }} mission resolved objects, not ids
 * @param {object} scenario
 * @param {object[]} events the events table (src/data/events.js); may be empty
 * @param {number} seed same seed and same mission give the same events
 */
export function simulateMission(mission, scenario, events = [], seed = 0) {
  const random = mulberry32(seed);
  const { issues, budget } = validateMission(mission, scenario);
  const errors = issues.filter((issue) => issue.severity === 'error');

  // The mission stops at the first phase that has an error (PRD table 7.3).
  const failedPhaseIndex = errors.reduce((first, issue) => {
    const index = PHASES.indexOf(issueRoute(issue).phase);
    return index !== -1 && index < first ? index : first;
  }, PHASES.length);

  const phases = PHASES.map((id, index) => {
    if (index > failedPhaseIndex) return { id, ok: null, issues: [] }; // never reached
    const phaseErrors = errors.filter((issue) => issueRoute(issue).phase === id);
    return { id, ok: phaseErrors.length === 0, issues: phaseErrors };
  });

  // Random events happen only if the spacecraft reaches the science phase.
  const reachedOperations = failedPhaseIndex > PHASES.indexOf('operations');
  const simulatedEvents = reachedOperations
    ? pickEvents(eventsFor(scenario, events), random).map((event) => {
        const margin = resourceMargin(budget, event.protectedBy);
        const harmed = margin < EVENT_SAFE_MARGIN;
        return {
          id: event.id,
          protectedBy: event.protectedBy,
          marginPct: Math.round(margin * 100),
          harmed,
          scienceLossPct: harmed ? event.scienceLossPct : 0,
        };
      })
    : [];

  // Science that reaches Earth, minus what the events took away.
  const keep = simulatedEvents.reduce((share, event) => share * (1 - event.scienceLossPct / 100), 1);
  const scienceDelivered = Math.round(effectiveScience(budget) * keep * 10) / 10;

  // When the design was already below the goal, report the science that really arrived (after the surprises),
  // so the flight text and the final numbers agree.
  const dataPhaseResult = phases.find((phase) => phase.id === 'data');
  if (dataPhaseResult.ok === false) {
    dataPhaseResult.issues = dataPhaseResult.issues.map((issue) => (issue.code === 'LOW_SCIENCE' ? { ...issue, scienceValue: scienceDelivered } : issue));
  }

  // With no earlier failure, the mission still fails if the science goal is not reached.
  const minScience = scenario.minScience ?? 0;
  if (failedPhaseIndex === PHASES.length && scienceDelivered < minScience) {
    const dataPhase = phases.find((phase) => phase.id === 'data');
    dataPhase.ok = false;
    dataPhase.issues = [{ code: 'LOW_SCIENCE', severity: 'error', scienceValue: scienceDelivered, minScience }];
  }

  const failed = phases.find((phase) => phase.ok === false) ?? null;
  return {
    seed,
    phases,
    events: simulatedEvents,
    outcome: failed ? 'failure' : 'success',
    failedPhase: failed?.id ?? null,
    failedIssue: failed?.issues[0] ?? null,
    scienceDelivered,
    issues,
    budget,
  };
}
