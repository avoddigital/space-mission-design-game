// Commander Capi's panel: a small CAPCOM radio plate with her portrait, the line and the voice controls.
// Presentation only: the line comes from script.js and the voice status from voice.js.
// It sits at the top of the left panel (or under the title on the menu), so it never covers
// the choices, the viewscreen or the gauges.

import { esc } from '../format.js';
import { icon } from '../components/icons.js';
import { t } from '../../i18n/index.js';

// Small copies (192 px) of the original artwork in src/assets/capi/ (the originals stay untouched).
const PORTRAITS = {
  welcome: new URL('../../assets/capi/ui/capi-01-hero.png', import.meta.url).href,
  briefing: new URL('../../assets/capi/ui/capi-02-welcome.png', import.meta.url).href,
  builder: new URL('../../assets/capi/ui/capi-03-builder.png', import.meta.url).href,
  launch: new URL('../../assets/capi/ui/capi-04-launch.png', import.meta.url).href,
  surprise: new URL('../../assets/capi/ui/capi-05-surprise.png', import.meta.url).href,
  success: new URL('../../assets/capi/ui/capi-06-success.png', import.meta.url).href,
  failure: new URL('../../assets/capi/ui/capi-07-failure.png', import.meta.url).href,
  thinking: new URL('../../assets/capi/ui/capi-09-quiz.png', import.meta.url).href,
};

export const portraitFor = (mood) => PORTRAITS[mood] ?? PORTRAITS.welcome;

/**
 * @param {object|null} line from capiLine()
 * @param {{ voiceOn: boolean, hidden: boolean, status: string, muted: boolean }} view
 * @param {string} [extraClass]
 */
export function capiPanel(line, { voiceOn, hidden, status }, extraClass = '') {
  if (!line) return '';
  const cls = extraClass ? ` ${extraClass}` : '';
  if (hidden) {
    return `<button type="button" class="capi-show${cls}" data-action="capi-show" title="${t('capi.show')}">
      <img src="${portraitFor(line.mood)}" alt="" width="28" height="28" loading="lazy" decoding="async">
      <span>${t('capi.show')}</span></button>`;
  }
  // The spoken sentence (bold) is always on screen, and a recording says exactly that text (catalog.js).
  const { lead, detail, coach } = line;
  const canSpeak = voiceOn && Boolean(line.say);
  const speaking = canSpeak && (status === 'speaking' || status === 'loading');
  const blocked = canSpeak && status === 'blocked';
  const voiceNote = voiceOn && status === 'unavailable' ? t('capi.noVoice') : '';
  const play = blocked
    ? `<button type="button" class="btn capi-play" data-action="capi-replay">${icon('play', 14)} ${t('capi.play')}</button>`
    : '';
  // A lesson card (question or explanation) shows its title as a small caption; the problem stage keeps
  // Capi's spoken sentence in bold, with the problem after it.
  const lessonCard = coach && !line.say;
  const text = lessonCard
    ? `<p class="capi-kicker">${esc(lead)}</p><p class="capi-text">${coach.feedback ? `<strong>${esc(coach.feedback)}</strong> ` : ''}${esc(detail)}</p>`
    : `<p class="capi-text"><strong>${esc(lead)}</strong>${detail ? ` ${esc(detail)}` : ''}</p>`;
  return `
    <aside class="capi capi-${esc(line.mood)}${speaking ? ' is-speaking' : ''}${coach ? ' is-coaching' : ''}${cls}" aria-label="${t('capi.aria')}">
      <span class="capi-frame"><img class="capi-face" src="${portraitFor(line.mood)}" alt="${t('capi.portrait')}" width="96" height="96" decoding="async"></span>
      <div class="capi-body">
        <p class="capi-name"><span class="capi-lamp" aria-hidden="true"></span>${t('capi.name')}${speaking ? ` <span class="capi-air">${t('capi.onAir')}</span>` : ''}${coach?.step ? ` <span class="capi-step">${t('coach.label', { step: coach.step, total: coach.total })}</span>` : ''}</p>
        ${text}
        ${line.offer ? `<p class="capi-offer">${esc(line.offer)}</p>` : ''}
        ${coachControls(line)}
        <div class="capi-tools">
          ${play}
          <button type="button" class="capi-tool" data-action="capi-replay" title="${t('capi.replay')}" aria-label="${t('capi.replay')}"${canSpeak ? '' : ' disabled'}>${icon('replay', 16)}</button>
          <button type="button" class="capi-tool${voiceOn ? ' is-on' : ''}" data-action="capi-voice" aria-pressed="${voiceOn}" title="${voiceOn ? t('capi.voiceOff') : t('capi.voiceOn')} (V)" aria-label="${voiceOn ? t('capi.voiceOff') : t('capi.voiceOn')}">${icon(voiceOn ? 'sound' : 'sound-off', 16)}<span>${t('capi.voice')}</span></button>
          ${line.guide === 'start' ? `<button type="button" class="capi-tool" data-action="coach-start">${icon('bulb', 16)}<span>${t('coach.start')}</span></button>` : ''}
          ${line.guide === 'skip' ? `<button type="button" class="capi-tool" data-action="coach-skip">${icon('next', 16)}<span>${t('coach.skip')}</span></button>` : ''}
          <button type="button" class="capi-tool" data-action="capi-hide" title="${t('capi.hide')}" aria-label="${t('capi.hide')}">${icon('cross', 16)}</button>
          ${voiceNote ? `<span class="capi-note">${voiceNote}</span>` : ''}
        </div>
      </div>
    </aside>`;
}

/** The lesson's own buttons: answer options, the hint, Continue, Review; or the guided-mission offer. */
function coachControls(line) {
  const { coach } = line;
  if (line.actions?.length) {
    return `<div class="capi-actions">${line.actions.map((item) => `<button type="button" class="btn${item.primary ? ' btn-primary' : ''}" data-action="${esc(item.action)}">${esc(item.label)}</button>`).join('')}</div>`;
  }
  if (!coach) {
    return line.reviewable ? `<div class="capi-actions"><button type="button" class="btn" data-action="coach-review">${icon('book', 14)} ${t('coach.review')}</button></div>` : '';
  }
  const options = coach.options && coach.kind === 'ask'
    ? `<div class="capi-options">${coach.options.map((option) => `<button type="button" class="btn capi-option" data-action="coach-answer" data-value="${esc(option.id)}">${esc(option.label)}</button>`).join('')}</div>`
    : '';
  const hint = coach.hint ? `<p class="capi-hint">${icon('bulb', 14)} ${esc(coach.hint)}</p>` : '';
  const canContinue = coach.kind === 'explain' || coach.kind === 'review';
  const buttons = [
    canContinue ? `<button type="button" class="btn btn-primary" data-action="coach-continue">${t('coach.continue')} ${icon('next', 14)}</button>` : '',
    coach.kind !== 'review' ? `<button type="button" class="btn" data-action="coach-hint" aria-pressed="${Boolean(coach.hint)}">${icon('bulb', 14)} ${t('coach.hint')}</button>` : '',
  ].join('');
  return `${options}${hint}<div class="capi-actions">${buttons}</div>`;
}
