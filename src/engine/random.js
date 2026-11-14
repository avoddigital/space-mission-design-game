// Seeded random numbers, so the same mission meets the same events. Pure functions, no DOM.

/**
 * Small, fast seeded generator (mulberry32). Returns a function that gives numbers in [0, 1).
 * @param {number} seed
 */
export function mulberry32(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fingerprint of a design: the same choices always give the same number,
 * no matter the order in which the parts were picked.
 * @param {{ partIds?: string[], orbitId?: string|null, rocketId?: string|null }} design
 * @param {string} [scenarioId]
 */
export function hashDesign(design, scenarioId = '') {
  const text = [scenarioId, [...(design.partIds ?? [])].sort().join(','), design.orbitId ?? '', design.rocketId ?? ''].join('|');
  // FNV-1a hash
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
