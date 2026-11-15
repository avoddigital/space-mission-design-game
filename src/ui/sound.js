// Game sounds and background music, synthesized at runtime with the Web Audio API (no audio files, nothing to license).
// See DESIGN.md section 7. Sound is a bonus: every sound has a visual equivalent.
// Browsers only allow audio after a user gesture, so the AudioContext is created on the first play().

const MUTE_KEY = 'smdg.muted';
const MASTER_VOLUME = 0.18;

let context = null;
let master = null;
let noiseBuffer = null;
let muted = readMuted();

function readMuted() {
  try {
    return globalThis.localStorage?.getItem(MUTE_KEY) === '1';
  } catch {
    return false; // blocked storage: start with sound on, just do not remember
  }
}

function audio() {
  if (context) return context;
  const AudioContextClass = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  if (!AudioContextClass) return null;
  try {
    context = new AudioContextClass();
    master = context.createGain();
    master.gain.value = MASTER_VOLUME;
    master.connect(context.destination);
  } catch {
    context = null;
  }
  return context;
}

/** One note with a quick attack and an exponential fade. Times in seconds from now. */
function tone(freq, { at = 0, length = 0.12, type = 'triangle', volume = 0.6, slideTo = null } = {}) {
  const ctx = context;
  const start = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + length);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  osc.connect(gain).connect(master);
  osc.start(start);
  osc.stop(start + length + 0.02);
}

/** Filtered white noise: the rocket rumble. */
function rumble({ length = 2, volume = 0.9 } = {}) {
  const ctx = context;
  const start = ctx.currentTime;
  const source = ctx.createBufferSource();
  source.buffer = noise();
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(140, start);
  filter.frequency.exponentialRampToValueAtTime(900, start + length * 0.45);
  filter.frequency.exponentialRampToValueAtTime(200, start + length);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.25);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  source.connect(filter).connect(gain).connect(master);
  source.start(start);
  source.stop(start + length + 0.05);
  tone(55, { length: length * 0.8, type: 'sine', volume: 0.5, slideTo: 38 }); // low body under the noise
}

// Notes (Hz). A small pentatonic set keeps every chime friendly together.
const N = { C4: 261.6, D4: 293.7, E4: 329.6, G4: 392, A4: 440, C5: 523.3, D5: 587.3, E5: 659.3, G5: 784, A5: 880, C6: 1046.5 };

const SOUNDS = {
  click: () => tone(1800, { length: 0.03, volume: 0.25 }),
  tab: () => tone(1200, { length: 0.04, volume: 0.3 }),
  pick: () => {
    tone(N.E5, { length: 0.07 });
    tone(N.A5, { at: 0.06, length: 0.1 });
  },
  unpick: () => {
    tone(N.A4, { length: 0.07 });
    tone(N.E4, { at: 0.06, length: 0.1 });
  },
  error: () => {
    tone(140, { length: 0.09, type: 'square', volume: 0.22 });
    tone(140, { at: 0.12, length: 0.12, type: 'square', volume: 0.22 });
  },
  warn: () => {
    tone(N.G4, { length: 0.08, type: 'square', volume: 0.15 });
    tone(N.D5, { at: 0.1, length: 0.12, type: 'square', volume: 0.15 });
  },
  open: () => tone(N.C5, { length: 0.06, volume: 0.35, slideTo: N.G5 }),
  close: () => tone(N.G5, { length: 0.06, volume: 0.3, slideTo: N.C5 }),
  beep: () => tone(N.A4, { length: 0.16, type: 'sine', volume: 0.6 }),
  beepHigh: () => tone(N.A5, { length: 0.22, type: 'sine', volume: 0.6 }),
  liftoff: () => rumble({ length: 2.2 }),
  phase: () => {
    tone(N.G5, { length: 0.09, type: 'sine', volume: 0.45 });
    tone(N.C6, { at: 0.08, length: 0.16, type: 'sine', volume: 0.45 });
  },
  success: () => {
    [N.C5, N.E5, N.G5, N.C6].forEach((freq, index) => tone(freq, { at: index * 0.11, length: index === 3 ? 0.5 : 0.14, volume: 0.5 }));
  },
  failure: () => {
    tone(N.E4, { length: 0.9, type: 'sawtooth', volume: 0.18, slideTo: 110 });
    tone(N.C4, { at: 0.05, length: 0.9, type: 'triangle', volume: 0.3, slideTo: 82 });
  },
  right: () => {
    tone(N.E5, { length: 0.1, type: 'sine', volume: 0.5 });
    tone(N.A5, { at: 0.09, length: 0.25, type: 'sine', volume: 0.5 });
  },
  wrong: () => tone(220, { length: 0.25, type: 'square', volume: 0.18, slideTo: 150 }),
};

