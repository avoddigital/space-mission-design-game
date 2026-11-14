// Small helpers to build HTML strings safely. No game rules here.

import { t, numberLocale } from '../i18n/index.js';

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escape text before putting it inside HTML. */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

/** Format a number for the player in the current language: 1234.56 -> "1,234.6" (en) or "1.234,6" (pt, es). */
export function fmt(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return value.toLocaleString(numberLocale(), { maximumFractionDigits: 1 });
}

/** Science value (0 to 10) as stars, 2 points per star: 7 -> "★★★½☆". */
export function stars(value) {
  const full = Math.floor(value / 2);
  const half = value % 2 >= 1 ? 1 : 0;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(Math.max(0, 5 - full - half));
}

/** Friendly names for the destination codes used by rockets and orbits. */
export const TARGET_NAMES = Object.freeze({
  LEO: 'low Earth orbit',
  GTO: 'high Earth orbit',
  TLI: 'the Moon',
  TMI: 'Mars',
});

export const DIFFICULTY_LABELS = Object.freeze({ easy: 'Easy', medium: 'Medium', hard: 'Hard' });

/** Destination name in the current language (LEO, GTO, TLI, TMI). */
export const targetName = (code) => t(`target.${code}`);

/** Difficulty label in the current language. */
export const difficultyLabel = (level) => t(`difficulty.${level}`);
