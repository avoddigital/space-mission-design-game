// Builds a spacecraft from the chosen parts, using only shapes made in code (no imported models),
// so it changes the moment the player adds or removes a part.
// Read-only: it receives part objects and returns a Three.js group. It never decides game rules.
//
// Look: gold insulation foil (multi-layer insulation, as on real spacecraft), aluminium structure,
// blue solar cells on a white back, a white parabolic dish. The textures are drawn in code (no files).

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Geometries, textures and materials are shared by every build (PRD 5.4: reuse, do not recreate).
let shared = null;

/** Small seeded generator, so the drawn textures look the same every time. */
function seeded(seed) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function canvas(width, height) {
  if (typeof document === 'undefined') return null; // tests run without a DOM
  const element = document.createElement('canvas');
  element.width = width;
  element.height = height;
  return element;
}

/** Crinkled foil: soft light and dark patches. Used as color and as bump (the wrinkles catch the light). */
function foilTexture() {
  const element = canvas(256, 256);
  if (!element) return null;
  const context = element.getContext('2d');
  const random = seeded(31);
  context.fillStyle = '#b0b0b0';
  context.fillRect(0, 0, 256, 256);
  for (let index = 0; index < 260; index += 1) {
    const shade = 120 + Math.floor(random() * 120);
    context.fillStyle = `rgba(${shade},${shade},${shade},0.35)`;
    context.beginPath();
    const x = random() * 256;
    const y = random() * 256;
    context.moveTo(x, y);
    for (let corner = 0; corner < 4; corner += 1) context.lineTo(x + (random() - 0.5) * 70, y + (random() - 0.5) * 70);
    context.closePath();
    context.fill();
  }
  // A few seams, like the taped edges of the blankets
  context.strokeStyle = 'rgba(70,70,70,0.6)';
  context.lineWidth = 2;
  context.strokeRect(4, 4, 248, 248);
  const texture = new THREE.CanvasTexture(element);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/** Solar cells: a grid of dark blue cells with thin silver lines. */
function cellsTexture() {
  const element = canvas(256, 256);
  if (!element) return null;
  const context = element.getContext('2d');
  context.fillStyle = '#c9ced6';
  context.fillRect(0, 0, 256, 256);
  const cells = 6;
  const size = 256 / cells;
  for (let row = 0; row < cells; row += 1) {
    for (let column = 0; column < cells; column += 1) {
      const gradient = context.createLinearGradient(column * size, row * size, (column + 1) * size, (row + 1) * size);
      gradient.addColorStop(0, '#1b2f8a');
      gradient.addColorStop(1, '#10205e');
      context.fillStyle = gradient;
      context.fillRect(column * size + 2, row * size + 2, size - 4, size - 4);
      context.strokeStyle = 'rgba(190,200,220,0.35)';
      context.lineWidth = 1;
      for (let line = 1; line < 4; line += 1) {
        context.beginPath();
        context.moveTo(column * size + 2, row * size + (line * size) / 4);
        context.lineTo((column + 1) * size - 2, row * size + (line * size) / 4);
        context.stroke();
      }
    }
  }
  const texture = new THREE.CanvasTexture(element);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** A parabolic dish (open bowl), drawn by turning a curve around its axis. */
function dishGeometry() {
  const points = [];
  for (let index = 0; index <= 16; index += 1) {
    const radius = index / 16;
    points.push(new THREE.Vector2(radius, radius * radius * 0.35));
  }
  return new THREE.LatheGeometry(points, 40);
}

/** A rocket engine bell. */
function nozzleGeometry() {
  const points = [];
  for (let index = 0; index <= 12; index += 1) {
    const height = index / 12;
    points.push(new THREE.Vector2(0.25 + 0.75 * height ** 1.8, -height));
  }
  return new THREE.LatheGeometry(points, 24);
}

function getShared() {
  if (shared) return shared;
  const foil = foilTexture();
  const cells = cellsTexture();
  shared = {
    textures: [foil, cells].filter(Boolean),
    geometry: {
      body: new RoundedBoxGeometry(1.2, 1.2, 1.6, 3, 0.07),
      box: new THREE.BoxGeometry(1, 1, 1),
      roundBox: new RoundedBoxGeometry(1, 1, 1, 2, 0.12),
      cylinder: new THREE.CylinderGeometry(0.5, 0.5, 1, 24),
      tube: new THREE.CylinderGeometry(0.5, 0.5, 1, 24, 1, true),
      thinRod: new THREE.CylinderGeometry(0.02, 0.02, 1, 6),
      sphere: new THREE.SphereGeometry(0.5, 16, 12),
      dish: dishGeometry(),
      nozzle: nozzleGeometry(),
      cone: new THREE.ConeGeometry(0.5, 1, 16),
      ring: new THREE.TorusGeometry(0.5, 0.04, 8, 32),
      panel: new THREE.BoxGeometry(1, 0.03, 1),
    },
    material: {
      gold: new THREE.MeshStandardMaterial({
        color: 0xe0a83a, metalness: 1, roughness: 0.32, map: foil, bumpMap: foil, bumpScale: 1.6, roughnessMap: foil,
      }),
      silverFoil: new THREE.MeshStandardMaterial({ color: 0xd9dde4, metalness: 1, roughness: 0.28, bumpMap: foil, bumpScale: 1.2 }),
      silver: new THREE.MeshStandardMaterial({ color: 0xc7ccd4, metalness: 0.9, roughness: 0.35 }),
      white: new THREE.MeshStandardMaterial({ color: 0xf2f0ea, metalness: 0.05, roughness: 0.55 }),
      dark: new THREE.MeshStandardMaterial({ color: 0x2b2a31, metalness: 0.4, roughness: 0.5 }),
      black: new THREE.MeshStandardMaterial({ color: 0x111116, metalness: 0.2, roughness: 0.7 }),
      cells: new THREE.MeshStandardMaterial({ color: 0xffffff, map: cells, metalness: 0.55, roughness: 0.25 }),
      dish: new THREE.MeshStandardMaterial({ color: 0xf4f1e8, metalness: 0.05, roughness: 0.45, side: THREE.DoubleSide }),
      lens: new THREE.MeshPhysicalMaterial({ color: 0x163a66, metalness: 0.2, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.05 }),
      laser: new THREE.MeshStandardMaterial({ color: 0xc0452b, emissive: 0x5a1d10, metalness: 0.3, roughness: 0.3 }),
      nozzle: new THREE.MeshStandardMaterial({ color: 0x6b6a70, metalness: 0.85, roughness: 0.45, side: THREE.DoubleSide }),
      generic: new THREE.MeshStandardMaterial({ color: 0x8e9aaf, metalness: 0.5, roughness: 0.45 }),
    },
  };
  // A solar panel box: cells on top, white back, aluminium edges (BoxGeometry face order: +x, -x, +y, -y, +z, -z).
  const m = shared.material;
  shared.material.panelFaces = [m.silver, m.silver, m.cells, m.white, m.silver, m.silver];
  return shared;
}

/** Free the shared GPU resources (call when the 3D view is closed for good). */
export function disposeShared() {
  if (!shared) return;
  Object.values(shared.geometry).forEach((geometry) => geometry.dispose());
  Object.values(shared.material).forEach((material) => (Array.isArray(material) ? null : material.dispose()));
  shared.textures.forEach((texture) => texture.dispose());
  shared = null;
}

function mesh(geometry, material, { position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0] } = {}) {
  const item = new THREE.Mesh(geometry, material);
  item.position.set(...position);
  item.scale.set(...scale);
  item.rotation.set(...rotation);
  return item;
}

/** A thin rod between two points (struts, booms, truss). */
function rod(g, material, from, to, thickness = 1) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const item = new THREE.Mesh(g.thinRod, material);
  item.position.copy(start).add(end).multiplyScalar(0.5);
  item.scale.set(thickness, start.distanceTo(end), thickness);
  item.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());
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

