// Commander Capi: her lines follow the real game state, keep stable ids (no repeats on re-render or
// language change), react only to events that happened, and her voice never blocks the game.
import { describe, it, expect, afterEach } from 'vitest';
import { capiLine, launchReadiness, eventToDiscuss } from '../src/ui/capi/script.js';
import { NARRATION, LANGS, playableAudio, narrationLine } from '../src/ui/capi/catalog.js';
import { capiPanel } from '../src/ui/capi/panel.js';
import { readFileSync } from 'node:fs';
import { createVoice, pickVoice } from '../src/ui/capi/voice.js';
import { createInitialState } from '../src/state/store.js';
import { togglePart, setPower, setComms, setOrbit, setRocket, launch } from '../src/state/actions.js';
import { gameData, selectScenario, selectMission, selectEvaluation, runSimulation } from '../src/state/selectors.js';
import { setLocale, dictionaries } from '../src/i18n/index.js';

const parts = gameData.parts;
const earth = () => ({ ...createInitialState(), scenarioId: 'earth-observation' });

/** The demo path (README and docs/demo-script.md): it flies and succeeds. */
const demo = () => setRocket(setOrbit(setComms(setPower(togglePart(togglePart(earth(), 'multispectral-imager'), 'thermal-imager'), 'solar-panel-m', parts), 'hga-antenna', parts), 'sso-700'), 'small-lifter');

const ctxFor = (state, screen, extra = {}) => ({
  screen,
  scenario: selectScenario(state),
  content: gameData.content,
  data: gameData,
  evaluation: selectEvaluation(state),
  mission: selectMission(state),
  simulation: state.simulation,
  shown: 0,
  runCount: state.runCount,
  cue: null,
  ...extra,
});

afterEach(() => setLocale('en'));

