# Commander Capi — narration catalog and recording scripts

Everything Commander Capi says out loud, in English, Brazilian Portuguese and Spanish, and how to record it.
The catalog in code is `src/ui/capi/catalog.js`; the texts live in `src/i18n/` (keys `capi.say.*`).
`tests/capi.test.js` checks that every text below matches the game word for word, has no numbers and stays short.

## 0. Status (what is recorded and integrated)

| Language | Lines in the catalog | Recorded and integrated | What players get today |
| --- | --- | --- | --- |
| English | 20 | **20** | Commander Capi's recorded voice (Sulafat, Google AI Studio) |
| Português (Brasil) | 20 | **20** | The same |
| Español | 20 | **20** | The same |

- **All 60 lines are recorded and integrated** (`src/assets/capi/narracao/en/`, `pt/`, `es/`), recorded in Google AI
  Studio and confirmed by the team on 2026-11-15. Technical check of every file: WAV, 24 kHz, mono, 16-bit, 2.9 to
  10.3 s, about 0.1 to 0.4 s of silence at each end, no file is a copy of another.
- If a sentence changes in `src/i18n/`, record that line again; until then, set its status back to `to-record`.
- The five older English files (section 2) were removed on 2026-11-15: all 20 lines now have new recordings.
- The audio path is integrated and tested: when a file is added and its line is marked `verified`, the game plays it
  (loaded only at that moment) with no code change. `tests/narration.test.js` fails if a line is marked as recorded
  while its WAV file does not exist, or if this document and the catalog disagree (section 7).

## 1. How narration works in the game

- Each moment has **one fixed sentence** (this document). It is spoken and always shown on screen in bold.
- Under it, the game adds **the facts of this mission** as localized text: the science question, margins in percent,
  the event name, the cause of a failure, the next investigation. These are never recorded, so one recording works
  for every mission, every part choice and every result.
- Audio per line and language has a status in the catalog: `to-record` (the browser's speech synthesis reads the
  sentence) or `verified` (a person listened to the file and it says the text word for word: the game plays it).
- Guided lessons (`src/ui/capi/coach.js`: questions, answer options, explanations with real values) are text
  only and are not recorded: they change with every choice. During a lesson's problem step, Capi's spoken sentence
  for that moment stays the same.
- After a few launches, routine sentences (`briefing`, `build-intro`, `launch-choose`, `launch-ready`) are
  shown but no longer spoken, so experienced players hear her only when something changes.
- The voice is optional and separate from the sound effects: the panel's Voice button and the **V** key switch it;
  **M** switches only the effects. While Capi speaks, the effects play at 30% of their volume so they never cover her.
- Without a verified recording, the sentence is read by a voice **installed on the device** (browser speech synthesis).
  Online voices (for example the "Google" voices in Chrome, which send the text to a server) are never used; with no
  local voice for the language, the text is shown alone.
- One line at a time. Changing screen or language, pausing, the countdown, hiding the panel or turning the voice off stops it.
  A line is never repeated by a redraw; "Repeat" is the player's choice. Screen readers hear each new line once (live region).
- Nothing plays before the first click or key press: the panel offers a "Hear Capi" button instead.
- Text is always visible; a blocked, missing or broken file never stops the game.

## 2. The five older English recordings (removed)

Before this catalog existed, five English files were recorded (`menu`, `etapa2`, `evento`, `falha`, `sucesso`).
Their words were never checked and the catalog sentences were written after them, so none was used. One file
could not have served the two event lines (relief and loss) or the eight failure lines (one per real cause).
All 20 lines were recorded again in the three languages, and the five old files were removed on 2026-11-15.

## 3. Audit of the flow: which moments need their own line

