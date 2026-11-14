import { esc, fmt } from '../format.js';
import { formatIssue } from '../../engine/messages.js';
import { issueRoute } from '../../engine/phases.js';
import { RISKY_RATIO } from './meter.js';

/** Which checklist line each issue belongs to. */
function rowOf(issue) {
  if (issue.code === 'MISSING_REQUIRED_TYPE') {
    return { instrument: 'science', power: 'power', comms: 'data' }[issue.type] ?? 'science';
  }
  return {
    OVER_BUDGET: 'budget',
    NO_ROCKET: 'mass',
    NO_ORBIT: 'mass',
    ROCKET_CANNOT_REACH_ORBIT: 'mass',
    PAYLOAD_TOO_HEAVY: 'mass',
    LOW_MASS_MARGIN: 'mass',
    POWER_DEFICIT: 'power',
    NO_COMMS: 'data',
    DATA_BACKLOG: 'data',
    OVER_TIME: 'time',
    ORBIT_NOT_ALLOWED: 'time',
    LOW_SCIENCE: 'science',
  }[issue.code] ?? 'science';
}

const ROWS = [
  { key: 'budget', name: 'Budget', step: 2, ok: (b) => `${fmt(b.budget.usedMUsd)} of ${fmt(b.budget.limitMUsd)} million USD.` },
  { key: 'mass', name: 'Mass', step: 3, ok: (b) => `${fmt(b.mass.usedKg)} kg of the ${fmt(b.mass.limitKg)} kg the rocket can carry.` },
  { key: 'power', name: 'Power', step: 2, ok: (b) => `Uses ${fmt(b.power.consumedW)} W of the ${fmt(b.power.generatedW)} W it makes.` },
  { key: 'data', name: 'Data downlink', step: 2, ok: (b) => `Makes ${fmt(b.data.producedGbPerDay)} GB/day; the antenna sends ${fmt(b.data.downlinkGbPerDay)} GB/day.` },
  { key: 'time', name: 'Time', step: 3, ok: (b) => `${fmt(b.time.totalDays)} of ${fmt(b.time.limitDays)} days.` },
  { key: 'science', name: 'Science', step: 2, ok: (b) => `${fmt(b.science.value)} points; the goal is ${fmt(b.science.goal)}.` },
];

const PENDING_TEXT = {
  mass: 'Pick an orbit and a rocket.',
  power: 'Pick a power source.',
  data: 'Pick an antenna.',
  time: 'Pick an orbit.',
};

/** GO / NO-GO list. Every line that is not GO sends the player to the step that fixes it. */
export function checklist(evaluation, content, data) {
  const { budget, issues } = evaluation;
  const lines = ROWS.map((row) => {
    const rowIssues = issues.filter((issue) => rowOf(issue) === row.key);
    const error = rowIssues.find((issue) => issue.severity === 'error');
    const warning = rowIssues.find((issue) => issue.severity === 'warning');
    const pending = budget[row.key]?.status === 'pending';
    const shown = error ?? warning;

    let status = 'go';
    let text = row.ok(budget);
    let step = row.step;
    let fixable = true;
    const entry = budget[row.key];
    if (shown) {
      const message = formatIssue(shown, content, data);
      status = error ? 'nogo' : 'check';
      text = `${message.title}: ${message.text}`;
      step = issueRoute(shown).step;
    } else if (pending) {
      status = 'nogo';
      text = PENDING_TEXT[row.key] ?? 'Not set yet.';
    } else if (row.key !== 'science' && entry?.status === 'ok' && entry.ratio > RISKY_RATIO) {
      // Same rule as the RISKY meter: it works, but surprises will hurt more.
      status = 'check';
      text = `Close to the limit (${Math.round(entry.ratio * 100)}%): ${row.ok(budget)} A surprise here will hurt the mission.`;
      fixable = false;
    }
    const label = { go: '✅ GO', check: '⚠️ CHECK', nogo: '❌ NO-GO' }[status];
    const body = `<span class="check-label">${label}</span><span class="check-name">${row.name}</span><span class="check-text">${esc(text)}</span>`;
    return status === 'go' || !fixable
      ? `<li class="check check-${status}">${body}</li>`
      : `<li><button type="button" class="check check-${status}" data-action="go-step" data-value="${step}">${body}<span class="check-fix">Fix in step ${step} →</span></button></li>`;
  });
  return `<ul class="checklist" aria-label="Launch checklist">${lines.join('')}</ul>`;
}
