// Earth, Moon and Mars with colors drawn in code (no image files to download).
// Simplified look, not real maps. Option to test later: NASA public-domain textures.

import * as THREE from 'three';

const textures = new Map();

/** Small seeded generator so the planets look the same every time. */
function seeded(seed) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

const LOOKS = {
  earth: { base: '#1f5fa8', spots: ['#2f8f4e', '#3a9d55', '#8a7a4a'], spotCount: 26, spotSize: [10, 30], poles: '#f2f6fa', seed: 7 },
  moon: { base: '#9a9a9a', spots: ['#7d7d7d', '#b3b3b3', '#6c6c6c'], spotCount: 60, spotSize: [3, 12], poles: null, seed: 11 },
  mars: { base: '#b5532f', spots: ['#8e3b22', '#c8703f', '#7a3320'], spotCount: 40, spotSize: [6, 22], poles: '#f4e9e1', seed: 23 },
};

function drawTexture(kind) {
  const look = LOOKS[kind];
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  const random = seeded(look.seed);
  context.fillStyle = look.base;
  context.fillRect(0, 0, canvas.width, canvas.height);
  for (let index = 0; index < look.spotCount; index += 1) {
    const [min, max] = look.spotSize;
    context.fillStyle = look.spots[index % look.spots.length];
    context.beginPath();
    context.ellipse(random() * 256, 16 + random() * 96, min + random() * (max - min), (min + random() * (max - min)) * 0.6, random() * Math.PI, 0, Math.PI * 2);
    context.fill();
  }
  if (look.poles) {
    context.fillStyle = look.poles;
    context.fillRect(0, 0, 256, 7);
    context.fillRect(0, 121, 256, 7);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** A planet sphere. Textures are drawn once and reused. */
export function createPlanet(kind, radius) {
  if (!textures.has(kind)) textures.set(kind, drawTexture(kind));
  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 40, 24),
    new THREE.MeshStandardMaterial({ map: textures.get(kind), roughness: 0.9, metalness: 0 }),
  );
  planet.userData.kind = kind;
  return planet;
}

export function disposePlanetTextures() {
  textures.forEach((texture) => texture.dispose());
  textures.clear();
}
