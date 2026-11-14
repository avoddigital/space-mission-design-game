import { esc, fmt } from '../format.js';

/** What each of the 5 meters shows. `budget` is the result of computeBudget. */
export const METERS = Object.freeze({
  budget: { read: (b) => ({ entry: b.budget, used: b.budget.usedMUsd, limit: b.budget.limitMUsd }), unit: 'M USD', pending: '' },
  mass: { read: (b) => ({ entry: b.mass, used: b.mass.usedKg, limit: b.mass.limitKg }), unit: 'kg', pending: 'Pick an orbit and a rocket' },
  power: { read: (b) => ({ entry: b.power, used: b.power.consumedW, limit: b.power.generatedW }), unit: 'W', pending: 'Pick a power source' },
  data: { read: (b) => ({ entry: b.data, used: b.data.producedGbPerDay, limit: b.data.downlinkGbPerDay }), unit: 'GB/day', pending: 'Pick an antenna' },
  time: { read: (b) => ({ entry: b.time, used: b.time.totalDays, limit: b.time.limitDays }), unit: 'days', pending: 'Pick an orbit' },
});

const TAGS = { ok: 'OK', tight: 'TIGHT', over: 'OVER THE LIMIT', pending: 'NOT SET' };

/** Bar color by how full it is (PRD 8.2): blue, amber, orange, red. */
function tone(entry) {
  if (entry.status === 'pending') return 'pending';
  if (entry.status === 'over') return 'bad';
  if (entry.status === 'tight' || entry.ratio > 0.9) return 'risky';
  if (entry.ratio > 0.67) return 'warn';
  return 'ok';
}

/** Text tag, so the state never depends on color alone. 90% to 100% reads "RISKY" (PRD 8.2). */
function tagFor(entry) {
  return tone(entry) === 'risky' && entry.status === 'ok' ? 'RISKY' : TAGS[entry.status];
}

function barWidth(entry) {
  if (entry.status === 'pending') return 0;
  if (entry.status === 'over') return 100;
  return Math.min(100, Math.round((entry.ratio ?? 0) * 100));
}

/** One meter as a button: tapping it opens the explanation. */
export function meter(key, budget, meta, { shake = false } = {}) {
  const { read, unit, pending } = METERS[key];
  const { entry, used, limit } = read(budget);
  let value = `${fmt(used)} / ${limit === null ? '—' : fmt(limit)} ${unit}`;
  if (entry.status === 'pending' && pending) value = pending;
  else if (key === 'mass' && limit === 0) value = "This rocket can't reach this orbit";
  return `
    <button type="button" class="meter tone-${tone(entry)}${shake ? ' shake' : ''}" data-action="meter" data-value="${key}"
      aria-label="${esc(meta?.name ?? key)}: ${esc(value)}, ${tagFor(entry)}">
      <span class="meter-head">
        <span class="meter-name">${esc(meta?.name ?? key)}</span>
        <span class="tag">${tagFor(entry)}</span>
      </span>
      <span class="meter-bar"><span class="meter-fill" style="width:${barWidth(entry)}%"></span></span>
      <span class="meter-value">${esc(value)}</span>
    </button>`;
}

/** Science line: more is better, so it fills toward the goal. */
export function scienceMeter(budget) {
  const { value, goal, ok } = budget.science;
  const width = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 100;
  return `
    <div class="meter tone-${ok ? 'good' : 'pending'}" aria-label="Science: ${value} of goal ${goal}">
      <span class="meter-head">
        <span class="meter-name">Science</span>
        <span class="tag">${ok ? 'GOAL REACHED' : 'BELOW GOAL'}</span>
      </span>
      <span class="meter-bar"><span class="meter-fill" style="width:${width}%"></span></span>
      <span class="meter-value">${fmt(value)} / goal ${fmt(goal)} points</span>
    </div>`;
}

/** Text for the meter modal: the explanation plus the current numbers. */
export function meterDetail(key, budget) {
  const { unit } = METERS[key];
  const { entry, used, limit } = METERS[key].read(budget);
  if (entry.status === 'pending') return METERS[key].pending ? `${METERS[key].pending} to see this value.` : '';
  const pct = entry.ratio === null ? '' : ` (${Math.round(entry.ratio * 100)}%)`;
  return `Right now: ${fmt(used)} of ${limit === null ? '—' : fmt(limit)} ${unit}${pct}.`;
}
