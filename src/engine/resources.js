// Pure functions for resource totals. No DOM access here.

/** Resource fields tracked for every spacecraft part. */
export const RESOURCE_KEYS = ['massKg', 'powerW', 'costMUsd', 'dataGbPerDay'];

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
