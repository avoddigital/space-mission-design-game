// Commander Capi's lines: what she says at each key moment of a mission.
// Pure functions (no DOM, no audio): they read the game state and return one line, or null.
//
// A line has two parts:
// - `say`: a fixed sentence from the narration catalog (catalog.js). It is the only part that is
//   spoken (recorded or synthesized) and it never contains numbers, part names or results.
// - `detail`: the facts of this mission (question, margins, cause, next step), as localized text.
// Both are always shown on screen.
//
// Every line has a stable `id` that does not depend on the language, so re-rendering the screen,
// switching language or opening a detail never makes her repeat herself. A new id means a real
// change in the game (new screen, new launch, a limit just broken, an event that really happened).

import { t } from '../../i18n/index.js';
import { fmt } from '../format.js';
import { formatIssue } from '../../engine/messages.js';
import { issueRoute } from '../../engine/phases.js';
import { EVENT_SAFE_MARGIN } from '../../engine/constants.js';
import { RISKY_RATIO } from '../components/meter.js';
import { narrationLine } from './catalog.js';
import { debriefMission } from '../../engine/debrief.js';

/** The resources Capi talks about (science has its own goal and is not a margin). */
const RESOURCES = ['budget', 'mass', 'power', 'data', 'time'];

/** Issues that only mean "you have not chosen this yet", not a design problem. */
const MISSING = new Set(['NO_ROCKET', 'NO_ORBIT', 'MISSING_REQUIRED_TYPE']);


/**
 * @typedef {object} CapiLine
 * @property {string} id stable id; the voice plays only when it changes
 * @property {string} mood which portrait to show (see panel.js)
 * @property {string|null} say narration catalog id of the spoken sentence; null: shown, never spoken
 * @property {string} lead the spoken sentence (or a short title when nothing is spoken)
 * @property {string} detail the facts of this mission, shown under it
 */
function line(id, mood, say, detail = '') {
  return { id, mood, say, lead: t(narrationLine(say).text), detail };
}

/** A line that is only shown (the moment already has its own sounds). */
const silentLine = (id, mood, lead, detail = '') => ({ id, mood, say: null, lead, detail });

const join = (...parts) => parts.filter(Boolean).join(' ');

/** Resource name inside a sentence ("power margin"), in the current language. */
const resourceName = (key, content) => String(content?.meters?.[key]?.name ?? key).toLocaleLowerCase();

/** Resources that are valid but have almost no room left (the same rule as the CHECK lines). */
export function thinResources(budget) {
  return RESOURCES.filter((key) => {
    const entry = budget?.[key];
    return entry && entry.status !== 'over' && (entry.status === 'tight' || (entry.ratio ?? 0) > RISKY_RATIO);
  });
}

/**
 * Is the spacecraft ready to fly? Same evaluation as the launch checklist.
 * @returns {{ status: 'incomplete'|'blocked'|'tight'|'ready', issue: object|null, thin: string[] }}
 */
export function launchReadiness(evaluation) {
  const errors = evaluation.issues.filter((issue) => issue.severity === 'error');
  const real = errors.filter((issue) => !MISSING.has(issue.code));
  if (real.length) return { status: 'blocked', issue: real[0], thin: [] };
  if (errors.length) return { status: 'incomplete', issue: errors[0], thin: [] };
  const thin = thinResources(evaluation.budget);
  const warning = evaluation.issues.find((issue) => issue.severity === 'warning') ?? null;
  if (thin.length || warning) return { status: 'tight', issue: warning, thin };
  return { status: 'ready', issue: null, thin: [] };
}

/** The event Capi reacts to: one that hurt first (it is the lesson), else the first one. */
export function eventToDiscuss(events = []) {
  return events.find((event) => event.harmed) ?? events[0] ?? null;
}

/** Has the flight timeline already shown the science phase (where events happen)? */
export function eventsVisible(simulation, shown) {
  const index = simulation.phases.findIndex((phase) => phase.id === 'operations');
  return index !== -1 && shown > index && simulation.events.length > 0;
}

function briefLine({ scenario, content }) {
  const question = content?.scenarios?.[scenario.id]?.question ?? scenario.name;
  return line(`brief:${scenario.id}`, 'briefing', 'briefing', t('capi.brief.detail', {
    question,
    science: fmt(scenario.minScience),
    budget: fmt(scenario.budgetMUsd),
    days: fmt(scenario.maxDays),
  }));
}

function buildLine({ scenario, evaluation, cue, content, data, runCount = 0 }) {
  // A limit the player just broke: the real numbers (engine message) and the consequence, while it is still broken.
  if (cue?.type === 'over' && evaluation.budget[cue.resource]?.status === 'over') {
    const facts = cue.issue ? formatIssue(cue.issue, content, data).text : '';
    return line(`build:${runCount}:over:${cue.resource}`, 'builder', 'build-limit', join(facts, t(`capi.overWhy.${cue.resource}`)));
  }
  return line(`build:${scenario.id}`, 'builder', 'build-intro');
}

