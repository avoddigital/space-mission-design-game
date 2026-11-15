// Why a mission failed: one cause per real engine result, and events never blamed for an earlier failure.
import { describe, it, expect } from 'vitest';
import { diagnoseFailure } from '../src/engine/diagnosis.js';
import { simulateMission } from '../src/engine/simulate.js';
import { gameData } from '../src/state/selectors.js';
import { resolveDesign } from '../src/engine/resolve.js';

const earth = gameData.scenarios.find((item) => item.id === 'earth-observation');
const fly = (design, scenario = earth, events = gameData.events, seed = 1) =>
  simulateMission(resolveDesign({ orbitId: null, rocketId: null, ...design }, gameData), scenario, events, seed);
const base = { partIds: ['multispectral-imager', 'thermal-imager', 'solar-panel-m', 'hga-antenna'], orbitId: 'sso-700', rocketId: 'small-lifter' };

describe('diagnoseFailure', () => {
  it('returns null for a successful mission', () => {
    const simulation = fly(base, earth, []);
    expect(simulation.outcome).toBe('success');
    expect(diagnoseFailure(simulation, earth)).toBeNull();
  });

  it('names launch, budget, orbit, power and data failures from the engine issue', () => {
    expect(diagnoseFailure(fly({ ...base, partIds: [...base.partIds, 'hd-camera', 'radar-sounder'] }), earth).cause).toBe('launch');
    expect(diagnoseFailure(fly({ ...base, rocketId: 'heavy-lifter' }), earth).cause).toBe('budget');
    expect(diagnoseFailure(fly({ ...base, orbitId: null }), earth).cause).toBe('orbit');
    expect(diagnoseFailure(fly({ ...base, partIds: ['multispectral-imager', 'thermal-imager', 'solar-panel-s', 'hga-antenna'] }), earth).cause).toBe('power');
    expect(diagnoseFailure(fly({ ...base, partIds: ['multispectral-imager', 'thermal-imager', 'solar-panel-m'] }), earth).cause).toBe('data');
  });

  it('tells a slow antenna (data) apart from weak instruments (science)', () => {
    // Enough instruments, but a small antenna: the science stays on board
    const slow = diagnoseFailure(fly({ ...base, partIds: ['multispectral-imager', 'thermal-imager', 'solar-panel-m', 'mga-antenna'] }, earth, []), earth);
    expect(slow.issue.code).toBe('LOW_SCIENCE');
    expect(slow.cause).toBe('data');
    expect(slow.designScience).toBeGreaterThanOrEqual(slow.goal);
    // One small instrument: even with every bit of data home, the goal is out of reach
    const weak = diagnoseFailure(fly({ ...base, partIds: ['thermal-imager', 'solar-panel-m', 'hga-antenna'] }, earth, []), earth);
    expect(weak.cause).toBe('science');
  });

  it('blames events only when the design had reached the goal before them', () => {
    const storm = { id: 'test-storm', scenarios: ['all'], protectedBy: 'mass', scienceLossPct: 90 };
    // The demo design reaches the goal, but its mass margin is below 15%: the event hurts it
    const hit = fly(base, earth, [storm]);
    const diagnosis = diagnoseFailure(hit, earth);
    expect(hit.events[0].harmed).toBe(true);
    expect(diagnosis.cause).toBe('events');
    expect(diagnosis.beforeEvents).toBeGreaterThanOrEqual(diagnosis.goal);
    // A design that was already short is a science failure, even if an event also hurt
    const short = fly({ ...base, partIds: ['thermal-imager', 'solar-panel-s', 'hga-antenna'] }, earth, [storm]);
    expect(diagnoseFailure(short, earth).cause).toBe('science');
  });

  it('never reports events for a failure that happened before the science phase', () => {
    const simulation = fly({ ...base, partIds: [...base.partIds, 'hd-camera', 'radar-sounder'] });
    expect(simulation.events).toEqual([]);
    expect(diagnoseFailure(simulation, earth).harmed).toEqual([]);
  });
});
