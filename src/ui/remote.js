// Player console for multi-device team play (phone, tablet or computer): one player's console, connected to the room on the
// main device (src/net). It never runs the game itself: it shows what the room sends (the player's turn and, below it,
// the game on this player's own screen) and sends back the player's seat, their GO / NO-GO vote and, on their turn,
// their choices. Looking around (tabs, numbers, meter details) stays on this device and never needs a turn.

import { esc } from './format.js';
import { icon } from './components/icons.js';
import { langToggle } from './components/overlays.js';
import { playerName } from './components/team.js';
import { joinRoom, errorKey } from '../net/room.js';
import { mirrorScreen, meterModal, canOpenReport } from './mirror.js';
import { syncView3d } from './view3dHost.js';
import { normalizeCode, isValidCode, CODE_LENGTH, REMOTE_ACTIONS } from '../net/protocol.js';
import { t, setLocale, nextLocale, getLocale } from '../i18n/index.js';

const CALL_ICON = { go: 'check', risky: 'warn', 'no-go': 'cross' };
const roleName = (role) => t(`role.${role}`);
const resourceName = (key) => (key === 'science' ? t('stat.science') : t(`resource.${key}`));

/** On the spacecraft step, the tab each role works on (see roleForStep in src/engine/team.js). */
const ROLE_TAB = { scientist: 'instrument', engineer: 'power', comms: 'comms' };
const NOTICE_MS = 3000;

/** What the game is doing, in a few words. */
function stageText(screen) {
  if (['objective', 'spacecraft', 'launch'].includes(screen)) return t('remote.stageDesign');
  if (screen === 'simulation') return t('remote.stageFlight');
  if (screen === 'report') return t('remote.stageReport');
  return t('remote.stageMenu');
}

