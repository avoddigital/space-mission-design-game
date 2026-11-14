// Public API of the 3D layer (PRD 7.5). Read-only: it receives data and draws.
// It never imports src/state and never decides game rules.
// Loaded on demand with import(), so the game starts fast and works without it.

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildSpacecraft, disposeShared } from './spacecraft.js';
import { createFlight } from './flight.js';
import { createGlobe } from './globe.js';
import { disposePlanetTextures } from './planets.js';

const MAX_PIXEL_RATIO = 2;
const MAX_FRAME_MS = 100; // a background tab must not make the animation jump
const AUTO_SPIN = 0.35; // radians per second
const POP_MS = 250;

let renderer = null;
let scene = null;
let camera = null;
let craft = null;
let frame = null;
let resizeObserver = null;
let paused = false;
let lastKey = '';
let popStart = 0;
let lastTime = 0;
let dragging = null;
let lastDragAt = 0;
let flight = null;
let globe = null;
let environment = null; // soft studio reflections, so metal and foil look like metal (made in code, no image)
let mode = 'spacecraft'; // 'spacecraft' (steps 1 and 2), 'flight' (simulation) or 'globe' (menus)

const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** True when the browser can draw WebGL. */
export function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * Create the renderer and the scene. Throws if WebGL is not available,
 * so the caller can keep the 2D fallback.
 * @param {HTMLElement} [container] where to put the canvas now (it can be moved later with attach)
 */
export async function mount(container) {
  if (renderer) {
    if (container) attach(container);
    return;
  }
  if (!hasWebGL()) throw new Error('WebGL is not available');

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio ?? 1, MAX_PIXEL_RATIO));
  // Filmic tone mapping keeps bright foil and flames from turning into flat white.
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.className = 'view3d-canvas';
  renderer.domElement.setAttribute('aria-label', 'Your spacecraft in 3D. Drag to rotate.');
  renderer.domElement.setAttribute('role', 'img');

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  environment = pmrem.fromScene(room, 0.04).texture;
  room.dispose?.();
  pmrem.dispose();

  scene = new THREE.Scene();
  scene.environment = environment;
  scene.environmentIntensity = 0.55;
  scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x1a2233, 0.5));
  const sun = new THREE.DirectionalLight(0xfff4e0, 2.6);
  sun.position.set(5, 6, 4);
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x8ec5ff, 0.9); // cool light from behind outlines the craft
  rim.position.set(-4, 2, -6);
  scene.add(rim);

  camera = new THREE.PerspectiveCamera(38, 4 / 3, 0.1, 100);
  camera.position.set(5.5, 3.2, 6.5);
  camera.lookAt(0, 0, 0);

  setupDrag(renderer.domElement);
  resizeObserver = new ResizeObserver(() => resize());
  if (container) attach(container);
  startLoop();
}

/** Move the canvas into a new container (the UI re-renders its HTML, the canvas survives). */
export function attach(container) {
  if (!renderer || !container) return;
  if (renderer.domElement.parentElement !== container) {
    container.appendChild(renderer.domElement);
    resizeObserver.disconnect();
    resizeObserver.observe(container);
  }
  resize();
}

function resize() {
  const parent = renderer?.domElement.parentElement;
  if (!parent) return;
  const width = Math.max(1, parent.clientWidth);
  // On wide screens the CSS gives the slot a height (the game fits the window) and the canvas fills it.
  // On phones the slot has no height of its own, so the canvas picks one from its width.
  const fillsSlot = getComputedStyle(renderer.domElement).position === 'absolute';
  const height = fillsSlot
    ? Math.max(1, parent.clientHeight)
    : Math.round(Math.min(520, Math.max(220, width * 0.72)));
  renderer.setSize(width, height, true);
  for (const view of [camera, flight?.camera, globe?.camera].filter(Boolean)) {
    view.aspect = width / height;
    view.updateProjectionMatrix();
  }
}

/**
 * Show the spacecraft for these parts. Rebuilds only when the parts change.
 * @param {object[]} parts resolved part objects
 */
