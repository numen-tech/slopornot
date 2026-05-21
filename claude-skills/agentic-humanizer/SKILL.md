---
name: agentic-humanizer
version: 0.1.0
description: Humanizes AI text with a five-pass rewrite workflow, optional voice matching, and Slop or Not Pro scoring when available. Use for /agentic-humanizer.
license: MIT
compatibility: claude-desktop
allowed-tools:
  - Read
  - ask_user_input_v0
  - mcp__SlopOrNot__detect_text
  - mcp__SlopOrNot__analyze_readability
  - mcp__SlopOrNot__clean_text
---

# Agentic Humanizer

A 5-pass AI humanizer. It always runs the core rewrite workflow; Slop or Not
Pro adds measured on-device AI detector checks.

- **Without Slop or Not:** runs the full rewrite workflow.
- **With Slop or Not Pro:** adds on-device AI detector scoring, readability, Text Cleanup, and
  cleanup stats.

**Slash command:** `/agentic-humanizer [paste text]`

**Inline overrides:** `/agentic-humanizer dialect=us|uk grade=N tone=casual|professional|academic length=±10|exp|trim threshold=N max=N voice=off voice-skip skip-interview [paste]`

## What this skill does

1. Runs the built-in Claude Desktop interview (no harness detection).
2. Handles inline overrides and unsupported profile commands before any rewrite.
3. Resolves rewrite preferences from inline overrides, defaults, or the
   interview.
4. Optionally captures a per-run writing sample and extracts a stylometric
   fingerprint. Voice matching does not require Slop or Not.
5. Probes whether Slop or Not Pro is reachable via MCP.
6. Runs the 5-pass humanization workflow:
   - Core mode logs unscored iterations.
   - Slop or Not Pro runs Text Cleanup, detection, and readability checks.
7. Returns the final text, loop history, highest-impact edits, and, when Slop
   cleanup ran, a Text Cleanup summary.

## Step 1: The interview

Claude Desktop exposes `ask_user_input_v0`, a single-choice prompt that takes
one question per call. Run the interview only when Step 3 calls for it; the
question list and the answer mapping are defined here.

### The interview: four or five sequential `ask_user_input_v0` calls

Issue the four required questions below in sequence; do not bundle. Add the
fifth voice question only when no inline `voice=off` or `voice-skip` override
is present.

```text
ask_user_input_v0({
  questions: [
    {
      question: "Which English variant should the rewrite target?",
      options: ["American English", "British English", "Other"]
    }
  ]
})

ask_user_input_v0({
  questions: [
    {
      question: "What reading level should the output target?",
      options: [
        "Elementary (Grade 3-5)",
        "Middle school (Grade 6-8)",
        "High school (Grade 9-11)",
        "College or professional (Grade 12+)"
      ]
    }
  ]
})

ask_user_input_v0({
  questions: [
    {
      question: "What tone should the output use?",
      options: ["Casual", "Professional", "Academic"]
    }
  ]
})

ask_user_input_v0({
  questions: [
    {
      question: "Length policy for the rewrite?",
      options: [
        "Keep within ±10% of original",
        "Allow expansion",
        "Allow trimming"
      ]
    }
  ]
})

ask_user_input_v0({
  questions: [
    {
      question: "Mimic a writing sample of yours?",
      options: ["Yes", "No"]
    }
  ]
})
```

### After the interview

Map the chosen labels to internal variables:

- Q1 -> `dialect`: `American English` -> `us`, `British English` -> `uk`,
  `Other` -> prompt for the dialect string in the next user turn.
- Q2 -> `target_grade`: `Elementary (Grade 3-5)` -> `4`,
  `Middle school (Grade 6-8)` -> `7`, `High school (Grade 9-11)` -> `10`,
  `College or professional (Grade 12+)` -> `13`.
- Q3 -> `tone`: lowercase the label.
- Q4 -> `length_policy`: `Keep within ±10% of original` -> `±10`,
  `Allow expansion` -> `exp`, `Allow trimming` -> `trim`.
- Q5 -> voice choice: `Yes` starts Step 4 sample capture, `No` skips
  voice matching for this call.

When Q5 is `Yes`:

1. If Q1 was `Other`, first capture the custom dialect string from the
   user's next turn and finalize `dialect`. Only continue to step 2 after
   the dialect is resolved.
2. Say exactly: *"Paste 200+ words as your next message."*
3. Capture the next user turn as the voice sample and return to Step 4
   for validation and fingerprint extraction.

## Step 2: Profile management commands

Claude Desktop skill execution is sandboxed, so this Desktop bundle does not
support local saved-profile commands. If the user asks to show, reset, or set
a profile, explain that saved preferences are unavailable in Claude Desktop
and offer inline overrides for the current run.

When you see one of these unsupported profile commands, respond with that
limitation and stop. Do not probe Slop or run the loop.

## Step 3: Resolve rewrite preferences

