// Connects the screens to the store: renders the current screen and turns clicks
// and keys into actions. Game rules stay in src/engine; this file only shows them.

import {
  selectScenario, startMission, confirmStep, goToStep, goToMenu, togglePart, setPower, setComms,
  setOrbit, setRocket, launch, togglePause, newConditions, showReport, redesign, answerQuiz,
} from '../state/actions.js';
import {
  gameData, selectScenario as selectScenarioData, selectMission, selectEvaluation, runSimulation, selectScore,
  selectProjectedScore,
} from '../state/selectors.js';
import { loadBest, saveBest, loadProgress, saveProgress } from '../state/persistence.js';
import { recordMission, recordQuiz, achievementById, progressFromBest } from '../engine/progress.js';
import { formatIssue } from '../engine/messages.js';
import { menuScreen } from './screens/menu.js';
import { objectiveScreen, spacecraftScreen, launchScreen, metersPanel } from './screens/design.js';
import { simulationScreen, reportScreen, phasesToShow } from './screens/mission.js';
import { libraryScreen } from './screens/library.js';
import { meterDetail, METERS } from './components/meter.js';
import { modal, toast, pauseOverlay, countdownOverlay, confetti } from './components/overlays.js';
import { syncView3d } from './view3dHost.js';
import { play, toggleMute } from './sound.js';

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
const BANNER_MS = 1600;
/** Time each simulation phase stays on screen before the next one appears. */
const PHASE_MS = 1500;
const SHAKE_MS = 400;
/** Launch countdown: one number every COUNT_MS, then "Liftoff!" for LIFTOFF_MS. */
const COUNT_MS = 700;
const LIFTOFF_MS = 900;
const CELEBRATE_MS = 3500;

/**
 * Sound for each action (DESIGN.md section 7). Actions missing here choose their own sound
 * (picking parts, launching, the quiz) or stay silent.
 */
const ACTION_SOUNDS = {
  'select-scenario': 'pick',
  start: 'pick',
  confirm: 'tab',
  'go-step': 'tab',
  menu: 'click',
  restart: 'click',
  pause: 'click',
  tab: 'tab',
  skip: 'click',
  'toggle-numbers': 'click',
  'see-report': 'open',
  redesign: 'click',
  'next-mission': 'pick',
  meter: 'open',
  'close-modal': 'close',
  library: 'open',
  'library-tab': 'tab',
  'close-library': 'close',
};

const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** Animate a number from 0 to `target` (about 0.9 s). */
function countUp(element, target) {
  if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches || target <= 0) return;
  const start = performance.now();
  const step = (time) => {
    if (!element.isConnected) return;
    const progress = Math.min(1, (time - start) / 900);
    element.textContent = String(Math.round(target * (1 - (1 - progress) ** 3)));
    if (progress < 1) requestAnimationFrame(step);
  };
  element.textContent = '0';
  requestAnimationFrame(step);
}

/**
 * @param {HTMLElement} root
 * @param {{ store: object, data?: object, storage?: Storage }} options
 */
