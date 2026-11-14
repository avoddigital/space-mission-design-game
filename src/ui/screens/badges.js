// Badges screen: the player's mission patches, earned (lit) or not yet (dark, with how to earn them).
// Screen-only: it reads the profile from src/engine/achievements.js and never changes the game.

import { esc } from '../format.js';
import { icon } from '../components/icons.js';
import { soundToggle, langToggle } from '../components/overlays.js';
import { ACHIEVEMENTS } from '../../engine/achievements.js';
import { t, numberLocale } from '../../i18n/index.js';

const GROUPS = ['start', 'destinations', 'skill', 'learning', 'agency'];

const dateText = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString(numberLocale(), { year: 'numeric', month: 'short', day: 'numeric' });

/** One round mission patch. */
export function patch(id, iconKey, earned, size = 'big') {
  return `<span class="patch patch-${size}${earned ? ' is-earned' : ''}" aria-hidden="true">${icon(iconKey, size === 'big' ? 30 : 16)}</span>`;
}

function badgeCard(item, earnedOn) {
  const earned = Boolean(earnedOn);
  return `
    <article class="badge-card${earned ? ' is-earned' : ''}" aria-label="${esc(t(`ach.${item.id}.name`))}: ${earned ? esc(t('badges.earnedOn', { date: dateText(earnedOn) })) : esc(t('badges.locked'))}">
      ${patch(item.id, item.icon, earned)}
      <span class="badge-body">
        <strong>${esc(t(`ach.${item.id}.name`))}</strong>
        <span>${esc(t(`ach.${item.id}.desc`))}</span>
        <small>${earned ? esc(t('badges.earnedOn', { date: dateText(earnedOn) })) : esc(t('badges.locked'))}</small>
      </span>
    </article>`;
}

/**
 * @param {{ profile: object, backLabel: string }} options
 */
export function badgesScreen({ profile, backLabel }) {
  const total = ACHIEVEMENTS.length;
  const count = ACHIEVEMENTS.filter((item) => profile.earned[item.id]).length;
  const groups = GROUPS.map((group) => {
    const items = ACHIEVEMENTS.filter((item) => item.group === group);
    return `
      <section class="lib-group" aria-label="${esc(t(`badges.group.${group}`))}">
        <h2 class="lib-group-title">${esc(t(`badges.group.${group}`))}</h2>
        <div class="badge-grid">${items.map((item) => badgeCard(item, profile.earned[item.id])).join('')}</div>
      </section>`;
  }).join('');
  return `
    <main class="library badges">
      <header class="lib-head">
        <button type="button" class="btn" data-action="close-badges">${icon('back', 16)} ${esc(backLabel)}</button>
        <div class="lib-heading">
          <h1>${t('badges.title')}</h1>
          <p>${t('badges.lead')}</p>
        </div>
        <span class="readout lib-count"><small>${t('badges.title')}</small><b>${count} <i>/ ${total}</i></b></span>
        ${langToggle()}
        ${soundToggle()}
      </header>
      <div class="badge-progress" role="img" aria-label="${esc(t('badges.count', { n: count, total }))}"><i style="width:${Math.round((count / total) * 100)}%"></i></div>
      <div class="lib-scroll" tabindex="0">${groups}</div>
    </main>`;
}

/** Small "badge earned" notice, top right of the screen. */
export function badgeNotice(ids) {
  if (!ids.length) return '';
  return `
    <div class="badge-notice" role="status" aria-live="polite">
      ${ids.map((id) => {
        const item = ACHIEVEMENTS.find((entry) => entry.id === id);
        return `<div class="badge-notice-item">${patch(id, item?.icon ?? 'star', true, 'small')}<span>${esc(t('badges.toast', { name: t(`ach.${id}.name`) }))}</span></div>`;
      }).join('')}
    </div>`;
}
