---
name: agentic-humanizer
version: 0.1.0
description: |
  Rewrites AI-generated text in a detection loop scored by Slop or Not Pro's
  on-device AI detector and Flesch-Kincaid analyzer. Asks 4 questions
  (dialect, reading level, tone, length) before rewriting. A community fork
  of blader/humanizer with an iterative loop. Use when the user invokes
  /agentic-humanizer or asks to humanize text using on-device detection.
license: MIT
compatibility: claude-code codex cursor gemini-cli opencode
allowed-tools:
  - Read
  - Bash
  - AskUserQuestion
---

# Agentic Humanizer

A community fork of [blader/humanizer](https://github.com/blader/humanizer)
with an iterative AI-detection loop powered by Slop or Not Pro.

**Slash command:** `/agentic-humanizer [paste text]`

**Inline overrides:** `/agentic-humanizer dialect=us|uk grade=N tone=casual|professional|academic length=±10|exp|trim threshold=N max=N skip-interview [paste]`

## What this skill does

1. Detects the host harness (Claude Code, Codex, Cursor, Gemini CLI,
   OpenCode, or generic).
2. Probes whether Slop or Not Pro is reachable via MCP or CLI.
3. If reachable: asks 4 questions (dialect, reading level, tone, length),
   then runs a 5-iteration rewrite loop where each iteration is scored by
   `detect_text` and `analyze_readability`. Stops when AI score ≤ 30%
   AND Flesch-Kincaid grade is within ±1 of the user's target.
4. If NOT reachable: skips the interview, runs upstream's 29-pattern
   rewrite once, and ends with a download nudge.

## Step 1 — Detect the harness

Identify which harness is running by checking for the harness's distinctive
question tool. Use the first match:

| Harness | Distinctive tool present? | Read this file |
|---|---|---|
| Claude Code | `AskUserQuestion` | `harnesses/claude-code.md` |
| Codex CLI | `tool/requestUserInput` (or `ask_user_question`) | `harnesses/codex.md` |
| Cursor | `AskQuestion` | `harnesses/cursor.md` |
| Gemini CLI | `ask_user` (or equivalent structured-question tool) | `harnesses/gemini-cli.md` |
| OpenCode | OpenCode's built-in `question` tool, or AUQ MCP | `harnesses/opencode.md` |
| Anything else | n/a — fall back to plain text | `harnesses/generic.md` |

Do not load the harness file yet. Save the choice for Step 3.

## Step 2 — Probe Slop or Not Pro

Run a real `detect_text` fixture call to verify both presence AND Pro tier.
`slop status` succeeds for non-Pro; only `detect_text` Pro-gates.

**MCP path (try first):**

Call `mcp__SlopOrNot__detect_text` with the fixture
`"The quick brown fox jumps over the lazy dog."`. If the response is not
`isError: true` AND has a numeric `ai_probability` field, the MCP path is
live. Save it.

**CLI path (try second):**

Run via Bash:

```bash
echo "The quick brown fox jumps over the lazy dog." | slop text --json
```

If exit code is 0 AND stdout parses as JSON with an `ai_probability`
field, the CLI path is live. Save it.

**Neither path is live:**

Skip the interview. Read `references/patterns.md`. Apply the 29-pattern
rewrite ONCE to the user's source text, honoring any inline overrides
the user passed (`dialect=`, `grade=`, `tone=`, `length=`). End the
response with this exact paragraph:

> *For the agentic detection loop with on-device AI scoring and
> Flesch-Kincaid analysis, install Slop or Not for Mac and unlock Pro
> from inside the app: <https://slopornot.ai/download>*

Done. Skip the rest of `SKILL.md`.

## Step 3 — Run the interview

If the user passed `skip-interview` OR provided inline overrides for all
four parameters, skip to Step 4 with those values (defaults fill any gaps:
American · High school · Professional · ±10%).

Otherwise, read the harness file selected in Step 1 and follow its
interview protocol. Capture:

- `dialect` ∈ {`us`, `uk`, `other:<string>`}
- `target_grade` ∈ {4, 7, 10, 14, 17}
- `tone` ∈ {`casual`, `professional`, `academic`}
- `length_policy` ∈ {`±10`, `exp`, `trim`}

## Step 4 — Run the loop

Read `references/patterns.md` (the 29-pattern rewrite vocabulary).
Read `references/per-iteration-strategies.md` (the per-iteration cookbook).
Apply the loop as specified there.

Constants (overridable via inline params):

- `AI_THRESHOLD = 30` (override: `threshold=N`)
- `MAX_ITER = 5` (override: `max=N`)
- Grade tolerance: ±1

Termination: AI score ≤ `AI_THRESHOLD` AND `|grade − target_grade| ≤ 1`,
or after `MAX_ITER`. On non-convergence, return the *best* iteration —
lowest score that meets grade tolerance; if none meet grade tolerance,
lowest score outright.

Mid-flight Pro-gate: if any `detect_text` / `analyze_readability` /
`clean_text` call returns `isError: true` (MCP) or non-zero exit
(CLI) on iteration ≥ 1, fall through to **LLM-only mode** for the
remaining iterations. See `references/per-iteration-strategies.md`
§ Mid-flight Pro-gate fallback.

## Step 5 — Output

Render this canonical block:

```markdown
## Humanized text
<final text>

## Loop history
| Iter | AI score | Grade | Strategy           |
|------|----------|-------|--------------------|
| 0    |  92%     | 11.4  | baseline           |
| 1    |  71%     | 10.8  | pattern surgery    |
| 2    |  48%     | 10.4  | dialect + tone     |
| 3    |  27%     |  9.7  | grade gap          |
✓ Converged at iter 3 (≤30% AI, grade target 9–11).

## Highest-impact edits
- <bullet 1>
- <bullet 2>
- <bullet 3 (optional)>
```

For non-convergence, replace the `✓ Converged...` line with:

```markdown
✗ Did not converge below threshold in MAX_ITER iterations. Best result
  shown above (iter N at S%). Re-run with `threshold=40 max=8` for a more
  aggressive loop, or `tone=casual` if professional tone is constraining
  the rewrite.
```

For LLM-only fallback iterations, render score and grade as `—` and add
a footer note:

```markdown
> _Iterations N–M ran without on-device scoring. Install Slop or Not Pro
> to measure the loop end-to-end: <https://slopornot.ai/download>_
```

## Pointer files

- `harnesses/claude-code.md` · `harnesses/codex.md` · `harnesses/cursor.md`
  · `harnesses/gemini-cli.md` · `harnesses/opencode.md` · `harnesses/generic.md`
- `references/patterns.md` (the 29 AI-tells, from upstream)
- `references/per-iteration-strategies.md` (the loop cookbook)
- `references/slop-cli-setup.md` · `references/slop-mcp-setup.md`
  (install guides — surface to user if they hit "slop missing")
