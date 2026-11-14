import { esc, fmt } from '../format.js';
import { formatIssue } from '../../engine/messages.js';
import { issueRoute } from '../../engine/phases.js';
import { RISKY_RATIO } from './meter.js';
import { icon } from './icons.js';
import { t } from '../../i18n/index.js';

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
  { key: 'budget', name: 'check.budget', step: 2, ok: (b) => t('check.okBudget', { used: fmt(b.budget.usedMUsd), limit: fmt(b.budget.limitMUsd) }) },
  { key: 'mass', name: 'check.mass', step: 3, ok: (b) => t('check.okMass', { used: fmt(b.mass.usedKg), limit: fmt(b.mass.limitKg) }) },
  { key: 'power', name: 'check.power', step: 2, ok: (b) => t('check.okPower', { used: fmt(b.power.consumedW), limit: fmt(b.power.generatedW) }) },
  { key: 'data', name: 'check.data', step: 2, ok: (b) => t('check.okData', { used: fmt(b.data.producedGbPerDay), limit: fmt(b.data.downlinkGbPerDay) }) },
  { key: 'time', name: 'check.time', step: 3, ok: (b) => t('check.okTime', { used: fmt(b.time.totalDays), limit: fmt(b.time.limitDays) }) },
  { key: 'science', name: 'check.science', step: 2, ok: (b) => t('check.okScience', { used: fmt(b.science.value), limit: fmt(b.science.goal) }) },
];

const PENDING_TEXT = {
  mass: 'pending.mass',
  power: 'pending.power',
  data: 'pending.data',
  time: 'pending.time',
};

const LABELS = {
  go: () => `<span class="check-mark">${icon('check', 14)}</span> ${t('check.go')}`,
  check: () => `<span class="check-mark">${icon('warn', 14)}</span> ${t('check.check')}`,
  nogo: () => `<span class="check-mark">${icon('cross', 14)}</span> ${t('check.nogo')}`,
};

/**
 * GO / NO-GO list. Every line that is not GO sends the player to the step that fixes it.
 * @param {{ currentStep?: number }} [options] the step the player is on, so the fix link reads right
 */
export function checklist(evaluation, content, data, { currentStep = 0 } = {}) {
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
      text = PENDING_TEXT[row.key] ? `${t(PENDING_TEXT[row.key])}.` : t('check.notSet');
    } else if (row.key !== 'science' && entry?.status === 'ok' && entry.ratio > RISKY_RATIO) {
      // Same rule as the Risky meter: it works, but surprises will hurt more.
      status = 'check';
      text = t('check.closeToLimit', { pct: Math.round(entry.ratio * 100), text: row.ok(budget) });
      fixable = false;
    }
    const body = `<span class="check-label">${LABELS[status]()}</span><span class="check-name">${icon(row.key, 16)} ${t(row.name)}</span><span class="check-text">${esc(text)}</span>`;
    if (status === 'go' || !fixable) return `<li class="check check-${status}">${body}</li>`;
    const fix = step === currentStep ? t('check.fixHere') : `${t('check.fixIn', { n: step })} ${icon('next', 12)}`;
    return `<li><button type="button" class="check check-${status}" data-action="go-step" data-value="${step}">${body}<span class="check-fix">${fix}</span></button></li>`;
  });
  return `<ul class="checklist" aria-label="${t('launch.checklist')}">${lines.join('')}</ul>`;
}
