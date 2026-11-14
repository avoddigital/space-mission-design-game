import { esc, fmt } from '../format.js';
import { icon } from './icons.js';
import { t } from '../../i18n/index.js';

/** What each of the 5 meters shows. `budget` is the result of computeBudget. */
export const METERS = Object.freeze({
  budget: { read: (b) => ({ entry: b.budget, used: b.budget.usedMUsd, limit: b.budget.limitMUsd }), unit: () => 'M USD', pending: '' },
  mass: { read: (b) => ({ entry: b.mass, used: b.mass.usedKg, limit: b.mass.limitKg }), unit: () => 'kg', pending: 'pending.mass' },
  power: { read: (b) => ({ entry: b.power, used: b.power.consumedW, limit: b.power.generatedW }), unit: () => 'W', pending: 'pending.power' },
  data: { read: (b) => ({ entry: b.data, used: b.data.producedGbPerDay, limit: b.data.downlinkGbPerDay }), unit: () => t('unit.gbDay'), pending: 'pending.data' },
  time: { read: (b) => ({ entry: b.time, used: b.time.totalDays, limit: b.time.limitDays }), unit: () => t('unit.daysWord'), pending: 'pending.time' },
});

/** From this share of the limit a meter reads Risky and the checklist says CHECK. */
export const RISKY_RATIO = 0.9;

const TAGS = { ok: 'tag.ok', tight: 'tag.tight', over: 'tag.over', pending: 'tag.pending' };

/** Bar color by how full it is (PRD 8.2): blue, amber, orange, red. */
function tone(entry) {
  if (entry.status === 'pending') return 'pending';
  if (entry.status === 'over') return 'bad';
  if (entry.status === 'tight' || entry.ratio > RISKY_RATIO) return 'risky';
  if (entry.ratio > 0.67) return 'warn';
  return 'ok';
}

/** Text tag, so the state never depends on color alone. 90% to 100% reads "Risky" (PRD 8.2). */
function tagFor(entry) {
  return tone(entry) === 'risky' && entry.status === 'ok' ? t('tag.risky') : t(TAGS[entry.status]);
}

function barWidth(entry) {
  if (entry.status === 'pending') return 0;
  if (entry.status === 'over') return 100;
  return Math.min(100, Math.round((entry.ratio ?? 0) * 100));
}

/** Signed change, for previews: "+65", "−20". */
function change(now, before) {
  if (typeof now !== 'number' || typeof before !== 'number') return '';
  const diff = Math.round((now - before) * 10) / 10;
  if (diff === 0) return '';
  return `${diff > 0 ? '+' : '−'}${fmt(Math.abs(diff))}`;
}

/** One meter as a button: tapping it opens the explanation. With `baseline`, it shows the change. */
export function meter(key, budget, meta, { shake = false, baseline = null } = {}) {
  const { read, pending } = METERS[key];
  const unit = METERS[key].unit();
  const { entry, used, limit } = read(budget);
  let delta = '';
  if (baseline) {
    const before = read(baseline);
    const usedChange = change(used, before.used);
    const limitChange = change(limit, before.limit);
    delta = [usedChange && `${usedChange} ${unit}`, limitChange && t('meter.limitChange', { change: limitChange })].filter(Boolean).join(' · ');
  }
  let value = `${fmt(used)} / ${limit === null ? '—' : fmt(limit)} ${unit}`;
  if (entry.status === 'pending' && pending) value = t(pending);
  else if (key === 'mass' && limit === 0) value = t('meter.cantReach');
  return `
    <button type="button" class="meter tone-${tone(entry)}${shake ? ' shake' : ''}" data-action="meter" data-value="${key}"
      aria-label="${esc(meta?.name ?? key)}: ${esc(value)}, ${tagFor(entry)}">
      <span class="meter-icon">${icon(key, 18)}</span>
      <span class="meter-head">
        <span class="meter-name">${esc(meta?.name ?? key)}</span>
        <span class="tag">${tagFor(entry)}</span>
      </span>
      <span class="meter-bar"><span class="meter-fill" style="width:${barWidth(entry)}%"></span></span>
      <span class="meter-value">${esc(value)}${delta ? ` <span class="meter-delta">(${esc(delta)})</span>` : ''}</span>
    </button>`;
}

/**
 * Science line: more is better, so it fills toward the goal.
 * With `flight` (simulation and report screens), it follows the flight: while it is underway it shows the
 * planned science; once it is over, the science that really reached Earth (after a full antenna and the surprises).
 * @param {{ simulation: object, done: boolean }|null} [flight]
 */