**Preference resolution order:**

1. **Inline overrides** for all four rewrite parameters -> use them.
2. **`skip-interview` flag** -> use defaults (American, High school,
   Professional, ±10%).
3. **No complete inline overrides** -> run the interview below.

**Run the interview** using the protocol in Step 1. Capture these rewrite
settings here:

- `dialect` in {`us`, `uk`, `other:<string>`}
- `target_grade` in {4, 7, 10, 13} from the interview; any integer N from
  inline `grade=N`
- `tone` in {`casual`, `professional`, `academic`}
- `length_policy` in {`±10`, `exp`, `trim`}

After the rewrite answers, continue to Step 4.

## Step 4: Resolve voice sample

Read `references/voice-fingerprint.md` before running this step. Set
`voice_active=false` by default.

**Voice sample resolution order:**

1. Inline `voice=off` or `voice-skip` -> skip voice matching for this call.
2. Inline `voice=/path/to/file.txt` -> explain that Claude Desktop cannot
   reliably read arbitrary local paths from the user's Mac. Ask the user to
   paste 200+ words if they want voice matching for this run.
3. Otherwise -> use the conditional Q5 answer already captured by the
   interview, or ask it now if the interview did not batch it:

   > *"Mimic a writing sample of yours?"*

   Options: `Yes`, `No`.

If Q5 is `No`, skip voice matching for this call.

If Q5 is `Yes`, or if the user chooses to paste a sample after a
`voice=/path` warning, say exactly:

> *"Paste 200+ words as your next message."*

Capture the next user turn as the sample. Validate it before using it:

- Under 50 words: reject it, say the sample is too short, leave
  `voice_active=false`, and continue without changing any profile.
- 50-199 words: warn that 200+ words works better, then ask whether to
  continue with the shorter sample or paste a longer one.
- 200+ words: use the pasted text in memory for this run. Do not persist it
  to disk.

For every accepted sample, use only the first 3000 words for fingerprint
extraction.

**Fingerprint cache:**

Keep any approved fingerprint in memory for this run only. Do not cache it
to disk.

Run the extraction prompt from `references/voice-fingerprint.md` against the
host LLM. Render the JSON fingerprint and ask:

> *"Looks right?"*

Options: `Yes`, `Edit`, `Re-extract`.

- `Yes`: set `voice_active=true` with the approved in-memory fingerprint.
- `Edit`: let the user correct the JSON inline. Validate it against the
  required-field list in `references/voice-fingerprint.md` Required fields
  before using it. If the edit drops a required field, refuse to use it and
  offer Re-extract.
- `Re-extract`: ask what to change, then re-run extraction with that hint.

Run the Yes/Edit/Re-extract approval gate via `ask_user_input_v0`.

If extraction fails, if the sample is binary or unreadable, or if no host LLM
is available for the extraction prompt, set `voice_active=false`, add the
extraction-failure footer flag for Step 7, and continue without voice
matching.

## Step 5: Probe Slop or Not Pro

Set `slop_mode="llm-only"` and `slop_backend=null` by default. Probing Slop
selects the enhancement path only; it never decides whether the humanizer runs.

Run a real `detect_text` fixture call to verify both presence AND Pro tier.
Only `detect_text` Pro-gates, so a successful numeric result confirms Pro.

Use this fixture for the probe:

```text
In today's digital environment, organizations often adopt new software because it promises efficiency, but the real value depends on whether people can trust it. A useful tool should explain what it does, respect the user's context, and avoid turning simple decisions into complicated workflows. Clear documentation helps teams evaluate those tradeoffs before they commit time or money.
```

**MCP path:**

Call `mcp__SlopOrNot__detect_text` with the fixture and
`include_readability: true`. If the tool call succeeds and the parsed response
has a numeric `score` or `ai_probability` field, set
`slop_mode="slop-or-not-pro"` and `slop_backend="mcp"`. Treat scores from
`score` and `ai_probability` as 0-1 decimals unless the value is already
greater than 1. For readability, read the Flesch-Kincaid grade from
`readability.scores[]` where `kind` is `fleschKincaidGradeLevel`.

Claude Desktop runs skills in a sandbox that cannot reach the user's machine,
so there is no Slop or Not CLI fallback here: the MCP connector is the only
Pro backend. If the MCP probe is unavailable or does not return a numeric
score, keep `slop_mode="llm-only"` and continue to Step 6. Do not skip the
interview, voice matching, or rewrite loop.

## Step 6: Run the loop

Read `references/patterns.md` (the 29-pattern rewrite vocabulary).
Read `references/supplemental-ai-tells.md` (the supplemental AI-tell checks).
Read `references/per-iteration-strategies.md` (the per-iteration cookbook).
Apply the loop as specified there.

When `voice_active=true`, Iteration 2 and Iteration 5 consume the cached
fingerprint using the contracts in `references/per-iteration-strategies.md`.
No other iteration uses the voice fingerprint.

