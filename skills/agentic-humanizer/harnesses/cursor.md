# Harness Routing — Cursor

`SKILL.md` routes here when running inside Cursor 2.4 or later. Cursor
exposes `AskQuestion` for multiple-choice prompts in agent sessions.

## The interview: four or five sequential AskQuestion calls

Cursor's AskQuestion (as of 2.4) takes one question per call. Issue the
four required questions below in sequence; do not bundle. Add the fifth
voice question only when no inline or saved `voice_path` has resolved,
`~/.agentic-humanizer/voice.txt` is absent, and the saved profile does not
contain `"voice_skip": true`.

```text
AskQuestion({
  title: "Dialect",
  message: "Which English variant should the rewrite target?",
  options: ["American English", "British English", "Other"]
})

AskQuestion({
  title: "Reading level",
  message: "What reading level should the output target?",
  options: [
    "Elementary (Grade 3–5)",
    "Middle school (Grade 6–8)",
    "High school (Grade 9–11)",
    "College (Grade 12–15)",
    "Graduate or professional (Grade 16+)"
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

- Q1 → `dialect`: `American English` → `us`, `British English` → `uk`,
  `Other` → prompt for the dialect string in the next user turn.
- Q2 → `target_grade`: 4, 7, 10, 13, 17 in order.
- Q3 → `tone`: lowercase the label.
- Q4 → `length_policy`: `Keep within ±10% of original` → `±10`,
  `Allow expansion` → `exp`, `Allow trimming` → `trim`.
- Q5 → voice choice: `Yes` starts Step 4 sample capture, `No` skips
  voice matching for this call, `Never ask again` persists `voice_skip`.

When Q5 is `Yes`, say exactly: *"Paste 200+ words as your next message."*
Capture the next user turn as the voice sample and return to `SKILL.md`
Step 4 for validation, writing, and fingerprint extraction.

Return to `SKILL.md` § Loop algorithm with these answers.

## Fallback

If `AskQuestion` is blocked (e.g., the usage-limit overlay covers the
prompt) or returns an error, fall through to `harnesses/generic.md`'s
plain-text protocol.
