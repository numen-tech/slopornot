---
name: agentic-humanizer
version: 0.1.0
description: |
  Humanizes AI-generated text with a 5-pass rewrite workflow in English and six
  other languages, optional saved preferences, and optional stylometric voice
  matching from a writing sample. Works without Slop or Not. When Slop or Not
  Pro is reachable, adds on-device AI detector scoring (English only),
  native-language readability checks, Text Cleanup, and cleanup stats.
  Use when the user invokes /agentic-humanizer or asks to humanize text.
license: MIT
compatibility: claude-code codex cursor gemini-cli opencode
allowed-tools:
  - Read
  - Bash
  - AskUserQuestion
---

# Agentic Humanizer

A 5-pass AI humanizer. It always runs the core rewrite workflow; Slop or Not
Pro adds measured on-device AI detector checks.

- **Without Slop or Not:** runs the full rewrite workflow.
- **With Slop or Not Pro:** adds on-device AI detector scoring, readability, Text Cleanup, and
  cleanup stats.

Supported languages: English, Spanish, German, Italian, Swedish, Danish, and
Norwegian (Bokmal and Nynorsk). The AI detector score is English only; other
languages use native readability and per-language tells. See
`references/multilingual.md`.

**Slash command:** `/agentic-humanizer [paste text]`

**Inline overrides:** `/agentic-humanizer language=<code> variant=<spec> dialect=us|uk grade=N level=<band> tone=casual|professional|academic length=±10|exp|trim threshold=N max=N voice=/path/to/file.txt|off voice-skip skip-interview [paste]`

`language=<code>` and `variant=<spec>` set the target language and variant (for example `language=de variant=de-AT`). `dialect=us|uk` is a legacy English alias: `dialect=us` equals `language=en variant=en-US`, `dialect=uk` equals `language=en variant=en-GB`. `grade=N` sets the Flesch-Kincaid target and is English only; `level=<band>` sets the reading-level band (`elementary|middle|high_school|college|graduate`) for any language. Explicit `language=`/`variant=` win over `dialect=`. See `references/multilingual.md` for supported codes and variants.

## What this skill does

1. Detects the host harness (Claude Code, Codex, Cursor, Gemini CLI,
   OpenCode, or generic).
2. Handles profile and voice management commands before any rewrite.
3. Resolves rewrite preferences from inline overrides, saved profile, or the
   harness interview.
4. Optionally resolves a writing sample and extracts a cached stylometric
   fingerprint. Voice matching does not require Slop or Not.
5. Probes whether Slop or Not Pro is reachable via MCP or CLI.
6. Runs the 5-pass humanization workflow:
   - Core mode logs unscored iterations.
   - Slop or Not Pro runs Text Cleanup, detection, and readability checks.
7. Returns the final text, loop history, highest-impact edits, and, when Slop
   cleanup ran, a Text Cleanup summary.

## Step 1: Detect the harness

Identify which harness is running by checking for the harness's distinctive
question tool. Use the first match:

| Harness | Distinctive tool present? | Read this file |
|---|---|---|
| Claude Code | `AskUserQuestion` | `harnesses/claude-code.md` |
| Codex CLI | `tool/requestUserInput` (or `ask_user_question`) | `harnesses/codex.md` |
| Cursor | `AskQuestion` | `harnesses/cursor.md` |
| Gemini CLI | `ask_user` (or equivalent structured-question tool) | `harnesses/gemini-cli.md` |
| OpenCode | OpenCode's built-in `question` tool, or AUQ MCP | `harnesses/opencode.md` |
| Anything else | n/a; fall back to plain text | `harnesses/generic.md` |

Do not load the harness file yet. Save the choice for Step 3.

## Step 2: Profile management commands

The user can manage their saved profile with these subcommands:

