// Steps 4 (simulation) and 5 (report).

import { esc, fmt } from '../format.js';
import { formatIssue, fillText } from '../../engine/messages.js';
import { checklist } from '../components/checklist.js';
import { learnBox } from '../components/overlays.js';
import { icon } from '../components/icons.js';
import { gameLayout } from './design.js';
import { reportRewards } from '../components/rewards.js';
import { libraryMissions, libraryTopics } from '../../data/library.js';
import { phases, agencyEvents } from '../../data/campaign.js';
import { t, localizeList } from '../../i18n/index.js';
import { ACHIEVEMENTS } from '../../engine/achievements.js';
import { patch } from './badges.js';

const libraryName = (id) => {
  const entry = [...localizeList(libraryMissions, 'library.missions'), ...localizeList(libraryTopics, 'library.topics')].find((item) => item.id === id);
  return entry?.name ?? entry?.title ?? id;
};

/** Campaign only: money spent, rewards, unlocks and the agency event after this mission. */
function agencyBlock(result, campaign) {
  if (!result || !campaign) return '';
  const lines = [];
  const phase = localizeList(phases, 'campaign.phases').find((item) => item.id === result.phaseId);
  if (result.success) {
    if (result.firstSuccess) lines.push(`<li>${icon('flag', 16)}<span><strong>${t('agency.phaseComplete', { phase: esc(phase?.name ?? '') })}</strong> ${result.finished ? t('agency.allDone') : t('agency.nextOpen')}</span></li>`);
    if (result.fundsMUsd) lines.push(`<li>${icon('budget', 16)}<span>${t('agency.reward')} <strong>+${fmt(result.fundsMUsd)} M USD</strong></span></li>`);
    lines.push(`<li>${icon('science', 16)}<span>${t('agency.sciencePoints')} <strong>+${fmt(result.science)}</strong> ${t('agency.scienceWhy')}</span></li>`);
  } else {
    lines.push(`<li>${icon('cross', 16)}<span>${t('agency.lost')}</span></li>`);
  }
  if (result.unlocked?.length) lines.push(`<li>${icon('book', 16)}<span>${t('agency.newInLibrary')} <strong>${result.unlocked.map((id) => esc(libraryName(id))).join(', ')}</strong></span></li>`);
  const event = result.event ? localizeList(agencyEvents, 'campaign.agencyEvents').find((item) => item.id === result.event.id) : null;
  const eventBlock = event
    ? `<div class="agency-event">${icon(event.icon, 18)}<span><strong>${esc(event.name)}.</strong> ${esc(event.text)} ${[
        event.reward.fundsMUsd ? `${event.reward.fundsMUsd > 0 ? '+' : ''}${fmt(event.reward.fundsMUsd)} M USD` : '',
        event.reward.science ? t('agency.plusScience', { n: event.reward.science }) : '',
      ].filter(Boolean).join(', ')}</span></div>`
    : '';
  return `
    <section class="agency-result" aria-labelledby="agency-title">
      <h3 id="agency-title">${icon('flag', 16)} ${t('agency.title')}</h3>
      <ul class="lessons">${lines.join('')}</ul>
      ${eventBlock}
      <p class="agency-totals">${t('agency.totals', { funds: `<b>${fmt(campaign.fundsMUsd)} M USD</b>`, science: `<b>${fmt(campaign.science)}</b>` })}</p>
    </section>`;
}

const PHASE_NAMES = { launch: 'phase.launch', transfer: 'phase.transfer', operations: 'phase.operations', data: 'phase.data' };
const PHASE_ICONS = { launch: 'rocket', transfer: 'orbit', operations: 'science', data: 'comms' };

/** How many phases the timeline has to show (it stops at the failed phase). */
export function phasesToShow(simulation) {
  const failed = simulation.phases.findIndex((phase) => phase.ok === false);
  return failed === -1 ? simulation.phases.length : failed + 1;
}