/** The spacecraft body ("bus"): foil-wrapped box with the details every spacecraft has. */
function busMesh({ geometry: g, material: m }) {
  const body = new THREE.Group();
  body.add(mesh(g.body, m.gold));
  // Silver radiator panel on one side (it sheds heat into space)
  body.add(mesh(g.box, m.silverFoil, { position: [0.605, 0, 0], scale: [0.01, 0.9, 1.2] }));
  // Launch adapter ring and main engine at the back
  body.add(mesh(g.cylinder, m.silver, { position: [0, 0, -0.84], scale: [0.7, 0.08, 0.7], rotation: [Math.PI / 2, 0, 0] }));
  body.add(mesh(g.nozzle, m.nozzle, { position: [0, 0, -0.88], scale: [0.16, 0.32, 0.16], rotation: [-Math.PI / 2, 0, 0] }));
  // Four small steering thrusters on the back corners
  for (const [x, y] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) {
    body.add(mesh(g.nozzle, m.nozzle, { position: [x, y, -0.82], scale: [0.04, 0.08, 0.04], rotation: [-Math.PI / 2, 0, 0] }));
  }
  // Two star trackers (the spacecraft's "eyes" for pointing), with sun shades
  for (const side of [-1, 1]) {
    const tracker = new THREE.Group();
    tracker.add(mesh(g.box, m.dark, { scale: [0.12, 0.12, 0.12] }));
    tracker.add(mesh(g.tube, m.black, { position: [0, 0.1, 0], scale: [0.11, 0.14, 0.11] }));
    tracker.position.set(side * 0.38, 0.64, -0.5);
    tracker.rotation.z = side * -0.4;
    body.add(tracker);
  }
  return body;
}

