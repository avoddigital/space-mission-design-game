// Commander Capi's guided lessons: the cycle problem -> prediction -> change -> explanation, with the
// real game values, right answers computed from the data, and texts short enough for the panel.
import { describe, it, expect, afterEach } from 'vitest';
import { LESSONS, lessonsFor, nextLesson, firstStage, stageAfterChange, lessonCard } from '../src/ui/capi/coach.js';
import { createInitialState } from '../src/state/store.js';
import { togglePart, setPower, setComms, setOrbit, setRocket } from '../src/state/actions.js';
import { gameData, selectScenario, selectMission, selectEvaluation } from '../src/state/selectors.js';
import { setLocale, dictionaries, LOCALES } from '../src/i18n/index.js';

const parts = gameData.parts;
const start = (scenarioId) => ({ ...createInitialState(), scenarioId });
const ctxFor = (state, screen) => ({
  screen, state, scenario: selectScenario(state), data: gameData, content: gameData.content,
  evaluation: selectEvaluation(state), mission: selectMission(state),
});

/** Run one lesson: start it, apply a change (if any), answer (if asked), and return the cards seen. */
function play(state, screen, done, { change, apply, answer } = {}) {
  const lesson = nextLesson(ctxFor(state, screen), done);
  let active = { lessonId: lesson.id, stage: firstStage(lesson, ctxFor(state, screen)), change: null };
  const cards = [lessonCard(active, ctxFor(state, screen))];
  if (apply) {
    state = apply(state);
    const next = stageAfterChange(lesson, active.stage, change, ctxFor(state, screen));
    if (next) active = { ...active, stage: next, change };
    cards.push(lessonCard(active, ctxFor(state, screen)));
  }
  if (active.stage === 'ask') {
    const card = lessonCard(active, ctxFor(state, screen));
    const pick = answer ?? card.options.find((option) => option.correct).id;
    active = { ...active, stage: 'explain', answer: pick };
    cards.push(lessonCard(active, ctxFor(state, screen)));
  }
  done.add(lesson.id);
  return { state, lesson, cards, last: cards.at(-1) };
}

afterEach(() => setLocale('en'));

describe('Earth: instrument, power and data', () => {
  it('runs the full cycle with the real values', () => {
    const done = new Set();
    let state = start('earth-observation');

    // 1. Instrument: problem, the player adds one, Capi asks what else must keep up, then explains
    let step = play(state, 'spacecraft', done, {
      change: { action: 'toggle-part', value: 'multispectral-imager' },
      apply: (s) => togglePart(s, 'multispectral-imager'),
      answer: '0', // "Only the budget": not quite
    });
    state = step.state;
    expect(step.lesson.id).toBe('earth-instrument');
    expect(step.cards.map((card) => card.kind)).toEqual(['problem', 'ask', 'explain']);
    expect(step.cards[1].text).toMatch(/powerful instrument: Multispectral Imager\. What else has to keep up/);
    expect(step.last.feedback).toBe('Not quite.');
    // Real numbers from the parts table and the engine (bus 30 W + imager 100 W, no power source yet)
    expect(step.last.text).toContain('adds 90 kg and 35 M USD, uses 100 W and makes 60 GB of data per day');
    expect(step.last.text).toContain('130 W used, 0 W made');

    // 2. Power: choosing the source is the prediction; the explanation compares made and used watts
    step = play(state, 'spacecraft', done, { change: { action: 'set-power', value: 'solar-panel-s' }, apply: (s) => setPower(s, 'solar-panel-s', parts) });
    state = step.state;
    expect(step.cards[0].text).toContain('We use 130 W');
    expect(step.last.text).toMatch(/makes 150 W and we use 130 W: only 13% spare, below 15%/);

    // 3. Data: the antenna, and its own power cost
    step = play(state, 'spacecraft', done, { change: { action: 'set-comms', value: 'mga-antenna' }, apply: (s) => setComms(s, 'mga-antenna', parts) });
    expect(step.cards[0].text).toContain('We make 60 GB of data per day');
    expect(step.last.text).toMatch(/sends 20 GB per day, but we make 60: 40 GB per day stay on board/);
    expect(step.last.text).toMatch(/also uses 25 W: power is now 155 of 150 W/);
    expect(nextLesson(ctxFor(step.state, 'spacecraft'), done)).toBeNull(); // Earth guide complete
  });

  it('explains right away when the choice was already made before the lesson started', () => {
    const state = setPower(togglePart(start('earth-observation'), 'thermal-imager'), 'solar-panel-m', parts);
    const lesson = LESSONS.find((item) => item.id === 'earth-power');
    expect(firstStage(lesson, ctxFor(state, 'spacecraft'))).toBe('explain');
  });

  it('keeps the order: no power lesson before an instrument is chosen', () => {
    const state = start('earth-observation');
    expect(nextLesson(ctxFor(state, 'spacecraft'), new Set(['earth-instrument'])) ).toBeNull();
  });
});

