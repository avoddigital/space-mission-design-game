// Checks the gamification HTML (menu and report) without a browser.
import { describe, it, expect } from 'vitest';
import { menuScreen } from '../src/ui/screens/menu.js';
import { reportScreen } from '../src/ui/screens/mission.js';
import { starRow, rankCard, reportRewards } from '../src/ui/components/rewards.js';
import { emptyProgress, recordMission } from '../src/engine/progress.js';
import { createInitialState } from '../src/state/store.js';
import { launch, showReport, togglePart, setPower, setComms, setOrbit, setRocket } from '../src/state/actions.js';
import { gameData, runSimulation, selectScore, selectScenario, selectMission, selectEvaluation } from '../src/state/selectors.js';

const win = (scenarioId, total) => ({ scenarioId, outcome: 'success', total });

describe('menu rewards', () => {
  it('shows rank and stars per mission', () => {
    const progress = recordMission(emptyProgress(), win('moon-exploration', 92), {}).progress;
    const html = menuScreen({ state: createInitialState(), data: gameData, best: { byScenario: {} }, progress });
    expect(html).toContain('Engineer'); // 3 stars
    expect(html).toContain('3 of 3 stars earned');
    expect(html).toContain('0 of 3 stars earned');
  });

  it('starts as a Cadet', () => {
    const html = rankCard(emptyProgress());
    expect(html).toContain('Cadet');
    expect(html).toContain('Next: <strong>Engineer</strong> in 3 more ★');
  });

  it('draws filled and empty stars', () => {
    const html = starRow(2);
    expect(html.match(/is-on/g)).toHaveLength(2);
    expect(html).toContain('☆');
  });
});

describe('report rewards', () => {
  it('shows stars and a promotion', () => {
    const outcome = recordMission(emptyProgress(), win('earth-observation', 95), {});
    const html = reportRewards({ rewards: outcome });
    expect(html).toContain('Promoted to <strong>Engineer</strong>');
    expect(html.match(/is-pop/g)).toHaveLength(3);
  });

  it('renders the full report with rewards after a success', () => {
    let state = { ...createInitialState(), scenarioId: 'earth-observation' };
    for (const id of ['multispectral-imager', 'imaging-spectrometer']) state = togglePart(state, id);
    state = setComms(setPower(state, 'solar-panel-m', gameData.parts), 'hga-antenna', gameData.parts);
    state = setRocket(setOrbit(state, 'sso-700'), 'small-lifter');
    state = launch(state, runSimulation(state, gameData));
    const score = selectScore(state, gameData);
    const rewards = recordMission(emptyProgress(), { ...win('earth-observation', score.total), events: state.simulation.events }, {});
    state = showReport(state, { score, isNewBest: true, best: score.total, rewards });
    const ctx = {
      state, data: gameData, content: gameData.content, ui: { celebrateUntil: Date.now() + 1000, shake: new Set() }, shake: new Set(),
      scenario: selectScenario(state), mission: selectMission(state), evaluation: selectEvaluation(state), simulation: state.simulation,
    };
    const html = reportScreen(ctx);
    expect(html).toContain('Mission success');
    expect(html).toContain(`data-count-to="${score.total}"`);
    expect(html).toContain('class="rewards"');
  });
});

describe('rank lamps', () => {
  it('light one lamp per star, with a gap where each new rank starts', async () => {
    const { progressFromBest } = await import('../src/engine/progress.js');
    const html = (best) => rankCard(progressFromBest({ byScenario: best }));
    const lit = (best) => (html(best).match(/rank-lamp is-on/g) ?? []).length;
    expect(html({}).match(/class="rank-lamp[ "]/g)).toHaveLength(9);
    expect(html({}).match(/is-step/g)).toHaveLength(2); // Engineer at 3 stars, Flight Director at 6 (Architect is the end)
    expect(lit({})).toBe(0);
    expect(lit({ 'earth-observation': 75 })).toBe(2);
    expect(lit({ 'earth-observation': 95, 'moon-exploration': 68 })).toBe(4);
    expect(lit({ 'earth-observation': 95, 'moon-exploration': 95, 'mars-study': 95 })).toBe(9);
    expect(html({ 'earth-observation': 95, 'moon-exploration': 68 })).toContain('4 of 9 stars');
  });
});
