// The report debrief and the rebuild: facts only from the engine, the same external conditions when the
// player rebuilds, a clear warning when the conditions change, and no cause the engine did not confirm.
import { describe, it, expect, afterEach } from 'vitest';
import { debriefMission, attemptSummary, compareAttempts } from '../src/engine/debrief.js';
import { diagnoseFailure } from '../src/engine/diagnosis.js';
import { simulateMission } from '../src/engine/simulate.js';
import { resolveDesign } from '../src/engine/resolve.js';
import { createInitialState } from '../src/state/store.js';
import { launch, redesign, newConditions } from '../src/state/actions.js';
import { gameData, runSimulation, selectScenario, selectMission, selectEvaluation } from '../src/state/selectors.js';
import { capiLine } from '../src/ui/capi/script.js';
import { debriefSection } from '../src/ui/components/debrief.js';
import { reportScreen } from '../src/ui/screens/mission.js';
import { launchScreen } from '../src/ui/screens/design.js';
import { setLocale } from '../src/i18n/index.js';

const earth = gameData.scenarios.find((item) => item.id === 'earth-observation');
const demo = { partIds: ['multispectral-imager', 'thermal-imager', 'solar-panel-m', 'hga-antenna'], orbitId: 'sso-700', rocketId: 'small-lifter' };
const fly = (design, events = gameData.events, seed = 1, options) => simulateMission(resolveDesign(design, gameData), earth, events, seed, options);
const viewCtx = (simulation, design) => ({ simulation, mission: resolveDesign(design, gameData), scenario: earth, content: gameData.content, data: gameData });

afterEach(() => setLocale('en'));

describe('debriefMission', () => {
  it('lists what worked, the science goal, the biggest risk and every event of a success', () => {
    const simulation = fly(demo);
    const debrief = debriefMission(simulation, earth);
    expect(debrief.goal).toEqual({ reached: true, delivered: simulation.scienceDelivered, goal: 12 });
    expect(debrief.systems.every((item) => item.status === 'ok')).toBe(true);
    // The demo's mass margin (257 of 300 kg) is the smallest, and below 15%: the biggest risk
    expect(debrief.limit).toEqual({ resource: 'mass', marginPct: 14 });
    expect(debrief.risk?.resource).toBe('mass');
    expect(debrief.events).toBe(simulation.events);
  });

  it('only calls a system ok when the flight reached the phase where the engine checks it', () => {
    const heavy = fly({ ...demo, partIds: [...demo.partIds, 'hd-camera', 'radar-sounder'] });
    const statuses = Object.fromEntries(debriefMission(heavy, earth).systems.map((item) => [item.key, item.status]));
    expect(statuses).toEqual({ budget: 'ok', launch: 'failed', orbit: 'not-reached', power: 'not-reached', time: 'not-reached', data: 'not-reached' });
  });

  it('names the antenna as the limit when data could not reach Earth, with the change to test', () => {
    const design = { ...demo, partIds: ['multispectral-imager', 'thermal-imager', 'solar-panel-m', 'mga-antenna'] };
    const simulation = fly(design, []);
    const debrief = debriefMission(simulation, earth);
    expect(debrief.diagnosis.cause).toBe('data');
    expect(debrief.limit.resource).toBe('data');
    const html = debriefSection(debrief, null, viewCtx(simulation, design));
    expect(html).toContain('The spacecraft could not send enough data: the antenna sends 20 GB per day and the instruments make 65');
    expect(html).toContain('To test: an antenna that sends at least 65 GB per day');
    expect(html).not.toMatch(/you failed|your fault/i);
  });
});