| Command | Action |
|---|---|
| `/agentic-humanizer show profile` | Print `~/.agentic-humanizer/profile.json` (or "no profile saved"). |
| `/agentic-humanizer reset` | `rm ~/.agentic-humanizer/profile.json` and confirm. |
| `/agentic-humanizer set language=de variant=de-AT level=high_school tone=casual length=±10` | Write a profile from inline params without running the interview. Recognized keys: `language`, `variant`, `dialect` (legacy English alias), `grade` (English only), `level`, `tone`, `length`. Any subset is allowed; missing keys keep their current value or use the default if no profile exists. |
| `/agentic-humanizer show voice` | Print `~/.agentic-humanizer/voice-fingerprint.json` if present, plus the sample path; otherwise say no voice is saved. |
| `/agentic-humanizer reset voice` | Remove `~/.agentic-humanizer/voice.txt` and `~/.agentic-humanizer/voice-fingerprint.json`, then clear voice fields from the profile without deleting the rewrite preferences. |
| `/agentic-humanizer set voice=/path/to/file.txt` | Save the profile's `voice_path`, clear `voice_skip`, and use that path on future runs. Do not extract the fingerprint until the next rewrite call. |

When you see one of these subcommands, execute it and stop. Do not probe Slop
or run the loop.

## Step 3: Resolve rewrite preferences

**Detect the source language first.** Before reading the profile or running the
interview, detect the language of the pasted text with the host LLM (use the
first ~300 words; no backend needed, so this works in both Core and Slop or Not
Pro modes). Store `detected_language` (a base code such as `de`) and, when the
orthography makes it clear, a `detected_variant_hint` (such as `de-DE`).
Normalize the code per `references/multilingual.md` (Norwegian Bokmal becomes
`nb`, never `no`). If no text has been pasted yet, defer detection until it is.
If the text is under ~20 words or mixed, treat the language as ambiguous.

**Profile resolution order:**

1. **Inline overrides** (`language=`, `variant=`, `dialect=`, `grade=`,
   `level=`, `tone=`, `length=`) -> use them; do not read the profile for the
   overridden keys. Inline `language=`/`variant=` also override detection.
2. **`skip-interview` flag** -> use the saved profile if present, otherwise
   fall back to defaults (English, en-US, High school, Professional, ±10%).
3. **Saved profile at `~/.agentic-humanizer/profile.json`** present:
   - If `detected_language` equals the profile's `language`, or detection is
     ambiguous, use the profile silently and skip the interview. Never
     re-prompt a user who already has a profile unless they ask.
   - If `detected_language` differs from the profile's `language`
     (unambiguous), **detection wins**: run this call in the detected language
     using that language's default variant from `references/multilingual.md`.
     Keep the profile's `tone`, `length_policy`, and `reading_level` (the band
     is language-agnostic; map it to the new language's metric via the
     registry). Do not prompt and do not rewrite the profile. Add the
     language-mismatch note for Step 7.
4. **No profile, no overrides** -> run the harness interview as below.

Read the saved profile with:

```bash
PROFILE=~/.agentic-humanizer/profile.json
[ -f "$PROFILE" ] && cat "$PROFILE"
```

If the file is missing, malformed JSON, or missing required rewrite keys,
treat it as absent and run the interview. Version 1 profiles load normally.
Missing voice fields use their defaults in Step 4. If a parseable profile has
`voice_skip` but is missing rewrite keys, ignore it for the rewrite interview
but still honor `voice_skip` in Step 4.

**Back-compat (read any older profile as v3).** A profile without a `language`
field is English: set `language="en"` and map the legacy `dialect` to `variant`
(`us` -> `en-US`, `uk` -> `en-GB`, `other:<spec>` -> `variant: "other:<spec>"`).
Derive `reading_level` from `target_grade` using the band table in
`references/multilingual.md` (3 to 5 -> `elementary`, 6 to 8 -> `middle`, 9 to
11 -> `high_school`, 12 to 15 -> `college`, 16 and above -> `graduate`; default
`high_school` if `target_grade` is absent). Read every existing field first so
custom values are preserved, then rewrite the whole file as v3 on the next
write. `target_grade` drives termination only for English; for other languages
the loop reads `reading_level` and maps via the registry.

