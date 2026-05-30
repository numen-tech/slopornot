---
name: agentic-humanizer
version: 0.1.0
description: Humanizes AI text in English and six other languages with a five-pass rewrite workflow, optional voice matching, and Slop or Not Pro scoring when available. Use for /agentic-humanizer.
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

**Inline overrides:** `/agentic-humanizer language=<code> variant=<spec> dialect=us|uk grade=N level=<band> tone=casual|professional|academic length=±10|exp|trim threshold=N max=N voice=off voice-skip skip-interview [paste]`

`language=<code>` and `variant=<spec>` set the target language and variant (for example `language=de variant=de-AT`). `language=` without `variant=` uses that language's default variant from the registry. `dialect=us|uk` is a legacy English alias. `grade=N` is English only; `level=<band>` (`elementary|middle|high_school|college|graduate`) sets the reading level for any language. See `references/multilingual.md`.

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

Before Q1, detect the source language from the pasted text with the host LLM.
If the text is under ~20 words or mixed, treat the language as ambiguous:
because `ask_user_input_v0` caps at four options, do not list every supported
language at once. Make the first call offer the three most likely languages
plus "Other (a different language)"; if the user picks "Other", they name the
language in their next message (resolve it against `references/multilingual.md`).
Only after the language resolves do you ask that language's variant. Otherwise
build Q1 from `references/multilingual.md`:
present the detected language's variants plus "Other (different language)",
staying within the four-option `ask_user_input_v0` cap. Populate Q2's options with the detected language's
metric. The calls below show the English default. Variant sets that fit the cap:
English (en-US, en-GB, Other = 3); German (de-DE, de-AT, de-CH, Other = 4);
Norwegian (nb, nn, Other = 3); Spanish (es-ES, es-419, Other = 3); Italian,
Swedish, and Danish (single variant plus Other). If a language ever needs more
than three named variants, keep the three most common plus "Other".

```text
ask_user_input_v0({
  questions: [
    {
      question: "Detected English. Confirm the language and variant:",
      options: ["American English (en-US)", "British English (en-GB)", "Other (different language)"]
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

- Q1 -> `language` and `variant`: read the chosen variant (`American English
  (en-US)` -> `en`/`en-US`). `Other (different language)` -> prompt for the
  language on the next turn, resolve against `references/multilingual.md`, then
  ask its variant (warn if unsupported).
- Q2 -> `reading_level`: `Elementary` -> `elementary`, `Middle school` ->
  `middle`, `High school` -> `high_school`, `College or professional` ->
  `college`. For English only, also set `target_grade` (4, 7, 10, 13). The
  Desktop interview collapses College and Graduate into one option to stay
  within the four-option cap; for non-English the loop reads `reading_level`.
- Q3 -> `tone`: lowercase the label.
- Q4 -> `length_policy`: `Keep within ±10% of original` -> `±10`,
  `Allow expansion` -> `exp`, `Allow trimming` -> `trim`.
- Q5 -> voice choice: `Yes` starts Step 4 sample capture, `No` skips
  voice matching for this call.

When Q5 is `Yes`:

1. If Q1 was `Other (different language)`, first capture the language from the
   user's next turn, resolve it and its variant against
   `references/multilingual.md`, and finalize `language` and `variant`. Only
   continue to step 2 after they are resolved.
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
2. **`skip-interview` flag** -> skip the interview and use defaults (High
   school, Professional, ±10%). Detect the source language first (per Step 1)
   and keep it with its default variant from `references/multilingual.md`; fall
   back to English/en-US only when detection is ambiguous or no text was pasted.
   For English, also set `target_grade` 10.
3. **No complete inline overrides** -> run the interview below.

**Run the interview** using the protocol in Step 1 (which detects the source
language and confirms it in Q1). Capture these rewrite settings here:

- `language` (a base code such as `en`, `de`, `es`, `it`, `sv`, `da`, `nb`,
  `nn`, or other) and `variant` (a BCP-47 tag or `other:<spec>`)
- `reading_level` in {`elementary`, `middle`, `high_school`, `college`,
  `graduate`}; for English also `target_grade` (the band midpoint 4, 7, 10, 13,
  17, or any integer N from inline `grade=N`). When `level=` resolves to English
  without `grade=`, derive `target_grade` from the band midpoint (graduate ->
  17), even though the interview itself collapses College and Graduate.
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

The probe fixture above is English, so its readability `kind` is always
`fleschKincaidGradeLevel`. This call only proves Pro access; discard its
readability value. Source-language readability is measured in Step 6, where the
returned `kind` depends on the source language (see `references/multilingual.md`).

Claude Desktop runs skills in a sandbox that cannot reach the user's machine,
so there is no Slop or Not CLI fallback here: the MCP connector is the only
Pro backend. If the MCP probe is unavailable or does not return a numeric
score, keep `slop_mode="llm-only"` and continue to Step 6. Do not skip the
interview, voice matching, or rewrite loop.

## Step 6: Run the loop

Resolve the language L from the inline `language=` override or the detected and
confirmed language from Step 1. If L is not English, read
`references/multilingual.md` (the registry: readability formulas, band mapping,
code normalization). Read `references/per-iteration-strategies.md` (the
per-iteration cookbook). Then load the tell catalogue for L's branch:

- **L is `en`:** read `references/patterns.md` (the 29-pattern rewrite
  vocabulary) and `references/supplemental-ai-tells.md`. Use the full detector
  path; read the Flesch-Kincaid grade where `kind` is `fleschKincaidGradeLevel`.
- **L is `es`, `de`, `it`, `sv`, `da`, or `nb`:** do NOT read `patterns.md`
  (English only). Read `references/supplemental-ai-tells.md` and
  `references/ai-tells/<L>.md` (Norwegian Bokmal uses `ai-tells/no.md`). Pass the
  normalized `language_code` and never pass `britishize`. Read whatever score
  `kind` `scores[]` returns, label it by that kind, and map it to a band via the
  registry. The AI score is `n/a` (`detect_text` returns `kind: "not_english"`
  with a null score); call `analyze_readability` directly for readability.
- **L is `nn` or an unsupported language:** do NOT read `patterns.md`. Read
  `references/supplemental-ai-tells.md` (and `ai-tells/no.md`, Nynorsk section,
  for `nn`). Readability is not available; the AI score is `n/a`; run all
  iterations and select by quality. Warn the user.

The language branch composes with, and does not replace, the 5-iteration
schedule.

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

**English (L is `en`):** AI score <= `AI_THRESHOLD` AND
`|grade - target_grade| <= 1`, or after `MAX_ITER`. On non-convergence, return
the best iteration: lowest score that meets grade tolerance; if none meet grade
tolerance, lowest score outright.

**Supported non-English (es, de, it, sv, da, nb):** no AI threshold (the AI
score is `n/a`). Terminate when the readability score for L's formula lands in
the target band (see `references/multilingual.md`) or after `MAX_ITER`. On
non-convergence, return the iteration closest to the target band.

**Nynorsk or unsupported:** tells-only, no readability and no AI score. Run all
`MAX_ITER` iterations and select by quality.

After selecting the final iteration, run Text Cleanup on that selected text.
Store `final_cleanup_stats` and use the cleaned text as the final output. Then
run the final scoring pass gated by L, matching the loop's per-language rule:
for English, run final `detect_text` and `analyze_readability`; for supported
non-English (es, de, it, sv, da, nb), run final `analyze_readability` only (skip
`detect_text`, which returns `not_english` with a null score); for Nynorsk or an
unsupported language, skip both (readability returns `unsupported_language` and
the AI score is `n/a`).

### Completion in Core mode

Run all five rewrite strategies once unless the source is empty or unusable.
Log AI score and readability as `null` for every iteration. Select the final
iteration by rewrite quality: preserve meaning, honor the requested reading
level, tone, and length, and remove the most visible AI tells from the tell
files loaded for L's branch (English: `references/patterns.md` plus
`references/supplemental-ai-tells.md`; other languages:
`references/supplemental-ai-tells.md` plus `references/ai-tells/<L>.md`, where
Norwegian Bokmal and Nynorsk both use `references/ai-tells/no.md`).

### Mid-flight Pro-gate

If any `detect_text`, `analyze_readability`, or `clean_text` call returns
`isError: true` on iteration >= 1, fall through
to Core mode for the remaining iterations. See
`references/per-iteration-strategies.md` Mid-flight Pro-gate fallback.

## Step 7: Output

Render this canonical block. The example shows English; the Language line and
the readability column adapt to the resolved language (see the rules below the
block).

```markdown
## Humanized text
<final text>

