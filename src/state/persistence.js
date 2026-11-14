// Best score per scenario in localStorage. Every access is wrapped in try/catch:
// in private windows or with blocked storage the game keeps working, it just does not save.

import { isCampaign } from '../engine/campaign.js';
import { createProfile, isProfile } from '../engine/achievements.js';

export const BEST_KEY = 'space-mission-design-game:best-v1';
export const CAMPAIGN_KEY = 'space-mission-design-game:campaign-v1';
export const PROFILE_KEY = 'space-mission-design-game:profile-v1';

function defaultStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // some browsers throw just for reading localStorage
  }
}

/** @returns {{ byScenario: Record<string, number> }} */
export function loadBest(storage = defaultStorage()) {
  try {
    const parsed = JSON.parse(storage?.getItem(BEST_KEY) ?? 'null');
    if (parsed && typeof parsed.byScenario === 'object' && parsed.byScenario !== null) return parsed;
  } catch {
    // Broken or blocked storage: start from nothing.
  }
  return { byScenario: {} };
}

/**
 * Save the score if it beats the best one for that scenario.
 * @returns {{ isNewBest: boolean, best: number }}
 */
export function saveBest(scenarioId, score, storage = defaultStorage()) {
  const data = loadBest(storage);
  const previous = data.byScenario[scenarioId];
  if (previous !== undefined && score <= previous) return { isNewBest: false, best: previous };

  const next = { byScenario: { ...data.byScenario, [scenarioId]: score } };
  try {
    storage?.setItem(BEST_KEY, JSON.stringify(next));
  } catch {
    // Could not save (blocked or full): the new best still counts for this session.
  }
  return { isNewBest: true, best: score };
}

/** The saved campaign, or null (nothing saved, an old version, or blocked storage). */
export function loadCampaign(storage = defaultStorage()) {
  try {
    const parsed = JSON.parse(storage?.getItem(CAMPAIGN_KEY) ?? 'null');
    return isCampaign(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Save the campaign (or remove it with null). Fails silently: the game keeps working. */
export function saveCampaign(campaign, storage = defaultStorage()) {
  try {
    if (campaign) storage?.setItem(CAMPAIGN_KEY, JSON.stringify(campaign));
    else storage?.removeItem(CAMPAIGN_KEY);
  } catch {
    // blocked or full storage
  }
}

/** The player's achievements profile (shared by Free mission and the campaign). */
export function loadProfile(storage = defaultStorage()) {
  try {
    const parsed = JSON.parse(storage?.getItem(PROFILE_KEY) ?? 'null');
    return isProfile(parsed) ? parsed : createProfile();
  } catch {
    return createProfile();
  }
}

export function saveProfile(profile, storage = defaultStorage()) {
  try {
    storage?.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // blocked or full storage: badges still work for this session
  }
}
