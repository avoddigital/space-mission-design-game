// Builds a low-poly spacecraft from the chosen parts, using only simple shapes.
// Read-only: it receives part objects and returns a Three.js group. It never decides game rules.

import * as THREE from 'three';

// Geometries and materials are shared by every build (PRD 5.4: reuse, do not recreate).
let shared = null;

function getShared() {
  if (shared) return shared;
  shared = {
    geometry: {
      body: new THREE.BoxGeometry(1.2, 1.2, 1.6),
      box: new THREE.BoxGeometry(1, 1, 1),
      cylinder: new THREE.CylinderGeometry(0.5, 0.5, 1, 20),
      thinRod: new THREE.CylinderGeometry(0.02, 0.02, 1, 6),
      sphere: new THREE.SphereGeometry(0.5, 16, 12),
      dish: new THREE.SphereGeometry(1, 24, 10, 0, Math.PI * 2, 0, Math.PI / 3),
      panel: new THREE.BoxGeometry(1, 0.03, 0.9),
    },
    material: {
      // Toon shading (flat color bands) gives the craft a friendly, illustrated look.
      gold: toon(0xf2b134, 0x3a2600),
      silver: toon(0xd8dde6),
      dark: toon(0x34313d),
      cells: toon(0x2e46b8, 0x0a1030),
      dish: toon(0xf1e8d6, 0, { side: THREE.DoubleSide }),
      lens: toon(0x6fb3e8, 0x0d2b4f),
      laser: toon(0xb5533a, 0x5a1d10),
      generic: toon(0x8e9aaf),
    },
  };
  return shared;
}

let gradientMap = null;

/** Three light steps, so the toon shading reads as a cartoon and not as a flat silhouette. */
function toonGradient() {
  if (gradientMap) return gradientMap;
  gradientMap = new THREE.DataTexture(new Uint8Array([70, 160, 255]), 3, 1, THREE.RedFormat);
  gradientMap.minFilter = THREE.NearestFilter;
  gradientMap.magFilter = THREE.NearestFilter;
  gradientMap.needsUpdate = true;
  return gradientMap;
}

function toon(color, emissive = 0, extra = {}) {
  return new THREE.MeshToonMaterial({ color, emissive, gradientMap: toonGradient(), ...extra });
}

/** Free the shared GPU resources (call when the 3D view is closed for good). */
export function disposeShared() {
  if (!shared) return;
  Object.values(shared.geometry).forEach((geometry) => geometry.dispose());
  Object.values(shared.material).forEach((material) => material.dispose());
  shared = null;
  gradientMap?.dispose();
  gradientMap = null;
}

function mesh(geometry, material, { position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0] } = {}) {
  const item = new THREE.Mesh(geometry, material);
  item.position.set(...position);
  item.scale.set(...scale);
  item.rotation.set(...rotation);
  return item;
}

/**
 * Shape family of an instrument, from its id. New instruments with similar names
 * get a sensible shape automatically; anything else becomes a generic box.
 */
export function instrumentKind(part) {
  const id = part.id ?? '';
  if (/camera|imager/.test(id)) return 'camera';
  if (/spectrometer/.test(id)) return 'spectrometer';
  if (/radar/.test(id)) return 'radar';
  if (/altimeter/.test(id)) return 'altimeter';
  if (/magnetometer/.test(id)) return 'magnetometer';
  if (/radiation|detector/.test(id)) return 'detector';
  return 'generic';
}

/** Antenna shape from how much data it can send. */
export function antennaKind(part) {
  const downlink = part.downlinkGbPerDay ?? 0;
  if (downlink <= 2) return 'whip';
  if (downlink <= 40) return 'small-dish';
  return 'big-dish';
}

/** Solar wing length grows with the power it makes (scene units, not meters). */
export function wingSpan(part) {
  return Math.min(3.4, 0.9 + (part.powerGenW ?? 0) / 330);
}

