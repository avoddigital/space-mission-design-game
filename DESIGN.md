# DESIGN.md — "Console Tupi" visual identity

The look and sound of Tupi Orbit (Space Mission Design Game).
This file is the source of truth for colors, type, shapes, motion and sound.
Tokens live in `src/style.css` (`:root`) and sounds in `src/ui/sound.js`. If you change a value there, change it here too.

## 1. The idea

**The player sits at a 1960s mission control console.** Every screen is a piece of hardware:

- **Metal plates** with four screws hold the panels (choices, meters, top bar).
- **Plug-in modules** are the choices. Each module has a small status lamp that lights green when you pick it.
- **Indicator lamps** say the state of things: GO (green), CAUTION (amber), NO-GO (orange alert). The checklist is an annunciator panel, like the warning lights in a real control room.
- **Amber digit displays** show every number (budget, mass, days, score).
- **The viewscreen** in the middle is a dark monitor in a thick bezel, with faint scan lines. The 3D spacecraft and the flight appear there.
- **Portholes** show the planets on the main menu: round windows with a metal ring and glass reflection.
- **The Launch button is guarded**: it has a yellow and black hazard-stripe frame, like a real arming switch.
- **Placards**: the "Learn" boxes and fun facts are cream instruction plates riveted to the panel, like the instruction labels on real consoles.

Why it fits: the game is about designing and flying a real mission, so the interface is the tool a mission team would use. Every decoration is a real console part with a job; nothing is there only to look nice.

What we avoid: generic "AI space UI" (navy with neon cyan, glass with blur, purple gradients, glowing outlines everywhere), and also the "neobrutalist" look (thick black borders, hard offset shadows, flat sticker colors).

## 2. Color

One dark theme. The hardware is gray-green and neutral; **color only comes from lamps, displays and planets**, so anything colored means something.

| Token | Name | Hex | Job |
| --- | --- | --- | --- |
| `--room` | Room | `#121514` | Page background (the room behind the console) |
| `--console` | Console | `#2D3331` | Panel face |
| `--console-hi` | Console highlight | `#3A423F` | Top of panels and modules (light from above) |
| `--console-lo` | Recess | `#222725` | Recessed areas: gauges, inputs, readiness |
| `--bezel` | Bezel | `#0C0E0D` | Display windows, lamp sockets, unlit LEDs |
| `--label` | Label | `#E8E4D6` | Main text (engraved white) |
| `--label-sub` | Label dim | `#9BA39D` | Secondary text |
| `--placard` | Placard | `#E3DCC6` | Instruction plates (Learn, facts), with `--placard-ink` `#23211B` text |
| `--lamp-go` | GO lamp | `#5CCF86` | GO, picked, success, power made |
| `--lamp-caution` | Caution lamp | `#F2B33D` | Caution, the current step, the main lit button |
| `--lamp-alert` | Alert lamp | `#E4733F` | NO-GO, over the limit, failure. A warm orange, not a bright red. |
| `--lamp-on` | Info lamp | `#8EC5FF` | Normal level on a gauge, links, information |
| `--digits` | Digits | `#FFBE55` | Numbers on displays, the "ORBIT" in the title |

**Mission accents** (`--accent`, set by `[data-mission]`): Earth `#5C9AE6`, Moon `#B7B2D6`, Mars `#D9774A`. Used only for the mission name in the top bar, the horizon glow on the viewscreen and the score bar.

Rules:
- A lamp is either off (dark socket) or on (its color plus a soft glow of the same color). Never a glow without a lamp.
- Status is never shown by color alone: every lamp has a word (GO, CHECK, NO-GO, Over limit) or an icon.
- Text on dark is `--label` or `--label-sub`. Text on a lit lamp or button is a very dark tone of the same color, for contrast.
- Gradients only for the light on metal (top lighter than bottom), the planets and the viewscreen sky.

## 3. Type

All fonts are free (Google Fonts, SIL Open Font License), loaded in `index.html` with `display=swap` and system fallbacks.

| Role | Font | Use |
| --- | --- | --- |
| Display | **Big Shoulders Stencil** 700–800 | Titles, mission names, the verdict, countdown numbers. Stencil letters like the paint on rockets and launch pads. Always uppercase. |
| Text | **B612** 400 / 700 | Everything people read. B612 was designed for aircraft cockpit screens, so it stays clear at small sizes. |
| Data | **B612 Mono** 400 / 700 | Numbers, units, small labels and lamp captions (`120 kg`, `GO`, `T-MINUS`). |

Small labels (section names, captions) are B612 Mono uppercase with wide letter spacing, followed by a thin engraved line, like labels printed on a console.

## 4. Shape and material

