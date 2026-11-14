// Launch vehicles for the 3D launch scene, made in code (no imported models).
// Each rocket in src/data/rockets.js gets its own silhouette, inspired by the real rocket its
// data is based on, but simplified and with no logos. Read-only: it never decides game rules.
//
// Surfaces are painted on small canvases (panel seams, cable tray, soot, foam), so no image files are needed.

import * as THREE from 'three';
import { rocketHeight } from './flightPlan.js';

/**
 * Which silhouette a rocket gets. Known ids first; any new rocket picks one from its size.
 * @returns {'small'|'medium'|'heavy'|'super-heavy'}
 */
export function rocketStyle(rocket) {
  const id = rocket?.id ?? '';
  if (/super/.test(id)) return 'super-heavy';
  if (/heavy/.test(id)) return 'heavy';
  if (/medium/.test(id)) return 'medium';
  if (/small/.test(id)) return 'small';
  const leo = rocket?.payloadKg?.LEO ?? 0;
  if (leo >= 80000) return 'super-heavy';
  if (leo >= 40000) return 'heavy';
  if (leo >= 2000) return 'medium';
  return 'small';
}

/** Small seeded generator, so the painted surfaces look the same every time. */
function seeded(seed) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

/**
 * Paint a hull texture. The canvas wraps once around a stage (u) and runs bottom to top (v).
 * @param {{ base: string, seams?: number, seamColor?: string, raceway?: boolean, soot?: number, foam?: boolean, weave?: boolean, bands?: Array<[number, number, string]>, seed?: number }} look
 */
