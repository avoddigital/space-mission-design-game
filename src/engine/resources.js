// Pure functions for resource totals. No DOM and no Three.js access here.

/** Numeric fields summed for every spacecraft part (see Carlos.md for the data format). */
export const RESOURCE_KEYS = [
  'massKg',
  'powerW',
  'powerGenW',
  'costMUsd',
  'dataGbPerDay',
  'downlinkGbPerDay',
  'scienceValue',
];

/**
 * Basic spacecraft structure (bus) that every mission carries, even with no parts:
 * frame, computer, thermal control and propulsion.
 * Simplified values, to be reviewed with the data tables. Not exact.
 */
export const SPACECRAFT_BUS = Object.freeze({
  massKg: 100,
  powerW: 30,
  costMUsd: 25,
});

/**
 * Sum the resources of a list of parts.
 * Missing fields count as 0.
 * @param {Array<Record<string, number>>} parts
 * @returns {Record<string, number>}
 */
export function sumResources(parts) {
  const totals = Object.fromEntries(RESOURCE_KEYS.map((key) => [key, 0]));
  for (const part of parts) {
    for (const key of RESOURCE_KEYS) {
      totals[key] += part[key] ?? 0;
    }
  }
  return totals;
}

/**
 * Payload capacity of a rocket for an orbit, in kg.
 * Returns null when the rocket or the orbit is not chosen yet.
 */
export function launchCapacityKg(rocket, orbit) {
  if (!rocket || !orbit) return null;
  return rocket.payloadKg?.[orbit.target] ?? 0;
}

/**
 * Compute the six mission resources: mass, power, budget, data, communications, time.
 * Each entry has the amount used, the limit, the margin (limit - used) and `ok`.
 *
 * @param {{ parts: object[], rocket?: object, orbit?: object }} mission resolved objects, not ids
 * @param {object} scenario
 */
export function computeBudget(mission, scenario) {
  const { parts = [], rocket = null, orbit = null } = mission;
  const totals = sumResources(parts);

  // Mass: parts + bus must fit the rocket for the chosen orbit.
  const massUsedKg = totals.massKg + SPACECRAFT_BUS.massKg;
  const massLimitKg = launchCapacityKg(rocket, orbit);
  const mass = {
    usedKg: massUsedKg,
    limitKg: massLimitKg,
    marginKg: massLimitKg === null ? null : massLimitKg - massUsedKg,
    ok: massLimitKg !== null && massUsedKg <= massLimitKg,
  };

  // Power: what the power parts generate must cover what everything consumes.
  const consumedW = totals.powerW + SPACECRAFT_BUS.powerW;
  const power = {
    consumedW,
    generatedW: totals.powerGenW,
    marginW: totals.powerGenW - consumedW,
    ok: totals.powerGenW >= consumedW,
  };

  // Budget: parts + bus + rocket.
  const budgetUsedMUsd = totals.costMUsd + SPACECRAFT_BUS.costMUsd + (rocket?.costMUsd ?? 0);
  const budget = {
    usedMUsd: budgetUsedMUsd,
    limitMUsd: scenario.budgetMUsd,
    marginMUsd: scenario.budgetMUsd - budgetUsedMUsd,
    ok: budgetUsedMUsd <= scenario.budgetMUsd,
  };

  // Data: the antennas must send to Earth all the data the instruments produce.
  const data = {
    producedGbPerDay: totals.dataGbPerDay,
    downlinkGbPerDay: totals.downlinkGbPerDay,
    marginGbPerDay: totals.downlinkGbPerDay - totals.dataGbPerDay,
    ok: totals.downlinkGbPerDay >= totals.dataGbPerDay,
  };

  // Communications: the spacecraft needs at least one comms part to talk to Earth.
  const commsParts = parts.filter((part) => part.type === 'comms').length;
  const comms = { commsParts, ok: commsParts > 0 };

  // Time: travel to the orbit + science phase must fit the scenario time limit.
  const transferDays = orbit?.transferDays ?? 0;
  const operationDays = scenario.operationDays ?? 0;
  const totalDays = transferDays + operationDays;
  const time = {
    transferDays,
    operationDays,
    totalDays,
    limitDays: scenario.maxDays,
    marginDays: scenario.maxDays - totalDays,
    ok: totalDays <= scenario.maxDays,
  };

  return { mass, power, budget, data, comms, time, scienceValue: totals.scienceValue };
}
