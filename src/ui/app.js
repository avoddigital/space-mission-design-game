// Connects the screens to the store: renders the current screen and turns clicks
// and keys into actions. Game rules stay in src/engine; this file only shows them.

import {
  selectScenario, startMission, confirmStep, goToStep, goToMenu, togglePart, setPower, setComms,
  setOrbit, setRocket, launch, togglePause, newConditions, showReport, redesign, answerQuiz,
} from '../state/actions.js';
import {
  gameData, selectScenario as selectScenarioData, selectMission, selectEvaluation, runSimulation, selectScore,
} from '../state/selectors.js';
import { loadBest, saveBest } from '../state/persistence.js';
import { formatIssue } from '../engine/messages.js';
import { menuScreen } from './screens/menu.js';
import { objectiveScreen, spacecraftScreen, launchScreen } from './screens/design.js';
import { simulationScreen, reportScreen, phasesToShow } from './screens/mission.js';
import { meterDetail, METERS } from './components/meter.js';
import { modal, toast, pauseOverlay } from './components/overlays.js';
import { syncView3d } from './view3dHost.js';

const SCREENS = {
  objective: objectiveScreen,
  spacecraft: spacecraftScreen,
  launch: launchScreen,
  simulation: simulationScreen,
  report: reportScreen,
};

/** Step numbers of the design screens, for Back and Enter. */
const STEP_OF = { objective: 1, spacecraft: 2, launch: 3 };

/** Issue codes behind each meter, used to explain why a meter turned red. */
const METER_CODES = {
  budget: ['OVER_BUDGET'],
  mass: ['ROCKET_CANNOT_REACH_ORBIT', 'PAYLOAD_TOO_HEAVY'],
  power: ['POWER_DEFICIT'],
  data: ['DATA_BACKLOG'],
  time: ['OVER_TIME'],
};

const TOAST_MS = 4500;
/** Time each simulation phase stays on screen before the next one appears. */
const PHASE_MS = 1500;
const SHAKE_MS = 400;

/**
 * @param {HTMLElement} root
 * @param {{ store: object, data?: object, storage?: Storage }} options
 */