| Moment | Own line? | Why |
| --- | --- | --- |
| Menu | Yes (`menu`) | First contact: who she is and what the game is for. |
| Mission briefing (step 1) | **Yes** (`briefing`) | Every mission starts from a science question (docs/learning-design.md, step 1). The step has no other sound; the question and goals change per mission, so they stay as text under a fixed sentence. |
| Spacecraft (step 2) | Yes (`build-intro`, `build-limit`) | Two different jobs: explain that every part has a price, and react when a choice breaks a limit. |
| Launch (step 3) | **Yes** (`launch-choose`, `launch-blocked`, `launch-tight`, `launch-ready`) | The GO / NO-GO decision is the key moment before the flight. The four states need different meaning and tone (hold vs. go), so one sentence cannot cover them. |
| Liftoff | No | The countdown beeps and the rumble already fill it; her text is only shown. |
| Event (flight) | Yes (`event-safe`, `event-hurt`) | Plays only for an event that really happened. Protected and harmed teach opposite lessons. |
| Report | Yes (`report-success` and eight `failure-*` lines) | One sentence per real cause found by the engine (`src/engine/diagnosis.js`): budget, launch, orbit, power, time, data, science, events. An event is never blamed for a failure that happened before it. |
| Rebuild | **Yes** (`rebuild`) | Redesign is where the learning loop closes (Kolb: active experimentation). Asking for one change and a prediction is a distinct instruction, not part of the report. |
| Command center, new agency, Library, Badges | No | Not mission moments; the screens explain themselves. |

## 4. Voice direction

- **Voice:** Google AI Studio prebuilt voice **Sulafat** (listed as warm). **Kore** (firmer) is the alternative if
  Sulafat sounds too soft for `launch-blocked` or in a language. Use the same voice for all lines of one language.
- **Character:** an experienced space commander. Calm, clear, curious, confident and welcoming, with quiet humor.
  She talks to the player as a crew member, not as a child.
- **Never:** childish tone, cartoon voice, exaggerated excitement, or any capybara sound.
- **Pace:** calm, about 2.5 words per second in English; natural pauses at full stops. Keep about 0.25 s of
  silence at the start and end (like the old files).
- **Pronunciation:** "Capi" as KAH-pee in all languages. "GO" is the English word, also in Portuguese and Spanish
  (it is the label the game shows on the checklist).
- **Language:** Brazilian Portuguese (pt-BR); neutral Latin American Spanish with "tú".

## 5. Recording in Google AI Studio (manual, no API)

1. Open the speech generation page in Google AI Studio (single speaker).
2. Choose the voice **Sulafat** (or Kore, see section 4).
3. Paste the style instruction for the language (below), then the exact text of one line.
4. Generate, listen, and repeat until the take says the text word for word with the right tone.
5. Download the WAV and save it as `src/assets/capi/narracao/<lang>/<id>.wav` (for example `pt/launch-ready.wav`).
6. In `src/ui/capi/catalog.js`, set that line's status for that language to `verified`. Only verified audio plays.

Style instructions (paste before the line):

- **English:** `Read in English as Commander Capi, an experienced space mission commander: calm, clear, curious, confident and warm, with a hint of quiet humor. Natural pace, adult tone, not childish, no character voice.`
- **Português (Brasil):** `Leia em português do Brasil como a Comandante Capi, uma comandante de missões espaciais experiente: calma, clara, curiosa, confiante e acolhedora, com um leve humor. Ritmo natural, tom adulto, sem voz infantil nem caricata.`
- **Español:** `Lee en español latinoamericano neutro como la comandante Capi, una comandante de misiones espaciales con experiencia: tranquila, clara, curiosa, segura y cálida, con un toque de humor sereno. Ritmo natural, tono adulto, sin voz infantil ni caricaturesca.`

## 6. Script (20 lines × 3 languages)

The texts below are copied from `src/i18n/`. To change a sentence, change it there first, then here (the test fails
if they differ), and record it again.

### `menu`

- **When:** Title screen.
- **Facts shown under it (text only, never recorded):** Nothing (her sentence says it all).
- **Delivery:** Calm, warm welcome; a little smile on "learn from every flight".
- **Files:** `en/menu.wav`, `pt/menu.wav`, `es/menu.wav`

