// Shared game constants. Pure values, no DOM and no Three.js.

/**
 * A resource between this share of its limit and 100% is "tight but valid".
 * Above 100% it is "over". Used for meter colors and the "tight but valid" badge.
 */
export const TIGHT_RATIO = 0.95;

/**
 * Random events cause no damage when the margin on the protected resource
 * is at least this share of its limit (15%). This is how the game teaches
 * why engineers keep margins.
 */
export const EVENT_SAFE_MARGIN = 0.15;