export function mountApp(root, { store, data = gameData, storage }) {
  // Screen-only state (not part of the game): open tab, modal, toast, shaking meters.
  const ui = { tab: 'instrument', modal: null, toast: null, shake: new Set(), simShown: 0 };
  let toastTimer = null;
  let phaseTimer = null;
  // Keep focus on the same control after re-rendering only for keyboard users.
  // After a mouse click, focus goes back to the page, so Enter means "next step".
  let keyboardFocus = false;

  const evaluate = (state) => selectEvaluation(state, data);

  function render() {
    const state = store.getState();
    const focusKey = document.activeElement?.dataset?.action
      ? `${document.activeElement.dataset.action}|${document.activeElement.dataset.value ?? ''}`
      : null;

    let html;
    if (state.screen === 'menu') {
      html = menuScreen({ state, data, best: loadBest(storage) });
    } else {
      const ctx = {
        state,
        data,
        ui,
        content: data.content ?? {},
        scenario: selectScenarioData(state, data),
        mission: selectMission(state, data),
        evaluation: evaluate(state),
        simulation: state.simulation,
        shake: ui.shake,
      };
      html = (SCREENS[state.screen] ?? objectiveScreen)(ctx);
    }
    if (ui.modal) html += modal(ui.modal);
    if (state.paused) html += pauseOverlay();
    if (ui.toast) html += toast(ui.toast);
    root.innerHTML = html;

    // Optional 3D view: only reads the chosen parts and draws them.
    if (state.screen !== 'menu') {
      syncView3d(root, selectMission(state, data).parts, { paused: state.paused || Boolean(ui.modal), onReady: render });
    } else {
      syncView3d(root, [], { paused: true, onReady: render });
    }

    // Keep keyboard focus on the same control after re-rendering.
    const autofocus = root.querySelector('[autofocus]');
    if (autofocus) autofocus.focus();
    else if (focusKey && keyboardFocus) {
      const [action, value] = focusKey.split('|');
      root.querySelector(`[data-action="${CSS.escape(action)}"][data-value="${CSS.escape(value)}"]`)?.focus();
    }
  }

  function showToast(message) {
    ui.toast = message;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      ui.toast = null;
      render();
    }, TOAST_MS);
  }

  /** Run a design action, then warn the player about any limit it broke. */
  function updateDesign(action, ...args) {
    const before = evaluate(store.getState());
    store.update(action, ...args);
    const after = evaluate(store.getState());

    const broken = Object.keys(METERS).filter(
      (key) => after.budget[key].status === 'over' && before.budget[key].status !== 'over',
    );
    // Warn about a new error, or about the issue behind a meter that just went over its limit
    // (some errors, like a power deficit, already exist while nothing is chosen yet).
    const newError = after.issues.find(
      (issue) => issue.severity === 'error' && !before.issues.some((old) => old.code === issue.code && old.type === issue.type),
    );
    const meterIssue = after.issues.find((issue) => broken.some((key) => METER_CODES[key].includes(issue.code)));
    const shown = newError ?? meterIssue;
    if (shown) {
      const message = formatIssue(shown, data.content, data);
      showToast({ title: message.title, text: `${message.text} ${message.tip}`, tone: shown.severity === 'error' ? 'bad' : 'warn' });
    }
    if (broken.length) {
      ui.shake = new Set(broken);
      setTimeout(() => {
        ui.shake = new Set();
        render();
      }, SHAKE_MS);
    }
    render();
  }

  /** Reveal the simulation phases one by one. Pause freezes the timeline. */
  function playTimeline() {
    ui.simShown = 0;
    clearInterval(phaseTimer);
    phaseTimer = setInterval(() => {
      const state = store.getState();
      if (state.screen !== 'simulation' || !state.simulation) {
        clearInterval(phaseTimer);
        return;
      }
      if (state.paused) return;
      if (ui.simShown >= phasesToShow(state.simulation)) {
        clearInterval(phaseTimer);
        return;
      }
      ui.simShown += 1;
      render();
    }, PHASE_MS);
  }

  function launchMission() {
    ui.simShown = 0; // reset before rendering, or a previous "Skip" would show the new run as finished
    store.update(launch, runSimulation(store.getState(), data));
    playTimeline();
  }

  function openReport() {
    clearInterval(phaseTimer);
    const state = store.getState();
    const score = selectScore(state, data);
    // Only successful missions can set a best score.
    const best = state.simulation?.outcome === 'success'
      ? saveBest(state.scenarioId, score.total, storage)
      : { isNewBest: false, best: loadBest(storage).byScenario[state.scenarioId] };
    store.update(showReport, { score, ...best });
    window.scrollTo?.(0, 0);
  }

  const handlers = {
    'select-scenario': (value) => store.update(selectScenario, value),
    start: () => {
      ui.tab = 'instrument';
      store.update(startMission);
    },
    confirm: (value) => store.update(confirmStep, Number(value)),
    'go-step': (value) => store.update(goToStep, Number(value)),
    menu: () => store.update(goToMenu),
    restart: () => {
      const { scenarioId } = store.getState();
      store.update((state) => startMission(selectScenario(state, scenarioId)));
    },
    pause: () => store.update(togglePause),
    tab: (value) => {
      ui.tab = value;
      render();
    },
    'toggle-part': (value) => updateDesign(togglePart, value),
    'set-power': (value) => updateDesign(setPower, value, data.parts),
    'set-comms': (value) => updateDesign(setComms, value, data.parts),
    'set-orbit': (value) => updateDesign(setOrbit, value),
    'set-rocket': (value) => updateDesign(setRocket, value),
    launch: () => launchMission(),
    skip: () => {
      ui.simShown = Number.MAX_SAFE_INTEGER;
      clearInterval(phaseTimer);
      render();
    },
    'see-report': () => openReport(),
    redesign: () => {
      const failed = store.getState().simulation?.failedIssue;
      store.update(redesign, failed ? [failed] : []);
    },
    'new-conditions': () => {
      store.update(newConditions);
      launchMission();
    },
    'next-mission': () => {
      const ids = data.scenarios.map((scenario) => scenario.id);
      const next = ids[(ids.indexOf(store.getState().scenarioId) + 1) % ids.length];
      ui.tab = 'instrument';
      store.update((state) => startMission(selectScenario(state, next)));
    },
    quiz: (value) => {
      const quiz = data.content?.scenarios?.[store.getState().scenarioId]?.quiz;
      if (quiz) store.update(answerQuiz, Number(value), quiz.answer);
    },
    meter: (value) => {
      const meta = data.content?.meters?.[value];
      const budget = evaluate(store.getState()).budget;
      ui.modal = { title: meta?.name ?? value, paragraphs: [meta?.text, meterDetail(value, budget)] };
      render();
    },
    'close-modal': () => {
      ui.modal = null;
      render();
    },
  };

  root.addEventListener('click', (event) => {
    const element = event.target.closest('[data-action]');
    if (!element || !root.contains(element)) return;
    // event.detail is 0 when the click comes from the keyboard (Enter or Space on a button).
    keyboardFocus = event.detail === 0 && document.activeElement === element;
    // Clicks inside a modal box must not close it through the backdrop.
    if (element.classList.contains('overlay') && event.target.closest('[data-stop]')) return;
    if (element.getAttribute('aria-disabled') === 'true') {
      const reason = element.querySelector('.card-reason')?.textContent;
      element.classList.add('shake');
      if (reason) showToast({ title: 'Not possible', text: reason, tone: 'warn' });
      setTimeout(() => element.classList.remove('shake'), SHAKE_MS);
      render();
      return;
    }
    handlers[element.dataset.action]?.(element.dataset.value);
  });

  document.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const state = store.getState();
    const key = event.key;

    if (key === 'Escape' && ui.modal) {
      ui.modal = null;
      render();
      return;
    }
    if ((key === 'p' || key === 'P' || key === 'Escape') && state.screen !== 'menu') {
      event.preventDefault();
      store.update(togglePause);
      return;
    }
    if (state.paused || ui.modal) return;

    if (key === 'Enter' && event.target === document.body) {
      event.preventDefault();
      if (state.screen === 'menu') handlers.start();
      else if (state.screen === 'launch') handlers.launch();
      else if (state.screen === 'simulation') {
        if (state.simulation && ui.simShown >= phasesToShow(state.simulation)) handlers['see-report']();
        else handlers.skip();
      }
      else if (STEP_OF[state.screen]) handlers.confirm(STEP_OF[state.screen]);
    } else if (key === 'Backspace') {
      event.preventDefault();
      const step = STEP_OF[state.screen];
      if (step === 1) handlers.menu();
      else if (step) handlers['go-step'](step - 1);
    } else if (/^[1-8]$/.test(key)) {
      const cards = root.querySelectorAll('[data-card]');
      cards[Number(key) - 1]?.click();
    }
  });

  store.subscribe(render);
  render();
}
