// "What to do next" line at the top of each design step (UX for beginners). Presentation only.

import { esc, fmt, targetName } from '../format.js';
import { t } from '../../i18n/index.js';

const TAB_KEYS = { instrument: 'tabs.instruments', power: 'tabs.power', comms: 'tabs.antenna' };
import { RISKY_RATIO } from './meter.js';


/**
 * @returns {{ text: string, tab?: string, tone: 'info'|'warn'|'good' }}
 */
export function nextStep(screen, { mission, evaluation, scenario }) {
  const { budget } = evaluation;
  const has = (type) => mission.parts.some((part) => part.type === type);

  if (screen === 'objective') {
    return { text: t('hint.objective'), tone: 'info' };
  }

  if (screen === 'spacecraft') {
    if (!has('instrument')) return { text: t('hint.addInstrument'), tab: 'instrument', tone: 'info' };
    if (!has('power')) return { text: t('hint.addPower'), tab: 'power', tone: 'info' };
    if (!has('comms')) return { text: t('hint.addComms'), tab: 'comms', tone: 'info' };
    if (budget.power.status === 'over') return { text: t('hint.powerOver', { n: fmt(-budget.power.marginW) }), tab: 'power', tone: 'warn' };
    if (budget.budget.status === 'over') return { text: t('hint.budgetOver', { n: fmt(-budget.budget.marginMUsd) }), tone: 'warn' };
    if (budget.data.status === 'over') return { text: t('hint.dataOver'), tab: 'comms', tone: 'warn' };
    if (!budget.science.ok) return { text: t('hint.lowScience', { value: fmt(budget.science.value), goal: fmt(budget.science.goal) }), tab: 'instrument', tone: 'warn' };
    return { text: t('hint.craftReady'), tone: 'good' };
  }

  if (screen === 'launch') {
    if (!mission.orbit) return { text: t('hint.pickOrbit'), tone: 'info' };
    if (!mission.rocket) return { text: t('hint.pickRocket', { kg: fmt(budget.mass.usedKg), target: targetName(mission.orbit.target) }), tone: 'info' };
    if (!evaluation.ok) return { text: t('hint.someRed'), tone: 'warn' };
    const risky = ['budget', 'mass', 'power', 'data', 'time'].some((key) => budget[key]?.status === 'ok' && budget[key].ratio > RISKY_RATIO);
    if (evaluation.issues.length || risky) return { text: t('hint.yellow'), tone: 'warn' };
    return { text: t('hint.allGo', { name: scenario.name }), tone: 'good' };
  }
  return null;
}

/** Caption next to the lamp: who is talking (CAPCOM) or the state, so the tone is never color alone. */
const HINT_CAPTIONS = { info: 'hint.capcom', warn: 'check.check', good: 'check.go' };

/**
 * The hint line: a message window on the console (DESIGN.md section 9), with a lamp, a caption and the
 * message, plus a button to open the right tab when it helps.
 */
export function hintLine(hint, currentTab) {
  if (!hint) return '';
  const button = hint.tab && hint.tab !== currentTab
    ? `<button type="button" class="hint-button" data-action="tab" data-value="${hint.tab}">${t('hint.open', { tab: t(TAB_KEYS[hint.tab]) })} →</button>`
    : '';
  return `<p class="next-hint hint-${hint.tone}" role="status">
    <span class="hint-lamp" aria-hidden="true"></span>
    <span class="hint-caption">${t(HINT_CAPTIONS[hint.tone] ?? 'hint.capcom')}</span>
    <span class="hint-text">${esc(hint.text)}</span>${button}</p>`;
}
