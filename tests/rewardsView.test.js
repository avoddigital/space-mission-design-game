// Checks the gamification HTML (menu and report) without a browser.
import { describe, it, expect } from 'vitest';
import { menuScreen } from '../src/ui/screens/menu.js';
import { reportScreen } from '../src/ui/screens/mission.js';
import { starRow, rankCard, badgeGallery, reportRewards } from '../src/ui/components/rewards.js';
import { emptyProgress, recordMission, ACHIEVEMENTS } from '../src/engine/progress.js';
import { createInitialState } from '../src/state/store.js';
import { launch, showReport, togglePart, setPower, setComms, setOrbit, setRocket } from '../src/state/actions.js';
import { gameData, runSimulation, selectScore, selectScenario, selectMission, selectEvaluation } from '../src/state/selectors.js';

const win = (scenarioId, total) => ({
  scenarioId, outcome: 'success', total, events: [], budgetLeftRatio: 0.1, tight: false, scienceDelivered: 12, minScience: 12,
});

describe('menu rewards', () => {
  it('shows rank, stars per mission and the badge gallery', () => {
    const progress = recordMission(emptyProgress(), win('moon-exploration', 92), { scenarioCount: 3 }).progress;
    const html = menuScreen({ state: createInitialState(), data: gameData, best: { byScenario: {} }, progress });
    expect(html).toContain('Engineer'); // 3 stars
    expect(html).toContain('3 of 3 stars earned');
    expect(html).toContain('0 of 3 stars earned');
    expect(html).toContain(`Badges <small>3 / ${ACHIEVEMENTS.length}</small>`);
    expect(html).toContain('🔒');
  });

  it('starts as a Cadet with nothing unlocked', () => {
    const html = rankCard(emptyProgress()) + badgeGallery(emptyProgress());
    expect(html).toContain('Cadet');
    expect(html).toContain('Next: <strong>Engineer</strong> in 3 more ★');
    expect(html).toContain(`0 / ${ACHIEVEMENTS.length}`);
  });

  it('draws filled and empty stars', () => {
    const html = starRow(2);
    expect(html.match(/is-on/g)).toHaveLength(2);
    expect(html).toContain('☆');
  });
});

describe('report rewards', () => {
  it('lists new badges, stars and a promotion', () => {
    const outcome = recordMission(emptyProgress(), win('earth-observation', 95), { scenarioCount: 3 });
    const html = reportRewards({ rewards: outcome });
    expect(html).toContain('Badge unlocked: First Launch');
    expect(html).toContain('Badge unlocked: Top Score');
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
    const rewards = recordMission(emptyProgress(), { ...win('earth-observation', score.total), events: state.simulation.events }, { scenarioCount: 3 });
    state = showReport(state, { score, isNewBest: true, best: score.total, rewards });
    const ctx = {
      state, data: gameData, content: gameData.content, ui: { celebrateUntil: Date.now() + 1000, shake: new Set() }, shake: new Set(),
      scenario: selectScenario(state), mission: selectMission(state), evaluation: selectEvaluation(state), simulation: state.simulation,
    };
    const html = reportScreen(ctx);
    expect(html).toContain('Mission success');
    expect(html).toContain(`data-count-to="${score.total}"`);
    expect(html).toContain('Badge unlocked: First Launch');
  });
});

describe('rank progress bar', () => {
  it('fills by the share of the current rank step', async () => {
    const { progressFromBest } = await import('../src/engine/progress.js');
    const widthFor = (best) => Number(rankCard(progressFromBest({ byScenario: best })).match(/data-progress="(\d+)"/)[1]);
    expect(widthFor({})).toBe(0); // 0 of 3 stars to Engineer
    expect(widthFor({ 'earth-observation': 68 })).toBe(33); // 1 of 3
    expect(widthFor({ 'earth-observation': 75 })).toBe(67); // 2 of 3
    expect(widthFor({ 'earth-observation': 95, 'moon-exploration': 68 })).toBe(33); // Engineer: 4 stars, 1 of 3 toward 6
    expect(widthFor({ 'earth-observation': 95, 'moon-exploration': 95, 'mars-study': 95 })).toBe(100); // top rank
  });
});
