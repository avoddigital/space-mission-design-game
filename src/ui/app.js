// Connects the screens to the store: renders the current screen and turns clicks
// and keys into actions. Game rules stay in src/engine; this file only shows them.

import {
  selectScenario, startMission, confirmStep, goToStep, goToMenu, togglePart, setPower, setComms,
  setOrbit, setRocket, launch, togglePause, newConditions, showReport, redesign, answerQuiz,
  openFreePlay, openSetup, enterCampaign, setCampaign, planMission, goToHub, setTeam,
} from '../state/actions.js';
import {
  gameData, selectScenario as selectScenarioData, selectMission, selectEvaluation, runSimulation, selectScore,
  selectProjectedScore,
} from '../state/selectors.js';
import { loadBest, saveBest, loadProgress, saveProgress, loadCampaign, saveCampaign, loadProfile, saveProfile, loadTeam, saveTeam } from '../state/persistence.js';
import { createTeam, resizeTeam, renamePlayer, isTeamPlay, pollConsoles, pollPassed, roleForStep, playerFor } from '../engine/team.js';
import { pollOverlay, playerName } from './components/team.js';
import { hostRoom, errorKey } from '../net/room.js';
import { snapshot, handleMessage, REMOTE_ACTIONS } from '../net/protocol.js';
import { recordMission, progressFromBest } from '../engine/progress.js';
import { attemptSummary } from '../engine/debrief.js';
import { track } from '../engine/achievements.js';
import { badgesScreen, badgeNotice } from './screens/badges.js';
import {
  createCampaign, campaignData, clearReserve, payLaunch, finishMission, phaseOfScenario, runSideJob, buyResearch,
  drawEvent, applyEvent, libraryUnlocked, currentPhase, isFinished,
} from '../engine/campaign.js';
import { sideJobs, research } from '../data/campaign.js';
import { formatIssue } from '../engine/messages.js';
import { menuScreen } from './screens/menu.js';
import { objectiveScreen, spacecraftScreen, launchScreen, metersPanel } from './screens/design.js';
import { simulationScreen, reportScreen, phasesToShow } from './screens/mission.js';
import { libraryScreen } from './screens/library.js';
import { titleScreen, setupScreen, hubScreen, globeView } from './screens/campaign.js';
import { meterDetail, METERS } from './components/meter.js';
import { modal, toast, pauseOverlay, countdownOverlay, confetti } from './components/overlays.js';
import { syncView3d } from './view3dHost.js';
import { play, toggleMute, duck } from './sound.js';
import { t, setLocale, nextLocale, localizeData, localizeList, getLocale } from '../i18n/index.js';
import { capiLine } from './capi/script.js';
import { capiPanel } from './capi/panel.js';
import { createVoice } from './capi/voice.js';
import { lessonsFor, lessonById, nextLesson, firstStage, stageAfterChange, lessonCard } from './capi/coach.js';
import { redesignStep, STEP_SCREENS } from '../engine/phases.js';

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
  badges: 'open',
  'close-badges': 'close',
  'library-tab': 'tab',
  'close-library': 'close',
  'free-play': 'pick',
  'new-campaign': 'pick',
  'confirm-new-campaign': 'pick',
  'continue-campaign': 'pick',
  'pick-country': 'pick',
  'pick-focus': 'pick',
  'found-agency': 'success',
  plan: 'pick',
  hub: 'click',
  'ops-tab': 'tab',
  language: 'click',
  'capi-voice': 'click',
  'capi-hide': 'close',
  'capi-show': 'open',
  'coach-start': 'pick',
  'coach-decline': 'click',
  'coach-skip': 'close',
  'coach-hint': 'open',
  'coach-continue': 'tab',
  'coach-review': 'open',
};

/** Screens with the Earth globe instead of a mission. */
const GLOBE_SCREENS = new Set(['menu', 'setup', 'hub']);
/** Screens that are not a mission: no pause there. */
const MENU_SCREENS = new Set(['menu', 'free', 'setup', 'hub']);

const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** Commander Capi preferences (voice on/off, help hidden), saved in the browser when it allows it. */
const CAPI_VOICE_KEY = 'tupi-orbit:capi-voice';
const CAPI_HIDDEN_KEY = 'tupi-orbit:capi-hidden';
/** Guided lessons the player has finished (any mission), and how many launches they have made. */
const CAPI_LESSONS_KEY = 'tupi-orbit:capi-lessons';
const CAPI_RUNS_KEY = 'tupi-orbit:capi-runs';
/** After this many launches, routine lines are only shown, not spoken: the player knows them by now. */
const ROUTINE_VOICE_RUNS = 3;
const ROUTINE_LINES = new Set(['briefing', 'build-intro', 'launch-choose', 'launch-ready']);

