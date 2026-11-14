import { describe, it, expect } from 'vitest';
import { simulateMission, resourceMargin } from '../src/engine/simulate.js';
import { scoreMission } from '../src/engine/scoring.js';
import { computeBudget } from '../src/engine/resources.js';
import { goodMission, earthScenario, camera, spectrometer, solarPanel, antenna, mars } from './fixtures.js';

// The good mission has margins: mass 75%, power 40%, budget 50%, data 40%, time 8.75% (35 of 400 days).
const event = (id, protectedBy, scienceLossPct = 20, scenarios = ['all']) => ({ id, protectedBy, scienceLossPct, scenarios });
const powerEvent = event('solar-storm', 'power');
const timeEvent = event('launch-delay', 'time', 50);

describe('resourceMargin', () => {
  it('is the free share of a resource, and 0 when over the limit or not set', () => {
    const budget = computeBudget(goodMission(), earthScenario);
    expect(resourceMargin(budget, 'mass')).toBeCloseTo(0.75);
    expect(resourceMargin(budget, 'time')).toBeCloseTo(0.0875);
    expect(resourceMargin(computeBudget({ parts: [] }, earthScenario), 'mass')).toBe(0);
  });
});

describe('simulateMission', () => {
  it('succeeds through all 4 phases for a valid mission', () => {
    const result = simulateMission(goodMission(), earthScenario, [], 1);
    expect(result.phases.map((phase) => [phase.id, phase.ok])).toEqual([
      ['launch', true], ['transfer', true], ['operations', true], ['data', true],
    ]);
    expect(result).toMatchObject({ outcome: 'success', failedPhase: null, scienceDelivered: 14, events: [] });
  });

  it('gives the same events for the same seed', () => {
    const events = [powerEvent, timeEvent, event('a', 'mass'), event('b', 'data'), event('c', 'budget')];
    const first = simulateMission(goodMission(), earthScenario, events, 123);
    expect(simulateMission(goodMission(), earthScenario, events, 123).events).toEqual(first.events);
    const ids = new Set();
    for (let seed = 0; seed < 50; seed += 1) {
      const result = simulateMission(goodMission(), earthScenario, events, seed);
      expect(result.events.length).toBeGreaterThanOrEqual(1);
      expect(result.events.length).toBeLessThanOrEqual(2);
      result.events.forEach((item) => ids.add(item.id));
    }
    expect(ids.size).toBeGreaterThan(2); // different seeds pick different events
  });

  it('does no harm when the margin is at least 15%', () => {
    const result = simulateMission(goodMission(), earthScenario, [powerEvent], 7);
    expect(result.events).toEqual([{ id: 'solar-storm', protectedBy: 'power', marginPct: 40, harmed: false, scienceLossPct: 0 }]);
    expect(result.scienceDelivered).toBe(14);
  });

  it('takes science away when the margin is below 15%', () => {
    const result = simulateMission(goodMission(), earthScenario, [timeEvent], 7);
    expect(result.events[0]).toMatchObject({ harmed: true, marginPct: 9, scienceLossPct: 50 });
    expect(result.scienceDelivered).toBe(7); // 14 x 50%, still at the goal of 7
    expect(result.outcome).toBe('success');
  });

  it('fails in the data phase when events push science below the goal, and cites the science', () => {
    const result = simulateMission(goodMission(), { ...earthScenario, minScience: 10 }, [timeEvent], 7);
    expect(result).toMatchObject({ outcome: 'failure', failedPhase: 'data' });
    expect(result.failedIssue).toMatchObject({ code: 'LOW_SCIENCE', scienceValue: 7, minScience: 10 });
  });

  it('cites the science that arrived after the surprises when the design was already below the goal', () => {
    // 14 points designed against a goal of 16 fails already in validation; the event then halves it to 7
    const result = simulateMission(goodMission(), { ...earthScenario, minScience: 16 }, [timeEvent], 7);
    expect(result).toMatchObject({ outcome: 'failure', failedPhase: 'data', scienceDelivered: 7 });
    expect(result.failedIssue).toMatchObject({ code: 'LOW_SCIENCE', scienceValue: 7, minScience: 16 });
  });

  it('only uses events of this scenario', () => {
    const marsOnly = event('dust-storm', 'time', 20, ['mars-study']);
    expect(simulateMission(goodMission(), earthScenario, [marsOnly], 1).events).toEqual([]);
  });

  it('stops at the first failed phase and skips the later ones', () => {
    // No rocket: fails at launch, nothing after it happens.
    const result = simulateMission(goodMission({ rocket: null }), earthScenario, [powerEvent], 1);
    expect(result.phases.map((phase) => phase.ok)).toEqual([false, null, null, null]);
    expect(result.failedIssue.code).toBe('NO_ROCKET');
    expect(result.events).toEqual([]); // no events before the science phase
  });

  it('fails in operations without enough power and in data without an antenna', () => {
    expect(simulateMission(goodMission({ parts: [camera, spectrometer, antenna] }), earthScenario).failedPhase).toBe('operations');
    expect(simulateMission(goodMission({ parts: [camera, spectrometer, solarPanel] }), earthScenario).failedPhase).toBe('data');
  });

  it('fails in transfer for an orbit the scenario does not allow', () => {
    const scenario = { ...earthScenario, maxDays: 1000 };
    const result = simulateMission(goodMission({ orbit: mars, rocket: { id: 'big', costMUsd: 50, payloadKg: { TMI: 5000 } } }), scenario);
    expect(result.failedPhase).toBe('transfer');
    expect(result.failedIssue.code).toBe('ORBIT_NOT_ALLOWED');
  });
});

describe('scoreMission with a simulation', () => {
  it('uses the science delivered after events', () => {
    const mission = goodMission();
    const safe = simulateMission(mission, earthScenario, [powerEvent], 1);
    const hurt = simulateMission(mission, earthScenario, [timeEvent], 1);
    expect(scoreMission(mission, earthScenario, safe).breakdown.science).toBe(50);
    expect(scoreMission(mission, earthScenario, hurt).breakdown.science).toBe(25); // 7 of target 14
  });

  it('scores 0 when the simulation failed', () => {
    const scenario = { ...earthScenario, minScience: 10 };
    const failed = simulateMission(goodMission(), scenario, [timeEvent], 1);
    expect(scoreMission(goodMission(), scenario, failed)).toMatchObject({ total: 0, failed: true });
  });
});
