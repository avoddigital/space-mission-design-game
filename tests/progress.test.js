import { describe, it, expect, beforeEach } from 'vitest';
import {
  starsFor, rankFor, totalStars, recordMission, recordQuiz, emptyProgress, ACHIEVEMENTS, achievementById,
} from '../src/engine/progress.js';
import { loadProgress, saveProgress, resetMemoryProgress, PROGRESS_KEY } from '../src/state/persistence.js';

const result = (overrides = {}) => ({
  scenarioId: 'earth-observation',
  outcome: 'success',
  total: 68,
  events: [],
  budgetLeftRatio: 0.2,
  tight: false,
  scienceDelivered: 13,
  minScience: 12,
  ...overrides,
});
const options = { scenarioCount: 3, when: 'test' };

describe('stars and rank', () => {
  it('gives 0 stars for a failure and 1 to 3 stars for a success', () => {
    expect(starsFor('failure', 95)).toBe(0);
    expect(starsFor('success', 0)).toBe(1);
    expect(starsFor('success', 69)).toBe(1);
    expect(starsFor('success', 70)).toBe(2);
    expect(starsFor('success', 90)).toBe(3);
  });

  it('ranks the player by total stars and says what is next', () => {
    expect(rankFor(0)).toMatchObject({ name: 'Cadet', level: 1, next: { name: 'Engineer', starsNeeded: 3 } });
    expect(rankFor(4)).toMatchObject({ name: 'Engineer', next: { name: 'Flight Director', starsNeeded: 2 } });
    expect(rankFor(9)).toMatchObject({ name: 'Mission Architect', level: 4, next: null });
  });

  it('every badge has an id, icon, name and description', () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(10);
    for (const badge of ACHIEVEMENTS) expect(badge).toMatchObject({ id: expect.any(String), icon: expect.any(String), name: expect.any(String), description: expect.any(String) });
    expect(achievementById('explorer').name).toBe('Explorer');
  });
});

describe('recordMission', () => {
  it('first success: stars, attempts and the first badges', () => {
    const outcome = recordMission(emptyProgress(), result(), options);
    expect(outcome.progress.byScenario['earth-observation']).toEqual({ stars: 1, best: 68, attempts: 1, failedOnce: false });
    expect(outcome.unlocked).toEqual(['first-launch', 'mission-accomplished']);
    expect(outcome).toMatchObject({ starsBefore: 0, starsNow: 1 });
  });

  it('a failure counts the launch but gives no stars', () => {
    const outcome = recordMission(emptyProgress(), result({ outcome: 'failure', total: 0 }), options);
    expect(outcome.progress.byScenario['earth-observation']).toEqual({ stars: 0, best: 0, attempts: 1, failedOnce: true });
    expect(outcome.unlocked).toEqual(['first-launch']);
  });

  it('keeps the best stars and score, and never unlocks a badge twice', () => {
    let progress = recordMission(emptyProgress(), result({ total: 92 }), options).progress;
    const again = recordMission(progress, result({ total: 50 }), options);
    expect(again.progress.byScenario['earth-observation']).toMatchObject({ stars: 3, best: 92, attempts: 2 });
    expect(again.unlocked).toEqual([]);
    progress = again.progress;
    expect(progress.achievements['top-score']).toBe('test');
  });

  it('rewards learning from failure', () => {
    const failed = recordMission(emptyProgress(), result({ outcome: 'failure', total: 0 }), options).progress;
    expect(recordMission(failed, result(), options).unlocked).toContain('learn-from-failure');
  });

  it('rewards margins, budget left, tight designs and lots of science', () => {
    const events = [{ harmed: false }, { harmed: false }];
    const outcome = recordMission(emptyProgress(), result({ events, budgetLeftRatio: 0.35, tight: true, scienceDelivered: 24 }), options);
    expect(outcome.unlocked).toEqual(expect.arrayContaining(['margin-master', 'budget-hawk', 'tight-but-valid', 'science-star']));
    const hurt = recordMission(emptyProgress(), result({ events: [{ harmed: false }, { harmed: true }] }), options);
    expect(hurt.unlocked).not.toContain('margin-master');
  });

  it('gives Explorer after succeeding in every scenario, and moves the rank', () => {
    let progress = emptyProgress();
    for (const scenarioId of ['earth-observation', 'moon-exploration']) progress = recordMission(progress, result({ scenarioId, total: 75 }), options).progress;
    const last = recordMission(progress, result({ scenarioId: 'mars-study', total: 75 }), options);
    expect(last.unlocked).toContain('explorer');
    expect(totalStars(last.progress)).toBe(6);
    expect(last.rankBefore.name).toBe('Engineer');
    expect(last.rankNow.name).toBe('Flight Director');
  });
});

describe('recordQuiz', () => {
  it('unlocks Mission Expert only for a right answer, once', () => {
    expect(recordQuiz(emptyProgress(), false).unlocked).toEqual([]);
    const first = recordQuiz(emptyProgress(), true, { when: 'test' });
    expect(first.unlocked).toEqual(['mission-expert']);
    expect(recordQuiz(first.progress, true).unlocked).toEqual([]);
  });
});

describe('progress storage', () => {
  beforeEach(() => resetMemoryProgress());
  const memoryStorage = () => {
    const items = new Map();
    return { getItem: (key) => items.get(key) ?? null, setItem: (key, value) => items.set(key, value) };
  };

  it('saves and loads progress', () => {
    const storage = memoryStorage();
    expect(loadProgress(storage)).toBeNull();
    const progress = recordMission(emptyProgress(), result(), options).progress;
    saveProgress(progress, storage);
    expect(loadProgress(storage)).toEqual(progress);
    expect(JSON.parse(storage.getItem(PROGRESS_KEY)).version).toBe(1);
  });

  it('keeps progress in memory when storage is blocked', () => {
    const blocked = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    const progress = recordMission(emptyProgress(), result(), options).progress;
    saveProgress(progress, blocked);
    expect(loadProgress(blocked)).toEqual(progress);
  });
});

describe('progressFromBest', () => {
  it('turns best scores saved before badges existed into stars', async () => {
    const { progressFromBest } = await import('../src/engine/progress.js');
    const progress = progressFromBest({ byScenario: { 'earth-observation': 68, 'moon-exploration': 92 } });
    expect(progress.byScenario['earth-observation']).toMatchObject({ stars: 1, best: 68 });
    expect(progress.byScenario['moon-exploration']).toMatchObject({ stars: 3 });
    expect(totalStars(progress)).toBe(4);
  });
});
