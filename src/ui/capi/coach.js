// Commander Capi's guided lessons: learning by doing, one decision at a time.
// Pure functions (no DOM, no audio, no state changes): the UI keeps the lesson state and asks this file
// what to show. Every number comes from the real game evaluation (src/engine).
//
// The cycle of a lesson:
//   1. problem  Capi states the problem in plain words (or asks the question right away)
//   2. predict  the player chooses a card, or answers Capi's question
//   3. change   the gauges move (the game does it)
//   4. explain  Capi links the decision to its consequences, with the real values
//   5. then     the player continues, asks for a hint or reviews the explanation later
//
// Lesson kinds:
//   'react'  problem -> the player makes a choice -> Capi asks what it changes -> explain
//   'choose' problem -> the player's choice is the prediction -> explain
//   'ask'    Capi asks first (a prediction before choosing) -> explain
//
// Progression (docs/learning-design.md): Earth teaches instrument, power and data; the Moon teaches
// mass, rocket capacity and budget; Mars teaches how everything connects, time and margins for events.

import { t } from '../../i18n/index.js';
import { fmt } from '../format.js';
import { EVENT_SAFE_MARGIN } from '../../engine/constants.js';

const SAFE_PCT = Math.round(EVENT_SAFE_MARGIN * 100);
const pct = (value) => Math.round(value * 100);
const partById = (ctx, id) => ctx.data.parts.find((part) => part.id === id) ?? null;
const nameOf = (ctx, key) => ctx.content?.meters?.[key]?.name ?? key;
const lower = (text) => String(text).toLocaleLowerCase();
const has = (ctx, type) => ctx.mission.parts.some((part) => part.type === type);
const firstOf = (ctx, type) => ctx.mission.parts.find((part) => part.type === type) ?? null;

/** An instrument the player has just added (not removed). */
function addedInstrument(change, ctx) {
  if (change?.action !== 'toggle-part') return null;
  const part = partById(ctx, change.value);
  return part?.type === 'instrument' && ctx.state.design.partIds.includes(part.id) ? part : null;
}

/** Answer options; `correct` marks the right one (several lessons compute it from the real data). */
const options = (prefix, correctIndex, count = 3) =>
  Array.from({ length: count }, (_, index) => ({ id: String(index), label: t(`${prefix}.a${index + 1}`), correct: index === correctIndex }));

/** The rocket with the lowest price. */
const cheapestRocket = (ctx) => ctx.data.rockets.reduce((best, rocket) => (rocket.costMUsd < best.costMUsd ? rocket : best));

/** Resources with a real fill level now, from the least room left to the most. */
function marginsNow(ctx) {
  return ['budget', 'mass', 'power', 'data']
    .map((key) => ({ key, ratio: ctx.evaluation.budget[key]?.ratio }))
    .filter((entry) => typeof entry.ratio === 'number')
    .map((entry) => ({ ...entry, margin: 1 - entry.ratio }))
    .sort((a, b) => a.margin - b.margin);
}

const powerValues = (ctx) => {
  const power = ctx.evaluation.budget.power;
  return { used: fmt(power.consumedW), made: fmt(power.generatedW) };
};