function launchLine({ evaluation, content, data, mission, runCount = 0 }) {
  // Ids carry the launch number: after a redesign, the new summary may be said again.
  const id = (rest) => `launch:${runCount}:${rest}`;
  const { status, issue, thin } = launchReadiness(evaluation);
  if (status === 'incomplete') {
    const detail = mission.orbit ? t('capi.launch.pickRocket', { kg: fmt(evaluation.budget.mass.usedKg) }) : t('capi.launch.pickOrbit');
    return line(id('incomplete'), 'launch', 'launch-choose', detail);
  }
  if (status === 'blocked') {
    const message = formatIssue(issue, content, data);
    return line(id(`blocked:${issue.code}`), 'launch', 'launch-blocked', t('capi.launch.blockedDetail', { problem: message.title, step: issueRoute(issue).step }));
  }
  if (status === 'tight') {
    const names = thin.map((key) => resourceName(key, content)).join(', ');
    const detail = names ? t('capi.launch.tightDetail', { list: names }) : formatIssue(issue, content, data).title;
    return line(id(`tight:${thin.join('+') || issue?.code}`), 'launch', 'launch-tight', detail);
  }
  return line(id('ready'), 'launch', 'launch-ready');
}

function flightLine({ simulation, shown, runCount, data, content }) {
  if (eventsVisible(simulation, shown)) {
    const event = eventToDiscuss(simulation.events);
    const values = {
      event: data.events?.find((item) => item.id === event.id)?.name ?? event.id,
      resource: resourceName(event.protectedBy, content),
      pct: event.marginPct,
      safe: Math.round(EVENT_SAFE_MARGIN * 100),
      loss: event.scienceLossPct,
    };
    return line(
      `event:${runCount}:${event.id}`,
      'surprise',
      event.harmed ? 'event-hurt' : 'event-safe',
      join(t(event.harmed ? 'capi.event.hurtDetail' : 'capi.event.safeDetail', values), simulation.events.length > 1 ? t('capi.event.more') : ''),
    );
  }
  // Liftoff: the countdown and the rumble already speak, so this line is only shown.
  return silentLine(`flight:${runCount}`, 'launch', t('capi.flight.lead'), t('capi.flight.detail'));
}

/**
 * Capi's reflection after a flight: short questions about the decisions, never the answer and never
 * a judgement of the player. The facts (cause, numbers, events) are in the report's debrief; she only
 * asks about what the engine confirmed (diagnosis.js / debrief.js).
 */
function reflection(debrief, content) {
  const { diagnosis, risk, events } = debrief;
  if (diagnosis) {
    const specific = diagnosis.cause === 'data' && diagnosis.issue.code !== 'LOW_SCIENCE' ? 'capi.reflect.dataNone' : `capi.reflect.${diagnosis.cause}`;
    return join(t('capi.reflect.first'), t(specific));
  }
  if (risk?.event) return t('capi.reflect.events');
  if (events.some((event) => !event.harmed)) return t('capi.reflect.reserve');
  if (risk) return t('capi.reflect.thin', { resource: content?.meters?.[risk.resource]?.name ?? risk.resource });
  return t('capi.reflect.more');
}

function reportLine({ simulation, scenario, content, runCount }) {
  const debrief = debriefMission(simulation, scenario);
  if (!debrief.diagnosis) return line(`report:${runCount}`, 'success', 'report-success', reflection(debrief, content));
  // One spoken sentence per real cause; never blame an event for a failure that came before it.
  return line(`report:${runCount}`, 'failure', `failure-${debrief.diagnosis.cause}`, reflection(debrief, content));
}

function rebuildLine({ cue, content, data }) {
  const detail = cue.issue
    ? t('capi.rebuild.cause', { cause: formatIssue(cue.issue, content, data).title })
    : t('capi.rebuild.success');
  // Same surprises next time (a fair comparison), or not known because the flight stopped too early.
  const conditions = cue.conditions === 'same' ? t('capi.rebuild.same') : cue.conditions === 'unknown' ? t('capi.rebuild.unknown') : '';
  return line(`rebuild:${cue.run}`, 'thinking', 'rebuild', join(detail, conditions));
}

/**
 * Capi's line for the current moment, or null when she has nothing to add (command center, menus).
 * @param {object} ctx
 * @param {string} ctx.screen state.screen
 * @param {object} [ctx.scenario] @param {object} [ctx.content] @param {object} [ctx.data]
 * @param {object} [ctx.evaluation] selectEvaluation result (design screens)
 * @param {object} [ctx.mission] resolved parts, orbit and rocket
 * @param {object|null} [ctx.simulation] @param {number} [ctx.shown] flight phases already shown
 * @param {number} [ctx.runCount] launches in this mission
 * @param {object|null} [ctx.cue] screen-only hint from the UI:
 *   { type: 'over', resource } a limit just broken on the spacecraft step, or
 *   { type: 'rebuild', run, issue, screen } the player chose to redesign after a flight
 * @returns {CapiLine|null}
 */
export function capiLine(ctx) {
  const { screen, cue } = ctx;
  if (screen === 'menu') return line('menu', 'welcome', 'menu');
  if (!ctx.scenario) return null;
  // Back from a report to redesign: invite a hypothesis on the screen the player landed on.
  if (cue?.type === 'rebuild' && cue.screen === screen && cue.run === ctx.runCount && (screen === 'spacecraft' || screen === 'launch')) {
    return rebuildLine(ctx);
  }
  switch (screen) {
    case 'objective':
      return briefLine(ctx);
    case 'spacecraft':
      return buildLine(ctx);
    case 'launch':
      return launchLine(ctx);
    case 'simulation':
      return ctx.simulation ? flightLine(ctx) : null;
    case 'report':
      return ctx.simulation ? reportLine(ctx) : null;
    default:
      return null;
  }
}