/** The whole console screen for the current state. */
export function remoteScreen(view) {
  const { phase, code, error, snapshot, me, myVote } = view;
  const team = snapshot ? { players: snapshot.players } : null;
  let body = '';

  if (phase === 'join' || phase === 'error') {
    body = `
      <h2>${icon('devices', 20)} ${t('remote.joinTitle')}</h2>
      <p class="hint">${t('remote.joinHint')}</p>
      ${phase === 'error' ? `<p class="remote-error" role="alert">${icon('warn', 16)} ${esc(t(error))}</p>` : ''}
      <label class="remote-code">
        <span>${t('room.code')}</span>
        <input type="text" inputmode="text" autocomplete="off" autocapitalize="characters" maxlength="${CODE_LENGTH}"
          data-input="room-code" value="${esc(code)}" placeholder="K7Q2M" aria-label="${t('room.code')}">
      </label>
      <button type="button" class="btn btn-primary btn-big" data-action="join">${t('remote.join')} ${icon('next', 18)}</button>`;
  } else if (phase === 'connecting') {
    body = `<p class="remote-status" role="status">${icon('devices', 18)} ${t('remote.connecting', { code })}</p>`;
  } else if (phase === 'closed') {
    body = `
      <p class="remote-status" role="status">${icon('cross', 18)} ${t('remote.closed')}</p>
      <button type="button" class="btn btn-primary" data-action="rejoin">${t('room.retry')}</button>`;
  } else if (phase === 'pick') {
    const seats = snapshot.players
      .map((player, index) => {
        const taken = player.connected && index !== me;
        return `
          <button type="button" class="card remote-seat" data-action="pick-seat" data-value="${index}" ${taken ? 'disabled aria-disabled="true"' : ''}>
            <span class="team-badge">${index + 1}</span>
            <span class="card-main">
              <span class="card-title">${esc(playerName(team, index))}</span>
              <span class="team-roles">${player.roles.map((role) => `<span class="role-chip role-${role}">${esc(roleName(role))}</span>`).join('')}</span>
              ${taken ? `<span class="hint">${t('remote.taken')}</span>` : ''}
            </span>
          </button>`;
      })
      .join('');
    body = `
      <h2>${t('remote.pickTitle')}</h2>
      <p class="hint">${t('remote.pickHint')}</p>
      <div class="card-list">${seats || `<p class="hint">${t('remote.noTeam')}</p>`}</div>`;
  } else if (phase === 'play') {
    const mine = snapshot.players[me];
    const turn = snapshot.turn;
    const myTurn = turn && turn.player === me;
    const consoles = snapshot.poll?.consoles.filter((entry) => entry.player === me) ?? [];
    const votes = snapshot.poll?.votes ?? [];
    const voted = myVote ?? votes[me];

    const turnBlock = !turn
      ? ''
      : myTurn
        ? `<div class="remote-turn is-mine role-${turn.role}" role="status"><b>${t('remote.yourTurn')}</b><span>${esc(roleName(turn.role))}: ${esc(t(`role.${turn.role}Task`))}</span></div>`
        : `<div class="remote-turn role-${turn.role}" role="status">${esc(t('turn.label', { name: playerName(team, turn.player) }))} · ${esc(roleName(turn.role))}</div>`;

    // Screens without a role turn (command center, menus, flight, report): the mission director leads
    const actor = snapshot.actor ?? null;
    const leadBlock = turn || actor === null
      ? ''
      : actor === me
        ? `<div class="remote-turn is-mine role-director" role="status"><b>${t('remote.yourTurn')}</b><span>${esc(t('remote.youLead'))}</span></div>`
        : `<div class="remote-turn role-director" role="status">${esc(t('turn.label', { name: playerName(team, actor) }))}</div>`;

    const pollBlock = snapshot.poll
      ? `
        <section class="remote-poll" aria-labelledby="remote-poll-title">
          <div class="remote-poll-info">
            <h3 id="remote-poll-title">${t('poll.title')}</h3>
            ${consoles.map((entry) => `
              <p class="remote-poll-console call-${entry.call}">
                <b>${esc(roleName(entry.role))}</b>
                ${entry.resources.map((item) => `<span class="call-${item.call}">${icon(CALL_ICON[item.call], 14)} ${esc(resourceName(item.key))}</span>`).join('')}
                <span class="console-advice">${esc(t(`poll.call.${entry.call}`))}</span>
              </p>`).join('')}
          </div>
          <div class="remote-poll-act">
            <div class="remote-vote">
              <button type="button" class="btn btn-go${voted === 'go' ? ' is-selected' : ''}" data-action="vote" data-value="go" aria-pressed="${voted === 'go'}">${t('check.go')}</button>
              <button type="button" class="btn btn-nogo${voted === 'no-go' ? ' is-selected' : ''}" data-action="vote" data-value="no-go" aria-pressed="${voted === 'no-go'}">${t('check.nogo')}</button>
            </div>
            <p class="hint" role="status">${t('poll.waiting', { n: votes.filter(Boolean).length, total: snapshot.players.length })}</p>
          </div>
        </section>`
      : '';

    const resultBlock = !snapshot.poll && snapshot.pollResult
      ? `<p class="remote-result call-${snapshot.pollResult === 'go' ? 'go' : 'no-go'}" role="status">${t(snapshot.pollResult === 'go' ? 'remote.pollGo' : 'remote.pollHeld')}</p>`
      : '';
    const outcomeBlock = snapshot.outcome
      ? `<p class="remote-result call-${snapshot.outcome === 'success' ? 'go' : 'no-go'}" role="status">${t(snapshot.outcome === 'success' ? 'flightStatus.success' : 'flightStatus.failure')}</p>`
      : '';

    if (snapshot.mirror) return liveScreen({ code, snapshot, me, team, mine, turn, pollBlock, drawn: view.drawn });

    body = `
      <div class="remote-me">
        <span class="team-badge">${me + 1}</span>
        <span><b>${esc(t('remote.youAre', { name: playerName(team, me) }))}</b>
          <span class="team-roles">${(mine?.roles ?? []).map((role) => `<span class="role-chip role-${role}">${esc(roleName(role))}</span>`).join('')}</span></span>
        <button type="button" class="btn" data-action="change-seat">${t('remote.changeSeat')}</button>
      </div>
      <p class="remote-stage">${icon('rocket', 16)} ${stageText(snapshot.screen)}</p>
      ${turnBlock}
      ${leadBlock}
      ${pollBlock}
      ${resultBlock}
      ${outcomeBlock}
      ${!turn && !leadBlock && !snapshot.poll && !snapshot.pollResult && !snapshot.outcome ? `<p class="hint">${t('remote.wait')}</p>` : ''}`;
  }

  const panel = `
    <main class="remote">
      <header class="remote-head">
        <span class="remote-brand">TUPI <b>ORBIT</b></span>
        <span class="remote-room">${code && phase !== 'join' ? `${t('room.code')} <b>${esc(code)}</b>` : ''}</span>
        ${langToggle()}
      </header>
      ${body}
    </main>`;
  return panel;
}