Constants (overridable via inline params when Slop or Not Pro is available):

- `AI_THRESHOLD = 40` (override: `threshold=N`)
- `MAX_ITER = 5` (override: `max=N`)
- Grade tolerance: ±1

### Slop or Not Pro setup

If `slop_mode="slop-or-not-pro"`, run Text Cleanup on the source before
Iteration 0. Store:

- `source_cleaned_text`
- `source_cleanup_stats`

Use `source_cleaned_text` as the Iteration 0 baseline. Score and analyze the
cleaned source, not the raw source.

### Core setup

If `slop_mode="llm-only"`, use the original source as Iteration 0. Do not
call `detect_text`, `analyze_readability`, or `clean_text`.

### Cleanup stats parsing

For MCP `clean_text`, decode `content[0].text` as JSON before reading:

- `cleaned_text`
- `removed_invisibles`
- `punctuation_replacements`
- `homoglyphs_replaced`
- `british_substitutions`

Normalize those into this internal shape:

```json
{
  "invisibles": 0,
  "punctuation": 0,
  "homoglyphs": 0,
  "dialect_substitutions": 0
}
```

### Termination with Slop or Not Pro

Termination: AI score <= `AI_THRESHOLD` AND `|grade - target_grade| <= 1`,
or after `MAX_ITER`. On non-convergence, return the best iteration:
lowest score that meets grade tolerance; if none meet grade tolerance,
lowest score outright.

After selecting the final iteration, run Text Cleanup on that selected text.
Store `final_cleanup_stats`, use the cleaned text as the final output, then
run final `detect_text` and `analyze_readability` on the cleaned final text.

### Completion in Core mode

Run all five rewrite strategies once unless the source is empty or unusable.
Log score and grade as `null` for every iteration. Select the final iteration
by rewrite quality: preserve meaning, honor the requested grade/tone/length,
and remove the most visible AI tells from `references/patterns.md` and
`references/supplemental-ai-tells.md`.

### Mid-flight Pro-gate

If any `detect_text`, `analyze_readability`, or `clean_text` call returns
`isError: true` on iteration >= 1, fall through
to Core mode for the remaining iterations. See
`references/per-iteration-strategies.md` Mid-flight Pro-gate fallback.

## Step 7: Output

Render this canonical block:

```markdown
## Humanized text
<final text>

## Loop history
| Iter | AI score | Grade | Strategy |
|---|---:|---:|---|
| 0 | 92% | 11.4 | baseline |
| 1 | 71% | 10.8 | pattern surgery |
| 2 | 48% | 10.4 | dialect + tone |
| 3 | 27% | 9.7 | grade gap |
Converged at iter 3 (<=40% AI, grade target 9-11).

## Text Cleanup summary
| Stage | Invisibles | Punctuation | Homoglyphs | Dialect substitutions |
|---|---:|---:|---:|---:|
| Source cleanup | 1 | 2 | 0 | 0 |
| Final cleanup | 0 | 1 | 0 | 0 |

## Highest-impact edits
- <bullet 1>
- <bullet 2>
- <bullet 3 (optional)>
```

Show `Text Cleanup summary` only when real Slop or Not Text Cleanup ran. Do
not show backend names in the user-facing output.

If every cleanup count is zero, replace the table with:

```markdown
## Text Cleanup summary
Slop or Not found no hidden characters, punctuation artifacts, homoglyphs, or dialect substitutions to clean.
```

When Slop or Not Pro does not converge, replace the convergence line with:

```markdown
Did not converge below threshold in MAX_ITER iterations. Best result shown above
(iter N at S%). Re-run with `threshold=40 max=8` for a more aggressive loop,
or `tone=casual` if professional tone is constraining the rewrite.
```

When Slop or Not Pro is unavailable, render score and grade as `n/a` and add
this note after the history table:

```markdown
> _Ran without Slop or Not Pro. Add Slop or Not Pro for on-device AI detector scoring, readability checks, Text Cleanup, and cleanup stats: <https://slopornot.ai/download>_
```

For mid-flight Core-mode fallback iterations, render score and grade as `n/a`
and add this note:

```markdown
> _Iterations N-M ran without on-device scoring. Local stats are unavailable for those iterations._
```

If voice matching was active, add this footer note:

```markdown
> _Voice matched from a pasted sample for this run._
```

If voice extraction failed in Step 4, add this footer note instead:

```markdown
> _Voice extraction failed; ran without voice match. Paste a fresh sample on your next run to retry._
```

## Pointer files

- `references/patterns.md` (the 29 AI-tells)
- `references/supplemental-ai-tells.md` (supplemental AI tells)
- `references/per-iteration-strategies.md` (the loop cookbook)
- `references/voice-fingerprint.md` (voice sample extraction and loop
  injection contracts)
- `references/slop-mcp-setup.md`
  (install guide; surface to user when they ask for on-device AI detector
  scoring setup)
