// 3D scene for the title screen and the campaign command center:
// Earth seen from space, with the Moon and Mars appearing as the agency unlocks them.
// Read-only: it receives which destinations are open and which one is next. Scene units, not kilometers.

import * as THREE from 'three';
import { createPlanet } from './planets.js';
import { PLACES, surfacePoint, turnToFace } from './places.js';

const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

function starfield() {
  let value = 7;
  const random = () => ((value = (value * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const positions = [];
  for (let index = 0; index < 600; index += 1) {
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    positions.push(70 * Math.sin(phi) * Math.cos(theta), 70 * Math.sin(phi) * Math.sin(theta), 70 * Math.cos(phi));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xe8e4d6, size: 0.14, sizeAttenuation: true }));
}

/** A thin ring to show a path (the Moon's orbit). */
function ring(radius, color, opacity) {
  const geometry = new THREE.TorusGeometry(radius, 0.012, 6, 160);
  const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

/** Marks the next destination: an amber ring that slowly pulses. */
function marker(radius) {
  const geometry = new THREE.RingGeometry(radius * 1.22, radius * 1.26, 64);
  const material = new THREE.MeshBasicMaterial({ color: 0xffbe55, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
  return new THREE.Mesh(geometry, material);
}

/** Soft round glow (amber), drawn once, for the agency's home region. */
function regionTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,214,120,0.95)');
  gradient.addColorStop(0.55, 'rgba(255,190,85,0.55)');
  gradient.addColorStop(1, 'rgba(255,170,60,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** A beam of light that fades as it rises (bottom bright, top clear). */
function beamTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 64, 0, 0);
  gradient.addColorStop(0, 'rgba(255,214,120,0.9)');
  gradient.addColorStop(1, 'rgba(255,214,120,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 4, 64);
  return new THREE.CanvasTexture(canvas);
}

/**
 * Highlight for the agency's home: a glow over the region, a pulsing ring and a beam of light.
 * It is a child of the Earth, so it turns with it.
 */
function homeHighlight() {
  const group = new THREE.Group();
  const additive = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide };
  const patch = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ map: regionTexture(), ...additive }));
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 64), new THREE.MeshBasicMaterial({ color: 0xffbe55, opacity: 0.9, ...additive }));
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.03, 1, 12, 1, true), new THREE.MeshBasicMaterial({ map: beamTexture(), ...additive }));
  group.add(patch, ring, beam);
  group.visible = false;
  group.userData = { patch, ring, beam };
  return group;
}

/**
 * @returns {{ scene: THREE.Scene, camera: THREE.PerspectiveCamera, set: Function, update: Function, dispose: Function }}
 */
