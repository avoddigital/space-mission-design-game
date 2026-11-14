// Rocket and orbit compatibility checks. Pure functions, no DOM.

import { launchCapacityKg } from './resources.js';

/**
 * Below this share of free capacity we warn the player.
 * Real missions keep a mass margin because spacecraft tend to get heavier during design.
 */
export const MIN_MASS_MARGIN_RATIO = 0.1;

/**
 * Check whether a rocket can carry a spacecraft of `massKg` to an orbit.
 * Issues are codes with parameters; the UI turns them into player-friendly text.
 *
 * @returns {{ ok: boolean, capacityKg: number, marginKg: number, marginRatio: number, issues: object[] }}
 */
export function checkLaunch(rocket, orbit, massKg) {
  const capacityKg = launchCapacityKg(rocket, orbit) ?? 0;
  const marginKg = capacityKg - massKg;
  const marginRatio = capacityKg > 0 ? marginKg / capacityKg : 0;
  const issues = [];

  if (capacityKg <= 0) {
    issues.push({
      code: 'ROCKET_CANNOT_REACH_ORBIT',
      severity: 'error',
      rocketId: rocket?.id,
      orbitId: orbit?.id,
    });
  } else if (marginKg < 0) {
    issues.push({ code: 'PAYLOAD_TOO_HEAVY', severity: 'error', excessKg: -marginKg, capacityKg });
  } else if (marginRatio < MIN_MASS_MARGIN_RATIO) {
    issues.push({
      code: 'LOW_MASS_MARGIN',
      severity: 'warning',
      marginKg,
      marginPct: Math.round(marginRatio * 100),
    });
  }

  return {
    ok: !issues.some((issue) => issue.severity === 'error'),
    capacityKg,
    marginKg,
    marginRatio,
    issues,
  };
}
