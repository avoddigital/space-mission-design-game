import { esc, fmt, DIFFICULTY_LABELS } from '../format.js';
import { legend, soundToggle } from '../components/overlays.js';
import { icon } from '../components/icons.js';

const HOW_TO_PLAY = [
  { icon: 'flag', text: 'Choose a mission and read its science question.' },
  { icon: 'solar', text: 'Build your spacecraft: instruments, a power source and an antenna.' },
  { icon: 'rocket', text: 'Pick an orbit and a rocket strong enough to carry your spacecraft.' },
  { icon: 'orbit', text: 'Launch and watch your mission. Surprises can happen!' },
  { icon: 'star', text: 'Read the report, learn why it worked or failed, and try to beat your score.' },
];

const DIFFICULTY_PIPS = { easy: 1, medium: 2, hard: 3 };

/** Start screen: the 3 missions, how to play and the best scores. */
export function menuScreen({ state, data, best }) {
  const cards = data.scenarios
    .map((scenario, index) => {
      const selected = scenario.id === state.scenarioId;
      const bestScore = best.byScenario[scenario.id];
      const pips = DIFFICULTY_PIPS[scenario.difficulty] ?? 1;
      return `
        <button type="button" class="card scenario-card${selected ? ' is-selected' : ''}" data-card data-mission="${esc(scenario.id)}"
          data-action="select-scenario" data-value="${esc(scenario.id)}" aria-pressed="${selected}" aria-label="${esc(scenario.name)}">
          <span class="planet" aria-hidden="true"><span class="planet-shade"></span></span>
          <span class="card-main">
            <span class="card-head">
              <span class="card-kicker">Mission ${index + 1}</span>
              <span class="difficulty badge-${esc(scenario.difficulty)}" title="${esc(DIFFICULTY_LABELS[scenario.difficulty] ?? scenario.difficulty)}">
                ${[1, 2, 3].map((step) => `<i class="${step <= pips ? 'on' : ''}"></i>`).join('')} ${esc(DIFFICULTY_LABELS[scenario.difficulty] ?? scenario.difficulty)}
              </span>
            </span>
            <span class="card-title">${esc(scenario.name)}</span>
            <span class="card-text">${esc(scenario.description)}</span>
            <span class="stats stats-row">
              <span class="stat" title="Budget">${icon('budget', 16)}<span class="stat-value">${fmt(scenario.budgetMUsd)} M USD</span></span>
              <span class="stat" title="Time limit">${icon('time', 16)}<span class="stat-value">${fmt(scenario.maxDays)} days</span></span>
              <span class="stat" title="Science goal">${icon('science', 16)}<span class="stat-value">${fmt(scenario.minScience)} pts</span></span>
            </span>
            ${bestScore !== undefined ? `<span class="best">${icon('star', 14)} Best score: ${fmt(bestScore)} / 100</span>` : ''}
          </span>
        </button>`;
    })
    .join('');

  return `
    <main class="menu" data-mission="${esc(state.scenarioId)}">
      ${soundToggle('menu-sound')}
      <header class="menu-hero">
        <svg class="emblem" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
          <circle cx="32" cy="34" r="15" fill="#2f5fa8"/>
          <path d="M17.5 30a15 15 0 0 1 29 0z" fill="#5c9ae6"/>
          <ellipse cx="32" cy="34" rx="27" ry="9" fill="none" stroke="#e8e4d6" stroke-width="2.5" transform="rotate(-18 32 34)"/>
          <g transform="translate(53 22) rotate(-18)"><rect x="-3" y="-3" width="6" height="6" fill="#ffbe55"/><rect x="-10" y="-1.5" width="6" height="3" fill="#e8e4d6"/><rect x="4" y="-1.5" width="6" height="3" fill="#e8e4d6"/></g>
        </svg>
        <p class="eyebrow">NASA Space Apps 2026</p>
        <h1>Tupi <span>Orbit</span></h1>
        <p class="subtitle">Space Mission Design Game</p>
        <p class="lead">Design a real space mission, from the science question to the launch. Every choice has a cost.</p>
      </header>
      <section aria-labelledby="missions-title">
        <h2 id="missions-title">Choose your mission</h2>
        <div class="scenario-grid">${cards}</div>
        <div class="menu-actions">
          <button type="button" class="btn btn-primary btn-big" data-action="start">${icon('rocket', 22)} Start mission</button>
          <button type="button" class="btn btn-big btn-library" data-action="library">${icon('book', 22)} Mission Library</button>
        </div>
      </section>
      <details class="how-to">
        <summary><h2>How to play</h2></summary>
        <ol>${HOW_TO_PLAY.map((step) => `<li>${icon(step.icon, 18)}<span>${esc(step.text)}</span></li>`).join('')}</ol>
        <p class="note">Values in this game are simplified, inspired by real NASA missions and rockets.</p>
      </details>
      ${legend()}
    </main>`;
}