- **Corners:** small. `--r-1: 3px` (lamps, tags), `--r-2: 6px` (modules, panels, buttons). The viewscreen has `14px`, like an old monitor.
- **Raised parts** (`--raised`): buttons, modules and plates have a thin light line on top and a dark line at the bottom, plus a small soft shadow.
- **Recessed parts** (`--recessed`): gauges, display windows and the tab tray are pushed into the panel with an inner shadow.
- **Screws** (`--screws`): four small screws in the corners of every plate (top bar, panels, menu cards, modals). Made with CSS gradients.
- **Pressed state:** a pushed button moves 1px down and turns recessed.

## 5. Layout

- Title and new agency screens: the viewscreen shows Earth from space on one side, the controls on the other. Flags are small framed plates, never the only label (the country name is always written).
- Command center (campaign): agency plate on top (flag, funds, science, month as amber readouts), mission phases on the left (lamp: green done, amber next, dark locked), the globe in the middle (the Moon and Mars light up as they unlock, an amber ring marks the next destination), operations on the right (side jobs and research).
- Top bar: the mission name in a display window, then the 5 steps as a row of annunciator lamps (amber = current step, green = done, dark = not yet).
- Left: the choice panel. Middle: the viewscreen. Right: the gauge panel.
- Mission Library and Badges are full screens over the game (Esc or the back button returns): a plate on top, tabs or a progress bar, and a grid of cards that scrolls inside its own area.
- On screens 861px and wider the game fills the window and the page never scrolls; only a long list scrolls inside its own panel.
- On phones (860px and less) the page scrolls as one column and no panel scrolls inside the page:
  - Design steps: top bar, then a **gauge strip** that stays on top while scrolling (six small gauges: icon and bar only; tap one for its details), then the choices, then the viewscreen or the launch checklist.
  - Flight and report: the phases or the report first, then the viewscreen, then the gauges.
  - Command center: agency plate, globe, mission phases, operations.
  - The **main buttons stay at the bottom of the screen** (Back / Next, Launch, Skip / See report, Plan mission, Found agency, Start mission). The report is the exception: it is a long read, so its four buttons wait at the end, in two rows.
  - The launch checklist shows only the name of the lines that are GO; lines to check keep their explanation.
  - On narrow phones (360px and less) the top bar keeps only this mission's stars and the current step's name.
  - Messages (toasts) appear above the bottom buttons; a message box taller than the screen starts at the top and scrolls.
- Touch targets are at least 40px (44px for the main buttons).
- **A player's own device in team play** (`?sala=CODE`): one short bar on top (brand, the player's number, name and roles, whose turn it is, room code, language), then the same game screen as the main device. On the player's turn the bar glows amber and says "Your turn!". The GO / NO-GO poll opens as one strip under the bar: the player's consoles on the left, GO and NO-GO on the right. On wide screens the bar keeps one line and the game fills the rest of the window, so nothing is cut off.

## 6. Motion

- Short and mechanical: 80–180ms with `cubic-bezier(.2,.8,.2,1)`.
- Lamps switch on with a quick flicker (`lamp-on`). A running phase and a "Risky" gauge blink slowly.
- The Launch button pulses softly only when everything is GO.
- Countdown numbers drop in like a range clock; liftoff shakes the console.
- A new badge slides in at the top right ("badge-in"), stays about 5 seconds and fades.
- `prefers-reduced-motion` turns all animations off.

## 7. Sound

All sounds are **synthesized at runtime with the Web Audio API** (`src/ui/sound.js`). No audio files, no library, nothing to license. They match the console: switch clicks, short beeps and a rumble.

| Event | Sound |
| --- | --- |
| Button / tab | soft click (very short triangle tick) |
| Pick a part | two rising notes |
| Remove a part | two falling notes |
| Not allowed / limit broken | low double buzz |
| Open a window | short rising tick |
| Countdown 3-2-1 | one beep per number, higher on the last one |
| Liftoff | filtered noise rumble that rises and fades (~2 s) |
| Phase complete | short two-note chime |
| Random event that hurt | warning blip |
| Mission success | four-note rising arpeggio |
| Mission failure | slow falling tone |
| Quiz right / wrong | chime / buzz |
| Side job worked / failed | success arpeggio / falling tone |
| Agency founded, badge earned | success arpeggio |

