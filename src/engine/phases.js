// Links each issue code to the simulation phase where the mission fails
// and to the game step where the player can fix it (PRD table 7.3).
// Pure functions, no DOM.

/** Simulation phases, in the order they happen. */
export const PHASES = Object.freeze(['launch', 'transfer', 'operations', 'data']);

/** Game steps (1 to 5) and the screen of each one. */
export const STEP_SCREENS = Object.freeze({
  1: 'objective',
  2: 'spacecraft',
  3: 'launch',
  4: 'simulation',
  5: 'report',
});

const ROUTES = {
  NO_ROCKET: { phase: 'launch', step: 3 },
  ROCKET_CANNOT_REACH_ORBIT: { phase: 'launch', step: 3 },
  PAYLOAD_TOO_HEAVY: { phase: 'launch', step: 3 },
  OVER_BUDGET: { phase: 'launch', step: 2 },
  NO_ORBIT: { phase: 'transfer', step: 3 },
  ORBIT_NOT_ALLOWED: { phase: 'transfer', step: 3 },
  POWER_DEFICIT: { phase: 'operations', step: 2 },
  OVER_TIME: { phase: 'operations', step: 3 },
  ORBIT_DECAY: { phase: 'operations', step: 3 }, // P1, not produced by the engine yet
  NO_COMMS: { phase: 'data', step: 2 },
  // Science below the goal after random events (simulation, step 6).
  LOW_SCIENCE: { phase: 'data', step: 2 },
  // Warnings never stop the mission, but the checklist can still send the player to fix them.
  LOW_MASS_MARGIN: { phase: null, step: 3 },
  DATA_BACKLOG: { phase: null, step: 2 },
};

/**
 * Where an issue makes the mission fail, and which step fixes it.
 * @returns {{ phase: string|null, step: number }}
 */
export function issueRoute(issue) {
  if (issue.code === 'MISSING_REQUIRED_TYPE') {
    // A missing antenna stops the data from coming home; a missing instrument or power part stops operations.
    return { phase: issue.type === 'comms' ? 'data' : 'operations', step: 2 };
  }
  return ROUTES[issue.code] ?? { phase: null, step: 2 };
}

/** The error that stops the mission first, following the phase order. Null if there are no errors. */
export function firstError(issues) {
  const errors = issues.filter((issue) => issue.severity === 'error');
  if (errors.length === 0) return null;
  const order = (issue) => {
    const index = PHASES.indexOf(issueRoute(issue).phase);
    return index === -1 ? PHASES.length : index;
  };
  return errors.reduce((first, issue) => (order(issue) < order(first) ? issue : first));
}

/** The step "Redesign mission" goes back to: the one that fixes the first error (step 2 if none). */
export function redesignStep(issues) {
  const error = firstError(issues);
  return error ? issueRoute(error).step : 2;
}
