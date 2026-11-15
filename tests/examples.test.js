import { describe, it, expect } from 'vitest';
import { examples, examplesFor } from '../src/data/examples.js';
import { gameData, runSimulation } from '../src/state/selectors.js';
import { createInitialState } from '../src/state/store.js';
import { loadExample, togglePart, selectScenario } from '../src/state/actions.js';
import { dictionaries } from '../src/i18n/index.js';

// Example missions promise a result (src/data/examples.js `expect`). These tests run the real engine,
// so a change to the numbers in src/data/ that breaks a promise shows up here.

const ids = (type) => gameData.parts.filter((part) => part.type === type).map((part) => part.id);
const stateFor = (example, reroll = 0) => ({ ...loadExample(createInitialState(), example), reroll });

describe('example missions', () => {
  it('use only parts, orbits, rockets and scenarios that exist, with one power source and one antenna', () => {
    expect(new Set(examples.map((example) => example.id)).size).toBe(examples.length);
    for (const example of examples) {
      const scenario = gameData.scenarios.find((item) => item.id === example.scenarioId);
      expect(scenario, example.id).toBeTruthy();
      expect(scenario.allowedOrbits, example.id).toContain(example.design.orbitId);
      expect(gameData.rockets.map((rocket) => rocket.id), example.id).toContain(example.design.rocketId);
      for (const id of example.design.partIds) expect(gameData.parts.map((part) => part.id), example.id).toContain(id);
      expect(example.design.partIds.filter((id) => ids('power').includes(id)), example.id).toHaveLength(1);
      expect(example.design.partIds.filter((id) => ids('comms').includes(id)), example.id).toHaveLength(1);
    }
  });

  it.each(examples.map((example) => [example.id, example]))('%s gives the result it promises', (id, example) => {
    const simulation = runSimulation(stateFor(example));
    expect(simulation.outcome).toBe(example.expect.outcome);
    if (example.expect.failedPhase) {
      expect(simulation.phases.find((phase) => phase.ok === false)?.id).toBe(example.expect.failedPhase);
      expect(simulation.failedIssue?.code).toBe(example.expect.code);
    }
    const runs = Array.from({ length: 20 }, (_, reroll) => runSimulation(stateFor(example, reroll)));
    if (example.expect.alwaysSafe) {
      expect(runs.every((run) => run.outcome === 'success' && run.events.every((event) => !event.harmed))).toBe(true);
    }
    if (example.expect.laterSuccess) {
      // Risk: a random event hurts it on the first launch, and new conditions can still make it work
      expect(simulation.events.some((event) => event.harmed)).toBe(true);
      expect(simulation.issues.some((issue) => issue.severity === 'error')).toBe(false);
      expect(runs.some((run) => run.outcome === 'success')).toBe(true);
    }
    if (example.expect.code) expect(runs.every((run) => run.outcome === 'failure')).toBe(true);
  });

  it('opens on the launch step in free mode, and changing a part makes it the player own mission', () => {
    const state = loadExample({ ...createInitialState(), mode: 'campaign' }, examples[0]);
    expect(state).toMatchObject({ screen: 'launch', mode: 'free', exampleId: examples[0].id, confirmedSteps: [1, 2, 3] });
    expect(togglePart(state, 'magnetometer').exampleId).toBeNull();
    expect(selectScenario(state, 'mars-study').exampleId).toBeNull();
  });

  it('give every destination four examples: one good, one risky and two bad', () => {
    for (const scenario of gameData.scenarios) {
      const kinds = examplesFor(scenario.id).map((example) => example.kind);
      expect(kinds, scenario.id).toHaveLength(4);
      expect(kinds, scenario.id).toEqual(expect.arrayContaining(['balanced', 'tight', 'power']));
    }
  });

  it('change only what their texts say: "power" only the panel, "reach" only the rocket', () => {
    const others = (partIds) => partIds.filter((id) => !ids('power').includes(id)).sort();
    for (const scenario of gameData.scenarios) {
      const byKind = Object.fromEntries(examplesFor(scenario.id).map((example) => [example.kind, example.design]));
      expect(others(byKind.power.partIds), scenario.id).toEqual(others(byKind.balanced.partIds));
      if (byKind.reach) expect({ ...byKind.reach, rocketId: byKind.balanced.rocketId }, scenario.id).toEqual(byKind.balanced);
    }
  });

  it('have every text in English', () => {
    for (const example of examples) {
      for (const field of ['name', 'watch', 'verdict', 'shows', 'read', 'next']) {
        expect(dictionaries.en[`example.${example.kind}.${field}`], `${example.kind}.${field}`).toBeTruthy();
      }
    }
  });
});
