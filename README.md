# Space Mission Design Game

> Team **Tupi Orbit** · NASA Space Apps Challenge 2026

**▶ Play it now: https://avoddigital.github.io/space-mission-design-game/** (no install, no login; works on phones)

An interactive game where players design, launch and manage a complete space mission. Choose a mission objective, build the spacecraft, pick instruments, a launch vehicle and an orbit, then simulate the mission and see why it succeeded or failed.

## Why
Space mission design is full of trade-offs: a better instrument adds science value but also mass, power, cost and data. This game makes those trade-offs playable and easy to understand for students and curious players.

## Features
- Mission scenarios and difficulty levels
- Spacecraft and instrument builder with live resource tracking (mass, power, budget, data, communications, time)
- Launch vehicle and orbit compatibility checks
- Mission simulation with random events
- Final report that explains the result and teaches why

## How to play
1. **Choose a mission.** Observe Earth (easy), explore the Moon (medium) or study Mars (hard). Each mission has a science question, a budget, a deadline and a science goal.
2. **Build your spacecraft.** Pick instruments for science, a solar panel for power and an antenna to send data home. Watch the meters: every part adds mass, power use, data and cost.
3. **Launch.** Choose an orbit and a rocket. The rocket must be able to carry your spacecraft to that orbit, and it must fit your budget. A GO/NO-GO checklist shows what is still wrong.
4. **Simulate.** Watch the mission fly. Random events, like solar storms or launch delays, only hurt missions that left too little margin.
5. **Read the report.** See your score from 0 to 100, what worked, what failed and why, and real NASA missions similar to yours. Then redesign and try again.

There is no single right answer: different combinations of instruments, orbits and rockets can complete the same mission.

## How to run
Requires Node 20+ (tested with Node 24, Vite 8, Vitest 5).
```
npm install
npm run dev         # local dev server (http://localhost:5173)
npm test            # Vitest, single run (tests/**/*.test.js)
npm run test:watch  # Vitest in watch mode
npm run build       # production build to dist/ (relative base, ready for GitHub Pages)
npm run preview     # serve the production build locally
```

## About the numbers
All game values (mass, power, cost, data, rocket capacity, travel time) are **simplified**. They are inspired by real missions and rockets, but they are not exact and should not be used for real engineering. The facts about real NASA missions shown in the game come from official NASA pages.

## Team
- **Silvio Barretto**: software developer
- **Carlos**: Business Information Systems graduate (Fatec São José do Rio Preto)

## Challenge
[Space Mission Design Game](https://www.spaceappschallenge.org/2026/challenges/space-mission-design-game/), NASA Space Apps Challenge 2026.

## Credits and sources
**Missions and instruments that inspired the spacecraft parts** (values simplified):
- Mars Reconnaissance Orbiter (MRO): HiRISE, CTX, CRISM and SHARAD
- 2001 Mars Odyssey: THEMIS and the Gamma Ray Spectrometer
- Lunar Reconnaissance Orbiter (LRO): LOLA, CRaTER and its Ka-band antenna
- Landsat 8: Operational Land Imager (OLI)
- MAVEN: magnetometer

**Rockets that inspired the launch vehicles** (values simplified): Rocket Lab Electron, SpaceX Falcon 9, SpaceX Falcon Heavy and NASA's Space Launch System (SLS Block 1).

**Real missions shown in the game:** Landsat 9, Landsat 8, LRO, LCROSS, MRO, 2001 Mars Odyssey and MAVEN. Facts were checked on each mission's page at [science.nasa.gov](https://science.nasa.gov/).

**Reference material:** NASA Design and Develop Science Missions, Mission Design Lab, GMAT and CubeSat 101 (linked on the challenge Resources tab).

**Images and textures:** NASA media used in the game is in the public domain. Sources will be listed here when the 3D view is added.

AI assistance (Claude) was used during development.