export function scienceMeter(budget, baseline = null, flight = null) {
  const { goal } = budget.science;
  let { value, ok } = budget.science;
  let delta = baseline ? change(value, baseline.science.value) : '';
  let tag = ok ? t('meter.goalReached') : t('meter.belowGoal');
  let toneName = ok ? 'good' : 'pending';
  if (flight && !flight.done) {
    tag = t('meter.planned');
    toneName = 'pending';
  } else if (flight) {
    const planned = value;
    const { failedPhase, scienceDelivered } = flight.simulation;
    // Nothing reaches Earth if the mission failed before sending its data
    value = failedPhase && failedPhase !== 'data' ? 0 : scienceDelivered;
    ok = value >= goal && (goal === 0 || value > 0);
    const lost = change(value, planned);
    delta = lost ? t('meter.afterSurprises', { change: lost }) : '';
    tag = ok ? t('meter.goalReached') : t('meter.belowGoal');
    toneName = ok ? 'good' : 'bad';
  }
  const width = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 100;
  return `
    <div class="meter tone-${toneName}" aria-label="${t('meter.scienceAria', { value, goal })}">
      <span class="meter-icon">${icon('science', 18)}</span>
      <span class="meter-head">
        <span class="meter-name">${t('stat.science')}</span>
        <span class="tag">${tag}</span>
      </span>
      <span class="meter-bar"><span class="meter-fill" style="width:${width}%"></span></span>
      <span class="meter-value${flight ? ' meter-value-wrap' : ''}">${t('meter.scienceValue', { value: fmt(value), goal: fmt(goal) })}${delta ? ` <span class="meter-delta">(${esc(delta)})</span>` : ''}</span>
    </div>`;
}

/**
 * Flight status, in place of the launch readiness once the rocket has left: phases done,
 * then the final verdict. Display only: it reads the simulation result.
 * @param {{ simulation: object, done: boolean, shown: number }} flight
 */
export function flightStatus({ simulation, done, shown }) {
  const total = simulation.phases.length;
  const passed = simulation.phases.slice(0, shown).filter((phase) => phase.ok === true).length;
  let label = t('flightStatus.flying');
  let toneName = 'pending';
  if (done) {
    const success = simulation.outcome === 'success';
    label = success ? t('flightStatus.success') : t('flightStatus.failure');
    toneName = success ? 'good' : 'bad';
  }
  const angle = Math.round((passed / total) * 360);
  return `
    <div class="readiness tone-${toneName}" role="status" aria-label="${t('flightStatus.aria', { done: passed, total, label })}">
      <span class="ring" style="--angle:${angle}deg"><span class="ring-value">${passed}<small>/${total}</small></span></span>
      <span class="readiness-text"><strong>${label}</strong><span>${t('flightStatus.phases')}</span></span>
    </div>`;
}

/**
 * Readiness summary at the top of the meters: how many of the 6 systems are GO.
 * Display only: it just counts what computeBudget and validateMission already decided.
 * @param {{ ok: boolean, issues: object[], budget: object }} evaluation
 */
export function readiness(evaluation) {
  const { budget, issues, ok } = evaluation;
  const keys = ['budget', 'mass', 'power', 'data', 'time'];
  const go = keys.filter((key) => ['ok', 'tight'].includes(budget[key].status)).length + (budget.science.ok ? 1 : 0);
  const total = keys.length + 1;
  const pending = keys.some((key) => budget[key].status === 'pending');
  const warnings = issues.some((issue) => issue.severity === 'warning');

  let label;
  let toneName;
  if (!ok) {
    label = pending ? t('ready.keepBuilding') : t('ready.notReady');
    toneName = pending ? 'pending' : 'bad';
  } else if (warnings) {
    label = t('ready.risks');
    toneName = 'warn';
  } else {
    label = t('ready.go');
    toneName = 'good';
  }
  const angle = Math.round((go / total) * 360);
  return `
    <div class="readiness tone-${toneName}" role="status" aria-label="${t('ready.aria', { go, total, label })}">
      <span class="ring" style="--angle:${angle}deg"><span class="ring-value">${go}<small>/${total}</small></span></span>
      <span class="readiness-text"><strong>${label}</strong><span>${t('ready.systems')}</span></span>
    </div>`;
}

/** Text for the meter modal: the explanation plus the current numbers. */
export function meterDetail(key, budget) {
  const unit = METERS[key].unit();
  const { entry, used, limit } = METERS[key].read(budget);
  if (entry.status === 'pending') return METERS[key].pending ? t('meter.pendingDetail', { what: t(METERS[key].pending) }) : '';
  const pct = entry.ratio === null ? '' : ` (${Math.round(entry.ratio * 100)}%)`;
  return t('meter.rightNow', { used: fmt(used), limit: limit === null ? '—' : fmt(limit), unit, pct });
}