function instrumentMesh(part, { geometry: g, material: m }) {
  const group = new THREE.Group();
  const size = 0.6 + Math.min(0.6, (part.massKg ?? 10) / 150); // heavier instruments look bigger
  const forward = [Math.PI / 2, 0, 0];
  switch (instrumentKind(part)) {
    case 'camera':
      // Telescope tube with a black sun shade and a glass lens
      group.add(mesh(g.cylinder, m.silverFoil, { position: [0, 0, 0.1 * size], scale: [0.3 * size, 0.42 * size, 0.3 * size], rotation: forward }));
      group.add(mesh(g.tube, m.black, { position: [0, 0, 0.38 * size], scale: [0.33 * size, 0.18 * size, 0.33 * size], rotation: forward }));
      group.add(mesh(g.cylinder, m.lens, { position: [0, 0, 0.31 * size], scale: [0.24 * size, 0.02, 0.24 * size], rotation: forward }));
      break;
    case 'spectrometer':
      group.add(mesh(g.roundBox, m.silverFoil, { scale: [0.38 * size, 0.28 * size, 0.3 * size] }));
      group.add(mesh(g.tube, m.black, { position: [0, 0, 0.2 * size], scale: [0.12, 0.1, 0.12], rotation: forward }));
      group.add(mesh(g.cylinder, m.lens, { position: [0, 0, 0.16 * size], scale: [0.1, 0.01, 0.1], rotation: forward }));
      break;
    case 'radar':
      // Long antenna boom with a small electronics box
      group.add(mesh(g.box, m.dark, { scale: [0.22, 0.12, 0.14] }));
      group.add(mesh(g.box, m.white, { scale: [3.2, 0.03, 0.12] }));
      group.add(rod(g, m.silver, [-1.6, 0, 0.07], [1.6, 0, 0.07], 1.2));
      break;
    case 'altimeter':
      group.add(mesh(g.cylinder, m.silver, { scale: [0.2, 0.3, 0.2], rotation: forward }));
      group.add(mesh(g.ring, m.dark, { position: [0, 0, 0.15], scale: [0.22, 0.22, 0.22] }));
      group.add(mesh(g.cylinder, m.laser, { position: [0, 0, 0.16], scale: [0.13, 0.02, 0.13], rotation: forward }));
      break;
    case 'magnetometer': {
      // Folding truss boom keeps the sensor away from the spacecraft's own magnetism
      const length = 1.8;
      for (const [x, y] of [[0.04, 0.04], [-0.04, 0.04], [0, -0.05]]) group.add(rod(g, m.silver, [x, y, 0], [x * 0.4, y * 0.4, length], 0.8));
      for (let step = 1; step < 6; step += 1) group.add(mesh(g.ring, m.silver, { position: [0, 0, (step / 6) * length], scale: [0.09 * (1 - step / 10), 0.09 * (1 - step / 10), 0.4] }));
      group.add(mesh(g.roundBox, m.white, { position: [0, 0, length], scale: [0.16, 0.16, 0.16] }));
      break;
    }
    case 'detector':
      group.add(mesh(g.roundBox, m.silverFoil, { scale: [0.22, 0.22, 0.22] }));
      group.add(mesh(g.cone, m.dark, { position: [0, 0, 0.14], scale: [0.16, 0.12, 0.16], rotation: [-Math.PI / 2, 0, 0] }));
      break;
    default:
      group.add(mesh(g.box, m.generic, { scale: [0.25, 0.25, 0.25] }));
  }
  return group;
}

