// The game screen on a player's own device (multi-device team play).
// The room sends the game state (src/net/protocol.js, snapshot.mirror); this file draws the same screens with the
// same functions, in this device's language and with this player's own view (open tab, numbers, details).
// Choices made on it are sent to the main device (src/ui/remote.js), which runs them and sends the new state back.

import { gameData, selectScenario, selectMission, selectEvaluation, selectProjectedScore } from '../state/selectors.js';
import { campaignData } from '../engine/campaign.js';
import { localizeData } from '../i18n/index.js';
import { menuScreen } from './screens/menu.js';
import { objectiveScreen, spacecraftScreen, launchScreen } from './screens/design.js';
import { simulationScreen, reportScreen, phasesToShow } from './screens/mission.js';
import { titleScreen, setupScreen, hubScreen, globeView } from './screens/campaign.js';
import { meterDetail } from './components/meter.js';
import { modal, toast, pauseOverlay, countdownOverlay, confetti } from './components/overlays.js';

const SCREENS = {
  objective: objectiveScreen,
  spacecraft: spacecraftScreen,
  launch: launchScreen,
  simulation: simulationScreen,
  report: reportScreen,
};

const GLOBE_SCREENS = new Set(['menu', 'setup', 'hub']);

/** The game tables as the main device sees them (agency research changes numbers), in this device's language. */
function tablesFor(state) {
  return localizeData(state.mode === 'campaign' && state.campaign ? campaignData(gameData, state.campaign) : gameData);
}

/** True when the flight on the main device is over and its score is known: the report can be opened here. */
export function canOpenReport(mirror) {
  const { state, ui = {}, run } = mirror;
  return state.screen === 'simulation' && Boolean(state.simulation && run)
    && (ui.simShown ?? 0) >= phasesToShow(state.simulation);
}

/** The game state as if the main device had opened the report (the agency result comes when it really does). */
function reportState(mirror) {
  const { state, run } = mirror;
  return { ...state, screen: 'report', report: { score: run.score, ...run.best, rewards: run.rewards } };
}

/** The details window of a meter, drawn on this device (same text as on the main device). */
export function meterModal(mirror, key) {
  const data = tablesFor(mirror.state);
  const meta = data.content?.meters?.[key];
  return { title: meta?.name ?? key, paragraphs: [meta?.text, meterDetail(key, selectEvaluation(mirror.state, data).budget)] };
}

/**
 * HTML of the game screen, plus what the 3D view should draw.
 * @param {{ state: object, ui: object, progress?: object, best?: object }} mirror what the main device sent
 * @param {{ tab?: string, opsTab?: string, showNumbers?: boolean, modal?: object|null, report?: boolean }} [own]
 *   this player's own view; report: true shows the report of the finished flight on this device only
 * @returns {{ html: string, scene: object|null }}
 */
export function mirrorScreen(mirror, own = {}) {
  const state = own.report && canOpenReport(mirror) ? reportState(mirror) : mirror.state;
  const ui = { tab: 'instrument', simShown: 0, opsTab: 'jobs', showNumbers: false, reportBadges: [], ...mirror.ui, ...own, shake: new Set() };
  const data = tablesFor(state);
  let html;
  let scene = { parts: [] };

  if (state.screen === 'menu') {
    html = titleScreen({ saved: state.campaign });
  } else if (state.screen === 'free') {
    html = menuScreen({ state, data, best: mirror.best ?? { byScenario: {} }, progress: mirror.progress, room: null });
  } else if (state.screen === 'setup') {
    html = setupScreen({ setup: ui.setup ?? { countryId: null, focusId: null }, team: state.team, room: null });
  } else if (state.screen === 'hub' && state.campaign) {
    html = hubScreen({ campaign: state.campaign, data, ui });
  } else {
    const ctx = {
      state,
      data,
      ui,
      content: data.content ?? {},
      scenario: selectScenario(state, data),
      mission: selectMission(state, data),
      evaluation: selectEvaluation(state, data),
      simulation: state.simulation,
      shake: ui.shake,
      progress: mirror.progress,
      projected: selectProjectedScore(state, data),
    };
    html = (SCREENS[state.screen] ?? objectiveScreen)(ctx);
    scene = { ...ctx.mission, simulation: state.simulation, shown: ui.simShown };
  }

  if (GLOBE_SCREENS.has(state.screen)) {
    scene = { parts: [], globe: globeView(state.screen === 'hub' ? state.campaign : null, state.screen === 'setup' ? ui.setup?.countryId : null) };
  }
  if (state.screen === 'free') scene = null; // no 3D on the mission list

  if (ui.modal) html += modal(ui.modal);
  if (state.paused) html += pauseOverlay();
  if (ui.toast) html += toast(ui.toast);
  if (ui.countdown !== null && ui.countdown !== undefined) html += countdownOverlay(ui.countdown);
  if (ui.celebrate) html += confetti();
  if (ui.banner) html += `<div class="stage-banner" role="status">${ui.banner}</div>`;
  return { html, scene };
}
