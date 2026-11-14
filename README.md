# Tupi Orbit · Space Mission Design Game

> Team **Tupi Orbit** · NASA Space Apps Challenge 2026

**▶ Play it now: https://avoddigital.github.io/space-mission-design-game/** (no install, no login; works on phones)
The published site is built from the `main` branch; new features appear there after they are merged.

A browser game where players found a space agency and design, launch and manage complete space missions, from Earth orbit to the Moon and Mars. Every choice changes mass, power, budget, data, communications and time, and the game explains in plain words why a mission succeeded or failed.

## Why
Space mission design is full of trade-offs: a better instrument adds science value but also mass, power, cost and data. Students rarely get to try a whole mission. This game makes those trade-offs playable, and turns every failure into an explanation.

## Features
- **Campaign:** found an agency (country + focus), manage funds and science, and unlock three phases: Earth, Moon, Mars.
- **Mission builder** with live meters for the six resources, a GO / NO-GO launch checklist and part badges ("High science", "Heavy"…).
- **Simulation** of launch, transfer, operations and data return, in 3D, with random events that only hurt designs without margin.
- **Report** with a 0–100 score, what went wrong and why, a quiz and similar real NASA missions.
- **Agency management:** side jobs, research that improves parts, and events between missions.
- **Mission Library:** real missions and topics with real NASA images; every fact links to its official source. Entries unlock as the agency grows.
- **Badges:** 16 mission patches for first steps, destinations, good engineering, learning and the agency.
- **Free mission** mode for classes and demos: any mission, no agency.
- **Three languages:** English, Portuguese and Spanish.
- **Synthesized sounds** (Web Audio) with a mute button; fully playable muted.
- Fits the screen on laptops and desktops (no page scroll); works on phones; 2D fallback without WebGL.

