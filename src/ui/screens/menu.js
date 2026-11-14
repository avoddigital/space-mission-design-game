import { esc, fmt, DIFFICULTY_LABELS } from '../format.js';
import { legend } from '../components/overlays.js';

const HOW_TO_PLAY = [
  'Choose a mission and read its science question.',
  'Build your spacecraft: instruments, a power source and an antenna.',
  'Pick an orbit and a rocket strong enough to carry your spacecraft.',
  'Launch and watch your mission. Surprises can happen!',
  'Read the report, learn why it worked or failed, and try to beat your score.',
];

/** Start screen: the 3 missions, how to play and the best scores. */
export function menuScreen({ state, data, best }) {
  const cards = data.scenarios
    .map((scenario, index) => {
      const selected = scenario.id === state.scenarioId;
      const bestScore = best.byScenario[scenario.id];
      return `
        <button type="button" class="card scenario-card${selected ? ' is-selected' : ''}" data-card
          data-action="select-scenario" data-value="${esc(scenario.id)}" aria-pressed="${selected}">
          <span class="card-head">
            <span class="card-title">${index + 1}. ${esc(scenario.name)}</span>
            <span class="badge badge-${esc(scenario.difficulty)}">${esc(DIFFICULTY_LABELS[scenario.difficulty] ?? scenario.difficulty)}</span>
          </span>
          <span class="card-text">${esc(scenario.description)}</span>
          <span class="chips">
            <span class="chip"><span class="chip-label">Budget</span> ${fmt(scenario.budgetMUsd)} M USD</span>
            <span class="chip"><span class="chip-label">Time limit</span> ${fmt(scenario.maxDays)} days</span>
            <span class="chip"><span class="chip-label">Science goal</span> ${fmt(scenario.minScience)} points</span>
          </span>
          ${bestScore !== undefined ? `<span class="best">★ Best score: ${fmt(bestScore)} / 100</span>` : ''}
        </button>`;
    })
    .join('');

  return `
    <main class="menu">
      <header class="menu-hero">
        <h1>Space Mission Design Game</h1>
        <p class="lead">Design a real space mission, from the science question to the launch. Every choice has a cost.</p>
      </header>
      <section aria-labelledby="missions-title">
        <h2 id="missions-title">Choose your mission</h2>
        <div class="scenario-grid">${cards}</div>
        <button type="button" class="btn btn-primary btn-big" data-action="start">Start mission →</button>
      </section>
      <section class="how-to" aria-labelledby="how-title">
        <h2 id="how-title">How to play</h2>
        <ol>${HOW_TO_PLAY.map((step) => `<li>${esc(step)}</li>`).join('')}</ol>
        <p class="note">Values in this game are simplified, inspired by real NASA missions and rockets.</p>
      </section>
      ${legend()}
    </main>`;
}
