// Launch pad for the 3D launch scene, made in code (no imported models), loosely inspired by
// real pads: a concrete apron with a flame trench, a launch mount, a lattice service tower with
// swing arms, lightning masts, a water tower and propellant tanks. Simplified, no logos.
// Read-only: it never decides game rules.

import * as THREE from 'three';

/** Painted concrete: light grey with stains, expansion joints and a scorched centre. */
function concreteTexture() {
  if (typeof document === 'undefined') return null;
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  let value = 17;
  const random = () => ((value = (value * 1664525 + 1013904223) % 4294967296) / 4294967296);
  context.fillStyle = '#8d8e8a';
  context.fillRect(0, 0, size, size);
  for (let index = 0; index < 500; index += 1) {
    context.fillStyle = random() < 0.5 ? 'rgba(60,60,58,0.06)' : 'rgba(200,200,195,0.06)';
    context.beginPath();
    context.arc(random() * size, random() * size, 4 + random() * 22, 0, Math.PI * 2);
    context.fill();
  }
  context.strokeStyle = 'rgba(40,40,40,0.25)';
  context.lineWidth = 1;
  for (let line = 32; line < size; line += 64) {
    context.beginPath();
    context.moveTo(line, 0);
    context.lineTo(line, size);
    context.moveTo(0, line);
    context.lineTo(size, line);
    context.stroke();
  }
  const scorch = context.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size * 0.32);
  scorch.addColorStop(0, 'rgba(25,22,20,0.85)');
  scorch.addColorStop(1, 'rgba(25,22,20,0)');
  context.fillStyle = scorch;
  context.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/**
 * @param {{ height: number, radius: number, width: number }} rocket sizes from createRocket's userData
 * @param {{ planetRadius?: number }} [options] radius of the Earth sphere below, so the ground follows its curve
 * @returns {THREE.Group} origin = where the rocket's base stands. userData: { arms, beacon, disposables, ground }
 */