describe('capiLine', () => {
  it('welcomes on the menu and states the purpose of the game', () => {
    const line = capiLine({ screen: 'menu' });
    expect(line.id).toBe('menu');
    expect(line.mood).toBe('welcome');
    expect(line.say).toBe('menu');
    expect(line.lead).toMatch(/Commander Capi.*design a mission/s);
  });

  it('opens the mission with the briefing sentence only (question and goals are on the screen)', () => {
    const state = earth();
    const line = capiLine(ctxFor(state, 'objective'));
    expect(line.say).toBe('briefing');
    expect(line.detail ?? '').toBe('');
  });

  it('explains the price of parts, then the consequence of a limit just broken, until it is fixed', () => {
    let state = earth();
    expect(capiLine(ctxFor(state, 'spacecraft')).id).toBe('build:earth-observation');
    // Too many instruments for the power source: power goes over its limit
    state = setPower(togglePart(togglePart(state, 'multispectral-imager'), 'imaging-spectrometer'), 'solar-panel-s', parts);
    expect(selectEvaluation(state).budget.power.status).toBe('over');
    const issue = selectEvaluation(state).issues.find((item) => item.code === 'POWER_DEFICIT');
    const over = capiLine(ctxFor(state, 'spacecraft', { cue: { type: 'over', resource: 'power', issue } }));
    expect(over.id).toBe('build:0:over:power');
    expect(over.say).toBe('build-limit');
    // The engine's real numbers, then the consequence
    expect(over.detail).toContain(`${issue.missingW} W more`);
    expect(over.detail).toMatch(/shut down in orbit/);
    // Fixed: back to the general guidance (already said, so it will not be spoken again)
    state = setPower(state, 'solar-panel-l', parts);
    expect(capiLine(ctxFor(state, 'spacecraft', { cue: { type: 'over', resource: 'power' } })).id).toBe('build:earth-observation');
  });

  it('summarises launch readiness: incomplete, blocked, ready', () => {
    const empty = earth();
    expect(launchReadiness(selectEvaluation(empty)).status).toBe('blocked'); // power deficit with no power source
    // A complete spacecraft without orbit and rocket: only choices are missing
    const noRide = { ...demo(), design: { ...demo().design, orbitId: null, rocketId: null } };
    expect(capiLine(ctxFor(noRide, 'launch')).id).toBe('launch:0:incomplete');
    expect(capiLine(ctxFor(noRide, 'launch')).detail).toMatch(/orbit/);
    const heavy = setRocket(setOrbit(togglePart(togglePart(togglePart(demo(), 'imaging-spectrometer'), 'radar-sounder'), 'hd-camera'), 'sso-700'), 'small-lifter');
    const blocked = capiLine(ctxFor(heavy, 'launch'));
    expect(blocked.id).toMatch(/^launch:0:blocked:/);
    expect(blocked.detail).toMatch(/step \d/);
    const ready = capiLine(ctxFor(demo(), 'launch'));
    expect(ready.id).toMatch(/^launch:0:(ready|tight)/);
  });

  it('reacts to an event only when it happened, and names the resource that protected or exposed the mission', () => {
    const state = launch(demo(), runSimulation(demo()));
    const { simulation } = state;
    // Before the science phase is shown: liftoff line, shown but not spoken
    const before = capiLine(ctxFor(state, 'simulation', { shown: 1 }));
    expect(before.id).toBe('flight:1');
    expect(before.say).toBeNull();
    const after = capiLine(ctxFor(state, 'simulation', { shown: 99 }));
    expect(simulation.events.length).toBeGreaterThan(0);
    const event = eventToDiscuss(simulation.events);
    expect(after.id).toBe(`event:1:${event.id}`);
    const name = gameData.events.find((item) => item.id === event.id).name;
    expect(after.say).toBe(event.harmed ? 'event-hurt' : 'event-safe');
    expect(after.detail).toContain(name);
    expect(after.detail).toContain(`${event.marginPct}%`);
    expect(after.detail).toContain(gameData.content.meters[event.protectedBy].name.toLowerCase());

    // No events (failed before the science phase): never an event line
    const noEvents = { ...simulation, events: [] };
    expect(capiLine(ctxFor(state, 'simulation', { simulation: noEvents, shown: 99 })).id).toBe('flight:1');
  });

  it('prefers the event that hurt, because that is the lesson', () => {
    const events = [
      { id: 'solar-storm', protectedBy: 'power', marginPct: 40, harmed: false, scienceLossPct: 0 },
      { id: 'launch-delay', protectedBy: 'time', marginPct: 5, harmed: true, scienceLossPct: 15 },
    ];
    expect(eventToDiscuss(events).id).toBe('launch-delay');
    const state = launch(demo(), runSimulation(demo()));
    const line = capiLine(ctxFor(state, 'simulation', { simulation: { ...state.simulation, events }, shown: 99 }));
    expect(line.say).toBe('event-hurt');
    expect(line.detail).toContain('only 5%');
    expect(line.detail).toContain('15%');
    expect(line.detail).toMatch(/one more surprise/);
  });

  it('explains the report from the real cause and suggests the next investigation', () => {
    const success = launch(demo(), runSimulation(demo()));
    const won = capiLine(ctxFor(success, 'report'));
    expect(won.mood).toBe('success');
    expect(won.say).toBe('report-success');
    // Both demo events were absorbed by margins: Capi asks which reserve protected the mission
    expect(success.simulation.events.every((event) => !event.harmed)).toBe(true);
    expect(won.detail).toBe('Which reserve protected the mission?');

    const heavy = setRocket(setOrbit(togglePart(togglePart(togglePart(demo(), 'imaging-spectrometer'), 'radar-sounder'), 'hd-camera'), 'sso-700'), 'small-lifter');
    const failed = launch(heavy, runSimulation(heavy));
    expect(failed.simulation.outcome).toBe('failure');
    const lost = capiLine(ctxFor(failed, 'report'));
    expect(lost.mood).toBe('failure');
    expect(failed.simulation.failedIssue.code).toBe('PAYLOAD_TOO_HEAVY');
    expect(lost.say).toBe('failure-launch'); // a launch failure, not a generic one
    // The report's "What went wrong" already shows the numbers: Capi asks the next question instead
    expect(lost.detail).toBe('Which decision would you change first? A lighter spacecraft or a stronger rocket: which one costs less?');
  });

  it('invites a hypothesis after a redesign, only on the screen the player landed on', () => {
    const state = launch(demo(), runSimulation(demo()));
    const cue = { type: 'rebuild', run: 1, issue: null, screen: 'spacecraft' };
    const line = capiLine(ctxFor({ ...state, screen: 'spacecraft', simulation: null }, 'spacecraft', { cue }));
    expect(line.id).toBe('rebuild:1');
    expect(line.say).toBe('rebuild');
    expect(line.lead).toMatch(/predict/);
    expect(capiLine(ctxFor({ ...state, simulation: null }, 'launch', { cue })).id).toMatch(/^launch:1:/);
  });

  it('keeps the same ids in every language (no repeats when the language changes)', () => {
    const state = launch(demo(), runSimulation(demo()));
    const ids = () => ['objective', 'spacecraft', 'launch', 'report'].map((screen) => capiLine(ctxFor(state, screen)).id);
    const en = ids();
    setLocale('pt');
    expect(ids()).toEqual(en);
    expect(capiLine({ screen: 'menu' }).lead).toMatch(/Comandante Capi/);
    setLocale('es');
    expect(ids()).toEqual(en);
  });

  it('has nothing to say on screens without a mission moment', () => {
    expect(capiLine({ screen: 'hub', scenario: null })).toBeNull();
  });
});

