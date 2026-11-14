import { describe, it, expect } from 'vitest';
import {
  createCampaign, isCampaign, currentPhase, phaseStatus, campaignData, payLaunch, clearReserve, finishMission,
  availableSideJobs, sideJobBlock, runSideJob, researchCost, researchBlock, buyResearch, drawEvent, applyEvent,
  libraryUnlocked, isFinished, phaseOfScenario,
} from '../src/engine/campaign.js';
import { countries, focuses, phases, sideJobs, research, agencyEvents, START_FUNDS_MUSD, STARTING_LIBRARY } from '../src/data/campaign.js';
import { libraryMissions, libraryTopics } from '../src/data/library.js';
import { gameData } from '../src/state/selectors.js';

const fresh = (focus = 'technology') => createCampaign('br', focus);
const win = (campaign, phaseId) => finishMission(campaign, phaseId, { success: true, scienceDelivered: 20 }).campaign;

describe('campaign data', () => {
  it('lists the 16 partner countries plus Europe and the United States, with flag codes', () => {
    expect(countries).toHaveLength(18);
    expect(countries.map((country) => country.id)).toContain('us');
    expect(new Set(countries.map((country) => country.id)).size).toBe(18);
  });

  it('uses only existing scenarios, library entries and focus ids', () => {
    const libraryIds = new Set([...libraryMissions, ...libraryTopics].map((entry) => entry.id));
    for (const phase of phases) {
      expect(gameData.scenarios.some((scenario) => scenario.id === phase.scenarioId)).toBe(true);
      phase.unlocks.forEach((id) => expect(libraryIds.has(id), id).toBe(true));
    }
    [...sideJobs, ...research, ...agencyEvents].flatMap((item) => item.unlocks ?? []).forEach((id) => expect(libraryIds.has(id), id).toBe(true));
    STARTING_LIBRARY.forEach((id) => expect(libraryIds.has(id), id).toBe(true));
    sideJobs.forEach((job) => expect(phases.some((phase) => phase.id === job.phase)).toBe(true));
    expect(focuses).toHaveLength(3);
  });

  it('keeps a free side job in the first phase, so an agency with no money is never stuck', () => {
    expect(sideJobs.some((job) => job.phase === 'earth' && job.costMUsd === 0 && job.chance === 1)).toBe(true);
  });
});

describe('phases', () => {
  it('starts on Earth with the starting funds and library', () => {
    const campaign = fresh();
    expect(isCampaign(campaign)).toBe(true);
    expect(campaign.fundsMUsd).toBe(START_FUNDS_MUSD);
    expect(currentPhase(campaign).id).toBe('earth');
    expect(phaseStatus(campaign, 'moon')).toBe('locked');
    expect([...libraryUnlocked(campaign)]).toEqual(STARTING_LIBRARY);
  });

  it('unlocks phases in order and pays the phase reward only once', () => {
    let campaign = win(fresh(), 'earth');
    expect(phaseStatus(campaign, 'earth')).toBe('done');
    expect(currentPhase(campaign).id).toBe('moon');
    const funds = campaign.fundsMUsd;
    const replay = finishMission(campaign, 'earth', { success: true, scienceDelivered: 10 });
    expect(replay.result.firstSuccess).toBe(false);
    expect(replay.campaign.fundsMUsd).toBe(funds);
    expect(replay.result.science).toBeGreaterThan(0);
    campaign = win(win(campaign, 'moon'), 'mars');
    expect(isFinished(campaign)).toBe(true);
  });

  it('opens the destination missions in the library after a first success', () => {
    const { result, campaign } = finishMission(fresh(), 'earth', { success: true, scienceDelivered: 12 });
    expect(result.unlocked).toEqual(expect.arrayContaining(['landsat-9', 'landsat-8']));
    expect(libraryUnlocked(campaign).has('landsat-9')).toBe(true);
  });

  it('gives nothing for a failed mission', () => {
    const { result, campaign } = finishMission(fresh(), 'earth', { success: false });
    expect(result.success).toBe(false);
    expect(campaign.completed).toEqual([]);
  });

  it('maps scenarios to phases', () => {
    expect(phaseOfScenario('mars-study').id).toBe('mars');
    expect(phaseOfScenario('nope')).toBeNull();
  });
});