function phaseText(phase, ctx) {
  const { mission, scenario, content, data, simulation } = ctx;
  if (phase.ok === false) {
    const message = formatIssue(phase.issues[0], content, data);
    return `${message.title}. ${message.text}`;
  }
  const instruments = mission.parts.filter((part) => part.type === 'instrument').length;
  switch (phase.id) {
    case 'launch':
      return t('phase.launchText', { rocket: mission.rocket?.name ?? t('phase.theRocket'), kg: fmt(simulation.budget.mass.usedKg) });
    case 'transfer':
      return mission.orbit?.transferDays
        ? t('phase.transferText', { days: fmt(mission.orbit.transferDays), orbit: mission.orbit.name })
        : t('phase.directText', { orbit: mission.orbit?.name ?? t('phase.itsOrbit') });
    case 'operations':
      return t(instruments === 1 ? 'phase.opsTextOne' : 'phase.opsText', { n: instruments, days: fmt(scenario.operationDays) });
    case 'data':
      return t('phase.dataText', { sent: fmt(simulation.scienceDelivered), goal: fmt(scenario.minScience) });
    default:
      return '';
  }
}

/** Event card: green when the margin protected the spacecraft, amber when it hurt. */
function eventCard(simEvent, data) {
  const event = data.events?.find((item) => item.id === simEvent.id);
  if (!event) return '';
  const text = fillText(simEvent.harmed ? event.hurtText : event.safeText, simEvent);
  return `
    <div class="event ${simEvent.harmed ? 'event-hurt' : 'event-safe'}">
      <span class="event-icon">${icon(simEvent.harmed ? 'warn' : 'shield', 22)}</span>
      <span class="event-body">
        <strong>${esc(event.name)}</strong>
        <p>${esc(text)}</p>
        ${simEvent.harmed ? `<p class="event-loss">${t('event.loss', { n: simEvent.scienceLossPct })}</p>` : ''}
      </span>
    </div>`;
}

// --- Step 4: simulation ---

export function simulationScreen(ctx) {
  const { simulation, ui, data } = ctx;
  if (!simulation) {
    return gameLayout({ ...ctx, title: t('steps.flight'), cards: `<p>${t('flight.none')}</p>`, stage: '', footer: `<button type="button" class="btn" data-action="go-step" data-value="3">${icon('back', 16)} ${t('common.back')}</button>` });
  }
  const total = phasesToShow(simulation);
  const shown = Math.min(ui.simShown, total);
  const done = shown >= total;
  const timeline = simulation.phases
    .map((phase, index) => {
      const name = `<span class="phase-name">${icon(PHASE_ICONS[phase.id], 18)} ${t(PHASE_NAMES[phase.id])}</span>`;
      if (index >= shown) {
        const waiting = index === shown && !done;
        return `<li class="phase ${waiting ? 'phase-running' : 'phase-waiting'}">${name}<span class="phase-text">${waiting ? t('flight.inProgress') : index >= total ? t('flight.notReached') : t('flight.waiting')}</span></li>`;
      }
      const status = phase.ok === false ? 'phase-failed' : 'phase-ok';
      return `<li class="phase ${status}">${name}<span class="phase-text">${esc(phaseText(phase, ctx))}</span></li>`;
    })
    .join('');

  const operationsShown = shown > simulation.phases.findIndex((phase) => phase.id === 'operations');
  const events = operationsShown && simulation.events.length
    ? `<h3>${icon('storm', 18)} ${t('flight.surprises')}</h3>${simulation.events.map((event) => eventCard(event, data)).join('')}`
    : '';
  const success = simulation.outcome === 'success';
  const result = done
    ? `<p class="sim-result ${success ? 'is-success' : 'is-failure'}">${icon(success ? 'check' : 'cross', 22)} ${success ? t('flight.complete') : t('flight.failed')}</p>`
    : '';

  const failedAtLaunch = simulation.phases[0]?.ok === false;
  const caption = !done
    ? t('flight.underway')
    : simulation.outcome === 'success'
      ? t('flight.captionSuccess')
      : failedAtLaunch
        ? t('flight.captionLaunchFail')
        : t('flight.captionFail');

  return gameLayout({
    ...ctx,
    title: t('flight.title'),
    results: true,
    hero: true,
    cards: `<ol class="timeline" aria-live="polite">${timeline}</ol>${result}${learnBox(ctx.content.learn?.simulation)}`,
    stage: `<div class="sim-stage${done && !success ? ' is-failed' : ''}">
      <div class="stage-sky" aria-hidden="true"></div>
      <div class="view3d-slot" data-view3d="flight"><p class="view3d-note">${t('common.loading3d')}</p></div>
      ${events || `<p class="hint">${caption}</p>`}</div>`,
    footer: done
      ? `<button type="button" class="btn btn-primary" data-action="see-report">${t('flight.seeReport')} ${icon('next', 16)}</button>`
      : `<button type="button" class="btn" data-action="skip">${t('flight.skip')} ${icon('next', 16)}</button>`,
  });
}

