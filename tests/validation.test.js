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

  it('warns about data backlog without failing', () => {
    const parts = [camera, camera, camera, solarPanel, antenna];
    const result = validateMission(goodMission({ parts }), earthScenario);
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([{ code: 'DATA_BACKLOG', severity: 'warning', excessGbPerDay: 20 }]);
  });

  it('low science is an error, counting only the science that reaches Earth', () => {
    // 3 cameras: 18 science, but only 100 of 120 GB/day reach Earth: 15 delivered.
    const parts = [camera, camera, camera, solarPanel, antenna];
    const result = validateMission(goodMission({ parts }), { ...earthScenario, minScience: 16 });
    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual({ code: 'LOW_SCIENCE', severity: 'error', scienceValue: 15, minScience: 16 });
  });

  it('does not add a science error when there is no antenna (the comms error explains it)', () => {
    const result = validateMission(goodMission({ parts: [camera, solarPanel] }), earthScenario);
    expect(result.issues.map((issue) => issue.code)).not.toContain('LOW_SCIENCE');
  });
});