export const LESSONS = [
  // --- Earth: instrument, power and data ---
  {
    id: 'earth-instrument',
    scenario: 'earth-observation',
    screen: 'spacecraft',
    kind: 'react',
    ready: () => true,
    problem: () => t('coach.instrument.problem'),
    trigger: (change, ctx) => Boolean(addedInstrument(change, ctx)),
    question(ctx, change) {
      const part = partById(ctx, change.value);
      const strong = part.scienceValue >= 7;
      return { text: t(strong ? 'coach.instrument.askStrong' : 'coach.instrument.ask', { part: part.name }), options: options('coach.instrument', 1) };
    },
    explain(ctx, change) {
      const part = partById(ctx, change.value);
      return t('coach.instrument.explain', {
        part: part.name, mass: fmt(part.massKg), cost: fmt(part.costMUsd), power: fmt(part.powerW), data: fmt(part.dataGbPerDay),
        ...powerValues(ctx),
      });
    },
    hint: (ctx, stage) => (stage === 'explain' ? t('coach.instrument.hintNext', powerValues(ctx)) : t('coach.instrument.hint')),
  },
  {
    id: 'earth-power',
    scenario: 'earth-observation',
    screen: 'spacecraft',
    kind: 'choose',
    ready: (ctx) => has(ctx, 'instrument'),
    chosen: (ctx) => has(ctx, 'power'),
    problem: (ctx) => t('coach.power.problem', powerValues(ctx)),
    trigger: (change) => change?.action === 'set-power',
    explain(ctx) {
      const power = ctx.evaluation.budget.power;
      const values = { source: firstOf(ctx, 'power')?.name ?? '', ...powerValues(ctx), safe: SAFE_PCT };
      if (power.marginW < 0) return t('coach.power.short', { ...values, missing: fmt(-power.marginW) });
      const margin = power.generatedW ? power.marginW / power.generatedW : 0;
      if (margin < EVENT_SAFE_MARGIN) return t('coach.power.tight', { ...values, pct: pct(margin) });
      return t('coach.power.ok', { ...values, spare: fmt(power.marginW), pct: pct(margin) });
    },
    hint(ctx, stage) {
      if (stage === 'explain') return t('coach.power.hintNext');
      return t('coach.power.hint', { need: fmt(Math.ceil(ctx.evaluation.budget.power.consumedW / (1 - EVENT_SAFE_MARGIN))), safe: SAFE_PCT });
    },
  },
  {
    id: 'earth-data',
    scenario: 'earth-observation',
    screen: 'spacecraft',
    kind: 'choose',
    ready: (ctx) => has(ctx, 'instrument') && has(ctx, 'power'),
    chosen: (ctx) => has(ctx, 'comms'),
    problem: (ctx) => t('coach.data.problem', { made: fmt(ctx.evaluation.budget.data.producedGbPerDay) }),
    trigger: (change) => change?.action === 'set-comms',
    explain(ctx) {
      const { data, power } = ctx.evaluation.budget;
      const antenna = firstOf(ctx, 'comms');
      const values = { antenna: antenna?.name ?? '', sent: fmt(data.downlinkGbPerDay), made: fmt(data.producedGbPerDay) };
      const main = data.marginGbPerDay >= 0
        ? t('coach.data.ok', { ...values, pct: data.downlinkGbPerDay ? pct(data.marginGbPerDay / data.downlinkGbPerDay) : 0 })
        : t('coach.data.backlog', { ...values, lost: fmt(-data.marginGbPerDay) });
      // The antenna needs power too: everything is connected.
      const extra = antenna?.powerW ? ` ${t('coach.data.power', { w: fmt(antenna.powerW), used: fmt(power.consumedW), made: fmt(power.generatedW) })}` : '';
      return main + extra;
    },
    hint: (ctx, stage) => (stage === 'explain' ? t('coach.data.hintNext') : t('coach.data.hint', { made: fmt(ctx.evaluation.budget.data.producedGbPerDay) })),
  },

  // --- Moon: mass, rocket capacity and budget ---
  {
    id: 'moon-mass',
    scenario: 'moon-exploration',
    screen: 'spacecraft',
    kind: 'react',
    ready: () => true,
    problem: () => t('coach.mass.problem'),
    trigger: (change, ctx) => Boolean(addedInstrument(change, ctx)),
    question: (ctx, change) => ({ text: t('coach.mass.ask', { part: partById(ctx, change.value).name }), options: options('coach.mass', 1) }),
    explain(ctx, change) {
      const part = partById(ctx, change.value);
      return t('coach.mass.explain', { part: part.name, mass: fmt(part.massKg), total: fmt(ctx.evaluation.budget.mass.usedKg) });
    },
    hint: (ctx, stage) => t(stage === 'explain' ? 'coach.mass.hintNext' : 'coach.mass.hint'),
  },
  {
    id: 'moon-rocket',
    scenario: 'moon-exploration',
    screen: 'launch',
    kind: 'ask',
    ready: (ctx) => Boolean(ctx.mission.orbit),
    question(ctx) {
      const rocket = cheapestRocket(ctx);
      const fits = (rocket.payloadKg[ctx.mission.orbit.target] ?? 0) >= ctx.evaluation.budget.mass.usedKg;
      return {
        text: t('coach.rocket.ask', { kg: fmt(ctx.evaluation.budget.mass.usedKg), rocket: rocket.name }),
        options: options('coach.rocket', fits ? 0 : 1, 2),
      };
    },
    explain(ctx) {
      const rocket = cheapestRocket(ctx);
      const capacity = rocket.payloadKg[ctx.mission.orbit.target] ?? 0;
      const values = { rocket: rocket.name, leo: fmt(rocket.payloadKg.LEO), tli: fmt(capacity) };
      return t(capacity > 0 ? 'coach.rocket.explain' : 'coach.rocket.explainNone', values);
    },
    hint: (ctx, stage) => (stage === 'explain'
      ? t('coach.rocket.hintNext', { kg: fmt(ctx.evaluation.budget.mass.usedKg) })
      : t('coach.rocket.hint')),
  },
  {
    id: 'moon-budget',
    scenario: 'moon-exploration',
    screen: 'launch',
    kind: 'ask',
    ready: (ctx) => Boolean(ctx.mission.rocket && ctx.mission.orbit && (ctx.mission.rocket.payloadKg[ctx.mission.orbit.target] ?? 0) > 0),
    question(ctx) {
      const share = ctx.mission.rocket.costMUsd / ctx.evaluation.budget.budget.limitMUsd;
      const correct = share < 0.25 ? 0 : share <= 0.5 ? 1 : 2;
      return { text: t('coach.budget.ask', { limit: fmt(ctx.evaluation.budget.budget.limitMUsd), rocket: ctx.mission.rocket.name }), options: options('coach.budget', correct) };
    },
    explain(ctx) {
      const { budget } = ctx.evaluation.budget;
      const rocket = ctx.mission.rocket;
      const values = {
        rocket: rocket.name, cost: fmt(rocket.costMUsd), pct: pct(rocket.costMUsd / budget.limitMUsd),
        rest: fmt(Math.round((budget.usedMUsd - rocket.costMUsd) * 10) / 10),
      };
      return budget.marginMUsd >= 0
        ? t('coach.budget.explain', { ...values, free: fmt(Math.round(budget.marginMUsd * 10) / 10) })
        : t('coach.budget.explainOver', { ...values, over: fmt(Math.round(-budget.marginMUsd * 10) / 10) });
    },
    hint: (ctx, stage) => t(stage === 'explain' ? 'coach.budget.hintNext' : 'coach.budget.hint'),
  },

  // --- Mars: everything together, time and margins for events ---
  {
    id: 'mars-integration',
    scenario: 'mars-study',
    screen: 'spacecraft',
    kind: 'ask',
    ready: (ctx) => has(ctx, 'instrument') && has(ctx, 'power') && has(ctx, 'comms') && marginsNow(ctx).length >= 2,
    question(ctx) {
      const sorted = marginsNow(ctx);
      const picked = new Set(sorted.slice(0, 3).map((entry) => entry.key));
      // Fixed resource order, so the right answer is not always in the same place.
      const keys = ['budget', 'mass', 'power', 'data'].filter((key) => picked.has(key));
      return {
        text: t('coach.integration.ask'),
        options: keys.map((key) => ({ id: key, label: nameOf(ctx, key), correct: key === sorted[0].key })),
      };
    },
    explain(ctx) {
      const sorted = marginsNow(ctx);
      const list = sorted.map((entry) => `${lower(nameOf(ctx, entry.key))} ${pct(entry.margin)}%`).join(', ');
      return t('coach.integration.explain', { list, name: lower(nameOf(ctx, sorted[0].key)) });
    },
    hint: (ctx, stage) => (stage === 'explain'
      ? t('coach.integration.hintNext', { name: lower(nameOf(ctx, marginsNow(ctx)[0].key)) })
      : t('coach.integration.hint')),
  },
  {
    id: 'mars-time',
    scenario: 'mars-study',
    screen: 'launch',
    kind: 'ask',
    ready: () => true,
    question: () => ({ text: t('coach.time.ask'), options: options('coach.time', 1) }),
    explain(ctx) {
      const orbit = ctx.mission.orbit ?? ctx.data.orbits.find((item) => item.id === ctx.scenario.allowedOrbits[0]);
      const trip = orbit?.transferDays ?? 0;
      const ops = ctx.scenario.operationDays;
      const free = ctx.scenario.maxDays - trip - ops;
      return t('coach.time.explain', {
        trip: fmt(trip), ops: fmt(ops), total: fmt(trip + ops), limit: fmt(ctx.scenario.maxDays), free: fmt(free), pct: pct(free / ctx.scenario.maxDays),
      });
    },
    hint: (ctx, stage) => (stage === 'explain' ? t('coach.time.hintNext', { safe: SAFE_PCT }) : t('coach.time.hint')),
  },
  {
    id: 'mars-margin',
    scenario: 'mars-study',
    screen: 'launch',
    kind: 'ask',
    ready: (ctx) => ctx.evaluation.ok,
    question(ctx) {
      const protectedBy = stormProtection(ctx);
      const keys = [...new Set(['budget', protectedBy, 'mass'])];
      return { text: t('coach.margin.ask'), options: keys.map((key) => ({ id: key, label: nameOf(ctx, key), correct: key === protectedBy })) };
    },
    explain(ctx) {
      const key = stormProtection(ctx);
      const ratio = ctx.evaluation.budget[key]?.ratio ?? 1;
      const margin = Math.max(0, 1 - ratio);
      const values = { resource: lower(nameOf(ctx, key)), pct: pct(margin), safe: SAFE_PCT };
      return t(margin >= EVENT_SAFE_MARGIN ? 'coach.margin.explainSafe' : 'coach.margin.explainRisk', values);
    },
    hint: (ctx, stage) => (stage === 'explain' ? t('coach.margin.hintNext', { safe: SAFE_PCT }) : t('coach.margin.hint')),
  },
];

