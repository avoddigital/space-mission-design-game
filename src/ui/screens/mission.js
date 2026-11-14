// Steps 4 (simulation) and 5 (report).

import { esc, fmt } from '../format.js';
import { formatIssue, fillText } from '../../engine/messages.js';
import { checklist } from '../components/checklist.js';
import { learnBox } from '../components/overlays.js';
import { gameLayout } from './design.js';
import { reportRewards, confetti } from '../components/rewards.js';

const PHASE_NAMES = { launch: 'Launch', transfer: 'Transfer', operations: 'Operations', data: 'Data return' };

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
      return `Liftoff! The ${mission.rocket?.name ?? 'rocket'} carried your ${fmt(simulation.budget.mass.usedKg)} kg spacecraft to space.`;
    case 'transfer':
      return mission.orbit?.transferDays
        ? `Your spacecraft traveled for ${fmt(mission.orbit.transferDays)} days to reach ${mission.orbit.name}.`
        : `Your spacecraft reached ${mission.orbit?.name ?? 'its orbit'} right after launch.`;
    case 'operations':
      return `Science time: ${instruments} instrument${instruments === 1 ? '' : 's'} working for ${fmt(scenario.operationDays)} days.`;
    case 'data':
      return `Your antenna sent ${fmt(simulation.scienceDelivered)} science points home. The goal was ${fmt(scenario.minScience)}.`;
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
      <strong>${simEvent.harmed ? '⚠️' : '🛡️'} ${esc(event.name)}</strong>
      <p>${esc(text)}</p>
      ${simEvent.harmed ? `<p class="event-loss">−${simEvent.scienceLossPct}% science</p>` : ''}
    </div>`;
}

// --- Step 4: simulation ---

export function simulationScreen(ctx) {
  const { simulation, ui, data } = ctx;
  if (!simulation) {
    return gameLayout({ ...ctx, title: 'Step 4 · Simulation', cards: '<p>Launch from step 3 to start the simulation.</p>', stage: '', footer: '<button type="button" class="btn" data-action="go-step" data-value="3">← Back</button>' });
  }
  const total = phasesToShow(simulation);
  const shown = Math.min(ui.simShown, total);
  const done = shown >= total;
  const timeline = simulation.phases
    .map((phase, index) => {
      if (index >= shown) {
        const waiting = index === shown && !done;
        return `<li class="phase ${waiting ? 'phase-running' : 'phase-waiting'}"><span class="phase-name">${PHASE_NAMES[phase.id]}</span><span class="phase-text">${waiting ? 'In progress…' : index >= total ? 'Not reached.' : 'Waiting…'}</span></li>`;
      }
      const status = phase.ok === false ? 'phase-failed' : 'phase-ok';
      return `<li class="phase ${status}"><span class="phase-name">${phase.ok === false ? '❌' : '✅'} ${PHASE_NAMES[phase.id]}</span><span class="phase-text">${esc(phaseText(phase, ctx))}</span></li>`;
    })
    .join('');

  const operationsShown = shown > simulation.phases.findIndex((phase) => phase.id === 'operations');
  const events = operationsShown && simulation.events.length
    ? `<h3>Surprises during the mission</h3>${simulation.events.map((event) => eventCard(event, data)).join('')}`
    : '';
  const result = done
    ? `<p class="sim-result ${simulation.outcome === 'success' ? 'is-success' : 'is-failure'}">${simulation.outcome === 'success' ? 'Mission complete!' : 'Mission failed.'}</p>`
    : '';

  const failedAtLaunch = simulation.phases[0]?.ok === false;
  const caption = !done
    ? 'Your mission is underway…'
    : simulation.outcome === 'success'
      ? 'Mission complete. Open the report to see your score.'
      : failedAtLaunch
        ? 'The mission ended at launch. Open the report to see why.'
        : 'The mission failed. Open the report to see why.';

  return gameLayout({
    ...ctx,
    title: 'Step 4 · Simulation',
    results: true,
    cards: `<ol class="timeline" aria-live="polite">${timeline}</ol>${result}${learnBox(ctx.content.learn?.simulation)}`,
    stage: `<div class="sim-stage${done && simulation.outcome === 'failure' ? ' is-failed' : ''}">
      <div class="view3d-slot" data-view3d="flight"><p class="view3d-note">Loading 3D view…</p></div>
      ${events || `<p class="hint">${caption}</p>`}</div>`,
    footer: done
      ? '<button type="button" class="btn btn-primary" data-action="see-report">See the report →</button>'
      : '<button type="button" class="btn" data-action="skip">Skip animation ⏭</button>',
  });
}

// --- Step 5: report ---

function scoreBlock(score) {
  const parts = [
    { name: 'Science', value: score.breakdown.science, max: 50 },
    { name: 'Efficiency', value: score.breakdown.efficiency, max: 30 },
    { name: 'Objective', value: score.breakdown.objective, max: 20 },
  ];
  return `
    <div class="score">
      <span class="score-total"><span class="score-number" data-count-to="${score.total}">${score.total}</span><small> / 100</small></span>
      <ul class="score-parts">${parts.map((part) => `<li><span>${part.name}</span><strong>${part.value} / ${part.max}</strong></li>`).join('')}</ul>
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
    ? `<p class="quiz-feedback">${report.quizRight ? '🏅 Correct! You earned the <strong>Mission expert</strong> badge.' : 'Not quite.'} ${esc(quiz.why)}</p>`
    : '';
  return `<section class="quiz" aria-labelledby="quiz-title"><h3 id="quiz-title">Quick question</h3><p>${esc(quiz.q)}</p><div class="quiz-options">${options}</div>${feedback}</section>`;
}

