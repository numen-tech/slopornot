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

Before issuing the call, detect the source language (see `SKILL.md` Step 3). If
Step 3 flagged the language as ambiguous (text under ~20 words or mixed), follow
its ambiguous branch: ask the language first (the three most likely languages
plus "Other (different language)", within the four-option cap), resolve it, then
ask that language's variant. Otherwise
build Q1's options from `references/multilingual.md` for the detected language;
populate each Q2 option's `description` with that language's metric. The JSON
below shows the English default.

```json
{
  "questions": [
    {
      "header": "Language",
      "question": "Detected English. Confirm the language and variant:",
      "type": "choice",
      "options": [
        { "label": "American English (en-US)", "description": "Default for US audiences." },
        { "label": "British English (en-GB)", "description": "Use UK spellings and idioms." },
        { "label": "Other (different language)", "description": "I'll specify the language in my next message." }
      ]
    },
    {
      "header": "Reading level",
      "question": "What reading level should the output target?",
      "type": "choice",
      "options": [
        { "label": "Elementary", "description": "English Grade 3-5; substitute the detected language's metric." },
        { "label": "Middle school", "description": "English Grade 6-8." },
        { "label": "High school", "description": "English Grade 9-11; e.g. Swedish LIX about 40 to 50, German Wiener about 9 to 11." },
        { "label": "College or professional", "description": "English Grade 12+; substitute the detected language's metric. Graduate-level via inline level=graduate or grade=N." }
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

- Q1 → `language` and `variant` (read the chosen variant; `Other (different
  language)` is captured next turn and resolved against
  `references/multilingual.md`)
- Q2 → `reading_level` (`College or professional` → `college`; otherwise
  `elementary`/`middle`/`high_school`; for English also set `target_grade`
  4, 7, 10, 13). Graduate (`target_grade` 17) is reachable via inline
  `level=graduate` or `grade=N`, not this question.
- Q3 → `tone`
- Q4 → `length_policy` (`±10`, `exp`, `trim`)
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

If the structured-question tool is unavailable, fall through to
`harnesses/generic.md`'s plain-text protocol.
