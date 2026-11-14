// Languages: English (default), Portuguese and Spanish. See docs/learning-design.md, section 8.
// - t(key, values): interface text from the dictionaries (src/i18n/en.js, pt.js, es.js).
// - localizeData(base): the game tables with translated names and texts. Ids and numbers never change,
//   so the rules in src/engine work the same in every language.
// - localizeList(list, path): the same for the Library and campaign tables.
// The choice is saved in localStorage; the first visit follows the browser language.

import { ui as en } from './en.js';
import { ui as ptUi, data as ptData } from './pt.js';
import { ui as esUi, data as esData } from './es.js';

export const LOCALES = Object.freeze([
  { id: 'en', name: 'English', short: 'EN', number: 'en-US' },
  { id: 'pt', name: 'Português', short: 'PT', number: 'pt-BR' },
  { id: 'es', name: 'Español', short: 'ES', number: 'es-ES' },
]);

const UI = { en, pt: ptUi, es: esUi };
const DATA = { en: null, pt: ptData, es: esData };
export const LANG_KEY = 'tupi-orbit:lang';

function storage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function detect() {
  try {
    const saved = storage()?.getItem(LANG_KEY);
    if (saved && UI[saved]) return saved;
  } catch {
    // blocked storage: fall back to the browser language
  }
  const browser = String(globalThis.navigator?.language ?? 'en').slice(0, 2).toLowerCase();
  return UI[browser] ? browser : 'en';
}

let locale = detect();
const dataCache = new Map(); // locale -> { base, data }

export const getLocale = () => locale;

/** Change the language and remember it. Unknown ids are ignored. */
export function setLocale(id) {
  if (!UI[id]) return locale;
  locale = id;
  try {
    storage()?.setItem(LANG_KEY, id);
  } catch {
    // the choice lasts until the page closes
  }
  if (globalThis.document?.documentElement) globalThis.document.documentElement.lang = id;
  return locale;
}

/** The next language in the list (for a one-button switcher). */
export const nextLocale = () => LOCALES[(LOCALES.findIndex((item) => item.id === locale) + 1) % LOCALES.length].id;

export const numberLocale = () => LOCALES.find((item) => item.id === locale)?.number ?? 'en-US';

/** Interface text. Missing keys fall back to English, then to the key itself (easy to spot). */
export function t(key, values = {}) {
  const template = UI[locale]?.[key] ?? en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (match, name) => (values[name] === undefined ? match : String(values[name])));
}

// --- Translated tables ---

/** Merge a translation over the English value: objects by key, arrays by position. */
export function overlay(base, over) {
  if (over === undefined || over === null) return base;
  if (Array.isArray(base)) return base.map((item, index) => overlay(item, over[index]));
  if (base && typeof base === 'object') {
    const result = { ...base };
    for (const key of Object.keys(over)) result[key] = overlay(base[key], over[key]);
    return result;
  }
  return typeof over === typeof base || base === undefined ? over : base;
}

/** A list of items with `id`, translated with a map { id: { field: text } }. */
const byId = (list, map) => (map ? list.map((item) => overlay(item, map[item.id])) : list);

const pick = (path, source) => path.split('.').reduce((value, key) => value?.[key], source);

/** Translate a list of items with `id` (Library and campaign tables). path: 'library.missions', 'campaign.research'… */
export function localizeList(list, path) {
  const map = pick(path, DATA[locale]);
  return byId(list, map);
}

/** The game tables in the current language (names, descriptions and player texts). */
export function localizeData(base) {
  const translation = DATA[locale];
  if (!translation) return base;
  const hit = dataCache.get(locale);
  if (hit?.base === base) return hit.data;
  const data = {
    ...base,
    parts: byId(base.parts, translation.parts),
    rockets: byId(base.rockets, translation.rockets),
    orbits: byId(base.orbits, translation.orbits),
    scenarios: byId(base.scenarios, translation.scenarios),
    events: byId(base.events ?? [], translation.events),
    content: overlay(base.content, translation.content),
  };
  dataCache.set(locale, { base, data });
  return data;
}

/** For tests: the raw dictionaries and translations. */
export const dictionaries = UI;
export const translations = DATA;
