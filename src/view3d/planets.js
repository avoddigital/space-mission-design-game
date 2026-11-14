// Earth, Moon and Mars for the 3D scenes.
// Uses small public-domain images (credits below and in the README). While an image loads,
// or if it fails, the planet shows colors drawn in code, so the scene never breaks.
// Add ?planets=drawn to the address to force the drawn look (useful to compare).
//
// Texture credits (public domain):
// - Earth: NASA/Goddard Space Flight Center Scientific Visualization Studio, Blue Marble (svs.gsfc.nasa.gov/3615), resized to 1024x512.
// - Moon: NASA's Scientific Visualization Studio, CGI Moon Kit, LRO data (svs.gsfc.nasa.gov/4720).
// - Mars: NASA/JPL/USGS, Viking global color mosaic (USGS Astrogeology).

import * as THREE from 'three';
import earthUrl from '../assets/textures/earth_1k.jpg';
import moonUrl from '../assets/textures/moon_1k.jpg';
import marsUrl from '../assets/textures/mars_1k.jpg';

const PHOTO_URLS = { earth: earthUrl, moon: moonUrl, mars: marsUrl };

const drawn = new Map(); // kind -> texture drawn in code
const photos = new Map(); // kind -> { texture, loaded, failed, waiting: Set<material> }

/** Small seeded generator so the drawn planets look the same every time. */
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

function drawnTexture(kind) {
  if (!drawn.has(kind)) drawn.set(kind, drawTexture(kind));
  return drawn.get(kind);
}

function photosDisabled() {
  try {
    return new URLSearchParams(globalThis.location?.search ?? '').get('planets') === 'drawn';
  } catch {
    return false;
  }
}

/** Start loading the photo once; materials waiting for it switch when it arrives. */
function photoFor(kind) {
  if (!photos.has(kind)) {
    const entry = { texture: null, loaded: false, failed: false, waiting: new Set() };
    photos.set(kind, entry);
    entry.texture = new THREE.TextureLoader().load(
      PHOTO_URLS[kind],
      () => {
        entry.loaded = true;
        entry.waiting.forEach((material) => {
          material.map = entry.texture;
          material.needsUpdate = true;
        });
        entry.waiting.clear();
      },
      undefined,
      () => {
        entry.failed = true; // keep the drawn look
        entry.waiting.clear();
      },
    );
    entry.texture.colorSpace = THREE.SRGBColorSpace;
  }
  return photos.get(kind);
}

/** A planet sphere. Textures are loaded or drawn once and reused. */
export function createPlanet(kind, radius) {
  const material = new THREE.MeshStandardMaterial({ map: drawnTexture(kind), roughness: 0.9, metalness: 0 });
  if (!photosDisabled() && PHOTO_URLS[kind]) {
    const photo = photoFor(kind);
    if (photo.loaded) material.map = photo.texture;
    else if (!photo.failed) photo.waiting.add(material);
  }
  const planet = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32), material);
  planet.userData.kind = kind;
  return planet;
}

export function disposePlanetTextures() {
  drawn.forEach((texture) => texture.dispose());
  drawn.clear();
  photos.forEach((entry) => entry.texture?.dispose());
  photos.clear();
}
