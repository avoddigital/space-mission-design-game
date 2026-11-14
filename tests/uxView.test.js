// Checks the UX helpers (next-step hint, rocket tags, meter preview) without a browser.
import { describe, it, expect } from 'vitest';
import { nextStep, hintLine } from '../src/ui/components/hint.js';
import { launchScreen, metersPanel } from '../src/ui/screens/design.js';
import { createInitialState } from '../src/state/store.js';
import { togglePart, setPower, setComms, setOrbit, setRocket } from '../src/state/actions.js';
import { gameData, selectScenario, selectMission, selectEvaluation } from '../src/state/selectors.js';

const ctxFor = (state) => ({
  state, data: gameData, content: gameData.content, ui: { tab: 'instrument' }, shake: new Set(),
  scenario: selectScenario(state), mission: selectMission(state), evaluation: selectEvaluation(state),
});
const parts = gameData.parts;
const earth = (build) => build({ ...createInitialState(), scenarioId: 'earth-observation' });

describe('nextStep', () => {
  it('walks a beginner through the spacecraft step', () => {
    let state = earth((s) => s);
    expect(nextStep('spacecraft', ctxFor(state))).toMatchObject({ tab: 'instrument' });
    state = togglePart(state, 'multispectral-imager');
    expect(nextStep('spacecraft', ctxFor(state))).toMatchObject({ tab: 'power' });
    state = setPower(state, 'solar-panel-s', parts);
    expect(nextStep('spacecraft', ctxFor(state))).toMatchObject({ tab: 'comms' });
    state = setComms(state, 'hga-antenna', parts);
    expect(nextStep('spacecraft', ctxFor(state)).text).toMatch(/^Power is over the limit by 20 W/);
    state = setPower(state, 'solar-panel-m', parts);
    expect(nextStep('spacecraft', ctxFor(state)).text).toMatch(/^Science is 8 of 12/);
    state = togglePart(state, 'imaging-spectrometer');
    expect(nextStep('spacecraft', ctxFor(state))).toMatchObject({ tone: 'good' });
  });

  it('guides the launch step and offers a tab button only when it helps', () => {
    let state = earth((s) => setComms(setPower(togglePart(s, 'multispectral-imager'), 'solar-panel-m', parts), 'hga-antenna', parts));
    expect(nextStep('launch', ctxFor(state)).text).toBe('Next: pick an orbit for this mission.');
    state = setOrbit(state, 'sso-700');
    expect(nextStep('launch', ctxFor(state)).text).toContain('to low Earth orbit');
    expect(hintLine({ text: 'x', tab: 'power', tone: 'info' }, 'instrument')).toContain('Open Power →');
    expect(hintLine({ text: 'x', tab: 'power', tone: 'info' }, 'power')).not.toContain('Open');
  });
});

describe('rocket tags', () => {
  it('says which rockets fit and which break the budget', () => {
    let state = earth((s) => setComms(setPower(togglePart(togglePart(s, 'multispectral-imager'), 'hd-camera'), 'solar-panel-m', parts), 'hga-antenna', parts));
    state = setOrbit(state, 'sso-700'); // spacecraft: 310 kg (the demo video path)
    const html = launchScreen(ctxFor(state));
    expect(html).toContain('Too small: 10 kg over'); // small lifter carries 300 kg
    expect(html).toContain('Fits ✓');
    expect(html).toContain('Over budget by 20 M USD'); // medium lifter, as in the video
  });
});

describe('meter preview', () => {
  it('shows the change a choice would make', () => {
    const now = earth((s) => togglePart(s, 'multispectral-imager'));
    const next = togglePart(now, 'hd-camera');
    const html = metersPanel(selectEvaluation(next), gameData.content, new Set(), selectEvaluation(now));
    expect(html).toContain('Preview: if you pick this');
    expect(html).toContain('+20 M USD'); // camera cost
    expect(html).toContain('(+7)'); // science
    expect(metersPanel(selectEvaluation(now), gameData.content)).not.toContain('Preview');
  });
});

describe('live projected score', () => {
  it('shows the projected score and stars while designing, and asks to fix errors first', async () => {
    const { projectionCard } = await import('../src/ui/components/rewards.js');
    const { selectProjectedScore } = await import('../src/state/selectors.js');
    let state = earth((s) => setComms(setPower(togglePart(togglePart(s, 'multispectral-imager'), 'imaging-spectrometer'), 'solar-panel-m', parts), 'hga-antenna', parts));
    expect(projectionCard(selectProjectedScore(state))).toContain('Finish your design'); // no orbit or rocket yet
    const lowScience = setRocket(setOrbit(earth((s) => setComms(setPower(togglePart(s, 'hd-camera'), 'solar-panel-m', parts), 'hga-antenna', parts)), 'sso-700'), 'small-lifter');
    expect(projectionCard(selectProjectedScore(lowScience))).toContain('this design would fail'); // 7 of 12 science
    state = setRocket(setOrbit(state, 'sso-700'), 'small-lifter');
    const score = selectProjectedScore(state);
    expect(score.failed).toBe(false);
    const html = projectionCard(score, { ...score, total: score.total - 5 });
    expect(html).toContain(`${score.total}<small> / 100</small>`);
    expect(html).toContain('(+5)');
  });
});

describe('checklist risky lines', async () => {
  const { checklist } = await import('../src/ui/components/checklist.js');
  const budgetOf = (timeRatio) => ({
    budget: { status: 'ok', ratio: 0.5, usedMUsd: 75, limitMUsd: 150 },
    mass: { status: 'ok', ratio: 0.5, usedKg: 150, limitKg: 300 },
    power: { status: 'ok', ratio: 0.5, consumedW: 100, generatedW: 200 },
    data: { status: 'ok', ratio: 0.5, producedGbPerDay: 50, downlinkGbPerDay: 100 },
    time: { status: 'ok', ratio: timeRatio, totalDays: Math.round(400 * timeRatio), limitDays: 400 },
    science: { ok: true, status: 'ok', ratio: 1.25, value: 15, goal: 12 },
  });

  it('shows CHECK, with no fix link, when a meter is above 90% but still OK', () => {
    const html = checklist({ ok: true, issues: [], budget: budgetOf(0.9125) }, {}, {});
    const timeLine = html.split('<li').find((line) => line.includes('Time'));
    expect(timeLine).toContain('CHECK');
    expect(timeLine).toContain('Close to the limit (91%)');
    expect(timeLine).not.toContain('Fix in step');
    // Science above its goal is good news, never a warning.
    const scienceLine = html.split('<li').find((line) => line.includes('Science'));
    expect(scienceLine).toContain('GO');
    expect(scienceLine).not.toContain('CHECK');
  });

  it('keeps GO below 90%', () => {
    const html = checklist({ ok: true, issues: [], budget: budgetOf(0.8) }, {}, {});
    expect(html).not.toContain('CHECK');
  });
});
