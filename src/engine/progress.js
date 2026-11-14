// Player progress: stars per mission, badges and rank. Pure functions, no DOM.
// It never changes the 0 to 100 mission score; it only rewards good engineering habits.

/** Stars for one mission result: 1 for success, 2 from 70 points, 3 from 90 points. */
export const STAR_THRESHOLDS = Object.freeze([70, 90]);

export function starsFor(outcome, total) {
  if (outcome !== 'success') return 0;
  return 1 + STAR_THRESHOLDS.filter((threshold) => total >= threshold).length;
}

/** Ranks by total stars (3 missions x 3 stars = 9 at most). */
export const RANKS = Object.freeze([
  { name: 'Cadet', minStars: 0 },
  { name: 'Engineer', minStars: 3 },
  { name: 'Flight Director', minStars: 6 },
  { name: 'Mission Architect', minStars: 9 },
]);

export function totalStars(progress) {
  return Object.values(progress.byScenario).reduce((sum, item) => sum + (item.stars ?? 0), 0);
}

/** Current rank and what is needed for the next one. */
export function rankFor(stars) {
  const index = RANKS.reduce((found, rank, position) => (stars >= rank.minStars ? position : found), 0);
  const next = RANKS[index + 1] ?? null;
  return { ...RANKS[index], level: index + 1, next: next ? { name: next.name, starsNeeded: next.minStars - stars } : null };
}

/**
 * Badges. Each one rewards a habit real mission designers have.
 * `check` gets { result, before, after, scenarioCount } and returns true when earned.
 */
export const ACHIEVEMENTS = Object.freeze([
  { id: 'first-launch', icon: '🚀', name: 'First Launch', description: 'Launch your first mission.', check: () => true },
  { id: 'mission-accomplished', icon: '🛰️', name: 'Mission Accomplished', description: 'Complete a mission successfully.', check: ({ result }) => result.outcome === 'success' },
  {
    id: 'learn-from-failure',
    icon: '🔧',
    name: 'Learn from Failure',
    description: 'Succeed in a mission after it failed once.',
    check: ({ result, before }) => result.outcome === 'success' && Boolean(before.byScenario[result.scenarioId]?.failedOnce),
  },
  {
    id: 'margin-master',
    icon: '🛡️',
    name: 'Margin Master',
    description: 'Survive two surprises in one mission without any damage.',
    check: ({ result }) => result.outcome === 'success' && result.events.length >= 2 && result.events.every((event) => !event.harmed),
  },
  {
    id: 'budget-hawk',
    icon: '💰',
    name: 'Budget Hawk',
    description: 'Succeed with at least 30% of the budget left.',
    check: ({ result }) => result.outcome === 'success' && result.budgetLeftRatio >= 0.3,
  },
  {
    id: 'tight-but-valid',
    icon: '🎯',
    name: 'Tight but Valid',
    description: 'Succeed with a resource between 95% and 100% of its limit.',
    check: ({ result }) => result.outcome === 'success' && result.tight,
  },
  {
    id: 'science-star',
    icon: '🔭',
    name: 'Science Star',
    description: 'Send home twice the science the mission asked for.',
    check: ({ result }) => result.outcome === 'success' && result.scienceDelivered >= 2 * result.minScience,
  },
  { id: 'top-score', icon: '⭐', name: 'Top Score', description: 'Earn 3 stars in a mission (90 points or more).', check: ({ result }) => starsFor(result.outcome, result.total) === 3 },
  {
    id: 'explorer',
    icon: '🌍',
    name: 'Explorer',
    description: 'Complete Earth, Moon and Mars missions.',
    check: ({ after, scenarioCount }) => Object.values(after.byScenario).filter((item) => item.stars > 0).length >= scenarioCount,
  },
  { id: 'mission-expert', icon: '🏅', name: 'Mission Expert', description: 'Answer a mission quiz correctly.', check: () => false }, // earned in recordQuiz
]);

export function emptyProgress() {
  return { version: 1, launches: 0, byScenario: {}, achievements: {} };
}

function unlock(progress, ids, when) {
  const fresh = ids.filter((id) => !progress.achievements[id]);
  if (!fresh.length) return { progress, unlocked: [] };
  const achievements = { ...progress.achievements };
  fresh.forEach((id) => {
    achievements[id] = when;
  });
  return { progress: { ...progress, achievements }, unlocked: fresh };
}

/**
 * Record one finished mission.
 * @param {object} before saved progress
 * @param {{ scenarioId: string, outcome: string, total: number, events: object[], budgetLeftRatio: number,
 *   tight: boolean, scienceDelivered: number, minScience: number }} result
 * @param {{ scenarioCount: number, when?: string }} options
 * @returns {{ progress: object, starsBefore: number, starsNow: number, unlocked: string[], rankBefore: object, rankNow: object }}
 */
export function recordMission(before, result, { scenarioCount, when = new Date().toISOString() }) {
  const previous = before.byScenario[result.scenarioId] ?? { stars: 0, best: 0, attempts: 0, failedOnce: false };
  const stars = starsFor(result.outcome, result.total);
  const entry = {
    stars: Math.max(previous.stars, stars),
    best: Math.max(previous.best, result.outcome === 'success' ? result.total : 0),
    attempts: previous.attempts + 1,
    failedOnce: previous.failedOnce || result.outcome !== 'success',
  };
  const after = { ...before, launches: before.launches + 1, byScenario: { ...before.byScenario, [result.scenarioId]: entry } };
  const earned = ACHIEVEMENTS.filter((badge) => badge.check({ result, before, after, scenarioCount })).map((badge) => badge.id);
  const { progress, unlocked } = unlock(after, earned, when);
  return {
    progress,
    starsBefore: previous.stars,
    starsNow: stars,
    unlocked,
    rankBefore: rankFor(totalStars(before)),
    rankNow: rankFor(totalStars(progress)),
  };
}

/** Record a correct quiz answer. */
export function recordQuiz(before, right, { when = new Date().toISOString() } = {}) {
  return right ? unlock(before, ['mission-expert'], when) : { progress: before, unlocked: [] };
}

export function achievementById(id) {
  return ACHIEVEMENTS.find((badge) => badge.id === id) ?? null;
}

/**
 * Progress for players who already have best scores from before badges existed:
 * each best score (only successful missions are saved) becomes its stars.
 * @param {{ byScenario: Record<string, number> }} best
 */
export function progressFromBest(best) {
  const progress = emptyProgress();
  for (const [scenarioId, score] of Object.entries(best?.byScenario ?? {})) {
    progress.byScenario[scenarioId] = { stars: starsFor('success', score), best: score, attempts: 0, failedOnce: false };
  }
  return progress;
}
