// Steps 1 to 3 (objective, spacecraft, launch) and the shared game layout.

import { esc, fmt, stars, TARGET_NAMES } from '../format.js';
import { card } from '../components/card.js';
import { meter, scienceMeter } from '../components/meter.js';
import { checklist } from '../components/checklist.js';
import { learnBox, legend } from '../components/overlays.js';
import { nextStep, hintLine } from '../components/hint.js';
import { projectionCard, topbarRewards } from '../components/rewards.js';

const STEPS = [
  { step: 1, screen: 'objective', label: 'Objective' },
  { step: 2, screen: 'spacecraft', label: 'Spacecraft' },
  { step: 3, screen: 'launch', label: 'Launch & orbit' },
  { step: 4, screen: 'simulation', label: 'Simulation' },
  { step: 5, screen: 'report', label: 'Report' },
];

function stepTabs(state) {
  return `
    <nav class="steps" aria-label="Mission steps">
      ${STEPS.map(({ step, screen, label }) => {
        const current = state.screen === screen;
        const done = state.confirmedSteps.includes(step);
        const canGo = step <= 3;
        return `<button type="button" class="step${current ? ' is-current' : ''}${done ? ' is-done' : ''}"
          ${canGo ? `data-action="go-step" data-value="${step}"` : 'disabled'} ${current ? 'aria-current="step"' : ''}>
          <span class="step-num">${done ? '✓' : step}</span><span class="step-label">${label}</span></button>`;
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
            parts.length ? parts.map((part) => `<span class="craft-part craft-${type}">${esc(part.name)}</span>`).join('') : '<span class="craft-empty">none yet</span>'
          }</div>`;
        })
        .join('')}
    </div>`;
}

/** 3D slot (filled by src/ui/view3dHost.js when 3D is available) above the 2D diagram. */
function craftStage(mission) {
  return `
    <div class="view3d-slot" data-view3d><p class="view3d-note">Loading 3D view…</p></div>
    ${craftDiagram(mission)}`;
}

/**
 * The 5 meters and the science line. With `baseline`, it is a preview:
 * the meters show the values after a possible choice, with the change from now.
 */
export function metersPanel(evaluation, content, shake = new Set(), baseline = null, previewLabel = 'Preview: if you pick this', projection = null) {
  return `
    <section class="meters${baseline ? ' is-preview' : ''}" aria-label="Resources">
      ${baseline ? `<p class="preview-label">${esc(previewLabel)}</p>` : ''}
      ${['budget', 'mass', 'power', 'data', 'time'].map((key) => meter(key, evaluation.budget, content.meters?.[key], { shake: shake.has(key), baseline: baseline?.budget })).join('')}
      ${scienceMeter(evaluation.budget, baseline?.budget)}
      ${projection ? projectionCard(projection.score, projection.baseline) : ''}
    </section>`;
}

/** Shared layout: header with steps, cards on the left, stage in the middle, meters on the right. */
export function gameLayout({ state, scenario, evaluation, content, shake, title, cards, stage, footer, results = false, hint = '', progress = null, projected = null }) {
  // On phones, result screens (simulation and report) show the left panel first.
  return `
    <div class="game${results ? ' layout-results' : ''}">
      <header class="topbar">
        <span class="mission-name">${esc(scenario.name)}</span>
        ${progress ? topbarRewards(progress, scenario.id) : ''}
        ${stepTabs(state)}
        <button type="button" class="btn btn-icon" data-action="pause" aria-label="Pause">⏸</button>
      </header>
      <section class="panel cards-panel" aria-labelledby="panel-title">
        <h2 id="panel-title">${esc(title)}</h2>
        ${hint}
        ${cards}
      </section>
      <section class="stage" aria-label="Mission view">${stage}</section>
      ${metersPanel(evaluation, content, shake, null, undefined, projected && ['spacecraft', 'launch'].includes(state.screen) ? { score: projected } : null)}
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
    <p>${esc(text.briefing ?? scenario.description)}</p>
    <ul class="goals">
      <li><strong>Science goal:</strong> at least ${fmt(scenario.minScience)} points</li>
      <li><strong>Budget:</strong> ${fmt(scenario.budgetMUsd)} million USD</li>
      <li><strong>Time limit:</strong> ${fmt(scenario.maxDays)} days (${fmt(scenario.operationDays)} days of science after arriving)</li>
      <li><strong>Where:</strong> ${esc(orbitNames.join(', '))}</li>
    </ul>
    ${text.fact ? `<p class="fact">${esc(text.fact)}</p>` : ''}
    ${learnBox(content.learn?.objective)}`;
  return gameLayout({
    ...ctx,
    title: 'Step 1 · Your mission',
    hint: hintLine(nextStep('objective', ctx)),
    cards,
    stage: craftStage(ctx.mission),
    footer: `<button type="button" class="btn" data-action="menu">← Missions</button>
      <button type="button" class="btn btn-primary" data-action="confirm" data-value="1">Build the spacecraft →</button>`,
  });
}

// --- Step 2: spacecraft ---

const TABS = [
  { type: 'instrument', label: 'Instruments', action: 'toggle-part', hint: 'Pick as many as you like.' },
  { type: 'power', label: 'Power', action: 'set-power', hint: 'Pick one power source.' },
  { type: 'comms', label: 'Comms', action: 'set-comms', hint: 'Pick one antenna.' },
];

function partStats(part) {
  const stats = [
    { label: 'Mass', value: `${fmt(part.massKg)} kg` },
    { label: 'Cost', value: `${fmt(part.costMUsd)} M USD` },
  ];
  if (part.type === 'power') stats.push({ label: 'Makes', value: `${fmt(part.powerGenW)} W` });
  else stats.push({ label: 'Uses', value: `${fmt(part.powerW)} W` });
  if (part.type === 'instrument') {
    stats.push({ label: 'Data', value: `${fmt(part.dataGbPerDay)} GB/day` });
    stats.push({ label: 'Science', value: `${stars(part.scienceValue)} ${part.scienceValue}` });
  }
  if (part.type === 'comms') stats.push({ label: 'Sends', value: `${fmt(part.downlinkGbPerDay)} GB/day` });
  return stats;
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
        ${item.label}${count(item.type) ? ` <span class="count">${count(item.type)}</span>` : ''}</button>`).join('')}
    </div>
    <p class="hint">${tab.hint}</p>`;
  const cards = data.parts
    .filter((part) => part.type === tab.type)
    .map((part) =>
      card({
        action: tab.action,
        value: part.id,
        title: part.name,
        description: part.description,
        stats: partStats(part),
        selected: state.design.partIds.includes(part.id),
      }),
    )
    .join('');
  return gameLayout({
    ...ctx,
    title: 'Step 2 · Build your spacecraft',
    hint: hintLine(nextStep('spacecraft', ctx), ctx.ui.tab),
    cards: `${tabs}<div class="card-list">${cards}</div>${learnBox(content.learn?.spacecraft)}`,
    stage: craftStage(ctx.mission),
    footer: `<button type="button" class="btn" data-action="go-step" data-value="1">← Back</button>
      <button type="button" class="btn btn-primary" data-action="confirm" data-value="2">Choose orbit and rocket →</button>`,
  });
}

// --- Step 3: launch and orbit ---

/** Quick answers on each rocket card: does my spacecraft fit, and can I pay for it? */
function rocketTags(rocket, capacity, { evaluation, mission }) {
  if (!capacity) return [];
  const { mass, budget } = evaluation.budget;
  const tags = [];
  const free = capacity - mass.usedKg;
  if (free < 0) tags.push({ text: `Too small: ${fmt(-free)} kg over`, tone: 'bad' });
  else if (free / capacity < 0.1) tags.push({ text: `Fits, but tight: ${fmt(free)} kg free`, tone: 'warn' });
  else tags.push({ text: `Fits ✓ ${fmt(free)} kg free`, tone: 'good' });
  const costWithRocket = budget.usedMUsd - (mission.rocket?.costMUsd ?? 0) + rocket.costMUsd;
  if (costWithRocket > budget.limitMUsd) tags.push({ text: `Over budget by ${fmt(costWithRocket - budget.limitMUsd)} M USD`, tone: 'bad' });
  return tags;
}

export function launchScreen(ctx) {
  const { state, data, scenario, evaluation, content } = ctx;
  const orbit = ctx.mission.orbit;
  const orbitCards = data.orbits
    .filter((item) => scenario.allowedOrbits.includes(item.id))
    .map((item) =>
      card({
        action: 'set-orbit',
        value: item.id,
        title: item.name,
        description: item.description,
        stats: [
          { label: 'Altitude', value: `${fmt(item.altitudeKm)} km` },
          { label: 'Trip', value: item.transferDays ? `${fmt(item.transferDays)} days` : 'direct' },
        ],
        selected: state.design.orbitId === item.id,
      }),
    )
    .join('');
  const rocketCards = data.rockets
    .map((rocket) => {
      const capacity = orbit ? rocket.payloadKg[orbit.target] ?? 0 : null;
      const stats = [{ label: 'Cost', value: `${fmt(rocket.costMUsd)} M USD` }];
      if (orbit) {
        stats.push({ label: 'Carries', value: capacity > 0 ? `${fmt(capacity)} kg to ${TARGET_NAMES[orbit.target]}` : '—' });
      } else {
        stats.push({ label: 'To low Earth orbit', value: `${fmt(rocket.payloadKg.LEO)} kg` });
      }
      return card({
        action: 'set-rocket',
        value: rocket.id,
        title: rocket.name,
        description: rocket.description,
        stats,
        tags: rocketTags(rocket, capacity, ctx),
        selected: state.design.rocketId === rocket.id,
        disabled: orbit !== null && capacity === 0,
        reason: orbit ? `Can't reach ${TARGET_NAMES[orbit.target]}.` : '',
      });
    })
    .join('');
  const ready = evaluation.ok;
  const checks = checklist(evaluation, content, data);
  const cards = `
    <h3>Orbit</h3><div class="card-list">${orbitCards}</div>
    <h3>Rocket</h3>
    ${orbit ? '' : '<p class="hint">Pick an orbit first to see how much each rocket can carry there.</p>'}
    <div class="card-list">${rocketCards}</div>
    ${learnBox(content.learn?.launch)}`;
  const stage = `
    <h3>Launch checklist</h3>
    ${checks}
    <p class="launch-note${ready ? ' is-ready' : ''}">${
      ready ? (checks.includes('check-check') ? 'GO, with small margins on the yellow lines. Good luck!' : 'All systems GO. Good luck!') : 'Some lines are red. You can still launch, but physics does not negotiate: the mission will fail.'
    }</p>`;
  return gameLayout({
    ...ctx,
    title: 'Step 3 · Orbit and rocket',
    hint: hintLine(nextStep('launch', ctx)),
    cards,
    stage,
    footer: `<button type="button" class="btn" data-action="go-step" data-value="2">← Back</button>
      <button type="button" class="btn ${ready ? 'btn-go' : 'btn-warn'}" data-action="launch">${ready ? '🚀 Launch' : '🚀 Launch anyway'}</button>`,
  });
}
