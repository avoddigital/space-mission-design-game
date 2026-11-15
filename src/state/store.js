// Single game state and a tiny store. No DOM.
// Data flow: UI -> actions -> state -> (engine via selectors) -> UI and view3d.

/** Fresh state for a new game (PRD section 6.7). */
export function createInitialState() {
  return {
    // 'menu' (title) | 'free' (pick any mission) | 'setup' (new agency) | 'hub' (campaign command center)
    // | 'objective' | 'spacecraft' | 'launch' | 'simulation' | 'report'
    screen: 'menu',
    mode: 'free', // 'free' (any mission, no agency) or 'campaign'
    campaign: null, // the agency (src/engine/campaign.js), only in campaign mode
    scenarioId: 'earth-observation',
    design: { partIds: [], orbitId: null, rocketId: null },
    confirmedSteps: [],
    runCount: 0, // launches in this mission
    reroll: 0, // changes the random events ("Try again with new conditions")
    simulation: null, // result of simulateMission
    report: null, // { score, isNewBest, best, quizAnswered, quizRight, quizChoice }
    attempts: [], // a short record of each flight in this mission (engine/debrief.js attemptSummary), to compare them
    conditions: null, // { eventIds, run }: replay the surprises of flight `run` ("Rebuild, same conditions")
    team: null, // { players: [{ name, roles }] } from src/engine/team.js; null means one player
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
