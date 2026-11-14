// Campaign screens: title, new agency (country + focus) and the command center.
// They only show the campaign and send actions; the rules live in src/engine/campaign.js.

import { esc, fmt } from '../format.js';
import { teamPicker } from '../components/team.js';
import { icon } from '../components/icons.js';
import { soundToggle, legend, langToggle } from '../components/overlays.js';
import { flag } from '../flags.js';
import {
  countries, focuses, phases, research, sideJobs, agencyEvents, START_FUNDS_MUSD, START_SCIENCE,
} from '../../data/campaign.js';
import {
  currentPhase, phaseStatus, availableSideJobs, sideJobBlock, researchCost, researchBlock, rewardPreview, isFinished,
} from '../../engine/campaign.js';
import { t, localizeList } from '../../i18n/index.js';

// Translated tables (names and texts only; ids and numbers stay the same).
const L = {
  countries: () => localizeList(countries, 'campaign.countries'),
  focuses: () => localizeList(focuses, 'campaign.focuses'),
  phases: () => localizeList(phases, 'campaign.phases'),
  research: () => localizeList(research, 'campaign.research'),
  sideJobs: () => localizeList(sideJobs, 'campaign.sideJobs'),
  events: () => localizeList(agencyEvents, 'campaign.agencyEvents'),
};
const nameIn = (list, id) => list.find((item) => item.id === id)?.name ?? id;
export const countryName = (id) => nameIn(L.countries(), id);
const destination = (id) => t(`dest.${id}`);

/**
 * What the 3D globe should show for this campaign: the open destinations, the next one,
 * and the agency's home country (highlighted on the Earth).
 * @param {object|null} campaign
 * @param {string|null} [homeId] country being picked on the new agency screen (no campaign yet)
 */
export function globeView(campaign, homeId = null) {
  if (!campaign) return { unlocked: ['earth'], target: null, home: homeId }; // title and setup: just Earth, no marker
  const unlocked = ['earth', ...phases.filter((phase) => phaseStatus(campaign, phase.id) !== 'locked').map((phase) => phase.id)];
  return { unlocked: [...new Set(unlocked)], target: currentPhase(campaign)?.id ?? null, home: campaign.countryId ?? null };
}

/** One line of the agency log, in the current language. Old saves kept plain text. */
function logText(entry) {
  if (!entry.key) return entry.text ?? '';
  const v = entry.values ?? {};
  return t(entry.key, {
    ...v,
    phase: v.phase ? nameIn(L.phases(), v.phase) : '',
    job: v.job ? nameIn(L.sideJobs(), v.job) : '',
    research: v.research ? nameIn(L.research(), v.research) : '',
    event: v.event ? nameIn(L.events(), v.event) : '',
    cost: v.cost !== undefined ? fmt(v.cost) : '',
    funds: v.funds !== undefined ? fmt(v.funds) : '',
    science: v.science !== undefined ? fmt(v.science) : '',
  });
}

function globeSlot(caption = '') {
  return `
    <div class="stage-sky" aria-hidden="true"></div>
    <div class="view3d-slot" data-view3d="globe"><p class="view3d-note">${t('common.loading3d')}</p></div>
    ${caption ? `<p class="globe-caption">${caption}</p>` : ''}`;
}

function readout(label, value, unit = '') {
  return `<span class="readout"><small>${esc(label)}</small><b>${value}${unit ? ` <i>${esc(unit)}</i>` : ''}</b></span>`;
}

// --- Title ---