// --- Background music -------------------------------------------------------------------------
// Slow, quiet ambient loops, also synthesized: soft chords that cross-fade, a few random high notes
// and an echo. Each part of the game has its own theme (MUSIC_THEMES); changing theme cross-fades.
// The music sits well under the game sounds and follows the mute button.

const MUSIC_VOLUME = 0.18; // relative to the master volume
const MUSIC_FADE = 1.2; // seconds to fade the whole music in or out
const LOOKAHEAD = 1.5; // seconds of music scheduled ahead of the clock

/** MIDI note number to Hz (69 = A4 = 440 Hz). */
const hz = (note) => 440 * 2 ** ((note - 69) / 12);

/**
 * Music themes. Chords are MIDI notes, low note first. Every theme has chords, how long each chord lasts
 * (`seconds`) and how long it fades into the next (`fade`), the oscillators of each pad note (`voices`),
 * random high notes (`sparkles`), a low-pass filter and an echo. Optional layers: `arp` (soft repeated
 * chord notes), `pulse` (a low beat) and `wind` (filtered noise that swells and fades).
 */
const MUSIC_THEMES = {
  // Menus and command center: calm and open. A minor, F major 7, C major, G sus2.
  menu: {
    chords: [[45, 52, 57, 60, 64], [41, 53, 57, 60, 64], [48, 55, 60, 64, 67], [43, 50, 55, 57, 62]],
    seconds: 9, fade: 3, voices: [['sine', 0], ['triangle', 7]], root: 0.2, note: 0.1,
    sparkles: { notes: [72, 74, 76, 79, 81, 84], min: 1, max: 3, volume: 0.09 },
    filter: 1800, echo: { time: 0.46, feedback: 0.35 },
  },
  // Earth: warm and hopeful, a little motion. C major 7, A minor 7, F major 7, G6, with a gentle arpeggio.
  earth: {
    chords: [[48, 55, 59, 64, 67], [45, 52, 55, 60, 64], [41, 48, 57, 60, 64], [43, 50, 59, 62, 64]],
    seconds: 7, fade: 2.5, voices: [['sine', 0], ['triangle', 5]], root: 0.18, note: 0.09,
    sparkles: { notes: [76, 79, 81, 84, 86, 88], min: 1, max: 2, volume: 0.07 },
    arp: { step: 0.7, volume: 0.035, pattern: [2, 3, 4, 3] },
    filter: 2400, echo: { time: 0.35, feedback: 0.3 },
  },
  // Moon: cold, sparse and still. Open fifths and suspended chords, pure sine tones, very long echo.
  moon: {
    chords: [[38, 45, 50, 52, 57], [34, 46, 53, 57, 62], [41, 48, 53, 55, 60], [33, 45, 50, 52, 57]],
    seconds: 12, fade: 4, voices: [['sine', 0], ['sine', -6]], root: 0.2, note: 0.1,
    sparkles: { notes: [86, 88, 93, 95, 98], min: 0, max: 1, volume: 0.06 },
    filter: 1300, echo: { time: 0.62, feedback: 0.5 },
  },
  // Mars: dark and dusty. E Phrygian chords with a gritty edge, a slow low beat and wind.
  mars: {
    chords: [[40, 47, 52, 54, 59], [41, 48, 53, 57, 59], [40, 47, 52, 55, 59], [38, 45, 50, 52, 57]],
    seconds: 8, fade: 2.5, voices: [['sawtooth', 0], ['triangle', -8]], root: 0.14, note: 0.06,
    sparkles: { notes: [76, 77, 79, 83], min: 0, max: 2, volume: 0.06 },
    pulse: { note: 40, every: 2, volume: 0.22 },
    wind: { volume: 0.1 },
    filter: 950, echo: { time: 0.5, feedback: 0.35 },
  },
};

