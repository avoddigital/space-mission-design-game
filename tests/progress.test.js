import { describe, it, expect, beforeEach } from 'vitest';
import { starsFor, rankFor, totalStars, recordMission, emptyProgress } from '../src/engine/progress.js';
import { loadProgress, saveProgress, resetMemoryProgress, PROGRESS_KEY } from '../src/state/persistence.js';

// Stars and rank only: badges ("mission patches") are tested in tests/achievements.test.js.
const result = (overrides = {}) => ({ scenarioId: 'earth-observation', outcome: 'success', total: 68, ...overrides });
const options = {};

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
});

describe('recordMission', () => {
  it('first success: stars, best score and attempts', () => {
    const outcome = recordMission(emptyProgress(), result());
    expect(outcome.starsNow).toBe(1);
    expect(outcome.starsBefore).toBe(0);
    expect(outcome.progress.launches).toBe(1);
    expect(outcome.progress.byScenario['earth-observation']).toEqual({ stars: 1, best: 68, attempts: 1, failedOnce: false });
  });

  it('a failure counts the launch but gives no stars', () => {
    const outcome = recordMission(emptyProgress(), result({ outcome: 'failure', total: 0 }));
    expect(outcome.starsNow).toBe(0);
    expect(outcome.progress.byScenario['earth-observation']).toMatchObject({ stars: 0, best: 0, attempts: 1, failedOnce: true });
  });

  it('keeps the best stars and score across runs', () => {
    const first = recordMission(emptyProgress(), result({ total: 92 })).progress;
    const second = recordMission(first, result({ total: 60 }));
    expect(second.starsNow).toBe(1);
    expect(second.progress.byScenario['earth-observation']).toMatchObject({ stars: 3, best: 92, attempts: 2 });
  });

  it('moves the rank when stars add up', () => {
    let progress = emptyProgress();
    progress = recordMission(progress, result({ scenarioId: 'earth-observation', total: 95 })).progress;
    const outcome = recordMission(progress, result({ scenarioId: 'moon-exploration', total: 95 }));
    expect(outcome.rankBefore.name).toBe('Engineer');
    expect(outcome.rankNow.name).toBe('Flight Director');
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
