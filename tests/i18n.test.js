import { describe, it, expect, afterEach } from 'vitest';
import { dictionaries, translations, t, setLocale, getLocale, localizeData, localizeList, overlay, LOCALES } from '../src/i18n/index.js';
import { gameData } from '../src/state/selectors.js';
import { libraryMissions, libraryTopics, challengeResources } from '../src/data/library.js';
import { countries, focuses, phases, sideJobs, research, agencyEvents } from '../src/data/campaign.js';

// Every language must have every text, with the same {placeholders}, and translations must never
// change ids, numbers, links or the number of facts. The game rules only read ids and numbers.

const placeholders = (text) => (String(text).match(/\{\w+\}/g) ?? []).sort().join(',');
const others = LOCALES.map((locale) => locale.id).filter((id) => id !== 'en');

afterEach(() => setLocale('en'));

describe('interface dictionaries', () => {
  it.each(others)('%s has every English key, with the same placeholders', (id) => {
    const en = dictionaries.en;
    const dict = dictionaries[id];
    const missing = Object.keys(en).filter((key) => !(key in dict));
    expect(missing).toEqual([]);
    for (const key of Object.keys(en)) expect(placeholders(dict[key]), `${id}: ${key}`).toBe(placeholders(en[key]));
    const extra = Object.keys(dict).filter((key) => !(key in en));
    expect(extra).toEqual([]);
  });

  it('fills placeholders and falls back to English, then to the key', () => {
    setLocale('pt');
    expect(t('free.missionN', { n: 2 })).toBe('Missão 2');
    expect(t('no.such.key')).toBe('no.such.key');
    setLocale('xx');
    expect(getLocale()).toBe('pt');
  });
});

const tables = {
  parts: gameData.parts,
  rockets: gameData.rockets,
  orbits: gameData.orbits,
  scenarios: gameData.scenarios,
  events: gameData.events,
  'library.missions': libraryMissions,
  'library.topics': libraryTopics,
  'campaign.countries': countries,
  'campaign.focuses': focuses,
  'campaign.phases': phases,
  'campaign.sideJobs': sideJobs,
  'campaign.research': research,
  'campaign.agencyEvents': agencyEvents,
};
const pick = (path, source) => path.split('.').reduce((value, key) => value?.[key], source);

describe('translated tables', () => {
  it.each(others)('%s translates every item of every table, and only items that exist', (id) => {
    for (const [path, list] of Object.entries(tables)) {
      const map = pick(path, translations[id]);
      expect(map, `${id}: ${path}`).toBeTruthy();
      const ids = list.map((item) => item.id);
      expect(Object.keys(map).sort(), `${id}: ${path}`).toEqual([...ids].sort());
    }
    expect(Object.keys(translations[id].library.resources)).toHaveLength(challengeResources.length);
  });

  it.each(others)('%s keeps ids, numbers, links and the number of facts', (id) => {
    setLocale(id);
    const data = localizeData(gameData);
    for (const key of ['parts', 'rockets', 'orbits', 'scenarios']) {
      data[key].forEach((item, index) => {
        const base = gameData[key][index];
        for (const [field, value] of Object.entries(base)) {
          if (typeof value === 'number' || field === 'id' || Array.isArray(value)) expect(item[field], `${key}.${base.id}.${field}`).toEqual(value);
        }
      });
    }
    for (const [path, list] of [['library.missions', libraryMissions], ['library.topics', libraryTopics]]) {
      localizeList(list, path).forEach((item, index) => {
        const base = list[index];
        expect(item.facts).toHaveLength(base.facts.length);
        item.facts.forEach((fact, n) => expect(fact.source).toBe(base.facts[n].source));
        expect(item.url).toBe(base.url);
        expect(item.image?.src).toBe(base.image?.src);
        expect(item.image?.page).toBe(base.image?.page);
      });
    }
  });

  it.each(others)('%s keeps the placeholders of every player text in content and events', (id) => {
    setLocale(id);
    const data = localizeData(gameData);
    for (const [code, entry] of Object.entries(gameData.content.issues)) {
      for (const field of ['title', 'text', 'tip', 'learn']) expect(placeholders(data.content.issues[code][field]), `${code}.${field}`).toBe(placeholders(entry[field]));
    }
    gameData.events.forEach((event, index) => {
      for (const field of ['safeText', 'hurtText']) expect(placeholders(data.events[index][field]), `${event.id}.${field}`).toBe(placeholders(event[field]));
    });
    for (const [scenarioId, text] of Object.entries(gameData.content.scenarios)) {
      const local = data.content.scenarios[scenarioId];
      expect(local.realMissions).toHaveLength(text.realMissions.length);
      local.realMissions.forEach((mission, n) => expect(mission.url).toBe(text.realMissions[n].url));
      expect(local.quiz.options).toHaveLength(text.quiz.options.length);
      expect(local.quiz.answer).toBe(text.quiz.answer);
    }
  });

  it('returns the English tables unchanged in English', () => {
    setLocale('en');
    expect(localizeData(gameData)).toBe(gameData);
  });

  it('merges objects by key and arrays by position, never changing the type of a value', () => {
    expect(overlay({ a: 1, b: 'x', c: [{ t: 'one', s: 'u' }] }, { b: 'y', c: [{ t: 'um' }], a: 'not a number' }))
      .toEqual({ a: 1, b: 'y', c: [{ t: 'um', s: 'u' }] });
  });
});
