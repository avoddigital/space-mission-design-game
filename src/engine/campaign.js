// Campaign rules: the agency's funds and science, the phases, side jobs, research and events.
// Pure functions, no DOM. Every function returns a new campaign object and never changes the old one.
// Random results take a roll (a number from 0 to 1) as an argument, so tests can choose them.

import {
  phases, sideJobs, research, agencyEvents, focuses, START_FUNDS_MUSD, START_SCIENCE, STARTING_LIBRARY, EVENT_CHANCE,
} from '../data/campaign.js';

export const CAMPAIGN_VERSION = 1;
const LOG_SIZE = 6;

const round1 = (value) => Math.round(value * 10) / 10;
const unique = (items) => [...new Set(items)];

export const focusOf = (campaign) => focuses.find((focus) => focus.id === campaign?.focusId) ?? null;

/** A new agency. */
export function createCampaign(countryId, focusId) {
  return {
    version: CAMPAIGN_VERSION,
    countryId,
    focusId,
    fundsMUsd: START_FUNDS_MUSD,
    science: START_SCIENCE,
    turn: 1,
    completed: [],
    research: [],
    library: [...STARTING_LIBRARY],
    sideUses: {},
    launches: 0,
    log: [],
  };
}

/** True when the object looks like a saved campaign this version can read. */
export function isCampaign(value) {
  return Boolean(
    value && value.version === CAMPAIGN_VERSION && typeof value.countryId === 'string'
    && Number.isFinite(value.fundsMUsd) && Array.isArray(value.completed),
  );
}

/** Log entries keep a key and ids, not English text, so the UI can show them in any language. */
function withLog(campaign, key, values = {}) {
  return { ...campaign, log: [{ turn: campaign.turn, key, values }, ...campaign.log].slice(0, LOG_SIZE) };
}

const nextTurn = (campaign) => ({ ...campaign, turn: campaign.turn + 1 });

// --- Phases ---

/** The first phase not completed yet, or null when the campaign is finished. */
export function currentPhase(campaign) {
  return phases.find((phase) => !campaign.completed.includes(phase.id)) ?? null;
}

/** 'done', 'current' or 'locked'. */
export function phaseStatus(campaign, phaseId) {
  if (campaign.completed.includes(phaseId)) return 'done';
  return currentPhase(campaign)?.id === phaseId ? 'current' : 'locked';
}

export const phaseOfScenario = (scenarioId) => phases.find((phase) => phase.scenarioId === scenarioId) ?? null;

export const isFinished = (campaign) => currentPhase(campaign) === null;

// --- Game tables changed by research and focus ---

/**
 * The game tables for this campaign: research upgrades, the focus bonus, and a mission budget
 * that can never be more than the agency's funds. The base tables are not changed.
 */
export function campaignData(base, campaign) {
  if (!campaign) return base;
  const owned = research.filter((item) => campaign.research.includes(item.id));
  const effect = (key, start) => owned.reduce((value, item) => (item.effect[key] === undefined ? value : (key === 'instrumentScience' ? value + item.effect[key] : value * item.effect[key])), start);
  const mass = effect('partMass', 1);
  const power = effect('powerGen', 1);
  const downlink = effect('downlink', 1);
  const rocketCost = effect('rocketCost', 1);
  const extraScience = effect('instrumentScience', 0);
  const transfer = focusOf(campaign)?.transferMultiplier ?? 1;

  const parts = base.parts.map((part) => ({
    ...part,
    massKg: round1(part.massKg * mass),
    ...(part.powerGenW !== undefined ? { powerGenW: round1(part.powerGenW * power) } : {}),
    ...(part.downlinkGbPerDay !== undefined ? { downlinkGbPerDay: round1(part.downlinkGbPerDay * downlink) } : {}),
    ...(part.type === 'instrument' && extraScience ? { scienceValue: part.scienceValue + extraScience } : {}),
  }));
  const rockets = base.rockets.map((rocket) => ({ ...rocket, costMUsd: round1(rocket.costMUsd * rocketCost) }));
  const orbits = base.orbits.map((orbit) => (orbit.transferDays ? { ...orbit, transferDays: Math.round(orbit.transferDays * transfer) } : orbit));
  // While a launched mission waits for its report, its cost still counts as available,
  // so the report judges the design with the same budget it had at launch.
  const available = campaign.fundsMUsd + (campaign.reservedMUsd ?? 0);
  const scenarios = base.scenarios.map((scenario) => ({
    ...scenario,
    budgetMUsd: Math.max(0, Math.min(scenario.budgetMUsd, Math.floor(available))),
  }));
  return { ...base, parts, rockets, orbits, scenarios };
}

