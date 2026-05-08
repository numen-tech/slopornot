# Harness Routing — Gemini CLI

`SKILL.md` routes here when running inside Gemini CLI. Gemini exposes a
structured-question tool (referenced as `ask_user` in the superpowers
tool mapping) that accepts a `questions` array with `header`, `question`,
`type`, and `options` fields — structurally similar to Claude Code's
`AskUserQuestion`.

## The interview — one tool call

Bundle all four required questions in one call. Add Q5 to the same
`questions` array only when no inline or saved `voice_path` has resolved,
`~/.agentic-humanizer/voice.txt` is absent, and the saved profile does not
contain `"voice_skip": true`.

```json
{
  "questions": [
    {
      "header": "Dialect",
      "question": "Which English variant should the rewrite target?",
      "type": "choice",
      "options": [
        { "label": "American English", "description": "Default for US audiences." },
        { "label": "British English", "description": "Use UK spellings and idioms." },
        { "label": "Other", "description": "I'll specify a variant in my next message." }
      ]
    },
    {
      "header": "Reading level",
      "question": "What reading level should the output target?",
      "type": "choice",
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
      "type": "choice",
      "options": [
        { "label": "Casual" },
        { "label": "Professional" },
        { "label": "Academic" }
      ]
    },
    {
      "header": "Length",
      "question": "Length policy for the rewrite?",
      "type": "choice",
      "options": [
        { "label": "Keep within ±10% of original" },
        { "label": "Allow expansion" },
        { "label": "Allow trimming" }
      ]
    },
    {
      "header": "Voice",
      "question": "Mimic a writing sample of yours?",
      "type": "choice",
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

If the runtime exposes the tool under a different name (e.g.,
`ask_user_question`), swap the tool name. The schema is portable.

## After the interview

Map the labels to internal variables (same as Claude Code):

- Q1 → `dialect`
- Q2 → `target_grade` (4, 7, 10, 14, 17)
- Q3 → `tone`
- Q4 → `length_policy` (`±10`, `exp`, `trim`)
- Q5 → voice choice: `Yes` starts Step 3.5 sample capture, `No` skips
  voice matching for this call, `Never ask again` persists `voice_skip`.

When Q5 is `Yes`, say exactly: *"Paste 200+ words as your next message."*
Capture the next user turn as the voice sample and return to `SKILL.md`
Step 3.5 for validation, writing, and fingerprint extraction.

Return to `SKILL.md` § Loop algorithm with these answers.

## Fallback

If the structured-question tool is unavailable, fall through to
`harnesses/generic.md`'s plain-text protocol.
