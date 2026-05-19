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

## Call 1 — three questions

```json
{
  "method": "tool/requestUserInput",
  "params": {
    "questions": [
      {
        "question": "Which English variant should the rewrite target? (American English / British English / Other)",
        "type": "text"
      },
      {
        "question": "What reading level should the output target? (Elementary / Middle school / High school grade 9–11 / College grade 12–15 / Graduate or professional)",
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

- Q1 → `dialect`: match `american` → `us`, `british` → `uk`, otherwise
  `other:<verbatim user string>`.
- Q2 → `target_grade`: match `elementary|3|4|5` → 4; `middle|6|7|8` → 7;
  `high|9|10|11|12` → 10; `college|13|14|15` → 14; `graduate|16` → 17.
- Q3 → `tone`: lowercase, match against `casual` / `professional` /
  `academic`.
- Q4 → `length_policy`: match `±10|10%|keep` → `±10`; `expand|exp` →
  `exp`; `trim` → `trim`.
- Q5 → voice choice: match `yes` → start Step 4 sample capture;
  `no` → skip voice matching for this call; `never` → persist
  `voice_skip`.

If parsing is ambiguous, ask one follow-up clarification (still via
`tool/requestUserInput`) before defaulting.

When Q5 is `yes`, say exactly: *"Paste 200+ words as your next message."*
Capture the next user turn as the voice sample and return to `SKILL.md`
Step 4 for validation, writing, and fingerprint extraction.

Return to `SKILL.md` § Loop algorithm with these answers.

## Fallback

If `tool/requestUserInput` is unavailable in the running Codex version
(pre-rollout), fall through to `harnesses/generic.md`'s plain-text
protocol. If a future Codex version replaces `tool/requestUserInput` with
a stable `ask_user_question`, swap the method name here while keeping the
3-question split intact.
