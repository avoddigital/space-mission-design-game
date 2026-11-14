// Player achievements ("mission patches"). Pure functions, no DOM.
// The profile counts what the player did across Free mission and the campaign; it is saved in localStorage.
// Names and descriptions are in the language files (keys ach.<id>.name and ach.<id>.desc).

export const PROFILE_VERSION = 1;

/** Each patch: id, icon, group (for sorting) and the rule that earns it. */
export const ACHIEVEMENTS = Object.freeze([
  { id: 'first-launch', icon: 'rocket', group: 'start', test: (p) => p.launches >= 1 },
  { id: 'first-success', icon: 'check', group: 'start', test: (p) => p.successes >= 1 },
  { id: 'comeback', icon: 'wrench', group: 'learning', test: (p) => p.flags.comeback },
  { id: 'earth', icon: 'planet', group: 'destinations', test: (p) => Boolean(p.won['earth-observation']) },
  { id: 'moon', icon: 'moon', group: 'destinations', test: (p) => Boolean(p.won['moon-exploration']) },
  { id: 'mars', icon: 'planet', group: 'destinations', test: (p) => Boolean(p.won['mars-study']) },
  { id: 'top-engineer', icon: 'star', group: 'skill', test: (p) => p.flags.score80 },
  { id: 'tight-margin', icon: 'mass', group: 'skill', test: (p) => p.flags.tight },
  { id: 'budget-saver', icon: 'budget', group: 'skill', test: (p) => p.flags.saver },
  { id: 'storm-proof', icon: 'shield', group: 'skill', test: (p) => p.flags.stormProof },
  { id: 'quiz-master', icon: 'bulb', group: 'learning', test: (p) => p.quiz.length >= 3 },
  { id: 'founder', icon: 'flag', group: 'agency', test: (p) => p.flags.founded },
  { id: 'researcher', icon: 'science', group: 'agency', test: (p) => p.research >= 3 },
  { id: 'side-jobs', icon: 'dice', group: 'agency', test: (p) => p.sideJobs >= 5 },
  { id: 'curious', icon: 'book', group: 'learning', test: (p) => p.libraryFound >= 10 },
  { id: 'to-mars', icon: 'orbit', group: 'agency', test: (p) => p.flags.campaignDone },
]);

export function createProfile() {
  return {
    version: PROFILE_VERSION,
    launches: 0,
    successes: 0,
    failed: {}, // scenarioId -> failures before the first success
    won: {}, // scenarioId -> successes
    quiz: [], // scenario ids whose quiz was answered right
    sideJobs: 0,
    research: 0,
    libraryFound: 0,
    flags: {},
    earned: {}, // achievement id -> date earned (YYYY-MM-DD)
  };
}

export function isProfile(value) {
  return Boolean(value && value.version === PROFILE_VERSION && value.earned && value.flags && value.won);
}

/** Scores and ratios that make a report special (kept here so the rules stay in one place). */
export const TOP_SCORE = 80;
export const SAVER_RATIO = 0.7;

/**
 * Record something the player did. Returns a new profile.
 * @param {object} profile
 * @param {{ type: string, [key: string]: unknown }} event
 *   launch | report { scenarioId, success, score, tight, budgetRatio, safeEvents } | quiz { scenarioId, right }
 *   | founded | sideJob | research | campaign { libraryFound, finished }
 */
export function record(profile, event) {
  const next = { ...profile, flags: { ...profile.flags }, won: { ...profile.won }, failed: { ...profile.failed } };
  switch (event.type) {
    case 'launch':
      next.launches += 1;
      break;
    case 'report': {
      const id = event.scenarioId;
      if (!event.success) {
        if (!next.won[id]) next.failed[id] = (next.failed[id] ?? 0) + 1;
        break;
      }
      next.successes += 1;
      if (!next.won[id] && next.failed[id] > 0) next.flags.comeback = true;
      next.won[id] = (next.won[id] ?? 0) + 1;
      if (event.score >= TOP_SCORE) next.flags.score80 = true;
      if (event.tight) next.flags.tight = true;
      if (event.budgetRatio !== undefined && event.budgetRatio <= SAVER_RATIO) next.flags.saver = true;
      if (event.safeEvents > 0) next.flags.stormProof = true;
      break;
    }
    case 'quiz':
      if (event.right && !next.quiz.includes(event.scenarioId)) next.quiz = [...next.quiz, event.scenarioId];
      break;
    case 'founded':
      next.flags.founded = true;
      break;
    case 'sideJob':
      next.sideJobs += 1;
      break;
    case 'research':
      next.research += 1;
      break;
    case 'campaign':
      next.libraryFound = Math.max(next.libraryFound, event.libraryFound ?? 0);
      if (event.finished) next.flags.campaignDone = true;
      break;
    default:
      return profile;
  }
  return next;
}

/**
 * Award every achievement whose rule is now true and that was not earned yet.
 * @returns {{ profile: object, earned: string[] }} the new profile and the ids earned just now
 */
export function award(profile, date) {
  const earned = ACHIEVEMENTS.filter((item) => !profile.earned[item.id] && item.test(profile)).map((item) => item.id);
  if (!earned.length) return { profile, earned };
  const map = { ...profile.earned };
  for (const id of earned) map[id] = date;
  return { profile: { ...profile, earned: map }, earned };
}

/** Record and award in one step. */
export function track(profile, event, date) {
  return award(record(profile, event), date);
}
