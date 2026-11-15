// Commander Capi's voice. Optional: the text on screen always says the same thing.
// Only the line's fixed catalog sentence is spoken (catalog.js); the mission facts under it are text only.
// - A verified recording of that sentence is played when there is one for the language.
// - Otherwise the browser's own speech synthesis reads the same sentence (free, no service, no key).
// - Nothing plays before the player has interacted with the page: browsers block it. Then the
//   status is 'blocked' and the panel offers a button to play the line.
// - A missing file, a failed load or no speech support never breaks the game: the status just
//   goes back to 'idle' (or 'unavailable') and the text stays on screen.
// No game rules here; this only plays sound.

import { playableAudio, audioUrl } from './catalog.js';

/** Speech synthesis language for each game language. */
const SPEECH_LANG = { en: 'en-US', pt: 'pt-BR', es: 'es-ES' };

/**
 * Voices that sound like a calm adult woman on common systems (macOS, Windows, Chrome, Android).
 * Only a preference: any voice in the right language works.
 */
const PREFERRED = /samantha|ava|allison|susan|victoria|karen|moira|tessa|serena|zira|aria|jenny|libby|sonia|female|luciana|francisca|fernanda|joana|catarina|monica|mónica|paulina|marisol|helena|laura|elvira|sabina/i;

/** Small pause before speaking, so stopping the previous line never swallows the next one (Chrome). */
const START_DELAY_MS = 60;

/**
 * The best voice for a language: same region first, then same language; a preferred name wins.
 * @param {{ lang: string, name: string }[]} voices
 * @param {string} locale 'en' | 'pt' | 'es'
 */
export function pickVoice(voices, locale) {
  const lang = SPEECH_LANG[locale] ?? 'en-US';
  const base = lang.slice(0, 2);
  const norm = (value) => String(value ?? '').replace('_', '-').toLowerCase();
  // Only voices that run on the device: some browsers offer online voices (localService false) that
  // send the text to a speech service. The game uses no voice service, so those are never chosen.
  const local = voices.filter((voice) => voice.localService !== false);
  const same = local.filter((voice) => norm(voice.lang) === lang.toLowerCase());
  const family = local.filter((voice) => norm(voice.lang).startsWith(base));
  const pool = same.length ? same : family;
  return pool.find((voice) => PREFERRED.test(voice.name)) ?? pool[0] ?? null;
}

/**
 * @param {{ win?: object, onChange?: (status: string) => void, setTimer?: Function }} [options]
 * @returns {{ speak: Function, stop: Function, status: () => string, lineId: () => string|null }}
 */
export function createVoice({
  win = globalThis,
  onChange = () => {},
  setTimer = (fn, ms) => setTimeout(fn, ms),
  audioFor = playableAudio, // (lineId, locale) -> verified audio or null; replaceable in tests
  urlFor = audioUrl, // (audio) -> Promise<url|null>
} = {}) {
  let status = 'idle'; // 'idle' | 'loading' | 'speaking' | 'blocked' | 'unavailable'
  let lineId = null;
  let token = 0; // each speak() or stop() gets a new token; callbacks from older lines are ignored
  let audio = null;

  const synth = () => {
    try {
      return win.speechSynthesis && win.SpeechSynthesisUtterance ? win.speechSynthesis : null;
    } catch {
      return null;
    }
  };

  function set(next, forToken) {
    if (forToken !== token || status === next) return;
    status = next;
    onChange(status);
  }

  /** Browsers allow sound only after the player clicked or pressed a key on the page. */
  function blockedByBrowser() {
    const activation = win.navigator?.userActivation;
    return Boolean(activation) && !activation.hasBeenActive;
  }

  function synthesize(text, locale, mine) {
    const speech = synth();
    if (!speech || !text) {
      set('unavailable', mine);
      return;
    }
    if (blockedByBrowser()) {
      set('blocked', mine);
      return;
    }
    set('loading', mine);
    setTimer(() => {
      if (mine !== token) return;
      try {
        const utterance = new win.SpeechSynthesisUtterance(text);
        utterance.lang = SPEECH_LANG[locale] ?? 'en-US';
        const voices = speech.getVoices?.() ?? [];
        const voice = pickVoice(voices, locale);
        // Voices are listed, but none on the device for this language: stay silent rather than go online.
        if (!voice && voices.length) {
          set('unavailable', mine);
          return;
        }
        if (voice) utterance.voice = voice;
        utterance.rate = 0.95;
        utterance.onstart = () => set('speaking', mine);
        utterance.onend = () => set('idle', mine);
        // When we stop a line ourselves, its token is old and set() ignores it; any other
        // interruption (the browser, another tab) just ends the line.
        utterance.onerror = (event) => set(event?.error === 'not-allowed' ? 'blocked' : 'idle', mine);
        speech.speak(utterance);
      } catch {
        set('unavailable', mine);
      }
    }, START_DELAY_MS);
  }

  async function playClip(clip, fallbackText, locale, mine) {
    set('loading', mine);
    const url = await urlFor(clip);
    if (mine !== token) return;
    if (!url || !win.Audio) {
      synthesize(fallbackText, locale, mine); // file missing: read the text instead
      return;
    }
    try {
      audio = new win.Audio(url);
      audio.preload = 'auto';
      audio.volume = 1; // the narration plays at full level; the effects are lowered meanwhile (sound.js duck)
      audio.onended = () => set('idle', mine);
      audio.onerror = () => {
        if (mine === token) synthesize(fallbackText, locale, mine);
      };
      await audio.play();
      set('speaking', mine);
    } catch (error) {
      if (mine !== token) return;
      if (error?.name === 'NotAllowedError') set('blocked', mine);
      else synthesize(fallbackText, locale, mine);
    }
  }

  /** Stop whatever is playing. Safe to call any time. */
  function stop() {
    token += 1;
    if (audio) {
      try {
        audio.pause();
      } catch {
        // nothing to stop
      }
      audio.onended = null;
      audio.onerror = null;
      audio = null;
    }
    try {
      synth()?.cancel();
    } catch {
      // nothing to stop
    }
    if (status !== 'idle' && status !== 'unavailable') {
      status = 'idle';
      onChange(status);
    }
  }

  /**
   * Say a line's catalog sentence. Stops the previous line first. Lines without `say` are never spoken.
   * @param {{ id: string, say: string|null, lead: string }} line from script.js (`lead` is the sentence, localized)
   * @param {string} locale
   */
  function speak(line, locale) {
    stop();
    if (!line?.say) return;
    const mine = token;
    lineId = line.id;
    const audio = audioFor(line.say, locale);
    if (audio) playClip(audio, line.lead, locale, mine);
    else synthesize(line.lead, locale, mine);
  }

  return {
    speak,
    stop,
    status: () => status,
    lineId: () => lineId,
  };
}
