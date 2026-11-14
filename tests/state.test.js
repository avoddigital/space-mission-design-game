import { describe, it, expect, vi } from 'vitest';
import { createStore, createInitialState } from '../src/state/store.js';
import {
  selectScenario, startMission, confirmStep, goToStep, goToMenu, togglePart, setPower, setComms,
  setOrbit, setRocket, launch, redesign, togglePause, answerQuiz, newConditions, showReport,
} from '../src/state/actions.js';
import { selectEvaluation, selectMission, gameData, runSimulation, selectScore } from '../src/state/selectors.js';
import { loadBest, saveBest, BEST_KEY } from '../src/state/persistence.js';
import { camera, spectrometer, solarPanel, antenna, mediumRocket, leo, earthScenario } from './fixtures.js';

const bigPanel = { ...solarPanel, id: 'solar-big', powerGenW: 600 };
const parts = [camera, spectrometer, solarPanel, bigPanel, antenna];
const testData = { parts, rockets: [mediumRocket], orbits: [leo], scenarios: [{ ...earthScenario, id: 'earth-observation' }] };

describe('store', () => {
  it('notifies listeners only when the state changes, and can stop listening', () => {
    const store = createStore();
    const listener = vi.fn();
    const stop = store.subscribe(listener);

    store.update(startMission);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getState().screen).toBe('objective');

    store.update(goToStep, 1); // already on step 1: nothing changes
    expect(listener).toHaveBeenCalledTimes(1);

    stop();
    store.update(goToMenu);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('never changes the old state object', () => {
    const before = createInitialState();
    const after = togglePart(before, 'camera');
    expect(before.design.partIds).toEqual([]);
    expect(after.design.partIds).toEqual(['camera']);
  });
});

describe('navigation actions', () => {
  it('selectScenario clears the previous design and results', () => {
    let state = togglePart(createInitialState(), 'camera');
    state = { ...launch(setRocket(state, 'medium')), report: { quizAnswered: true } };
    const next = selectScenario(state, 'mars-study');
    expect(next.scenarioId).toBe('mars-study');
    expect(next.design).toEqual({ partIds: [], orbitId: null, rocketId: null });
    expect(next).toMatchObject({ runCount: 0, simulation: null, report: null, confirmedSteps: [] });
  });

  it('confirmStep marks the step once and moves to the next design step', () => {
    let state = startMission(createInitialState());
    state = confirmStep(state, 1);
    expect(state.screen).toBe('spacecraft');
    state = confirmStep(confirmStep(state, 2), 2);
    expect(state.screen).toBe('launch');
    expect(state.confirmedSteps).toEqual([1, 2]);
    expect(confirmStep(state, 3).screen).toBe('launch'); // launching is its own action
  });
});

describe('design actions', () => {
  it('togglePart twice removes the part', () => {
    const state = togglePart(togglePart(createInitialState(), 'camera'), 'camera');
    expect(state.design.partIds).toEqual([]);
  });

  it('setPower and setComms keep only one part of their type', () => {
    let state = togglePart(createInitialState(), 'camera');
    state = setPower(state, 'solar', parts);
    state = setComms(state, 'antenna', parts);
    state = setPower(state, 'solar-big', parts);
    expect(state.design.partIds).toEqual(['camera', 'antenna', 'solar-big']);
  });

  it('setOrbit and setRocket store the choice', () => {
    const state = setRocket(setOrbit(createInitialState(), 'leo-500'), 'medium');
    expect(state.design).toMatchObject({ orbitId: 'leo-500', rocketId: 'medium' });
  });
});

describe('mission actions', () => {
  it('launch goes to the simulation and counts the attempt', () => {
    const state = launch(launch(createInitialState()));
    expect(state).toMatchObject({ screen: 'simulation', runCount: 2 });
  });

  it('redesign goes to the step that fixes the first error and keeps the design', () => {
    let state = setRocket(togglePart(createInitialState(), 'camera'), 'medium');
    state = launch(state);
    const back = redesign(state, [{ code: 'PAYLOAD_TOO_HEAVY', severity: 'error' }]);
    expect(back.screen).toBe('launch');
    expect(back.design).toEqual(state.design);
    expect(redesign(state, [{ code: 'POWER_DEFICIT', severity: 'error' }]).screen).toBe('spacecraft');
  });

  it('togglePause switches pause on and off', () => {
    const state = togglePause(createInitialState());
    expect(state.paused).toBe(true);
    expect(togglePause(state).paused).toBe(false);
  });

  it('the quiz can be answered only once', () => {
    let state = answerQuiz(createInitialState(), 2, 0);
    expect(state.report).toMatchObject({ quizAnswered: true, quizChoice: 2, quizRight: false });
    state = answerQuiz(state, 0, 0);
    expect(state.report.quizRight).toBe(false);
  });
});

describe('selectors', () => {
  it('evaluate the current design with the engine', () => {
    let state = createInitialState();
    for (const id of ['camera', 'spectrometer']) state = togglePart(state, id);
    state = setComms(setPower(state, 'solar', parts), 'antenna', parts);
    state = setRocket(setOrbit(state, 'leo-500'), 'medium');

    expect(selectMission(state, testData).rocket).toBe(mediumRocket);
    const evaluation = selectEvaluation(state, testData);
    expect(evaluation.ok).toBe(true);
    expect(evaluation.budget.mass.status).toBe('ok');
  });

  it('work with the real game data', () => {
    const evaluation = selectEvaluation(createInitialState(), gameData);
    expect(evaluation.ok).toBe(false);
    expect(evaluation.issues.map((issue) => issue.code)).toContain('NO_ROCKET');
  });
});

describe('best score persistence', () => {
  const memoryStorage = () => {
    const items = new Map();
    return { getItem: (key) => items.get(key) ?? null, setItem: (key, value) => items.set(key, value) };
  };

  it('saves only scores that beat the best one', () => {
    const storage = memoryStorage();
    expect(saveBest('earth-observation', 70, storage)).toEqual({ isNewBest: true, best: 70 });
    expect(saveBest('earth-observation', 60, storage)).toEqual({ isNewBest: false, best: 70 });
    expect(saveBest('earth-observation', 85, storage)).toEqual({ isNewBest: true, best: 85 });
    expect(loadBest(storage)).toEqual({ byScenario: { 'earth-observation': 85 } });
    expect(JSON.parse(storage.getItem(BEST_KEY)).byScenario['earth-observation']).toBe(85);
  });

  it('keeps working when storage is blocked, missing or broken', () => {
    const blocked = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    expect(loadBest(blocked)).toEqual({ byScenario: {} });
    expect(saveBest('mars-study', 50, blocked)).toEqual({ isNewBest: true, best: 50 });
    expect(loadBest(null)).toEqual({ byScenario: {} });
    expect(loadBest({ getItem: () => '{not json' })).toEqual({ byScenario: {} });
  });
});

describe('simulation and report flow', () => {
  const ready = () => {
    let state = createInitialState();
    for (const id of ['camera', 'spectrometer']) state = togglePart(state, id);
    state = setComms(setPower(state, 'solar', parts), 'antenna', parts);
    return setRocket(setOrbit(state, 'leo-500'), 'medium');
  };
  const dataWithEvents = { ...testData, events: [
    { id: 'storm', protectedBy: 'power', scienceLossPct: 20, scenarios: ['all'] },
    { id: 'delay', protectedBy: 'time', scienceLossPct: 20, scenarios: ['all'] },
    { id: 'outage', protectedBy: 'data', scienceLossPct: 20, scenarios: ['all'] },
  ] };

  it('launch stores the simulation; the same design and reroll give the same events', () => {
    const state = ready();
    const simulation = runSimulation(state, dataWithEvents);
    const launched = launch(state, simulation);
    expect(launched).toMatchObject({ screen: 'simulation', runCount: 1, simulation });
    expect(runSimulation(launched, dataWithEvents).events).toEqual(simulation.events);
  });

  it('newConditions changes the seed', () => {
    const state = ready();
    const seeds = new Set([runSimulation(state, dataWithEvents).seed, runSimulation(newConditions(state), dataWithEvents).seed]);
    expect(seeds.size).toBe(2);
  });

  it('showReport goes to step 5 with the score, and the quiz starts unanswered', () => {
    let state = ready();
    state = launch(state, runSimulation(state, testData));
    const score = selectScore(state, testData);
    expect(score).toMatchObject({ total: 100, failed: false });
    state = showReport(state, { score, isNewBest: true, best: 100 });
    expect(state.screen).toBe('report');
    expect(state.report).toMatchObject({ isNewBest: true, quizAnswered: false });
    expect(state.confirmedSteps).toEqual(expect.arrayContaining([3, 4]));
  });

  it('works with the real game data from start to report', () => {
    let state = createInitialState();
    for (const id of ['multispectral-imager', 'imaging-spectrometer']) state = togglePart(state, id);
    state = setComms(setPower(state, 'solar-panel-m', gameData.parts), 'hga-antenna', gameData.parts);
    state = setRocket(setOrbit(state, 'sso-700'), 'small-lifter');
    const simulation = runSimulation(state, gameData);
    expect(simulation.outcome).toBe('success');
    expect(selectScore(launch(state, simulation), gameData).total).toBeGreaterThan(0);
  });
});
