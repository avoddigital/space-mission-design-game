// Steps 1 to 3 (objective, spacecraft, launch) and the shared game layout.

import { esc, fmt, stars, targetName } from '../format.js';
import { t } from '../../i18n/index.js';
import { card, dots } from '../components/card.js';
import { meter, scienceMeter, readiness, flightStatus } from '../components/meter.js';
import { checklist } from '../components/checklist.js';
import { learnBox, legend, soundToggle, langToggle } from '../components/overlays.js';
import { icon, partIconKey, orbitIconKey } from '../components/icons.js';
import { nextStep, hintLine } from '../components/hint.js';
import { projectionCard, topbarRewards } from '../components/rewards.js';
import { turnChip } from '../components/team.js';

const STEPS = [
  { step: 1, screen: 'objective', label: 'steps.objective', icon: 'flag' },
  { step: 2, screen: 'spacecraft', label: 'steps.spacecraft', icon: 'solar' },
  { step: 3, screen: 'launch', label: 'steps.launch', icon: 'rocket' },
  { step: 4, screen: 'simulation', label: 'steps.flight', icon: 'orbit' },
  { step: 5, screen: 'report', label: 'steps.report', icon: 'star' },
];

function stepTabs(state) {
  return `
    <nav class="steps" aria-label="${t('aria.steps')}">
      ${STEPS.map(({ step, screen, label, icon: key }) => {
        const current = state.screen === screen;
        const done = state.confirmedSteps.includes(step);
        const canGo = step <= 3;
        return `<button type="button" class="step${current ? ' is-current' : ''}${done ? ' is-done' : ''}"
          ${canGo ? `data-action="go-step" data-value="${step}"` : 'disabled'} ${current ? 'aria-current="step"' : ''}>
          <span class="step-num">${done ? icon('check', 14) : icon(key, 14)}</span><span class="step-label">${t(label)}</span></button>`;
      }).join('')}
    </nav>`;
}

/** Simple 2D picture of the spacecraft. It is also the fallback when 3D is not available. */
function craftDiagram(mission) {
  const groups = [
    { type: 'instrument', label: t('tabs.instruments') },
    { type: 'power', label: t('tabs.power') },
    { type: 'comms', label: t('tabs.antenna') },
  ];
  return `
    <div class="craft" aria-label="${t('craft.yours')}">
      <div class="craft-body">${t('craft.body')}<br><small>${t('craft.bodyParts')}</small></div>
      ${groups
        .map(({ type, label }) => {
          const parts = mission.parts.filter((part) => part.type === type);
          return `<div class="craft-group"><span class="craft-label">${label}</span>${
            parts.length
              ? parts.map((part) => `<span class="craft-part craft-${type}">${icon(partIconKey(part), 14)} ${esc(part.name)}</span>`).join('')
              : `<span class="craft-empty">${t('craft.none')}</span>`
          }</div>`;
        })
        .join('')}
    </div>`;
}

/** 3D slot (filled by src/ui/view3dHost.js when 3D is available) above the 2D diagram. */
function craftStage(mission) {
  return `
    <div class="stage-sky" aria-hidden="true"></div>
    <div class="view3d-slot" data-view3d><p class="view3d-note">${t('common.loading3d')}</p></div>
    ${craftDiagram(mission)}`;
}

/**
 * The 5 meters and the science line. With `baseline`, it is a preview:
 * the meters show the values after a possible choice, with the change from now.
 */
export function metersPanel(evaluation, content, shake = new Set(), baseline = null, previewLabel = t('preview.label'), projection = null, flight = null) {
  return `
    <section class="meters${baseline ? ' is-preview' : ''}" aria-label="${t('aria.resources')}">
      ${baseline ? `<p class="preview-label">${esc(previewLabel)}</p>` : ''}
      ${flight ? flightStatus(flight) : readiness(evaluation)}
      ${['budget', 'mass', 'power', 'data', 'time'].map((key) => meter(key, evaluation.budget, content.meters?.[key], { shake: shake.has(key), baseline: baseline?.budget })).join('')}
      ${scienceMeter(evaluation.budget, baseline?.budget, flight)}
      ${projection ? projectionCard(projection.score, projection.baseline) : ''}
    </section>`;
}