| Language | Text to record (exact) | Words |
| --- | --- | --- |
| English | Welcome to mission control. I'm Commander Capi. Here, you design a mission, launch it, and learn from every flight. | 19 |
| Português (Brasil) | Boas-vindas ao controle da missão. Eu sou a Comandante Capi. Aqui você projeta uma missão, lança e aprende com cada voo. | 21 |
| Español | Te doy la bienvenida al control de misión: soy la comandante Capi. Diseña una misión, lánzala y aprende de cada vuelo. | 21 |

### `briefing`

- **When:** Step 1, objective.
- **Facts shown under it (text only, never recorded):** The science question, the science goal, the budget and the time limit.
- **Delivery:** Curious and focused, like opening a briefing folder.
- **Files:** `en/briefing.wav`, `pt/briefing.wav`, `es/briefing.wav`

| Language | Text to record (exact) | Words |
| --- | --- | --- |
| English | Every mission starts with a question. Here's ours, and what we need to achieve. | 14 |
| Português (Brasil) | Toda missão começa com uma pergunta. Aqui está a nossa e o que precisamos alcançar. | 15 |
| Español | Toda misión empieza con una pregunta. Esta es la nuestra, y esto es lo que tenemos que lograr. | 18 |

### `build-intro`

- **When:** Step 2, spacecraft (first time in the mission).
- **Facts shown under it (text only, never recorded):** Nothing; the gauges and the next-step hint show the numbers.
- **Delivery:** Practical mentor. Short pause after "data".
- **Files:** `en/build-intro.wav`, `pt/build-intro.wav`, `es/build-intro.wav`

| Language | Text to record (exact) | Words |
| --- | --- | --- |
| English | Every part has a price: mass, power, money and data. Add one at a time and watch the gauges. | 19 |
| Português (Brasil) | Cada peça tem um preço: massa, energia, dinheiro e dados. Adicione uma por vez e observe os medidores. | 18 |
| Español | Cada pieza tiene un precio: masa, energía, dinero y datos. Agrega una a la vez y observa los indicadores. | 19 |

### `build-limit`

- **When:** Step 2, right after a choice pushes a gauge over its limit.
- **Facts shown under it (text only, never recorded):** Which limit (budget, mass, power, data or time) and why it matters.
- **Delivery:** Alert but calm; never scolding.
- **Files:** `en/build-limit.wav`, `pt/build-limit.wav`, `es/build-limit.wav`

| Language | Text to record (exact) | Words |
| --- | --- | --- |
| English | Careful, that choice crossed a limit. Check the gauge in alert and adjust before we fly. | 16 |
| Português (Brasil) | Atenção: essa escolha passou de um limite. Veja o medidor em alerta e ajuste antes de voar. | 17 |
| Español | Cuidado: esa elección superó un límite. Revisa el indicador en alerta y ajústalo antes de volar. | 16 |

### `launch-choose`

- **When:** Step 3, while orbit or rocket is missing.
- **Facts shown under it (text only, never recorded):** Pick an orbit first, or the mass the rocket must carry.
- **Delivery:** Light, forward-looking.
- **Files:** `en/launch-choose.wav`, `pt/launch-choose.wav`, `es/launch-choose.wav`

| Language | Text to record (exact) | Words |
| --- | --- | --- |
| English | Now choose where we're going, and a rocket strong enough to take us there. | 14 |
| Português (Brasil) | Agora escolha para onde vamos e um foguete com força para nos levar até lá. | 15 |
| Español | Ahora elige adónde vamos y un cohete con la fuerza suficiente para llevarnos. | 13 |

### `launch-blocked`

- **When:** Step 3, when a real problem would stop the flight.
- **Facts shown under it (text only, never recorded):** The problem and the step that fixes it.
- **Delivery:** Firm and steady, like a flight director calling a hold.
- **Files:** `en/launch-blocked.wav`, `pt/launch-blocked.wav`, `es/launch-blocked.wav`

| Language | Text to record (exact) | Words |
| --- | --- | --- |
| English | Let's hold the launch. Something in this design would stop the flight. We fix it first. | 16 |
| Português (Brasil) | Vamos segurar o lançamento. Algo neste projeto pararia o voo. Primeiro, a gente corrige. | 14 |
| Español | Paremos el lanzamiento. Algo en este diseño detendría el vuelo. Primero lo corregimos. | 13 |