export function showSpacecraft(parts = []) {
  if (!scene) return;
  mode = 'spacecraft';
  const key = parts.map((part) => part.id).join(',');
  if (craft && key === lastKey) return;
  const rotation = craft ? craft.rotation.clone() : new THREE.Euler(0.25, -0.6, 0);
  if (craft) scene.remove(craft); // geometries and materials are shared, nothing else to free
  craft = buildSpacecraft(parts);
  craft.rotation.copy(rotation);
  scene.add(craft);
  if (lastKey !== '' || parts.length) popStart = performance.now();
  lastKey = key;
}

/**
 * Show the launch, transfer, orbit and data return for a simulation result.
 * The HTML timeline is in charge: `shown` is how many phases it has revealed.
 * @param {{ simulation: object, parts: object[], rocket?: object, orbit?: object, shown: number }} params
 */
export function showFlight(params) {
  if (!renderer || !params?.simulation) return;
  if (!flight) {
    flight = createFlight();
    flight.scene.environment = environment;
    flight.scene.environmentIntensity = 0.35;
    resize();
  }
  mode = 'flight';
  flight.set(params);
}

/**
 * Show Earth from space, with the destinations the agency has opened (title screen and command center).
 * @param {{ unlocked?: string[], target?: string|null }} params
 */
export function showGlobe(params = {}) {
  if (!renderer) return;
  if (!globe) {
    globe = createGlobe();
    resize();
  }
  mode = 'globe';
  globe.set(params);
}

export function setPaused(value) {
  paused = Boolean(value);
}

/** Stop drawing and free everything. */
export function dispose() {
  cancelAnimationFrame(frame);
  resizeObserver?.disconnect();
  renderer?.domElement.remove();
  renderer?.dispose();
  flight?.dispose();
  globe?.dispose();
  disposeShared();
  disposePlanetTextures();
  environment?.dispose();
  environment = null;
  renderer = scene = camera = craft = flight = globe = null;
  lastKey = '';
}

function startLoop() {
  const tick = (time) => {
    frame = requestAnimationFrame(tick);
    const dt = Math.min(MAX_FRAME_MS, time - (lastTime || time)) / 1000;
    lastTime = time;
    // Draw only when the canvas is on screen, the game is not paused and the tab is visible.
    if (!renderer.domElement.isConnected || paused || document.hidden) return;

    if (mode === 'globe' && globe) {
      globe.update(dt);
      renderer.render(globe.scene, globe.camera);
      return;
    }
    if (mode === 'flight' && flight) {
      flight.update(dt);
      renderer.render(flight.scene, flight.camera);
      return;
    }
    if (!craft) return;

    if (!dragging && !reducedMotion() && time - lastDragAt > 1500) craft.rotation.y += AUTO_SPIN * dt;
    const pop = popStart && !reducedMotion() ? Math.max(0, 1 - (time - popStart) / POP_MS) : 0;
    craft.scale.setScalar(1 + 0.08 * pop);
    renderer.render(scene, camera);
  };
  frame = requestAnimationFrame(tick);
}

function setupDrag(canvas) {
  canvas.style.touchAction = 'none';
  canvas.addEventListener('pointerdown', (event) => {
    if (mode !== 'spacecraft' && mode !== 'globe') return; // the flight has its own camera
    dragging = { x: event.clientX, y: event.clientY };
    if (mode === 'globe') {
      // Which body is under the pointer: the Earth, the Moon or Mars
      const rect = canvas.getBoundingClientRect();
      globe?.grab(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    }
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    if (mode === 'globe') {
      globe?.drag(event.clientX - dragging.x, event.clientY - dragging.y);
      dragging = { x: event.clientX, y: event.clientY };
      return;
    }
    if (!craft) return;
    craft.rotation.y += (event.clientX - dragging.x) * 0.01;
    craft.rotation.x = Math.max(-1, Math.min(1, craft.rotation.x + (event.clientY - dragging.y) * 0.01));
    dragging = { x: event.clientX, y: event.clientY };
    lastDragAt = performance.now();
  });
  const stop = () => {
    if (dragging && mode === 'globe') globe?.release();
    dragging = null;
    lastDragAt = performance.now();
  };
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);
  // Mouse wheel zooms the globe (only there, so the page still scrolls over the other 3D views)
  canvas.addEventListener('wheel', (event) => {
    if (mode !== 'globe' || !globe) return;
    event.preventDefault();
    globe.zoomBy(event.deltaY);
  }, { passive: false });
}
