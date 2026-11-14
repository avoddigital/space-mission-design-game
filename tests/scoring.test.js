import { describe, it, expect } from 'vitest';
import { scoreMission, effectiveScience } from '../src/engine/scoring.js';
import { computeBudget } from '../src/engine/resources.js';
import { goodMission, earthScenario, camera, spectrometer, solarPanel, antenna } from './fixtures.js';

describe('scoreMission', () => {
  it('gives full points to a strong mission with big margins', () => {
    // Science 14 = 2x minimum, 50% budget left, 75% mass margin.
    const result = scoreMission(goodMission(), earthScenario);
    expect(result.failed).toBe(false);
    expect(result.breakdown).toEqual({ science: 50, efficiency: 30, objective: 20 });
    expect(result.total).toBe(100);
  });

  it('scores 0 and fails when there is any error', () => {
    const result = scoreMission(goodMission({ rocket: null }), earthScenario);
    expect(result.failed).toBe(true);
    expect(result.total).toBe(0);
    expect(result.issues.map((issue) => issue.code)).toContain('NO_ROCKET');
  });

  it('gives partial science points between the goal and twice the goal', () => {
    // Science 6 with goal 5: target 10, so 50 * 0.6 = 30.
    const parts = [camera, solarPanel, antenna];
    const result = scoreMission(goodMission({ parts }), { ...earthScenario, minScience: 5 });
    expect(result.breakdown.science).toBe(30);
    expect(result.breakdown.objective).toBe(20);
  });

  it('scores 0 below the science goal, because that mission always fails', () => {
    const parts = [camera, solarPanel, antenna];
    const result = scoreMission(goodMission({ parts }), { ...earthScenario, minScience: 10 });
    expect(result).toMatchObject({ total: 0, failed: true });
    expect(result.issues.map((issue) => issue.code)).toContain('LOW_SCIENCE');
  });

  it('gives fewer efficiency points with a tight budget', () => {
    // 150 used of 160: 6.25% left, so budget half = 15 * (0.0625 / 0.2) = 4.69; mass half full = 15.
    const result = scoreMission(goodMission(), { ...earthScenario, budgetMUsd: 160 });
    expect(result.breakdown.efficiency).toBe(20);
  });

  it('counts only the science that reaches Earth', () => {
    // 3 cameras: 120 GB/day produced, 100 sent: 18 * 100/120 = 15 delivered (goal 7, target 14).
    const parts = [camera, camera, camera, solarPanel, antenna];
    const result = scoreMission(goodMission({ parts }), { ...earthScenario, minScience: 7 });
    expect(result.failed).toBe(false);
    expect(result.breakdown.science).toBe(50);
    // With a goal of 16, the 15 delivered points are not enough: the mission fails.
    expect(scoreMission(goodMission({ parts }), { ...earthScenario, minScience: 16 }).failed).toBe(true);
  });
});

describe('effectiveScience', () => {
  it('is the full science value when all data is sent', () => {
    expect(effectiveScience(computeBudget(goodMission(), earthScenario))).toBe(14);
  });

  it('is 0 without comms', () => {
    const budget = computeBudget(goodMission({ parts: [camera, spectrometer, solarPanel] }), earthScenario);
    expect(effectiveScience(budget)).toBe(0);
  });
});