describe('Moon: mass, rocket capacity and budget', () => {
  it('asks for predictions whose right answers come from the real tables', () => {
    const done = new Set(['moon-mass']);
    let state = setOrbit(setComms(setPower(togglePart(start('moon-exploration'), 'laser-altimeter'), 'solar-panel-m', parts), 'mga-antenna', parts), 'moon-orbit');
    const rocket = play(state, 'launch', done);
    // The cheapest rocket cannot reach the Moon in the table: "No" is right
    const ask = rocket.cards[0];
    expect(ask.kind).toBe('ask');
    expect(ask.options.find((option) => option.correct).label).toBe('No');
    expect(rocket.last.text).toMatch(/Small Lifter carries 300 kg to low orbit, but it cannot reach the Moon at all/);

    state = setRocket(state, 'medium-lifter');
    const budget = play(state, 'launch', done);
    const share = 70 / 220; // Medium Lifter cost / Moon budget
    expect(budget.cards[0].options.find((option) => option.correct).label).toBe(share < 0.25 ? 'Less than a quarter' : share <= 0.5 ? 'A quarter to a half' : 'More than half');
    expect(budget.last.text).toMatch(/Medium Lifter costs 70 M USD, 32% of the budget/);
  });
});

describe('Mars: everything together, time and margins', () => {
  it('asks which gauge has the least room, judged on the real margins', () => {
    const state = setComms(setPower(togglePart(togglePart(start('mars-study'), 'hd-camera'), 'imaging-spectrometer'), 'solar-panel-m', parts), 'hga-antenna', parts);
    const step = play(state, 'spacecraft', new Set());
    expect(step.lesson.id).toBe('mars-integration');
    const correct = step.cards[0].options.find((option) => option.correct);
    const budget = selectEvaluation(state).budget;
    const smallest = ['budget', 'power', 'data'].sort((a, b) => budget[b].ratio - budget[a].ratio)[0];
    expect(correct.id).toBe(smallest);
    expect(step.last.text).toMatch(/^Room left now: /);
  });

  it('explains the trip time and the dust storm margin with the real days and percent', () => {
    const done = new Set(['mars-integration']);
    const state = start('mars-study');
    const time = play(state, 'launch', done);
    expect(time.lesson.id).toBe('mars-time');
    expect(time.last.text).toBe('The trip takes 200 days and the science phase 540: 740 of our 900 days. 160 days are spare (18%).');
    // The margin lesson waits until the design can fly
    expect(nextLesson(ctxFor(state, 'launch'), done)).toBeNull();
  });
});

describe('lesson texts', () => {
  it('exist in every language with short answer options', () => {
    const coachKeys = Object.keys(dictionaries.en).filter((key) => key.startsWith('coach.'));
    expect(coachKeys.length).toBeGreaterThan(60);
    for (const { id } of LOCALES) {
      for (const key of coachKeys) {
        const text = dictionaries[id][key];
        expect(text, `${id}: ${key}`).toBeTruthy();
        // Options are buttons in a narrow panel; everything else stays within a few lines
        expect(text.length, `${id}: ${key}`).toBeLessThanOrEqual(/\.a\d$/.test(key) ? 34 : 175);
      }
    }
  });

  it('every destination has three lessons', () => {
    for (const scenario of gameData.scenarios) expect(lessonsFor(scenario.id)).toHaveLength(3);
  });

  it('renders in Portuguese and Spanish with the same numbers', () => {
    const state = togglePart(start('earth-observation'), 'thermal-imager');
    const active = { lessonId: 'earth-instrument', stage: 'explain', change: { action: 'toggle-part', value: 'thermal-imager' }, answer: '1' };
    for (const id of ['pt', 'es']) {
      setLocale(id);
      const card = lessonCard(active, ctxFor(state, 'spacecraft'));
      expect(card.feedback).not.toBe('Right.');
      expect(card.text).toContain('12 kg');
      expect(card.text).toContain('45 W');
    }
  });
});
