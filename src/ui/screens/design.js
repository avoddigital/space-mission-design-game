// Steps 1 to 3 (objective, spacecraft, launch) and the shared game layout.

import { esc, fmt, stars, TARGET_NAMES } from '../format.js';
import { card, dots } from '../components/card.js';
import { meter, scienceMeter, readiness } from '../components/meter.js';
import { checklist } from '../components/checklist.js';
import { learnBox, legend, soundToggle } from '../components/overlays.js';
import { icon, partIconKey, orbitIconKey } from '../components/icons.js';

const STEPS = [
  { step: 1, screen: 'objective', label: 'Objective', icon: 'flag' },
  { step: 2, screen: 'spacecraft', label: 'Spacecraft', icon: 'solar' },
  { step: 3, screen: 'launch', label: 'Launch', icon: 'rocket' },
  { step: 4, screen: 'simulation', label: 'Flight', icon: 'orbit' },
  { step: 5, screen: 'report', label: 'Report', icon: 'star' },
];

function stepTabs(state) {
  return `
    <nav class="steps" aria-label="Mission steps">
      ${STEPS.map(({ step, screen, label, icon: key }) => {
        const current = state.screen === screen;
        const done = state.confirmedSteps.includes(step);
        const canGo = step <= 3;
        return `<button type="button" class="step${current ? ' is-current' : ''}${done ? ' is-done' : ''}"
          ${canGo ? `data-action="go-step" data-value="${step}"` : 'disabled'} ${current ? 'aria-current="step"' : ''}>
          <span class="step-num">${done ? icon('check', 14) : icon(key, 14)}</span><span class="step-label">${label}</span></button>`;
      }).join('')}
    </nav>`;
}

/** Simple 2D picture of the spacecraft. It is also the fallback when 3D is not available. */
function craftDiagram(mission) {
  const groups = [
    { type: 'instrument', label: 'Instruments' },
    { type: 'power', label: 'Power' },
    { type: 'comms', label: 'Antenna' },
  ];
  return `
    <div class="craft" aria-label="Your spacecraft">
      <div class="craft-body">Spacecraft body<br><small>frame, computer, heaters</small></div>
      ${groups
        .map(({ type, label }) => {
          const parts = mission.parts.filter((part) => part.type === type);
          return `<div class="craft-group"><span class="craft-label">${label}</span>${
            parts.length
              ? parts.map((part) => `<span class="craft-part craft-${type}">${icon(partIconKey(part), 14)} ${esc(part.name)}</span>`).join('')
              : '<span class="craft-empty">none yet</span>'
          }</div>`;
        })
        .join('')}
    </div>`;
}

/** 3D slot (filled by src/ui/view3dHost.js when 3D is available) above the 2D diagram. */
function craftStage(mission) {
  return `
    <div class="stage-sky" aria-hidden="true"></div>
    <div class="view3d-slot" data-view3d><p class="view3d-note">Loading 3D view…</p></div>
    ${craftDiagram(mission)}`;
}

function metersPanel(evaluation, content, shake) {
  return `
    <section class="meters" aria-label="Resources">
      ${readiness(evaluation)}
      ${['budget', 'mass', 'power', 'data', 'time'].map((key) => meter(key, evaluation.budget, content.meters?.[key], { shake: shake.has(key) })).join('')}
      ${scienceMeter(evaluation.budget)}
    </section>`;
}

/** Shared layout: header with steps, cards on the left, stage in the middle, meters on the right. */
export function gameLayout({ state, scenario, evaluation, content, shake, title, cards, stage, footer, results = false, hero = false }) {
  // On phones, result screens (simulation and report) show the left panel first.
  return `
    <div class="game${results ? ' layout-results' : ''}${hero ? ' layout-hero' : ''}" data-mission="${esc(scenario.id)}">
      <header class="topbar">
        <span class="mission-name">${icon(scenario.id.includes('moon') ? 'moon' : 'planet', 18)} ${esc(scenario.name)}</span>
        ${stepTabs(state)}
        <button type="button" class="btn btn-icon" data-action="library" aria-label="Mission Library" title="Mission Library">${icon('book', 18)}</button>
        ${soundToggle()}
        <button type="button" class="btn btn-icon" data-action="pause" aria-label="Pause">${icon('pause', 18)}</button>
      </header>
      <section class="panel cards-panel" aria-labelledby="panel-title">
        <h2 id="panel-title">${esc(title)}</h2>
        ${cards}
      </section>
      <section class="stage" aria-label="Mission view">${stage}</section>
      ${metersPanel(evaluation, content, shake)}
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
      <li>${icon('science', 18)}<span><strong>Science goal</strong> at least ${fmt(scenario.minScience)} points</span></li>
      <li>${icon('budget', 18)}<span><strong>Budget</strong> ${fmt(scenario.budgetMUsd)} million USD</span></li>
      <li>${icon('time', 18)}<span><strong>Time limit</strong> ${fmt(scenario.maxDays)} days (${fmt(scenario.operationDays)} days of science after arriving)</span></li>
      <li>${icon('orbit', 18)}<span><strong>Where</strong> ${esc(orbitNames.join(', '))}</span></li>
    </ul>
    ${text.fact ? `<p class="fact">${esc(text.fact)}</p>` : ''}
    ${learnBox(content.learn?.objective)}`;
  return gameLayout({
    ...ctx,
    hero: true,
    title: 'Your mission',
    cards,
    stage: craftStage(ctx.mission),
    footer: `<button type="button" class="btn" data-action="menu">${icon('back', 16)} Missions</button>
      <button type="button" class="btn btn-primary" data-action="confirm" data-value="1">Build the spacecraft ${icon('next', 16)}</button>`,
  });
}

// --- Step 2: spacecraft ---