// --- Rewards ---

/** Apply a reward ({ fundsMUsd, science }) with the focus bonus. Funds never go below zero. */
export function applyReward(campaign, reward = {}, unlocks = []) {
  const multiplier = focusOf(campaign)?.scienceMultiplier ?? 1;
  const science = reward.science ? Math.round(reward.science * (reward.science > 0 ? multiplier : 1)) : 0;
  return {
    ...campaign,
    fundsMUsd: Math.max(0, round1(campaign.fundsMUsd + (reward.fundsMUsd ?? 0))),
    science: Math.max(0, campaign.science + science),
    library: unique([...campaign.library, ...unlocks]),
  };
}

/** What a reward is worth after the focus bonus (for showing it before it happens). */
export function rewardPreview(campaign, reward = {}) {
  const multiplier = focusOf(campaign)?.scienceMultiplier ?? 1;
  return { fundsMUsd: reward.fundsMUsd ?? 0, science: reward.science ? Math.round(reward.science * multiplier) : 0 };
}

// --- Main missions ---

/** Pay for a launch (the real cost of the spacecraft and rocket). */
export function payLaunch(campaign, costMUsd) {
  const cost = Math.max(0, round1(costMUsd));
  const paid = {
    ...campaign,
    fundsMUsd: Math.max(0, round1(campaign.fundsMUsd - cost)),
    reservedMUsd: cost,
    launches: campaign.launches + 1,
  };
  return withLog(nextTurn(paid), 'log.launch', { cost });
}

/** Forget the cost of the last launch (the money is spent; the next design gets the funds left). */
export const clearReserve = (campaign) => (campaign?.reservedMUsd ? { ...campaign, reservedMUsd: 0 } : campaign);

/**
 * After a main mission report. A first success completes the phase, pays the phase reward and
 * opens Library entries. Every success also gives science points from the science delivered.
 * @returns {{ campaign: object, result: { success: boolean, firstSuccess: boolean, fundsMUsd: number, science: number, unlocked: string[], finished: boolean } }}
 */
export function finishMission(campaign, phaseId, { success, scienceDelivered = 0 }) {
  campaign = clearReserve(campaign);
  const phase = phases.find((item) => item.id === phaseId);
  if (!phase || !success) {
    const failed = withLog(campaign, 'log.failed', { phase: phase?.id ?? '' });
    return { campaign: failed, result: { success: false, firstSuccess: false, fundsMUsd: 0, science: 0, unlocked: [], finished: isFinished(campaign) } };
  }
  const firstSuccess = !campaign.completed.includes(phaseId);
  const reward = { fundsMUsd: firstSuccess ? phase.rewardMUsd : 0, science: Math.round(scienceDelivered) };
  const unlocks = firstSuccess ? phase.unlocks : [];
  const before = new Set(campaign.library);
  let next = applyReward(campaign, reward, unlocks);
  if (firstSuccess) next = { ...next, completed: [...next.completed, phaseId], sideUses: {} };
  const gained = { fundsMUsd: reward.fundsMUsd, science: next.science - campaign.science };
  next = withLog(next, 'log.success', { phase: phase.id, funds: gained.fundsMUsd, science: gained.science });
  return {
    campaign: next,
    result: {
      success: true,
      firstSuccess,
      ...gained,
      unlocked: next.library.filter((id) => !before.has(id)),
      finished: isFinished(next),
    },
  };
}

// --- Side jobs ---

const phaseIndex = (phaseId) => phases.findIndex((phase) => phase.id === phaseId);