/**
 * While playing: one short bar on top (who I am, whose turn it is, room, language) and the game below it,
 * so the game keeps almost the whole screen. The GO / NO-GO vote opens under the bar only while the poll runs.
 */
function liveScreen({ code, snapshot, me, team, mine, turn, pollBlock, drawn }) {
  const actor = snapshot.actor ?? null;
  const mineNow = actor === me;
  let status;
  if (mineNow) {
    const task = turn ? `${roleName(turn.role)}: ${t(`role.${turn.role}Task`)}` : t('remote.youLead');
    status = `<b>${t('remote.yourTurn')}</b> <span>${esc(task)}</span>`;
  } else if (actor !== null) {
    status = `<span>${esc(t('remote.mirrorWatch', { name: playerName(team, actor) }))}</span>`;
  } else {
    status = `<span>${esc(snapshot.poll ? t('poll.title') : t('remote.mirror'))}</span>`;
  }
  // The last poll and the flight result, as small lamps in the bar
  const lamps = [
    !snapshot.poll && snapshot.pollResult
      ? `<span class="tag call-${snapshot.pollResult === 'go' ? 'go' : 'no-go'}" title="${esc(t(snapshot.pollResult === 'go' ? 'remote.pollGo' : 'remote.pollHeld'))}">${icon(snapshot.pollResult === 'go' ? 'check' : 'warn', 12)} ${snapshot.pollResult === 'go' ? t('check.go') : t('check.nogo')}</span>`
      : '',
    snapshot.outcome
      ? `<span class="tag call-${snapshot.outcome === 'success' ? 'go' : 'no-go'}">${esc(t(snapshot.outcome === 'success' ? 'flightStatus.success' : 'flightStatus.failure'))}</span>`
      : '',
  ].join('');

  return `
    <header class="remote-bar${mineNow ? ' is-my-turn' : ''}">
      <span class="remote-brand">TUPI <b>ORBIT</b></span>
      <button type="button" class="remote-who" data-action="change-seat" title="${t('remote.changeSeat')}">
        <span class="team-badge">${me + 1}</span>
        <span class="remote-who-text"><b>${esc(playerName(team, me))}</b>
          <span class="team-roles">${(mine?.roles ?? []).map((role) => `<span class="role-chip role-${role}">${esc(roleName(role))}</span>`).join('')}</span></span>
      </button>
      <p class="remote-bar-status${mineNow && turn ? ` role-${turn.role}` : ''}" role="status">${status}${lamps}</p>
      <span class="remote-room">${t('room.code')} <b>${esc(code)}</b></span>
      ${langToggle()}
    </header>
    ${pollBlock}
    <section class="remote-mirror" aria-label="${esc(t('remote.mirror'))}">
      <div class="remote-mirror-screen" data-mirror>${drawn?.html ?? ''}</div>
    </section>`;
}

