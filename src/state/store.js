// Single game state and a tiny store. No DOM.
// Data flow: UI -> actions -> state -> (engine via selectors) -> UI and view3d.

/** Fresh state for a new game (PRD section 6.7). */
export function createInitialState() {
  return {
    screen: 'menu', // 'menu' | 'objective' | 'spacecraft' | 'launch' | 'simulation' | 'report'
    scenarioId: 'earth-observation',
    design: { partIds: [], orbitId: null, rocketId: null },
    confirmedSteps: [],
    runCount: 0,
    simulation: null, // result of simulateMission (step 6 of the build plan)
    report: null, // { quizAnswered, quizRight, quizChoice, ... }
    team: null, // P1
    paused: false,
  };
}

/**
 * @param {object} [initialState]
 * @returns {{ getState: () => object, subscribe: (listener: Function) => Function, update: Function }}
 */
export function createStore(initialState = createInitialState()) {
  let state = initialState;
  const listeners = new Set();

  return {
    getState: () => state,

    /** Call `listener(state)` after every change. Returns a function that stops listening. */
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    /** Apply a pure action: `update(togglePart, 'hd-camera')`. Listeners run only if something changed. */
    update(action, ...args) {
      const next = action(state, ...args);
      if (next === state) return state;
      state = next;
      for (const listener of listeners) listener(state);
      return state;
    },
  };
}
