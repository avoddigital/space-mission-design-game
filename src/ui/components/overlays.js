import { esc } from '../format.js';
import { icon } from './icons.js';
import { isMuted } from '../sound.js';
import { t, getLocale, LOCALES } from '../../i18n/index.js';

/** "Learn" box: a short concept and a rule of thumb (texts from content.learn). */
export function learnBox(learn) {
  if (!learn) return '';
  return `
    <aside class="learn" aria-label="${t('learn.title')}">
      <span class="learn-title">${icon('bulb', 18)} ${t('learn.title')}</span>
      <p>${esc(learn.text)}</p>
      ${learn.rule ? `<p class="learn-rule">${t('learn.rule')} <strong>${esc(learn.rule)}</strong></p>` : ''}
    </aside>`;
}

/** Controls legend, always visible. */
export function legend() {
  return `
    <p class="legend" aria-label="${t('legend.label')}">
      <span><kbd>${t('legend.click')}</kbd>/<kbd>${t('legend.tap')}</kbd> ${t('legend.choose')}</span>
      <span><kbd>Enter</kbd> ${t('legend.next')}</span>
      <span><kbd>Backspace</kbd> ${t('legend.back')}</span>
      <span><kbd>1</kbd>–<kbd>8</kbd> ${t('legend.card')}</span>
      <span><kbd>P</kbd>/<kbd>Esc</kbd> ${t('legend.pause')}</span>
      <span><kbd>M</kbd> ${t('legend.sound')}</span>
      <span><kbd>L</kbd> ${t('legend.language')}</span>
    </p>`;
}

/** Modal window with a title and paragraphs. */
export function modal({ title, paragraphs = [], actions = null }) {
  const buttons = actions?.length
    ? `<div class="modal-actions">${actions
        .map((item, index) => `<button type="button" class="btn${item.primary ? ' btn-primary' : ''}" data-action="${esc(item.action)}" ${index === 0 ? 'autofocus' : ''}>${esc(item.label)}</button>`)
        .join('')}</div>`
    : `<button type="button" class="btn btn-primary" data-action="close-modal" autofocus>${t('common.gotIt')}</button>`;
  return `
    <div class="overlay" data-action="close-modal">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" data-stop>
        <h2 id="modal-title">${esc(title)}</h2>
        ${paragraphs.filter(Boolean).map((text) => `<p>${esc(text)}</p>`).join('')}
        ${buttons}
      </div>
    </div>`;
}

/** Short message at the bottom of the screen. */
export function toast({ title, text, tone = 'bad' }) {
  return `
    <div class="toast toast-${tone}" role="status" aria-live="polite">
      ${icon(tone === 'bad' ? 'cross' : 'warn', 18)}<span><strong>${esc(title)}</strong> ${esc(text)}</span>
    </div>`;
}

/** Pause screen. */
export function pauseOverlay() {
  return `
    <div class="overlay">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="pause-title">
        <h2 id="pause-title">${t('pause.title')}</h2>
        <div class="modal-actions">
          <button type="button" class="btn btn-primary" data-action="pause" autofocus>${t('pause.resume')}</button>
          <button type="button" class="btn" data-action="restart">${t('pause.restart')}</button>
          <button type="button" class="btn" data-action="menu">${t('pause.leave')}</button>
        </div>
      </div>
    </div>`;
}

/**
 * Launch countdown shown over the whole screen: 3, 2, 1, LIFTOFF.
 * @param {number} count 3, 2, 1 or 0 (liftoff)
 */
export function countdownOverlay(count) {
  const liftoff = count <= 0;
  return `
    <div class="countdown${liftoff ? ' is-liftoff' : ''}" role="status" aria-live="assertive">
      <span class="countdown-label">${liftoff ? t('countdown.liftoff') : t('countdown.tminus')}</span>
      <span class="countdown-number" key="${count}">${liftoff ? icon('rocket', 96) : count}</span>
    </div>`;
}

/** Celebration confetti (pure CSS, removed after the animation). Colors come from the theme. */
export function confetti(pieces = 48) {
  let seed = 7;
  const random = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const items = Array.from({ length: pieces }, (_, index) => {
    const left = Math.round(random() * 100);
    const delay = (random() * 0.8).toFixed(2);
    const duration = (2 + random() * 1.5).toFixed(2);
    const rotate = Math.round(random() * 360);
    return `<i style="left:${left}%;animation-delay:${delay}s;animation-duration:${duration}s;--rot:${rotate}deg" class="c${index % 5}"></i>`;
  }).join('');
  return `<div class="confetti" aria-hidden="true">${items}</div>`;
}

/** Sound on/off button (DESIGN.md section 7). The choice is saved by src/ui/sound.js. */
export function soundToggle(extraClass = '') {
  const muted = isMuted();
  return `<button type="button" class="btn btn-icon${muted ? ' is-muted' : ''}${extraClass ? ` ${extraClass}` : ''}" data-action="mute"
    aria-pressed="${!muted}" aria-label="${muted ? t('sound.on') : t('sound.off')}" title="${t('sound.title')}">${icon(muted ? 'sound-off' : 'sound', 18)}</button>`;
}

/** Language button: shows the current language and switches to the next one (also the L key). */
export function langToggle(extraClass = '') {
  const current = LOCALES.find((item) => item.id === getLocale()) ?? LOCALES[0];
  return `<button type="button" class="btn btn-lang${extraClass ? ` ${extraClass}` : ''}" data-action="language"
    aria-label="${t('lang.label', { name: current.name })}" title="${t('lang.title')}">${icon('globe', 16)}<span>${current.short}</span></button>`;
}