/**
 * Mount the player console.
 * @param {HTMLElement} root
 * @param {{ code?: string }} options code from the link (?sala=K7Q2M)
 */
export function mountRemote(root, { code = '' } = {}) {
  const view = {
    phase: 'join', code: normalizeCode(code), error: null, snapshot: null, me: null, myVote: null,
    drawn: null, // the game screen, drawn for this player (src/ui/mirror.js)
    notice: null, // a short message only this player sees ("not your turn")
  };
  // What this player looks at, independent from the main device: tab, operations tab, numbers, details window.
  // tab null = the tab of this player's role (or, on their turn, the tab the turn is about).
  const own = { tab: null, opsTab: 'jobs', showNumbers: false, modal: null, dismissed: null, report: false };
  let connection = null;
  let noticeTimer = null;
  let lastTurnMine = false;
  let lastPollOpen = false;

  const buzz = () => globalThis.navigator?.vibrate?.(180);

  const myTurn = () => view.me !== null && view.snapshot?.actor === view.me;

  /** This player's own view of the game screen, on top of the game state from the main device. */
  function ownView() {
    const shared = view.snapshot.mirror.ui ?? {};
    const roles = view.snapshot.players[view.me]?.roles ?? [];
    const roleTab = roles.map((role) => ROLE_TAB[role]).find(Boolean);
    const sharedModal = shared.modal && JSON.stringify(shared.modal) !== own.dismissed ? shared.modal : null;
    return {
      // On their turn the player works on the tab of the turn; otherwise they look wherever they like
      tab: myTurn() ? shared.tab : own.tab ?? roleTab ?? shared.tab,
      opsTab: own.opsTab,
      showNumbers: own.showNumbers,
      modal: own.modal ?? sharedModal,
      toast: view.notice ?? shared.toast,
      report: own.report,
    };
  }

  function render() {
    const playing = view.phase === 'play' && Boolean(view.snapshot?.mirror);
    view.drawn = playing ? mirrorScreen(view.snapshot.mirror, ownView()) : null;
    root.innerHTML = remoteScreen(view);
    root.classList.toggle('is-remote-live', playing);
    // The game screen gets the same 3D view (globe, spacecraft, flight) when this device can draw it
    const screen = root.querySelector('[data-mirror]');
    if (screen) syncView3d(screen, view.drawn.scene ?? { parts: [] }, { paused: !view.drawn.scene, onReady: render });
    else syncView3d(root, { parts: [] }, { paused: true, onReady: render });
  }

  function notice(title, text) {
    view.notice = { title, text, tone: 'warn' };
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => {
      view.notice = null;
      render();
    }, NOTICE_MS);
    render();
  }

  const send = (action, value) => connection?.send(value === undefined ? { type: 'act', action } : { type: 'act', action, value });

  /** What this player looks at: never needs a turn. On their turn, changing tab also moves the turn on (as on the main device). */
  const localActions = {
    tab: (value) => {
      own.tab = value;
      if (myTurn()) send('tab', value);
      render();
    },
    'ops-tab': (value) => {
      own.opsTab = value;
      render();
    },
    'toggle-numbers': () => {
      own.showNumbers = !own.showNumbers;
      render();
    },
    meter: (value) => {
      own.modal = meterModal(view.snapshot.mirror, value);
      render();
    },
    'close-modal': () => {
      if (own.modal) own.modal = null;
      else {
        // A message from the main device: hide it here; on their turn, close it for everyone
        own.dismissed = JSON.stringify(view.snapshot.mirror.ui?.modal ?? null);
        if (myTurn()) send('close-modal');
      }
      render();
    },
  };

  /** A tap on the game screen. */
  function tapGame(action, value) {
    // Everyone can read the report once the flight is over; on their turn it also opens on the main device
    if (action === 'see-report' && !myTurn() && canOpenReport(view.snapshot.mirror)) {
      own.report = true;
      render();
      globalThis.scrollTo?.(0, 0);
      return;
    }
    if (localActions[action]) {
      localActions[action](value);
      return;
    }
    if (!REMOTE_ACTIONS.has(action)) {
      notice(t('remote.waitTitle'), t('remote.notHere'));
      return;
    }
    if (!myTurn()) {
      const actor = view.snapshot.actor;
      const team = { players: view.snapshot.players };
      notice(t('remote.waitTitle'), actor === null || actor === undefined ? t('remote.nobodyTurn') : t('remote.notYourTurn', { name: playerName(team, actor) }));
      return;
    }
    send(action, value);
  }

  function onMessage(message) {
    if (message?.type === 'claim-denied') {
      view.me = null;
      view.phase = 'pick';
    } else if (message?.type === 'snapshot') {
      // A new launch or another screen: the report opened here belonged to the flight that just ended
      const before = view.snapshot?.mirror?.state;
      const after = message.mirror?.state;
      if (!after || after.screen !== 'simulation' || before?.runCount !== after.runCount || before?.reroll !== after.reroll) own.report = false;
      view.snapshot = message;
      if (view.phase === 'connecting') view.phase = 'pick';
      if (view.me !== null && view.me >= message.players.length) {
        view.me = null; // the team got smaller: pick again
        view.phase = 'pick';
      }
      if (!message.poll) view.myVote = null;
      // Buzz when it becomes this player's turn, or when the poll opens
      const mine = view.me !== null && message.actor === view.me;
      if (mine && !lastTurnMine) own.tab = null; // follow the tab of the turn again
      if ((mine && !lastTurnMine) || (message.poll && !lastPollOpen)) buzz();
      lastTurnMine = mine;
      lastPollOpen = Boolean(message.poll);
    }
    render();
  }

  async function join() {
    if (!isValidCode(view.code)) {
      view.phase = 'error';
      view.error = 'room.errorCode';
      render();
      return;
    }
    view.phase = 'connecting';
    render();
    try {
      connection = await joinRoom(view.code, {
        onMessage,
        onClose: () => {
          view.phase = 'closed';
          render();
        },
      });
      // Remember the room in the address, so a reload joins again
      history.replaceState(null, '', `${location.pathname}?sala=${view.code}`);
    } catch (error) {
      view.phase = 'error';
      view.error = errorKey(error);
      render();
    }
  }

  const actions = {
    join: () => join(),
    rejoin: () => join(),
    'pick-seat': (value) => {
      view.me = Number(value);
      view.phase = 'play';
      connection?.send({ type: 'claim', player: view.me });
      render();
    },
    'change-seat': () => {
      view.phase = 'pick';
      render();
    },
    vote: (value) => {
      view.myVote = value;
      connection?.send({ type: 'vote', player: view.me, vote: value });
      render();
    },
    language: () => {
      setLocale(nextLocale());
      document.documentElement.lang = getLocale();
      render();
    },
  };

  root.addEventListener('click', (event) => {
    const element = event.target.closest('[data-action]');
    if (!element || element.disabled) return;
    const { action, value } = element.dataset;
    // A tap on the game screen: looking around stays here, choices go to the main device on this player's turn
    if (element.closest('[data-mirror]') && action !== 'language') {
      if (element.classList.contains('overlay') && event.target.closest('[data-stop]')) return; // inside a message box
      tapGame(action, value);
      return;
    }
    actions[action]?.(value);
  });
  root.addEventListener('input', (event) => {
    const input = event.target.closest('[data-input="room-code"]');
    if (!input) return;
    const clean = normalizeCode(input.value);
    if (clean !== input.value) input.value = clean;
    view.code = clean;
  });
  root.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target.closest('[data-input="room-code"]')) join();
  });

  render();
  if (isValidCode(view.code)) join(); // opened from the room's link: join straight away
}
