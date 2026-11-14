// Checks Carlos's data tables (src/data/) against the format in Carlos.md
// and against the rules engine. Skipped until all four tables exist.

import { describe, it, expect } from 'vitest';
import { validateMission } from '../src/engine/validation.js';
import { findWinningMission } from './helpers/findWinningMission.js';

const modules = import.meta.glob('../src/data/*.js', { eager: true });
const table = (file, name) => modules[`../src/data/${file}`]?.[name];

const parts = table('parts.js', 'parts');
const rockets = table('rockets.js', 'rockets');
const orbits = table('orbits.js', 'orbits');
const scenarios = table('scenarios.js', 'scenarios');
const hasData = [parts, rockets, orbits, scenarios].every(Array.isArray);

const PART_TYPES = ['instrument', 'power', 'comms'];
const TARGETS = ['LEO', 'GTO', 'TLI', 'TMI'];
const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const isNonNegative = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0;

function expectNumbers(item, fields) {
  for (const field of fields) {
    expect(isNonNegative(item[field]), `${item.id}.${field} must be a number >= 0`).toBe(true);
  }
}

function expectBasics(list, label) {
  expect(list.length, `${label} must not be empty`).toBeGreaterThan(0);
  const ids = list.map((item) => item.id);
  expect(new Set(ids).size, `${label} ids must be unique`).toBe(ids.length);
  for (const item of list) {
    expect(item.id, `${label} id "${item.id}" must be lowercase with dashes`).toMatch(ID_PATTERN);
    expect(typeof item.name, `${item.id}.name must be text`).toBe('string');
  }
}

describe.skipIf(!hasData)('data tables: format (Carlos.md)', () => {
  it('parts', () => {
    expectBasics(parts, 'parts');
    for (const part of parts) {
      expect(PART_TYPES, `${part.id}.type`).toContain(part.type);
      expectNumbers(part, ['massKg', 'powerW', 'costMUsd', 'dataGbPerDay', 'scienceValue']);
      expect(part.scienceValue, `${part.id}.scienceValue must be 0 to 10`).toBeLessThanOrEqual(10);
      if (part.type === 'power') expectNumbers(part, ['powerGenW']);
      if (part.type === 'comms') expectNumbers(part, ['downlinkGbPerDay']);
    }
    for (const type of PART_TYPES) {
      expect(parts.some((part) => part.type === type), `at least one "${type}" part`).toBe(true);
    }
  });

  it('rockets', () => {
    expectBasics(rockets, 'rockets');
    for (const rocket of rockets) {
      expectNumbers(rocket, ['costMUsd']);
      expect(typeof rocket.payloadKg, `${rocket.id}.payloadKg`).toBe('object');
      for (const target of TARGETS) {
        expect(isNonNegative(rocket.payloadKg[target]), `${rocket.id}.payloadKg.${target}`).toBe(true);
      }
    }
  });

  it('orbits', () => {
    expectBasics(orbits, 'orbits');
    for (const orbit of orbits) {
      expect(TARGETS, `${orbit.id}.target`).toContain(orbit.target);
      expectNumbers(orbit, ['altitudeKm', 'transferDays']);
    }
  });

  it('scenarios', () => {
    expectBasics(scenarios, 'scenarios');
    expect(scenarios.length, 'at least 3 scenarios').toBeGreaterThanOrEqual(3);
    const orbitIds = orbits.map((orbit) => orbit.id);
    for (const scenario of scenarios) {
      expectNumbers(scenario, ['budgetMUsd', 'maxDays', 'operationDays', 'minScience']);
      expect(scenario.allowedOrbits.length, `${scenario.id}.allowedOrbits`).toBeGreaterThan(0);
      for (const orbitId of scenario.allowedOrbits) {
        expect(orbitIds, `${scenario.id} uses unknown orbit "${orbitId}"`).toContain(orbitId);
      }
      for (const type of scenario.requiredTypes) {
        expect(PART_TYPES, `${scenario.id}.requiredTypes`).toContain(type);
      }
    }
  });
});

describe.skipIf(!hasData)('data tables: balance with the rules engine', () => {
  const data = { parts, rockets, orbits };

  // Every scenario must be winnable: no errors and the minimum science is met.
  it.each(scenarios ?? [])('scenario "$id" can be won', (scenario) => {
    const result = findWinningMission(scenario, data);
    expect(result, `no winning design found for ${scenario.id}`).not.toBeNull();
  });

  // The rocket choice must matter: at least one rocket fails the winning design.
  it.each(scenarios ?? [])('scenario "$id": not every rocket works', (scenario) => {
    const { mission } = findWinningMission(scenario, data) ?? {};
    if (!mission) return; // already reported by the test above
    const working = rockets.filter((rocket) => validateMission({ ...mission, rocket }, scenario).ok);
    expect(working.length, `every rocket works for ${scenario.id}`).toBeLessThan(rockets.length);
  });

  // The instrument choice must matter: taking every instrument must not be a valid mission.
  it.each(scenarios ?? [])('scenario "$id": cannot take every instrument', (scenario) => {
    const { mission } = findWinningMission(scenario, data) ?? {};
    if (!mission) return;
    const instruments = parts.filter((part) => part.type === 'instrument');
    const nonInstruments = mission.parts.filter((part) => part.type !== 'instrument');
    const everything = { ...mission, parts: [...nonInstruments, ...instruments] };
    expect(validateMission(everything, scenario).ok, `all instruments fit in ${scenario.id}`).toBe(false);
  });
});