## Who it is for
Teenagers and young adults (Generation Z, about 14 to 29 years old), and teachers who want a short class activity. No install, no account, playable on a phone or a school laptop. The game explains every result in plain words, uses SI units (like NASA's own projects) and links every real fact to its official source.

What players learn in each mission and step, the learning theories behind the game (Kolb, Knowles, Vygotsky, Papert, Gee, Kapur, Freire, Black & Wiliam), how it uses NASA's open data and how it turns mistakes into learning: [docs/learning-design.md](docs/learning-design.md).

## Languages
English (default), Portuguese and Spanish. Use the globe button or the **L** key; the first visit follows the browser language. Translations change only words, never the rules, the numbers or the sources.

## Campaign
Choose **New campaign** on the title screen:
- **Found your agency.** Pick a country (the 2026 NASA Space Apps partner countries, plus Europe) and an agency focus. The focus gives one small bonus: more science (Earth Observation), shorter trips (Exploration) or cheaper research (Technology).
- **Grow from Earth to Mars.** Three phases unlock in order: Earth, Moon, Mars. Each phase is a full mission (the five steps below). The 3D globe in the command center lights up the Moon and Mars as they unlock.
- **Manage the agency.** Each mission's budget is limited by the agency's funds, and every launch pays its real cost, even when it fails. A first success pays a government reward; every success gives science points from the science sent home.
- **Earn more.** Side jobs bring funds or science (they can fail, and the cost is paid anyway), research spends science to improve parts, and agency events can help or hurt between missions.
- **Discover the Mission Library.** It starts with the basics and opens real missions and topics as your agency grows.

The campaign saves itself in the browser. **Free mission** (on the title screen) plays any mission without an agency.

## Badges
Sixteen mission patches, earned in both modes and saved in the browser: first launch and first success; each destination; good engineering (score of 80+, a resource at its limit, using 70% of the budget or less, margins that absorbed a surprise); learning (succeeding after a failure, all three quizzes, 10 Library entries); and the agency (founding it, research, side jobs, finishing the campaign). They reward learning behaviours, not just winning.

## How to play a mission
1. **Objective.** Read the science question, the budget, the deadline and the science goal.
2. **Spacecraft.** Pick instruments for science, a solar panel for power and an antenna to send data home. Watch the meters: every part adds mass, power use, data and cost.
3. **Orbit and rocket.** The rocket must carry your spacecraft to that orbit and fit your budget. The GO / NO-GO checklist shows what is still wrong and links to the step that fixes it.
4. **Flight.** Watch the mission fly. Random events, like solar storms or launch delays, only hurt missions that left too little margin. The same design always meets the same events, so you can compare changes fairly.
5. **Report.** See your score from 0 to 100, what worked, what failed and why, and real NASA missions similar to yours. Then redesign and try again.

There is no single right answer: different combinations of instruments, orbits and rockets can complete the same mission.

**Controls:** click or tap to choose · **Enter** next · **Backspace** back · **1–8** pick a card · **P** / **Esc** pause · **M** sound on/off · **L** language.

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

## Project structure
```
src/
  data/      game tables (parts, rockets, orbits, scenarios, events, content), campaign.js, library.js
  engine/    pure rules: resources, validation, simulation, scoring, campaign, achievements
  state/     game state, actions, selectors, saving (localStorage)
  i18n/      languages: en.js, pt.js, es.js and the translation helpers
  ui/        screens and components (HTML strings), sounds, flags
  view3d/    Three.js scenes: spacecraft, flight, globe (read-only)
tests/       Vitest tests (rules, data, campaign, achievements, library, translations)
docs/        learning design, pitch, demo script, submission draft
DESIGN.md    visual identity ("Console Tupi") and sound design
```

## About the numbers
All game values (mass, power, cost, data, rocket capacity, travel time, and the campaign's funds, rewards and research) are **simplified**. They are inspired by real missions and rockets, but they are not exact and should not be used for real engineering. The facts about real NASA missions shown in the game and in the Mission Library are real and come from official pages.

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

**Reference material:** the challenge's Resources tab (Design and Develop Science Missions, GMAT, Concept Maturity Levels, Mission Design Lab, NASA Mission Viz, A Learning Game About Telescopes, CubeSat 101, the Canadian Space Agency's games), all linked in the Mission Library.

**Mission Library:** real facts and real NASA images, kept apart from the simplified game values. Every fact links to the official page it came from (science.nasa.gov, nasa.gov, svs.gsfc.nasa.gov and the challenge Resources tab), checked on 2026-11-14. Images come from the [NASA Image and Video Library](https://images.nasa.gov/) with each image's credit shown; they load from NASA's servers, so they need an internet connection. NASA media is generally not subject to copyright in the United States; NASA is credited as the source and no NASA logo or insignia is used ([NASA guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/)). The data lives in `src/data/library.js` and is guarded by `tests/library.test.js`.

**Planet textures in the 3D view** (public domain, reduced to 1024×512 for fast loading):
- Earth: Blue Marble, NASA/Goddard Space Flight Center Scientific Visualization Studio ([svs.gsfc.nasa.gov/3615](https://svs.gsfc.nasa.gov/3615/))
- Moon: CGI Moon Kit (LRO data), NASA's Scientific Visualization Studio ([svs.gsfc.nasa.gov/4720](https://svs.gsfc.nasa.gov/4720/))
- Mars: Viking global color mosaic, NASA/JPL/USGS ([USGS Astrogeology](https://astrogeology.usgs.gov/search/map/mars_viking_global_color_mosaic_925m))

**Flags** (campaign): [flag-icons](https://github.com/lipis/flag-icons) by Panayiotis Lipiridis, MIT license. The country list comes from the [2026 Space Agency Partners](https://www.spaceappschallenge.org/2026/space-agency-partners/) page (checked 2026-11-14); the game shows countries only, not agency names.

**Fonts** (SIL Open Font License, via Google Fonts): B612 and B612 Mono (designed for aircraft cockpit displays) and Big Shoulders Stencil.

**Sounds:** synthesized in the browser with the Web Audio API; no audio files are used.

The spacecraft, rockets, emblem, badges and link preview image were made for this project from simple shapes. No NASA logos or insignia are used.

AI assistance (Claude) was used during development: see the "Use of AI" section of `docs/submission.md`.
