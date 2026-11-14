// Campaign tables: the agency, its phases, side jobs, research and events.
// All numbers here are GAME VALUES, tuned for play. They are simplified and not real costs.
// The countries are the 2026 NASA Space Apps Space Agency Partners
// (spaceappschallenge.org/2026/space-agency-partners, checked 2026-11-14), plus "Europe" for ESA
// and the United States, the host country (team decision of 2026-11-14).
// The game shows only the country (or Europe) and its flag, never an agency name.

export const countries = [
  { id: 'ao', name: 'Angola' },
  { id: 'ar', name: 'Argentina' },
  { id: 'bh', name: 'Bahrain' },
  { id: 'br', name: 'Brazil' },
  { id: 'ca', name: 'Canada' },
  { id: 'eu', name: 'Europe' },
  { id: 'in', name: 'India' },
  { id: 'it', name: 'Italy' },
  { id: 'jp', name: 'Japan' },
  { id: 'ng', name: 'Nigeria' },
  { id: 'py', name: 'Paraguay' },
  { id: 'sn', name: 'Senegal' },
  { id: 'kr', name: 'South Korea' },
  { id: 'es', name: 'Spain' },
  { id: 'tr', name: 'Türkiye' },
  { id: 'ae', name: 'United Arab Emirates' },
  { id: 'gb', name: 'United Kingdom' },
  { id: 'us', name: 'United States' },
];

/** Agency focus: the only gameplay difference the player picks. One small bonus each. */
export const focuses = [
  {
    id: 'observation',
    name: 'Earth Observation',
    icon: 'camera',
    text: 'Your agency is known for its science teams.',
    bonus: '+30% science points from every mission and side job.',
    scienceMultiplier: 1.3,
  },
  {
    id: 'exploration',
    name: 'Exploration',
    icon: 'orbit',
    text: 'Your agency is good at planning trips.',
    bonus: 'Trips to the Moon and Mars take 15% less time.',
    transferMultiplier: 0.85,
  },
  {
    id: 'technology',
    name: 'Technology',
    icon: 'wrench',
    text: 'Your agency builds new technology fast.',
    bonus: 'Research costs 25% less science.',
    researchMultiplier: 0.75,
  },
];

export const START_FUNDS_MUSD = 320;
export const START_SCIENCE = 10;

/**
 * Main missions, played in order. Each uses one of the game scenarios.
 * rewardMUsd: funds the government gives the first time the phase succeeds.
 * unlocks: what a first success opens in the Mission Library (ids from src/data/library.js).
 */
export const phases = [
  {
    id: 'earth',
    scenarioId: 'earth-observation',
    name: 'Phase 1 · Earth',
    goal: 'Prove your agency can build and fly a satellite.',
    rewardMUsd: 200,
    unlocks: ['landsat-9', 'landsat-8', 'comms'],
  },
  {
    id: 'moon',
    scenarioId: 'moon-exploration',
    name: 'Phase 2 · Moon',
    goal: 'Leave Earth orbit and map the Moon.',
    rewardMUsd: 260,
    unlocks: ['lro', 'lcross', 'power'],
  },
  {
    id: 'mars',
    scenarioId: 'mars-study',
    name: 'Phase 3 · Mars',
    goal: 'Cross interplanetary space and study Mars.',
    rewardMUsd: 300,
    unlocks: ['mro', 'odyssey', 'maven'],
  },
];

/** Library entries open from the start. */
export const STARTING_LIBRARY = ['segments', 'maturity', 'orbits'];

/**
 * Side jobs: quick ways to earn funds or science without building a spacecraft.
 * phase: the first phase where it appears. costMUsd is paid even if it fails.
 * usesPerPhase: how many times it can run before the next main phase is completed.
 */
