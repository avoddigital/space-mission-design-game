// Checks the search helper itself with the made-up fixtures,
// so we can trust it when it runs on the real data tables.

import { describe, it, expect } from 'vitest';
import { findWinningMission } from './helpers/findWinningMission.js';
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
