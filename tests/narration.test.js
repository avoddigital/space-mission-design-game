// Narration integration: verified recordings play one at a time and are loaded only when needed; a missing
// or failing file falls back to the text (and a device voice); online voices are never used; the effects
// step back while Capi speaks; and no line is ever marked as recorded unless its WAV file exists.
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { createVoice, pickVoice } from '../src/ui/capi/voice.js';
import { NARRATION, LANGS } from '../src/ui/capi/catalog.js';
import { duck, effectsLevel } from '../src/ui/sound.js';

const now = (fn) => fn();
const line = { id: 'menu', say: 'menu', lead: 'Welcome.', detail: '' };
const verified = () => ({ file: 'en/menu.wav', status: 'verified' });
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

/** A fake browser with an Audio element and device voices. */
function fakeWindow({ play = () => Promise.resolve(), voices = [{ lang: 'en-US', name: 'Samantha', localService: true }] } = {}) {
  const log = [];
  class FakeAudio {
    constructor(url) {
      this.url = url;
      log.push(['audio', url]);
    }

    play() {
      return play(this);
    }

    pause() {
      log.push(['pause', this.url]);
    }
  }
  class Utterance {
    constructor(text) {
      this.text = text;
    }
  }
  return {
    log,
    Audio: FakeAudio,
    navigator: { userActivation: { hasBeenActive: true } },
    SpeechSynthesisUtterance: Utterance,
    speechSynthesis: {
      getVoices: () => voices,
      speak: (utterance) => {
        log.push(['speak', utterance.text, utterance.voice?.name ?? null]);
        utterance.onstart?.();
      },
      cancel: () => log.push(['cancel']),
    },
  };
}

describe('recorded narration', () => {
  it('loads a verified file only when its line is spoken, and plays it', async () => {
    const win = fakeWindow();
    let loads = 0;
    const voice = createVoice({ win, setTimer: now, audioFor: verified, urlFor: async () => { loads += 1; return 'assets/menu.wav'; } });
    expect(loads).toBe(0);
    voice.speak(line, 'en');
    await flush();
    expect(loads).toBe(1);
    expect(win.log).toContainEqual(['audio', 'assets/menu.wav']);
    expect(voice.status()).toBe('speaking');
    expect(win.log.some(([kind]) => kind === 'speak')).toBe(false); // the recording, not the device voice
  });

  it('plays one line at a time: a new line stops the previous recording', async () => {
    const win = fakeWindow();
    const voice = createVoice({ win, setTimer: now, audioFor: verified, urlFor: async (audio) => audio.file });
    voice.speak(line, 'en');
    await flush();
    voice.speak({ ...line, id: 'other' }, 'en');
    await flush();
    expect(win.log).toContainEqual(['pause', 'en/menu.wav']);
  });

  it('reads the text instead when the file is missing or fails to play', async () => {
    const missing = fakeWindow();
    createVoice({ win: missing, setTimer: now, audioFor: verified, urlFor: async () => null }).speak(line, 'en');
    await flush();
    expect(missing.log).toContainEqual(['speak', 'Welcome.', 'Samantha']);

    const broken = fakeWindow({ play: () => Promise.reject(new Error('decode error')) });
    createVoice({ win: broken, setTimer: now, audioFor: verified, urlFor: async () => 'x.wav' }).speak(line, 'en');
    await flush();
    expect(broken.log).toContainEqual(['speak', 'Welcome.', 'Samantha']);
  });

  it('waits for a click when the browser blocks playback (no forced autoplay)', async () => {
    const win = fakeWindow({ play: () => Promise.reject(Object.assign(new Error('blocked'), { name: 'NotAllowedError' })) });
    const voice = createVoice({ win, setTimer: now, audioFor: verified, urlFor: async () => 'x.wav' });
    voice.speak(line, 'en');
    await flush();
    expect(voice.status()).toBe('blocked');
  });

  it('a stopped line never starts late (screen, language, pause or voice off)', async () => {
    const win = fakeWindow();
    const voice = createVoice({ win, setTimer: now, audioFor: verified, urlFor: async () => 'late.wav' });
    voice.speak(line, 'en');
    voice.stop(); // before the file finished loading
    await flush();
    expect(win.log.some(([kind]) => kind === 'audio')).toBe(false);
    expect(voice.status()).toBe('idle');
  });
});

describe('device voice', () => {
  it('never chooses an online voice (no speech service)', () => {
    const voices = [
      { lang: 'pt-BR', name: 'Google português do Brasil', localService: false },
      { lang: 'pt-BR', name: 'Luciana', localService: true },
    ];
    expect(pickVoice(voices, 'pt').name).toBe('Luciana');
    expect(pickVoice([voices[0]], 'pt')).toBeNull();
  });

  it('shows the text only when the device has no local voice for the language', () => {
    const win = fakeWindow({ voices: [{ lang: 'es-ES', name: 'Google español', localService: false }] });
    const voice = createVoice({ win, setTimer: now, audioFor: () => null });
    voice.speak(line, 'es');
    expect(voice.status()).toBe('unavailable');
    expect(win.log.some(([kind]) => kind === 'speak')).toBe(false);
  });
});

describe('effects and narration', () => {
  it('lowers the effects while Capi speaks and brings them back after', () => {
    duck(true);
    expect(effectsLevel()).toBeLessThan(0.5);
    duck(false);
    expect(effectsLevel()).toBe(1);
  });
});

describe('recording status', () => {
  const root = new URL('../src/assets/capi/narracao/', import.meta.url);

  it('marks a line as recorded only when its WAV file exists', () => {
    for (const item of NARRATION) {
      for (const lang of LANGS) {
        const audio = item.audio[lang];
        if (audio.status === 'verified') expect(existsSync(new URL(audio.file, root)), `${lang}/${item.id}`).toBe(true);
      }
    }
  });

  it('documents the same status as the catalog', () => {
    const doc = readFileSync(new URL('../docs/capi-narration.md', import.meta.url), 'utf8');
    for (const item of NARRATION) {
      const cells = LANGS.map((lang) => (item.audio[lang].status === 'verified' ? 'recorded and integrated' : 'to record'));
      expect(doc, item.id).toContain(`| \`${item.id}\` | ${cells.join(' | ')} |`);
    }
  });
});