## Language
English (en-US). Readability: Flesch-Kincaid grade.

## Loop history
| Iter | AI score | Readability | Strategy |
|---|---:|---:|---|
| 0 | 92% | 11.4 (College) | baseline |
| 1 | 71% | 10.8 (High school) | pattern surgery |
| 2 | 48% | 10.4 (High school) | variant + tone |
| 3 | 27% | 9.7 (High school) | grade gap |
Converged at iter 3 (<=40% AI, grade target 9 to 11).

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

**Language line.** Always show the resolved language, variant, and the
readability formula's display name from `references/multilingual.md`, for example
"German (de-DE). Readability: Wiener Sachtextformel."

**Readability column.** The formula is named once in the Language line (use its
display name from `references/multilingual.md`). In the loop-history column show
only the value and the band in parentheses, for example "10.6 (High school)".

**AI score column (non-English).** Render "n/a (detector is English-only)" on
the first row and "n/a" thereafter. In Core mode, render "n/a" for every row.

**Convergence line (non-English with readability).** Reference the band, not the
AI threshold, for example "Converged at iter 3 (readability in target band: High
school)." For Nynorsk or an unsupported language, use "Completed MAX_ITER
iterations (no readability available for this language; selected by quality)."

Show `Text Cleanup summary` only when real Slop or Not Text Cleanup ran. Do
not show backend names in the user-facing output.

If every cleanup count is zero, replace the table with:

```markdown
## Text Cleanup summary
Slop or Not found no hidden characters, punctuation artifacts, homoglyphs, or dialect substitutions to clean.
```

When Slop or Not Pro does not converge (English), replace the convergence line
with:

```markdown
Did not converge below threshold in MAX_ITER iterations. Best result shown above
(iter N at S%). Re-run with `threshold=40 max=8` for a more aggressive loop,
or `tone=casual` if professional tone is constraining the rewrite.
```

For non-English non-convergence, replace the convergence line with:

```markdown
Did not reach the target band in MAX_ITER iterations. Closest result shown above (iter N, <formula>: X.X). Re-run with a different `level=` to widen the target.
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

- `references/patterns.md` (the 29 AI-tells, English only)
- `references/supplemental-ai-tells.md` (supplemental language-agnostic AI tells)
- `references/multilingual.md` (the multilingual readability registry)
- `references/ai-tells/<code>.md` (per-language tells: es, de, it, sv, da, no)
- `references/per-iteration-strategies.md` (the loop cookbook)
- `references/voice-fingerprint.md` (voice sample extraction and loop
  injection contracts)
- `references/slop-mcp-setup.md`
  (install guide; surface to user when they ask for on-device AI detector
  scoring setup)
