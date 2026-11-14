import { describe, it, expect } from 'vitest';
import { validateMission } from '../src/engine/validation.js';
import { goodMission, earthScenario, camera, spectrometer, solarPanel, antenna, mars } from './fixtures.js';

const codes = (result) => result.issues.map((issue) => issue.code);

describe('validateMission', () => {
  it('accepts a valid mission with no issues', () => {
    const result = validateMission(goodMission(), earthScenario);
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it('requires a rocket and an orbit', () => {
    const result = validateMission(goodMission({ rocket: null, orbit: null }), earthScenario);
    expect(result.ok).toBe(false);
    expect(codes(result)).toEqual(expect.arrayContaining(['NO_ROCKET', 'NO_ORBIT']));
  });

  it('reports each missing required part type', () => {
    const result = validateMission(goodMission({ parts: [camera] }), earthScenario);
    const missing = result.issues.filter((issue) => issue.code === 'MISSING_REQUIRED_TYPE').map((issue) => issue.type);
    expect(missing).toEqual(['power', 'comms']);
  });

  it('rejects an orbit the scenario does not allow', () => {
    const result = validateMission(goodMission({ orbit: mars }), earthScenario);
    expect(codes(result)).toContain('ORBIT_NOT_ALLOWED');
  });

  it('includes launch issues from the compatibility check', () => {
    const result = validateMission(goodMission({ orbit: mars }), { ...earthScenario, allowedOrbits: ['mars-orbit'] });
    expect(codes(result)).toContain('ROCKET_CANNOT_REACH_ORBIT');
  });

  it('reports power, budget and time problems with amounts', () => {
    const scenario = { ...earthScenario, budgetMUsd: 100, maxDays: 300 };
    const result = validateMission(goodMission({ parts: [camera, spectrometer, antenna] }), scenario);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'POWER_DEFICIT', missingW: 180 }),
      expect.objectContaining({ code: 'OVER_BUDGET', excessMUsd: 40 }),
      expect.objectContaining({ code: 'OVER_TIME', excessDays: 65 }),
    ]));
  });

  it('reports NO_COMMS only when comms is not already a required type', () => {
    const scenario = { ...earthScenario, requiredTypes: ['instrument'] };
    const result = validateMission(goodMission({ parts: [camera, solarPanel] }), scenario);
    expect(codes(result)).toContain('NO_COMMS');

    const strict = validateMission(goodMission({ parts: [camera, solarPanel] }), earthScenario);
    expect(codes(strict)).not.toContain('NO_COMMS');
  });

  it('warns about data backlog and low science without failing', () => {
    const parts = [camera, camera, camera, solarPanel, antenna];
    const result = validateMission(goodMission({ parts }), { ...earthScenario, minScience: 20 });
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([
      { code: 'DATA_BACKLOG', severity: 'warning', excessGbPerDay: 20 },
      { code: 'LOW_SCIENCE', severity: 'warning', scienceValue: 18, minScience: 20 },
    ]);
  });
});
