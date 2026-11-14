// Test helper: searches for a mission design that wins a scenario.
// Not a perfect optimizer: it tries every rocket, allowed orbit, comms part and
// 1 or 2 power parts, then greedily adds the instruments with the most science.

import { validateMission } from '../../src/engine/validation.js';
import { scoreMission } from '../../src/engine/scoring.js';

const byType = (parts, type) => parts.filter((part) => part.type === type);

/** Valid while building: no errors except "not enough science yet", which more instruments fix. */
const validWhileBuilding = (mission, scenario) =>
  validateMission(mission, scenario).issues.every((issue) => issue.severity !== 'error' || issue.code === 'LOW_SCIENCE');

function powerOptions(powerParts) {
  const options = powerParts.map((part) => [part]);
  for (let i = 0; i < powerParts.length; i += 1) {
    for (let j = i; j < powerParts.length; j += 1) options.push([powerParts[i], powerParts[j]]);
  }
  return options;
}

/**
 * @returns {{ mission: object, score: object } | null} the best winning design found,
 *   where winning means no errors and the objective (minimum science) is met.
 */
export function findWinningMission(scenario, { parts, rockets, orbits }) {
  const allowed = orbits.filter((orbit) => scenario.allowedOrbits.includes(orbit.id));
  const instruments = [...byType(parts, 'instrument')].sort((a, b) => b.scienceValue - a.scienceValue);
  let best = null;

  for (const rocket of rockets) {
    for (const orbit of allowed) {
      for (const comms of byType(parts, 'comms')) {
        for (const power of powerOptions(byType(parts, 'power'))) {
          let chosen = [comms, ...power];
          for (const instrument of instruments) {
            const candidate = [...chosen, instrument];
            if (validWhileBuilding({ parts: candidate, rocket, orbit }, scenario)) chosen = candidate;
          }
          const mission = { parts: chosen, rocket, orbit };
          const score = scoreMission(mission, scenario);
          const wins = !score.failed && score.breakdown.objective > 0;
          if (wins && (!best || score.total > best.score.total)) best = { mission, score };
        }
      }
    }
  }
  return best;
}
