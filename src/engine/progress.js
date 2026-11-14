// Player progress: stars per mission and rank. Pure functions, no DOM.
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

export function emptyProgress() {
  return { version: 1, launches: 0, byScenario: {}, achievements: {} };
}

/**
 * Record one finished mission: best stars and best score per scenario.
 * Badges are not here: they live in src/engine/achievements.js.
 * @param {object} before saved progress
 * @param {{ scenarioId: string, outcome: string, total: number }} result
 * @returns {{ progress: object, starsBefore: number, starsNow: number, rankBefore: object, rankNow: object }}
 */
export function recordMission(before, result) {
  const previous = before.byScenario[result.scenarioId] ?? { stars: 0, best: 0, attempts: 0, failedOnce: false };
  const stars = starsFor(result.outcome, result.total);
  const entry = {
    stars: Math.max(previous.stars, stars),
    best: Math.max(previous.best, result.outcome === 'success' ? result.total : 0),
    attempts: previous.attempts + 1,
    failedOnce: previous.failedOnce || result.outcome !== 'success',
  };
  const progress = { ...before, launches: before.launches + 1, byScenario: { ...before.byScenario, [result.scenarioId]: entry } };
  return {
    progress,
    starsBefore: previous.stars,
    starsNow: stars,
    rankBefore: rankFor(totalStars(before)),
    rankNow: rankFor(totalStars(progress)),
  };
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
