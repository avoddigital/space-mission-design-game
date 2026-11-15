# Commander Capi narration files

One WAV file per narration line and language:

```
narracao/<lang>/<id>.wav     lang: en | pt | es     id: a line of src/ui/capi/catalog.js
```

Example: `narracao/pt/launch-ready.wav`. The exact text of every line, the voice direction and the recording
steps are in `docs/capi-narration.md`. A file is played only after a person has listened to it, confirmed it says
the catalog text word for word, and set that line's status to `verified` in `src/ui/capi/catalog.js`.

## What is here now

- `en/`, `pt/`, `es/`: all 20 lines in each language, recorded and marked `verified` (2026-11-15).

Until a line is recorded and verified, the game reads the same sentence with a voice installed on the player's
device (browser speech synthesis, never an online voice), or shows the text only.