### `launch-tight`

- **When:** Step 3, valid design with thin margins.
- **Facts shown under it (text only, never recorded):** Which resources have thin margins.
- **Delivery:** Thoughtful; a gentle warning.
- **Files:** `en/launch-tight.wav`, `pt/launch-tight.wav`, `es/launch-tight.wav`

| Language | Text to record (exact) | Words |
| --- | --- | --- |
| English | We can fly, but some margins are thin. A surprise there could cost us science. | 15 |
| Português (Brasil) | Dá para voar, mas algumas folgas estão pequenas. Um imprevisto ali pode custar ciência. | 14 |
| Español | Podemos volar, pero algunos márgenes son pequeños. Un imprevisto ahí podría costarnos ciencia. | 13 |

### `launch-ready`

- **When:** Step 3, everything GO with margins.
- **Facts shown under it (text only, never recorded):** Nothing.
- **Delivery:** Confident and proud; "GO" said clearly.
- **Files:** `en/launch-ready.wav`, `pt/launch-ready.wav`, `es/launch-ready.wav`

| Language | Text to record (exact) | Words |
| --- | --- | --- |
| English | All systems GO, with room to spare. Margins are what protect us from surprises. | 14 |
| Português (Brasil) | Todos os sistemas GO, com folga. É a folga que nos protege dos imprevistos. | 14 |
| Español | Todos los sistemas en GO, con margen. El margen es lo que nos protege de los imprevistos. | 17 |

### `event-safe`

- **When:** Flight, when the science phase shows an event the margin absorbed.
- **Facts shown under it (text only, never recorded):** The event, the resource, its margin and the safe threshold.
- **Delivery:** Quick surprise, then relief.
- **Files:** `en/event-safe.wav`, `pt/event-safe.wav`, `es/event-safe.wav`

| Language | Text to record (exact) | Words |
| --- | --- | --- |
| English | A surprise up here, but our margin absorbed it. That spare room paid off. | 14 |
| Português (Brasil) | Um imprevisto aqui em cima, mas a nossa folga segurou. Guardar espaço valeu a pena. | 15 |
| Español | Un imprevisto aquí arriba, pero nuestro margen lo absorbió. Guardar espacio valió la pena. | 14 |

### `event-hurt`

- **When:** Flight, when the science phase shows an event that cost science.
- **Facts shown under it (text only, never recorded):** The event, the resource, its margin, the threshold and the science lost.
- **Delivery:** Honest and calm; no drama.
- **Files:** `en/event-hurt.wav`, `pt/event-hurt.wav`, `es/event-hurt.wav`

| Language | Text to record (exact) | Words |
| --- | --- | --- |
| English | A surprise hit us, and we didn't have enough margin. It cost us some science. | 15 |
| Português (Brasil) | Um imprevisto nos atingiu e faltou folga. Isso nos custou parte da ciência. | 13 |
| Español | Nos golpeó un imprevisto y nos faltó margen. Eso nos costó parte de la ciencia. | 15 |

### `failure-budget`

- **When:** Report, failed because the mission cost more than the budget.
- **Facts shown under it (text only, never recorded):** The next investigation (the report shows the numbers).
- **Delivery:** Matter-of-fact, no blame.
- **Files:** `en/failure-budget.wav`, `pt/failure-budget.wav`, `es/failure-budget.wav`

| Language | Text to record (exact) | Words |
| --- | --- | --- |
| English | We never left the ground: the mission cost more than we had. | 12 |
| Português (Brasil) | Nem saímos do chão: a missão custou mais do que tínhamos. | 11 |
| Español | Ni siquiera despegamos: la misión costó más de lo que teníamos. | 11 |

### `failure-launch`

- **When:** Report, failed at launch: no rocket, or the rocket could not carry the spacecraft there.
- **Facts shown under it (text only, never recorded):** The next investigation (the report shows the numbers).
- **Delivery:** Calm and clear; stress "match the trip".
- **Files:** `en/failure-launch.wav`, `pt/failure-launch.wav`, `es/failure-launch.wav`

