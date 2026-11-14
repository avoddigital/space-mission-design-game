import { esc } from '../format.js';
import { icon } from './icons.js';
import { t } from '../../i18n/index.js';

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
 * One stat line: icon, label, then 3 dots or the exact number ("Show numbers"), never both,
 * so the line always fits in the card. The exact value is also in the tooltip.
 * @param {{ key: string, label: string, level?: number, text?: string, value: string, good?: boolean }} stat
 */
function statRow(stat, showNumbers) {
  let marks;
  if (stat.text !== undefined) marks = `<span class="stat-text">${esc(stat.text)}</span>`;
  else if (showNumbers) marks = `<span class="stat-value">${esc(stat.value)}</span>`;
  else {
    marks = `<span class="dots${stat.good ? ' dots-good' : ''}" aria-hidden="true">${[1, 2, 3]
      .map((step) => `<i class="${step <= (stat.level ?? 0) ? 'on' : ''}"></i>`)
      .join('')}</span><span class="sr-only">${esc(stat.value)}</span>`;
  }
  return `<span class="stat" title="${esc(stat.label)}: ${esc(stat.value)}">
      ${icon(stat.key, 16)}<span class="stat-label">${esc(stat.label)}</span>${marks}
    </span>`;
}

/** Small labels that say what stands out in a part ("Top science", "Heavy"). tone: 'good' or 'warn'. */
function badgeRow(badges) {
  if (!badges.length) return '';
  return `<span class="card-badges">${badges
    .map((item) => `<span class="badge badge-${item.tone === 'warn' ? 'warn' : 'good'}">${esc(item.label)}</span>`)
    .join('')}</span>`;
}

/**
 * A choice card. It is a real <button>, so it works with keyboard and screen readers.
 * @param {{ action: string, value: string, title: string, description?: string, iconKey?: string,
 *   stats?: Array<{ key: string, label: string, level?: number, text?: string, value: string, good?: boolean }>,
 *   selected?: boolean, disabled?: boolean, reason?: string, badge?: string,
 *   badges?: Array<{ label: string, tone?: 'good'|'warn' }>, showNumbers?: boolean }} options
 */
export function card({
  action, value, title, description = '', iconKey = 'generic', stats = [],
  selected = false, disabled = false, reason = '', badge = '', badges = [], showNumbers = false,
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
          ${selected ? `<span class="tag tag-good">${icon('check', 12)} ${t('card.picked')}</span>` : ''}
        </span>
        ${badgeRow(badges)}
        ${description ? `<span class="card-text">${esc(description)}</span>` : ''}
        ${stats.length ? `<span class="stats">${stats.map((stat) => statRow(stat, showNumbers)).join('')}</span>` : ''}
        ${disabled && reason ? `<span class="card-reason">${icon('cross', 14)} ${esc(reason)}</span>` : ''}
      </span>
    </button>`;
}
