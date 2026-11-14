import { esc, fmt, difficultyLabel } from '../format.js';
import { legend, soundToggle, langToggle } from '../components/overlays.js';
import { icon } from '../components/icons.js';
import { starRow, rankCard } from '../components/rewards.js';
import { teamPicker } from '../components/team.js';
import { t } from '../../i18n/index.js';
// NASA public-domain maps (credits in src/view3d/planets.js and the README), also used by the 3D view.
import earthMap from '../../assets/textures/earth_1k.jpg';
import moonMap from '../../assets/textures/moon_1k.jpg';
import marsMap from '../../assets/textures/mars_1k.jpg';

/** Planet map for each mission's porthole, by destination. */
const PLANET_MAPS = { 'earth-observation': earthMap, 'moon-exploration': moonMap, 'mars-study': marsMap };

const HOW_TO_PLAY = [
  { icon: 'flag', key: 'howto.1' },
  { icon: 'solar', key: 'howto.2' },
  { icon: 'rocket', key: 'howto.3' },
  { icon: 'orbit', key: 'howto.4' },
  { icon: 'star', key: 'howto.5' },
];

const DIFFICULTY_PIPS = { easy: 1, medium: 2, hard: 3 };

/** Free mission screen: rank, the 3 missions with stars, how to play and the best scores (no campaign). */
export function menuScreen({ state, data, best, progress, room = null }) {
  const cards = data.scenarios
    .map((scenario, index) => {
      const selected = scenario.id === state.scenarioId;
      const bestScore = best.byScenario[scenario.id];
      const stars = progress.byScenario[scenario.id]?.stars ?? 0;
      const pips = DIFFICULTY_PIPS[scenario.difficulty] ?? 1;
      const level = difficultyLabel(scenario.difficulty);
      return `
        <button type="button" class="card scenario-card${selected ? ' is-selected' : ''}" data-card data-mission="${esc(scenario.id)}"
          data-action="select-scenario" data-value="${esc(scenario.id)}" aria-pressed="${selected}" aria-label="${esc(scenario.name)}">
          <span class="planet" aria-hidden="true"${PLANET_MAPS[scenario.id] ? ` style="--planet-map: url('${PLANET_MAPS[scenario.id]}')"` : ''}><span class="planet-shade"></span></span>
          <span class="card-main">
            <span class="card-head">
              <span class="card-kicker">${t('free.missionN', { n: index + 1 })}</span>
              <span class="difficulty badge-${esc(scenario.difficulty)}" title="${esc(level)}">
                ${[1, 2, 3].map((step) => `<i class="${step <= pips ? 'on' : ''}"></i>`).join('')} ${esc(level)}
              </span>
            </span>
            <span class="card-title">${esc(scenario.name)}</span>
            <span class="card-text">${esc(scenario.description)}</span>
            <span class="stats stats-row">
              <span class="stat" title="${t('objective.budget')}">${icon('budget', 16)}<span class="stat-value">${fmt(scenario.budgetMUsd)} M USD</span></span>
              <span class="stat" title="${t('objective.timeLimit')}">${icon('time', 16)}<span class="stat-value">${t('unit.days', { n: fmt(scenario.maxDays) })}</span></span>
              <span class="stat" title="${t('objective.scienceGoal')}">${icon('science', 16)}<span class="stat-value">${t('unit.pts', { n: fmt(scenario.minScience) })}</span></span>
            </span>
            <span class="scenario-foot">
              ${starRow(stars, { label: t('stars.earned', { n: stars }) })}
              ${bestScore !== undefined ? `<span class="best">${icon('star', 14)} ${t('free.best', { n: fmt(bestScore) })}</span>` : ''}
            </span>
          </span>
        </button>`;
    })
    .join('');

  return `
    <main class="menu" data-mission="${esc(state.scenarioId)}">
      <header class="free-head">
        <button type="button" class="btn" data-action="menu">${icon('back', 16)} ${t('common.mainMenu')}</button>
        <div>
          <h1>${t('free.title')}</h1>
          <p class="lead">${t('free.lead')}</p>
        </div>
        ${langToggle()}
        ${soundToggle()}
      </header>
      ${rankCard(progress)}
      <section aria-labelledby="missions-title">
        <h2 id="missions-title">${t('free.choose')}</h2>
        <div class="scenario-grid">${cards}</div>
        ${teamPicker(state.team, room)}
        <div class="menu-actions">
          <button type="button" class="btn btn-primary btn-big" data-action="start">${icon('rocket', 22)} ${t('free.start')}</button>
          <button type="button" class="btn btn-big btn-library" data-action="library">${icon('book', 22)} ${t('common.library')}</button>
          <button type="button" class="btn btn-big" data-action="badges">${icon('medal', 22)} ${t('badges.title')}</button>
        </div>
      </section>
      <details class="how-to">
        <summary><h2>${t('free.howTo')}</h2></summary>
        <ol>${HOW_TO_PLAY.map((step) => `<li>${icon(step.icon, 18)}<span>${esc(t(step.key))}</span></li>`).join('')}</ol>
        <p class="note">${t('stars.howTo')}</p>
        <p class="note">${t('free.simplified')}</p>
      </details>
      ${legend()}
    </main>`;
}