| Language | Text to record (exact) | Words |
| --- | --- | --- |
| English | The rocket couldn't carry us there. Spacecraft and rocket have to match the trip. | 14 |
| Português (Brasil) | O foguete não conseguiu nos levar. Nave e foguete precisam combinar com a viagem. | 14 |
| Español | El cohete no pudo llevarnos. La nave y el cohete tienen que estar a la altura del viaje. | 18 |

### `failure-orbit`

- **When:** Report, failed because there was no orbit or the orbit does not fit the mission.
- **Facts shown under it (text only, never recorded):** The next investigation.
- **Delivery:** Calm, thoughtful.
- **Files:** `en/failure-orbit.wav`, `pt/failure-orbit.wav`, `es/failure-orbit.wav`

| Language | Text to record (exact) | Words |
| --- | --- | --- |
| English | We never reached our orbit. Without the right place, there is no science. | 13 |
| Português (Brasil) | Não chegamos à nossa órbita. Sem o lugar certo, não há ciência. | 12 |
| Español | No llegamos a nuestra órbita. Sin el lugar correcto, no hay ciencia. | 12 |

### `failure-power`

- **When:** Report, failed in the science phase for lack of power.
- **Facts shown under it (text only, never recorded):** The next investigation (the report shows the watts).
- **Delivery:** Quiet, a little sad, then steady.
- **Files:** `en/failure-power.wav`, `pt/failure-power.wav`, `es/failure-power.wav`

| Language | Text to record (exact) | Words |
| --- | --- | --- |
| English | We ran out of power, and the instruments went dark. | 10 |
| Português (Brasil) | Faltou energia, e os instrumentos se apagaram. | 7 |
| Español | Nos faltó energía, y los instrumentos se apagaron. | 8 |

### `failure-time`

- **When:** Report, failed because trip and science do not fit the time limit.
- **Facts shown under it (text only, never recorded):** The next investigation (the report shows the days).
- **Delivery:** Calm; a hint of urgency on "out of time".
- **Files:** `en/failure-time.wav`, `pt/failure-time.wav`, `es/failure-time.wav`

| Language | Text to record (exact) | Words |
| --- | --- | --- |
| English | We ran out of time before the science was done. | 10 |
| Português (Brasil) | O tempo acabou antes de a ciência terminar. | 8 |
| Español | Se nos acabó el tiempo antes de terminar la ciencia. | 10 |

### `failure-data`

- **When:** Report, failed because the data did not reach Earth (no antenna, or an antenna too slow for the science goal).
- **Facts shown under it (text only, never recorded):** How much data was made and sent, and how much science could reach Earth.
- **Delivery:** Thoughtful; stress "made it home".
- **Files:** `en/failure-data.wav`, `pt/failure-data.wav`, `es/failure-data.wav`

| Language | Text to record (exact) | Words |
| --- | --- | --- |
| English | The science was up there, but too little of it made it home. | 13 |
| Português (Brasil) | A ciência estava lá em cima, mas pouco dela chegou em casa. | 12 |
| Español | La ciencia estaba allá arriba, pero muy poca llegó a casa. | 11 |

### `failure-science`

- **When:** Report, failed because the instruments cannot reach the science goal, even with all the data home.
- **Facts shown under it (text only, never recorded):** The science the instruments can give and the goal.
- **Delivery:** Kind and encouraging.
- **Files:** `en/failure-science.wav`, `pt/failure-science.wav`, `es/failure-science.wav`

| Language | Text to record (exact) | Words |
| --- | --- | --- |
| English | We flew well, but our instruments couldn't reach the science goal. | 11 |
| Português (Brasil) | Voamos bem, mas nossos instrumentos não alcançaram a meta de ciência. | 11 |
| Español | Volamos bien, pero nuestros instrumentos no alcanzaron la meta de ciencia. | 11 |

### `failure-events`

