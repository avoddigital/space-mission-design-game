import './style.css';
import { createStore } from './state/store.js';
import { mountApp } from './ui/app.js';
import { getLocale } from './i18n/index.js';

document.documentElement.lang = getLocale();

// A link with ?sala=CODE opens the player console for team play on several devices (src/ui/remote.js).
// Otherwise the game. It works with plain HTML; the 3D view (src/view3d) is loaded later, on demand.
const params = new URLSearchParams(location.search);
if (params.has('sala')) {
  import('./ui/remote.js').then(({ mountRemote }) => mountRemote(document.querySelector('#app'), { code: params.get('sala') ?? '' }));
} else {
  mountApp(document.querySelector('#app'), { store: createStore() });
}