let musicEnabled = false; // true after enableMusic(): only the main game screen has music
let musicTheme = 'menu';
let musicBus = null; // gain of the music that is playing now (a new one for every start)
let musicIn = null; // where music notes connect (a soft low-pass filter before the bus)
let musicTimer = null;
let nextChordAt = 0;
let chordIndex = 0;

const theme = () => MUSIC_THEMES[musicTheme] ?? MUSIC_THEMES.menu;

/** Two seconds of white noise, made once (rocket rumble and Martian wind). */
function noise() {
  if (!noiseBuffer) {
    noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const samples = noiseBuffer.getChannelData(0);
    for (let i = 0; i < samples.length; i += 1) samples[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

/** One long, soft note of a chord: slightly detuned oscillators with a slow fade in and out. */
function padNote(freq, start, volume, { seconds, fade, voices }) {
  const ctx = context;
  const end = start + seconds + fade;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + fade);
  gain.gain.setValueAtTime(volume, start + seconds);
  gain.gain.linearRampToValueAtTime(0, end);
  gain.connect(musicIn);
  voices.forEach(([type, detune]) => {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    osc.connect(gain);
    osc.start(start);
    osc.stop(end + 0.05);
  });
}

/** One short note that rings out (the echo comes from the music chain). */
function bell(freq, start, { volume, length = 2.2, type = 'sine', slideTo = null }) {
  const ctx = context;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + length);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  osc.connect(gain).connect(musicIn);
  osc.start(start);
  osc.stop(start + length + 0.1);
}

/** Wind: noise through a slowly moving band-pass filter, swelling over one chord. */
function wind(start, length, volume) {
  const ctx = context;
  const source = ctx.createBufferSource();
  source.buffer = noise();
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 1.2;
  filter.frequency.setValueAtTime(300 + Math.random() * 200, start);
  filter.frequency.linearRampToValueAtTime(600 + Math.random() * 500, start + length / 2);
  filter.frequency.linearRampToValueAtTime(300, start + length);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + length / 2);
  gain.gain.linearRampToValueAtTime(0, start + length);
  source.connect(filter).connect(gain).connect(musicIn);
  source.start(start);
  source.stop(start + length + 0.05);
}

/** Everything that plays during one chord of the current theme. */
function scheduleChord(start, chord, current) {
  chord.forEach((note, index) => padNote(hz(note), start, index === 0 ? current.root : current.note, current));
  const { notes, min, max, volume } = current.sparkles;
  const count = min + Math.floor(Math.random() * (max - min + 1));
  for (let i = 0; i < count; i += 1) {
    bell(hz(notes[Math.floor(Math.random() * notes.length)]), start + 1 + Math.random() * (current.seconds - 2), { volume });
  }
  if (current.arp) {
    const { step, volume: arpVolume, pattern } = current.arp;
    for (let at = 0, i = 0; at < current.seconds; at += step, i += 1) {
      bell(hz(chord[pattern[i % pattern.length]] + 12), start + at, { volume: arpVolume, length: 0.6, type: 'triangle' });
    }
  }
  if (current.pulse) {
    const { note, every, volume: pulseVolume } = current.pulse;
    for (let at = 0; at < current.seconds; at += every) {
      bell(hz(note), start + at, { volume: pulseVolume, length: 0.9, slideTo: hz(note - 5) });
    }
  }
  if (current.wind) wind(start, current.seconds + current.fade, current.wind.volume);
}

