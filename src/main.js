import './style.css';
import { createStore } from './state/store.js';
import { mountApp } from './ui/app.js';

// The game works with plain HTML. The 3D view (src/view3d) will be loaded later, on demand.
mountApp(document.querySelector('#app'), { store: createStore() });
