// Commander Capi's narration catalog: every line she can SAY, with its text and its audio per language.
//
// - The spoken sentence is fixed: no numbers, no part names, no results. The game adds those as
//   localized text under it (see script.js), so one recording works for every mission.
// - The text lives in src/i18n (key `text`), in English, Portuguese and Spanish. It is always shown on
//   screen, with or without audio, and a recording must say exactly that text.
// - Recording scripts, voice direction and the audit of the old files: docs/capi-narration.md.
//
// Audio status, per language:
//   'verified'  a person listened to the file and it says the text word for word: the game plays it.
//   'to-record' no file yet (expected at `file`); the browser's speech synthesis reads the text instead.
// Only 'verified' audio is ever played.

/** Clip files, fetched only when a verified clip plays (Vite emits them as separate assets). */
const FILES = import.meta.glob('../../assets/capi/narracao/**/*.wav', { query: '?url', import: 'default' });

export const LANGS = Object.freeze(['en', 'pt', 'es']);

/** Lines in the order they appear in a mission. `moment` groups the variants of one moment. */
const LINES = [
  { id: 'menu', moment: 'menu', text: 'capi.say.menu' },
  { id: 'briefing', moment: 'briefing', text: 'capi.say.briefing' },
  { id: 'build-intro', moment: 'build', text: 'capi.say.buildIntro' },
  { id: 'build-limit', moment: 'build', text: 'capi.say.buildLimit' },
  { id: 'launch-choose', moment: 'launch', text: 'capi.say.launchChoose' },
  { id: 'launch-blocked', moment: 'launch', text: 'capi.say.launchBlocked' },
  { id: 'launch-tight', moment: 'launch', text: 'capi.say.launchTight' },
  { id: 'launch-ready', moment: 'launch', text: 'capi.say.launchReady' },
  { id: 'event-safe', moment: 'event', text: 'capi.say.eventSafe' },
  { id: 'event-hurt', moment: 'event', text: 'capi.say.eventHurt' },
  // One sentence per real cause of failure (src/engine/diagnosis.js), never a generic "it failed".
  { id: 'failure-budget', moment: 'failure', text: 'capi.say.failureBudget' },
  { id: 'failure-launch', moment: 'failure', text: 'capi.say.failureLaunch' },
  { id: 'failure-orbit', moment: 'failure', text: 'capi.say.failureOrbit' },
  { id: 'failure-power', moment: 'failure', text: 'capi.say.failurePower' },
  { id: 'failure-time', moment: 'failure', text: 'capi.say.failureTime' },
  { id: 'failure-data', moment: 'failure', text: 'capi.say.failureData' },
  { id: 'failure-science', moment: 'failure', text: 'capi.say.failureScience' },
  { id: 'failure-events', moment: 'failure', text: 'capi.say.failureEvents' },
  { id: 'report-success', moment: 'success', text: 'capi.say.reportSuccess' },
  { id: 'rebuild', moment: 'rebuild', text: 'capi.say.rebuild' },
];

/**
 * @typedef {{ file: string, status: 'verified'|'to-record' }} Audio
 * @typedef {{ id: string, moment: string, text: string, audio: Record<string, Audio> }} NarrationLine
 * @type {NarrationLine[]}
 */
export const NARRATION = LINES.map((line) => ({
  ...line,
  // One file per line and language, src/assets/capi/narracao/<lang>/<id>.wav. All 60 were recorded in
  // Google AI Studio and confirmed by the team on 2026-11-15 (format, length and silences checked too).
  audio: Object.fromEntries(LANGS.map((lang) => [lang, { file: `${lang}/${line.id}.wav`, status: 'verified' }])),
}));

const BY_ID = new Map(NARRATION.map((line) => [line.id, line]));

/** A catalog line by id, or null. */
export const narrationLine = (id) => BY_ID.get(id) ?? null;

/** The audio that may be played for a line in a language: only a verified file. Null otherwise. */
export function playableAudio(id, locale, catalog = BY_ID) {
  const audio = catalog.get(id)?.audio?.[locale];
  return audio?.status === 'verified' ? audio : null;
}

/** URL of an audio file (async: fetched only when needed). Null if the file is missing. */
export async function audioUrl(audio) {
  const load = FILES[`../../assets/capi/narracao/${audio.file}`];
  if (!load) return null;
  try {
    return await load();
  } catch {
    return null;
  }
}
