// 3D scene for the title screen and the campaign command center:
// Earth seen from space, with the Moon and Mars appearing as the agency unlocks them.
// Read-only: it receives which destinations are open and which one is next. Scene units, not kilometers.

import * as THREE from 'three';
import { createPlanet } from './planets.js';

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
  mars.position.set(10, 1.2, -9);
  const markers = { moon: marker(0.5), mars: marker(0.9), earth: marker(2) };
  moon.add(markers.moon);
  mars.add(markers.mars);
  earth.add(markers.earth);
  // Light grey ghosts for places not reached yet.
  const lockedMaterial = new THREE.MeshStandardMaterial({ color: 0x3a423f, roughness: 1, transparent: true, opacity: 0.55 });
  const openMaterial = { moon: moon.material, mars: mars.material };
  scene.add(earth, moonPivot, moonPath, mars);

  let target = 'earth';
  let time = 0;
  let key = '';

  return {
    scene,
    camera,

    /**
     * @param {{ unlocked?: string[], target?: string|null }} params destinations open (earth, moon, mars) and the next one
     */
    set({ unlocked = ['earth'], target: next = 'earth' } = {}) {
      const nextKey = `${unlocked.join(',')}|${next}`;
      if (nextKey === key) return;
      key = nextKey;
      target = next;
      for (const kind of ['moon', 'mars']) {
        const body = kind === 'moon' ? moon : mars;
        body.material = unlocked.includes(kind) ? openMaterial[kind] : lockedMaterial;
      }
      moonPath.visible = unlocked.includes('moon');
      for (const [kind, mesh] of Object.entries(markers)) mesh.visible = kind === target;
      // Frame the whole system once Mars is in play, otherwise stay close to Earth.
      if (unlocked.includes('mars') || target === 'mars') camera.position.set(3, 5, 19);
      else if (unlocked.includes('moon') || target === 'moon') camera.position.set(0.5, 3.4, 12.5);
      else camera.position.set(0, 1.4, 10.5);
      camera.lookAt(unlocked.includes('mars') || target === 'mars' ? new THREE.Vector3(3, 0, -2) : new THREE.Vector3(0, 0, 0));
    },

    update(dt) {
      if (reducedMotion()) return;
      time += dt;
      earth.rotation.y += dt * 0.12;
      moonPivot.rotation.y += dt * 0.08;
      mars.rotation.y += dt * 0.1;
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
      stars.geometry.dispose();
      stars.material.dispose();
      key = '';
    },
  };
}
