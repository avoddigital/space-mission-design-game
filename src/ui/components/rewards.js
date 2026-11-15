// Gamification views: stars, rank and the projected score. Presentation only.
// Badges ("mission patches") live in src/engine/achievements.js and src/ui/screens/badges.js.

import { esc } from '../format.js';
import { rankFor, totalStars, RANKS } from '../../engine/progress.js';
import { t } from '../../i18n/index.js';
import { icon } from './icons.js';

const MAX_STARS = 3;
/** Stars in the whole game: the top rank needs all of them. */
const MAX_TOTAL_STARS = RANKS[RANKS.length - 1].minStars;

/** Rank name in the current language. */
const rankName = (name) => t(`rank.${name}`);

/** Row of 3 stars. `animate` reveals them one by one (report screen). */
export function starRow(stars, { animate = false, label = '' } = {}) {
  const items = Array.from({ length: MAX_STARS }, (_, index) => {
    const on = index < stars;
    return `<span class="star${on ? ' is-on' : ''}${animate && on ? ' is-pop' : ''}" style="--delay:${400 + index * 250}ms">${on ? '★' : '☆'}</span>`;
  }).join('');
  return `<span class="stars" role="img" aria-label="${esc(label || t('stars.of3', { n: stars }))}">${items}</span>`;
}

/**
 * Rank plate for the Free mission screen (DESIGN.md section 9): an insignia, the rank in stencil letters,
 * a row of 9 star lamps (one per star, with a gap where each new rank starts) and an amber readout.
 */
export function rankCard(progress) {
  const stars = totalStars(progress);
  const rank = rankFor(stars);
  const next = rank.next
    ? t('rank.next', { name: `<strong>${esc(rankName(rank.next.name))}</strong>`, n: rank.next.starsNeeded })
    : t('rank.top');
  const rankStarts = new Set(RANKS.map((item) => item.minStars));
  const lamps = Array.from({ length: MAX_TOTAL_STARS }, (_, index) => {
    const classes = ['rank-lamp', index < stars ? 'is-on' : '', index > 0 && rankStarts.has(index) ? 'is-step' : ''];
    return `<i class="${classes.filter(Boolean).join(' ')}"></i>`;
  }).join('');
  return `
    <section class="rank-card" aria-label="${esc(t('rank.aria'))}">
      <span class="rank-insignia" aria-hidden="true">${icon('medal', 26)}</span>
      <span class="rank-body">
        <span class="rank-head"><small class="rank-caption">${t('rank.caption')}</small><span class="rank-name">${esc(rankName(rank.name))}</span></span>
        <span class="rank-lamps" role="img" aria-label="${esc(t('rank.starsAria', { n: stars, total: MAX_TOTAL_STARS }))}">${lamps}</span>
        <span class="rank-next">${next}</span>
      </span>
      <span class="readout rank-readout"><small>${t('rank.starsCaption')}</small><b>${stars}<i> / ${MAX_TOTAL_STARS}</i></b></span>
    </section>`;
}

/** Rewards block for the report: stars earned and promotions. */
export function reportRewards(report) {
  if (!report.rewards) return '';
  const { starsNow, starsBefore, rankBefore, rankNow } = report.rewards;
  const better = starsNow > starsBefore;
  const promoted = rankNow.level > rankBefore.level
    ? `<p class="promotion">${icon('medal', 18)} ${t('rank.promoted', { name: `<strong>${esc(rankName(rankNow.name))}</strong>` })}</p>`
    : rankNow.next
      ? `<p class="note">${t('rank.status', { name: esc(rankName(rankNow.name)), n: rankNow.next.starsNeeded, next: esc(rankName(rankNow.next.name)) })}</p>`
      : '';
  return `
    <section class="rewards" aria-label="${esc(t('stars.rewardsAria'))}">
      <div class="rewards-stars">${starRow(starsNow, { animate: true })}
        ${better && starsBefore > 0 ? `<span class="note">${t('stars.newRecord')}</span>` : ''}
        ${starsNow < 3 && starsNow > 0 ? `<span class="note">${t('stars.nextStar', { n: starsNow === 1 ? 70 : 90 })}</span>` : ''}
      </div>
      ${promoted}
    </section>`;
}

/**
 * Live projected score while designing, with the stars it would earn.
 * @param {object} score scoreMission result (no simulation)
 * @param {object|null} baseline score before a previewed choice
 */
export function projectionCard(score, baseline = null) {
  const stars = score.failed ? 0 : 1 + [70, 90].filter((threshold) => score.total >= threshold).length;
  const diff = baseline ? score.total - baseline.total : 0;
  const delta = baseline && diff !== 0 ? ` <span class="meter-delta">(${diff > 0 ? '+' : '−'}${Math.abs(diff)})</span>` : '';
  // Missing choices are not mistakes: say "finish" for those, "fix" for real problems.
  const missing = ['NO_ROCKET', 'NO_ORBIT', 'MISSING_REQUIRED_TYPE'];
  const errors = (score.issues ?? []).filter((issue) => issue.severity === 'error');
  const onlyMissing = errors.length > 0 && errors.every((issue) => missing.includes(issue.code));
  const body = score.failed
    ? `<span class="projection-note">${onlyMissing ? t('projection.finish') : t('projection.fix')}</span>`
    : `<span class="projection-score">${score.total}<small> / 100</small>${delta}</span>${starRow(stars, { label: t('projection.starsAria', { n: stars }) })}`;
  return `
    <div class="projection${score.failed ? ' is-blocked' : ''}" aria-label="${esc(t('projection.title'))}">
      <span class="projection-title">${t('projection.title')} <small>${t('projection.beforeSurprises')}</small></span>
      <span class="projection-body">${body}</span>
      <span class="projection-goals">${t('projection.goals')}</span>
    </div>`;
}

/** Small rank and mission stars chip for the top bar during a mission. */
export function topbarRewards(progress, scenarioId) {
  const rank = rankFor(totalStars(progress));
  const stars = progress.byScenario[scenarioId]?.stars ?? 0;
  return `<span class="topbar-rewards" title="${esc(t('rank.topbarTitle'))}">${icon('medal', 16)} ${esc(rankName(rank.name))} ${starRow(stars, { label: t('stars.bestHere', { n: stars }) })}</span>`;
}