/** Shared layout: header with steps, cards on the left, stage in the middle, meters on the right. */
export function gameLayout({ state, scenario, evaluation, content, shake, title, cards, stage, footer, results = false, hero = false, hint = '', progress = null, projected = null, flight = null, ui = null }) {
  // On phones, result screens (simulation and report) show the left panel first.
  return `
    <div class="game${results ? ' layout-results' : ''}${hero ? ' layout-hero' : ''}" data-mission="${esc(scenario.id)}">
      <header class="topbar">
        <span class="mission-name">${icon(scenario.id.includes('moon') ? 'moon' : 'planet', 18)} ${esc(scenario.name)}</span>
        ${progress ? topbarRewards(progress, scenario.id) : ''}
        ${state.mode === 'campaign' && state.campaign ? `<span class="readout topbar-funds" title="${t('common.agencyFunds')}"><small>${t('common.agencyFunds')}</small><b>${fmt(state.campaign.fundsMUsd)} <i>M USD</i></b></span>` : ''}
        ${stepTabs(state)}
        <button type="button" class="btn btn-icon" data-action="library" aria-label="${t('common.library')}" title="${t('common.library')}">${icon('book', 18)}</button>
        ${langToggle()}
        ${soundToggle()}
        <button type="button" class="btn btn-icon" data-action="pause" aria-label="${t('common.pause')}">${icon('pause', 18)}</button>
      </header>
      <section class="panel cards-panel" aria-labelledby="panel-title">
        <h2 id="panel-title">${esc(title)}</h2>
        ${turnChip(state.team, state.screen, ui?.tab)}
        ${hint}
        ${cards}
      </section>
      <section class="stage" aria-label="${t('aria.missionView')}">${stage}</section>
      ${metersPanel(evaluation, content, shake, null, undefined, projected && ['spacecraft', 'launch'].includes(state.screen) ? { score: projected } : null, flight)}
      <footer class="footer">${footer}${legend()}</footer>
    </div>`;
}

// --- Step 1: objective ---

export function objectiveScreen(ctx) {
  const { scenario, content, data } = ctx;
  const text = content.scenarios?.[scenario.id] ?? {};
  const orbitNames = scenario.allowedOrbits.map((id) => data.orbits.find((orbit) => orbit.id === id)?.name ?? id);
  const cards = `
    <p class="question">“${esc(text.question ?? scenario.name)}”</p>
    <p class="briefing">${esc(text.briefing ?? scenario.description)}</p>
    <ul class="goals">
      <li>${icon('science', 18)}<span><strong>${t('objective.scienceGoal')}</strong> ${t('objective.scienceGoalValue', { n: fmt(scenario.minScience) })}</span></li>
      <li>${icon('budget', 18)}<span><strong>${t('objective.budget')}</strong> ${t('objective.budgetValue', { n: fmt(scenario.budgetMUsd) })}</span></li>
      <li>${icon('time', 18)}<span><strong>${t('objective.timeLimit')}</strong> ${t('objective.timeValue', { days: fmt(scenario.maxDays), ops: fmt(scenario.operationDays) })}</span></li>
      <li>${icon('orbit', 18)}<span><strong>${t('objective.where')}</strong> ${esc(orbitNames.join(', '))}</span></li>
    </ul>
    ${text.fact ? `<p class="fact">${esc(text.fact)}</p>` : ''}
    ${learnBox(content.learn?.objective)}`;
  return gameLayout({
    ...ctx,
    hero: true,
    title: t('objective.title'),
    hint: hintLine(nextStep('objective', ctx)),
    cards,
    stage: craftStage(ctx.mission),
    footer: `<button type="button" class="btn" data-action="menu">${icon('back', 16)} ${ctx.state.mode === 'campaign' ? t('common.commandCenter') : t('objective.missions')}</button>
      <button type="button" class="btn btn-primary" data-action="confirm" data-value="1">${t('objective.next')} ${icon('next', 16)}</button>`,
  });
}

// --- Step 2: spacecraft ---