function solarWings(part, { geometry: g, material: m }) {
  const group = new THREE.Group();
  const span = wingSpan(part);
  const segments = Math.max(1, Math.round(span / 0.95)); // longer wings fold out in more panels
  const segment = span / segments;
  for (const side of [-1, 1]) {
    // Yoke: a short boom with a motor that turns the panels toward the Sun
    group.add(rod(g, m.silver, [side * 0.6, 0, 0], [side * 1.0, 0, 0], 2));
    group.add(mesh(g.cylinder, m.dark, { position: [side * 0.65, 0, 0], scale: [0.12, 0.1, 0.12], rotation: [0, 0, Math.PI / 2] }));
    for (let index = 0; index < segments; index += 1) {
      const center = 1.05 + segment * index + segment / 2;
      group.add(mesh(g.panel, m.panelFaces, { position: [side * center, 0, 0], scale: [segment - 0.04, 1, 0.9] }));
    }
  }
  return group;
}

function antennaMesh(part, { geometry: g, material: m }) {
  const group = new THREE.Group();
  const kind = antennaKind(part);
  if (kind === 'whip') {
    group.add(mesh(g.cylinder, m.dark, { position: [0, 0.05, 0], scale: [0.08, 0.1, 0.08] }));
    group.add(mesh(g.thinRod, m.silver, { position: [0, 0.65, 0], scale: [1, 1.2, 1] }));
    group.add(mesh(g.sphere, m.silver, { position: [0, 1.26, 0], scale: [0.05, 0.05, 0.05] }));
  } else {
    const radius = kind === 'big-dish' ? 0.85 : 0.45;
    const base = 0.4;
    group.add(mesh(g.cylinder, m.silver, { position: [0, 0.2, 0], scale: [0.06, 0.4, 0.06] }));
    group.add(mesh(g.dish, m.dish, { position: [0, base, 0], scale: [radius, radius, radius] }));
    // Feed horn held by three struts at the focus of the dish
    const focus = base + radius * 0.75;
    group.add(mesh(g.cone, m.dark, { position: [0, focus, 0], scale: [0.07 * radius * 2, 0.12, 0.07 * radius * 2], rotation: [Math.PI, 0, 0] }));
    for (let index = 0; index < 3; index += 1) {
      const angle = (index / 3) * Math.PI * 2;
      group.add(rod(g, m.silver, [Math.cos(angle) * radius * 0.92, base + radius * 0.3, Math.sin(angle) * radius * 0.92], [0, focus, 0]));
    }
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

  const body = busMesh(resources);
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
