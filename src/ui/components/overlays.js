import { esc } from '../format.js';
import { icon } from './icons.js';
import { isMuted } from '../sound.js';

/** "Learn" box: a short concept and a rule of thumb (texts from content.learn). */
export function learnBox(learn) {
  if (!learn) return '';
  return `
    <aside class="learn" aria-label="Learn">
      <span class="learn-title">${icon('bulb', 18)} Learn</span>
      <p>${esc(learn.text)}</p>
      ${learn.rule ? `<p class="learn-rule">Rule of thumb: <strong>${esc(learn.rule)}</strong></p>` : ''}
    </aside>`;
}

/** Controls legend, always visible. */
export function legend() {
  return `
    <p class="legend" aria-label="Controls">
      <span><kbd>Click</kbd>/<kbd>Tap</kbd> choose</span>
      <span><kbd>Enter</kbd> next</span>
      <span><kbd>Backspace</kbd> back</span>
      <span><kbd>1</kbd>–<kbd>8</kbd> pick a card</span>
      <span><kbd>P</kbd>/<kbd>Esc</kbd> pause</span>
      <span><kbd>M</kbd> sound on/off</span>
    </p>`;
}

/** Modal window with a title and paragraphs. */
export function modal({ title, paragraphs = [] }) {
  return `
    <div class="overlay" data-action="close-modal">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" data-stop>
        <h2 id="modal-title">${esc(title)}</h2>
        ${paragraphs.filter(Boolean).map((text) => `<p>${esc(text)}</p>`).join('')}
        <button type="button" class="btn btn-primary" data-action="close-modal" autofocus>Got it</button>
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
        <h2 id="pause-title">Paused</h2>
        <div class="modal-actions">
          <button type="button" class="btn btn-primary" data-action="pause" autofocus>Resume</button>
          <button type="button" class="btn" data-action="restart">Restart mission</button>
          <button type="button" class="btn" data-action="menu">Main menu</button>
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
      <span class="countdown-label">${liftoff ? 'Liftoff!' : 'T-minus'}</span>
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
    aria-pressed="${!muted}" aria-label="${muted ? 'Turn sound on' : 'Turn sound off'}" title="Sound (M)">${icon(muted ? 'sound-off' : 'sound', 18)}</button>`;
}