export function mountApp(root, { store, data = gameData, storage }) {
  // Screen-only state (not part of the game): open tab, modal, toast, shaking meters.
  const ui = {
    tab: 'instrument', modal: null, toast: null, shake: new Set(), simShown: 0, countedRun: 0,
    banner: null, lastScreen: null, previewKey: null,
    showNumbers: false, // cards show dots by default; exact numbers on demand
    countdown: null, // 3, 2, 1, 0 while the launch countdown runs
    celebrate: false, // confetti after a successful simulation
    library: null, // { tab } while the Mission Library is open (screen-only, the game keeps its state)
  };
  let toastTimer = null;
  let phaseTimer = null;
  let countdownTimer = null;
  let celebrateTimer = null;
  // Keep focus on the same control after re-rendering only for keyboard users.
  // After a mouse click, focus goes back to the page, so Enter means "next step".
  let keyboardFocus = false;

  const evaluate = (state) => selectEvaluation(state, data);
  // Saved progress, or stars rebuilt from best scores saved before badges existed.
  const currentProgress = () => loadProgress(storage) ?? progressFromBest(loadBest(storage));

  function render() {
    const state = store.getState();
    const focusKey = document.activeElement?.dataset?.action
      ? `${document.activeElement.dataset.action}|${document.activeElement.dataset.value ?? ''}`
      : null;

    let html;
    if (ui.library) {
      html = libraryScreen({ tab: ui.library.tab, inGame: state.screen !== 'menu' });
    } else if (state.screen === 'menu') {
      html = menuScreen({ state, data, best: loadBest(storage), progress: currentProgress() });
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
        progress: currentProgress(),
        projected: selectProjectedScore(state, data),
      };
      html = (SCREENS[state.screen] ?? objectiveScreen)(ctx);
    }
    if (ui.modal) html += modal(ui.modal);
    if (state.paused && !ui.library) html += pauseOverlay();
    if (ui.toast) html += toast(ui.toast);
    if (ui.banner) html += `<div class="stage-banner" role="status">${ui.banner}</div>`;
    if (ui.countdown !== null) html += countdownOverlay(ui.countdown);
    if (ui.celebrate) html += confetti();
    root.innerHTML = html;
    root.classList.toggle('is-liftoff', ui.countdown === 0);
    ui.previewKey = null; // the meters now show the real values

    // Short entrance animation when the screen changes (PRD 8.5).
    if (state.screen !== ui.lastScreen) {
      root.firstElementChild?.classList.add('is-entering');
      ui.lastScreen = state.screen;
    }

    // Optional 3D view: only reads the chosen parts and draws them.
    if (state.screen !== 'menu' && !ui.library) {
      const mission = selectMission(state, data);
      syncView3d(root, { ...mission, simulation: state.simulation, shown: ui.simShown }, { paused: state.paused || Boolean(ui.modal), onReady: render });
    } else {
      syncView3d(root, { parts: [] }, { paused: true, onReady: render });
    }

    // Score counts up once per report (skipped when the system asks for reduced motion).
    const counter = root.querySelector('.score-number[data-count-to]');
    if (counter && state.screen === 'report' && ui.countedRun !== state.runCount) {
      ui.countedRun = state.runCount;
      countUp(counter, Number(counter.dataset.countTo));
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
    const partsBefore = store.getState().design.partIds.length;
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
    const partsAfter = store.getState().design.partIds.length;
    if (shown || broken.length) play(shown?.severity === 'warning' ? 'warn' : 'error');
    else play(partsAfter < partsBefore ? 'unpick' : 'pick');
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
      if (state.paused || ui.library) return; // the flight waits while the player reads the library
      if (ui.simShown >= phasesToShow(state.simulation)) {
        clearInterval(phaseTimer);
        return;
      }
      ui.simShown += 1;
      phaseSound(state.simulation, ui.simShown);
      if (ui.simShown >= phasesToShow(state.simulation)) celebrate(state.simulation);
      render();
    }, PHASE_MS);
  }

  /** Chime for each finished phase, a warning when a surprise hurt, and the final verdict. */
  function phaseSound(simulation, shown) {
    const phase = simulation.phases[shown - 1];
    if (!phase) return;
    if (phase.ok === false) {
      play('failure');
      return;
    }
    play('phase');
    if (phase.id === 'operations' && simulation.events.some((event) => event.harmed)) setTimeout(() => play('warn'), 350);
    if (shown >= phasesToShow(simulation) && simulation.outcome === 'success') setTimeout(() => play('success'), 300);
  }

  /** Confetti when the simulation ends in success (screen-only, nothing in the game state). */
  function celebrate(simulation) {
    if (simulation?.outcome !== 'success' || reducedMotion()) return;
    ui.celebrate = true;
    clearTimeout(celebrateTimer);
    celebrateTimer = setTimeout(() => {
      ui.celebrate = false;
      render();
    }, CELEBRATE_MS);
  }

  function launchMission() {
    ui.simShown = 0; // reset before rendering, or a previous "Skip" would show the new run as finished
    store.update(launch, runSimulation(store.getState(), data));
    recordRun();
    playTimeline();
  }

  /** T-minus 3, 2, 1, liftoff, then the simulation starts. Reduced motion skips straight to it. */
  function startCountdown() {
    if (ui.countdown !== null) return; // already counting
    if (reducedMotion()) {
      launchMission();
      return;
    }
    ui.countdown = 3;
    play('beep');
    render();
    const step = () => {
      ui.countdown -= 1;
      play(ui.countdown === 1 ? 'beepHigh' : ui.countdown === 0 ? 'liftoff' : 'beep');
      render();
      if (ui.countdown > 0) {
        countdownTimer = setTimeout(step, COUNT_MS);
      } else {
        countdownTimer = setTimeout(() => {
          ui.countdown = null;
          launchMission();
        }, LIFTOFF_MS);
      }
    };
    countdownTimer = setTimeout(step, COUNT_MS);
  }

  /**
   * Save the run as soon as the simulation exists, so a failure counts even if the
   * player never opens the report (needed for the "Learn from Failure" badge).
   */
  function recordRun() {
    const state = store.getState();
    const score = selectScore(state, data);
    // Only successful missions can set a best score.
    const best = state.simulation?.outcome === 'success'
      ? saveBest(state.scenarioId, score.total, storage)
      : { isNewBest: false, best: loadBest(storage).byScenario[state.scenarioId] };
    // Gamification: stars, badges and rank. It never changes the score.
    const simulation = state.simulation;
    const scenario = selectScenarioData(state, data);
    const budget = simulation.budget;
    const rewards = recordMission(
      currentProgress(),
      {
        scenarioId: state.scenarioId,
        outcome: simulation.outcome,
        total: score.total,
        events: simulation.events,
        budgetLeftRatio: budget.budget.marginMUsd / budget.budget.limitMUsd,
        tight: ['budget', 'mass', 'power', 'data', 'time'].some((key) => budget[key]?.status === 'tight'),
        scienceDelivered: simulation.scienceDelivered,
        minScience: scenario.minScience,
      },
      { scenarioCount: data.scenarios.length },
    );
    saveProgress(rewards.progress, storage);
    ui.lastRun = { simulation, score, best, rewards };
  }

  function openReport() {
    clearInterval(phaseTimer);
    const run = ui.lastRun;
    if (!run || run.simulation !== store.getState().simulation) recordRun();
    const { score, best, rewards } = ui.lastRun;
    store.update(showReport, { score, ...best, rewards });
    window.scrollTo?.(0, 0);
  }

  const handlers = {
    'select-scenario': (value) => store.update(selectScenario, value),
    start: () => {
      ui.tab = 'instrument';
      store.update(startMission);
    },
    confirm: (value) => {
      const label = { 1: 'Objective', 2: 'Spacecraft' }[value];
      if (label) {
        ui.banner = `✓ Stage complete: ${label}`;
        setTimeout(() => {
          ui.banner = null;
          render();
        }, BANNER_MS);
      }
      store.update(confirmStep, Number(value));
    },
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
    launch: () => startCountdown(),
    skip: () => {
      const simulation = store.getState().simulation;
      if (simulation && ui.simShown < phasesToShow(simulation)) {
        setTimeout(() => play(simulation.outcome === 'success' ? 'success' : 'failure'), 80);
      }
      ui.simShown = Number.MAX_SAFE_INTEGER;
      clearInterval(phaseTimer);
      celebrate(store.getState().simulation);
      render();
    },
    'toggle-numbers': () => {
      ui.showNumbers = !ui.showNumbers;
      render();
    },
    'see-report': () => openReport(),
    redesign: () => {
      const failed = store.getState().simulation?.failedIssue;
      store.update(redesign, failed ? [failed] : []);
    },
    'new-conditions': () => {
      store.update(newConditions);
      startCountdown();
    },
    'next-mission': () => {
      const ids = data.scenarios.map((scenario) => scenario.id);
      const next = ids[(ids.indexOf(store.getState().scenarioId) + 1) % ids.length];
      ui.tab = 'instrument';
      store.update((state) => startMission(selectScenario(state, next)));
    },
    quiz: (value) => {
      const quiz = data.content?.scenarios?.[store.getState().scenarioId]?.quiz;
      if (!quiz || store.getState().report?.quizAnswered) return;
      play(Number(value) === quiz.answer ? 'right' : 'wrong');
      store.update(answerQuiz, Number(value), quiz.answer);
      const { progress, unlocked } = recordQuiz(currentProgress(), Number(value) === quiz.answer);
      saveProgress(progress, storage);
      const badge = unlocked.map(achievementById)[0];
      if (badge) {
        showToast({ title: `${badge.icon} Badge unlocked: ${badge.name}`, text: badge.description, tone: 'good' });
        render();
      }
    },
    meter: (value) => {
      const meta = data.content?.meters?.[value];
      const budget = evaluate(store.getState()).budget;
      ui.modal = { title: meta?.name ?? value, paragraphs: [meta?.text, meterDetail(value, budget)] };
      render();
    },
    library: () => {
      ui.library = { tab: 'missions' };
      ui.modal = null;
      if (store.getState().paused) store.update(togglePause);
      render();
      root.querySelector('.lib-scroll')?.focus();
    },
    'library-tab': (value) => {
      ui.library = { tab: value };
      render();
    },
    'close-library': () => {
      ui.library = null;
      render();
    },
    mute: () => {
      toggleMute();
      render();
    },
    'close-modal': () => {
      ui.modal = null;
      render();
    },
  };

  /** Run an action from a click or a key, with its sound. */
  function run(action, value) {
    if (!handlers[action]) return;
    if (ACTION_SOUNDS[action]) play(ACTION_SOUNDS[action]);
    handlers[action](value);
  }

  root.addEventListener('click', (event) => {
    if (ui.countdown !== null) return; // nothing can be changed during the countdown
    const element = event.target.closest('[data-action]');
    if (!element || !root.contains(element)) return;
    // event.detail is 0 when the click comes from the keyboard (Enter or Space on a button).
    keyboardFocus = event.detail === 0 && document.activeElement === element;
    // Clicks inside a modal box must not close it through the backdrop.
    if (element.classList.contains('overlay') && event.target.closest('[data-stop]')) return;
    if (element.getAttribute('aria-disabled') === 'true') {
      const reason = element.querySelector('.card-reason')?.textContent;
      element.classList.add('shake');
      play('error');
      if (reason) showToast({ title: 'Not possible', text: reason, tone: 'warn' });
      setTimeout(() => element.classList.remove('shake'), SHAKE_MS);
      render();
      return;
    }
    run(element.dataset.action, element.dataset.value);
  });

  document.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const state = store.getState();
    const key = event.key;

    if (key === 'Escape' && ui.modal) {
      run('close-modal');
      return;
    }
    if ((key === 'm' || key === 'M') && !event.target.closest?.('input, textarea')) {
      run('mute');
      return;
    }
    // The library is its own screen: Esc or Backspace closes it, other game keys do nothing there.
    if (ui.library) {
      if (key === 'Escape' || key === 'Backspace') {
        event.preventDefault();
        run('close-library');
      }
      return;
    }
    if ((key === 'p' || key === 'P' || key === 'Escape') && state.screen !== 'menu') {
      event.preventDefault();
      run('pause');
      return;
    }
    if (state.paused || ui.modal || ui.countdown !== null) return;

    if (key === 'Enter' && event.target === document.body) {
      event.preventDefault();
      if (state.screen === 'menu') run('start');
      else if (state.screen === 'launch') run('launch');
      else if (state.screen === 'simulation') {
        if (state.simulation && ui.simShown >= phasesToShow(state.simulation)) run('see-report');
        else run('skip');
      }
      else if (STEP_OF[state.screen]) run('confirm', STEP_OF[state.screen]);
    } else if (key === 'Backspace') {
      event.preventDefault();
      const step = STEP_OF[state.screen];
      if (step === 1) run('menu');
      else if (step) run('go-step', step - 1);
    } else if (/^[1-8]$/.test(key)) {
      const cards = root.querySelectorAll('[data-card]');
      cards[Number(key) - 1]?.click();
    }
  });

  // --- Impact preview: hovering or focusing a choice shows how the meters would change ---
  const PREVIEW_ACTIONS = {
    'toggle-part': (state, value) => togglePart(state, value),
    'set-power': (state, value) => setPower(state, value, data.parts),
    'set-comms': (state, value) => setComms(state, value, data.parts),
    'set-orbit': (state, value) => setOrbit(state, value),
    'set-rocket': (state, value) => setRocket(state, value),
  };

  function replaceMeters(html) {
    const current = root.querySelector('.meters');
    if (current) current.outerHTML = html;
  }

  function showPreview(event) {
    const card = event.target.closest?.('[data-card]');
    const preview = card && PREVIEW_ACTIONS[card.dataset.action];
    if (!preview || card.getAttribute('aria-disabled') === 'true') return;
    const state = store.getState();
    if (state.paused || ui.modal || !['spacecraft', 'launch'].includes(state.screen)) return;
    const key = `${card.dataset.action}|${card.dataset.value}`;
    if (key === ui.previewKey) return;
    ui.previewKey = key;
    const next = preview(state, card.dataset.value);
    const sameDesign = JSON.stringify([...next.design.partIds].sort()) === JSON.stringify([...state.design.partIds].sort())
      && next.design.orbitId === state.design.orbitId && next.design.rocketId === state.design.rocketId;
    const base = evaluate(state);
    const projectedNow = selectProjectedScore(state, data);
    if (sameDesign) {
      replaceMeters(metersPanel(base, data.content ?? {}, ui.shake, null, undefined, { score: projectedNow }));
      return;
    }
    const label = card.getAttribute('aria-pressed') === 'true' && card.dataset.action === 'toggle-part'
      ? 'Preview: if you remove this' : 'Preview: if you pick this';
    const projection = { score: selectProjectedScore(next, data), baseline: projectedNow };
    replaceMeters(metersPanel(evaluate(next), data.content ?? {}, new Set(), base, label, projection));
  }

  function hidePreview(event) {
    if (!ui.previewKey) return;
    const card = event.target.closest?.('[data-card]');
    if (card && event.relatedTarget && card.contains(event.relatedTarget)) return; // still inside the same card
    ui.previewKey = null;
    const state = store.getState();
    replaceMeters(metersPanel(evaluate(state), data.content ?? {}, ui.shake, null, undefined, { score: selectProjectedScore(state, data) }));
  }

  root.addEventListener('pointerover', showPreview);
  root.addEventListener('focusin', showPreview);
  root.addEventListener('pointerout', hidePreview);
  root.addEventListener('focusout', hidePreview);

  store.subscribe(render);
  render();
}
