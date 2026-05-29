# Harness Routing — Cursor

`SKILL.md` routes here when running inside Cursor 2.4 or later. Cursor
exposes `AskQuestion` for multiple-choice prompts in agent sessions.

## The interview: four or five sequential AskQuestion calls

Cursor's AskQuestion (as of 2.4) takes one question per call. Issue the
four required questions below in sequence; do not bundle. Add the fifth
voice question only when no inline or saved `voice_path` has resolved,
`~/.agentic-humanizer/voice.txt` is absent, and the saved profile does not
contain `"voice_skip": true`.

Before Q1, detect the source language (see `SKILL.md` Step 3) and build Q1's
options from `references/multilingual.md` for the detected language; show Q2's
bands in that language's metric. The blocks below show the English default.

```text
AskQuestion({
  title: "Language",
  message: "Detected English. Confirm language and variant:",
  options: ["American English (en-US)", "British English (en-GB)", "Other (different language)"]
})

AskQuestion({
  title: "Reading level",
  message: "What reading level should the output target?",
  options: [
    "Elementary (English Grade 3-5)",
    "Middle school (English Grade 6-8)",
    "High school (English Grade 9-11)",
    "College (English Grade 12-15)",
    "Graduate or professional (English Grade 16+)"
  ]
})

AskQuestion({
  title: "Tone",
  message: "What tone should the output use?",
  options: ["Casual", "Professional", "Academic"]
})

AskQuestion({
  title: "Length",
  message: "Length policy for the rewrite?",
  options: [
    "Keep within ±10% of original",
    "Allow expansion",
    "Allow trimming"
  ]
})

AskQuestion({
  title: "Voice",
  message: "Mimic a writing sample of yours?",
  options: ["Yes", "No", "Never ask again"]
})
```

Omit the `Voice` call when Q5 is not eligible.

## After the interview

Map the chosen labels to internal variables (same as Claude Code):

- Q1 → `language` and `variant`: read the chosen variant (`American English
  (en-US)` → `en` / `en-US`). `Other (different language)` → prompt for the
  language next turn, resolve against `references/multilingual.md`, then ask its
  variant.
- Q2 → `reading_level`: `elementary`, `middle`, `high_school`, `college`,
  `graduate` in order. For English only, also set `target_grade` (4, 7, 10, 13,
  17).
- Q3 → `tone`: lowercase the label.
- Q4 → `length_policy`: `Keep within ±10% of original` → `±10`,
  `Allow expansion` → `exp`, `Allow trimming` → `trim`.
- Q5 → voice choice: `Yes` starts Step 4 sample capture, `No` skips
  voice matching for this call, `Never ask again` persists `voice_skip`.

When Q5 is `Yes`:

1. If Q1 was `Other (different language)`, first capture the language from the
   user's next turn, resolve it and its variant against
   `references/multilingual.md`, and finalize `language` and `variant`. Only
   continue to step 2 after they are resolved.
2. Say exactly: *"Paste 200+ words as your next message."*
3. Capture the next user turn as the voice sample and return to
   `SKILL.md` Step 4 for validation, writing, and fingerprint extraction.

Return to `SKILL.md` § Loop algorithm with these answers.

## Fallback

If `AskQuestion` is blocked (e.g., the usage-limit overlay covers the
prompt) or returns an error, fall through to `harnesses/generic.md`'s
plain-text protocol.