function realMissions(missions = []) {
  if (!missions.length) return '';
  return `
    <section aria-labelledby="real-title"><h3 id="real-title">Real missions like yours</h3>
      ${missions
        .map(
          (mission) => `
        <div class="real-mission">
          <strong>${esc(mission.name)}</strong> <span class="note">(launched ${esc(mission.launchYear)})</span>
          <p>${esc(mission.summary)}</p>
          ${mission.lesson ? `<p class="note">${esc(mission.lesson)}</p>` : ''}
          ${mission.url ? `<a href="${esc(mission.url)}" target="_blank" rel="noopener noreferrer">Learn more at NASA ↗</a>` : ''}
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
    .map((event) => `<li><strong>${esc(event.name)}:</strong> ${esc(event.lesson)}</li>`)
    .join('');
  const scenarioText = content.scenarios?.[scenario.id] ?? {};

  const header = `
    <div class="report-head ${success ? 'is-success' : 'is-failure'}${report.isNewBest ? ' is-best' : ''}">
      <h2 class="report-title">${success ? 'SUCCESS' : 'FAILED'}</h2>
      ${scoreBlock(score)}
      <div class="badges">
        ${report.isNewBest ? '<span class="badge badge-gold">★ Best mission so far</span>' : ''}
        ${tight ? '<span class="badge badge-tight">Tight but valid · Efficient design</span>' : ''}
        ${report.quizRight ? '<span class="badge badge-gold">🏅 Mission expert</span>' : ''}
      </div>
    </div>`;

  const why = failure
    ? `<section class="report-why is-failure"><h3>What went wrong</h3><p><strong>${esc(failure.title)}.</strong> ${esc(failure.text)}</p>
        ${harmed.length && simulation.failedIssue.code === 'LOW_SCIENCE' ? `<p>Random events took away science: ${harmed.map((event) => `${esc(data.events.find((item) => item.id === event.id)?.name ?? event.id)} (−${event.scienceLossPct}%)`).join(', ')}. More margin would have protected you.</p>` : ''}
        ${failure.tip ? `<p><strong>Try this:</strong> ${esc(failure.tip)}</p>` : ''}</section>`
    : `<section class="report-why is-success"><h3>Why it worked</h3><p>Your spacecraft reached ${esc(ctx.mission.orbit?.name ?? 'its orbit')}, stayed powered and sent ${fmt(simulation.scienceDelivered)} science points home. The goal was ${fmt(scenario.minScience)}.</p></section>`;

  const learn = failure?.learn ? { text: failure.learn, rule: content.learn?.report?.rule } : content.learn?.report;

  const cards = `
    ${header}
    ${reportRewards(report)}
    ${why}
    ${lessons ? `<section><h3>Surprises and what engineers do about them</h3><ul class="lessons">${lessons}</ul></section>` : ''}
    ${learnBox(learn)}
    ${quizBlock(scenarioText.quiz, report)}`;

  const stage = `
    <h3>Mission checklist</h3>
    ${checklist({ budget: simulation.budget, issues: simulation.issues }, content, data)}
    ${realMissions(scenarioText.realMissions)}`;

  const layout = gameLayout({
    ...ctx,
    title: `Step 5 · Mission report (attempt ${state.runCount})`,
    results: true,
    cards,
    stage,
    footer: `
      <button type="button" class="btn btn-primary" data-action="redesign">🔧 Redesign mission</button>
      <button type="button" class="btn" data-action="new-conditions">🎲 Try again with new conditions</button>
      <button type="button" class="btn" data-action="next-mission">Next mission →</button>
      <button type="button" class="btn" data-action="menu">Main menu</button>`,
  });
  // Confetti only right after a successful mission (the app sets ui.celebrateUntil).
  return success && ctx.ui.celebrateUntil > Date.now() ? layout + confetti() : layout;
}
