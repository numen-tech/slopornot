# Harness Routing — Codex CLI

`SKILL.md` routes here when running inside the OpenAI Codex CLI. Codex
exposes `tool/requestUserInput` (experimental) for structured questions.

**Critical constraint:** the tool accepts only 1–3 questions per call. Our
4-question interview splits into two calls (3 + 1). When conditional Q5
fires, split the interview as 3 + 2. Other harnesses can ask all eligible
questions in one call.

Only ask Q5 when no inline or saved `voice_path` has resolved,
`~/.agentic-humanizer/voice.txt` is absent, and the saved profile does not
contain `"voice_skip": true`.

Before Call 1, detect the source language (see `SKILL.md` Step 3). Build the Q1
prompt from `references/multilingual.md`: name the detected language and list
its variants slash-separated, plus "Other (different language)". Show the
reading level in that language's metric. The JSON below shows the English
default; substitute the detected language's variants and metric.

## Call 1 — three questions

```json
{
  "method": "tool/requestUserInput",
  "params": {
    "questions": [
      {
        "question": "Detected English. Confirm language and variant: (American English (en-US) / British English (en-GB) / Other (different language))",
        "type": "text"
      },
      {
        "question": "What reading level should the output target? (Elementary / Middle school / High school / College / Graduate; English grades G3-5 / G6-8 / G9-11 / G12-15 / G16+, or the detected language's metric)",
        "type": "text"
      },
      {
        "question": "What tone should the output use? (Casual / Professional / Academic)",
        "type": "text"
      }
    ]
  }
}
```

## Call 2: one or two questions

```json
{
  "method": "tool/requestUserInput",
  "params": {
    "questions": [
      {
        "question": "Length policy for the rewrite? (Keep within ±10% / Allow expansion / Allow trimming)",
        "type": "text"
      },
      {
        "question": "Mimic a writing sample of yours? (Yes / No / Never ask again)",
        "type": "text"
      }
    ]
  }
}
```

Omit the second question in Call 2 when Q5 is not eligible.

## After the interview

Parse each text answer to map onto the internal variables:

- Q1 → `language` and `variant`: read the chosen variant (`American English
  (en-US)` → `en`/`en-US`). `Other (different language)` → capture the language
  next turn, resolve against `references/multilingual.md`, then ask its variant.
- Q2 → `reading_level`: match `elementary` → `elementary`, `middle` → `middle`,
  `high` → `high_school`, `college` → `college`, `graduate` → `graduate`. For
  English only, also set `target_grade` (4, 7, 10, 13, 17).
- Q3 → `tone`: lowercase, match against `casual` / `professional` /
  `academic`.
- Q4 → `length_policy`: match `±10|10%|keep` → `±10`; `expand|exp` →
  `exp`; `trim` → `trim`.
- Q5 → voice choice: match `yes` → start Step 4 sample capture;
  `no` → skip voice matching for this call; `never` → persist
  `voice_skip`.

If parsing is ambiguous, ask one follow-up clarification (still via
`tool/requestUserInput`) before defaulting.

When Q5 is `yes`:

1. If Q1 was `Other (different language)`, first capture the language from the
   user's next turn, resolve it and its variant against
   `references/multilingual.md`, and finalize `language` and `variant`. Only
   continue to step 2 after they are resolved.
2. Say exactly: *"Paste 200+ words as your next message."*
3. Capture the next user turn as the voice sample and return to
   `SKILL.md` Step 4 for validation, writing, and fingerprint extraction.

Return to `SKILL.md` § Loop algorithm with these answers.

## Fallback

If `tool/requestUserInput` is unavailable in the running Codex version
(pre-rollout), fall through to `harnesses/generic.md`'s plain-text
protocol. If a future Codex version replaces `tool/requestUserInput` with
a stable `ask_user_question`, swap the method name here while keeping the
3-question split intact.
