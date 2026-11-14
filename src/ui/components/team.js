// Team play views: who is playing, whose turn it is, the GO / NO-GO poll and the team debrief.
// Presentation only: the roles and checks come from src/engine/team.js.

import { esc } from '../format.js';
import { icon } from './icons.js';
import { t } from '../../i18n/index.js';
import { MAX_PLAYERS, ROLE_ORDER, roleForStep, playerFor, isTeamPlay } from '../../engine/team.js';

/** The player's name, or "Player 2" when none was typed. */
export const playerName = (team, index) => team?.players[index]?.name || t('team.playerN', { n: index + 1 });
const roleName = (role) => t(`role.${role}`);
const resourceName = (key) => (key === 'science' ? t('stat.science') : t(`resource.${key}`));
const CALL_ICON = { go: 'check', risky: 'warn', 'no-go': 'cross' };

/**
 * Room for the players' own devices (team play on several devices): a button to open it, then the code and the link.
 * @param {{ status: 'opening'|'open'|'error', code?: string, link?: string, errorKey?: string }|null} room
 */
export function roomPanel(room) {
  if (!room) {
    return `<button type="button" class="btn room-open" data-action="room-open">${icon('devices', 16)} ${t('room.open')}</button>`;
  }
  if (room.status === 'opening') return `<p class="room-status" role="status">${icon('devices', 16)} ${t('room.opening')}</p>`;
  if (room.status === 'error') {
    return `<p class="room-status room-error" role="status">${icon('warn', 16)} ${t(room.errorKey ?? 'room.errorNetwork')}
      <button type="button" class="btn" data-action="room-open">${t('room.retry')}</button></p>`;
  }
  return `
    <div class="room-open-info" role="status">
      ${icon('devices', 16)}
      <span>${t('room.code')} <b class="room-code">${esc(room.code)}</b></span>
      <span class="room-link">${esc(t('room.howToJoin', { link: room.link }))}</span>
      <button type="button" class="btn" data-action="room-close">${t('room.close')}</button>
    </div>`;
}

/** Pick 1 to 4 players, type names, and see who leads what. With a room open, shows whose device is connected. */
export function teamPicker(team, room = null) {
  const size = team?.players.length ?? 1;
  const sizes = Array.from({ length: MAX_PLAYERS }, (_, index) => index + 1)
    .map((n) => `
      <button type="button" class="team-size${n === size ? ' is-selected' : ''}" data-action="team-size" data-value="${n}"
        aria-pressed="${n === size}" aria-label="${t('team.sizeAria', { n })}">
        ${icon('team', 16)}<b>${n}</b><small>${n === 1 ? t('team.solo') : t('team.group')}</small>
      </button>`)
    .join('');
  const players = (team?.players ?? [{ name: '', roles: ROLE_ORDER }])
    .map((player, index) => `
      <li class="team-player">
        <label class="team-name">
          <span class="team-badge">${index + 1}</span>
          <input type="text" maxlength="20" autocomplete="off" data-input="player-name" data-index="${index}"
            value="${esc(player.name)}" placeholder="${t('team.playerN', { n: index + 1 })}" aria-label="${t('team.nameAria', { n: index + 1 })}">
        </label>
        <span class="team-roles">${player.roles.map((role) => `<span class="role-chip role-${role}" title="${esc(t(`role.${role}Task`))}">${esc(roleName(role))}</span>`).join('')}${room?.connected?.has(index) ? `<span class="role-chip device-on">${icon('devices', 12)} ${t('room.connected')}</span>` : ''}</span>
      </li>`)
    .join('');
  return `
    <section class="team-picker" aria-labelledby="team-title">
      <h3 id="team-title">${icon('team', 16)} ${t('team.title')}</h3>
      <div class="team-sizes" role="group" aria-label="${t('team.title')}">${sizes}</div>
      <p class="hint">${t(size === 1 ? 'team.hintSolo' : 'team.hint')}</p>
      ${size > 1 ? `<ol class="team-players">${players}</ol>` : ''}
      ${size > 1 ? `<div class="room-panel">${roomPanel(room)}</div>` : ''}
    </section>`;
}

/** "Ana's turn · Science Lead: pick the instruments", shown at the top of each design step. */
export function turnChip(team, screen, tab) {
  if (!isTeamPlay(team)) return '';
  const role = roleForStep(screen, tab);
  if (!role) return '';
  const index = playerFor(team, role);
  return `
    <p class="turn-chip role-${role}" role="status">
      <span class="team-badge">${index + 1}</span>
      <span><b>${esc(t('turn.label', { name: playerName(team, index) }))}</b> · ${esc(roleName(role))}: ${esc(t(`role.${role}Task`))}</span>
    </p>`;
}

