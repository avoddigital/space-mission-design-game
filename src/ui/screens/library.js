// Mission Library: a separate screen with real space exploration knowledge (src/data/library.js).
// It is screen-only (opened from the menu or the top bar) and never changes the game state.
// Facts are translated from the checked English sentence; the source link always points to the official page.

import { esc } from '../format.js';
import { icon } from '../components/icons.js';
import { soundToggle, langToggle } from '../components/overlays.js';
import { libraryMissions, libraryTopics, challengeResources, CHECKED_ON } from '../../data/library.js';
import { phases, research, sideJobs, agencyEvents } from '../../data/campaign.js';
import { t, localizeList, numberLocale } from '../../i18n/index.js';

export const LIBRARY_TABS = [
  { id: 'missions', label: 'lib.tab.missions', icon: 'planet' },
  { id: 'topics', label: 'lib.tab.topics', icon: 'bulb' },
  { id: 'resources', label: 'lib.tab.resources', icon: 'flag' },
];

const checkedText = () => new Date(`${CHECKED_ON}T12:00:00Z`).toLocaleDateString(numberLocale(), { year: 'numeric', month: 'long', day: 'numeric' });

/** How a locked entry can be discovered, from the campaign tables. */
function unlockHint(id) {
  const phase = localizeList(phases, 'campaign.phases').find((item) => item.unlocks.includes(id));
  const ways = [];
  if (phase) ways.push(t('lib.way.phase', { name: phase.name }));
  localizeList(research, 'campaign.research').filter((item) => item.unlocks?.includes(id)).forEach((item) => ways.push(t('lib.way.research', { name: item.name })));
  localizeList(sideJobs, 'campaign.sideJobs').filter((item) => item.unlocks?.includes(id)).forEach((item) => ways.push(t('lib.way.job', { name: item.name })));
  if (agencyEvents.some((item) => item.unlocks?.includes(id))) ways.push(t('lib.way.event'));
  return ways.length ? t('lib.discoverHow', { ways: ways.join(t('lib.or')) }) : t('lib.discover');
}

function lockedCard(title, id) {
  return `
    <article class="lib-card is-locked">
      <div class="lib-locked-window" aria-hidden="true">${icon('cross', 28)}</div>
      <div class="lib-body">
        <p class="lib-kicker">${t('lib.locked')}</p>
        <h3 class="lib-title">${esc(title)}</h3>
        <p class="lib-summary">${esc(unlockHint(id))}</p>
      </div>
    </article>`;
}

/** Short label for a source link, from its domain. */
function sourceLabel(url) {
  try {
    return new URL(url).hostname.replace(/^www\d?\./, '');
  } catch {
    return 'source';
  }
}