function instrumentMesh(part, { geometry: g, material: m }) {
  const group = new THREE.Group();
  const size = 0.6 + Math.min(0.6, (part.massKg ?? 10) / 150); // heavier instruments look bigger
  switch (instrumentKind(part)) {
    case 'camera':
      group.add(mesh(g.cylinder, m.dark, { scale: [0.32 * size, 0.45 * size, 0.32 * size], rotation: [Math.PI / 2, 0, 0] }));
      group.add(mesh(g.cylinder, m.lens, { position: [0, 0, 0.23 * size], scale: [0.26 * size, 0.02, 0.26 * size], rotation: [Math.PI / 2, 0, 0] }));
      break;
    case 'spectrometer':
      group.add(mesh(g.box, m.silver, { scale: [0.38 * size, 0.28 * size, 0.3 * size] }));
      group.add(mesh(g.cylinder, m.lens, { position: [0, 0, 0.17 * size], scale: [0.12, 0.1, 0.12], rotation: [Math.PI / 2, 0, 0] }));
      break;
    case 'radar':
      group.add(mesh(g.thinRod, m.silver, { scale: [1.2, 3.2, 1.2], rotation: [0, 0, Math.PI / 2] }));
      group.add(mesh(g.box, m.dark, { scale: [0.2, 0.12, 0.12] }));
      break;
    case 'altimeter':
      group.add(mesh(g.cylinder, m.silver, { scale: [0.18, 0.3, 0.18], rotation: [Math.PI / 2, 0, 0] }));
      group.add(mesh(g.cylinder, m.laser, { position: [0, 0, 0.16], scale: [0.12, 0.02, 0.12], rotation: [Math.PI / 2, 0, 0] }));
      break;
    case 'magnetometer':
      group.add(mesh(g.thinRod, m.silver, { position: [0, 0, 0.9], scale: [1, 1.8, 1], rotation: [Math.PI / 2, 0, 0] }));
      group.add(mesh(g.sphere, m.dark, { position: [0, 0, 1.8], scale: [0.14, 0.14, 0.14] }));
      break;
    case 'detector':
      group.add(mesh(g.box, m.silver, { scale: [0.2, 0.2, 0.2] }));
      break;
    default:
      group.add(mesh(g.box, m.generic, { scale: [0.25, 0.25, 0.25] }));
  }
  return group;
}

function solarWings(part, { geometry: g, material: m }) {
  const group = new THREE.Group();
  const span = wingSpan(part);
  for (const side of [-1, 1]) {
    group.add(mesh(g.thinRod, m.silver, { position: [side * 0.85, 0, 0], scale: [1.5, 0.5, 1.5], rotation: [0, 0, Math.PI / 2] }));
    group.add(mesh(g.panel, m.cells, { position: [side * (1.05 + span / 2), 0, 0], scale: [span, 1, 1] }));
  }
  return group;
}

function antennaMesh(part, { geometry: g, material: m }) {
  const group = new THREE.Group();
  const kind = antennaKind(part);
  if (kind === 'whip') {
    group.add(mesh(g.thinRod, m.silver, { position: [0, 0.6, 0], scale: [1, 1.2, 1] }));
  } else {
    const radius = kind === 'big-dish' ? 0.85 : 0.45;
    group.add(mesh(g.thinRod, m.silver, { position: [0, 0.2, 0], scale: [2, 0.4, 2] }));
    group.add(mesh(g.dish, m.dish, { position: [0, 0.4 + radius, 0], scale: [radius, radius, radius], rotation: [Math.PI, 0, 0] }));
    group.add(mesh(g.thinRod, m.silver, { position: [0, 0.4 + radius * 0.6, 0], scale: [1, radius * 0.9, 1] }));
  }
  return group;
}

// Where instruments sit on the body: the front face first, then the bottom.
const INSTRUMENT_SLOTS = [
  [-0.3, 0.3, 0.8], [0.3, 0.3, 0.8], [-0.3, -0.3, 0.8], [0.3, -0.3, 0.8],
  [0, -0.6, 0.4], [0, -0.6, -0.1], [0, -0.6, -0.55], [-0.6, 0, -0.5], [0.6, 0, -0.5], [0, 0, -0.8],
];

/**
 * @param {object[]} parts resolved part objects (from src/data/parts.js)
 * @returns {THREE.Group} the spacecraft; every part group has userData { partId, kind }
 */
export function buildSpacecraft(parts = []) {
  const resources = getShared();
  const craft = new THREE.Group();
  craft.name = 'spacecraft';

  const body = mesh(resources.geometry.body, resources.material.gold);
  body.userData = { partId: 'bus', kind: 'body' };
  craft.add(body);

  let slot = 0;
  for (const part of parts) {
    let item;
    let kind;
    if (part.type === 'power') {
      item = solarWings(part, resources);
      kind = 'solar';
    } else if (part.type === 'comms') {
      item = antennaMesh(part, resources);
      item.position.set(0, 0.6, -0.2);
      kind = antennaKind(part);
    } else {
      item = instrumentMesh(part, resources);
      item.position.set(...INSTRUMENT_SLOTS[slot % INSTRUMENT_SLOTS.length]);
      if (slot >= INSTRUMENT_SLOTS.length) item.position.y -= 0.25; // more parts than slots: offset, never break
      slot += 1;
      kind = instrumentKind(part);
    }
    item.userData = { partId: part.id, kind };
    craft.add(item);
  }
  return craft;
}