/** The resource that protects this mission from a dust storm (from the events table; time if none). */
function stormProtection(ctx) {
  return ctx.data.events?.find((event) => event.id === 'mars-dust-storm')?.protectedBy ?? 'time';
}

const BY_ID = new Map(LESSONS.map((lesson) => [lesson.id, lesson]));
export const lessonById = (id) => BY_ID.get(id) ?? null;

/** The lessons of a mission, in order. */
export const lessonsFor = (scenarioId) => LESSONS.filter((lesson) => lesson.scenario === scenarioId);

/**
 * The next lesson to start on this screen: ready, not done in this mission, and every earlier lesson
 * of the same screen already done (so the order of the cycle is kept).
 * @param {object} ctx { screen, scenario, data, content, state, evaluation, mission }
 * @param {Set<string>} done lesson ids finished in this mission
 */
export function nextLesson(ctx, done) {
  for (const lesson of lessonsFor(ctx.scenario.id)) {
    if (lesson.screen !== ctx.screen || done.has(lesson.id)) continue;
    return lesson.ready(ctx) ? lesson : null;
  }
  return null;
}

/** The first stage when a lesson starts. A 'choose' lesson whose choice is already made explains right away. */
export function firstStage(lesson, ctx) {
  if (lesson.kind === 'ask') return 'ask';
  if (lesson.kind === 'choose' && lesson.chosen(ctx)) return 'explain';
  return 'problem';
}

