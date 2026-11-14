import { esc } from '../format.js';

/** "Learn" box: a short concept and a rule of thumb (texts from content.learn). */
export function learnBox(learn) {
  if (!learn) return '';
  return `
    <aside class="learn" aria-label="Learn">
      <span class="learn-title">💡 Learn</span>
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
      <strong>${esc(title)}</strong> ${esc(text)}
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