export function createLaunchPad({ height, radius, width }, { planetRadius = 8 } = {}) {
  const disposables = [];
  const own = (item) => {
    if (item) disposables.push(item);
    return item;
  };
  const concreteMap = own(concreteTexture());
  const material = {
    concrete: own(new THREE.MeshStandardMaterial({ color: 0xffffff, map: concreteMap, roughness: 0.95, metalness: 0, envMapIntensity: 0.3 })),
    darkConcrete: own(new THREE.MeshStandardMaterial({ color: 0x55565a, roughness: 0.95 })),
    trench: own(new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 1 })),
    steel: own(new THREE.MeshStandardMaterial({ color: 0xb4532f, metalness: 0.45, roughness: 0.55 })), // painted red-orange like real pad towers
    grey: own(new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.7, roughness: 0.4 })),
    white: own(new THREE.MeshStandardMaterial({ color: 0xeeeeea, metalness: 0.1, roughness: 0.5 })),
    beacon: own(new THREE.MeshBasicMaterial({ color: 0xff3b2f })),
    wire: own(new THREE.LineBasicMaterial({ color: 0x2a2a2a, transparent: true, opacity: 0.7 })),
  };
  const box = own(new THREE.BoxGeometry(1, 1, 1));
  const cylinder = own(new THREE.CylinderGeometry(1, 1, 1, 24));
  const sphere = own(new THREE.SphereGeometry(1, 20, 14));
  const pad = new THREE.Group();

  const block = (parent, mat, size, position) => {
    const item = new THREE.Mesh(box, mat);
    item.scale.set(...size);
    item.position.set(...position);
    parent.add(item);
    return item;
  };

  // Launch mount: a square table over the flame trench, standing on four pillars
  const mountHeight = 0.18;
  const table = Math.max(0.5, width * 2.1);
  block(pad, material.darkConcrete, [table, 0.05, table], [0, -0.025, 0]);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    block(pad, material.darkConcrete, [0.08, mountHeight, 0.08], [(x * table) / 2.4, -mountHeight / 2 - 0.05, (z * table) / 2.4]);
  }
  // Hold-down clamps around the base (they let go at liftoff)
  for (let index = 0; index < 4; index += 1) {
    const angle = (index / 4) * Math.PI * 2 + Math.PI / 4;
    block(pad, material.grey, [0.05, 0.06, 0.05], [Math.cos(angle) * (width + 0.04), 0.03, Math.sin(angle) * (width + 0.04)]);
  }

  // Concrete apron with the trench running toward the back
  const ground = -mountHeight - 0.05;
  // Height of the ground at (x, z): the pad sits on a big sphere (the Earth), so the ground curves away
  const surfaceY = (x, z) => ground - (x * x + z * z) / (2 * planetRadius);

  // Concrete area: a thin cap of a sphere just above the Earth, with the texture laid flat from above
  const apronRadius = 1.8;
  const capGeometry = own(new THREE.SphereGeometry(planetRadius + 0.004, 64, 6, 0, Math.PI * 2, 0, Math.asin(apronRadius / planetRadius)));
  const positions = capGeometry.attributes.position;
  const uv = capGeometry.attributes.uv;
  for (let index = 0; index < positions.count; index += 1) {
    uv.setXY(index, positions.getX(index) / (2 * apronRadius) + 0.5, positions.getZ(index) / (2 * apronRadius) + 0.5);
  }
  const apron = new THREE.Mesh(capGeometry, material.concrete);
  apron.position.y = ground - planetRadius;
  pad.add(apron);
  block(pad, material.trench, [table * 0.7, 0.02, 1.4], [0, surfaceY(0, -0.7) + 0.008, -0.7]);

  // Service tower: four legs, a ring every level, X braces on the faces, a crane and a lightning mast on top
  const towerHeight = height * 0.95;
  const towerSide = 0.24;
  const tower = new THREE.Group();
  tower.position.set(-(width + 0.3), 0, -0.05);
  tower.position.y = surfaceY(tower.position.x, tower.position.z);
  pad.add(tower);
  const half = towerSide / 2;
  const beams = [];
  for (const [x, z] of [[-half, -half], [half, -half], [-half, half], [half, half]]) {
    beams.push({ from: [x, 0, z], to: [x, towerHeight, z], thick: 0.022 });
  }
  const level = 0.16;
  for (let y = level; y < towerHeight; y += level) {
    for (const [a, b] of [[[-half, -half], [half, -half]], [[half, -half], [half, half]], [[half, half], [-half, half]], [[-half, half], [-half, -half]]]) {
      beams.push({ from: [a[0], y, a[1]], to: [b[0], y, b[1]], thick: 0.012 });
    }
    // X braces on the front and the side facing the rocket
    beams.push({ from: [-half, y - level, half], to: [half, y, half], thick: 0.008 });
    beams.push({ from: [half, y - level, half], to: [-half, y, half], thick: 0.008 });
    beams.push({ from: [half, y - level, -half], to: [half, y, half], thick: 0.008 });
    beams.push({ from: [half, y - level, half], to: [half, y, -half], thick: 0.008 });
  }
  // One instanced mesh draws every beam in a single call (fast on weak laptops)
  const lattice = new THREE.InstancedMesh(box, material.steel, beams.length);
  const matrix = new THREE.Matrix4();
  const up = new THREE.Vector3(0, 1, 0);
  beams.forEach((beam, index) => {
    const from = new THREE.Vector3(...beam.from);
    const to = new THREE.Vector3(...beam.to);
    const direction = to.clone().sub(from);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction.clone().normalize());
    matrix.compose(from.clone().add(to).multiplyScalar(0.5), quaternion, new THREE.Vector3(beam.thick, direction.length(), beam.thick));
    lattice.setMatrixAt(index, matrix);
  });
  tower.add(lattice);
  // Hammerhead crane and lightning mast at the top
  block(tower, material.steel, [0.5, 0.04, 0.05], [0.12, towerHeight + 0.03, 0]);
  const mast = new THREE.Mesh(cylinder, material.grey);
  mast.scale.set(0.008, 0.45, 0.008);
  mast.position.y = towerHeight + 0.25;
  tower.add(mast);
  const beacon = new THREE.Mesh(sphere, material.beacon);
  beacon.scale.setScalar(0.02);
  beacon.position.y = towerHeight + 0.48;
  tower.add(beacon);

  // Swing arms: crew access arm with a white room near the top, two fuel lines lower down.
  // Each arm turns around its hinge on the tower, so the launch scene can swing it away.
  const coreReach = width + 0.3 - half - radius * 0.95; // to the central core
  const hasBoosters = width > radius * 1.5;
  const arms = [];
  for (const [share, kind] of [[0.82, 'crew'], [0.6, 'fuel'], [0.3, 'fuel']]) {
    // Lower arms stop at the side boosters when the rocket has them
    const reach = kind === 'fuel' && hasBoosters ? 0.3 - half + 0.02 : coreReach;
    const hinge = new THREE.Group();
    hinge.position.set(half, towerHeight * share, 0.05);
    block(hinge, material.steel, [reach, 0.035, 0.06], [reach / 2, 0, 0]);
    if (kind === 'crew') block(hinge, material.white, [0.1, 0.09, 0.1], [reach - 0.04, 0.03, 0]);
    else {
      const hose = new THREE.Mesh(cylinder, material.grey);
      hose.scale.set(0.012, 0.12, 0.012);
      hose.position.set(reach - 0.02, -0.07, 0);
      hinge.add(hose);
    }
    tower.add(hinge);
    arms.push(hinge);
  }

  // Lightning masts on both sides, with wires to the tower top (they protect the rocket from lightning)
  const masts = [[width + 0.9, -0.9], [-(width + 0.3), -1.3]];
  const wirePoints = [];
  for (const [x, z] of masts) {
    const pole = new THREE.Mesh(cylinder, material.grey);
    pole.scale.set(0.015, height * 1.15, 0.015);
    pole.position.set(x, surfaceY(x, z) + (height * 1.15) / 2, z);
    pad.add(pole);
    wirePoints.push(new THREE.Vector3(x, surfaceY(x, z) + height * 1.15, z), new THREE.Vector3(tower.position.x, tower.position.y + towerHeight + 0.45, tower.position.z));
  }
  const wires = new THREE.LineSegments(own(new THREE.BufferGeometry().setFromPoints(wirePoints)), material.wire);
  pad.add(wires);

  // Water tower (water floods the pad at liftoff to soak up the sound) and two round propellant tanks
  const water = new THREE.Group();
  water.position.set(width + 1.15, 0, -1.0);
  water.position.y = surfaceY(water.position.x, water.position.z);
  for (const [x, z] of [[-0.08, -0.08], [0.08, -0.08], [-0.08, 0.08], [0.08, 0.08]]) block(water, material.grey, [0.015, 0.7, 0.015], [x, 0.35, z]);
  const tank = new THREE.Mesh(sphere, material.white);
  tank.scale.set(0.2, 0.17, 0.2);
  tank.position.y = 0.82;
  water.add(tank);
  pad.add(water);
  for (const [x, z] of [[-(width + 0.95), 0.75], [-(width + 1.3), 0.35]]) {
    const store = new THREE.Mesh(sphere, material.white);
    store.scale.setScalar(0.17);
    store.position.set(x, surfaceY(x, z) + 0.17, z);
    pad.add(store);
  }

  pad.userData = { arms, beacon, disposables, ground };
  return pad;
}
