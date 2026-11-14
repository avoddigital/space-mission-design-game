// Mission Library: a separate screen with real space exploration knowledge (src/data/library.js).
// It is screen-only (opened from the menu or the top bar) and never changes the game state.

import { esc } from '../format.js';
import { icon } from '../components/icons.js';
import { soundToggle } from '../components/overlays.js';
import { libraryMissions, libraryTopics, challengeResources, CHECKED_ON } from '../../data/library.js';

export const LIBRARY_TABS = [
  { id: 'missions', label: 'Real missions', icon: 'planet' },
  { id: 'topics', label: 'How missions work', icon: 'bulb' },
  { id: 'resources', label: 'NASA resources', icon: 'flag' },
];

const RESOURCE_NAMES = { mass: 'Mass', power: 'Power', budget: 'Budget', data: 'Data', comms: 'Communications', time: 'Time' };

const CHECKED_TEXT = new Date(`${CHECKED_ON}T12:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

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
      <figcaption>${esc(image.caption)} <span class="lib-credit">Credit: ${link(image.page, image.credit)}</span></figcaption>
    </figure>`;
}

function factList(facts) {
  return `<ul class="lib-facts">${facts
    .map((fact) => `<li><span>${esc(fact.text)}</span> <a class="lib-source" href="${esc(fact.source)}" target="_blank" rel="noopener noreferrer" title="Checked on ${esc(CHECKED_TEXT)}">${esc(sourceLabel(fact.source))} ↗</a></li>`)
    .join('')}</ul>`;
}

function missionCard(mission) {
  return `
    <article class="lib-card" data-target="${esc(mission.target)}">
      ${figure(mission.image)}
      <div class="lib-body">
        <p class="lib-kicker">${esc(mission.target)} · launched ${esc(mission.launched)}</p>
        <h3 class="lib-title">${esc(mission.name)}</h3>
        <p class="lib-summary">${esc(mission.summary)}</p>
        ${factList(mission.facts)}
        <p class="lib-more">${link(mission.url, 'Mission page at NASA')}</p>
      </div>
    </article>`;
}

function topicCard(topic) {
  return `
    <article class="lib-card">
      ${figure(topic.image)}
      <div class="lib-body">
        <p class="lib-kicker">${icon(topic.resource, 14)} In the game: ${esc(RESOURCE_NAMES[topic.resource] ?? topic.resource)}</p>
        <h3 class="lib-title">${esc(topic.title)}</h3>
        <p class="lib-summary">${esc(topic.summary)}</p>
        ${factList(topic.facts)}
        ${topic.more ? `<p class="lib-more">${link(topic.more.url, topic.more.label)}</p>` : ''}
      </div>
    </article>`;
}

function resourcesList() {
  return `
    <p class="lib-intro">These are the official resources of the NASA Space Apps 2026 challenge "Space Mission Design Game". They are where professionals start.</p>
    <ul class="lib-resources">${challengeResources
      .map((item) => `<li>${link(item.url, item.name)}<span>${esc(item.text)}</span></li>`)
      .join('')}</ul>`;
}

/**
 * @param {{ tab?: string, inGame?: boolean }} options inGame: opened from a mission, so "Back" returns there
 */
export function libraryScreen({ tab = 'missions', inGame = false } = {}) {
  const current = LIBRARY_TABS.find((item) => item.id === tab) ?? LIBRARY_TABS[0];
  let body;
  if (current.id === 'missions') {
    const groups = ['Earth', 'Moon', 'Mars'].map((target) => {
      const missions = libraryMissions.filter((mission) => mission.target === target);
      return `<section class="lib-group" aria-label="${target}"><h2 class="lib-group-title">${icon(target === 'Moon' ? 'moon' : 'planet', 16)} ${target}</h2><div class="lib-grid">${missions.map(missionCard).join('')}</div></section>`;
    });
    body = groups.join('');
  } else if (current.id === 'topics') {
    body = `<div class="lib-grid">${libraryTopics.map(topicCard).join('')}</div>`;
  } else {
    body = resourcesList();
  }

  return `
    <main class="library">
      <header class="lib-head">
        <button type="button" class="btn" data-action="close-library">${icon('back', 16)} ${inGame ? 'Back to mission' : 'Main menu'}</button>
        <div class="lib-heading">
          <h1>Mission Library</h1>
          <p>Real missions, real NASA images. Every fact links to the official page it came from.</p>
        </div>
        ${soundToggle()}
      </header>
      <nav class="tabs lib-tabs" role="tablist" aria-label="Library sections">
        ${LIBRARY_TABS.map((item) => `<button type="button" role="tab" class="tab${item.id === current.id ? ' is-current' : ''}"
          aria-selected="${item.id === current.id}" data-action="library-tab" data-value="${item.id}">${icon(item.icon, 16)}<span>${item.label}</span></button>`).join('')}
      </nav>
      <div class="lib-scroll" tabindex="0" aria-label="${esc(current.label)}">
        ${body}
        <p class="lib-note">Facts checked on official NASA pages on ${esc(CHECKED_TEXT)}. Images from the NASA Image and Video Library (images.nasa.gov); they load from NASA, so they need an internet connection. Game values elsewhere are simplified; the facts in this library are not.</p>
      </div>
    </main>`;
}
