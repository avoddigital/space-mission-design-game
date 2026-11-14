// Game sounds, synthesized at runtime with the Web Audio API (no audio files, nothing to license).
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
  if (!noiseBuffer) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const samples = noiseBuffer.getChannelData(0);
    for (let i = 0; i < samples.length; i += 1) samples[i] = Math.random() * 2 - 1;
  }
  const start = ctx.currentTime;
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
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
  if (!muted) play('click');
  return muted;
}