Rules:
- Sound starts only after the first click or key press (browser rule).
- **Mute** button (effects and music; Capi's voice has its own switch) in the top bar, the title screen, the command center, the Library and Badges, plus the `M` key. The choice is saved in `localStorage` (if storage is blocked, the game just does not remember it).
- Master volume is low (0.18). No sound effect is longer than about 2 seconds, and no effect loops.
- **Background music:** slow, quiet ambient loops, also synthesized (soft chords that cross-fade, a few random high notes and an echo). Each part of the game has its own theme, and changing theme cross-fades:
  - **Menus, command center, Library, Badges:** calm and open (A minor, F major 7, C major, G sus2).
  - **Earth missions:** warm and hopeful, with a gentle arpeggio (C major 7, A minor 7, F major 7, G6).
  - **Moon missions:** cold, sparse and still: open fifths, pure sine tones, a very long echo.
  - **Mars missions:** dark and dusty: E Phrygian chords with a gritty edge, a slow low beat and wind.

  The music plays at 18% of the master volume, only on the main device, stops while the tab is hidden and follows the same Mute button.
- Every sound has a visual equivalent, so the game is fully playable muted.

### 7.1 Commander Capi's voice (narration)

The sound effects above stay synthesized. Narration is separate (`src/ui/capi/`):
- Each line has one fixed sentence from the narration catalog (`src/ui/capi/catalog.js`, scripts in `docs/capi-narration.md`): it is spoken and shown in bold. The facts of the mission (numbers, names, causes) follow as text only. Voice on/off (also the `V` key), Repeat and Hide are on her panel. The voice is independent from the effects and music: `M` mutes only those, and while she speaks they drop to 30% of their volume (`duck` in `src/ui/sound.js`).
- Recordings (`src/assets/capi/narracao/<lang>/<id>.wav`) are loaded only when their line plays, and only when the catalog marks them as verified; until then a voice installed on the device reads the same sentence (online voices are never used). Both are free, with no service or key. Status of the recordings: `docs/capi-narration.md`, section 0 (all 20 lines recorded in the three languages).
- Screen readers hear each new line once, from a live region outside the redrawn game area.
- Nothing plays before the first click or key press: the panel shows a "Hear Capi" button instead. A new screen, a language change, pause, the countdown, hiding the panel or turning the voice off stops the line.
- She speaks only on real changes (new screen, a limit just broken, an event that happened, the report, a redesign), never twice for the same line in a mission.

Her panel is a CAPCOM radio plate: a recessed strip at the top of the left panel (under the title on the menu), with a small monitor showing her portrait (192 px copies of the artwork in `src/assets/capi/ui/`), an "On air" lamp while she speaks and a left edge in the lamp color of the moment.

## 8. Icons and emblem

- Line icons in `src/ui/components/icons.js`, 2px stroke, `currentColor`.
- The emblem (menu and favicon) is a planet with its orbit and a small spacecraft with amber body, drawn in SVG.

## 9. Components added for the campaign

- **Readout:** a caption in small mono letters over an amber number in a recessed window (funds, science, month, discovered).
- **Phase card:** a module with the status lamp (green done, amber next and blinking, dark locked) and a stamped tag.
- **Mission patch (badge):** a round patch with a stitched edge. Earned: blue fabric, amber ring, amber icon, soft glow. Not earned: dark recessed circle, dim icon, the card stays readable with the description of how to earn it.
- **Locked Library entry:** hazard-striped dark window instead of the photo, "Not discovered yet" and the way to discover it.
- **Part badges:** small stamped tags on part and rocket cards: green for a strength ("High science", "Light"), amber for the price to pay ("Heavy", "Lots of data").
- **Language button:** globe icon plus the current language code (EN, PT, ES); it switches to the next language. Next to the sound button everywhere.
- **Rank plate** (Free mission screen): a metal plate with screws. The medal insignia sits in a recessed round socket, the rank name is in stencil letters under a mono "RANK" caption, a dark window holds 9 star lamps (amber when earned, with a gap where each new rank starts), and an amber readout shows the stars. In the top bar the rank is a small recessed display (medal icon, rank, this mission's stars). No emoji.
- **Next-step hint (CAPCOM readout):** a message window recessed into the panel, with a small round lamp and a mono caption: blue "CAPCOM" for the next step, amber "CHECK" for a problem, green "GO" when ready. The message is plain text, no emoji; "Open …" is a small console push button.
- **Example mission card** (Free mission screen, four for the chosen mission): a small module with a round recessed icon window, the example's name and one line on what to watch; one click launches it.
- **Example box** (report of an example): a recessed panel with a blue left edge, a verdict pill (green "Good result", amber "Risky", orange "Bad result"), what the example shows, how to read the numbers and what to try.

## 10. Languages and text length

- Portuguese and Spanish texts are often 20–30% longer than English. Buttons and tags must wrap or ellipsize, never overflow; test every new screen in all three languages.
- Numbers follow the language (decimal comma in Portuguese and Spanish); units stay SI.

## 11. Checklist for new screens

- Uses the tokens, not new hex values.
- A new panel is a plate (`--screws`, `--raised`); a new value is shown in a recessed display with `--digits`.
- Color appears only as a lamp, a display or a planet, and every lamp has a word.
- Titles in the stencil font, numbers in B612 Mono.
- New interactions call `play(...)` with an existing sound name before inventing a new one.
- Works at 360px wide, with reduced motion, and without page scroll on a 1366×768 laptop.
- Every text comes from `t()` and exists in English, Portuguese and Spanish.