describe('launch costs and mission budget', () => {
  it('caps the mission budget at the agency funds', () => {
    const poor = { ...fresh(), fundsMUsd: 90 };
    const data = campaignData(gameData, poor);
    expect(data.scenarios.find((scenario) => scenario.id === 'earth-observation').budgetMUsd).toBe(90);
    expect(gameData.scenarios.find((scenario) => scenario.id === 'earth-observation').budgetMUsd).toBe(150);
  });

  it('keeps the launch budget until the report, then forgets it', () => {
    const launched = payLaunch({ ...fresh(), fundsMUsd: 200 }, 120);
    expect(launched.fundsMUsd).toBe(80);
    expect(campaignData(gameData, launched).scenarios[0].budgetMUsd).toBe(150);
    expect(campaignData(gameData, clearReserve(launched)).scenarios[0].budgetMUsd).toBe(80);
  });
});

describe('side jobs', () => {
  it('shows only jobs of reached phases', () => {
    const ids = availableSideJobs(fresh()).map((job) => job.id);
    expect(ids).toContain('outreach');
    expect(ids).not.toContain('relay-service');
  });

  it('pays the cost, gives the reward on success and counts uses', () => {
    const before = fresh();
    const { campaign, outcome } = runSideJob(before, 'weather-contract', 0);
    expect(outcome.success).toBe(true);
    expect(campaign.fundsMUsd).toBe(before.fundsMUsd - 20 + 70);
    const failed = runSideJob(before, 'weather-contract', 0.99);
    expect(failed.outcome.success).toBe(false);
    expect(failed.campaign.fundsMUsd).toBe(before.fundsMUsd - 20);
    const twice = runSideJob(runSideJob(campaign, 'weather-contract', 0).campaign, 'weather-contract', 0);
    expect(twice.outcome).toBeNull();
    expect(sideJobBlock(twice.campaign, 'weather-contract')).toBe('used-up');
  });

  it('blocks a job the agency cannot pay for', () => {
    expect(sideJobBlock({ ...fresh(), fundsMUsd: 5 }, 'weather-contract')).toBe('no-funds');
  });

  it('gives back side job uses when a new phase is completed', () => {
    const used = runSideJob(fresh(), 'outreach', 0).campaign;
    expect(used.sideUses.outreach).toBe(1);
    expect(win(used, 'earth').sideUses).toEqual({});
  });
});

describe('research and focus', () => {
  it('applies the technology discount and improves the tables', () => {
    const tech = { ...fresh('technology'), science: 100 };
    expect(researchCost(tech, 'launch-deal')).toBe(15);
    expect(researchCost(fresh('observation'), 'launch-deal')).toBe(20);
    const done = buyResearch(tech, 'launch-deal');
    expect(done.research).toContain('launch-deal');
    expect(researchBlock(done, 'launch-deal')).toBe('done');
    const before = gameData.rockets[0].costMUsd;
    expect(campaignData(gameData, done).rockets[0].costMUsd).toBeCloseTo(before * 0.85, 1);
  });

  it('refuses research without enough science', () => {
    const broke = { ...fresh(), science: 0 };
    expect(buyResearch(broke, 'solar-cells')).toBe(broke);
  });

  it('gives Earth Observation agencies more science and Exploration agencies shorter trips', () => {
    const observation = runSideJob(fresh('observation'), 'sounding-rocket', 0).campaign;
    const technology = runSideJob(fresh('technology'), 'sounding-rocket', 0).campaign;
    expect(observation.science).toBeGreaterThan(technology.science);
    const mars = (campaign) => campaignData(gameData, campaign).orbits.find((orbit) => orbit.id === 'mars-orbit').transferDays;
    expect(mars(fresh('exploration'))).toBeLessThan(mars(fresh('technology')));
  });
});

describe('events', () => {
  it('happens only below the chance and picks by weight', () => {
    expect(drawEvent(0.99, 0)).toBeNull();
    expect(drawEvent(0, 0).id).toBe(agencyEvents[0].id);
    expect(drawEvent(0, 0.9999).id).toBe(agencyEvents[agencyEvents.length - 1].id);
  });

  it('applies rewards and unlocks, and funds never go negative', () => {
    const solar = agencyEvents.find((event) => event.id === 'solar-maximum');
    expect(libraryUnlocked(applyEvent(fresh(), solar)).has('space-weather')).toBe(true);
    const late = agencyEvents.find((event) => event.id === 'supplier-delay');
    expect(applyEvent({ ...fresh(), fundsMUsd: 10 }, late).fundsMUsd).toBe(0);
  });
});
