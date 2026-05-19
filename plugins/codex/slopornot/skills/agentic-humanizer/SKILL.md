---
name: agentic-humanizer
version: 0.1.0
description: |
  Humanizes AI-generated text with a 5-pass rewrite workflow, optional saved
  preferences, and optional stylometric voice matching from a writing sample.
  Works without Slop or Not. When Slop or Not Pro is reachable, adds
  on-device AI detector scoring, Flesch-Kincaid readability checks, Text
  Cleanup, and cleanup stats.
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

**Slash command:** `/agentic-humanizer [paste text]`

**Inline overrides:** `/agentic-humanizer dialect=us|uk grade=N tone=casual|professional|academic length=±10|exp|trim threshold=N max=N voice=/path/to/file.txt|off voice-skip skip-interview [paste]`

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
| `/agentic-humanizer set dialect=uk grade=10 tone=casual length=±10` | Write a profile from inline params without running the interview. Any subset of keys is allowed; missing keys keep their current value or use the default if no profile exists. |
| `/agentic-humanizer show voice` | Print `~/.agentic-humanizer/voice-fingerprint.json` if present, plus the sample path; otherwise say no voice is saved. |
| `/agentic-humanizer reset voice` | Remove `~/.agentic-humanizer/voice.txt` and `~/.agentic-humanizer/voice-fingerprint.json`, then clear voice fields from the profile without deleting the rewrite preferences. |
| `/agentic-humanizer set voice=/path/to/file.txt` | Save the profile's `voice_path`, clear `voice_skip`, and use that path on future runs. Do not extract the fingerprint until the next rewrite call. |

When you see one of these subcommands, execute it and stop. Do not probe Slop
or run the loop.

## Step 3: Resolve rewrite preferences

**Profile resolution order:**

1. **Inline overrides** for all four rewrite parameters -> use them; do not
   read the profile for dialect, grade, tone, or length.
2. **`skip-interview` flag** -> use the saved profile if present, otherwise
   fall back to defaults (American, High school, Professional, ±10%).
3. **Saved profile at `~/.agentic-humanizer/profile.json`** -> use it
   silently and skip the interview. Never re-prompt a user who already has a
   profile unless they ask.
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

**Run the interview** by reading the harness file selected in Step 1 and
following its interview protocol. The selected harness may batch the
conditional voice question when it is eligible; Step 4 handles that answer.
Capture these rewrite settings here:

- `dialect` in {`us`, `uk`, `other:<string>`}
- `target_grade` in {4, 7, 10, 13, 17}
- `tone` in {`casual`, `professional`, `academic`}
- `length_policy` in {`±10`, `exp`, `trim`}

After the rewrite answers, ask **one final yes/no question** (use the same
harness question tool):

> *"Save these as your default so I don't ask again next time? You can reset anytime with `/agentic-humanizer reset`."*

If yes:

```bash
mkdir -p ~/.agentic-humanizer
cat > ~/.agentic-humanizer/profile.json <<EOF
{
  "dialect": "<us|uk|other:...>",
  "target_grade": <4|7|10|13|17>,
  "tone": "<casual|professional|academic>",
  "length_policy": "<±10|exp|trim>",
  "voice_path": "~/.agentic-humanizer/voice.txt",
  "voice_skip": false,
  "voice_fingerprint_hash": null,
  "saved_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": 2
}
EOF
```

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
and `"version": 2`, then skip voice matching.

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
  hash, and `version` is `2`. Use the same heredoc pattern as Step 3,
  replacing only those four fields and preserving everything else:

  ```bash
  mkdir -p ~/.agentic-humanizer
  cat > ~/.agentic-humanizer/profile.json <<EOF
  {
    "dialect": "<keep current>",
    "target_grade": <keep current>,
    "tone": "<keep current>",
    "length_policy": "<keep current>",
    "voice_path": "<resolved-sample-path>",
    "voice_skip": false,
    "voice_fingerprint_hash": "sha256:<current-sample-hash>",
    "saved_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "version": 2
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

If neither path is live, keep `slop_mode="llm-only"` and continue to Step 6.
Do not skip the interview, voice matching, or rewrite loop.

## Step 6: Run the loop

Read `references/patterns.md` (the 29-pattern rewrite vocabulary).
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
and remove the most visible AI tells from `references/patterns.md`.

### Mid-flight Pro-gate

If any `detect_text`, `analyze_readability`, or `clean_text` call returns
`isError: true` (MCP) or non-zero exit (CLI) on iteration >= 1, fall through
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
> _Voice matched from <path> (fingerprint cached <date>)._
```

If voice extraction failed in Step 4, add this footer note instead:

```markdown
> _Voice extraction failed; ran without voice match. Re-run with `/agentic-humanizer reset voice` to retry._
```

## Pointer files

- `harnesses/claude-code.md` · `harnesses/codex.md` · `harnesses/cursor.md`
  · `harnesses/gemini-cli.md` · `harnesses/opencode.md` · `harnesses/generic.md`
- `references/patterns.md` (the 29 AI-tells)
- `references/per-iteration-strategies.md` (the loop cookbook)
- `references/voice-fingerprint.md` (voice sample extraction and loop
  injection contracts)
- `references/slop-cli-setup.md` · `references/slop-mcp-setup.md`
  (install guides; surface to user when they ask for on-device AI detector
  scoring setup)