- **When:** Report, failed only because random events took the science below the goal (never used when the design was already short).
- **Facts shown under it (text only, never recorded):** The science before the events, the goal, the science after them and the events.
- **Delivery:** Honest, warm; "surprises" with a small sigh.
- **Files:** `en/failure-events.wav`, `pt/failure-events.wav`, `es/failure-events.wav`

| Language | Text to record (exact) | Words |
| --- | --- | --- |
| English | Our design was enough, but the surprises took too much science. | 11 |
| Português (Brasil) | Nosso projeto dava conta, mas os imprevistos levaram ciência demais. | 10 |
| Español | Nuestro diseño alcanzaba, pero los imprevistos se llevaron demasiada ciencia. | 10 |

### `report-success`

- **When:** Report, successful mission.
- **Facts shown under it (text only, never recorded):** Science delivered and the goal, and the next investigation.
- **Delivery:** Joyful but controlled; curious on the question.
- **Files:** `en/report-success.wav`, `pt/report-success.wav`, `es/report-success.wav`

| Language | Text to record (exact) | Words |
| --- | --- | --- |
| English | Mission accomplished! The science made it home. Now, can we do even better? | 13 |
| Português (Brasil) | Missão cumprida! A ciência chegou em casa. E agora, dá para fazer ainda melhor? | 14 |
| Español | ¡Misión cumplida! La ciencia llegó a casa. ¿Y ahora, podemos hacerlo aún mejor? | 13 |

### `rebuild`

- **When:** After "Redesign", on the step the player lands on.
- **Facts shown under it (text only, never recorded):** The cause of the last flight (or that it worked) and a question to guide the hypothesis.
- **Delivery:** Encouraging coach; slow down on "predict".
- **Files:** `en/rebuild.wav`, `pt/rebuild.wav`, `es/rebuild.wav`

| Language | Text to record (exact) | Words |
| --- | --- | --- |
| English | Time to rebuild. Change one thing, predict what it will do, then launch to test it. | 16 |
| Português (Brasil) | Hora de reconstruir. Mude uma coisa, preveja o efeito e lance para testar. | 13 |
| Español | Hora de reconstruir. Cambia una cosa, predice qué hará y lanza para comprobarlo. | 13 |

## 7. Recording checklist

| Line | English | Português | Español |
| --- | --- | --- | --- |
| `menu` | recorded and integrated | recorded and integrated | recorded and integrated |
| `briefing` | recorded and integrated | recorded and integrated | recorded and integrated |
| `build-intro` | recorded and integrated | recorded and integrated | recorded and integrated |
| `build-limit` | recorded and integrated | recorded and integrated | recorded and integrated |
| `launch-choose` | recorded and integrated | recorded and integrated | recorded and integrated |
| `launch-blocked` | recorded and integrated | recorded and integrated | recorded and integrated |
| `launch-tight` | recorded and integrated | recorded and integrated | recorded and integrated |
| `launch-ready` | recorded and integrated | recorded and integrated | recorded and integrated |
| `event-safe` | recorded and integrated | recorded and integrated | recorded and integrated |
| `event-hurt` | recorded and integrated | recorded and integrated | recorded and integrated |
| `failure-budget` | recorded and integrated | recorded and integrated | recorded and integrated |
| `failure-launch` | recorded and integrated | recorded and integrated | recorded and integrated |
| `failure-orbit` | recorded and integrated | recorded and integrated | recorded and integrated |
| `failure-power` | recorded and integrated | recorded and integrated | recorded and integrated |
| `failure-time` | recorded and integrated | recorded and integrated | recorded and integrated |
| `failure-data` | recorded and integrated | recorded and integrated | recorded and integrated |
| `failure-science` | recorded and integrated | recorded and integrated | recorded and integrated |
| `failure-events` | recorded and integrated | recorded and integrated | recorded and integrated |
| `report-success` | recorded and integrated | recorded and integrated | recorded and integrated |
| `rebuild` | recorded and integrated | recorded and integrated | recorded and integrated |

When a file is recorded, listened to and marked `verified` in `catalog.js`, change its cell here to
"recorded and integrated" (the test checks that both say the same) and update the counts in section 0.
