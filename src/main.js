import './style.css';
import { sumResources } from './engine/resources.js';

const app = document.querySelector('#app');

// Temporary start screen. The 5 game steps will live in src/ui/.
const totals = sumResources([]);

app.innerHTML = `
  <h1>Space Mission Design Game</h1>
  <p>Design, launch and simulate your own space mission.</p>
  <p><small>Engine ready. Starting mass: ${totals.massKg} kg.</small></p>
`;
