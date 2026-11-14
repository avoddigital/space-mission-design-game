// Public API of the 3D layer (PRD 7.5). Read-only: it receives data and draws.
// It never imports src/state and never decides game rules.
// Loaded on demand with import(), so the game starts fast and works without it.

import * as THREE from 'three';
import { buildSpacecraft, disposeShared } from './spacecraft.js';

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
  renderer.domElement.className = 'view3d-canvas';
  renderer.domElement.setAttribute('aria-label', 'Your spacecraft in 3D. Drag to rotate.');
  renderer.domElement.setAttribute('role', 'img');

  scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x1a2233, 1.1));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(5, 6, 4);
  scene.add(sun);

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
  const height = Math.round(Math.min(360, Math.max(200, width * 0.7)));
  renderer.setSize(width, height, true);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

/**
 * Show the spacecraft for these parts. Rebuilds only when the parts change.
 * @param {object[]} parts resolved part objects
 */
export function showSpacecraft(parts = []) {
  if (!scene) return;
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

export function setPaused(value) {
  paused = Boolean(value);
}

/** Stop drawing and free everything. */
export function dispose() {
  cancelAnimationFrame(frame);
  resizeObserver?.disconnect();
  renderer?.domElement.remove();
  renderer?.dispose();
  disposeShared();
  renderer = scene = camera = craft = null;
  lastKey = '';
}

function startLoop() {
  const tick = (time) => {
    frame = requestAnimationFrame(tick);
    const dt = Math.min(MAX_FRAME_MS, time - (lastTime || time)) / 1000;
    lastTime = time;
    // Draw only when the canvas is on screen, the game is not paused and the tab is visible.
    if (!renderer.domElement.isConnected || paused || document.hidden || !craft) return;

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
    dragging = { x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!dragging || !craft) return;
    craft.rotation.y += (event.clientX - dragging.x) * 0.01;
    craft.rotation.x = Math.max(-1, Math.min(1, craft.rotation.x + (event.clientY - dragging.y) * 0.01));
    dragging = { x: event.clientX, y: event.clientY };
    lastDragAt = performance.now();
  });
  const stop = () => {
    dragging = null;
    lastDragAt = performance.now();
  };
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);
}
