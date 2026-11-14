import { describe, it, expect } from 'vitest';
import { activePhase, failureLook, destinationOf, rocketHeight, orbitRadius } from '../src/view3d/flightPlan.js';
import { simulateMission } from '../src/engine/simulate.js';
import { goodMission, earthScenario, camera, spectrometer, antenna, gto } from './fixtures.js';

const phase = (id, ok, code) => ({ id, ok, issues: code ? [{ code }] : [] });

describe('failureLook', () => {
  it('explodes a rocket that is too weak, keeps it on the pad otherwise', () => {
    expect(failureLook(phase('launch', false, 'PAYLOAD_TOO_HEAVY'))).toBe('explode');
    expect(failureLook(phase('launch', false, 'ROCKET_CANNOT_REACH_ORBIT'))).toBe('explode');
    expect(failureLook(phase('launch', false, 'NO_ROCKET'))).toBe('grounded');
    expect(failureLook(phase('launch', false, 'OVER_BUDGET'))).toBe('grounded');
  });

  it('has a look for each later phase, and none for a phase that worked', () => {
    expect(failureLook(phase('transfer', false, 'ORBIT_NOT_ALLOWED'))).toBe('off-course');
    expect(failureLook(phase('operations', false, 'POWER_DEFICIT'))).toBe('blackout');
    expect(failureLook(phase('data', false, 'LOW_SCIENCE'))).toBe('no-signal');
    expect(failureLook(phase('launch', true))).toBeNull();
  });
});

describe('activePhase follows the HTML timeline', () => {
  it('plays each phase in order for a successful mission and stays on the last one', () => {
    const simulation = simulateMission(goodMission(), earthScenario, [], 1);
    expect([0, 1, 2, 3, 4, 99].map((shown) => activePhase(simulation, shown).id)).toEqual([
      'launch', 'transfer', 'operations', 'data', 'data', 'data',
    ]);
    expect(activePhase(simulation, 4).failure).toBeNull();
  });

  it('shows the failure only after the timeline reveals the failed phase', () => {
    // Too heavy for GTO: fails at launch.
    const heavy = { ...camera, id: 'heavy', massKg: 400 };
    const simulation = simulateMission(goodMission({ parts: [heavy, spectrometer, antenna], orbit: gto }), { ...earthScenario, minScience: 0 }, [], 1);
    expect(activePhase(simulation, 0)).toEqual({ index: 0, id: 'launch', failure: null }); // suspense first
    expect(activePhase(simulation, 1).failure).toBe('explode');
    expect(activePhase(simulation, 99).id).toBe('launch'); // never moves past the failure
  });
});

describe('scene sizes', () => {
  it('maps orbits to destinations', () => {
    expect(destinationOf({ target: 'LEO' })).toBe('earth');
    expect(destinationOf({ target: 'GTO' })).toBe('earth');
    expect(destinationOf({ target: 'TLI' })).toBe('moon');
    expect(destinationOf({ target: 'TMI' })).toBe('mars');
    expect(destinationOf(null)).toBe('earth');
  });

  it('draws bigger rockets taller and higher orbits wider', () => {
    expect(rocketHeight({ payloadKg: { LEO: 63800 } })).toBeGreaterThan(rocketHeight({ payloadKg: { LEO: 300 } }));
    expect(orbitRadius(2, 35786)).toBeGreaterThan(orbitRadius(2, 500));
    expect(orbitRadius(2, 500)).toBeGreaterThan(2);
  });
});
