# Harness Routing — Claude Code

`SKILL.md` routes here when running inside Claude Code (v2.0.21 or later).
Claude Code exposes the `AskUserQuestion` tool for structured multiple-choice
prompts.

## The interview — one tool call

Issue exactly one `AskUserQuestion` call with all eligible questions in the
same `questions` array. This is faster for the user (one panel) and cleaner
for the model context (one tool result instead of several).

Only add Q5 when no inline or saved `voice_path` has resolved,
`~/.agentic-humanizer/voice.txt` is absent, and the saved profile does not
contain `"voice_skip": true`.

```json
{
  "questions": [
    {
      "header": "Dialect",
      "question": "Which English variant should the rewrite target?",
      "multiSelect": false,
      "options": [
        { "label": "American English", "description": "Default for US audiences." },
        { "label": "British English", "description": "Use UK spellings and idioms." },
        { "label": "Other", "description": "I'll specify a variant in my next message." }
      ]
    },
    {
      "header": "Reading level",
      "question": "What reading level should the output target?",
      "multiSelect": false,
      "options": [
        { "label": "Elementary (Grade 3–5)" },
        { "label": "Middle school (Grade 6–8)" },
        { "label": "High school (Grade 9–12)" },
        { "label": "College (Grade 13–15)" },
        { "label": "Graduate or professional (Grade 16+)" }
      ]
    },
    {
      "header": "Tone",
      "question": "What tone should the output use?",
      "multiSelect": false,
      "options": [
        { "label": "Casual" },
        { "label": "Professional" },
        { "label": "Academic" }
      ]
    },
    {
      "header": "Length",
      "question": "Length policy for the rewrite?",
      "multiSelect": false,
      "options": [
        { "label": "Keep within ±10% of original" },
        { "label": "Allow expansion" },
        { "label": "Allow trimming" }
      ]
    },
    {
      "header": "Voice",
      "question": "Mimic a writing sample of yours?",
      "multiSelect": false,
      "options": [
        { "label": "Yes" },
        { "label": "No" },
        { "label": "Never ask again" }
      ]
    }
  ]
}
```

Omit the `Voice` object when Q5 is not eligible.

## After the interview

Map the labels to internal variables:

- Q1 → `dialect`: `American English` → `us`, `British English` → `uk`,
  `Other` → prompt for the string in the next user turn.
- Q2 → `target_grade`: 4, 7, 10, 14, 17 in order.
- Q3 → `tone`: lowercase the label.
- Q4 → `length_policy`: `Keep within ±10% of original` → `±10`,
  `Allow expansion` → `exp`, `Allow trimming` → `trim`.
- Q5 → voice choice: `Yes` starts Step 3.5 sample capture, `No` skips
  voice matching for this call, `Never ask again` persists `voice_skip`.

When Q5 is `Yes`, say exactly: *"Paste 200+ words as your next message."*
Capture the next user turn as the voice sample and return to `SKILL.md`
Step 3.5 for validation, writing, and fingerprint extraction.

Return to `SKILL.md` § Loop algorithm with these answers.

## Fallback

If `AskUserQuestion` returns an error or is unavailable, fall through to
`harnesses/generic.md`'s plain-text protocol.