const TABS = [
  { type: 'instrument', label: 'tabs.instruments', icon: 'camera', action: 'toggle-part', hint: 'tabs.hintInstrument' },
  { type: 'power', label: 'tabs.power', icon: 'power', action: 'set-power', hint: 'tabs.hintPower' },
  { type: 'comms', label: 'tabs.antenna', icon: 'comms', action: 'set-comms', hint: 'tabs.hintComms' },
];

/** Biggest value of each field among the parts of one type, so dots are relative to the group. */
function groupMax(parts, type) {
  const group = parts.filter((part) => part.type === type);
  const max = (field) => Math.max(0, ...group.map((part) => part[field] ?? 0));
  return { massKg: max('massKg'), powerW: max('powerW'), powerGenW: max('powerGenW'), costMUsd: max('costMUsd'), dataGbPerDay: max('dataGbPerDay'), downlinkGbPerDay: max('downlinkGbPerDay') };
}

/** Stats shown on a part card: dots relative to the group, exact value as tooltip or on demand. */
function partStats(part, max) {
  const stats = [
    { key: 'mass', label: t('stat.mass'), level: dots(part.massKg, max.massKg), value: `${fmt(part.massKg)} kg` },
    { key: 'budget', label: t('stat.cost'), level: dots(part.costMUsd, max.costMUsd), value: `${fmt(part.costMUsd)} M USD` },
  ];
  if (part.type === 'power') {
    stats.push({ key: 'power', label: t('stat.makes'), level: dots(part.powerGenW, max.powerGenW), value: `${fmt(part.powerGenW)} W`, good: true });
  } else {
    stats.push({ key: 'power', label: t('stat.uses'), level: dots(part.powerW, max.powerW), value: `${fmt(part.powerW)} W` });
  }
  if (part.type === 'instrument') {
    stats.push({ key: 'data', label: t('stat.data'), level: dots(part.dataGbPerDay, max.dataGbPerDay), value: `${fmt(part.dataGbPerDay)} ${t('unit.gbDay')}` });
    stats.push({ key: 'science', label: t('stat.science'), text: stars(part.scienceValue), value: t('stat.ofTen', { n: part.scienceValue }), good: true });
  }
  if (part.type === 'comms') {
    stats.push({ key: 'data', label: t('stat.sends'), level: dots(part.downlinkGbPerDay, max.downlinkGbPerDay), value: `${fmt(part.downlinkGbPerDay)} ${t('unit.gbDay')}`, good: true });
  }
  return stats;
}

/**
 * Badges for a part: what makes it stand out in its group (top or bottom third). Display only,
 * computed from the tables. One strength (green) and one price to pay (amber), at most.
 */
export function partBadges(part, group) {
  const third = (field, value, top) => {
    const values = group.map((item) => item[field] ?? 0).sort((a, b) => a - b);
    if (values.length < 3 || values[0] === values[values.length - 1]) return false;
    const n = values.length;
    const cut = values[top ? Math.min(n - 1, Math.ceil((n * 2) / 3)) : Math.max(0, Math.floor(n / 3) - 1)];
    return top ? value >= cut : value <= cut;
  };
  const strengths = [];
  const costs = [];
  if (part.type === 'instrument' && third('scienceValue', part.scienceValue, true)) strengths.push(t('badge.highScience'));
  if (part.type === 'power' && third('powerGenW', part.powerGenW, true)) strengths.push(t('badge.mostPower'));
  if (part.type === 'comms' && third('downlinkGbPerDay', part.downlinkGbPerDay, true)) strengths.push(t('badge.fastLink'));
  if (third('costMUsd', part.costMUsd, false)) strengths.push(t('badge.cheap'));
  if (third('massKg', part.massKg, false)) strengths.push(t('badge.light'));
  if (part.type === 'instrument' && third('dataGbPerDay', part.dataGbPerDay, true)) costs.push(t('badge.lotsOfData'));
  if (part.type === 'instrument' && third('powerW', part.powerW, true)) costs.push(t('badge.powerHungry'));
  if (third('massKg', part.massKg, true)) costs.push(t('badge.heavy'));
  if (third('costMUsd', part.costMUsd, true)) costs.push(t('badge.expensive'));
  return [
    ...strengths.slice(0, costs.length ? 1 : 2).map((label) => ({ label, tone: 'good' })),
    ...costs.slice(0, strengths.length ? 1 : 2).map((label) => ({ label, tone: 'warn' })),
  ];
}

