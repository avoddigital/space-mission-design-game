import { esc } from '../format.js';

/**
 * A choice card. It is a real <button>, so it works with keyboard and screen readers.
 * @param {{ action: string, value: string, title: string, description?: string,
 *   stats?: Array<{ label: string, value: string }>, selected?: boolean,
 *   disabled?: boolean, reason?: string, badge?: string, tags?: Array<{ text: string, tone: 'good'|'warn'|'bad' }> }} options
 */
export function card({ action, value, title, description = '', stats = [], selected = false, disabled = false, reason = '', badge = '', tags = [] }) {
  const classes = ['card', selected ? 'is-selected' : '', disabled ? 'is-disabled' : ''].filter(Boolean).join(' ');
  return `
    <button type="button" class="${classes}" data-card data-action="${esc(action)}" data-value="${esc(value)}"
      aria-pressed="${selected}" ${disabled ? 'aria-disabled="true"' : ''}>
      <span class="card-head">
        <span class="card-title">${esc(title)}</span>
        ${badge ? `<span class="badge">${esc(badge)}</span>` : ''}
        ${selected ? '<span class="tag tag-good">Selected</span>' : ''}
      </span>
      ${tags.length ? `<span class="card-tags">${tags.map((tag) => `<span class="tag tag-${esc(tag.tone)}">${esc(tag.text)}</span>`).join('')}</span>` : ''}
      ${description ? `<span class="card-text">${esc(description)}</span>` : ''}
      ${stats.length ? `<span class="chips">${stats.map((stat) => `<span class="chip"><span class="chip-label">${esc(stat.label)}</span> ${esc(stat.value)}</span>`).join('')}</span>` : ''}
      ${disabled && reason ? `<span class="card-reason">${esc(reason)}</span>` : ''}
    </button>`;
}
