// The mission debrief on the report: science goal, what worked, what stopped the mission (or the
// biggest risk), the limiting resource with a change to test, the surprises, and the comparison with
// the last attempt. Presentation only: every fact comes from src/engine/debrief.js.
// It talks about the spacecraft and the decisions, never about the player ("the antenna sends...",
// not "you failed").

import { esc, fmt } from '../format.js';
import { icon } from './icons.js';
import { t } from '../../i18n/index.js';
import { formatIssue, fillText } from '../../engine/messages.js';
import { EVENT_SAFE_MARGIN } from '../../engine/constants.js';

const SAFE = Math.round(EVENT_SAFE_MARGIN * 100);
const resourceName = (key, content) => (key === 'science' ? t('score.science') : content?.meters?.[key]?.name ?? key);
const lower = (text) => String(text).toLocaleLowerCase();
const eventName = (id, data) => data.events?.find((item) => item.id === id)?.name ?? id;

/** One line for a system that worked, with the engine's numbers. */
function systemLine(key, { simulation, mission }) {
  const b = simulation.budget;
  switch (key) {
    case 'budget':
      return t('debrief.sys.budget', { used: fmt(b.budget.usedMUsd), limit: fmt(b.budget.limitMUsd) });
    case 'launch':
      return t('debrief.sys.launch', { rocket: mission.rocket?.name ?? '', limit: fmt(b.mass.limitKg ?? 0), used: fmt(b.mass.usedKg) });
    case 'orbit':
      return t('debrief.sys.orbit', { orbit: mission.orbit?.name ?? '' });
    case 'power':
      return t('debrief.sys.power', { made: fmt(b.power.generatedW), used: fmt(b.power.consumedW) });
    case 'time':
      return t('debrief.sys.time', { used: fmt(b.time.totalDays), limit: fmt(b.time.limitDays) });
    case 'data':
      return t('debrief.sys.data', { sent: fmt(b.data.downlinkGbPerDay), made: fmt(b.data.producedGbPerDay) });
    default:
      return '';
  }
}

/** What stopped the mission, said about the spacecraft, with the engine's numbers. */
function causeSentence(diagnosis, { simulation, data }) {
  const { cause, issue } = diagnosis;
  const b = simulation.budget;
  switch (cause) {
    case 'budget':
      return t('debrief.cause.budget', { excess: fmt(issue.excessMUsd) });
    case 'launch':
      if (issue.code === 'PAYLOAD_TOO_HEAVY') return t('debrief.cause.launchHeavy', { excess: fmt(issue.excessKg), capacity: fmt(issue.capacityKg) });
      return t(issue.code === 'NO_ROCKET' ? 'debrief.cause.launchNone' : 'debrief.cause.launchReach');
    case 'orbit':
      return t('debrief.cause.orbit');
    case 'power':
      return issue.code === 'POWER_DEFICIT' ? t('debrief.cause.power', { missing: fmt(issue.missingW) }) : t('debrief.cause.powerNone');
    case 'time':
      return t('debrief.cause.time', { excess: fmt(issue.excessDays) });
    case 'data':
      return issue.code === 'LOW_SCIENCE'
        ? t('debrief.cause.dataSlow', { sent: fmt(b.data.downlinkGbPerDay), made: fmt(b.data.producedGbPerDay), before: fmt(diagnosis.beforeEvents), designed: fmt(diagnosis.designScience) })
        : t('debrief.cause.dataNone');
    case 'science':
      return issue.code === 'LOW_SCIENCE' ? t('debrief.cause.science', { designed: fmt(diagnosis.designScience), goal: fmt(diagnosis.goal) }) : t('debrief.cause.scienceNone');
    case 'events':
      return t('debrief.cause.events', {
        before: fmt(diagnosis.beforeEvents), after: fmt(diagnosis.delivered), goal: fmt(diagnosis.goal),
        list: diagnosis.harmed.map((event) => eventName(event.id, data)).join(', '),
      });
    default:
      return formatIssue(issue, data.content, data).text;
  }
}

/** A change worth testing next, from the limiting resource and the engine's numbers. */
function testSentence(debrief, { simulation, content }) {
  const { diagnosis, limit } = debrief;
  const b = simulation.budget;
  if (!diagnosis) {
    return limit.resource ? t('debrief.test.success', { resource: lower(resourceName(limit.resource, content)) }) : '';
  }
  const { cause, issue } = diagnosis;
  switch (cause) {
    case 'budget':
      return t('debrief.test.budget', { excess: fmt(issue.excessMUsd) });
    case 'launch':
      if (issue.code === 'PAYLOAD_TOO_HEAVY') return t('debrief.test.launchHeavy', { excess: fmt(issue.excessKg), used: fmt(b.mass.usedKg) });
      return t(issue.code === 'NO_ROCKET' ? 'debrief.test.launchNone' : 'debrief.test.launchReach');
    case 'orbit':
      return t('debrief.test.orbit');
    case 'power':
      return issue.code === 'POWER_DEFICIT' ? t('debrief.test.power', { missing: fmt(issue.missingW) }) : t('debrief.test.powerNone');
    case 'time':
      return t('debrief.test.time', { excess: fmt(issue.excessDays) });
    case 'data':
      return issue.code === 'LOW_SCIENCE' ? t('debrief.test.dataSlow', { made: fmt(b.data.producedGbPerDay) }) : t('debrief.test.dataNone');
    case 'science':
      return issue.code === 'LOW_SCIENCE'
        ? t('debrief.test.science', { missing: fmt(Math.round((diagnosis.goal - diagnosis.designScience) * 10) / 10) })
        : t('debrief.test.scienceNone');
    case 'events':
      return t('debrief.test.events', { safe: SAFE, resource: lower(resourceName(limit.resource, content)), pct: limit.marginPct ?? 0 });
    default:
      return '';
  }
}

