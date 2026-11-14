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
        entry.waiting.forEach((waiter) => waiter.apply());
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

// --- Atmosphere and clouds (drawn in code, shared by every planet of the same kind) ---

const extras = { geometry: null, atmosphere: new Map(), clouds: null };

const ATMOSPHERE = {
  earth: { color: new THREE.Color(0x4f9dff), power: 1.6, strength: 0.75, scale: 1.12 },
  mars: { color: new THREE.Color(0xe08a5a), power: 1.8, strength: 0.35, scale: 1.06 },
};

/**
 * A soft glow around the edge of the planet: a slightly bigger shell, drawn from the inside,
 * bright at the planet's edge and fading to nothing at the shell's edge.
 */
function atmosphereMaterial(kind) {
  if (!extras.atmosphere.has(kind)) {
    const look = ATMOSPHERE[kind];
    extras.atmosphere.set(kind, new THREE.ShaderMaterial({
      // edge: how far "into" the shell the planet's own edge sits, seen from the camera
      uniforms: { glowColor: { value: look.color }, power: { value: look.power }, strength: { value: look.strength }, edge: { value: Math.sqrt(1 - 1 / look.scale ** 2) } },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          vec4 world = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vView = normalize(-world.xyz);
          gl_Position = projectionMatrix * world;
        }`,
      fragmentShader: `
        uniform vec3 glowColor;
        uniform float power;
        uniform float strength;
        uniform float edge;
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          float glow = pow(clamp(-dot(vNormal, vView) / edge, 0.0, 1.0), power) * strength;
          gl_FragColor = vec4(glowColor * glow, glow);
        }`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    }));
  }
  return extras.atmosphere.get(kind);
}

/** Value noise, a few layers deep, for the cloud cover. */
function cloudTexture() {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  const random = seeded(99);
  const columns = 193;
  const grid = Array.from({ length: columns * 97 }, () => random());
  const smooth = (value) => value * value * (3 - 2 * value);
  // Noise that repeats every `period` cells across, so the clouds have no seam around the globe.
  const noise = (x, y, period) => {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const at = (cx, cy) => grid[Math.min(96, cy) * columns + (cx % period)];
    const fx = smooth(x - x0);
    const fy = smooth(y - y0);
    const top = at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx;
    const bottom = at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx;
    return top * (1 - fy) + bottom * fy;
  };
  const image = context.createImageData(width, height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let value = 0;
      let amplitude = 0.55;
      for (let octave = 0; octave < 5; octave += 1) {
        const cells = 12 * 2 ** octave;
        value += amplitude * noise((x / width) * cells, (y / height) * (cells / 2), cells);
        amplitude *= 0.5;
      }
      const alpha = Math.max(0, Math.min(1, (value - 0.55) * 3));
      const index = (y * width + x) * 4;
      image.data[index] = image.data[index + 1] = image.data[index + 2] = 255;
      image.data[index + 3] = Math.round(alpha * 200);
    }
  }
  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

function cloudMaterial() {
  if (!extras.clouds) {
    extras.clouds = new THREE.MeshStandardMaterial({ map: cloudTexture(), transparent: true, depthWrite: false, roughness: 1, metalness: 0, envMapIntensity: 0 });
  }
  return extras.clouds;
}

function unitSphere() {
  extras.geometry ??= new THREE.SphereGeometry(1, 48, 32);
  return extras.geometry;
}

/**
 * A planet sphere. Textures are loaded or drawn once and reused.
 * @param {number} [segments] more segments keep a very big planet (the launch scene) round at the edge
 */
export function createPlanet(kind, radius, segments = 48) {
  // envMapIntensity 0: the studio reflections are for metal parts, not for planets (keeps the night side dark).
  const material = new THREE.MeshStandardMaterial({ map: drawnTexture(kind), roughness: 0.9, metalness: 0, envMapIntensity: 0 });
  if (!photosDisabled() && PHOTO_URLS[kind]) {
    const photo = photoFor(kind);
    const useBump = kind !== 'earth'; // on the Moon and Mars, the photo's light and dark areas follow the relief
    const apply = () => {
      material.map = photo.texture;
      if (useBump) {
        material.bumpMap = photo.texture;
        material.bumpScale = kind === 'moon' ? 3 : 2;
      }
      material.needsUpdate = true;
    };
    if (photo.loaded) apply();
    else if (!photo.failed) photo.waiting.add({ apply });
  }
  const planet = new THREE.Mesh(new THREE.SphereGeometry(radius, segments, Math.round(segments * 0.66)), material);
  planet.userData.kind = kind;

  if (kind === 'earth' && typeof document !== 'undefined') {
    const clouds = new THREE.Mesh(unitSphere(), cloudMaterial());
    clouds.scale.setScalar(1.012);
    clouds.onBeforeRender = () => {
      clouds.rotation.y += 0.0004; // the weather drifts a little faster than the ground turns
    };
    planet.add(clouds);
  }
  if (ATMOSPHERE[kind]) {
    const air = new THREE.Mesh(unitSphere(), atmosphereMaterial(kind));
    air.scale.setScalar(ATMOSPHERE[kind].scale);
    planet.add(air);
  }
  // Children use a unit sphere, so scale them by the planet radius once.
  planet.children.forEach((child) => child.scale.multiplyScalar(radius));
  return planet;
}

export function disposePlanetTextures() {
  drawn.forEach((texture) => texture.dispose());
  drawn.clear();
  photos.forEach((entry) => entry.texture?.dispose());
  photos.clear();
  extras.geometry?.dispose();
  extras.geometry = null;
  extras.atmosphere.forEach((material) => material.dispose());
  extras.atmosphere.clear();
  extras.clouds?.map?.dispose();
  extras.clouds?.dispose();
  extras.clouds = null;
}