function hullTexture(look) {
  if (typeof document === 'undefined') return null; // tests run without a DOM
  const width = 256;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  const random = seeded(look.seed ?? 5);
  context.fillStyle = look.base;
  context.fillRect(0, 0, width, height);

  if (look.foam) {
    // Spray-on foam insulation: blotchy orange with fine vertical stringers
    for (let index = 0; index < 900; index += 1) {
      const shade = random() < 0.5 ? 'rgba(120,50,10,0.10)' : 'rgba(255,190,120,0.10)';
      context.fillStyle = shade;
      context.beginPath();
      context.arc(random() * width, random() * height, 2 + random() * 9, 0, Math.PI * 2);
      context.fill();
    }
    context.strokeStyle = 'rgba(110,45,10,0.25)';
    for (let x = 0; x < width; x += 16) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
  }
  if (look.weave) {
    // Carbon-fibre weave: tiny alternating light and dark squares
    for (let y = 0; y < height; y += 4) {
      for (let x = 0; x < width; x += 4) {
        context.fillStyle = (x + y) % 8 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)';
        context.fillRect(x, y, 4, 4);
      }
    }
  }
  for (const [from, to, color] of look.bands ?? []) {
    context.fillStyle = color;
    context.fillRect(0, height * (1 - to), width, height * (to - from));
  }
  // Horizontal panel seams (where the tank rings are welded)
  const seams = look.seams ?? 0;
  context.strokeStyle = look.seamColor ?? 'rgba(0,0,0,0.22)';
  context.lineWidth = 1.5;
  for (let index = 1; index <= seams; index += 1) {
    const y = (height * index) / (seams + 1);
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
  if (look.raceway) {
    // Cable tray running along the side
    context.fillStyle = 'rgba(40,40,46,0.55)';
    context.fillRect(width * 0.24, 0, 6, height);
    context.fillStyle = 'rgba(255,255,255,0.18)';
    context.fillRect(width * 0.24 + 6, 0, 1, height);
  }
  if (look.soot) {
    // Scorch from earlier flights, darkest near the engines
    const gradient = context.createLinearGradient(0, height, 0, height * (1 - look.soot));
    gradient.addColorStop(0, 'rgba(30,26,22,0.75)');
    gradient.addColorStop(1, 'rgba(30,26,22,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    for (let index = 0; index < 50; index += 1) {
      context.fillStyle = 'rgba(30,26,22,0.18)';
      context.fillRect(random() * width, height * (1 - look.soot * random()), 2 + random() * 6, 20 + random() * 60);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

/** Payload fairing / nose: an ogive turned around its axis. */
function noseGeometry(radius, height, segments = 32) {
  const points = [];
  for (let index = 0; index <= 16; index += 1) {
    const share = index / 16;
    // Ogive: gently rounded shoulders that close to a pointed tip
    points.push(new THREE.Vector2(Math.max(0.0005, radius * (1 - share) ** 0.62), height * share));
  }
  return new THREE.LatheGeometry(points, segments);
}

/** Rocket engine bell: narrow throat, wide flared mouth. */
function bellGeometry(radius, height) {
  const points = [];
  for (let index = 0; index <= 10; index += 1) {
    const share = index / 10;
    points.push(new THREE.Vector2(radius * (0.38 + 0.62 * share ** 1.7), -height * share));
  }
  return new THREE.LatheGeometry(points, 20);
}

/**
 * @param {object} rocket a rocket from src/data/rockets.js
 * @returns {THREE.Group} base at y = 0, nose up. userData: { flame, height, radius, width, style, disposables }
 */
export function createRocket(rocket) {
  const style = rocketStyle(rocket);
  const height = rocketHeight(rocket);
  const disposables = [];
  const own = (item) => {
    if (item) disposables.push(item);
    return item;
  };
  const painted = (look, extra = {}) => {
    const map = own(hullTexture(look));
    return own(new THREE.MeshStandardMaterial({ color: 0xffffff, map, bumpMap: map, bumpScale: 0.4, metalness: 0.2, roughness: 0.5, ...extra }));
  };
  const plain = (color, extra = {}) => own(new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.5, ...extra }));
  const material = {
    black: plain(0x18181d, { roughness: 0.6 }),
    grey: plain(0x8a8d94, { metalness: 0.7, roughness: 0.4 }),
    white: plain(0xf1efe9, { metalness: 0.1, roughness: 0.45 }),
    engine: plain(0x4a4950, { metalness: 0.9, roughness: 0.32, side: THREE.DoubleSide }),
    engineHot: plain(0x2b2422, { metalness: 0.8, roughness: 0.5, side: THREE.DoubleSide, emissive: 0x3a1204 }),
  };
  const group = new THREE.Group();
  const cylinder = own(new THREE.CylinderGeometry(1, 1, 1, 32));
  const frustum = own(new THREE.CylinderGeometry(1, 1.18, 1, 32, 1, true)); // engine skirt, slightly flared

  /** A stage: a cylinder of radius r from y0 to y1. */
  const stage = (radius, y0, y1, mat, x = 0, parent = group) => {
    const item = new THREE.Mesh(cylinder, mat);
    item.scale.set(radius, y1 - y0, radius);
    item.position.set(x, (y0 + y1) / 2, 0);
    parent.add(item);
    return item;
  };
  const nose = (radius, y0, length, mat, x = 0) => {
    const item = new THREE.Mesh(own(noseGeometry(radius, length)), mat);
    item.position.set(x, y0, 0);
    group.add(item);
  };
  const skirt = (radius, length, mat, x = 0) => {
    const item = new THREE.Mesh(frustum, mat);
    item.scale.set(radius, length, radius);
    item.position.set(x, length / 2, 0);
    group.add(item);
  };
  /** Engines under a stage: one in the middle, the rest in a ring. */
  const engines = (radius, count, x = 0, bellSize = 0.32) => {
    const bell = own(bellGeometry(radius * (count === 1 ? 0.75 : bellSize), radius * (count === 1 ? 0.8 : 0.55)));
    const ringCount = count - 1;
    for (let index = 0; index < count; index += 1) {
      const center = index === ringCount || count === 1;
      const angle = (index / Math.max(1, ringCount)) * Math.PI * 2;
      const ring = center ? 0 : radius * 0.62;
      const item = new THREE.Mesh(bell, index % 2 ? material.engine : material.engineHot);
      item.position.set(x + Math.cos(angle) * ring, 0.001, Math.sin(angle) * ring);
      group.add(item);
    }
    // Heat shield plate behind the engines
    const plate = new THREE.Mesh(cylinder, material.black);
    plate.scale.set(radius * 0.98, 0.012, radius * 0.98);
    plate.position.set(x, 0.006, 0);
    group.add(plate);
  };

  const h = height;
  let radius;
  let width; // half the total width, for the pad and the tower
  switch (style) {
    case 'small': {
      // Slim, all-black carbon-fibre rocket with a short, wider fairing
      radius = 0.11 + h * 0.03;
      const carbon = painted({ base: '#1d1d22', weave: true, seams: 3, seamColor: 'rgba(255,255,255,0.08)', seed: 3 }, { metalness: 0.35, roughness: 0.4 });
      skirt(radius, h * 0.05, material.black);
      stage(radius, h * 0.05, h * 0.62, carbon);
      stage(radius * 1.01, h * 0.62, h * 0.65, material.grey);
      stage(radius, h * 0.65, h * 0.76, carbon);
      stage(radius * 1.12, h * 0.76, h * 0.82, carbon);
      nose(radius * 1.12, h * 0.82, h * 0.18, carbon);
      engines(radius, 9, 0, 0.26);
      width = radius * 1.2;
      break;
    }
    case 'medium':
    case 'heavy': {
      // Tall white rocket: sooty first stage, black interstage, clean second stage, wide fairing
      radius = 0.1 + h * 0.035;
      const firstStage = painted({ base: '#efede7', seams: 7, raceway: true, soot: 0.55, seed: 11 });
      const secondStage = painted({ base: '#f3f1ec', seams: 2, raceway: true, seed: 12 });
      const fairing = painted({ base: '#f5f4f0', seams: 1, seamColor: 'rgba(0,0,0,0.3)', seed: 13 });
      const interstage = painted({ base: '#1c1c21', seams: 2, seamColor: 'rgba(255,255,255,0.1)', seed: 14 });
      const core = (x, top, withFins) => {
        skirt(radius, h * 0.04, material.black, x);
        stage(radius, h * 0.04, top, firstStage, x);
        if (withFins) {
          // Grid fins near the top and folded landing legs at the bottom
          const fin = own(new THREE.BoxGeometry(radius * 0.75, radius * 0.55, 0.012));
          const leg = own(new THREE.BoxGeometry(radius * 0.22, h * 0.16, radius * 0.08));
          for (let index = 0; index < 4; index += 1) {
            const angle = (index / 4) * Math.PI * 2 + Math.PI / 4;
            const finMesh = new THREE.Mesh(fin, material.black);
            finMesh.position.set(x + Math.cos(angle) * radius * 1.3, top - h * 0.03, Math.sin(angle) * radius * 1.3);
            finMesh.rotation.y = -angle + Math.PI / 2;
            group.add(finMesh);
            const legMesh = new THREE.Mesh(leg, material.black);
            legMesh.position.set(x + Math.cos(angle) * radius * 1.02, h * 0.1, Math.sin(angle) * radius * 1.02);
            legMesh.rotation.y = -angle;
            group.add(legMesh);
          }
        }
        engines(radius, 9, x, 0.28);
      };
      core(0, h * 0.6, true);
      stage(radius * 1.01, h * 0.6, h * 0.67, interstage);
      stage(radius, h * 0.67, h * 0.78, secondStage);
      stage(radius * 1.18, h * 0.78, h * 0.84, fairing);
      // Short taper between the narrow stage and the wide fairing
      const taper = new THREE.Mesh(own(new THREE.CylinderGeometry(radius * 1.18, radius, h * 0.025, 32)), fairing);
      taper.position.y = h * 0.7675;
      group.add(taper);
      nose(radius * 1.18, h * 0.84, h * 0.16, fairing);
      width = radius * 1.3;
      if (style === 'heavy') {
        // Two side boosters (copies of the first stage) with nose cones, held by struts
        for (const side of [-1, 1]) {
          const x = side * radius * 2.08;
          core(x, h * 0.6, true);
          stage(radius * 1.01, h * 0.6, h * 0.63, interstage, x);
          nose(radius, h * 0.63, h * 0.09, interstage, x);
          for (const y of [h * 0.12, h * 0.55]) {
            const strut = new THREE.Mesh(cylinder, material.grey);
            strut.scale.set(0.012, radius * 0.2, 0.012);
            strut.rotation.z = Math.PI / 2;
            strut.position.set(side * radius * 1.04, y, 0);
            group.add(strut);
          }
        }
        width = radius * 3.1;
      }
      break;
    }
    default: {
      // Super heavy: orange foam core tank, two long white solid boosters with segment joints,
      // a white upper stage and a capsule with its escape tower
      radius = 0.15 + h * 0.045;
      const foam = painted({ base: '#d8742c', foam: true, seams: 4, seamColor: 'rgba(90,35,5,0.35)', soot: 0.12, seed: 21 }, { metalness: 0.02, roughness: 0.85, bumpScale: 1.2 });
      const booster = painted({
        base: '#f1efe9', seams: 0, seed: 22, soot: 0.15,
        bands: [[0.2, 0.215, '#1d1d22'], [0.4, 0.41, 'rgba(0,0,0,0.35)'], [0.6, 0.61, 'rgba(0,0,0,0.35)'], [0.8, 0.81, 'rgba(0,0,0,0.35)']],
      });
      const upper = painted({ base: '#f3f1ec', seams: 2, raceway: true, seed: 23 });
      skirt(radius, h * 0.05, material.white);
      stage(radius, h * 0.05, h * 0.62, foam);
      stage(radius * 0.92, h * 0.62, h * 0.66, upper);
      stage(radius * 0.7, h * 0.66, h * 0.76, upper);
      const adapter = new THREE.Mesh(own(new THREE.CylinderGeometry(radius * 0.55, radius * 0.7, h * 0.03, 28)), material.white);
      adapter.position.y = h * 0.775;
      group.add(adapter);
      const capsule = new THREE.Mesh(own(new THREE.CylinderGeometry(radius * 0.3, radius * 0.55, h * 0.06, 28)), material.grey);
      capsule.position.y = h * 0.82;
      group.add(capsule);
      nose(radius * 0.3, h * 0.85, h * 0.06, material.white);
      // Launch escape tower: a thin lattice spike with a small motor at the top
      const tower = new THREE.Mesh(cylinder, material.grey);
      tower.scale.set(0.012, h * 0.08, 0.012);
      tower.position.y = h * 0.95;
      group.add(tower);
      const motor = new THREE.Mesh(cylinder, material.white);
      motor.scale.set(0.03, h * 0.025, 0.03);
      motor.position.y = h * 0.98;
      group.add(motor);
      engines(radius, 4, 0, 0.3);
      for (const side of [-1, 1]) {
        const x = side * radius * 1.55;
        skirt(radius * 0.45, h * 0.06, material.white, x);
        stage(radius * 0.45, h * 0.06, h * 0.6, booster, x);
        nose(radius * 0.45, h * 0.6, h * 0.07, material.white, x);
        engines(radius * 0.9, 1, x);
        for (const y of [h * 0.1, h * 0.55]) {
          const strut = new THREE.Mesh(cylinder, material.grey);
          strut.scale.set(0.015, radius * 0.18, 0.015);
          strut.rotation.z = Math.PI / 2;
          strut.position.set(side * radius * 1.03, y, 0);
          group.add(strut);
        }
      }
      width = radius * 2.1;
      break;
    }
  }

  // Exhaust: a hot white core, an orange plume and a soft outer glow (additive, so they light up)
  const flame = new THREE.Group();
  const plumeWidth = style === 'heavy' || style === 'super-heavy' ? width * 1.1 : radius * 1.6;
  const plume = (scaleWidth, length, color, opacity, offset) => {
    const item = new THREE.Mesh(
      own(new THREE.ConeGeometry(plumeWidth * scaleWidth, length, 24, 1, true)),
      own(new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })),
    );
    item.rotation.x = Math.PI;
    item.position.y = -length / 2 - offset;
    flame.add(item);
  };
  plume(1.35, h * 0.6, 0xff6a1a, 0.25, radius * 0.4);
  plume(1, h * 0.45, 0xff9a3a, 0.5, radius * 0.4);
  plume(0.45, h * 0.26, 0xfff3cf, 0.9, radius * 0.45);
  const glow = new THREE.PointLight(0xffa04a, 0, 8, 1.5);
  glow.position.y = -h * 0.1;
  flame.add(glow);
  flame.visible = false;
  flame.userData.glow = glow;
  group.add(flame);

  group.userData = { flame, height, radius, width, style, disposables };
  return group;
}
