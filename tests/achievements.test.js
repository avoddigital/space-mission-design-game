import { describe, it, expect } from 'vitest';
import { ACHIEVEMENTS, createProfile, isProfile, record, award, track } from '../src/engine/achievements.js';
import { dictionaries } from '../src/i18n/index.js';

const DATE = '2026-11-14';
const win = (scenarioId, extra = {}) => ({ type: 'report', scenarioId, success: true, score: 50, tight: false, budgetRatio: 0.9, safeEvents: 0, ...extra });
const lose = (scenarioId) => ({ type: 'report', scenarioId, success: false });

describe('achievements', () => {
  it('has unique ids and a name and description in every language', () => {
    const ids = ACHIEVEMENTS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const lang of Object.keys(dictionaries)) {
      for (const id of ids) {
        expect(dictionaries[lang][`ach.${id}.name`], `${lang} ${id} name`).toBeTruthy();
        expect(dictionaries[lang][`ach.${id}.desc`], `${lang} ${id} desc`).toBeTruthy();
      }
    }
  });

  it('starts empty and awards the first launch once', () => {
    const profile = createProfile();
    expect(isProfile(profile)).toBe(true);
    const first = track(profile, { type: 'launch' }, DATE);
    expect(first.earned).toEqual(['first-launch']);
    expect(first.profile.earned['first-launch']).toBe(DATE);
    expect(track(first.profile, { type: 'launch' }, DATE).earned).toEqual([]);
  });

  it('rewards learning from a failure on the same mission', () => {
    let profile = record(createProfile(), lose('moon-exploration'));
    const result = track(profile, win('moon-exploration'), DATE);
    expect(result.earned).toEqual(expect.arrayContaining(['first-success', 'comeback', 'moon']));
    profile = record(createProfile(), lose('earth-observation'));
    expect(track(profile, win('moon-exploration'), DATE).earned).not.toContain('comeback');
  });

  it('awards skill patches from the report', () => {
    const { earned } = track(createProfile(), win('earth-observation', { score: 85, tight: true, budgetRatio: 0.6, safeEvents: 1 }), DATE);
    expect(earned).toEqual(expect.arrayContaining(['top-engineer', 'tight-margin', 'budget-saver', 'storm-proof', 'earth']));
  });

  it('counts quizzes per mission, side jobs, research and library discoveries', () => {
    let profile = createProfile();
    for (const id of ['earth-observation', 'earth-observation', 'moon-exploration']) profile = record(profile, { type: 'quiz', scenarioId: id, right: true });
    expect(award(profile, DATE).earned).not.toContain('quiz-master');
    profile = record(profile, { type: 'quiz', scenarioId: 'mars-study', right: true });
    for (let i = 0; i < 5; i += 1) profile = record(profile, { type: 'sideJob' });
    for (let i = 0; i < 3; i += 1) profile = record(profile, { type: 'research' });
    profile = record(profile, { type: 'campaign', libraryFound: 10, finished: true });
    profile = record(profile, { type: 'founded' });
    expect(award(profile, DATE).earned).toEqual(expect.arrayContaining(['quiz-master', 'side-jobs', 'researcher', 'curious', 'to-mars', 'founder']));
  });

  it('ignores unknown events', () => {
    const profile = createProfile();
    expect(record(profile, { type: 'nothing' })).toBe(profile);
  });
});