// --- Step 5: report ---

function scoreBlock(score) {
  const parts = [
    { name: t('score.science'), value: score.breakdown.science, max: 50 },
    { name: t('score.efficiency'), value: score.breakdown.efficiency, max: 30 },
    { name: t('score.objective'), value: score.breakdown.objective, max: 20 },
  ];
  return `
    <div class="score">
      <span class="ring ring-big" style="--angle:${Math.round(score.total * 3.6)}deg"><span class="ring-value"><span class="score-number" data-count-to="${score.total}">${score.total}</span><small>/100</small></span></span>
      <ul class="score-parts">${parts
        .map((part) => `<li><span>${part.name}</span><span class="score-bar"><i style="width:${Math.round((part.value / part.max) * 100)}%"></i></span><strong>${part.value} / ${part.max}</strong></li>`)
        .join('')}</ul>
    </div>`;
}

function quizBlock(quiz, report) {
  if (!quiz) return '';
  const answered = report.quizAnswered;
  const options = quiz.options
    .map((option, index) => {
      let tone = '';
      if (answered && index === quiz.answer) tone = ' is-right';
      else if (answered && index === report.quizChoice) tone = ' is-wrong';
      return `<button type="button" class="quiz-option${tone}" data-action="quiz" data-value="${index}" ${answered ? 'disabled' : ''}>${esc(option)}</button>`;
    })
    .join('');
  const feedback = answered
    ? `<p class="quiz-feedback">${report.quizRight ? `${icon('star', 16)} ${t('quiz.right', { badge: `<strong>${t('badge.expert')}</strong>` })}` : t('quiz.wrong')} ${esc(quiz.why)}</p>`
    : '';
  return `<section class="quiz" aria-labelledby="quiz-title"><h3 id="quiz-title">${icon('bulb', 18)} ${t('quiz.title')}</h3><p>${esc(quiz.q)}</p><div class="quiz-options">${options}</div>${feedback}</section>`;
}

function realMissions(missions = []) {
  if (!missions.length) return '';
  return `
    <section aria-labelledby="real-title"><h3 id="real-title">${icon('planet', 18)} ${t('report.realMissions')}</h3>
      ${missions
        .map(
          (mission) => `
        <div class="real-mission">
          <strong>${esc(mission.name)}</strong> <span class="note">${t('report.launched', { year: esc(mission.launchYear) })}</span>
          <p>${esc(mission.summary)}</p>
          ${mission.lesson ? `<p class="note">${esc(mission.lesson)}</p>` : ''}
          ${mission.url ? `<a href="${esc(mission.url)}" target="_blank" rel="noopener noreferrer">${t('report.learnMore')} ↗</a>` : ''}
        </div>`,
        )
        .join('')}
    </section>`;
}