export function createGlobe() {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x0b1020, 0.55));
  const sun = new THREE.DirectionalLight(0xffffff, 2.6);
  sun.position.set(-8, 3, 6);
  scene.add(sun);
  const stars = starfield();
  scene.add(stars);
  const camera = new THREE.PerspectiveCamera(40, 4 / 3, 0.1, 200);

  const earth = createPlanet('earth', 2);
  const moon = createPlanet('moon', 0.5);
  const mars = createPlanet('mars', 0.9);
  const moonPath = ring(4.2, 0x8ec5ff, 0.25);
  const moonPivot = new THREE.Group();
  moonPivot.add(moon);
  moon.position.set(4.2, 0, 0);
  // The Moon always shows the same face to Earth (it turns once per orbit). As a child of the
  // orbit pivot it turns with it; this angle puts the near side (longitude 0) toward Earth.
  const MOON_FACING_EARTH = Math.PI;
  moon.rotation.y = MOON_FACING_EARTH;
  mars.position.set(10, 1.2, -9);
  const markers = { moon: marker(0.5), mars: marker(0.9), earth: marker(2) };
  moon.add(markers.moon);
  mars.add(markers.mars);
  earth.add(markers.earth);
  // Light grey ghosts for places not reached yet.
  const lockedMaterial = new THREE.MeshStandardMaterial({ color: 0x3a423f, roughness: 1, transparent: true, opacity: 0.55 });
  const openMaterial = { moon: moon.material, mars: mars.material };
  scene.add(earth, moonPivot, moonPath, mars);
  // The agency's home region (chosen on the new agency screen), highlighted on the Earth
  const home = homeHighlight();
  earth.add(home);
  let homeTurn = null; // Earth rotation that brings the home region in front of the camera

  let target = 'earth';
  let time = 0;
  let key = '';

  // Mouse and touch: drag turns and tilts the body under the pointer (Earth, Moon or Mars), the wheel
  // zooms. After a few quiet seconds each body settles back (tilt to level, then its usual motion:
  // the Earth back to the home region or its slow spin, Mars its spin, the Moon its orbit).
  const IDLE_SECONDS = 3;
  const bodies = {
    earth: { mesh: earth, idle: Infinity, spin: 0 },
    moon: { mesh: moon, idle: Infinity, spin: 0 },
    mars: { mesh: mars, idle: Infinity, spin: 0 },
  };
  let active = bodies.earth; // the body the player is turning
  let held = false;
  let zoom = 1;
  const raycaster = new THREE.Raycaster();
  const baseCamera = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();
  const placeCamera = () => {
    camera.position.copy(lookTarget).addScaledVector(baseCamera.clone().sub(lookTarget), zoom);
    camera.lookAt(lookTarget);
  };

  return {
    scene,
    camera,

    /**
     * @param {{ unlocked?: string[], target?: string|null, home?: string|null }} params destinations open (earth, moon, mars),
     *   the next one, and the agency's country id (src/data/campaign.js) to highlight
     */
    set({ unlocked = ['earth'], target: next = 'earth', home: homeId = null } = {}) {
      const nextKey = `${unlocked.join(',')}|${next}|${homeId}`;
      if (nextKey === key) return;
      key = nextKey;
      target = next;
      bodies.earth.idle = Infinity; // a new choice (like another country) shows right away, even after a drag
      zoom = 1;
      for (const kind of ['moon', 'mars']) {
        const body = kind === 'moon' ? moon : mars;
        body.material = unlocked.includes(kind) ? openMaterial[kind] : lockedMaterial;
        // A locked place is a grey ghost: no atmosphere glow until it opens
        body.children.forEach((child) => {
          if (child.material?.isShaderMaterial) child.visible = unlocked.includes(kind);
        });
      }
      moonPath.visible = unlocked.includes('moon');
      for (const [kind, mesh] of Object.entries(markers)) mesh.visible = kind === target;
      // Frame the whole system once Mars is in play, otherwise stay close to Earth.
      if (unlocked.includes('mars') || target === 'mars') baseCamera.set(3, 5, 19);
      else if (unlocked.includes('moon') || target === 'moon') baseCamera.set(0.5, 3.4, 12.5);
      else baseCamera.set(0, 1.4, 10.5);
      lookTarget.copy(unlocked.includes('mars') || target === 'mars' ? new THREE.Vector3(3, 0, -2) : new THREE.Vector3(0, 0, 0));
      placeCamera();

      // Home region: place the glow on the country and turn the Earth to show it
      const place = PLACES[homeId];
      home.visible = Boolean(place);
      homeTurn = null;
      if (place) {
        const point = surfacePoint(place.lat, place.lon, 1);
        const normal = new THREE.Vector3(point.x, point.y, point.z);
        const size = 2 * Math.sin((Math.max(2.5, place.size) * Math.PI) / 180) * 1.15;
        const { patch, ring, beam } = home.userData;
        for (const item of [patch, ring]) {
          item.position.copy(normal).multiplyScalar(2.012);
          item.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal); // lie flat on the surface, facing out (in the Earth's own space)
          item.scale.setScalar(size);
        }
        beam.position.copy(normal).multiplyScalar(2 + 0.45);
        beam.scale.set(1, 0.9, 1);
        beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
        homeTurn = turnToFace(place.lat, place.lon, Math.atan2(camera.position.z, camera.position.x));
        if (reducedMotion()) earth.rotation.y = homeTurn;
      }
    },

    /** Drag by (dx, dy) pixels: turn the Earth left and right, tilt it up and down (limited). */
    /**
     * Start a drag at a point of the view (-1 to 1 on both axes, like WebGL): it grabs the body under
     * the pointer. A drag that starts on empty space turns the Earth.
     */
    grab(x, y) {
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const hit = raycaster.intersectObjects([earth, moon, mars], false)[0];
      active = Object.values(bodies).find((body) => body.mesh === hit?.object) ?? bodies.earth;
    },

    drag(dx, dy) {
      held = true;
      active.idle = 0;
      // Smaller bodies turn a little faster per pixel, so they feel the same under the hand
      const speed = active === bodies.earth ? 0.008 : 0.016;
      active.spin = dx * speed;
      active.mesh.rotation.y += active.spin;
      active.mesh.rotation.x = Math.max(-0.9, Math.min(0.9, active.mesh.rotation.x + dy * speed * 0.75)); // the surface follows the pointer
    },

    /** Let go: the body keeps turning a little (flick), then slows down. */
    release() {
      held = false;
      active.idle = 0;
    },

    /** Mouse wheel: positive zooms out, negative zooms in. */
    zoomBy(delta) {
      bodies.earth.idle = 0;
      zoom = Math.max(0.55, Math.min(1.8, zoom * (1 + delta * 0.001)));
      placeCamera();
    },

    update(dt) {
      for (const body of Object.values(bodies)) {
        body.idle += dt;
        if ((!held || body !== active) && Math.abs(body.spin) > 0.0001) {
          body.mesh.rotation.y += body.spin;
          body.spin *= reducedMotion() ? 0 : 0.92;
        }
        if (body.idle > IDLE_SECONDS) body.mesh.rotation.x += (0 - body.mesh.rotation.x) * Math.min(1, dt * 2); // level again
      }
      if (reducedMotion()) return;
      time += dt;
      const settled = bodies.earth.idle > IDLE_SECONDS;
      if (!settled) {
        // The player is looking around: no automatic turning
      } else if (homeTurn === null) earth.rotation.y += dt * 0.12;
      else {
        // Turn the short way round to the home region, then hold it there
        const gap = Math.atan2(Math.sin(homeTurn - earth.rotation.y), Math.cos(homeTurn - earth.rotation.y));
        earth.rotation.y += gap * Math.min(1, dt * 2.5);
      }
      if (homeTurn !== null) {
        const { ring, patch } = home.userData;
        const beat = (time * 0.8) % 1;
        ring.scale.setScalar(patch.scale.x * (0.6 + beat * 0.9));
        ring.material.opacity = 0.9 * (1 - beat);
      }
      // Orbits and spins never stop, even while the player turns a body: the Moon keeps going round
      // the Earth and Mars keeps spinning. A drag only adds a turn on top.
      moonPivot.rotation.y += dt * 0.08;
      mars.rotation.y += dt * 0.1;
      // After a drag, the Moon turns back to show its near side to Earth again
      if (bodies.moon.idle > IDLE_SECONDS) {
        const gap = Math.atan2(Math.sin(MOON_FACING_EARTH - moon.rotation.y), Math.cos(MOON_FACING_EARTH - moon.rotation.y));
        moon.rotation.y += gap * Math.min(1, dt * 2);
      }
      stars.rotation.y += dt * 0.004;
      const pulse = 1 + 0.08 * Math.sin(time * 2.4);
      if (target) markers[target]?.scale.setScalar(pulse);
      for (const mesh of Object.values(markers)) mesh.lookAt(camera.position);
    },

    dispose() {
      for (const mesh of [earth, moon, mars]) mesh.geometry.dispose();
      for (const material of [earth.material, openMaterial.moon, openMaterial.mars, lockedMaterial]) material.dispose();
      for (const mesh of [moonPath, ...Object.values(markers)]) {
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
      home.traverse((item) => {
        if (!item.isMesh) return;
        item.geometry.dispose();
        item.material.map?.dispose();
        item.material.dispose();
      });
      stars.geometry.dispose();
      stars.material.dispose();
      key = '';
    },
  };
}