function limitSentence(debrief, content) {
  const { diagnosis, limit } = debrief;
  if (diagnosis?.cause === 'orbit') return t('debrief.limitOrbit');
  if (!limit.resource) return '';
  const name = resourceName(limit.resource, content);
  if (!diagnosis) return t('debrief.limitTightest', { resource: name, pct: limit.marginPct });
  return limit.marginPct === null ? t('debrief.limit', { resource: name }) : t('debrief.limitPct', { resource: name, pct: limit.marginPct });
}

function riskSentence(debrief, { content, data }) {
  const { risk } = debrief;
  if (!risk) return t('debrief.risk.none', { safe: SAFE });
  const resource = lower(resourceName(risk.resource, content));
  if (risk.event) return t('debrief.risk.event', { event: eventName(risk.event.id, data), loss: risk.event.scienceLossPct, resource, pct: risk.marginPct });
  return t('debrief.risk.thin', { resource: resourceName(risk.resource, content), pct: risk.marginPct });
}

function eventRows(debrief, { simulation, content, data }) {
  if (!debrief.events.length) {
    const reached = simulation.phases.some((phase) => phase.id === 'operations' && phase.ok !== null);
    return `<p class="note">${t(reached ? 'debrief.eventsNone' : 'debrief.eventsNotReached')}</p>`;
  }
  return `<ul class="lessons">${debrief.events.map((event) => {
    const values = { event: eventName(event.id, data), resource: lower(resourceName(event.protectedBy, content)), pct: event.marginPct, safe: SAFE, loss: event.scienceLossPct };
    const lesson = data.events?.find((item) => item.id === event.id)?.lesson;
    return `<li class="${event.harmed ? 'is-hurt' : 'is-safe'}">${icon(event.harmed ? 'warn' : 'shield', 16)}<span>${esc(t(event.harmed ? 'debrief.eventHurt' : 'debrief.eventSafe', values))}${lesson ? ` <small>${esc(fillText(lesson, {}))}</small>` : ''}</span></li>`;
  }).join('')}</ul>`;
}

function compareBlock(comparison) {
  if (!comparison) return '';
  const outcome = (value) => t(value === 'success' ? 'debrief.outcome.success' : 'debrief.outcome.failure');
  const cause = (value) => t(`debrief.causeName.${value ?? 'none'}`);
  const lines = [t('debrief.compare.science', { before: fmt(comparison.scienceBefore), now: fmt(comparison.scienceNow) })];
  if (comparison.outcomeBefore !== comparison.outcomeNow) lines.push(t('debrief.compare.outcome', { before: outcome(comparison.outcomeBefore), now: outcome(comparison.outcomeNow) }));
  if (comparison.causeBefore !== comparison.causeNow) lines.push(t('debrief.compare.cause', { before: cause(comparison.causeBefore), now: cause(comparison.causeNow) }));
  if (comparison.nowWorking.length) lines.push(t('debrief.compare.working', { list: comparison.nowWorking.map((key) => t(`debrief.sysName.${key}`)).join(', ') }));
  const tone = comparison.conditions === 'same' ? 'is-same' : 'is-different';
  return `
    <div class="debrief-compare">
      <h4>${icon('dice', 16)} ${t('debrief.compare', { n: comparison.previousRun })}</h4>
      <ul>${lines.map((line) => `<li>${esc(line)}</li>`).join('')}</ul>
      <p class="debrief-conditions ${tone}">${esc(t(`debrief.conditions.${comparison.conditions}`))}</p>
    </div>`;
}

/**
 * @param {object} debrief debriefMission result
 * @param {object|null} comparison compareAttempts result
 * @param {object} ctx { simulation, mission, scenario, content, data }
 */
export function debriefSection(debrief, comparison, ctx) {
  const { content } = ctx;
  const worked = debrief.systems.filter((item) => item.status === 'ok');
  const notReached = debrief.systems.filter((item) => item.status === 'not-reached');
  const goal = debrief.goal;
  const test = testSentence(debrief, ctx);
  return `
    <section class="debrief" aria-labelledby="debrief-title">
      <h3 id="debrief-title">${icon('flag', 18)} ${t('debrief.title')}</h3>
      <p class="debrief-goal ${goal.reached ? 'is-reached' : 'is-missed'}">${icon(goal.reached ? 'check' : 'cross', 16)}
        ${esc(t(goal.reached ? 'debrief.goalReached' : 'debrief.goalMissed', { sent: fmt(goal.delivered), goal: fmt(goal.goal) }))}</p>
      <h4>${t('debrief.worked')}</h4>
      ${worked.length
        ? `<ul class="debrief-worked">${worked.map((item) => `<li>${icon('check', 14)} ${esc(systemLine(item.key, ctx))}</li>`).join('')}</ul>`
        : `<p class="note">${t('debrief.workedNone')}</p>`}
      ${notReached.length ? `<p class="note">${esc(t('debrief.notReached', { list: notReached.map((item) => t(`debrief.sysName.${item.key}`)).join(', ') }))}</p>` : ''}
      <h4>${t(debrief.diagnosis ? 'debrief.causeTitle' : 'debrief.riskTitle')}</h4>
      <p>${esc(debrief.diagnosis ? causeSentence(debrief.diagnosis, ctx) : riskSentence(debrief, ctx))}</p>
      <h4>${t('debrief.limitTitle')}</h4>
      <p>${esc(limitSentence(debrief, content))}${test ? ` <strong>${esc(test)}</strong>` : ''}</p>
      <h4>${icon('storm', 16)} ${t('debrief.events')}</h4>
      ${eventRows(debrief, ctx)}
      ${compareBlock(comparison)}
    </section>`;
}
