// Checks the search helper itself with the made-up fixtures,
// so we can trust it when it runs on the real data tables.

import { describe, it, expect } from 'vitest';
import { findWinningMission } from './helpers/findWinningMission.js';
import { countWinningMissions } from './helpers/countWinningMissions.js';
import { camera, spectrometer, solarPanel, antenna, mediumRocket, leo, gto, mars, earthScenario } from './fixtures.js';

const data = {
  parts: [camera, spectrometer, solarPanel, antenna],
  rockets: [mediumRocket],
  orbits: [leo, gto, mars],
};

describe('findWinningMission', () => {
  it('finds a winning design when one exists', () => {
    const result = findWinningMission(earthScenario, data);
    expect(result).not.toBeNull();
    expect(result.score.failed).toBe(false);
    expect(result.mission.parts.map((part) => part.id)).toEqual(
      expect.arrayContaining(['camera', 'spectrometer', 'antenna', 'solar']),
    );
  });

  it('returns null when no design can meet the goal', () => {
    expect(findWinningMission({ ...earthScenario, minScience: 100 }, data)).toBeNull();
  });

  it('only uses orbits the scenario allows', () => {
    expect(findWinningMission({ ...earthScenario, allowedOrbits: ['mars-orbit'] }, data)).toBeNull();
  });
});

describe('countWinningMissions', () => {
  it('counts every combination and the winning ones', () => {
    // 3 instrument groups x 1 power x 1 comms x 2 allowed orbits x 1 rocket = 6 combinations.
    const result = countWinningMissions(earthScenario, data);
    expect(result.total).toBe(6);
    // Winners need science >= 7: camera + spectrometer (14) or spectrometer alone (8), on LEO or GTO.
    // GTO carries 400 kg: camera + spectrometer = 250 kg fits, so 4 winners.
    expect(result.wins).toBe(4);
    expect([...result.orbits].sort()).toEqual(['gto', 'leo-500']);
  });

  it('finds no winners when the goal is impossible', () => {
    const result = countWinningMissions({ ...earthScenario, minScience: 100 }, data);
    expect(result.wins).toBe(0);
    expect(result.rockets.size).toBe(0);
  });
});