export function titleScreen({ saved }) {
  const phase = saved ? currentPhase(saved) : null;
  const phaseName = phase ? nameIn(L.phases(), phase.id) : t('title.allDone');
  const continueButton = saved
    ? `<button type="button" class="btn btn-primary btn-big title-continue" data-action="continue-campaign">
        ${flag(saved.countryId, 'flag flag-sm')}
        <span>${t('title.continue')}<small>${esc(countryName(saved.countryId))} · ${esc(phaseName)}</small></span>
      </button>`
    : '';
  return `
    <main class="title">
      <section class="stage title-stage" aria-label="${t('aria.earth')}">${globeSlot()}</section>
      <section class="title-panel">
        <div class="title-tools">${langToggle()}${soundToggle()}</div>
        <p class="eyebrow">NASA Space Apps 2026</p>
        <h1>Tupi <span>Orbit</span></h1>
        <p class="subtitle">${t('title.subtitle')}</p>
        <p class="lead">${t('title.lead')}</p>
        <div class="title-actions">
          ${continueButton}
          <button type="button" class="btn ${saved ? '' : 'btn-primary '}btn-big" data-action="new-campaign">${icon('flag', 22)} ${t('title.new')}</button>
          <div class="title-row">
            <button type="button" class="btn" data-action="free-play">${icon('rocket', 16)} ${t('title.free')}</button>
            <button type="button" class="btn" data-action="library">${icon('book', 16)} ${t('common.library')}</button>
            <button type="button" class="btn title-badges" data-action="badges">${icon('medal', 16)} ${t('badges.title')}</button>
            <a class="btn title-join" href="?sala=">${icon('devices', 16)} ${t('room.join')}</a>
          </div>
        </div>
        ${legend()}
      </section>
    </main>`;
}

// --- New agency ---

export function setupScreen({ setup, team = null, room = null }) {
  const country = setup.countryId;
  const focus = setup.focusId;
  const flags = L.countries()
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((item) => `
      <button type="button" class="country${item.id === country ? ' is-selected' : ''}" data-action="pick-country" data-value="${item.id}" aria-pressed="${item.id === country}">
        ${flag(item.id)}<span>${esc(item.name)}</span>
      </button>`)
    .join('');
  const focusCards = L.focuses()
    .map((item) => `
      <button type="button" class="card focus-card${item.id === focus ? ' is-selected' : ''}" data-action="pick-focus" data-value="${item.id}" aria-pressed="${item.id === focus}">
        <span class="card-icon">${icon(item.icon, 24)}</span>
        <span class="card-main">
          <span class="card-title">${esc(item.name)}</span>
          <span class="card-text">${esc(item.text)}</span>
          <span class="focus-bonus">${icon('star', 12)} ${esc(item.bonus)}</span>
        </span>
      </button>`)
    .join('');
  const ready = Boolean(country && focus);
  return `
    <main class="setup">
      <section class="stage setup-stage" aria-label="${t('aria.earth')}">
        ${globeSlot(country ? `${flag(country, 'flag flag-sm')} ${esc(countryName(country))}` : t('setup.chooseCountry'))}
      </section>
      <section class="panel setup-panel">
        <h2>${t('setup.title')}</h2>
        <h3>${icon('flag', 16)} ${t('setup.country')}</h3>
        <p class="hint">${t('setup.countryHint')}</p>
        <div class="countries">${flags}</div>
        <h3>${icon('bulb', 16)} ${t('setup.focus')}</h3>
        <div class="card-list">${focusCards}</div>
        ${teamPicker(team, room)}
        <p class="setup-start">${t('setup.start')} ${readout(t('hub.funds'), fmt(START_FUNDS_MUSD), 'M USD')} ${readout(t('hub.science'), fmt(START_SCIENCE), t('unit.ptsWord'))}</p>
        <div class="setup-actions">
          <button type="button" class="btn" data-action="menu">${icon('back', 16)} ${t('common.back')}</button>
          <button type="button" class="btn btn-primary" data-action="found-agency" ${ready ? '' : 'aria-disabled="true"'}>
            ${t('setup.found')} ${icon('next', 16)}
          </button>
        </div>
      </section>
    </main>`;
}

// --- Command center ---

