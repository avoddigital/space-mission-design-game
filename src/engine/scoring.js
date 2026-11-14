// Mission scoring, 0 to 100. Pure functions, no DOM.
// Split agreed by the team: science 50, efficiency 30, objective 20.
// For now it scores the design only; simulation results will be added later.

import { validateMission } from './validation.js';

export const SCORE_WEIGHTS = Object.freeze({ science: 50, efficiency: 30, objective: 20 });

/** Science reaches full points at this multiple of the scenario minimum. */
export const FULL_SCIENCE_MULTIPLIER = 2;

/** Budget and mass margins reach full points at this share left over. */
export const FULL_MARGIN_RATIO = 0.2;

const clamp01 = (value) => Math.min(1, Math.max(0, value));

/**
 * Science the mission actually delivers. If the antennas cannot send all the data,
 * only the share that reaches Earth counts.
 */
export function effectiveScience(budget) {
  const { producedGbPerDay, downlinkGbPerDay } = budget.data;
  if (!budget.comms.ok) return 0;
  if (producedGbPerDay <= 0 || downlinkGbPerDay >= producedGbPerDay) return budget.scienceValue;
  return budget.scienceValue * (downlinkGbPerDay / producedGbPerDay);
}

/**
 * @param {{ parts: object[], rocket?: object, orbit?: object }} mission resolved objects, not ids
 * @param {object} scenario
 * @param {object|null} [simulation] result of simulateMission. When given, a failed simulation
 *   scores 0 and the science points use the science delivered after random events.
 * @returns {{ total: number, failed: boolean, breakdown: object, issues: object[], budget: object }}
 */
export function scoreMission(mission, scenario, simulation = null) {
  const { ok, issues, budget } = validateMission(mission, scenario);

  // Any error means the mission fails: score 0, and the report explains the issues.
  if (!ok || simulation?.outcome === 'failure') {
    return {
      total: 0,
      failed: true,
      breakdown: { science: 0, efficiency: 0, objective: 0 },
      issues,
      budget,
    };
  }

  const minScience = scenario.minScience ?? 0;
  const delivered = simulation ? simulation.scienceDelivered : effectiveScience(budget);
  const scienceTarget = Math.max(1, minScience * FULL_SCIENCE_MULTIPLIER);
  const science = SCORE_WEIGHTS.science * clamp01(delivered / scienceTarget);

  // Efficiency: half for budget left over, half for mass margin on the rocket.
  const budgetRatio = budget.budget.marginMUsd / budget.budget.limitMUsd;
  const massRatio = budget.mass.marginKg / budget.mass.limitKg;
  const halfEfficiency = SCORE_WEIGHTS.efficiency / 2;
  const efficiency =
    halfEfficiency * clamp01(budgetRatio / FULL_MARGIN_RATIO) +
    halfEfficiency * clamp01(massRatio / FULL_MARGIN_RATIO);

  // Objective: required part types are guaranteed here (missing ones are errors),
  // so it depends on reaching the minimum science.
  const objective = delivered >= minScience ? SCORE_WEIGHTS.objective : 0;

  const breakdown = {
    science: Math.round(science),
    efficiency: Math.round(efficiency),
    objective,
  };

  return {
    total: breakdown.science + breakdown.efficiency + breakdown.objective,
    failed: false,
    breakdown,
    issues,
    budget,
  };
}
