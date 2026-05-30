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

Before issuing the call, detect the source language (see `SKILL.md` Step 3). If
Step 3 flagged the language as ambiguous (text under ~20 words or mixed), follow
its ambiguous branch: ask the language first (offer the three most likely
languages plus "Other (different language)", within the four-option cap),
resolve the choice, then build Q1 from that
language's variants. Otherwise build Q1 (language and variant) from
`references/multilingual.md`: present the detected language's variants plus
"Other (different language)", keeping Q1 to four options or fewer (the named
variants plus "Other"); if a language has more than three named variants, offer
the three most common plus "Other". Populate each Q2 reading-level option's
`description` with the detected language's metric from the registry band table.
The JSON below shows the English default; substitute the detected language's
variants and metric ranges.

```json
{
  "questions": [
    {
      "header": "Language",
      "question": "Detected English. Confirm the language and variant:",
      "multiSelect": false,
      "options": [
        { "label": "American English (en-US)", "description": "Default for US audiences." },
        { "label": "British English (en-GB)", "description": "Use UK spellings and idioms." },
        { "label": "Other (different language)", "description": "I'll specify the language in my next message." }
      ]
    },
    {
      "header": "Reading level",
      "question": "What reading level should the output target?",
      "multiSelect": false,
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

- Q1 → `language` and `variant`: read the chosen variant (`American English
  (en-US)` → `en` / `en-US`). `Other (different language)` → prompt for the
  language on the next turn, resolve against `references/multilingual.md`, then
  ask its variant (warn if unsupported).
- Q2 → `reading_level`: `Elementary` → `elementary`, `Middle school` →
  `middle`, `High school` → `high_school`, `College or professional` →
  `college`. For English only, also set `target_grade` (4, 7, 10, 13). Graduate
  (`graduate`, `target_grade` 17) is reachable via inline `level=graduate` or
  `grade=N`, not this question.
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

If `AskUserQuestion` returns an error or is unavailable, fall through to
`harnesses/generic.md`'s plain-text protocol.