function phaseCard(campaign, phase, scenario) {
  const status = phaseStatus(campaign, phase.id);
  const lamp = t(`hub.lamp.${status}`);
  const budget = Math.min(scenario.budgetMUsd, Math.floor(campaign.fundsMUsd));
  const body = status === 'locked'
    ? `<span class="card-text">${t('hub.lockedText')}</span>`
    : `<span class="card-text">${esc(phase.goal)}</span>
       <span class="stats stats-row">
         <span class="stat" title="${t('hub.budgetTitle')}">${icon('budget', 14)}<span class="stat-value">${fmt(budget)} / ${fmt(scenario.budgetMUsd)} M</span></span>
         <span class="stat" title="${t('objective.timeLimit')}">${icon('time', 14)}<span class="stat-value">${t('unit.daysShort', { n: fmt(scenario.maxDays) })}</span></span>
         <span class="stat" title="${t('hub.rewardTitle')}">${icon('star', 14)}<span class="stat-value">${status === 'done' ? t('hub.scienceOnly') : `+${fmt(phase.rewardMUsd)} M`}</span></span>
       </span>`;
  return `
    <button type="button" class="card phase-card is-${status}" ${status === 'locked' ? 'aria-disabled="true"' : `data-action="plan" data-value="${esc(phase.scenarioId)}"`}
      data-mission="${esc(phase.scenarioId)}" aria-label="${esc(phase.name)}: ${lamp}">
      <span class="card-icon">${icon(phase.id === 'moon' ? 'moon' : 'planet', 24)}</span>
      <span class="card-main">
        <span class="card-head"><span class="card-title">${esc(phase.name)}</span><span class="tag phase-tag">${lamp}</span></span>
        ${body}
        ${status === 'locked' ? `<span class="card-reason">${t('hub.lamp.locked')}</span>` : ''}
      </span>
    </button>`;
}

function rewardText(campaign, reward) {
  const preview = rewardPreview(campaign, reward);
  const parts = [];
  if (preview.fundsMUsd) parts.push(`+${fmt(preview.fundsMUsd)} M USD`);
  if (preview.science) parts.push(t('agency.plusScience', { n: fmt(preview.science) }));
  return parts.join(', ');
}

function blockText(block) {
  return block ? t(`block.${block}`) : '';
}

function sideJobCard(campaign, job, text) {
  const block = sideJobBlock(campaign, job.id);
  return `
    <button type="button" class="card op-card" data-action="side-job" data-value="${job.id}" ${block ? 'aria-disabled="true"' : ''}>
      <span class="card-icon">${icon(job.icon, 22)}</span>
      <span class="card-main">
        <span class="card-head"><span class="card-title">${esc(text.name)}</span><span class="tag">${t('hub.usesLeft', { n: job.usesLeft })}</span></span>
        <span class="card-text">${esc(text.text)}</span>
        <span class="stats stats-row">
          <span class="stat" title="${t('stat.cost')}">${icon('budget', 14)}<span class="stat-value">${job.costMUsd ? `−${fmt(job.costMUsd)} M` : t('hub.free')}</span></span>
          <span class="stat" title="${t('hub.chance')}">${icon('dice', 14)}<span class="stat-value">${Math.round(job.chance * 100)}%</span></span>
          <span class="stat" title="${t('hub.ifWorks')}">${icon('star', 14)}<span class="stat-value">${esc(rewardText(campaign, job.reward))}</span></span>
        </span>
        ${block ? `<span class="card-reason">${esc(blockText(block))}</span>` : ''}
      </span>
    </button>`;
}

function researchCard(campaign, item) {
  const done = campaign.research.includes(item.id);
  const block = done ? null : researchBlock(campaign, item.id);
  return `
    <button type="button" class="card op-card${done ? ' is-selected' : ''}" data-action="research" data-value="${item.id}" ${done || block ? 'aria-disabled="true"' : ''} aria-pressed="${done}">
      <span class="card-icon">${icon(item.icon, 22)}</span>
      <span class="card-main">
        <span class="card-head"><span class="card-title">${esc(item.name)}</span>${done ? `<span class="tag tag-good">${icon('check', 12)} ${t('hub.done')}</span>` : `<span class="tag">${t('hub.scienceCost', { n: fmt(researchCost(campaign, item.id)) })}</span>`}</span>
        <span class="card-text">${esc(item.text)}</span>
        ${block ? `<span class="card-reason">${esc(blockText(block))}</span>` : ''}
      </span>
    </button>`;
}

