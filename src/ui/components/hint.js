// "What to do next" line at the top of each design step (UX for beginners). Presentation only.

import { esc, fmt, TARGET_NAMES } from '../format.js';
import { RISKY_RATIO } from './meter.js';

const TAB_NAMES = { instrument: 'Instruments', power: 'Power', comms: 'Comms' };

/**
 * @returns {{ text: string, tab?: string, tone: 'info'|'warn'|'good' }}
 */
export function nextStep(screen, { mission, evaluation, scenario }) {
  const { budget } = evaluation;
  const has = (type) => mission.parts.some((part) => part.type === type);

  if (screen === 'objective') {
    return { text: 'Read the science question and the goals, then build your spacecraft.', tone: 'info' };
  }

  if (screen === 'spacecraft') {
    if (!has('instrument')) return { text: 'Next: add at least one instrument. Instruments do the science.', tab: 'instrument', tone: 'info' };
    if (!has('power')) return { text: 'Next: pick a power source. Without power, nothing works.', tab: 'power', tone: 'info' };
    if (!has('comms')) return { text: 'Next: pick an antenna, so your data can reach Earth.', tab: 'comms', tone: 'info' };
    if (budget.power.status === 'over') return { text: `Power is over the limit by ${fmt(-budget.power.marginW)} W: pick a bigger solar panel or remove an instrument.`, tab: 'power', tone: 'warn' };
    if (budget.budget.status === 'over') return { text: `Over budget by ${fmt(-budget.budget.marginMUsd)} million USD: swap an expensive part for a cheaper one.`, tone: 'warn' };
    if (budget.data.status === 'over') return { text: 'Your antenna cannot send all the data home: pick a stronger antenna or fewer data-hungry instruments.', tab: 'comms', tone: 'warn' };
    if (!budget.science.ok) return { text: `Science is ${fmt(budget.science.value)} of ${fmt(budget.science.goal)} points: add another instrument.`, tab: 'instrument', tone: 'warn' };
    return { text: 'Looks good! Next: choose an orbit and a rocket.', tone: 'good' };
  }

  if (screen === 'launch') {
    if (!mission.orbit) return { text: 'Next: pick an orbit for this mission.', tone: 'info' };
    if (!mission.rocket) return { text: `Next: pick a rocket that can carry your ${fmt(budget.mass.usedKg)} kg spacecraft to ${TARGET_NAMES[mission.orbit.target]}.`, tone: 'info' };
    if (!evaluation.ok) return { text: 'Some lines are red. Fix them, or launch anyway to see what happens.', tone: 'warn' };
    const risky = ['budget', 'mass', 'power', 'data', 'time'].some((key) => budget[key]?.status === 'ok' && budget[key].ratio > RISKY_RATIO);
    if (evaluation.issues.length || risky) return { text: 'Ready to launch. Yellow lines mean small margins: surprises will hurt more.', tone: 'warn' };
    return { text: `All systems GO for ${scenario.name}. Press Launch!`, tone: 'good' };
  }
  return null;
}

/** The hint line, with a button to open the right tab when it helps. */
export function hintLine(hint, currentTab) {
  if (!hint) return '';
  const button = hint.tab && hint.tab !== currentTab
    ? ` <button type="button" class="hint-button" data-action="tab" data-value="${hint.tab}">Open ${TAB_NAMES[hint.tab]} →</button>`
    : '';
  return `<p class="next-hint hint-${hint.tone}" role="status">👉 ${esc(hint.text)}${button}</p>`;
}