/** Side jobs the agency can see now (their phase is reached), with how many uses are left. */
export function availableSideJobs(campaign) {
  const reached = isFinished(campaign) ? phases.length - 1 : phaseIndex(currentPhase(campaign).id);
  return sideJobs
    .filter((job) => phaseIndex(job.phase) <= reached)
    .map((job) => ({ ...job, usesLeft: Math.max(0, job.usesPerPhase - (campaign.sideUses[job.id] ?? 0)) }));
}

/** Why a side job cannot run now ('not-available', 'used-up', 'no-funds'), or null. The UI turns codes into text. */
export function sideJobBlock(campaign, jobId) {
  const job = availableSideJobs(campaign).find((item) => item.id === jobId);
  if (!job) return 'not-available';
  if (job.usesLeft <= 0) return 'used-up';
  if (campaign.fundsMUsd < job.costMUsd) return 'no-funds';
  return null;
}

/**
 * Run a side job. `roll` is a number from 0 to 1: the job succeeds when roll < chance.
 * @returns {{ campaign: object, outcome: { success: boolean, fundsMUsd: number, science: number, unlocked: string[] } | null }}
 */
export function runSideJob(campaign, jobId, roll) {
  if (sideJobBlock(campaign, jobId)) return { campaign, outcome: null };
  const job = sideJobs.find((item) => item.id === jobId);
  const success = roll < job.chance;
  const before = new Set(campaign.library);
  let next = applyReward(campaign, { fundsMUsd: -job.costMUsd });
  if (success) next = applyReward(next, job.reward, job.unlocks ?? []);
  next = { ...next, sideUses: { ...next.sideUses, [job.id]: (next.sideUses[job.id] ?? 0) + 1 } };
  const outcome = {
    success,
    fundsMUsd: round1(next.fundsMUsd - campaign.fundsMUsd),
    science: next.science - campaign.science,
    unlocked: next.library.filter((id) => !before.has(id)),
  };
  next = withLog(nextTurn(next), success ? 'log.jobOk' : 'log.jobFail', { job: job.id });
  return { campaign: next, outcome };
}

// --- Research ---

export function researchCost(campaign, researchId) {
  const item = research.find((entry) => entry.id === researchId);
  if (!item) return Infinity;
  return Math.round(item.costScience * (focusOf(campaign)?.researchMultiplier ?? 1));
}

/** Why a research cannot be bought now ('unknown', 'done', 'no-science'), or null. */
export function researchBlock(campaign, researchId) {
  if (!research.some((item) => item.id === researchId)) return 'unknown';
  if (campaign.research.includes(researchId)) return 'done';
  if (campaign.science < researchCost(campaign, researchId)) return 'no-science';
  return null;
}

export function buyResearch(campaign, researchId) {
  if (researchBlock(campaign, researchId)) return campaign;
  const item = research.find((entry) => entry.id === researchId);
  const paid = { ...campaign, science: campaign.science - researchCost(campaign, researchId), research: [...campaign.research, researchId] };
  const next = applyReward(paid, {}, item.unlocks ?? []);
  return withLog(nextTurn(next), 'log.research', { research: item.id });
}

// --- Events ---

/**
 * Maybe pick an event. `chanceRoll` decides if one happens, `pickRoll` which one (weighted).
 * @returns {object|null} the event from src/data/campaign.js
 */
export function drawEvent(chanceRoll, pickRoll) {
  if (chanceRoll >= EVENT_CHANCE) return null;
  const total = agencyEvents.reduce((sum, event) => sum + event.weight, 0);
  let left = pickRoll * total;
  for (const event of agencyEvents) {
    left -= event.weight;
    if (left < 0) return event;
  }
  return agencyEvents[agencyEvents.length - 1];
}

export function applyEvent(campaign, event) {
  if (!event) return campaign;
  return withLog(applyReward(campaign, event.reward, event.unlocks ?? []), 'log.event', { event: event.id });
}

// --- Library ---

/** Library entries this player has discovered. Without a campaign, only the starting ones. */
export function libraryUnlocked(campaign) {
  return new Set(campaign ? campaign.library : STARTING_LIBRARY);
}