/** Schedule the chords that start in the next LOOKAHEAD seconds. */
function scheduleMusic() {
  const ctx = context;
  if (!ctx || !musicIn) return;
  try {
    const current = theme();
    while (nextChordAt < ctx.currentTime + LOOKAHEAD) {
      scheduleChord(nextChordAt, current.chords[chordIndex % current.chords.length], current);
      chordIndex += 1;
      nextChordAt += current.seconds;
    }
  } catch {
    // audio is optional; never break the game for it
  }
}

function startMusic() {
  if (!musicEnabled || muted || musicTimer !== null || globalThis.document?.hidden) return;
  const ctx = audio();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  try {
    const now = ctx.currentTime;
    musicBus = ctx.createGain();
    musicBus.gain.setValueAtTime(0, now);
    musicBus.gain.linearRampToValueAtTime(MUSIC_VOLUME, now + MUSIC_FADE);
    musicBus.connect(master);
    const current = theme();
    musicIn = ctx.createBiquadFilter();
    musicIn.type = 'lowpass';
    musicIn.frequency.value = current.filter;
    musicIn.connect(musicBus);
    const echo = ctx.createDelay(1);
    echo.delayTime.value = current.echo.time;
    const feedback = ctx.createGain();
    feedback.gain.value = current.echo.feedback;
    musicIn.connect(echo);
    echo.connect(feedback).connect(echo);
    feedback.connect(musicBus);
    nextChordAt = now + 0.1;
    chordIndex = 0;
    scheduleMusic();
    musicTimer = setInterval(scheduleMusic, 500);
  } catch {
    stopMusic();
  }
}

function stopMusic() {
  if (musicTimer !== null) clearInterval(musicTimer);
  musicTimer = null;
  const bus = musicBus;
  musicBus = null;
  musicIn = null;
  if (!bus || !context) return;
  try {
    // Notes already scheduled keep running inside the old bus, so fade it out and unplug it.
    const now = context.currentTime;
    bus.gain.cancelScheduledValues(now);
    bus.gain.setValueAtTime(bus.gain.value, now);
    bus.gain.linearRampToValueAtTime(0, now + MUSIC_FADE);
    setTimeout(() => bus.disconnect(), (MUSIC_FADE + 0.2) * 1000);
  } catch {
    // already gone
  }
}

/**
 * Choose the music theme: 'menu', 'earth', 'moon' or 'mars'. The old theme fades out while the new one fades in.
 * Safe to call on every render: nothing happens when the theme does not change.
 */
export function setMusicTheme(id) {
  const next = MUSIC_THEMES[id] ? id : 'menu';
  if (next === musicTheme) return;
  musicTheme = next;
  if (musicTimer === null) return; // not playing yet: the new theme starts with the music
  stopMusic();
  startMusic();
}

/**
 * Turn the background music on for this page. It starts on the first click or key press (browser rule),
 * stops while the tab is hidden and follows the mute button.
 */
export function enableMusic() {
  const doc = globalThis.document;
  if (musicEnabled || !doc) return;
  musicEnabled = true;
  const onGesture = () => {
    doc.removeEventListener('pointerdown', onGesture, true);
    doc.removeEventListener('keydown', onGesture, true);
    startMusic();
  };
  doc.addEventListener('pointerdown', onGesture, true);
  doc.addEventListener('keydown', onGesture, true);
  doc.addEventListener('visibilitychange', () => {
    if (doc.hidden) stopMusic();
    else if (context) startMusic(); // only after the first gesture created the audio
  });
}

/** Play a named sound (see SOUNDS). Silently does nothing when muted or without Web Audio. */
export function play(name) {
  if (muted || !SOUNDS[name]) return;
  const ctx = audio();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  try {
    SOUNDS[name]();
  } catch {
    // audio is optional; never break the game for it
  }
}

export function isMuted() {
  return muted;
}

/** Turn sound on or off and remember the choice. Returns the new muted state. */
export function toggleMute() {
  muted = !muted;
  try {
    globalThis.localStorage?.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    // blocked storage: the choice lasts until the page closes
  }
  if (muted) stopMusic();
  else {
    play('click');
    startMusic();
  }
  return muted;
}
