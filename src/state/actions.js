// Pure actions: each one takes the state (and arguments) and returns a new state.
// They never change the old state and never touch the DOM.
// Use them through the store: store.update(togglePart, 'hd-camera').

import { STEP_SCREENS, redesignStep } from '../engine/phases.js';

const EMPTY_DESIGN = Object.freeze({ partIds: [], orbitId: null, rocketId: null });

const withDesign = (state, changes) => ({ ...state, design: { ...state.design, ...changes } });

// --- Navigation ---

export function selectScenario(state, scenarioId) {
  return {
    ...state,
    scenarioId,
    design: { ...EMPTY_DESIGN, partIds: [] },
    confirmedSteps: [],
    runCount: 0,
    simulation: null,
    report: null,
  };
}

export function startMission(state) {
  return { ...state, screen: STEP_SCREENS[1], paused: false };
}

/** Mark a design step (1 to 3) as done and move to the next one. Launching is its own action. */
export function confirmStep(state, step) {
  const confirmedSteps = state.confirmedSteps.includes(step) ? state.confirmedSteps : [...state.confirmedSteps, step];
  const screen = step < 3 ? STEP_SCREENS[step + 1] : state.screen;
  return { ...state, confirmedSteps, screen };
}

export function goToStep(state, step) {
  const screen = STEP_SCREENS[step];
  return screen && screen !== state.screen ? { ...state, screen } : state;
}

export function goToMenu(state) {
  return { ...state, screen: 'menu', paused: false };
}

// --- Spacecraft design ---

/** Add or remove a part (used for instruments). */
export function togglePart(state, partId) {
  const { partIds } = state.design;
  const next = partIds.includes(partId) ? partIds.filter((id) => id !== partId) : [...partIds, partId];
  return withDesign(state, { partIds: next });
}

/** Keep only one part of a type: choosing a new one replaces the old one. */
function setSinglePart(state, partId, type, parts) {
  const typeOf = (id) => parts.find((part) => part.id === id)?.type;
  const others = state.design.partIds.filter((id) => typeOf(id) !== type);
  return withDesign(state, { partIds: [...others, partId] });
}

/** Choose the power source. `parts` is the parts table, used to find the old power part. */
export function setPower(state, partId, parts) {
  return setSinglePart(state, partId, 'power', parts);
}

/** Choose the antenna. `parts` is the parts table, used to find the old antenna. */
export function setComms(state, partId, parts) {
  return setSinglePart(state, partId, 'comms', parts);
}

export function setOrbit(state, orbitId) {
  return withDesign(state, { orbitId });
}

export function setRocket(state, rocketId) {
  return withDesign(state, { rocketId });
}

// --- Mission ---

/** Go to the simulation. The simulation result itself is added in build step 6. */
export function launch(state) {
  return { ...state, screen: STEP_SCREENS[4], runCount: state.runCount + 1, simulation: null, report: null, paused: false };
}

/** Back to the step that fixes the first error, keeping every choice. */
export function redesign(state, issues = []) {
  return { ...state, screen: STEP_SCREENS[redesignStep(issues)], simulation: null, report: null, paused: false };
}

export function togglePause(state) {
  return { ...state, paused: !state.paused };
}

/** The quiz can be answered only once. */
export function answerQuiz(state, choice, rightAnswer) {
  if (state.report?.quizAnswered) return state;
  return {
    ...state,
    report: { ...state.report, quizAnswered: true, quizChoice: choice, quizRight: choice === rightAnswer },
  };
}
