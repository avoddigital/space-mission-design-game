# Demo video script: Space Mission Design Game (30 seconds)

**Rules from the São José do Rio Preto opening slides (2026-11-13):**
- The Project Demo is **one** public link: a **30-second video** or a **7-slide** presentation (a title slide counts as one of the 7).
- Video demos need **English subtitles**.
- The link must open without a password, permission or login. Test it in a private window before submitting.
- Do not use NASA logos, flags or other NASA branding in the video.
- Submission closes **Sunday 15/11 at 17:00** (local). The pitch talk is Sunday at 9:00.

**Before recording:** record only after the game screens are on `main`. Play this exact path once and check that the numbers on screen match the ones below. They come from the rules engine and the data tables on 2026-11-13; update them if the tables change after playtesting.

**Starting ship (set it up before you start recording):**
- Mission: **Observe Earth**
- Instrument: **Multispectral Imager**
- Power: **Medium Solar Panel**
- Antenna: **High-Gain Antenna**
- Orbit: **Sun-Synchronous Orbit (705 km)**. In Low Earth Orbit the random events are different and the solar storm does not appear.

**Record the first launch.** Do not click "Try again with new conditions": it changes the random events. The same design always gets the same events, so the solar storm appears every time you follow this path.

**Story:** one Earth mission. The player gets greedy, fails twice, learns why, and succeeds. About 65 words of narration, which fits 30 seconds at a calm pace.

---

| Time | Screen and action | Narration (spoken and subtitled) |
|---|---|---|
| 0–4 s | Menu: click **Observe Earth**. | "Design a real space mission, from the science goal to the launch." |
| 4–11 s | Spacecraft: add the **High-Resolution Camera**. Launch step: pick the **Small Lifter**. The checklist shows NO-GO: 310 kg, but the rocket carries 300 kg. | "I added the best camera. Too heavy: ten kilograms over what my rocket can carry." |
| 11–16 s | Switch to the **Medium Lifter**. Mass turns green, budget turns red: 20 million USD over. | "A bigger rocket? Now I'm twenty million dollars over budget." |
| 16–23 s | Swap the camera for the **Thermal Infrared Imager**, back to the **Small Lifter**. All green. Click Launch. A solar storm card appears in green. | "A lighter design fits, with enough margin to survive a solar storm." |
| 23–30 s | Report: SUCCESS, **73/100**, the Landsat 9 card. End card: game name, team, link. | "Every choice has a consequence, and the game explains why. Space Mission Design Game, by Team Tupi Orbit." |

**Recording tips:** record the screen at 1280×720 or larger, speed up the clicks in editing, and keep each subtitle on screen for at least 2 seconds.

---

## Design used in the video

All three attempts use the Sun-Synchronous Orbit, the Multispectral Imager, the Medium Solar Panel and the High-Gain Antenna. Only the extra instrument and the rocket change:

| Extra instrument | Rocket | Expected result |
|---|---|---|
| High-Resolution Camera | Small Lifter | Fails: too heavy for the rocket |
| High-Resolution Camera | Medium Lifter | Fails: over budget |
| Thermal Infrared Imager | Small Lifter | Success |

The numbers in the narration (10 kg, 20 million USD, 73/100, solar storm in green) were checked in the live game on 2026-11-14. The tables are the source of truth: if a number in `src/data/` changes after playtesting, tell Silvio so he can check the script again, and read the numbers on screen when recording.

---

## Plan B: 7 slides

Use this only if the game screens are not ready to record on Sunday morning.

1. **Title:** Space Mission Design Game, Team Tupi Orbit, NASA Space Apps 2026.
2. **The problem:** every mission is a puzzle of trade-offs; students rarely see a whole mission.
3. **The game:** the five steps (goal, spacecraft, launch, simulation, report).
4. **A failure that teaches:** 310 kg on a 300 kg rocket, then 20 million USD over budget.
5. **The fix:** a lighter design, margin, success with 73/100.
6. **Learning built in:** Learn boxes, plain-language reports, real NASA missions, quiz.
7. **Links and team:** game link, repository link, team names.