describe('narration catalog', () => {
  const textOf = (line, lang) => dictionaries[lang][line.text];

  it('has a short, fixed sentence for every line in English, Portuguese and Spanish', () => {
    expect(NARRATION.map((line) => line.id)).toEqual([
      'menu', 'briefing', 'build-intro', 'build-limit', 'launch-choose', 'launch-blocked', 'launch-tight',
      'launch-ready', 'event-safe', 'event-hurt', 'failure-budget', 'failure-launch', 'failure-orbit', 'failure-power',
      'failure-time', 'failure-data', 'failure-science', 'failure-events', 'report-success', 'rebuild',
    ]);
    for (const line of NARRATION) {
      for (const lang of LANGS) {
        const text = textOf(line, lang);
        expect(text, `${lang}: ${line.id}`).toBeTruthy();
        // Recorded once, used in every mission: no numbers and no {placeholders}
        expect(text, `${lang}: ${line.id}`).not.toMatch(/\d|\{/);
        expect(text.split(/\s+/).length, `${lang}: ${line.id}`).toBeLessThanOrEqual(22);
      }
    }
  });

  it('plays only verified audio, one file per line and language', () => {
    for (const line of NARRATION) {
      for (const lang of LANGS) {
        const audio = line.audio[lang];
        expect(audio.file).toBe(`${lang}/${line.id}.wav`);
        expect(playableAudio(line.id, lang)).toEqual(audio.status === 'verified' ? audio : null);
      }
    }
    const partial = new Map([['menu', { audio: { en: { file: 'en/menu.wav', status: 'verified' }, pt: { file: 'pt/menu.wav', status: 'to-record' } } }]]);
    expect(playableAudio('menu', 'en', partial)).toEqual({ file: 'en/menu.wav', status: 'verified' });
    expect(playableAudio('menu', 'pt', partial)).toBeNull();
  });

  it('matches the recording script word for word (docs/capi-narration.md)', () => {
    const script = readFileSync(new URL('../docs/capi-narration.md', import.meta.url), 'utf8');
    for (const line of NARRATION) {
      for (const lang of LANGS) expect(script, `${lang}: ${line.id}`).toContain(textOf(line, lang));
    }
  });
});

describe('capiPanel', () => {
  const line = capiLine({ screen: 'menu' });
  it('shows the text with repeat, voice and hide controls', () => {
    const html = capiPanel(line, { voiceOn: true, hidden: false, status: 'idle', muted: false });
    expect(html).toContain('Welcome to mission control.');
    expect(html).toContain('data-action="capi-replay"');
    expect(html).toContain('data-action="capi-voice"');
    expect(html).toContain('data-action="capi-hide"');
  });

  it('offers a clear play button when the browser blocked the voice', () => {
    const html = capiPanel(line, { voiceOn: true, hidden: false, status: 'blocked', muted: false });
    expect(html).toContain('Hear Capi');
  });

  it('collapses to one button when hidden, and renders nothing without a line', () => {
    expect(capiPanel(line, { voiceOn: true, hidden: true, status: 'idle', muted: false })).toContain('data-action="capi-show"');
    expect(capiPanel(null, { voiceOn: true, hidden: false, status: 'idle', muted: false })).toBe('');
  });
});

describe('voice', () => {
  /** A fake browser: records what is spoken and cancelled. */
  function fakeWindow({ active = true, speech = true } = {}) {
    const log = [];
    class Utterance {
      constructor(text) {
        this.text = text;
      }
    }
    return {
      log,
      navigator: { userActivation: { hasBeenActive: active } },
      ...(speech ? {
        SpeechSynthesisUtterance: Utterance,
        speechSynthesis: {
          getVoices: () => [{ lang: 'pt-BR', name: 'Luciana' }, { lang: 'en-US', name: 'Fred' }, { lang: 'en-US', name: 'Samantha' }],
          speak: (utterance) => {
            log.push(['speak', utterance.text, utterance.lang, utterance.voice?.name]);
            utterance.onstart?.();
          },
          cancel: () => log.push(['cancel']),
        },
      } : {}),
    };
  }
  const now = (fn) => fn(); // run the start delay right away
  const line = { id: 'menu', say: 'menu', lead: 'Hello.', detail: 'Welcome, 3 facts.' };
  const noRecording = () => null; // these tests cover the device voice, used when a line has no recording

  it('says only the catalog sentence (never the mission facts), with a voice in the game language', () => {
    const win = fakeWindow();
    const statuses = [];
    const voice = createVoice({ win, audioFor: noRecording, setTimer: now, onChange: (status) => statuses.push(status) });
    voice.speak(line, 'en');
    expect(win.log).toContainEqual(['speak', 'Hello.', 'en-US', 'Samantha']);
    expect(voice.status()).toBe('speaking');
    voice.stop();
    expect(voice.status()).toBe('idle');
    expect(win.log.at(-1)).toEqual(['cancel']);
  });

  it('does not play before the player interacted with the page: it waits for a click', () => {
    const win = fakeWindow({ active: false });
    const voice = createVoice({ win, audioFor: noRecording, setTimer: now });
    voice.speak(line, 'en');
    expect(voice.status()).toBe('blocked');
    expect(win.log.some(([kind]) => kind === 'speak')).toBe(false);
  });

  it('stays quiet, without errors, where the browser has no speech', () => {
    const voice = createVoice({ win: fakeWindow({ speech: false }), audioFor: noRecording, setTimer: now });
    expect(() => voice.speak(line, 'es')).not.toThrow();
    expect(voice.status()).toBe('unavailable');
  });

  it('ignores a line that was stopped before it started (no talking over the next screen)', () => {
    const win = fakeWindow();
    let pending = null;
    const voice = createVoice({ win, audioFor: noRecording, setTimer: (fn) => { pending = fn; } });
    voice.speak(line, 'en');
    voice.stop();
    pending();
    expect(win.log.some(([kind]) => kind === 'speak')).toBe(false);
  });

  it('never speaks a shown-only line', () => {
    const win = fakeWindow();
    const voice = createVoice({ win, audioFor: noRecording, setTimer: now });
    voice.speak({ id: 'flight:1', say: null, lead: 'Liftoff!', detail: '' }, 'en');
    expect(win.log.some(([kind]) => kind === 'speak')).toBe(false);
  });

  it('picks a voice of the same language and region', () => {
    const voices = [{ lang: 'pt-PT', name: 'Joana' }, { lang: 'pt-BR', name: 'Felipe' }, { lang: 'es-MX', name: 'Paulina' }];
    expect(pickVoice(voices, 'pt').name).toBe('Felipe');
    expect(pickVoice(voices, 'es').name).toBe('Paulina');
    expect(pickVoice([], 'en')).toBeNull();
  });
});
