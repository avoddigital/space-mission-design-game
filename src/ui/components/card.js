import { esc } from '../format.js';
import { icon } from './icons.js';

/**
 * Dot rating (1 to 3 filled dots) for a value against the biggest value of its group.
 * Display only: the engine never reads this. `scale: 'log'` keeps very large values readable.
 */
export function dots(value, max, scale = 'linear') {
  if (!value || value <= 0 || !max) return 0;
  const share = scale === 'log' ? Math.log(value + 1) / Math.log(max + 1) : value / max;
  return Math.min(3, Math.max(1, Math.ceil(share * 3)));
}

/**
 * One stat line: icon, label, 3 dots (or a short text) and the exact value as a tooltip.
 * @param {{ key: string, label: string, level?: number, text?: string, value: string, good?: boolean }} stat
 */
function statRow(stat, showNumbers) {
  const marks = stat.text !== undefined
    ? `<span class="stat-text">${esc(stat.text)}</span>`
    : `<span class="dots${stat.good ? ' dots-good' : ''}" aria-hidden="true">${[1, 2, 3]
        .map((step) => `<i class="${step <= (stat.level ?? 0) ? 'on' : ''}"></i>`)
        .join('')}</span>`;
  // A text stat already shows its value; dot stats show it on demand (or to screen readers only).
  const value = stat.text !== undefined ? '' : `<span class="stat-value${showNumbers ? '' : ' sr-only'}">${esc(stat.value)}</span>`;
  return `<span class="stat" title="${esc(stat.label)}: ${esc(stat.value)}">
      ${icon(stat.key, 16)}<span class="stat-label">${esc(stat.label)}</span>${marks}${value}
    </span>`;
}

/**
 * A choice card. It is a real <button>, so it works with keyboard and screen readers.
  * @param {{ action: string, value: string, title: string, description?: string, iconKey?: string,
 *   stats?: Array<{ key: string, label: string, level?: number, text?: string, value: string, good?: boolean }>,
 *   selected?: boolean, disabled?: boolean, reason?: string, badge?: string, showNumbers?: boolean,
 *   tags?: Array<{ text: string, tone: 'good'|'warn'|'bad' }> }} options
 */
export function card({
  action, value, title, description = '', iconKey = 'generic', stats = [],
  selected = false, disabled = false, reason = '', badge = '', showNumbers = false, tags = [],
}) {
  const classes = ['card', selected ? 'is-selected' : '', disabled ? 'is-disabled' : ''].filter(Boolean).join(' ');
  return `
    <button type="button" class="${classes}" data-card data-action="${esc(action)}" data-value="${esc(value)}"
      aria-pressed="${selected}" aria-label="${esc(title)}" ${disabled ? 'aria-disabled="true"' : ''}>
      <span class="card-icon">${icon(iconKey, 28)}</span>
      <span class="card-main">
        <span class="card-head">
          <span class="card-title">${esc(title)}</span>
          ${badge ? `<span class="badge">${esc(badge)}</span>` : ''}
          ${selected ? `<span class="tag tag-good">${icon('check', 12)} Picked</span>` : ''}
        </span>
        ${tags.length ? `<span class="card-tags">${tags.map((tag) => `<span class="tag tag-${esc(tag.tone)}">${esc(tag.text)}</span>`).join('')}</span>` : ''}
        ${description ? `<span class="card-text">${esc(description)}</span>` : ''}
        ${stats.length ? `<span class="stats">${stats.map((stat) => statRow(stat, showNumbers)).join('')}</span>` : ''}
        ${disabled && reason ? `<span class="card-reason">${icon('cross', 14)} ${esc(reason)}</span>` : ''}
      </span>
    </button>`;
}
