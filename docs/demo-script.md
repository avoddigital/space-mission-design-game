# Demo video script: Space Mission Design Game

**Before recording:**
- Confirm the maximum video length and the submission format in the official Space Apps 2026 Project Submission Guide. Video demos must have **English subtitles**.
- Record only after the game screens are on `main`. Then play this exact path once and check that the numbers on screen match the ones below. They were calculated with the rules engine and the data tables on 2026-11-13; update them if the tables change after playtesting.
- Target length: about 2 minutes. If the limit is shorter, cut scenes 3 and 6 first.

**Story:** one Earth mission. The player gets greedy, the mission fails twice, and the game teaches why. Then the player fixes it and succeeds. This shows a failure and a success in a single run.

---

| # | Screen | Action | Narration (spoken and subtitled) |
|---|---|---|---|
| 1 | Menu | Show the 3 mission cards. Click **Observe Earth**. | "Space Mission Design Game. You design a real space mission, from the science question to the launch. Let's watch Earth from space." |
| 2 | Step 1: Objective | Show the question, budget (150 million USD), deadline (400 days) and science goal (12). Click Next. | "Every mission starts with a question: how are Earth's forests, ice and cities changing?" |
| 3 | Step 2: Spacecraft | Add **Multispectral Imager** and **Thermal Infrared Imager**, **Medium Solar Panel** and **Medium-Gain X-Band Antenna**. The data meter goes red: 65 GB per day collected, but only 20 can be sent. | "My instruments collect more data than my antenna can send home. That data would be lost." |
| 4 | Step 2: Spacecraft | Swap to the **High-Gain Antenna**. The data meter turns green (65 of 100 GB per day). | "A bigger antenna fixes it. Every part is a trade-off." |
| 5 | Step 2: Spacecraft | Get greedy: add the **High-Resolution Camera**. Remove the thermal imager to make room in the budget. Science goes up to 15. | "More science sounds great. Let's add the best camera." |
| 6 | Step 3: Launch | Choose **Sun-Synchronous Orbit** and the **Small Lifter**. The checklist shows NO-GO on mass: 310 kg, but the rocket carries only 300 kg. | "Too heavy. My spacecraft is 10 kilograms over what this rocket can carry." |
| 7 | Step 3: Launch | Switch to the **Medium Lifter**. Mass is fine now, but the budget goes red: 20 million USD over. | "A bigger rocket can carry it, but now I'm 20 million dollars over budget. Physics and money both say no." |
| 8 | Step 3: Launch | Go back. Remove the camera, add the thermal imager again, pick the **Small Lifter**. All green: 257 of 300 kg, 97.5 of 150 million USD. Click Launch. | "So I go back to a lighter design. Everything fits, with margin to spare." |
| 9 | Step 4: Simulation | The phases play. A random event appears (for example, a solar storm) and the card is green because the power margin is large. | "Surprises happen in space. Because I left margin, the storm doesn't hurt my mission." |
| 10 | Step 5: Report | SUCCESS. Score **73 out of 100**. Show what worked, the "Real missions like yours" card (Landsat 9) and the quiz. | "Mission success. The report explains every result and shows a real NASA mission that made similar choices." |
| 11 | End card | Team name, challenge name, game link. | "No single right answer, just smart trade-offs. Space Mission Design Game, by Team Tupi Orbit." |

---

**Numbers used above** (engine output, current tables):

| Design | Rocket | Result |
|---|---|---|
| Multispectral + Thermal + Medium panel + Medium-gain antenna | Small Lifter | Works, but warns: 45 GB/day of data lost |
| Multispectral + HD camera + Medium panel + High-gain antenna | Small Lifter | Fails: 310 kg vs 300 kg |
| Same design | Medium Lifter | Fails: 170 vs 150 million USD |
| Multispectral + Thermal + Medium panel + High-gain antenna | Small Lifter | Success: 257 kg, 185 of 300 W, 97.5 million USD, science 13 of 12, score 73 |