const TABS = [
  { type: 'instrument', label: 'Instruments', icon: 'camera', action: 'toggle-part', hint: 'Pick as many as you like.' },
  { type: 'power', label: 'Power', icon: 'power', action: 'set-power', hint: 'Pick one power source.' },
  { type: 'comms', label: 'Antenna', icon: 'comms', action: 'set-comms', hint: 'Pick one antenna.' },
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
    { key: 'mass', label: 'Mass', level: dots(part.massKg, max.massKg), value: `${fmt(part.massKg)} kg` },
    { key: 'budget', label: 'Cost', level: dots(part.costMUsd, max.costMUsd), value: `${fmt(part.costMUsd)} M USD` },
  ];
  if (part.type === 'power') {
    stats.push({ key: 'power', label: 'Makes', level: dots(part.powerGenW, max.powerGenW), value: `${fmt(part.powerGenW)} W`, good: true });
  } else {
    stats.push({ key: 'power', label: 'Uses', level: dots(part.powerW, max.powerW), value: `${fmt(part.powerW)} W` });
  }
  if (part.type === 'instrument') {
    stats.push({ key: 'data', label: 'Data', level: dots(part.dataGbPerDay, max.dataGbPerDay), value: `${fmt(part.dataGbPerDay)} GB/day` });
    stats.push({ key: 'science', label: 'Science', text: stars(part.scienceValue), value: `${part.scienceValue} of 10`, good: true });
  }
  if (part.type === 'comms') {
    stats.push({ key: 'data', label: 'Sends', level: dots(part.downlinkGbPerDay, max.downlinkGbPerDay), value: `${fmt(part.downlinkGbPerDay)} GB/day`, good: true });
  }
  return stats;
}

function numbersToggle(ui) {
  return `<button type="button" class="toggle${ui.showNumbers ? ' is-on' : ''}" data-action="toggle-numbers" aria-pressed="${Boolean(ui.showNumbers)}">
      <span class="toggle-knob"></span> Show numbers</button>`;
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
        ${icon(item.icon, 18)}<span>${item.label}</span>${count(item.type) ? ` <span class="count">${count(item.type)}</span>` : ''}</button>`).join('')}
    </div>
    <div class="panel-tools"><p class="hint">${tab.hint}</p>${numbersToggle(ui)}</div>`;
  const max = groupMax(data.parts, tab.type);
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
        selected: state.design.partIds.includes(part.id),
        showNumbers: ui.showNumbers,
      }),
    )
    .join('');
  return gameLayout({
    ...ctx,
    hero: true,
    title: 'Build your spacecraft',
    cards: `${tabs}<div class="card-list">${cards}</div>${learnBox(content.learn?.spacecraft)}`,
    stage: craftStage(ctx.mission),
    footer: `<button type="button" class="btn" data-action="go-step" data-value="1">${icon('back', 16)} Back</button>
      <button type="button" class="btn btn-primary" data-action="confirm" data-value="2">Choose orbit and rocket ${icon('next', 16)}</button>`,
  });
}

// --- Step 3: launch and orbit ---

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
          { key: 'orbit', label: 'Altitude', text: `${fmt(item.altitudeKm)} km`, value: `${fmt(item.altitudeKm)} km` },
          { key: 'time', label: 'Trip', text: item.transferDays ? `${fmt(item.transferDays)} days` : 'direct', value: item.transferDays ? `${fmt(item.transferDays)} days` : 'direct' },
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
      const stats = [{ key: 'budget', label: 'Cost', level: dots(rocket.costMUsd, maxCost, 'log'), value: `${fmt(rocket.costMUsd)} M USD` }];
      if (orbit) {
        const carries = capacity > 0 ? `${fmt(capacity)} kg to ${TARGET_NAMES[orbit.target]}` : '—';
        stats.push({ key: 'mass', label: 'Carries', text: carries, value: carries, good: true });
      } else {
        const carries = `${fmt(rocket.payloadKg.LEO)} kg`;
        stats.push({ key: 'mass', label: 'To low Earth orbit', text: carries, value: carries, good: true });
      }
      return card({
        action: 'set-rocket',
        value: rocket.id,
        title: rocket.name,
        description: rocket.description,
        iconKey: 'rocket',
        stats,
        selected: state.design.rocketId === rocket.id,
        disabled: orbit !== null && capacity === 0,
        reason: orbit ? `Can't reach ${TARGET_NAMES[orbit.target]}.` : '',
        showNumbers: ui.showNumbers,
      });
    })
    .join('');
  const ready = evaluation.ok;
  const cards = `
    <h3>${icon('orbit', 18)} Orbit</h3><div class="card-list">${orbitCards}</div>
    <h3>${icon('rocket', 18)} Rocket</h3>
    ${orbit ? '' : '<p class="hint">Pick an orbit first to see how much each rocket can carry there.</p>'}
    <div class="card-list">${rocketCards}</div>
    ${learnBox(content.learn?.launch)}`;
  const stage = `
    <h3>${icon('flag', 18)} Launch checklist</h3>
    ${checklist(evaluation, content, data, { currentStep: 3 })}
    <p class="launch-note${ready ? ' is-ready' : ''}">${
      ready ? 'All systems GO. Good luck!' : 'Some lines are red. You can still launch, but physics does not negotiate: the mission will fail.'
    }</p>`;
  return gameLayout({
    ...ctx,
    title: 'Orbit and rocket',
    cards,
    stage,
    footer: `<button type="button" class="btn" data-action="go-step" data-value="2">${icon('back', 16)} Back</button>
      <button type="button" class="btn btn-launch ${ready ? 'btn-go' : 'btn-warn'}" data-action="launch">${icon('rocket', 20)} ${ready ? 'Launch' : 'Launch anyway'}</button>`,
  });
}