function readJson(storage, key, fallback) {
  try {
    const value = (storage ?? globalThis.localStorage)?.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(storage, key, value) {
  try {
    (storage ?? globalThis.localStorage)?.setItem(key, JSON.stringify(value));
  } catch {
    // the progress lasts until the page closes
  }
}

function readPref(storage, key, fallback) {
  try {
    const value = (storage ?? globalThis.localStorage)?.getItem(key);
    return value === null || value === undefined ? fallback : value === '1';
  } catch {
    return fallback; // blocked storage: use the default, just do not remember
  }
}

function writePref(storage, key, on) {
  try {
    (storage ?? globalThis.localStorage)?.setItem(key, on ? '1' : '0');
  } catch {
    // the choice lasts until the page closes
  }
}

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
export function mountApp(root, { store, data: baseData = gameData, storage }) {
  // The game tables. In a campaign, research and the agency funds change them (src/engine/campaign.js).
  let data = baseData;
  const syncData = () => {
    const state = store.getState();
    // Agency changes first (numbers), then the translation (texts): ids and numbers never depend on the language.
    data = localizeData(state.mode === 'campaign' ? campaignData(baseData, state.campaign) : baseData);
  };

  // Screen-only state (not part of the game): open tab, modal, toast, shaking meters.
  const ui = {
    tab: 'instrument', modal: null, toast: null, shake: new Set(), simShown: 0, countedRun: 0,
    banner: null, lastScreen: null, previewKey: null,
    showNumbers: false, // cards show dots by default; exact numbers on demand
    countdown: null, // 3, 2, 1, 0 while the launch countdown runs
    celebrate: false, // confetti after a successful simulation
    library: null, // { tab } while the Mission Library is open (screen-only, the game keeps its state)
    setup: { countryId: null, focusId: null }, // choices on the new agency screen
    opsTab: 'jobs', // command center: 'jobs' or 'research'
    campaignResult: null, // what the last report did to the agency (shown on the report)
    badges: false, // the Badges screen is open
    badgeNotice: [], // badge ids just earned (shown for a few seconds)
    reportBadges: [], // badge ids earned by the last report (shown on the report)
    poll: null, // { votes: [] } while the team votes GO / NO-GO before launch
    quiet: false, // skip the next render (a typed name is already on screen; re-rendering would steal focus)
    room: null, // other devices: { status: 'opening'|'open'|'error', code, claims: Map<peerId, player>, errorKey }
    pollResult: null, // 'go' or 'held': the last poll's result, shown on the players' devices
    // Commander Capi (src/ui/capi): the line on screen, a cue from the last real change, the lines
    // already spoken in this mission (never spoken twice) and the player's preferences.
    capi: {
      line: null,
      cue: null,
      spoken: new Set(),
      voiceOn: readPref(storage, CAPI_VOICE_KEY, true),
      hidden: readPref(storage, CAPI_HIDDEN_KEY, false),
      runs: Number(readJson(storage, CAPI_RUNS_KEY, 0)) || 0,
    },
    // Guided lessons (src/ui/capi/coach.js). `guided` is this mission's choice: null (not asked yet),
    // true or false. `active` is the lesson on screen; `done` the lessons finished in this mission;
    // `review` the last explanation (the player can read it again); `seen` the lessons ever finished.
    coach: {
      guided: null,
      active: null,
      done: new Set(),
      review: null,
      reviewing: false,
      note: null,
      seen: new Set(readJson(storage, CAPI_LESSONS_KEY, [])),
    },
  };
  let lastAction = null; // the action being run (name and value), so the lessons know what the player chose
  let roomApi = null; // the open room (src/net/room.js), if any
  let lastBroadcast = null; // the last snapshot sent to the devices (JSON), to skip repeats
  let fromRemote = false; // true while a player's device choice runs here (remoteTap)
  // Achievements profile: what the player did across all modes (src/engine/achievements.js).
  let profile = loadProfile(storage);
  // The team from last time (players and names); roles are recomputed from the rules
  const savedTeam = loadTeam(storage);
  if (savedTeam) store.update(setTeam, createTeam(savedTeam.players.length, savedTeam.players.map((player) => player.name)));
  let noticeTimer = null;
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

  // --- Commander Capi: narrator and guide (lines in src/ui/capi/script.js) ---

  // The voice has its own switch (the panel button and the V key); M only switches the effects.
  const capiView = () => ({ voiceOn: ui.capi.voiceOn, hidden: ui.capi.hidden, status: voice.status() });

  /**
   * Screen readers: each new line of Capi is announced once, from a live region outside the game area
   * (the game area is redrawn often, which would repeat or lose announcements).
   */
  const liveRegion = (() => {
    const element = document.createElement('div');
    element.className = 'sr-only';
    element.setAttribute('aria-live', 'polite');
    element.setAttribute('aria-atomic', 'true');
    (root.parentNode ?? document.body).appendChild(element);
    return element;
  })();

  /** Redraw only Capi's panel (the voice status changed), keeping keyboard focus on its buttons. */
  function refreshCapi() {
    const element = root.querySelector('.capi, .capi-show');
    if (!element || !ui.capi.line) return;
    const focused = element.contains(document.activeElement) ? document.activeElement.dataset.action : null;
    element.outerHTML = capiPanel(ui.capi.line, capiView());
    if (focused) root.querySelector(`.capi [data-action="${focused}"], .capi-show[data-action="${focused}"]`)?.focus();
  }

  const voice = createVoice({
    onChange: (status) => {
      duck(status === 'speaking' || status === 'loading'); // effects step back while she speaks
      refreshCapi();
    },
  });

  /** Capi's line for what is on screen now (null on screens where she has nothing to add). */
  function currentCapiLine(state) {
    if (ui.library || ui.badges) return null;
    if (state.screen === 'menu') return capiLine({ screen: 'menu' });
    if (!STEP_OF[state.screen] && state.screen !== 'simulation' && state.screen !== 'report') return null;
    const base = capiLine({
      screen: state.screen,
      scenario: selectScenarioData(state, data),
      content: data.content ?? {},
      data,
      evaluation: evaluate(state),
      mission: selectMission(state, data),
      simulation: state.simulation,
      shown: ui.simShown,
      runCount: state.runCount,
      cue: ui.capi.cue,
    });
    return withCoach(state, base);
  }

  // --- Guided lessons: problem -> prediction -> the gauges move -> explanation -> continue, hint or review ---

  const coachCtx = (state) => ({
    screen: state.screen,
    state,
    scenario: selectScenarioData(state, data),
    data,
    content: data.content ?? {},
    evaluation: evaluate(state),
    mission: selectMission(state, data),
  });

  /** Lessons of this mission the player has never finished (they decide if Capi offers to guide). */
  const unseenLessons = (scenarioId) => lessonsFor(scenarioId).filter((lesson) => !ui.coach.seen.has(lesson.id));

  /**
   * Add the guidance to Capi's line: the offer on the objective step, the active lesson on the design
   * steps, the review of the last explanation, and the "Guide me" / "Skip guide" choice.
   */
  function withCoach(state, base) {
    if (!base) return base;
    const coach = ui.coach;
    const lessons = lessonsFor(state.scenarioId);
    const design = state.screen === 'spacecraft' || state.screen === 'launch';
    let line = { ...base, guide: null };
    if (coach.note && coach.note.screen !== state.screen) coach.note = null;
    if (coach.note) line.detail = [line.detail, coach.note.text].filter(Boolean).join(' ');

    // First visit to a destination: offer a guided mission (optional; free play stays free).
    if (state.screen === 'objective' && coach.guided === null && unseenLessons(state.scenarioId).length) {
      return {
        ...line,
        offer: t('coach.offer'),
        actions: [
          { action: 'coach-start', label: t('coach.start'), primary: true },
          { action: 'coach-decline', label: t('coach.offerNo') },
        ],
      };
    }
    if (!design || !lessons.length) return line;
    line.guide = coach.guided === true ? 'skip' : 'start'; // repeat the guide whenever the player wants
    // The last explanation can be read again, also after the guide is over.
    if (coach.reviewing && coach.review) {
      return { ...line, id: `${base.id}:review`, say: null, lead: coach.review.title, detail: coach.review.text, coach: { ...coach.review, kind: 'review' } };
    }
    if (coach.guided !== true) return coach.review ? { ...line, reviewable: true } : line;

    const ctx = coachCtx(state);
    // One lesson at a time, on its own screen. Leaving the screen puts it back in the queue.
    if (coach.active && lessonById(coach.active.lessonId).screen !== state.screen) coach.active = null;
    if (!coach.active) {
      const lesson = nextLesson(ctx, coach.done);
      if (lesson) coach.active = { lessonId: lesson.id, stage: firstStage(lesson, ctx), change: lastAction, answer: null, hint: false };
    }
    if (!coach.active) return coach.review ? { ...line, reviewable: true } : line;

    const card = lessonCard(coach.active, ctx);
    const firstOnScreen = !lessonsFor(state.scenarioId).some((lesson) => lesson.screen === state.screen && coach.done.has(lesson.id));
    if (card.kind === 'problem' && firstOnScreen) {
      // The first problem goes with Capi's spoken sentence for this moment (same id: no repeats).
      return { ...line, detail: card.text, coach: card };
    }
    // Later problems, questions and explanations: a short caption, never the same sentence again.
    return { ...line, id: card.id, mood: card.kind === 'ask' ? 'thinking' : line.mood, say: null, lead: card.title, detail: card.text, coach: card };
  }

  /** A design change may move the active lesson: the player made the choice the problem asked for. */
  function coachAfterChange(state) {
    const active = ui.coach.active;
    if (ui.coach.guided !== true || !active) return;
    const lesson = lessonById(active.lessonId);
    if (lesson.screen !== state.screen) return;
    const next = stageAfterChange(lesson, active.stage, lastAction, coachCtx(state));
    if (next) ui.coach.active = { ...active, stage: next, change: lastAction, hint: false };
  }

  /** Finish the active lesson: keep its explanation for "Review", remember it, move on. */
  function finishLesson(state) {
    const active = ui.coach.active;
    if (!active) return;
    const card = lessonCard(active, coachCtx(state));
    ui.coach.review = { title: card.title, text: card.text, feedback: card.feedback, step: card.step, total: card.total };
    ui.coach.done.add(active.lessonId);
    ui.coach.seen.add(active.lessonId);
    writeJson(storage, CAPI_LESSONS_KEY, [...ui.coach.seen]);
    ui.coach.active = null;
    if (lessonsFor(state.scenarioId).every((lesson) => ui.coach.done.has(lesson.id))) {
      ui.coach.guided = false; // guide complete: Capi steps back and the player decides alone
      ui.coach.note = { screen: state.screen, text: t('coach.finished') };
    }
  }

  /**
   * Speak a line only when it is new (a real change of screen or state) and the moment allows it.
   * A line already said in this mission is never repeated by re-rendering; "Repeat" is the player's choice.
   */
  function syncCapiVoice(state) {
    const line = ui.capi.line;
    const quiet = state.paused || ui.countdown !== null || ui.capi.hidden || !ui.capi.voiceOn;
    if (!line) {
      voice.stop();
      ui.capi.lineId = null;
      return;
    }
    if (line.id === ui.capi.lineId) {
      if (quiet) voice.stop(); // paused, countdown, muted or hidden: never talk over it
      return;
    }
    ui.capi.lineId = line.id;
    if (!ui.capi.hidden) liveRegion.textContent = [line.lead, line.detail].filter(Boolean).join(' ');
    const routine = ROUTINE_LINES.has(line.say) && ui.capi.runs >= ROUTINE_VOICE_RUNS; // fewer words for experienced players
    if (quiet || !line.say || routine || ui.capi.spoken.has(line.id)) {
      voice.stop(); // the previous line belongs to another moment
      return;
    }
    ui.capi.spoken.add(line.id);
    voice.speak(line, getLocale());
  }

  /** A new mission: Capi may say her mission lines again (the welcome stays said). */
  function resetCapiMission() {
    ui.capi.cue = null;
    ui.coach = { ...ui.coach, guided: null, active: null, done: new Set(), review: null, reviewing: false, note: null };
    ui.capi.spoken = new Set([...ui.capi.spoken].filter((id) => id === 'menu'));
  }

  function render() {
    if (ui.quiet) {
      ui.quiet = false;
      return;
    }
    syncData();
    const state = store.getState();
    const focusKey = document.activeElement?.dataset?.action
      ? `${document.activeElement.dataset.action}|${document.activeElement.dataset.value ?? ''}`
      : null;

    ui.capi.line = currentCapiLine(state);
    const capi = capiPanel(ui.capi.line, capiView());

    let html;
    if (ui.badges) {
      const back = state.screen === 'hub' ? t('common.commandCenter') : MENU_SCREENS.has(state.screen) ? t('common.mainMenu') : t('common.backToMission');
      html = badgesScreen({ profile, backLabel: back });
    } else if (ui.library) {
      const back = state.screen === 'hub' ? t('common.commandCenter') : MENU_SCREENS.has(state.screen) ? t('common.mainMenu') : t('common.backToMission');
      const agency = state.campaign ?? loadCampaign(storage);
      html = libraryScreen({ tab: ui.library.tab, backLabel: back, unlocked: libraryUnlocked(agency), hasAgency: Boolean(agency) });
    } else if (state.screen === 'menu') {
      html = titleScreen({ saved: loadCampaign(storage), capi });
    } else if (state.screen === 'free') {
      html = menuScreen({ state, data, best: loadBest(storage), progress: currentProgress(), room: roomView() });
    } else if (state.screen === 'setup') {
      html = setupScreen({ setup: ui.setup, team: store.getState().team, room: roomView() });
    } else if (state.screen === 'hub' && state.campaign) {
      html = hubScreen({ campaign: state.campaign, data, ui });
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
        capi,
        // While Capi guides a lesson (or explains a broken limit), the next-step hint would repeat her.
        coaching: !ui.capi.hidden && Boolean(ui.capi.line?.coach || ui.capi.line?.say === 'build-limit'),
      };
      html = (SCREENS[state.screen] ?? objectiveScreen)(ctx);
    }
    if (ui.modal) html += modal(ui.modal);
    if (ui.poll && state.team) html += pollOverlay(state.team, pollConsoles(state.team, evaluate(state).budget), ui.poll.votes, roomView()?.connected);
    if (state.paused && !ui.library) html += pauseOverlay();
    if (ui.toast) html += toast(ui.toast);
    if (ui.banner) html += `<div class="stage-banner" role="status">${ui.banner}</div>`;
    if (ui.countdown !== null) html += countdownOverlay(ui.countdown);
    if (ui.celebrate) html += confetti();
    if (ui.badgeNotice.length) html += badgeNotice(ui.badgeNotice);
    root.innerHTML = html;
    root.classList.toggle('is-liftoff', ui.countdown === 0);
    ui.previewKey = null; // the meters now show the real values

    // Short entrance animation when the screen changes (PRD 8.5).
    if (state.screen !== ui.lastScreen) {
      root.firstElementChild?.classList.add('is-entering');
      ui.lastScreen = state.screen;
    }

    // Optional 3D view: only reads the chosen parts and draws them.
    if (ui.library || ui.badges || state.screen === 'free') {
      syncView3d(root, { parts: [] }, { paused: true, onReady: render });
    } else if (GLOBE_SCREENS.has(state.screen)) {
      const agency = state.screen === 'menu' ? loadCampaign(storage) : state.screen === 'hub' ? state.campaign : null;
      syncView3d(root, { parts: [], globe: globeView(agency, state.screen === 'setup' ? ui.setup.countryId : null) }, { paused: Boolean(ui.modal), onReady: render });
    } else {
      const mission = selectMission(state, data);
      syncView3d(root, { ...mission, simulation: state.simulation, shown: ui.simShown }, { paused: state.paused || Boolean(ui.modal), onReady: render });
    }

    broadcastRoom(); // the players' devices follow the game
    syncCapiVoice(state);

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

  /** Record something the player did; announce and save any badge it earns. Returns the new badge ids. */
  function trackAchievement(event) {
    const today = new Date().toISOString().slice(0, 10);
    const result = track(profile, event, today);
    if (result.profile !== profile) {
      profile = result.profile;
      saveProfile(profile, storage);
    }
    if (result.earned.length) {
      ui.badgeNotice = [...ui.badgeNotice, ...result.earned];
      setTimeout(() => play('success'), 450);
      clearTimeout(noticeTimer);
      noticeTimer = setTimeout(() => {
        ui.badgeNotice = [];
        render();
      }, 5000);
    }
    return result.earned;
  }

  /** Campaign progress that can earn badges (library discoveries, campaign finished). */
  function trackCampaign() {
    const { campaign } = store.getState();
    if (campaign) trackAchievement({ type: 'campaign', libraryFound: campaign.library.length, finished: isFinished(campaign) });
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
    const state = store.getState();
    // Capi explains the consequence of a limit the player just broke, with the engine's numbers
    // (spacecraft step only: on the launch step her readiness summary already says it).
    if (broken.length && state.screen === 'spacecraft') ui.capi.cue = { type: 'over', resource: broken[0], issue: meterIssue ?? null };
    coachAfterChange(state);
    // When Capi is already explaining this change on screen, the toast would only repeat her.
    const line = ui.capi.hidden ? null : currentCapiLine(state);
    const capiExplains = line?.say === 'build-limit' || (line?.coach && line.coach.kind !== 'problem');
    if (shown && !capiExplains) {
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
    syncData();
    const state = store.getState();
    const simulation = runSimulation(state, data);
    if (state.mode === 'campaign') {
      // The agency pays the real cost of the spacecraft and the rocket, even if the mission fails.
      store.update(setCampaign, payLaunch(state.campaign, evaluate(state).budget.budget.usedMUsd));
      ui.campaignResult = null;
    }
    ui.capi.cue = null; // a new flight: the design cues are over
    ui.capi.runs += 1; // experienced players hear fewer routine lines
    writeJson(storage, CAPI_RUNS_KEY, ui.capi.runs);
    ui.coach.active = null;
    ui.coach.reviewing = false;
    // A short record of this flight, to compare attempts in the report (and whose surprises it replayed).
    const attempt = attemptSummary(simulation, selectScenarioData(state, data), { run: state.runCount + 1, conditionsFrom: state.conditions?.run ?? null });
    store.update(launch, simulation, attempt);
    recordRun();
    ui.reportBadges = [];
    trackAchievement({ type: 'launch' });
    playTimeline();
  }

  /** Forget the last launch's reserved budget (the money is spent) before designing or launching again. */
  function settleLaunch() {
    const state = store.getState();
    if (state.mode === 'campaign' && state.campaign?.reservedMUsd) store.update(setCampaign, clearReserve(state.campaign));
    syncData();
  }

  // --- Players' own devices (multi-device team play, src/net) ---

  /** What the screens need to draw the room: status, code, link, connected players. */
  function roomView() {
    if (!ui.room) return null;
    const link = `${location.origin}${location.pathname}?sala=${ui.room.code ?? ''}`;
    return { ...ui.room, link, connected: new Set(ui.room.claims?.values() ?? []) };
  }

  /**
   * The player who may make choices on their own device now: the one whose role leads this step (see roleForStep),
   * and the mission director everywhere else (menus, command center, flight, report). Nobody during the poll or countdown.
   */
  function roomActor() {
    const state = store.getState();
    if (!state.team || ui.poll || ui.countdown !== null) return null;
    const role = roleForStep(state.screen, ui.tab) ?? 'director';
    return playerFor(state.team, role);
  }

  /** Tell every connected device what is happening now. Called after each render. */
  function broadcastRoom() {
    if (!roomApi || ui.room?.status !== 'open') return;
    const state = store.getState();
    const team = state.team;
    const role = roleForStep(state.screen, ui.tab);
    const actor = roomActor();
    const flightDone = state.screen === 'report' || (state.screen === 'simulation' && state.simulation && ui.simShown >= phasesToShow(state.simulation));
    // Everything the players' devices need to draw the same screen as this one (src/ui/mirror.js).
    // Each device draws it in its own language, with its own tab and details open; the choices of the player
    // whose turn it is come back as 'act' messages (remoteTap).
    const mirror = {
      state,
      ui: {
        tab: ui.tab, simShown: ui.simShown, opsTab: ui.opsTab, showNumbers: ui.showNumbers, setup: ui.setup,
        campaignResult: ui.campaignResult, reportBadges: ui.reportBadges, countdown: ui.countdown,
        banner: ui.banner, toast: ui.toast, celebrate: ui.celebrate, modal: ui.modal,
      },
      progress: currentProgress(),
      best: loadBest(storage),
      // The score of this launch (saved at launch, see recordRun), so every player can open the report on
      // their own device as soon as the flight ends, without waiting for "See report" here
      run: ui.lastRun && ui.lastRun.simulation === state.simulation
        ? { score: ui.lastRun.score, best: ui.lastRun.best, rewards: ui.lastRun.rewards }
        : null,
    };
    const message = snapshot({
      team,
      claims: ui.room.claims,
      screen: state.screen,
      turn: role && team ? { role, player: playerFor(team, role) } : null,
      actor,
      poll: ui.poll && team ? { votes: ui.poll.votes, consoles: pollConsoles(team, evaluate(state).budget) } : null,
      pollResult: ui.pollResult,
      outcome: flightDone ? state.simulation.outcome : null,
      mirror,
    });
    // render() runs often (timers, hover-free clicks): only send when something the devices see changed
    const text = JSON.stringify(message);
    if (text === lastBroadcast) return;
    lastBroadcast = text;
    roomApi.broadcast(message);
  }

  async function openRoom() {
    if (roomApi) return;
    ui.room = { status: 'opening', claims: new Map() };
    render();
    try {
      roomApi = await hostRoom({
        onMessage: (message, peerId) => {
          const state = store.getState();
          const effect = handleMessage({ claims: ui.room.claims, size: state.team?.players.length ?? 1, pollOpen: Boolean(ui.poll), actor: roomActor() }, peerId, message);
          if (effect.reply) roomApi.send(peerId, effect.reply);
          if (effect.claim !== undefined) {
            ui.room.claims.set(peerId, effect.claim);
            play('beep');
          }
          if (effect.vote) votePoll(effect.vote);
          else if (effect.act) remoteTap(effect.act);
          else render();
        },
        onJoin: () => {
          lastBroadcast = null; // the new device has nothing yet: send even if nothing changed
          render(); // render() also sends the snapshot to every device
        },
        onLeave: (peerId) => {
          ui.room?.claims.delete(peerId);
          render();
        },
      });
      ui.room = { status: 'open', code: roomApi.code, claims: ui.room.claims };
    } catch (error) {
      roomApi = null;
      ui.room = { status: 'error', errorKey: errorKey(error), claims: new Map() };
    }
    render();
  }

  /**
   * A player tapped a button on the shared screen on their own device: click the same button here,
   * so it follows exactly the same rules (disabled cards, countdown, sounds) as a click on this device.
   */
  function remoteTap({ action, value }) {
    const selector = value === undefined
      ? `[data-action="${CSS.escape(action)}"]`
      : `[data-action="${CSS.escape(action)}"][data-value="${CSS.escape(value)}"]`;
    const element = root.querySelector(selector);
    if (!element) {
      render(); // the screen changed meanwhile (or the Library is open here): just resend the current one
      return;
    }
    fromRemote = true; // click() runs the handlers right away, so the flag covers exactly this choice
    try {
      element.click();
    } finally {
      fromRemote = false;
    }
  }

  function closeRoom() {
    roomApi?.close();
    roomApi = null;
    ui.room = null;
    render();
  }

  /** Team play: every player votes GO / NO-GO before the countdown (like a real mission control poll). */
  function openPoll() {
    ui.pollResult = null;
    ui.poll = { votes: [] };
    play('beep');
    render();
  }

  function votePoll(value) {
    const state = store.getState();
    const [index, vote] = String(value).split(':');
    const votes = [...ui.poll.votes];
    votes[Number(index)] = vote;
    ui.poll = { votes };
    const size = state.team.players.length;
    if (votes.filter(Boolean).length < size) {
      render();
      return;
    }
    ui.poll = null;
    if (pollPassed(votes, size)) {
      ui.pollResult = 'go';
      startCountdown();
      return;
    }
    ui.pollResult = 'held';
    // Someone said NO-GO: the launch is on hold and the team talks it over
    const held = votes.map((item, at) => (item === 'no-go' ? playerName(state.team, at) : null)).filter(Boolean);
    play('error');
    showToast({ title: t('poll.heldTitle'), text: t('poll.held', { names: held.join(', ') }), tone: 'warn' });
    render();
  }

  /** In a campaign, the agency must be able to pay for the launch. */
  function prepareLaunch() {
    settleLaunch();
    const state = store.getState();
    if (state.mode === 'campaign') {
      const cost = evaluate(state).budget.budget.usedMUsd;
      if (cost > state.campaign.fundsMUsd) {
        play('error');
        showToast({ title: t('toast.noFunds'), text: t('toast.noFundsText', { cost, funds: state.campaign.fundsMUsd }), tone: 'bad' });
        render();
        return;
      }
    }
    if (isTeamPlay(state.team)) openPoll();
    else startCountdown();
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
    // Stars and rank. They never change the score.
    const simulation = state.simulation;
    const rewards = recordMission(
      currentProgress(),
      { scenarioId: state.scenarioId, outcome: simulation.outcome, total: score.total },
    );
    saveProgress(rewards.progress, storage);
    ui.lastRun = { simulation, score, best, rewards };
  }

  function openReport() {
    clearInterval(phaseTimer);
    const run = ui.lastRun;
    if (!run || run.simulation !== store.getState().simulation) recordRun();
    const { score, best, rewards } = ui.lastRun;
    const state = store.getState();
    store.update(showReport, { score, ...best, rewards });
    const budgetEntry = state.simulation?.budget?.budget;
    ui.reportBadges = trackAchievement({
      type: 'report',
      scenarioId: state.scenarioId,
      success: state.simulation?.outcome === 'success',
      score: score.total,
      tight: ['budget', 'mass', 'power', 'data', 'time'].some((key) => state.simulation?.budget?.[key]?.status === 'tight'),
      budgetRatio: budgetEntry?.limitMUsd ? budgetEntry.usedMUsd / budgetEntry.limitMUsd : undefined,
      safeEvents: (state.simulation?.events ?? []).filter((event) => !event.harmed).length,
    });
    if (state.mode === 'campaign' && state.campaign) {
      const phase = phaseOfScenario(state.scenarioId);
      const success = state.simulation?.outcome === 'success';
      const finished = finishMission(store.getState().campaign, phase?.id, { success, scienceDelivered: state.simulation?.scienceDelivered ?? 0 });
      const event = drawEvent(Math.random(), Math.random());
      const after = applyEvent(finished.campaign, event);
      const before = new Set(state.campaign.library);
      ui.campaignResult = { ...finished.result, event, phaseId: phase?.id, unlocked: after.library.filter((id) => !before.has(id)) };
      store.update(setCampaign, after);
      ui.reportBadges = [...ui.reportBadges, ...trackAchievement({ type: 'campaign', libraryFound: after.library.length, finished: isFinished(after) })];
    }
    window.scrollTo?.(0, 0);
  }

  /** Show a message window, optionally with its own buttons. */
  function showModal(title, paragraphs, actions) {
    ui.modal = { title, paragraphs, actions };
    render();
  }

  function sideJob(jobId) {
    const job = localizeList(sideJobs, 'campaign.sideJobs').find((item) => item.id === jobId);
    const { campaign, outcome } = runSideJob(store.getState().campaign, jobId, Math.random());
    if (!outcome) return;
    play(outcome.success ? 'success' : 'failure');
    store.update(setCampaign, campaign);
    trackAchievement({ type: 'sideJob' });
    trackCampaign();
    const gains = [
      outcome.fundsMUsd ? `${outcome.fundsMUsd > 0 ? '+' : ''}${outcome.fundsMUsd} M USD` : '',
      outcome.science ? t('agency.plusScience', { n: outcome.science }) : '',
    ].filter(Boolean).join(', ');
    showModal(t(outcome.success ? 'job.okTitle' : 'job.failTitle', { name: job.name }), [
      outcome.success ? t('job.ok') : t('job.fail'),
      gains ? t('job.result', { gains }) : '',
      outcome.unlocked.length ? t('job.newEntry') : '',
    ]);
  }

  const handlers = {
    'select-scenario': (value) => store.update(selectScenario, value),
    'team-size': (value) => {
      const team = resizeTeam(store.getState().team, Number(value));
      saveTeam(team, storage);
      store.update(setTeam, team);
    },
    'poll-vote': (value) => votePoll(value),
    'room-open': () => openRoom(),
    'room-close': () => closeRoom(),
    'poll-cancel': () => {
      ui.poll = null;
      render();
    },
    start: () => {
      ui.tab = 'instrument';
      resetCapiMission();
      store.update(startMission);
    },
    confirm: (value) => {
      const label = { 1: t('steps.objective'), 2: t('steps.spacecraft') }[value];
      if (label) {
        ui.banner = `✓ ${t('banner.stageComplete', { name: label })}`;
        setTimeout(() => {
          ui.banner = null;
          render();
        }, BANNER_MS);
      }
      store.update(confirmStep, Number(value));
    },
    'go-step': (value) => store.update(goToStep, Number(value)),
    menu: () => {
      const state = store.getState();
      settleLaunch();
      if (state.mode === 'campaign' && state.screen !== 'hub') store.update(goToHub);
      else store.update(goToMenu);
    },
    hub: () => {
      settleLaunch();
      store.update(goToHub);
    },
    'free-play': () => store.update(openFreePlay),
    'new-campaign': () => {
      if (loadCampaign(storage)) {
        showModal(t('newCampaign.title'), [t('newCampaign.text')], [
          { label: t('newCampaign.confirm'), action: 'confirm-new-campaign', primary: true },
          { label: t('newCampaign.keep'), action: 'close-modal' },
        ]);
        return;
      }
      handlers['confirm-new-campaign']();
    },
    'confirm-new-campaign': () => {
      ui.modal = null;
      ui.setup = { countryId: null, focusId: null };
      store.update(openSetup);
    },
    'continue-campaign': () => {
      const saved = loadCampaign(storage);
      if (saved) store.update(enterCampaign, saved);
    },
    'pick-country': (value) => {
      ui.setup = { ...ui.setup, countryId: value };
      render();
    },
    'pick-focus': (value) => {
      ui.setup = { ...ui.setup, focusId: value };
      render();
    },
    'found-agency': () => {
      const { countryId, focusId } = ui.setup;
      if (!countryId || !focusId) return;
      const campaign = createCampaign(countryId, focusId);
      saveCampaign(campaign, storage);
      ui.opsTab = 'jobs';
      store.update(enterCampaign, campaign);
      trackAchievement({ type: 'founded' });
      showModal(t('welcome.title'), [
        t('welcome.text1'),
        t('welcome.text2'),
      ]);
    },
    plan: (value) => {
      settleLaunch();
      ui.tab = 'instrument';
      resetCapiMission();
      store.update(planMission, value);
    },
    'ops-tab': (value) => {
      ui.opsTab = value;
      render();
    },
    'side-job': (value) => sideJob(value),
    research: (value) => {
      const before = store.getState().campaign;
      const after = buyResearch(before, value);
      if (after === before) return;
      play('pick');
      store.update(setCampaign, after);
      trackAchievement({ type: 'research' });
      trackCampaign();
      const item = localizeList(research, 'campaign.research').find((entry) => entry.id === value);
      showToast({ title: t('toast.research', { name: item.name }), text: item.text, tone: 'warn' });
      render();
    },
    restart: () => {
      const { scenarioId } = store.getState();
      resetCapiMission();
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
    launch: () => prepareLaunch(),
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
      settleLaunch();
      const { simulation, runCount } = store.getState();
      const failed = simulation?.failedIssue;
      const issues = failed ? [failed] : [];
      // Keep every choice and replay this flight's surprises, so one change can be compared fairly.
      // A flight that ended before the science phase never met its surprises: the next one may differ.
      const reachedScience = simulation?.phases?.some((phase) => phase.id === 'operations' && phase.ok !== null);
      // Capi invites a hypothesis on the screen the player lands on, using the real cause of the last flight.
      ui.capi.cue = {
        type: 'rebuild', run: runCount, issue: failed ?? null, screen: STEP_SCREENS[redesignStep(issues)],
        conditions: reachedScience ? 'same' : 'unknown',
      };
      store.update(redesign, issues, { sameConditions: true });
    },
    'new-conditions': () => {
      store.update(newConditions);
      prepareLaunch();
    },
    'next-mission': () => {
      const ids = data.scenarios.map((scenario) => scenario.id);
      const next = ids[(ids.indexOf(store.getState().scenarioId) + 1) % ids.length];
      ui.tab = 'instrument';
      resetCapiMission();
      store.update((state) => startMission(selectScenario(state, next)));
    },
    quiz: (value) => {
      const quiz = data.content?.scenarios?.[store.getState().scenarioId]?.quiz;
      if (!quiz || store.getState().report?.quizAnswered) return;
      play(Number(value) === quiz.answer ? 'right' : 'wrong');
      store.update(answerQuiz, Number(value), quiz.answer);
      ui.reportBadges = [...ui.reportBadges, ...trackAchievement({ type: 'quiz', scenarioId: store.getState().scenarioId, right: Number(value) === quiz.answer })];
      render();
    },
    meter: (value) => {
      const meta = data.content?.meters?.[value];
      const budget = evaluate(store.getState()).budget;
      ui.modal = { title: meta?.name ?? value, paragraphs: [meta?.text, meterDetail(value, budget)] };
      render();
    },
    library: () => {
      ui.badges = false;
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
    badges: () => {
      ui.badges = true;
      ui.library = null;
      ui.modal = null;
      if (store.getState().paused) store.update(togglePause);
      render();
      root.querySelector('.lib-scroll')?.focus();
    },
    'close-badges': () => {
      ui.badges = false;
      render();
    },
    language: () => {
      voice.stop(); // the line in the old language must not keep talking; "Repeat" says it in the new one
      setLocale(nextLocale());
      syncData();
      render();
    },
    mute: () => {
      toggleMute(); // effects only: Capi's voice has its own switch
      render();
    },
    'capi-replay': () => {
      const line = ui.capi.line;
      if (!line?.say || !ui.capi.voiceOn) return;
      ui.capi.spoken.add(line.id);
      ui.capi.lineId = line.id;
      voice.speak(line, getLocale()); // a click: the browser allows sound now
    },
    'capi-voice': () => {
      ui.capi.voiceOn = !ui.capi.voiceOn;
      writePref(storage, CAPI_VOICE_KEY, ui.capi.voiceOn);
      if (!ui.capi.voiceOn) voice.stop();
      render();
    },
    'capi-hide': () => {
      ui.capi.hidden = true;
      writePref(storage, CAPI_HIDDEN_KEY, true);
      voice.stop();
      render();
    },
    // Guided lessons: start (or repeat), decline, skip, answer, hint, continue and review.
    'coach-start': () => {
      ui.coach = { ...ui.coach, guided: true, active: null, done: new Set(), review: null, reviewing: false, note: null };
      render();
    },
    'coach-decline': () => {
      ui.coach.guided = false;
      render();
    },
    'coach-skip': () => {
      ui.coach = { ...ui.coach, guided: false, active: null, reviewing: false };
      render();
    },
    'coach-answer': (value) => {
      const active = ui.coach.active;
      if (!active || active.stage !== 'ask') return;
      ui.coach.active = { ...active, stage: 'explain', answer: value, hint: false };
      const picked = lessonCard(ui.coach.active, coachCtx(store.getState()));
      play(picked.feedback === t('coach.right') ? 'right' : 'pick');
      render();
    },
    'coach-hint': () => {
      if (!ui.coach.active) return;
      ui.coach.active = { ...ui.coach.active, hint: !ui.coach.active.hint };
      render();
    },
    'coach-continue': () => {
      if (ui.coach.reviewing) ui.coach.reviewing = false;
      else finishLesson(store.getState());
      render();
    },
    'coach-review': () => {
      if (!ui.coach.review) return;
      ui.coach.reviewing = true;
      render();
    },
    'capi-show': () => {
      ui.capi.hidden = false;
      writePref(storage, CAPI_HIDDEN_KEY, false);
      render();
    },
    'close-modal': () => {
      ui.modal = null;
      render();
    },
  };

  /** Players who joined from their own device (they choose and vote there, not here). */
  const remotePlayers = () => (ui.room?.status === 'open' ? new Set(ui.room.claims.values()) : new Set());

  /**
   * On the turn of a player who plays on their own device, this device only shows the game: its clicks and keys
   * would play in their place. Messages, pause and looking around (Library, numbers, details) still work here.
   */
  function blockedHere(action, value) {
    if (fromRemote) return false;
    if (action === 'poll-vote') {
      const player = Number(String(value).split(':')[0]);
      if (!remotePlayers().has(player)) return false;
      showToast({ title: t('room.notHereTitle'), text: t('room.voteOnDevice', { name: playerName(store.getState().team, player) }), tone: 'warn' });
      return true;
    }
    if (!REMOTE_ACTIONS.has(action) || action === 'close-modal' || action === 'pause') return false;
    const actor = roomActor();
    if (actor === null || !remotePlayers().has(actor)) return false;
    showToast({ title: t('room.notHereTitle'), text: t('room.turnOnDevice', { name: playerName(store.getState().team, actor) }), tone: 'warn' });
    return true;
  }

  /** Run an action from a click or a key, with its sound. */
  function run(action, value) {
    if (!handlers[action]) return;
    lastAction = { action, value };
    if (blockedHere(action, value)) {
      play('error');
      render();
      return;
    }
    syncData();
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
      if (reason) showToast({ title: t('toast.notPossible'), text: reason, tone: 'warn' });
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
    if (key === 'Escape' && ui.poll) {
      run('poll-cancel');
      return;
    }
    // Typing a player's name: letters, digits and Backspace belong to the text box, not to the game
    if (event.target.closest?.('input, textarea')) return;
    if ((key === 'm' || key === 'M') && !event.target.closest?.('input, textarea')) {
      run('mute');
      return;
    }
    if (key === 'v' || key === 'V') {
      run('capi-voice'); // Capi's voice on/off
      return;
    }
    if ((key === 'l' || key === 'L') && !event.target.closest?.('input, textarea')) {
      run('language');
      return;
    }
    if (ui.badges) {
      if (key === 'Escape' || key === 'Backspace') {
        event.preventDefault();
        run('close-badges');
      }
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
    if ((key === 'p' || key === 'P' || key === 'Escape') && !MENU_SCREENS.has(state.screen)) {
      event.preventDefault();
      run('pause');
      return;
    }
    if (state.paused || ui.modal || ui.poll || ui.countdown !== null) return;

    if (key === 'Enter' && event.target === document.body) {
      event.preventDefault();
      if (state.screen === 'menu') run(loadCampaign(storage) ? 'continue-campaign' : 'new-campaign');
      else if (state.screen === 'free') run('start');
      else if (state.screen === 'setup') run('found-agency');
      else if (state.screen === 'hub') {
        const next = currentPhase(state.campaign);
        if (next) run('plan', next.scenarioId);
      }
      else if (state.screen === 'launch') run('launch');
      else if (state.screen === 'simulation') {
        if (state.simulation && ui.simShown >= phasesToShow(state.simulation)) run('see-report');
        else run('skip');
      }
      else if (STEP_OF[state.screen]) run('confirm', STEP_OF[state.screen]);
    } else if (key === 'Backspace') {
      event.preventDefault();
      const step = STEP_OF[state.screen];
      if (state.screen === 'free' || state.screen === 'setup') run('menu');
      else if (step === 1) run('menu');
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
      ? t('preview.remove') : t('preview.label');
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

  // Player names: saved when the text box loses focus or Enter is pressed (no re-render while typing)
  root.addEventListener('change', (event) => {
    const input = event.target.closest?.('[data-input="player-name"]');
    if (!input) return;
    const team = renamePlayer(store.getState().team, Number(input.dataset.index), input.value);
    saveTeam(team, storage);
    ui.quiet = true;
    store.update(setTeam, team);
    ui.quiet = false; // in case nothing changed and no render ran
  });

  root.addEventListener('pointerover', showPreview);
  root.addEventListener('focusin', showPreview);
  root.addEventListener('pointerout', hidePreview);
  root.addEventListener('focusout', hidePreview);

  // Save the agency every time it changes (it lives in localStorage, like the best scores).
  let savedCampaign = store.getState().campaign;
  store.subscribe((state) => {
    if (state.campaign && state.campaign !== savedCampaign) saveCampaign(state.campaign, storage);
    savedCampaign = state.campaign;
  });
  store.subscribe(render);
  render();
}
