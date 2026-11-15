// Inline SVG icons drawn in code (no image files, no NASA branding). All use currentColor,
// so they follow the text color of wherever they are placed.

const wrap = (body, size = 24) =>
  `<svg class="icon" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" focusable="false"
    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

const ICONS = {
  // Resources
  mass: '<path d="M6 21h12l-1.5-11h-9z"/><circle cx="12" cy="6" r="3"/>',
  power: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  budget: '<circle cx="12" cy="12" r="9"/><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.7 0-2.5 1-2.5 2 0 2.5 5 1.5 5 4 0 1-.8 2-2.5 2-1.2 0-2.2-.6-2.7-1.6M12 6v2M12 16v2"/>',
  data: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7"/>',
  time: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  science: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3"/><path d="M8 15h8"/>',
  comms: '<path d="M4 10a8 8 0 0 1 8-8M4 14a12 12 0 0 1 12-12"/><circle cx="6" cy="18" r="2"/><path d="M8 16 20 4"/>',

  // Part kinds
  camera: '<rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13.5" r="4"/><path d="M8 7l1.5-3h5L16 7"/>',
  spectrometer: '<path d="M12 3 3 19h18z"/><path d="M2 11h5M17 9l5-2M17 13l5 1M17 17l5 3"/>',
  radar: '<path d="M4 12a8 8 0 0 1 8-8"/><path d="M7 12a5 5 0 0 1 5-5"/><circle cx="12" cy="12" r="1.5"/><path d="M12 12l6 6"/><path d="M3 21l3-3M8 21v-3M3 16h3"/>',
  altimeter: '<path d="M12 3v12"/><path d="m8 11 4 4 4-4"/><path d="M4 20h16M6 17h2M11 17h2M16 17h2"/>',
  magnetometer: '<path d="M7 3v9a5 5 0 0 0 10 0V3"/><path d="M7 3h4v5H7zM13 3h4v5h-4z"/>',
  detector: '<path d="M12 2 20 7v10l-8 5-8-5V7z"/><circle cx="12" cy="12" r="2"/><path d="M12 6v3M12 15v3"/>',
  generic: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M10 4v16"/>',
  solar: '<rect x="3" y="5" width="18" height="12" rx="1"/><path d="M3 11h18M9 5v12M15 5v12"/><path d="M12 17v4M8 21h8"/>',
  whip: '<path d="M12 21V8"/><circle cx="12" cy="6" r="2"/><path d="M8 4a6 6 0 0 1 8 0M6 2a9 9 0 0 1 12 0"/>',
  'small-dish': '<path d="M5 9a9 9 0 0 0 10 10"/><path d="M8 6a13 13 0 0 0 10 10"/><path d="M15 19l-1 3M5 9l-3-1"/><circle cx="16" cy="8" r="1.5"/><path d="M15 9 9 15"/>',
  'big-dish': '<path d="M3 8a11 11 0 0 0 13 13"/><path d="M7 5a15 15 0 0 0 12 12"/><path d="M16 21l-1 2M3 8l-2-1"/><circle cx="17" cy="7" r="2"/><path d="M16 8 9 15"/>',

  // Launch
  rocket: '<path d="M12 2c3 3 4 7 4 11l-4 4-4-4c0-4 1-8 4-11z"/><circle cx="12" cy="10" r="1.5"/><path d="M8 13l-3 3 3 1M16 13l3 3-3 1M10 19l2 3 2-3"/>',
  orbit: '<circle cx="12" cy="12" r="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-25 12 12)"/><circle cx="20.5" cy="7.5" r="1.5" fill="currentColor"/>',
  planet: '<circle cx="12" cy="12" r="6"/><ellipse cx="12" cy="12" rx="11" ry="3.5" transform="rotate(-20 12 12)"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>',

  // States and actions
  check: '<path d="m5 12 5 5L20 7"/>',
  cross: '<path d="M6 6l12 12M18 6 6 18"/>',
  warn: '<path d="M12 3 2 21h20z"/><path d="M12 10v5M12 18h.01"/>',
  flag: '<path d="M5 21V4h11l-2 4 2 4H5"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  play: '<path d="M7 4v16l13-8z"/>',
  replay: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  next: '<path d="m9 5 7 7-7 7"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-2.4 2.4-2.1-2.1z"/>',
  dice: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/><circle cx="16" cy="8" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="8" cy="16" r="1.2" fill="currentColor"/><circle cx="16" cy="16" r="1.2" fill="currentColor"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1.2 2.1h4.6c.2-.9.6-1.6 1.2-2.1A6 6 0 0 0 12 3z"/>',
  sound: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
  'sound-off': '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="m17 9 5 6M22 9l-5 6"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>',
  medal: '<circle cx="12" cy="14" r="6"/><path d="M8.5 9.2 6 3h4l2 4 2-4h4l-2.5 6.2"/><path d="m12 11.5.9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2-1.4-1.4 2-.3z"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M8 7h7M8 11h7"/>',
  home: '<path d="M3 11 12 3l9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
  devices: '<rect x="2.5" y="4" width="14" height="10" rx="1"/><path d="M1 17.5h17"/><rect x="17.5" y="8" width="5" height="10" rx="1"/>',
  team: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.2A5 5 0 0 1 21 19"/>',
  storm: '<path d="M7 16a4 4 0 0 1-.5-8A6 6 0 0 1 18 9a3.5 3.5 0 0 1 0 7h-1"/><path d="M12 13l-2 4h3l-2 4"/>',
};

/** Part icon from its data (type and id), the same families the 3D viewer uses. */
export function partIconKey(part) {
  if (part.type === 'power') return 'solar';
  if (part.type === 'comms') {
    const downlink = part.downlinkGbPerDay ?? 0;
    return downlink <= 2 ? 'whip' : downlink <= 40 ? 'small-dish' : 'big-dish';
  }
  const id = part.id ?? '';
  if (/camera|imager/.test(id)) return 'camera';
  if (/spectrometer/.test(id)) return 'spectrometer';
  if (/radar/.test(id)) return 'radar';
  if (/altimeter/.test(id)) return 'altimeter';
  if (/magnetometer/.test(id)) return 'magnetometer';
  if (/radiation|detector/.test(id)) return 'detector';
  return 'generic';
}

/** Icon for an orbit, from its destination code. */
export function orbitIconKey(orbit) {
  if (orbit.target === 'TLI') return 'moon';
  if (orbit.target === 'TMI') return 'planet';
  return 'orbit';
}

/**
 * @param {string} name one of the keys above
 * @param {number} [size] pixel size
 */
export function icon(name, size = 24) {
  return wrap(ICONS[name] ?? ICONS.generic, size);
}