describe('same external conditions', () => {
  it('replays the same events with a changed design, judged on the new margins', () => {
    const first = fly(demo, gameData.events, 7);
    const ids = first.events.map((event) => event.id);
    // A different design normally means a different seed; replaying keeps the same surprises
    const changed = { ...demo, partIds: [...demo.partIds.filter((id) => id !== 'thermal-imager'), 'imaging-spectrometer'] };
    const replay = fly(changed, gameData.events, 99, { eventIds: ids });
    expect(replay.events.map((event) => event.id)).toEqual(ids);
  });

  it('rebuilds with the same conditions only when the flight met its surprises, and new conditions clear them', () => {
    let state = { ...createInitialState(), scenarioId: 'earth-observation', design: { ...demo } };
    const simulation = runSimulation(state);
    state = launch(state, simulation, attemptSummary(simulation, earth, { run: 1 }));
    const rebuilt = redesign(state, [], { sameConditions: true });
    expect(rebuilt.conditions).toEqual({ eventIds: simulation.events.map((event) => event.id), run: 1 });
    expect(rebuilt.design).toEqual(state.design); // every choice kept
    expect(runSimulation(rebuilt).events.map((event) => event.id)).toEqual(rebuilt.conditions.eventIds);
    expect(newConditions(rebuilt).conditions).toBeNull();

    // A launch failure never reached the science phase: nothing to replay
    let heavy = { ...createInitialState(), scenarioId: 'earth-observation', design: { ...demo, partIds: [...demo.partIds, 'hd-camera', 'radar-sounder'] } };
    const failed = runSimulation(heavy);
    heavy = launch(heavy, failed);
    expect(redesign(heavy, [failed.failedIssue], { sameConditions: true }).conditions).toBeNull();
  });

  it('compares attempts and says clearly when the conditions were different or unknown', () => {
    const a = attemptSummary(fly(demo, gameData.events, 1), earth, { run: 1 });
    const replayed = attemptSummary(fly(demo, gameData.events, 2, { eventIds: a.eventIds }), earth, { run: 2, conditionsFrom: 1 });
    expect(compareAttempts(a, replayed).conditions).toBe('same');
    const other = { ...replayed, conditionsFrom: null, eventIds: ['made-up'] };
    expect(compareAttempts(a, other).conditions).toBe('different');
    const heavy = attemptSummary(fly({ ...demo, partIds: [...demo.partIds, 'hd-camera', 'radar-sounder'] }), earth, { run: 3 });
    const comparison = compareAttempts(heavy, a);
    expect(comparison.conditions).toBe('unknown');
    expect(comparison.nowWorking).toEqual(['launch', 'orbit', 'power', 'time', 'data']);
  });

  it('tells the player on the launch step which conditions the next flight meets', () => {
    let state = { ...createInitialState(), scenarioId: 'earth-observation', design: { ...demo }, screen: 'launch' };
    const simulation = runSimulation(state);
    state = redesign(launch(state, simulation), [], { sameConditions: true });
    const ctx = (s) => ({ state: s, data: gameData, content: gameData.content, ui: { tab: 'instrument' }, shake: new Set(), scenario: selectScenario(s), mission: selectMission(s), evaluation: selectEvaluation(s) });
    expect(launchScreen(ctx(state))).toContain('Same conditions as flight 1');
    expect(launchScreen(ctx(newConditions(state)))).toContain('New conditions: the surprises may differ from flight 1');
  });
});

describe('Capi never narrates a cause the engine did not confirm', () => {
  it('matches the engine diagnosis for many designs, missions and conditions', () => {
    const instruments = gameData.parts.filter((part) => part.type === 'instrument').map((part) => part.id);
    const power = gameData.parts.filter((part) => part.type === 'power').map((part) => part.id);
    const comms = gameData.parts.filter((part) => part.type === 'comms').map((part) => part.id);
    let checked = 0;
    for (const scenario of gameData.scenarios) {
      for (let seed = 0; seed < 60; seed += 1) {
        const pick = (list, n) => list[(seed * 7 + n * 13) % list.length];
        const design = {
          partIds: [pick(instruments, 1), pick(instruments, 2), pick(power, 3), ...(seed % 9 === 0 ? [] : [pick(comms, 4)])],
          orbitId: seed % 11 === 0 ? null : scenario.allowedOrbits[seed % scenario.allowedOrbits.length],
          rocketId: gameData.rockets[seed % gameData.rockets.length].id,
        };
        const simulation = simulateMission(resolveDesign(design, gameData), scenario, gameData.events, seed);
        const diagnosis = diagnoseFailure(simulation, scenario);
        const line = capiLine({ screen: 'report', scenario, content: gameData.content, data: gameData, simulation, runCount: 1 });
        expect(line.say).toBe(diagnosis ? `failure-${diagnosis.cause}` : 'report-success');
        if (line.say === 'failure-events') {
          expect(diagnosis.harmed.length).toBeGreaterThan(0);
          expect(diagnosis.beforeEvents).toBeGreaterThanOrEqual(scenario.minScience);
        }
        // No event is ever mentioned for a flight that ended before the science phase
        if (!simulation.phases.some((phase) => phase.id === 'operations' && phase.ok !== null)) expect(simulation.events).toEqual([]);
        checked += 1;
      }
    }
    expect(checked).toBe(180);
  });
});

describe('report screen', () => {
  it('shows the debrief and the score separately, in every language', () => {
    for (const locale of ['en', 'pt', 'es']) {
      setLocale(locale);
      let state = { ...createInitialState(), scenarioId: 'earth-observation', design: { ...demo } };
      const simulation = runSimulation(state);
      state = { ...launch(state, simulation, attemptSummary(simulation, earth, { run: 1 })), screen: 'report', report: { score: { total: 73, breakdown: { science: 33, efficiency: 20, objective: 20 } } } };
      const html = reportScreen({
        state, simulation, data: gameData, content: gameData.content, ui: { reportBadges: [] }, shake: new Set(),
        scenario: selectScenario(state), mission: selectMission(state), evaluation: selectEvaluation(state),
      });
      expect(html).toContain('class="debrief"');
      expect(html).toContain('class="score-caption"');
      expect(html).toContain('data-action="redesign"');
    }
  });
});