function link(url, text) {
  return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(text)} ↗</a>`;
}

/** A real NASA image with its caption and credit. If it cannot load (offline), the frame hides. */
function figure(image) {
  if (!image) return '';
  return `
    <figure class="lib-figure">
      <img src="${esc(image.src)}" alt="${esc(image.alt)}" loading="lazy" decoding="async"
        onerror="this.closest('figure').classList.add('is-missing')">
      <figcaption>${esc(image.caption)} <span class="lib-credit">${t('lib.credit')} ${link(image.page, image.credit)}</span></figcaption>
    </figure>`;
}

function factList(facts) {
  const checked = t('lib.checkedOn', { date: checkedText() });
  return `<ul class="lib-facts">${facts
    .map((fact) => `<li><span>${esc(fact.text)}</span> <a class="lib-source" href="${esc(fact.source)}" target="_blank" rel="noopener noreferrer" title="${esc(checked)}">${esc(sourceLabel(fact.source))} ↗</a></li>`)
    .join('')}</ul>`;
}

function missionCard(mission) {
  return `
    <article class="lib-card" data-target="${esc(mission.target)}">
      ${figure(mission.image)}
      <div class="lib-body">
        <p class="lib-kicker">${t(`dest.${mission.target.toLowerCase()}`)} · ${t('lib.launched', { date: esc(mission.launched) })}</p>
        <h3 class="lib-title">${esc(mission.name)}</h3>
        <p class="lib-summary">${esc(mission.summary)}</p>
        ${factList(mission.facts)}
        <p class="lib-more">${link(mission.url, t('lib.missionPage'))}</p>
      </div>
    </article>`;
}

function topicCard(topic) {
  return `
    <article class="lib-card">
      ${figure(topic.image)}
      <div class="lib-body">
        <p class="lib-kicker">${icon(topic.resource, 14)} ${t('lib.inGame', { resource: t(`resource.${topic.resource}`) })}</p>
        <h3 class="lib-title">${esc(topic.title)}</h3>
        <p class="lib-summary">${esc(topic.summary)}</p>
        ${factList(topic.facts)}
        ${topic.more ? `<p class="lib-more">${link(topic.more.url, topic.more.label)}</p>` : ''}
      </div>
    </article>`;
}

function resourcesList() {
  return `
    <p class="lib-intro">${t('lib.resourcesIntro')}</p>
    <ul class="lib-resources">${localizeList(challengeResources.map((item, index) => ({ ...item, id: String(index) })), 'library.resources')
      .map((item) => `<li>${link(item.url, item.name)}<span>${esc(item.text)}</span></li>`)
      .join('')}</ul>`;
}

/**
 * @param {{ tab?: string, backLabel?: string, unlocked?: Set<string>, hasAgency?: boolean }} options
 *   unlocked: the entries discovered by the player's agency (all entries when not given)
 */
export function libraryScreen({ tab = 'missions', backLabel = t('common.mainMenu'), unlocked = null, hasAgency = false } = {}) {
  const missions = localizeList(libraryMissions, 'library.missions');
  const topics = localizeList(libraryTopics, 'library.topics');
  const isOpen = (id) => !unlocked || unlocked.has(id);
  const total = missions.length + topics.length;
  const found = [...missions, ...topics].filter((entry) => isOpen(entry.id)).length;
  const current = LIBRARY_TABS.find((item) => item.id === tab) ?? LIBRARY_TABS[0];
  let body;
  if (current.id === 'missions') {
    body = ['Earth', 'Moon', 'Mars'].map((target) => {
      const cards = missions.filter((mission) => mission.target === target)
        .map((mission) => (isOpen(mission.id) ? missionCard(mission) : lockedCard(mission.name, mission.id))).join('');
      return `<section class="lib-group" aria-label="${t(`dest.${target.toLowerCase()}`)}"><h2 class="lib-group-title">${icon(target === 'Moon' ? 'moon' : 'planet', 16)} ${t(`dest.${target.toLowerCase()}`)}</h2><div class="lib-grid">${cards}</div></section>`;
    }).join('');
  } else if (current.id === 'topics') {
    body = `<div class="lib-grid">${topics.map((topic) => (isOpen(topic.id) ? topicCard(topic) : lockedCard(topic.title, topic.id))).join('')}</div>`;
  } else {
    body = resourcesList();
  }

  return `
    <main class="library">
      <header class="lib-head">
        <button type="button" class="btn" data-action="close-library">${icon('back', 16)} ${esc(backLabel)}</button>
        <div class="lib-heading">
          <h1>${t('common.library')}</h1>
          <p>${t('lib.lead')}</p>
        </div>
        <span class="readout lib-count"><small>${t('lib.discovered')}</small><b>${found} <i>/ ${total}</i></b></span>
        ${langToggle()}
        ${soundToggle()}
      </header>
      <nav class="tabs lib-tabs" role="tablist" aria-label="${t('lib.sections')}">
        ${LIBRARY_TABS.map((item) => `<button type="button" role="tab" class="tab${item.id === current.id ? ' is-current' : ''}"
          aria-selected="${item.id === current.id}" data-action="library-tab" data-value="${item.id}">${icon(item.icon, 16)}<span>${t(item.label)}</span></button>`).join('')}
      </nav>
      <div class="lib-scroll" tabindex="0" aria-label="${esc(t(current.label))}">
        ${unlocked && found < total ? `<p class="lib-intro">${hasAgency ? t('lib.growHint') : t('lib.startHint')}</p>` : ''}
        ${body}
        <p class="lib-note">${t('lib.note', { date: checkedText() })}</p>
      </div>
    </main>`;
}
