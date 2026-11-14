import { describe, it, expect } from 'vitest';
import { sumResources, computeBudget, launchCapacityKg, statusForRatio, SPACECRAFT_BUS } from '../src/engine/resources.js';
import { goodMission, earthScenario, antenna, camera, solarPanel, mediumRocket, leo, mars, spectrometer } from './fixtures.js';

describe('sumResources', () => {
  it('returns zeros for an empty list', () => {
    const totals = sumResources([]);
    expect(Object.values(totals).every((value) => value === 0)).toBe(true);
    expect(totals.massKg).toBe(0);
  });

  it('adds every resource and treats missing fields as 0', () => {
    const parts = [
      { massKg: 10, powerW: 20, costMUsd: 5, dataGbPerDay: 1 },
      { massKg: 2.5, powerW: 5, powerGenW: 100 },
    ];
    expect(sumResources(parts)).toMatchObject({
      massKg: 12.5, powerW: 25, powerGenW: 100, costMUsd: 5, dataGbPerDay: 1, downlinkGbPerDay: 0, scienceValue: 0,
    });
  });
});

describe('launchCapacityKg', () => {
  it('reads the payload for the orbit target', () => {
    expect(launchCapacityKg(mediumRocket, leo)).toBe(1000);
  });

  it('is 0 when the rocket cannot reach that target', () => {
    expect(launchCapacityKg(mediumRocket, mars)).toBe(0);
  });

  it('is null until both rocket and orbit are chosen', () => {
    expect(launchCapacityKg(null, leo)).toBeNull();
    expect(launchCapacityKg(mediumRocket, null)).toBeNull();
  });
});

describe('computeBudget', () => {
  it('computes all six resources for a valid mission', () => {
    const budget = computeBudget(goodMission(), earthScenario);

    expect(budget.mass).toMatchObject({ usedKg: 250, limitKg: 1000, marginKg: 750, ok: true });
    expect(budget.power).toMatchObject({ consumedW: 180, generatedW: 300, marginW: 120, ok: true });
    expect(budget.budget).toMatchObject({ usedMUsd: 150, limitMUsd: 300, marginMUsd: 150, ok: true });
    expect(budget.data).toMatchObject({ producedGbPerDay: 60, downlinkGbPerDay: 100, marginGbPerDay: 40, ok: true });
    expect(budget.comms).toMatchObject({ commsParts: 1, ok: true });
    expect(budget.time).toMatchObject({ totalDays: 365, limitDays: 400, marginDays: 35, ok: true });
    expect(budget.scienceValue).toBe(14);
  });

  it('always includes the spacecraft bus', () => {
    const budget = computeBudget({ parts: [] }, earthScenario);
    expect(budget.mass.usedKg).toBe(SPACECRAFT_BUS.massKg);
    expect(budget.power.consumedW).toBe(SPACECRAFT_BUS.powerW);
    expect(budget.budget.usedMUsd).toBe(SPACECRAFT_BUS.costMUsd);
  });

  it('mass is not ok until a rocket and orbit are chosen', () => {
    const budget = computeBudget(goodMission({ rocket: null }), earthScenario);
    expect(budget.mass.limitKg).toBeNull();
    expect(budget.mass.ok).toBe(false);
  });

  it('mass exactly at capacity is ok', () => {
    const heavy = { id: 'ballast', massKg: 750 };
    const budget = computeBudget(goodMission({ parts: [...goodMission().parts, heavy] }), earthScenario);
    expect(budget.mass.marginKg).toBe(0);
    expect(budget.mass.ok).toBe(true);
  });

  it('flags a power deficit without a power part', () => {
    const budget = computeBudget(goodMission({ parts: [camera, antenna] }), earthScenario);
    expect(budget.power.ok).toBe(false);
    expect(budget.power.marginW).toBe(-130);
  });

  it('flags a budget overrun by 1', () => {
    const budget = computeBudget(goodMission(), { ...earthScenario, budgetMUsd: 149 });
    expect(budget.budget.marginMUsd).toBe(-1);
    expect(budget.budget.ok).toBe(false);
  });

  it('flags data that the antennas cannot send', () => {
    const budget = computeBudget(goodMission({ parts: [camera, camera, camera, solarPanel, antenna] }), earthScenario);
    expect(budget.data.marginGbPerDay).toBe(-20);
    expect(budget.data.ok).toBe(false);
  });

  it('adds transfer days to the time budget', () => {
    const budget = computeBudget(goodMission({ orbit: mars }), earthScenario);
    expect(budget.time.totalDays).toBe(575);
    expect(budget.time.ok).toBe(false);
  });
});

describe('statusForRatio', () => {
  it('is ok up to 95%, tight up to 100% and over above 100%', () => {
    expect(statusForRatio(0.5)).toBe('ok');
    expect(statusForRatio(0.95)).toBe('ok');
    expect(statusForRatio(0.96)).toBe('tight');
    expect(statusForRatio(1)).toBe('tight');
    expect(statusForRatio(1.01)).toBe('over');
  });
});

describe('computeBudget meter status', () => {
  it('gives ratio and status to every limited resource', () => {
    const budget = computeBudget(goodMission(), earthScenario);
    expect(budget.mass).toMatchObject({ ratio: 0.25, status: 'ok' });
    expect(budget.power).toMatchObject({ ratio: 0.6, status: 'ok' });
    expect(budget.budget).toMatchObject({ ratio: 0.5, status: 'ok' });
    expect(budget.data).toMatchObject({ ratio: 0.6, status: 'ok' });
    expect(budget.comms).toMatchObject({ status: 'ok' });
    expect(budget.time.status).toBe('ok');
  });

  it('marks a budget at 96% as tight and at 101% as over', () => {
    // The good mission costs 150.
    expect(computeBudget(goodMission(), { ...earthScenario, budgetMUsd: 156 }).budget.status).toBe('tight');
    expect(computeBudget(goodMission(), { ...earthScenario, budgetMUsd: 148.5 }).budget.status).toBe('over');
  });

  it('is pending while a choice is missing', () => {
    const budget = computeBudget({ parts: [camera] }, earthScenario);
    expect(budget.mass.status).toBe('pending');
    expect(budget.power.status).toBe('pending');
    expect(budget.data.status).toBe('pending');
    expect(budget.comms.status).toBe('pending');
    expect(budget.time.status).toBe('pending');
    expect(budget.budget.status).toBe('ok');
  });

  it('is over when the rocket cannot reach the orbit', () => {
    const budget = computeBudget(goodMission({ orbit: mars }), earthScenario);
    expect(budget.mass).toMatchObject({ limitKg: 0, ratio: null, status: 'over' });
  });

  it('is over when power parts produce less than needed', () => {
    const weak = { ...solarPanel, powerGenW: 100 };
    const budget = computeBudget(goodMission({ parts: [camera, spectrometer, weak, antenna] }), earthScenario);
    expect(budget.power.status).toBe('over');
  });

  it('compares science with the scenario goal', () => {
    expect(computeBudget(goodMission(), earthScenario).science).toMatchObject({ value: 14, goal: 7, ratio: 2, status: 'ok' });
    expect(computeBudget({ parts: [camera] }, earthScenario).science).toMatchObject({ value: 6, status: 'low' });
  });
});
