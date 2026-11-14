# CLAUDE.md — Space Mission Design Game (Team Tupi Orbit)

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

Optional, only if time allows: 3 difficulty levels, roles for up to 4 players on one device, leaderboard (local), sandbox mode.

## Stack and constraints
- Vite + vanilla JavaScript (ES modules). No backend. State in memory and `localStorage`.
- Tests with Vitest for the rules engine.
- **Free tools only.** Do not add paid services or API keys.
- Keep dependencies minimal. Ask before adding a library.
- Deploy target: static hosting (GitHub Pages or similar).

## Suggested structure
```
src/
  data/        # instruments, rockets, orbits, scenarios (plain JS/JSON tables)
  engine/      # pure functions: resource totals, compatibility checks, simulation, scoring
  ui/          # screens and components for each of the 5 steps
  main.js
tests/         # Vitest tests for src/engine
```
Keep game rules in `engine/` as pure functions with no DOM access, so they are easy to test. UI only renders state and calls the engine.

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