**Run the interview** by reading the harness file selected in Step 1 and
following its interview protocol. The interview stays four questions. The
selected harness may batch the conditional voice question when it is eligible;
Step 4 handles that answer. Capture these rewrite settings here:

- `language` (a base code such as `en`, `de`, `es`, `it`, `sv`, `da`, `nb`,
  `nn`, or other) and `variant` (a BCP-47 tag or `other:<spec>`). Q1 confirms
  the detected language and offers that language's variants from
  `references/multilingual.md`. See "Interview Q1 and Q2" below.
- `reading_level` in {`elementary`, `middle`, `high_school`, `college`,
  `graduate`}. For English also set `target_grade` (the band midpoint: 4, 7,
  10, 13, 17). For other languages the loop reads `reading_level` via the
  registry.
- `tone` in {`casual`, `professional`, `academic`}
- `length_policy` in {`±10`, `exp`, `trim`}

**Interview Q1 and Q2.** Q1 confirms language and variant. When the language was
detected unambiguously, present "Detected <language>. Which variant?" with that
language's variants from `references/multilingual.md` plus "Other (different
language)". When the language is ambiguous or unknown, ask the language first,
then its variant. If the user picks "Other (different language)", capture the
language name or code on the next turn, resolve it against the registry, and
warn if it is unsupported (no curated tells or readability). Q2 keeps the five
reading-level bands; show each band's helper text in the resolved language's
metric (for example "High school (LIX about 40 to 50)" for Swedish, "High
school (Grade 9 to 11)" for English), drawn from the registry band table. For
Norwegian Nynorsk and unsupported languages, present the bands without a metric
helper. Map Q1 to `language` (normalized) and `variant`; map Q2 to
`reading_level` (and `target_grade` for English).

After the rewrite answers, ask **one final yes/no question** (use the same
harness question tool):

> *"Save these as your default so I don't ask again next time? You can reset anytime with `/agentic-humanizer reset`."*

If yes:

```bash
mkdir -p ~/.agentic-humanizer
cat > ~/.agentic-humanizer/profile.json <<EOF
{
  "language": "<en|de|es|it|sv|da|nb|nn|other>",
  "variant": "<en-US|en-GB|de-DE|de-AT|de-CH|es-ES|es-419|it-IT|sv|da|nb|nn|other:...>",
  "reading_level": "<elementary|middle|high_school|college|graduate>",
  "target_grade": <4|7|10|13|17>,
  "tone": "<casual|professional|academic>",
  "length_policy": "<±10|exp|trim>",
  "voice_path": "~/.agentic-humanizer/voice.txt",
  "voice_skip": false,
  "voice_fingerprint_hash": null,
  "saved_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": 3
}
EOF
```

`target_grade` is meaningful only when `language` is `en`; for other languages
the loop reads `reading_level`. For English, keep `target_grade` consistent with
`reading_level` (the band midpoint).

Then continue to Step 4. Inline overrides on a future call always win over a
saved profile for that one call only; they do not overwrite the file.

## Step 4: Resolve voice sample

Read `references/voice-fingerprint.md` before running this step. Set
`voice_active=false` by default.

**Voice sample resolution order:**

1. Inline `voice=off` or `voice-skip` -> skip voice matching for this call.
2. Inline `voice=/path/to/file.txt` -> use that sample for this call only.
   If the path does not exist or is not readable, warn the user once, then
   fall through to rules 3 onward as if the inline override were absent.
3. Saved `profile.json` has `voice_path` and that file exists -> use it.
4. Default `~/.agentic-humanizer/voice.txt` exists -> use it.
5. Saved `profile.json` has `"voice_skip": true` -> skip silently.
6. Otherwise -> use the conditional Q5 answer already captured by the
   selected harness, or ask it now if the harness did not batch it:

   > *"Mimic a writing sample of yours?"*

   Options: `Yes`, `No`, `Never ask again`.

If Q5 is `No`, skip voice matching for this call. If Q5 is `Never ask again`,
write or update `~/.agentic-humanizer/profile.json` with `"voice_skip": true`
and `"version": 3` (filling other fields from the saved profile or the v3
defaults), then skip voice matching.

If Q5 is `Yes`, say exactly:

> *"Paste 200+ words as your next message."*

Capture the next user turn as the sample. Validate it before writing:

- Under 50 words: reject it, say the sample is too short, leave
  `voice_active=false`, and continue without changing the profile.
- 50-199 words: warn that 200+ words works better, then ask whether to
  continue with the shorter sample or paste a longer one.
- 200+ words: write it to `~/.agentic-humanizer/voice.txt`.

For every accepted sample, use only the first 3000 words for fingerprint
extraction. Hash the first 50 KB of the sample content:

```bash
VOICE_SAMPLE="<resolved-sample-path>"
head -c 51200 "$VOICE_SAMPLE" | shasum -a 256
```

Prefix the stored value with `sha256:`.

**Fingerprint cache:**

The cache lives at `~/.agentic-humanizer/voice-fingerprint.json`. Validate it
against every rule in `references/voice-fingerprint.md` Cache invalidation
(file present, `version: 1`, `sample_hash` match, all required fields
populated). On a clean cache hit, use it silently and set
`voice_active=true`. On any invalidation trigger, treat it as a cache miss and
run extraction.

On cache miss, run the extraction prompt from `references/voice-fingerprint.md`
against the host LLM. Render the JSON fingerprint and ask:

> *"Looks right?"*

Options: `Yes`, `Edit`, `Re-extract`.

- `Yes`: write the approved JSON to
  `~/.agentic-humanizer/voice-fingerprint.json`, then rewrite
  `~/.agentic-humanizer/profile.json` so `voice_path` points to the resolved
  sample, `voice_skip` is `false`, `voice_fingerprint_hash` matches the sample
  hash, and `version` is `3`. Use the same heredoc pattern as Step 3, replacing
  only those voice fields and preserving the rewrite preferences (`language`,
  `variant`, `reading_level`, `target_grade`, `tone`, `length_policy`):

  ```bash
  mkdir -p ~/.agentic-humanizer
  cat > ~/.agentic-humanizer/profile.json <<EOF
  {
    "language": "<keep current>",
    "variant": "<keep current>",
    "reading_level": "<keep current>",
    "target_grade": <keep current>,
    "tone": "<keep current>",
    "length_policy": "<keep current>",
    "voice_path": "<resolved-sample-path>",
    "voice_skip": false,
    "voice_fingerprint_hash": "sha256:<current-sample-hash>",
    "saved_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "version": 3
  }
  EOF
  ```

  Then set `voice_active=true`.
- `Edit`: let the user correct the JSON inline. Validate it against the
  required-field list in `references/voice-fingerprint.md` Required fields
  before saving. If the edit drops a required field, refuse to save and offer
  Re-extract.
- `Re-extract`: ask what to change, then re-run extraction with that hint.

On harnesses without a structured-question tool (the `generic` fallback), the
approval gate degrades to print-and-continue. See `harnesses/generic.md`
Fingerprint approval.

Inline `voice=/path/to/file.txt` does not overwrite the default sample or
saved profile path. It may refresh the shared fingerprint cache for that
sample hash.

If extraction fails, if the sample is binary or unreadable, or if no host LLM
is available for the extraction prompt, set `voice_active=false`, add the
extraction-failure footer flag for Step 7, and continue without voice
matching.

## Step 5: Probe Slop or Not Pro

Set `slop_mode="llm-only"` and `slop_backend=null` by default. Probing Slop
selects the enhancement path only; it never decides whether the humanizer runs.

Run a real `detect_text` fixture call to verify both presence AND Pro tier.
`slop status` succeeds for non-Pro; only `detect_text` Pro-gates.

Use this fixture for both paths:

```text
In today's digital environment, organizations often adopt new software because it promises efficiency, but the real value depends on whether people can trust it. A useful tool should explain what it does, respect the user's context, and avoid turning simple decisions into complicated workflows. Clear documentation helps teams evaluate those tradeoffs before they commit time or money.
```

**MCP path (try first):**

Call `mcp__SlopOrNot__detect_text` with the fixture and
`include_readability: true`. If the tool call succeeds and the parsed response
has a numeric `score` or `ai_probability` field, set
`slop_mode="slop-or-not-pro"` and `slop_backend="mcp"`. Treat scores from
`score` and `ai_probability` as 0-1 decimals unless the value is already
greater than 1. For readability, read the Flesch-Kincaid grade from
`readability.scores[]` where `kind` is `fleschKincaidGradeLevel`.

**CLI path (try second):**

Run via Bash with the app-bundle binary:

```bash
cat <<'EOF' | "/Applications/Slop Or Not.app/Contents/MacOS/slop" text --json
In today's digital environment, organizations often adopt new software because it promises efficiency, but the real value depends on whether people can trust it. A useful tool should explain what it does, respect the user's context, and avoid turning simple decisions into complicated workflows. Clear documentation helps teams evaluate those tradeoffs before they commit time or money.
EOF
```

If exit code is 0 AND stdout parses as JSON with one of these numeric score
paths, set `slop_mode="slop-or-not-pro"` and `slop_backend="cli"`:

- `detection.result._0`
- `detection.resultFewSentences._0`
- `ai_probability`

For CLI readability, read the grade from `readability.scores[]` where `kind`
is `fleschKincaidGradeLevel`. Treat the score as a 0-1 decimal unless the
value is already greater than 1.

The probe fixture above is English, so its readability block always returns
`kind: fleschKincaidGradeLevel`. This call only proves Pro access; discard its
readability value. Source-language readability is measured separately on the
real source text in Step 6, where the returned `kind` depends on the source
language (see `references/multilingual.md`).

If neither path is live, keep `slop_mode="llm-only"` and continue to Step 6.
Do not skip the interview, voice matching, or rewrite loop.

## Step 6: Run the loop

Read `references/multilingual.md` (the registry: supported languages,
readability formulas, band mapping, code normalization). Resolve the language L
from the profile, the inline `language=` override, or the detected and confirmed
language from Step 3. Read `references/per-iteration-strategies.md` (the
per-iteration cookbook). Then load the tell catalogue for L's branch below. The
language branch composes with, and does not replace, the 5-iteration schedule.

### Language branch: loading and termination

**L is `en` (English).** Read `references/patterns.md` (the canonical 29-pattern
rewrite vocabulary) and `references/supplemental-ai-tells.md`. Use the full
detector path. Read the Flesch-Kincaid grade from `scores[]` where `kind` is
`fleschKincaidGradeLevel`. Terminate per "Termination with Slop or Not Pro"
below.

**L is `es`, `de`, `it`, `sv`, `da`, or `nb` (supported non-English).** Do NOT
read `references/patterns.md` (it is English vocabulary). Read
`references/supplemental-ai-tells.md` and the per-language tell file
`references/ai-tells/<L>.md` (Norwegian Bokmal uses `references/ai-tells/no.md`,
Bokmal section). Pass the normalized `language_code` on every Slop or Not call.
Read whatever score `kind` `scores[]` returns, label it by that `kind`, and map
the value to a band using `references/multilingual.md`. The AI score is `n/a`:
`detect_text` returns `kind: "not_english"` with `score: null` for non-English
input, so do not use it for convergence. To get readability under Slop or Not
Pro, call `analyze_readability` directly (or read the still-populated
`readability` block from the `not_english` `detect_text` response). Terminate on
readability band membership (per-scale semantics in the registry) or after
MAX_ITER; there is no AI threshold check.

**L is `nn` (Norwegian Nynorsk) or an unsupported language.** Do NOT read
`references/patterns.md`. Read `references/supplemental-ai-tells.md` (and
`references/ai-tells/no.md`, Nynorsk section, for `nn`). Readability is not
available (the app returns `unsupported_language`), so skip
`analyze_readability`. The AI score is `n/a`. Run all MAX_ITER iterations and
select the final iteration by quality (same as Core mode). Warn the user: for
Nynorsk, "Readability scoring is not available for Norwegian Nynorsk in this app
version"; for an unsupported language, follow the unsupported-language policy in
`references/multilingual.md`.

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

For CLI cleanup, pipe the selected text into the app-bundle binary:

```bash
cat <<'TEXT_TO_CLEAN' | "/Applications/Slop Or Not.app/Contents/MacOS/slop" cleanup --json
<selected source or final text>
TEXT_TO_CLEAN
```

Then read:

- `cleanedText`
- Sum `invisibleCounts[].count`
- Sum `punctuationCounts[].count`
- Sum `homoglyphCounts[].count`
- Count `britishMappings.length`

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

**Supported non-English (L in {es, de, it, sv, da, nb}):** no AI threshold (the
AI score is `n/a`). Terminate when the readability score for L's formula lands
in the target band (grade scales use `|score - band_midpoint| <= 1`; ease scales
and LIX use band-range membership; see `references/multilingual.md`) or after
`MAX_ITER`. On non-convergence, return the iteration closest to the target band.

**Nynorsk or unsupported (L is `nn` or other):** tells-only, no readability and
no AI score. Run all `MAX_ITER` iterations and select by quality, as in Core
mode.

After selecting the final iteration, run Text Cleanup on that selected text.
Store `final_cleanup_stats`, use the cleaned text as the final output, then
run final `detect_text` and `analyze_readability` on the cleaned final text.

### Completion in Core mode

Run all five rewrite strategies once unless the source is empty or unusable.
Log AI score and readability as `null` for every iteration. Select the final
iteration by rewrite quality: preserve meaning, honor the requested reading
level, tone, and length, and remove the most visible AI tells from the tell
files loaded for L's branch (for English, `references/patterns.md` plus
`references/supplemental-ai-tells.md`; for other languages,
`references/supplemental-ai-tells.md` plus `references/ai-tells/<L>.md`).