/** Badges for a rocket in its table. */
function rocketBadges(rocket, rockets) {
  const badges = [];
  if (rocket.costMUsd === Math.min(...rockets.map((item) => item.costMUsd))) badges.push({ label: t('badge.cheapest') });
  if (rocket.payloadKg.LEO === Math.max(...rockets.map((item) => item.payloadKg.LEO))) badges.push({ label: t('badge.strongest') });
  if (rocket.payloadKg.TMI > 0 && rocket.costMUsd === Math.min(...rockets.filter((item) => item.payloadKg.TMI > 0).map((item) => item.costMUsd))) {
    badges.push({ label: t('badge.cheapestMars') });
  }
  return badges.slice(0, 2);
}

function numbersToggle(ui) {
  return `<button type="button" class="toggle${ui.showNumbers ? ' is-on' : ''}" data-action="toggle-numbers" aria-pressed="${Boolean(ui.showNumbers)}">
      <span class="toggle-knob"></span> ${t('common.showNumbers')}</button>`;
}

export function spacecraftScreen(ctx) {
  const { state, data, content, ui } = ctx;
  const tab = TABS.find((item) => item.type === ui.tab) ?? TABS[0];
  const count = (type) =>
    state.design.partIds.filter((id) => data.parts.find((part) => part.id === id)?.type === type).length;
  const tabs = `
    <div class="tabs" role="tablist">
      ${TABS.map((item) => `<button type="button" role="tab" class="tab${item.type === tab.type ? ' is-current' : ''}"
        aria-selected="${item.type === tab.type}" data-action="tab" data-value="${item.type}">
        ${icon(item.icon, 18)}<span>${t(item.label)}</span>${count(item.type) ? ` <span class="count">${count(item.type)}</span>` : ''}</button>`).join('')}
    </div>
    <div class="panel-tools"><p class="hint">${t(tab.hint)}</p>${numbersToggle(ui)}</div>`;
  const max = groupMax(data.parts, tab.type);
  const group = data.parts.filter((part) => part.type === tab.type);
  const cards = data.parts
    .filter((part) => part.type === tab.type)
    .map((part) =>
      card({
        action: tab.action,
        value: part.id,
        title: part.name,
        description: part.description,
        iconKey: partIconKey(part),
        stats: partStats(part, max),
        badges: partBadges(part, group),
        selected: state.design.partIds.includes(part.id),
        showNumbers: ui.showNumbers,
      }),
    )
    .join('');
  return gameLayout({
    ...ctx,
    hero: true,
    title: t('spacecraft.title'),
    hint: hintLine(nextStep('spacecraft', ctx), ctx.ui.tab),
    cards: `${tabs}<div class="card-list">${cards}</div>${learnBox(content.learn?.spacecraft)}`,
    stage: craftStage(ctx.mission),
    footer: `<button type="button" class="btn" data-action="go-step" data-value="1">${icon('back', 16)} ${t('common.back')}</button>
      <button type="button" class="btn btn-primary" data-action="confirm" data-value="2">${t('spacecraft.next')} ${icon('next', 16)}</button>`,
  });
}

// --- Step 3: launch and orbit ---

/** Quick answers on each rocket card: does my spacecraft fit, and can I pay for it? */
function rocketTags(rocket, capacity, { evaluation, mission }) {
  if (!capacity) return [];
  const { mass, budget } = evaluation.budget;
  const tags = [];
  const free = capacity - mass.usedKg;
  if (free < 0) tags.push({ text: t('rocketTag.tooSmall', { n: fmt(-free) }), tone: 'bad' });
  else if (free / capacity < 0.1) tags.push({ text: t('rocketTag.tight', { n: fmt(free) }), tone: 'warn' });
  else tags.push({ text: t('rocketTag.fits', { n: fmt(free) }), tone: 'good' });
  const costWithRocket = budget.usedMUsd - (mission.rocket?.costMUsd ?? 0) + rocket.costMUsd;
  if (costWithRocket > budget.limitMUsd) tags.push({ text: t('rocketTag.overBudget', { n: fmt(costWithRocket - budget.limitMUsd) }), tone: 'bad' });
  return tags;
}