/**
 * Mission control GO / NO-GO poll before launch. Each player reads their consoles and votes.
 * @param {object} team
 * @param {Array<{ player: number, role: string, call: string, resources: Array<{ key: string, call: string }> }>} consoles
 * @param {Array<'go'|'no-go'|undefined>} votes one per player
 */
export function pollOverlay(team, consoles, votes, connected = new Set()) {
  const rows = team.players
    .map((player, index) => {
      const mine = consoles.filter((entry) => entry.player === index);
      const vote = votes[index];
      const checks = mine
        .map((entry) => `
          <div class="console call-${entry.call}">
            <span class="console-role">${esc(roleName(entry.role))}</span>
            <span class="console-resources">${entry.resources.map((item) => `<span class="call-${item.call}">${icon(CALL_ICON[item.call], 14)} ${esc(resourceName(item.key))}</span>`).join('')}</span>
            <span class="console-advice">${esc(t(`poll.call.${entry.call}`))}</span>
          </div>`)
        .join('');
      return `
        <li class="poll-row${vote ? ` voted-${vote}` : ''}">
          <span class="poll-who"><span class="team-badge">${index + 1}</span><b>${esc(playerName(team, index))}</b>${connected.has(index) ? ` <span class="device-on" title="${esc(t('room.votesOnDevice'))}">${icon('devices', 14)}</span>` : ''}</span>
          <div class="poll-consoles">${checks}</div>
          <span class="poll-vote" role="group" aria-label="${esc(t('poll.voteAria', { name: playerName(team, index) }))}">
            <button type="button" class="btn btn-go${vote === 'go' ? ' is-selected' : ''}" data-action="poll-vote" data-value="${index}:go" aria-pressed="${vote === 'go'}">${t('check.go')}</button>
            <button type="button" class="btn btn-nogo${vote === 'no-go' ? ' is-selected' : ''}" data-action="poll-vote" data-value="${index}:no-go" aria-pressed="${vote === 'no-go'}">${t('check.nogo')}</button>
          </span>
        </li>`;
    })
    .join('');
  const count = votes.filter(Boolean).length;
  return `
    <div class="overlay">
      <div class="modal poll" role="dialog" aria-modal="true" aria-labelledby="poll-title">
        <h2 id="poll-title">${icon('team', 20)} ${t('poll.title')}</h2>
        <p>${t('poll.lead')}</p>
        <ol class="poll-rows">${rows}</ol>
        <p class="hint" role="status">${t('poll.waiting', { n: count, total: team.players.length })}</p>
        <div class="modal-actions">
          <button type="button" class="btn" data-action="poll-cancel">${icon('back', 16)} ${t('poll.cancel')}</button>
        </div>
      </div>
    </div>`;
}

/**
 * Team debrief for the report: each console at launch, and what the surprises did to it.
 * @param {Array<{ player: number, role: string, call: string, hits: string[], saves: string[] }>} debrief
 */
export function teamDebriefSection(team, debrief, data) {
  if (!isTeamPlay(team)) return '';
  const eventName = (id) => data.events.find((event) => event.id === id)?.name ?? id;
  const rows = debrief
    .map((entry) => {
      const notes = [
        entry.hits.length ? `<span class="call-no-go">${icon('storm', 14)} ${esc(t('debrief.hit', { events: entry.hits.map(eventName).join(', ') }))}</span>` : '',
        entry.saves.length ? `<span class="call-go">${icon('shield', 14)} ${esc(t('debrief.saved', { events: entry.saves.map(eventName).join(', ') }))}</span>` : '',
        !entry.hits.length && !entry.saves.length ? `<span>${esc(t('debrief.calm'))}</span>` : '',
      ].join('');
      return `
        <li class="debrief-row call-${entry.call}">
          <span class="poll-who"><span class="team-badge">${entry.player + 1}</span><b>${esc(playerName(team, entry.player))}</b> · ${esc(roleName(entry.role))}</span>
          <span class="debrief-call">${icon(CALL_ICON[entry.call], 14)} ${esc(t('debrief.atLaunch', { call: t(`poll.short.${entry.call}`) }))}</span>
          <span class="debrief-notes">${notes}</span>
        </li>`;
    })
    .join('');
  const thin = debrief.filter((entry) => entry.call !== 'go').length;
  const summary = thin === 0 ? t('debrief.allGo') : t('debrief.someThin', { n: thin });
  return `
    <section class="team-debrief">
      <h3>${icon('team', 18)} ${t('report.team')}</h3>
      <p>${esc(summary)}</p>
      <ul class="debrief-rows">${rows}</ul>
    </section>`;
}