/** The stage after a player's design change, or null if the change does not move this lesson. */
export function stageAfterChange(lesson, stage, change, ctx) {
  if (stage !== 'problem' || !lesson.trigger?.(change, ctx)) return null;
  return lesson.kind === 'react' ? 'ask' : 'explain';
}

/**
 * What the panel shows for a lesson at a stage.
 * @param {{ lessonId: string, stage: string, change?: object, answer?: string, hint?: boolean }} active
 * @param {object} ctx current evaluation (after the change)
 * @returns {{ id: string, kind: string, title: string, text: string, options: object[]|null, hint: string|null,
 *   feedback: string|null, step: number, total: number }}
 */
export function lessonCard(active, ctx) {
  const lesson = lessonById(active.lessonId);
  const list = lessonsFor(lesson.scenario);
  const card = {
    id: `coach:${lesson.id}:${active.stage}`,
    kind: active.stage,
    step: list.indexOf(lesson) + 1,
    total: list.length,
    options: null,
    feedback: null,
    hint: active.hint ? lesson.hint(ctx, active.stage) : null,
  };
  if (active.stage === 'problem') return { ...card, title: t('coach.title.problem'), text: lesson.problem(ctx) };
  const question = lesson.question?.(ctx, active.change);
  if (active.stage === 'ask') return { ...card, title: t('coach.title.ask'), text: question.text, options: question.options };
  // explain (or review): the answer is judged against the real data, then the real values
  const picked = question?.options.find((option) => option.id === active.answer);
  const feedback = picked ? t(picked.correct ? 'coach.right' : 'coach.notQuite') : null;
  return { ...card, title: t('coach.title.explain'), feedback, text: lesson.explain(ctx, active.change, active.answer) };
}