export function hubScreen({ campaign, data, ui }) {
  const next = currentPhase(campaign);
  const focus = L.focuses().find((item) => item.id === campaign.focusId);
  const localPhases = L.phases();
  const scenarioOf = (phase) => data.scenarios.find((scenario) => scenario.id === phase.scenarioId);
  const opsTab = ui.opsTab === 'research' ? 'research' : 'jobs';
  const jobTexts = L.sideJobs();
  const jobs = availableSideJobs(campaign);
  const ops = opsTab === 'jobs'
    ? `<p class="hint">${t('hub.jobsHint')}</p><div class="card-list">${jobs.map((job) => sideJobCard(campaign, job, jobTexts.find((item) => item.id === job.id) ?? job)).join('')}</div>`
    : `<p class="hint">${t('hub.researchHint')}</p><div class="card-list">${L.research().map((item) => researchCard(campaign, item)).join('')}</div>`;
  const log = campaign.log.length
    ? `<ul class="agency-log">${campaign.log.map((entry) => `<li><span>${t('hub.monthShort', { n: entry.turn })}</span> ${esc(logText(entry))}</li>`).join('')}</ul>`
    : `<p class="hint">${t('hub.logEmpty')}</p>`;
  const caption = next
    ? `${icon('flag', 14)} ${t('hub.nextDest')} <b>${destination(next.id)}</b>`
    : `${icon('star', 14)} ${t('hub.allPhases')}`;
  const nextName = next ? nameIn(localPhases, next.id) : '';

  return `
    <div class="game hub layout-hero" data-mission="${esc(next?.scenarioId ?? 'mars-study')}">
      <header class="topbar hub-top">
        <span class="agency">${flag(campaign.countryId, 'flag flag-sm')}<span><b>${esc(countryName(campaign.countryId))}</b><small>${t('hub.agencyOf', { focus: esc(focus?.name ?? '') })}</small></span></span>
        <span class="readouts">
          ${readout(t('hub.funds'), fmt(campaign.fundsMUsd), 'M USD')}
          ${readout(t('hub.science'), fmt(campaign.science), t('unit.ptsWord'))}
          ${readout(t('hub.month'), fmt(campaign.turn))}
        </span>
        <button type="button" class="btn btn-icon" data-action="library" aria-label="${t('common.library')}" title="${t('common.library')}">${icon('book', 18)}</button>
        <button type="button" class="btn btn-icon" data-action="badges" aria-label="${t('badges.title')}" title="${t('badges.title')}">${icon('medal', 18)}</button>
        ${langToggle()}
        ${soundToggle()}
        <button type="button" class="btn btn-icon" data-action="menu" aria-label="${t('hub.titleScreen')}" title="${t('hub.titleScreen')}">${icon('home', 18)}</button>
      </header>
      <section class="panel cards-panel hub-phases" aria-labelledby="phases-title">
        <h2 id="phases-title">${t('hub.phases')}</h2>
        <div class="card-list">${localPhases.map((phase) => phaseCard(campaign, phase, scenarioOf(phase))).join('')}</div>
        <h3>${icon('time', 16)} ${t('hub.log')}</h3>
        ${log}
      </section>
      <section class="stage hub-stage" aria-label="${t('hub.destinations')}">${globeSlot(caption)}</section>
      <section class="panel hub-ops" aria-labelledby="ops-title">
        <h2 id="ops-title">${t('hub.operations')}</h2>
        <div class="tabs" role="tablist">
          <button type="button" role="tab" class="tab${opsTab === 'jobs' ? ' is-current' : ''}" aria-selected="${opsTab === 'jobs'}" data-action="ops-tab" data-value="jobs">${icon('rocket', 16)}<span>${t('hub.jobs')}</span></button>
          <button type="button" role="tab" class="tab${opsTab === 'research' ? ' is-current' : ''}" aria-selected="${opsTab === 'research'}" data-action="ops-tab" data-value="research">${icon('science', 16)}<span>${t('hub.research')}</span></button>
        </div>
        ${ops}
      </section>
      <footer class="footer">
        ${next
          ? `<button type="button" class="btn btn-primary btn-launch-plan" data-action="plan" data-value="${esc(next.scenarioId)}">${icon('rocket', 18)} ${t('hub.plan', { phase: esc(nextName) })}</button>`
          : `<p class="hub-done">${icon('star', 16)} ${t('hub.complete')} ${isFinished(campaign) ? t('hub.reachedMars') : ''}</p>`}
        ${legend()}
      </footer>
    </div>`;
}
