// Gamification views: stars, rank, badges and the celebration. Presentation only.

import { esc } from '../format.js';
import { ACHIEVEMENTS, achievementById, rankFor, totalStars } from '../../engine/progress.js';

const MAX_STARS = 3;

/** Row of 3 stars. `animate` reveals them one by one (report screen). */
export function starRow(stars, { animate = false, label = '' } = {}) {
  const items = Array.from({ length: MAX_STARS }, (_, index) => {
    const on = index < stars;
    return `<span class="star${on ? ' is-on' : ''}${animate && on ? ' is-pop' : ''}" style="--delay:${400 + index * 250}ms">${on ? '★' : '☆'}</span>`;
  }).join('');
  return `<span class="stars" role="img" aria-label="${esc(label || `${stars} of ${MAX_STARS} stars`)}">${items}</span>`;
}

/** Rank card for the menu. */
export function rankCard(progress) {
  const stars = totalStars(progress);
  const rank = rankFor(stars);
  const next = rank.next
    ? `Next: <strong>${esc(rank.next.name)}</strong> in ${rank.next.starsNeeded} more ★`
    : 'Top rank reached. Amazing work!';
  // Progress inside the current rank step: from this rank's stars to the next rank's stars.
  const stepSize = rank.next ? stars + rank.next.starsNeeded - rank.minStars : 1;
  const width = rank.next ? Math.round(((stars - rank.minStars) / stepSize) * 100) : 100;
  return `
    <section class="rank-card" aria-label="Your rank" data-progress="${width}">
      <span class="rank-icon" aria-hidden="true">🎖️</span>
      <span class="rank-body">
        <span class="rank-name">${esc(rank.name)}</span>
        <span class="rank-bar"><span style="width:${width}%"></span></span>
        <span class="rank-next">★ ${stars} / 9 · ${next}</span>
      </span>
    </section>`;
}

/** Badge gallery for the menu: unlocked badges in color, locked ones show how to earn them. */
export function badgeGallery(progress) {
  const unlocked = ACHIEVEMENTS.filter((badge) => progress.achievements[badge.id]).length;
  const items = ACHIEVEMENTS.map((badge) => {
    const on = Boolean(progress.achievements[badge.id]);
    return `
      <li class="badge-item${on ? ' is-on' : ''}">
        <span class="badge-icon" aria-hidden="true">${on ? badge.icon : '🔒'}</span>
        <span><strong>${esc(badge.name)}</strong><br><small>${esc(badge.description)}</small></span>
      </li>`;
  }).join('');
  return `
    <section class="badges-section" aria-labelledby="badges-title">
      <h2 id="badges-title">Badges <small>${unlocked} / ${ACHIEVEMENTS.length}</small></h2>
      <ul class="badge-grid">${items}</ul>
    </section>`;
}

/** Rewards block for the report: stars earned, new badges and promotions. */
export function reportRewards(report) {
  if (!report.rewards) return '';
  const { starsNow, starsBefore, unlocked, rankBefore, rankNow } = report.rewards;
  const better = starsNow > starsBefore;
  const badges = unlocked
    .map(achievementById)
    .filter(Boolean)
    .map((badge) => `<li class="badge-new"><span class="badge-icon" aria-hidden="true">${badge.icon}</span><span><strong>Badge unlocked: ${esc(badge.name)}</strong><br><small>${esc(badge.description)}</small></span></li>`)
    .join('');
  const promoted = rankNow.level > rankBefore.level
    ? `<p class="promotion">🎖️ Promoted to <strong>${esc(rankNow.name)}</strong>!</p>`
    : rankNow.next
      ? `<p class="note">Rank: ${esc(rankNow.name)}. ${rankNow.next.starsNeeded} more ★ to become ${esc(rankNow.next.name)}.</p>`
      : '';
  return `
    <section class="rewards" aria-label="Rewards">
      <div class="rewards-stars">${starRow(starsNow, { animate: true })}
        ${better && starsBefore > 0 ? '<span class="note">New record for this mission!</span>' : ''}
        ${starsNow < 3 && starsNow > 0 ? `<span class="note">${starsNow === 1 ? '70' : '90'}+ points for the next star.</span>` : ''}
      </div>
      ${badges ? `<ul class="badge-list">${badges}</ul>` : ''}
      ${promoted}
    </section>`;
}

/** Falling confetti for a successful mission. Hidden when the system asks for reduced motion. */
export function confetti() {
  const colors = ['#56ccf2', '#27ae60', '#ffd166', '#eb5757', '#2d9cdb', '#f2c94c'];
  const pieces = Array.from({ length: 48 }, (_, index) => {
    const left = (index * 37) % 100;
    const delay = (index % 12) * 70;
    const duration = 1800 + ((index * 53) % 900);
    return `<i style="left:${left}%;--delay:${delay}ms;--duration:${duration}ms;--color:${colors[index % colors.length]};--spin:${(index % 2 ? 1 : -1) * (180 + index * 7)}deg"></i>`;
  }).join('');
  return `<div class="confetti" aria-hidden="true">${pieces}</div>`;
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
    ? `<span class="projection-note">${onlyMissing ? 'Finish your design to see your score.' : 'Fix the red lines to see your score: this design would fail.'}</span>`
    : `<span class="projection-score">${score.total}<small> / 100</small>${delta}</span>${starRow(stars, { label: `${stars} stars projected` })}`;
  return `
    <div class="projection${score.failed ? ' is-blocked' : ''}" aria-label="Projected score">
      <span class="projection-title">Projected score <small>(before surprises)</small></span>
      <span class="projection-body">${body}</span>
      <span class="projection-goals">★ complete · ★★ 70+ · ★★★ 90+</span>
    </div>`;
}

/** Small rank and mission stars chip for the top bar during a mission. */
export function topbarRewards(progress, scenarioId) {
  const rank = rankFor(totalStars(progress));
  const stars = progress.byScenario[scenarioId]?.stars ?? 0;
  return `<span class="topbar-rewards" title="Your rank and the best stars for this mission">🎖️ ${esc(rank.name)} ${starRow(stars, { label: `Best: ${stars} of 3 stars in this mission` })}</span>`;
}
