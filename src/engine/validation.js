// Full mission validation. Pure functions, no DOM.
// Returns issue codes with parameters, never player-facing sentences.
// Severity: 'error' means the mission cannot succeed; 'warning' means it is risky or weaker.

import { computeBudget } from './resources.js';
import { checkLaunch } from './compatibility.js';

/** Every issue code the engine can return (including the launch codes from checkLaunch). */
export const ISSUE_CODES = Object.freeze([
  'NO_ROCKET',
  'NO_ORBIT',
  'MISSING_REQUIRED_TYPE',
  'ORBIT_NOT_ALLOWED',
  'ROCKET_CANNOT_REACH_ORBIT',
  'PAYLOAD_TOO_HEAVY',
  'LOW_MASS_MARGIN',
  'POWER_DEFICIT',
  'OVER_BUDGET',
  'OVER_TIME',
  'NO_COMMS',
  'DATA_BACKLOG',
  'LOW_SCIENCE',
]);

/**
 * @param {{ parts: object[], rocket?: object, orbit?: object }} mission resolved objects, not ids
 * @param {object} scenario
 * @returns {{ ok: boolean, issues: object[], budget: object }}
 */
export function validateMission(mission, scenario) {
  const { parts = [], rocket = null, orbit = null } = mission;
  const budget = computeBudget(mission, scenario);
  const issues = [];
  const error = (code, params = {}) => issues.push({ code, severity: 'error', ...params });
  const warning = (code, params = {}) => issues.push({ code, severity: 'warning', ...params });

  // Required choices and parts.
  if (!rocket) error('NO_ROCKET');
  if (!orbit) error('NO_ORBIT');
  for (const type of scenario.requiredTypes ?? []) {
    if (!parts.some((part) => part.type === type)) error('MISSING_REQUIRED_TYPE', { type });
  }

  // Orbit must be one the scenario allows.
  if (orbit && scenario.allowedOrbits && !scenario.allowedOrbits.includes(orbit.id)) {
    error('ORBIT_NOT_ALLOWED', { orbitId: orbit.id, allowedOrbits: scenario.allowedOrbits });
  }

  // Launch: only meaningful once both rocket and orbit are chosen.
  if (rocket && orbit) {
    issues.push(...checkLaunch(rocket, orbit, budget.mass.usedKg).issues);
  }

  if (!budget.power.ok) error('POWER_DEFICIT', { missingW: -budget.power.marginW });
  if (!budget.budget.ok) error('OVER_BUDGET', { excessMUsd: -budget.budget.marginMUsd });
  if (!budget.time.ok) error('OVER_TIME', { excessDays: -budget.time.marginDays });

  // Missing comms is already reported by MISSING_REQUIRED_TYPE when the scenario requires it.
  const commsRequired = (scenario.requiredTypes ?? []).includes('comms');
  if (!budget.comms.ok && !commsRequired) error('NO_COMMS');

  // Data that cannot be sent to Earth is lost: weaker science, but not a failure.
  if (budget.comms.ok && !budget.data.ok) {
    warning('DATA_BACKLOG', { excessGbPerDay: -budget.data.marginGbPerDay });
  }

  if (budget.scienceValue < (scenario.minScience ?? 0)) {
    warning('LOW_SCIENCE', { scienceValue: budget.scienceValue, minScience: scenario.minScience });
  }

  return {
    ok: !issues.some((issue) => issue.severity === 'error'),
    issues,
    budget,
  };
}
