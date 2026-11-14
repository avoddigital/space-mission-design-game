// Test helper: counts every winning design of a scenario.
// Tries every non-empty group of instruments x 1 power part x 1 comms part
// x every allowed orbit x every rocket. A design wins when it has no errors
// and reaches the minimum science (same rule as scoreMission).

import { scoreMission } from '../../src/engine/scoring.js';

/** Every non-empty subset of a list. */
function nonEmptySubsets(list) {
  const subsets = [];
  for (let mask = 1; mask < 1 << list.length; mask += 1) {
    subsets.push(list.filter((_, index) => mask & (1 << index)));
  }
  return subsets;
}

/**
 * @returns {{ wins: number, total: number, rockets: Set<string>, orbits: Set<string> }}
 */
export function countWinningMissions(scenario, { parts, rockets, orbits }) {
  const instrumentGroups = nonEmptySubsets(parts.filter((part) => part.type === 'instrument'));
  const powerParts = parts.filter((part) => part.type === 'power');
  const commsParts = parts.filter((part) => part.type === 'comms');
  const allowedOrbits = orbits.filter((orbit) => scenario.allowedOrbits.includes(orbit.id));

  const result = { wins: 0, total: 0, rockets: new Set(), orbits: new Set() };
  for (const instruments of instrumentGroups) {
    for (const power of powerParts) {
      for (const comms of commsParts) {
        const designParts = [...instruments, power, comms];
        for (const orbit of allowedOrbits) {
          for (const rocket of rockets) {
            result.total += 1;
            const score = scoreMission({ parts: designParts, rocket, orbit }, scenario);
            if (!score.failed && score.breakdown.objective > 0) {
              result.wins += 1;
              result.rockets.add(rocket.id);
              result.orbits.add(orbit.id);
            }
          }
        }
      }
    }
  }
  return result;
}
