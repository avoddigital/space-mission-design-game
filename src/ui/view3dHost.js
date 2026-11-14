// Connects the HTML screens to the optional 3D layer.
// The 3D code is loaded on demand. If it fails (no WebGL, old device, ?3d=off),
// the 2D diagram stays and the game works the same.

import { t } from '../i18n/index.js';

const FALLBACK_TEXT = () => t('common.no3d');

let view = null;
let status = 'idle'; // 'idle' | 'loading' | 'ready' | 'failed'

function disabledByUrl() {
  try {
    return new URLSearchParams(globalThis.location?.search ?? '').get('3d') === 'off';
  } catch {
    return false;
  }
}

function showFallback(slot) {
  slot.classList.add('is-off');
  const note = slot.querySelector('.view3d-note');
  if (note) note.textContent = FALLBACK_TEXT();
}

/**
 * Call after every render. Puts the 3D canvas in the slot of the current screen, if any.
 * @param {HTMLElement} root app root
 * @param {{ parts: object[], rocket?: object, orbit?: object, simulation?: object, shown?: number }} scene
 *   what to draw: the spacecraft (steps 1 and 2) or the flight (simulation screen)
 * @param {{ paused: boolean, onReady: Function }} options onReady re-renders when 3D finished loading
 */
export function syncView3d(root, scene, { paused, onReady }) {
  const slot = root.querySelector('[data-view3d]');
  if (!slot) {
    view?.setPaused(true); // nothing to draw on this screen
    return;
  }
  if (status === 'failed' || disabledByUrl()) {
    showFallback(slot);
    return;
  }
  if (status === 'ready') {
    view.attach(slot);
    if (slot.dataset.view3d === 'flight') view.showFlight(scene);
    else if (slot.dataset.view3d === 'globe') view.showGlobe(scene.globe);
    else view.showSpacecraft(scene.parts);
    view.setPaused(paused);
    slot.classList.add('is-3d');
    return;
  }
  if (status === 'idle') {
    status = 'loading';
    import('../view3d/index.js')
      .then(async (module) => {
        await module.mount();
        view = module;
        status = 'ready';
      })
      .catch((error) => {
        status = 'failed';
        console.info('[view3d] 3D disabled:', error?.message ?? error);
      })
      .finally(onReady);
  }
}
