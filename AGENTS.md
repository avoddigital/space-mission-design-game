# AGENTS.md — Space Mission Design Game (Team Tupi Orbit)

NASA Space Apps Challenge 2026, challenge "Space Mission Design Game".
Challenge page: https://www.spaceappschallenge.org/2026/challenges/space-mission-design-game/
Team: Silvio Barretto (developer) and Carlos (Business Information Systems, Fatec São José do Rio Preto).

## Language rules (important)
- Talk to the team in **Brazilian Portuguese (pt-BR)**. Silvio does not speak English.
- Everything that ships is in **English**: game UI, texts, tutorials, in-game explanations, README, code comments, commit messages, pitch and demo script.
- When you write English texts for the game, give Silvio a short pt-BR explanation of what they say.

## Product
A browser game where the player (or a team of up to 4) designs, launches and simulates a complete space mission, balancing six resources: **mass, power, budget, data, communications, time**. Every decision has a consequence, and the final report explains *why* the mission succeeded or failed.

Game flow (5 steps):
1. Mission objective and scenario (observe Earth, explore the Moon, study Mars).
2. Spacecraft and instruments (each part has mass, power, cost, data rate, science value).
3. Launch vehicle and orbit (check that mass and orbit fit the rocket).
4. Simulation (random events such as solar storms or component failures).
5. Final report (score, what worked, what failed, similar real NASA missions).

Team play is done: 1 to 4 players with roles, on one device or each on their own device with a room code; each player has their own view and makes choices only on their turn (see `CLAUDE.md` › Product and README › Team play).

Optional, only if time allows: 3 difficulty levels, leaderboard (local), sandbox mode.

## Source documents
- `prd-space-mission-design-game.md`: product requirements (v0.3). Section 0.1 lists the decisions that win when documents disagree; sections 6 and 7 are the data and engine contracts.
- `Carlos.md`: Carlos's task list and the exact format of every file in `src/data/`.
- The numbers live in `src/data/` and are guarded by `tests/data.test.js`. Do not copy numbers into the docs.

## Stack and constraints
- Vite + vanilla JavaScript (ES modules). No backend. State in memory and `localStorage`.
- Tests with Vitest for the rules engine.
- **Free tools only.** Do not add paid services or API keys.
- **Three.js (`three`) is approved** as the only 3D library, used as a visual layer (see "3D layer"). No React Three Fiber, no physics engine, no other game engine.
- Keep other dependencies minimal. Ask before adding a library.
- Deploy target: static hosting (GitHub Pages or similar).

## Suggested structure
```
src/
  data/        # instruments, rockets, orbits, scenarios (plain JS/JSON tables)
  engine/      # pure functions: resource totals, compatibility checks, simulation, scoring
  state/       # single mission state object and the functions that update it
  net/         # team play on several devices: room code and messages (protocol.js), connection (room.js)
  ui/          # HTML/CSS screens and components for each of the 5 steps
  view3d/      # Three.js scenes (spacecraft viewer, orbit view); read-only consumer of state
  main.js
tests/         # Vitest tests for src/engine
```
Keep game rules in `engine/` as pure functions with no DOM and no Three.js access, so they are easy to test. UI only renders state and calls the engine.

## 3D layer (Three.js)
Decision (2026-11-14): the game is a decision simulator, so rules and UI stay in plain JavaScript and HTML/CSS. Three.js is only a visual layer for the moments where 3D adds value.
- Data flow is always `UI → state → engine → state → view3d`. `view3d/` only reads state and draws. It never decides game rules and never writes to state.
- The game must stay fully playable with the 3D layer turned off. If WebGL fails, show a 2D fallback (image or simple canvas) instead of an error.
- Priority order, **only after the game works end to end with plain HTML UI**:
  1. Spacecraft viewer (step 2): low-poly craft built from simple primitives (cylinders, boxes, solar panels) that changes when instruments change. No imported models.
  2. Orbit view (steps 3 and 4): planet sphere with a NASA public-domain texture, orbit ring at the chosen altitude, moving spacecraft.
  3. Optional short launch animation.
- Time-box the whole 3D work to about 3–4 hours.
- Performance matters (students, weak laptops, phones): load `view3d/` lazily with dynamic `import()`, cap pixel ratio at 2, reuse geometries and materials, dispose of them when leaving a screen, keep textures small.
- Use scene units, not real kilometers. Do not add a physics engine; the simulation lives in `engine/`.
- Textures and images must be free to use (NASA media is public domain). Note the source in a comment or in the README credits.

## Data rules
- Values in `src/data/` should be inspired by real missions and rockets, but simplified. Keep units explicit in names (`massKg`, `powerW`, `costMUsd`, `dataGbPerDay`).
- Mark anything approximate as simplified in a comment. Do not claim real-world accuracy that we have not checked.
- Reference material: NASA Design and Develop Science Missions, Mission Design Lab, GMAT, CubeSat 101 (links are on the challenge Resources tab).

## Working agreements
- Silvio approves before big changes. Show the plan first for anything that touches several files.
- Optional suggestions must be clearly labeled as optional and must not become tasks on their own.
- Do not redo things that already work.
- Run the tests and the dev server before saying something is done. Report honestly what was and was not verified.
- Do not commit or push unless asked. When asked, use short imperative English messages (`Add rocket compatibility check`).
- **Do not add `Co-Authored-By` or any AI attribution to commits or pull requests.** The team will credit AI assistance in the project references instead.
- Do not put client names, secrets or personal data of anyone in the repo.

## Definition of done for the hackathon
- Playable end to end: all 5 steps, at least 3 scenarios, final report with explanations.
- Clear in-game explanations, written for beginners and students.
- README with how to run, how to play, team and challenge link.
- Short demo video and pitch (in English).
- Event dates: November 14–15, 2026. Confirm the submission deadline on the Space Apps site.

## Commands
Requires Node 20+ (tested with Node 24, Vite 8, Vitest 5).
```
npm install
npm run dev         # local dev server (http://localhost:5173)
npm test            # Vitest, single run (tests/**/*.test.js)
npm run test:watch  # Vitest in watch mode
npm run build       # production build to dist/ (relative base, ready for GitHub Pages)
npm run preview     # serve the production build locally
```