### Mid-flight Pro-gate

If any `detect_text`, `analyze_readability`, or `clean_text` call returns
`isError: true` (MCP) or non-zero exit (CLI) on iteration >= 1, fall through
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
English (en-US). Readability: Flesch-Kincaid.

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

**Language line.** Always show the resolved language, variant, and readability
formula name, for example "German (de-DE). Readability: Wiener Sachtextformel."
When detection overrode a saved profile language, mark it and add the note, for
example "German (de-DE, detected; saved profile language is English).
Readability: Wiener Sachtextformel." followed by:

```markdown
> _Ran in German because the text was detected as German; your saved profile language is English. Override with `language=` to change._
```

**Readability column.** Label the value by the returned `kind`:
`fleschKincaidGradeLevel` shows the grade number, `wienerSachtextformel4` shows
"Wiener", `fleschSzigriszt` shows "Szigriszt", `gulpease` shows "Gulpease",
`lix` shows "LIX". Show the value and the band in parentheses, for example
"Wiener: 10.6 (High school)". For English, keep the bare grade number plus the
band.

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
> _Voice matched from <path> (fingerprint cached <date>)._
```

If voice extraction failed in Step 4, add this footer note instead:

```markdown
> _Voice extraction failed; ran without voice match. Re-run with `/agentic-humanizer reset voice` to retry._
```

## Pointer files

- `harnesses/claude-code.md` · `harnesses/codex.md` · `harnesses/cursor.md`
  · `harnesses/gemini-cli.md` · `harnesses/opencode.md` · `harnesses/generic.md`
- `references/patterns.md` (the canonical 29 AI tells, English only)
- `references/supplemental-ai-tells.md` (supplemental language-agnostic AI tells)
- `references/multilingual.md` (the multilingual readability registry)
- `references/ai-tells/<code>.md` (per-language tells: es, de, it, sv, da, no)
- `references/per-iteration-strategies.md` (the loop cookbook)
- `references/voice-fingerprint.md` (voice sample extraction and loop
  injection contracts)
- `references/slop-cli-setup.md` · `references/slop-mcp-setup.md`
  (install guides; surface to user when they ask for on-device AI detector
  scoring setup)
