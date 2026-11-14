# Learning design — Tupi Orbit (Space Mission Design Game)

Who the game is for, what players do and learn in each mission and step, the learning theories behind it,
how it uses NASA's open data, how it turns mistakes into learning, units of measure, and languages.

Facts marked with a source were checked on the linked page on 2026-11-14. Game numbers (budgets, masses,
costs, science goals) are simplified game values and live in `src/data/`; this document does not repeat them.

---

## 1. Audience

**Teenagers and adults of Generation Z.** Pew Research Center places the start of this generation at people
born from 1997 onward ([Pew, 2019](https://www.pewresearch.org/short-reads/2019/01/17/where-millennials-end-and-generation-z-begins/)).
Pew has not fixed an end year; we use **1997–2012** as a working range, which means players about
**14 to 29 years old in 2026**.

Two groups inside that range, with different needs:

| Group | Typical situation | What they need from the game |
| --- | --- | --- |
| **Teen students (14–17)** | High school, playing alone, in pairs or in class | Short sessions, clear goals, visual feedback, no login, works on a school laptop or phone |
| **Young adults (18–29)** | University students, early-career professionals, space fans | Respect for what they already know, real trade-offs, freedom to choose, real sources to go deeper |

Design choices that follow from this audience (not assumptions about "what Gen Z is like", but requirements we can test):

- **Browser, no install, no account.** Plays on phones and weak laptops; the 3D view is optional.
- **Short loops.** One mission in a few minutes; the campaign can be played in short sessions (it saves itself).
- **Learning by doing first, text second.** Every choice changes the meters and the 3D model right away; explanations are short and appear when they are useful.
- **Choice and autonomy.** There is no single right design; the player picks the country, the agency focus and the strategy.
- **Real sources.** Every fact in the Mission Library links to its official page, so curious players can check it and go further.
- **Sound and motion are a bonus.** The game is fully playable muted and with reduced motion.
- **Three languages.** English, Portuguese and Spanish, so players from partner countries can learn in their own language (section 8).

Secondary audience: **teachers and facilitators** who need a 20–40 minute activity (Free mission mode), and the **Space Apps judges**.

---

## 2. What to do in each mission

The campaign has three phases. Each phase is one full mission played in five steps (section 3).

### Phase 1 · Earth — "Observe Earth"
- **Goal:** build a satellite that watches Earth change for a year and sends enough science home.
- **Where:** low Earth orbit, sun-synchronous orbit or geostationary orbit.
- **What makes it work:** a small rocket can reach low orbits, so the challenge is fitting good instruments into a small budget and a small rocket.
- **Common mistake:** adding the best camera and finding the spacecraft is too heavy for the cheapest rocket, or too much data for the antenna.
- **Tip:** a sun-synchronous orbit gives the same light in every picture, which is why real Earth-observing satellites use it.

### Phase 2 · Moon — "Explore the Moon"
- **Goal:** map the Moon from orbit for a year.
- **Where:** lunar orbit, a few days away.
- **What makes it work:** leaving Earth orbit needs a bigger rocket, and a rocket carries much less mass to the Moon than to low orbit. The budget gets tight fast.
- **Common mistake:** keeping the cheap rocket from Phase 1 (it cannot reach the Moon).
- **Tip:** check the rocket's capacity *to the Moon*, not to low orbit.

### Phase 3 · Mars — "Study Mars"
- **Goal:** study Mars from orbit after a trip of many months.
- **Where:** Mars orbit.
- **What makes it work:** time, budget and data are all tight. The long trip eats into the mission time, and Mars is far, so the antenna limits how much science reaches Earth. Sunlight at Mars is much weaker than at Earth.
- **Common mistake:** packing many instruments that produce more data than the antenna can send.
- **Tip:** the science that counts is the science that reaches Earth; a better antenna can be worth more than one more instrument.

### Between missions (agency)
- **Funds** pay for every launch, even a failed one. **Side jobs** bring funds or science (they can fail).
- **Science points** buy **research** that improves parts for the rest of the campaign.
- **Events** can help or hurt. **The Mission Library** opens new real missions and topics as the agency grows.
- **Badges** (in both modes) mark first steps, each destination, good engineering, learning and the agency.

---

## 3. What the player learns in each step

Learning goals use the revised Bloom's taxonomy verbs (Anderson & Krathwohl, 2001): remember, understand, apply, analyse, evaluate, create.

| Step | What the player does | What they learn | Bloom level |
| --- | --- | --- | --- |
| **1. Objective** | Reads the science question, budget, deadline, science goal and possible orbits | Missions start from a **science question**; requirements come before hardware | Understand |
| **2. Spacecraft** | Picks instruments, a power source and an antenna, watching six resources change | Every part costs **mass, power, money and data**; more science usually means more of everything else | Apply, analyse |
| **3. Orbit and rocket** | Picks an orbit and a rocket; reads the GO / NO-GO checklist | The orbit decides **what you can see and how hard it is to get there**; a rocket's capacity depends on the destination | Analyse, evaluate |
| **4. Flight** | Watches launch, transfer, operations and data return, with random events | **Margins protect missions**: solar storms, delays and failures only hurt designs that were already at the limit | Understand, evaluate |
| **5. Report** | Reads the score, what failed and why, lessons, a quiz and similar real missions | **Why** it worked or failed, what real engineers do about it, and which real NASA missions faced the same problem | Evaluate |
| **Redesign** | Goes back to the step that failed with every choice kept | That there are **many valid designs**; improving one resource changes others | Create |
| **Campaign** | Manages funds and science across phases, side jobs and research | **Program-level** trade-offs: risk, investment in technology, cost of failure | Evaluate, create |
| **Mission Library** | Reads real facts and sees real NASA images, unlocked by progress | How the game's ideas connect to **real missions and real data** | Remember, understand |
| **Badges** | Earns mission patches and sees the ones still missing, with how to earn them | Names good engineering habits (margins, saving budget, retrying after a failure) as goals worth reaching | Understand, evaluate |

---

## 4. Pedagogy and andragogy

The game is built for both teenagers (pedagogy) and adults (andragogy). These are the references and how each one shows up in the game.

### Experiential learning — Kolb (1984)
Kolb, D. A. *Experiential Learning: Experience as the Source of Learning and Development.* Prentice Hall.
The learning cycle is the game loop:
1. **Concrete experience:** design and launch a mission.
2. **Reflective observation:** the flight and the report show what happened.
3. **Abstract conceptualization:** the "Learn" box and the rule of thumb name the concept.
4. **Active experimentation:** redesign and launch again.

### Andragogy — Knowles (The Adult Learner)
Knowles, M. S., Holton, E. F. & Swanson, R. A. *The Adult Learner* (many editions; first edition 1973).
Knowles describes adult learners as needing to know why they learn, self-directed, bringing experience,
ready to learn what solves real problems, problem-centred and internally motivated. In the game:
- **Need to know why:** every limit explains *why* it matters ("this rocket can carry X kg to this orbit").
- **Self-direction:** the player chooses country, focus, strategy and when to take risks; no forced tutorial.
- **Experience as a resource:** adults who know physics or budgets can go straight to the numbers ("Show numbers").
- **Problem-centred:** each mission is a real problem (a science question), not a list of facts.
- **Internal motivation:** progress, discovery in the Library and the wish to beat one's own design, not points for their own sake. The 16 badges (mission patches) reward learning behaviours, not just winning: "Lesson learned" for succeeding after a failure, "Built to last" for margins that absorbed a surprise, "Budget saver", "Curious mind" for the Library.

### Scaffolding and the zone of proximal development — Vygotsky (1978); Wood, Bruner & Ross (1976)
Vygotsky, L. S. *Mind in Society.* Harvard University Press. Wood, D., Bruner, J. S. & Ross, G. (1976). "The role of tutoring in problem solving." *Journal of Child Psychology and Psychiatry,* 17(2).
- Difficulty grows **Earth → Moon → Mars**; each phase adds one new pressure (rocket capacity, then time and data).
- Support is always there but optional: dots instead of numbers by default, hints on every card, "Fix in step N" links.
- Support fades with progress: the player needs fewer hints as they understand the trade-offs.

### Constructionism — Papert (1980)
Papert, S. *Mindstorms: Children, Computers, and Powerful Ideas.* Basic Books.
People learn well when they **build something** they can look at and share. The player builds a spacecraft that appears in 3D and changes with every choice.

### Learning principles of video games — Gee (2003)
Gee, J. P. *What Video Games Have to Teach Us About Learning and Literacy.* Palgrave Macmillan.
Good games give information **"just in time"** and **"on demand"**, let players take risks with low real cost,
and make the rules visible through play. The game explains a concept when the player meets it (a toast when a limit breaks, a "Learn" box per step).

### Productive failure — Kapur (2008)
Kapur, M. (2008). "Productive failure." *Cognition and Instruction,* 26(3).
Struggling with a problem before being told the solution can lead to deeper understanding, **when the failure is followed by explanation**. That is the reason the report explains the failure instead of just showing "wrong" (section 6).

### Dialogue and autonomy — Paulo Freire
Freire, P. *Pedagogia do Oprimido* (1968/1970) and *Pedagogia da Autonomia* (1996).
Knowledge is built in dialogue, not "deposited". In class or team play, the game is a reason to discuss:
"why did you choose that orbit?". The report and the quiz invite the player to explain, not to memorise.

### Formative feedback — Black & Wiliam (1998)
Black, P. & Wiliam, D. (1998). "Assessment and Classroom Learning." *Assessment in Education,* 5(1).
Feedback during the activity, tied to the task, helps learning more than a final grade alone. The meters, the checklist and the toasts are formative; the score is only the last step.

---

## 5. NASA open data: democratising space knowledge

**What NASA's policy says.** NASA's Science Mission Directorate states that "information produced from SMD-funded scientific research activities be made publicly available"; peer-reviewed publications are "made openly available with no embargo period", and "mission data are released as soon as possible" ([NASA Science Information Policy, SPD-41a](https://science.nasa.gov/open-science/science-information-policy/)).

**What NASA says about its images.** NASA images, audio and video "generally are not subject to copyright in the United States", and "NASA should be acknowledged as the source". The NASA insignia and logotype are not in the public domain, and NASA content must not imply NASA endorsement ([NASA Brand Center, images and media](https://www.nasa.gov/nasa-brand-center/images-and-media/)).

**How the game uses it.**
- The planet textures in the 3D view come from NASA public-domain imagery (credits in the README).
- The Mission Library uses real images from the [NASA Image and Video Library](https://images.nasa.gov/) with each credit shown, and facts from official mission pages.
- No NASA logos or insignia are used, and the game does not claim NASA endorsement.
- The challenge's NASA resources (GMAT, Mission Viz, CubeSat 101, Mission Design Lab and others) are listed in the Library for players who want to go further.

**What players learn from it.**
- **Anyone can check the facts.** Every fact links to its source, so players practise checking information instead of trusting it blindly.
- **The same data professionals use is open.** The library shows that the pictures and mission facts are free to use, and points to tools (GMAT, Mission Viz) used in real mission design.
- **A path from playing to doing.** From the game, a curious player can open NASA's image library, mission pages and the challenge resources, and keep learning outside the game.

---

## 6. Learning from mistakes

Failing is part of the game on purpose (productive failure, section 4). How the game makes a mistake useful:

1. **The exact limit is named.** Not "wrong", but "your spacecraft is too heavy for this rocket at this orbit", with the numbers.
2. **The fix is one click away.** Every NO-GO line links to the step that fixes it; "Redesign" goes back with every choice kept.
3. **Fair comparison.** The same design always meets the same random events, so a player can change one thing and see its effect. "New conditions" tries a different set of events.
4. **Margins are explained.** When a random event hurts, the report says that more margin would have protected the mission and what engineers do about it.
5. **A real mistake as an example.** NASA's Mars Climate Orbiter was lost in 1999 "due to a navigation error caused by a failure to translate English units to metric"; ground software used English units while onboard software used metric ([NASA mission page](https://science.nasa.gov/mission/mars-climate-orbiter/)). Real missions fail too, and the lessons shape later missions.
6. **Retrying is rewarded.** The "Lesson learned" badge is earned by succeeding in a mission after failing it, and "Built to last" by a design whose margins absorbed a surprise.
7. **Failure has a cost, but no game over.** In the campaign, a failed launch loses the money spent; side jobs (one of them is free) and events help the agency recover, and the campaign never ends because of a failure. (Known gap: an agency that spends almost everything can take a while to recover; see PRD section 14.)

How we check it (PRD section 1.4): at least 7 of 10 testers can answer "why did your mission fail?" after reading the report.

---

## 7. Units of measure

**Decision: the game uses the International System of Units (SI) everywhere:** kilograms (kg), watts (W), kilometres (km), days and gigabytes per day. Money is shown in millions of US dollars (M USD) because the reference missions are NASA missions.

Why:
- **NASA uses SI for new space projects.** NASA Policy Directive 7120.4E says to "use the International System of Units ... for all new space flight projects and programs, especially in cooperative efforts with International Partners" (effective 2017-06-26, expires 2027-06-26) ([NASA NODIS, NPD 7120.4E](https://nodis3.gsfc.nasa.gov/displayDir.cfm?t=NPD&c=7120&s=4E)).
- **SI is the shared language of the partner countries.** NIST says "all countries have recognized and adopted the SI, including the United States", while "metric use is mandatory in some countries and voluntary in others" ([NIST, Metric and SI](https://www.nist.gov/pml/owm/metric-si/)).
- **Unit mistakes are a real danger** (Mars Climate Orbiter, section 6), which is a good lesson for players.

Not done yet (proposal, see PRD): an optional display of mass in pounds (lb) next to kilograms for players used to US customary units, without changing the rules (which stay in SI).

---

## 8. Languages

**Status: implemented (2026-11-14).** English stays the default and the reference text; Portuguese and Spanish are full translations.

Languages, chosen from the partner countries and the team:
- **English** (default),
- **Portuguese** (team, Brazil, Angola),
- **Spanish** (Argentina, Paraguay, Spain).

How it works:
- A language button (globe icon) on the title screen, the command center, the mission top bar, the Free mission screen and the Library; the **L** key also switches. The first visit follows the browser language; the choice is saved in `localStorage`.
- Interface text lives in `src/i18n/en.js`, `pt.js` and `es.js`. The game tables (parts, rockets, orbits, scenarios, events, player texts, Library, campaign) are translated by id on top of the English tables (`localizeData`, `localizeList` in `src/i18n/index.js`).
- Translations change only words: ids, numbers, links, images and the number of facts stay the same, so the rules in `src/engine` behave identically. `tests/i18n.test.js` checks this, and that every language has every key with the same placeholders.
- Library facts are translated from the checked English sentence; the link still points to the official (English) source. Official titles of English pages (for example "Design and Develop Science Missions") are kept in English.
- Numbers use the language's format (decimal comma in Portuguese and Spanish); units stay SI.
- The agency log stores keys, not sentences, so old entries also change language.