export function reportScreen(ctx) {
  const { simulation, state, scenario, content, data } = ctx;
  const report = state.report ?? {};
  const score = report.score;
  if (!simulation || !score) return simulationScreen(ctx);

  const success = simulation.outcome === 'success';
  const tight = success && ['budget', 'mass', 'power', 'data', 'time'].some((key) => simulation.budget[key]?.status === 'tight');
  const failure = simulation.failedIssue ? formatIssue(simulation.failedIssue, content, data) : null;
  const harmed = simulation.events.filter((event) => event.harmed);
  const lessons = simulation.events
    .map((simEvent) => data.events?.find((event) => event.id === simEvent.id))
    .filter(Boolean)
    .map((event) => `<li>${icon('shield', 16)}<span><strong>${esc(event.name)}:</strong> ${esc(event.lesson)}</span></li>`)
    .join('');
  const scenarioText = content.scenarios?.[scenario.id] ?? {};

  const header = `
    <div class="report-head ${success ? 'is-success' : 'is-failure'}${report.isNewBest ? ' is-best' : ''}">
      <h2 class="report-title">${success ? t('report.success') : t('report.failure')}</h2>
      ${scoreBlock(score)}
      <div class="badges">
        ${report.isNewBest ? `<span class="badge badge-gold">${icon('star', 12)} ${t('badge.best')}</span>` : ''}
        ${tight ? `<span class="badge badge-tight">${t('badge.tight')}</span>` : ''}
        ${report.quizRight ? `<span class="badge badge-gold">${icon('bulb', 12)} ${t('badge.expert')}</span>` : ''}
      </div>
      ${(ctx.ui.reportBadges ?? []).length ? `<div class="report-patches"><span>${t('badges.thisMission')}</span>${ctx.ui.reportBadges.map((id) => {
        const item = ACHIEVEMENTS.find((entry) => entry.id === id);
        return `<button type="button" class="report-patch" data-action="badges" title="${esc(t(`ach.${id}.desc`))}">${patch(id, item?.icon ?? 'star', true, 'small')}${esc(t(`ach.${id}.name`))}</button>`;
      }).join('')}</div>` : ''}
    </div>`;

  const why = failure
    ? `<section class="report-why is-failure"><h3>${t('report.wrong')}</h3><p><strong>${esc(failure.title)}.</strong> ${esc(failure.text)}</p>
        ${harmed.length && simulation.failedIssue.code === 'LOW_SCIENCE' ? `<p>${t('report.eventsTook', { list: harmed.map((event) => `${esc(data.events.find((item) => item.id === event.id)?.name ?? event.id)} (−${event.scienceLossPct}%)`).join(', ') })}</p>` : ''}
        ${failure.tip ? `<p><strong>${t('report.tryThis')}</strong> ${esc(failure.tip)}</p>` : ''}</section>`
    : `<section class="report-why is-success"><h3>${t('report.why')}</h3><p>${t('report.whyText', { orbit: esc(ctx.mission.orbit?.name ?? t('phase.itsOrbit')), sent: fmt(simulation.scienceDelivered), goal: fmt(scenario.minScience) })}</p></section>`;

  const learn = failure?.learn ? { text: failure.learn, rule: content.learn?.report?.rule } : content.learn?.report;

  const campaignMode = state.mode === 'campaign';
  const cards = `
    ${header}
    ${reportRewards(report)}
    ${campaignMode ? agencyBlock(ctx.ui.campaignResult, state.campaign) : ''}
    ${why}
    ${lessons ? `<section><h3>${icon('storm', 18)} ${t('report.surprises')}</h3><ul class="lessons">${lessons}</ul></section>` : ''}
    ${learnBox(learn)}
    ${quizBlock(scenarioText.quiz, report)}`;

  const stage = `
    <h3>${icon('flag', 18)} ${t('report.checklist')}</h3>
    ${checklist({ budget: simulation.budget, issues: simulation.issues }, content, data)}
    ${realMissions(scenarioText.realMissions)}`;

  const layout = gameLayout({
    ...ctx,
    title: t('report.title', { n: state.runCount }),
    results: true,
    cards,
    stage,
    footer: campaignMode
      ? `
      <button type="button" class="btn btn-primary" data-action="hub">${icon('home', 16)} ${t('common.commandCenter')}</button>
      <button type="button" class="btn" data-action="redesign">${icon('wrench', 16)} ${t('report.redesign')}</button>
      <button type="button" class="btn" data-action="new-conditions">${icon('dice', 16)} ${t('report.launchAgain')}</button>`
      : `
      <button type="button" class="btn btn-primary" data-action="redesign">${icon('wrench', 16)} ${t('report.redesign')}</button>
      <button type="button" class="btn" data-action="new-conditions">${icon('dice', 16)} ${t('report.newConditions')}</button>
      <button type="button" class="btn" data-action="next-mission">${t('report.nextMission')} ${icon('next', 16)}</button>
      <button type="button" class="btn" data-action="menu">${icon('home', 16)} ${t('common.mainMenu')}</button>`,
  });
  return layout;
}