export const sideJobs = [
  {
    id: 'outreach',
    phase: 'earth',
    name: 'Public outreach day',
    icon: 'star',
    text: 'Open your doors to schools and families. People who understand space support it.',
    costMUsd: 0,
    chance: 1,
    reward: { fundsMUsd: 20 },
    usesPerPhase: 3,
  },
  {
    id: 'weather-contract',
    phase: 'earth',
    name: 'Weather data contract',
    icon: 'storm',
    text: 'Process satellite weather data for a forecasting service.',
    costMUsd: 20,
    chance: 0.85,
    reward: { fundsMUsd: 70 },
    usesPerPhase: 2,
  },
  {
    id: 'sounding-rocket',
    phase: 'earth',
    name: 'Sounding rocket flight',
    icon: 'rocket',
    text: 'A small rocket goes up for a few minutes to test an instrument.',
    costMUsd: 15,
    chance: 0.9,
    reward: { science: 8 },
    unlocks: ['segments'],
    usesPerPhase: 2,
  },
  {
    id: 'cubesat-class',
    phase: 'earth',
    name: 'Student CubeSat',
    icon: 'generic',
    text: 'Help a university team fly a tiny satellite.',
    costMUsd: 10,
    chance: 0.7,
    reward: { science: 6 },
    unlocks: ['cubesats'],
    usesPerPhase: 1,
  },
  {
    id: 'lunar-imaging',
    phase: 'moon',
    name: 'Lunar map partnership',
    icon: 'moon',
    text: 'Share your Moon maps with partner agencies.',
    costMUsd: 40,
    chance: 0.75,
    reward: { fundsMUsd: 120 },
    usesPerPhase: 2,
  },
  {
    id: 'sample-study',
    phase: 'moon',
    name: 'Meteorite study',
    icon: 'science',
    text: 'Study rocks that fell from space in your lab.',
    costMUsd: 25,
    chance: 0.85,
    reward: { science: 14 },
    usesPerPhase: 2,
  },
  {
    id: 'relay-service',
    phase: 'mars',
    name: 'Deep space relay time',
    icon: 'comms',
    text: 'Rent your antenna time to another mission.',
    costMUsd: 50,
    chance: 0.7,
    reward: { fundsMUsd: 160 },
    usesPerPhase: 2,
  },
];

/**
 * Research: spend science to improve parts. Effects are applied to the game tables
 * by src/engine/campaign.js (campaignData). `unlocks` opens Library entries.
 */
export const research = [
  {
    id: 'light-structures',
    name: 'Lightweight structures',
    icon: 'mass',
    text: 'Every part is 10% lighter.',
    costScience: 12,
    effect: { partMass: 0.9 },
  },
  {
    id: 'solar-cells',
    name: 'Better solar cells',
    icon: 'solar',
    text: 'Power sources make 20% more power.',
    costScience: 15,
    effect: { powerGen: 1.2 },
    unlocks: ['power'],
  },
  {
    id: 'fast-downlink',
    name: 'Faster radios',
    icon: 'comms',
    text: 'Antennas send 25% more data per day.',
    costScience: 18,
    effect: { downlink: 1.25 },
    unlocks: ['comms'],
  },
  {
    id: 'launch-deal',
    name: 'Launch partnership',
    icon: 'rocket',
    text: 'Rockets cost 15% less.',
    costScience: 20,
    effect: { rocketCost: 0.85 },
  },
  {
    id: 'sensitive-instruments',
    name: 'More sensitive instruments',
    icon: 'science',
    text: 'Every instrument gives +1 science value.',
    costScience: 30,
    effect: { instrumentScience: 1 },
  },
];

/**
 * Events between missions. One may happen after a main mission report.
 * weight: how likely it is compared to the others.
 */
export const agencyEvents = [
  {
    id: 'budget-boost',
    name: 'Extra funding approved',
    icon: 'budget',
    text: 'Your government approved extra money for the space program.',
    reward: { fundsMUsd: 60 },
    weight: 3,
  },
  {
    id: 'viral-photos',
    name: 'Your photos went viral',
    icon: 'camera',
    text: 'Students all over the country shared your mission pictures. A sponsor wants to help.',
    reward: { fundsMUsd: 30 },
    weight: 3,
  },
  {
    id: 'solar-maximum',
    name: 'The Sun is very active',
    icon: 'storm',
    text: 'The Sun is near the most active part of its cycle. Your team studied how solar storms hurt spacecraft.',
    reward: { science: 5 },
    unlocks: ['space-weather'],
    weight: 2,
  },
  {
    id: 'supplier-delay',
    name: 'A supplier is late',
    icon: 'time',
    text: 'A company that builds your parts is late. Fixing the schedule costs money.',
    reward: { fundsMUsd: -30 },
    weight: 2,
  },
  {
    id: 'university-partnership',
    name: 'University partnership',
    icon: 'bulb',
    text: 'A university wants to analyse your data. Their students find something new.',
    reward: { science: 8 },
    weight: 2,
  },
];

/** Chance that an event happens after a main mission report. */
export const EVENT_CHANCE = 0.6;