export function launchScreen(ctx) {
  const { state, data, scenario, evaluation, content, ui } = ctx;
  const orbit = ctx.mission.orbit;
  const orbitCards = data.orbits
    .filter((item) => scenario.allowedOrbits.includes(item.id))
    .map((item) =>
      card({
        action: 'set-orbit',
        value: item.id,
        title: item.name,
        description: item.description,
        iconKey: orbitIconKey(item),
        stats: [
          { key: 'orbit', label: t('stat.altitude'), text: `${fmt(item.altitudeKm)} km`, value: `${fmt(item.altitudeKm)} km` },
          { key: 'time', label: t('stat.trip'), text: item.transferDays ? t('unit.days', { n: fmt(item.transferDays) }) : t('launch.direct'), value: item.transferDays ? t('unit.days', { n: fmt(item.transferDays) }) : t('launch.direct') },
        ],
        selected: state.design.orbitId === item.id,
        showNumbers: true,
      }),
    )
    .join('');
  const maxCost = Math.max(...data.rockets.map((rocket) => rocket.costMUsd));
  const rocketCards = data.rockets
    .map((rocket) => {
      const capacity = orbit ? rocket.payloadKg[orbit.target] ?? 0 : null;
      const stats = [{ key: 'budget', label: t('stat.cost'), level: dots(rocket.costMUsd, maxCost, 'log'), value: `${fmt(rocket.costMUsd)} M USD` }];
      if (orbit) {
        const carries = capacity > 0 ? t('launch.carriesTo', { kg: fmt(capacity), target: targetName(orbit.target) }) : '—';
        stats.push({ key: 'mass', label: t('stat.carries'), text: carries, value: carries, good: true, wide: true });
      } else {
        const carries = `${fmt(rocket.payloadKg.LEO)} kg`;
        stats.push({ key: 'mass', label: t('stat.toLeo'), text: carries, value: carries, good: true });
      }
      return card({
        action: 'set-rocket',
        value: rocket.id,
        title: rocket.name,
        description: rocket.description,
        iconKey: 'rocket',
        stats,
        tags: rocketTags(rocket, capacity, ctx),
        selected: state.design.rocketId === rocket.id,
        badges: rocketBadges(rocket, data.rockets),
        disabled: orbit !== null && capacity === 0,
        reason: orbit ? t('launch.cantReach', { target: targetName(orbit.target) }) : '',
        showNumbers: ui.showNumbers,
      });
    })
    .join('');
  const ready = evaluation.ok;
  const checks = checklist(evaluation, content, data, { currentStep: 3 });
  const cards = `
    <h3>${icon('orbit', 18)} ${t('launch.orbit')}</h3><div class="card-list">${orbitCards}</div>
    <h3>${icon('rocket', 18)} ${t('launch.rocket')}</h3>
    ${orbit ? '' : `<p class="hint">${t('launch.pickOrbitFirst')}</p>`}
    <div class="card-list">${rocketCards}</div>
    ${learnBox(content.learn?.launch)}`;
  const stage = `
    <h3>${icon('flag', 18)} ${t('launch.checklist')}</h3>
    ${checks}
    <p class="launch-note${ready ? ' is-ready' : ''}">${
      ready ? (checks.includes('check-check') ? t('launch.goWithMargins') : t('launch.allGo')) : t('launch.someRed')
    }</p>
    ${state.mode === 'campaign' && state.campaign ? `<p class="launch-cost">${icon('budget', 16)} ${t('launch.cost', { cost: `<b>${fmt(evaluation.budget.budget.usedMUsd)} M USD</b>`, funds: `<b>${fmt(state.campaign.fundsMUsd)} M USD</b>` })}</p>` : ''}`;
  return gameLayout({
    ...ctx,
    title: t('launch.title'),
    hint: hintLine(nextStep('launch', ctx)),
    cards,
    stage,
    footer: `<button type="button" class="btn" data-action="go-step" data-value="2">${icon('back', 16)} ${t('common.back')}</button>
      <button type="button" class="btn btn-launch ${ready ? 'btn-go' : 'btn-warn'}" data-action="launch">${icon('rocket', 20)} ${ready ? t('launch.launch') : t('launch.launchAnyway')}</button>`,
  });
}
