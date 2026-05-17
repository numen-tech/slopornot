---
name: slop-check
version: 0.1.0
description: |
  Routes a request to Slop or Not Pro's on-device tools: detect whether
  text or an image is AI-generated, clean AI artifacts out of text, and
  score readability (Flesch-Kincaid). Runs locally on a Mac via the
  SlopOrNot MCP server or the slop CLI. Use when the user asks "is this
  AI", "did a bot write this", "is this image AI generated", "clean the
  invisible characters out of this", "what reading grade is this", or
  invokes /slop-check. Not for rewriting or humanizing text; that is the
  agentic-humanizer skill.
license: MIT
compatibility: claude-code codex cursor gemini-cli opencode
allowed-tools:
  - Read
  - Bash
---

# Slop Check

One-shot access to Slop or Not Pro's on-device analysis. Detect AI text or
images, clean AI artifacts, or score readability, then report a clear
verdict. No interview, no loop.

**Slash command:** `/slop-check [paste text | file path | image path]`

## Critical rules

1. MUST try the MCP backend before the CLI backend.
2. MUST verify Pro with a real Pro-gated call. NEVER infer Pro from
   `slop_status` or `slop status`; both succeed for non-Pro users.
3. NEVER block on a structured-question tool. Resolve ambiguity with the
   Step 1 precedence rule and state the assumption, or emit the single
   plain-text input request. Plain text renders on every harness.
4. NEVER create symlinks, edit shell rc files, or otherwise modify PATH.
   If `slop` is not on PATH, use the absolute app-bundle binary when
   present; otherwise send the setup fallback. Detection, readability,
   cleanup, score, and status are output-only: run them immediately, no
   permission needed.
5. Detection scores are 0-1 decimals; MUST multiply them by 100 for
   display. Readability values are grade/ease numbers and MUST NOT be
   converted to percentages. NEVER guess a flag or JSON field path; look it
   up in `references/slop-tools.md`.

## Step 1: Identify the operation and input

Pick one operation from the request. Do not ask a question to disambiguate.

| Operation | Trigger language |
|---|---|
| `text-detect` | "is this AI", "did a bot write this", "AI written" |
| `image-detect` | "is this image AI", "AI generated picture", "real photo" |
| `image-score` | "raw AI score for this image", "image model score" |
| `readability` | "reading level", "what grade", "Flesch", "how readable" |
| `cleanup` | "clean this", "strip invisible/zero-width", "remove homoglyphs" |
| `status` | "is slop set up", "is Slop or Not working", "check Pro" |

Resolve the input by precedence (first match wins):

1. A path ending `.png`, `.jpg`, `.jpeg`, `.heic`, or `.webp`, or an
   explicit image reference: image operation on that file.
2. Any other explicit file path: read that file as text.
3. Inline pasted text in the request: use it.
4. The user says to use the clipboard: `pbpaste`.

Ambiguity rule (NEVER ask via a tool): if no operation verb is present,
default to `text-detect` for text input and `image-detect` for image
input, and state the assumption in the output, for example: "Assumed
AI-detection. Ask for readability or cleanup to switch."

Only if there is no usable input at all, emit exactly this one line, then
stop and wait:

```text
Paste the text, or give a file or image path, and say detect / clean / readability.
```

## Step 2: Resolve a working backend

Try in strict order. Stop at the first that works.

1. **MCP first.** Call the operation's SlopOrNot MCP tool (Claude Code
   surfaces these as `mcp__SlopOrNot__<tool>`; other harnesses expose the
   same `SlopOrNot` server tools). If it returns a result and is not a
   Pro-required error (`isError: true` or a Pro-required message), use it.
   For `status`, `slop_status` is only a health/version call: also run the
   Pro proof probe in `references/slop-tools.md` section 5 before reporting
   active Pro. Done.
2. **CLI fallback.** If MCP is absent or errored, check `command -v slop`.
   If `slop` resolves, use the CLI command for the operation. For `status`,
   run `slop status --json` plus the Pro proof probe before reporting
   active Pro.
3. **App bundle fallback.** If `slop` does not resolve, check whether the
   bundled binary exists:

   ```bash
   ls "/Applications/Slop Or Not.app/Contents/MacOS/slop"
   ```

   - If it exists: complete this turn's operation by calling the binary at
     its absolute quoted path. Do not modify PATH.
   - If it does not exist: this is genuinely not installed. Go to the
     Step 5 "Not installed" fallback.
4. **Pro-gated failure.** If the CLI runs but a Pro-gated call exits
   non-zero or returns Pro-required, the app is installed and Pro is not
   active: go to the Step 5 "Installed but Pro is not active" fallback. For
   `status`, report Pro as inactive per Step 4 instead.

Tool names, flags, parameters, and JSON field paths are in
`references/slop-tools.md`. Setup and registration details are in
`references/slop-setup.md`. Consult them; do not guess.

## Step 3: Run the operation

Use the operation-to-tool map in `references/slop-tools.md` section 5.
Key points:

- `text-detect`: request readability alongside detection
  (`include_readability: true` on MCP; `slop text --json` returns both).
- Images: MCP needs base64 (`base64 -i <path>`); the CLI reads raw bytes
  (`slop image --json < "<path>"`). `score_image` is MCP-only; with the
  CLI, report the image `detection.result._0` as the score.
- `cleanup`: keep the default removals on unless the user asked to limit
  them. Normalize MCP and CLI cleanup fields before formatting: MCP returns
  `cleaned_text` and integer counts; CLI returns `cleanedText` plus count
  arrays.
- `status`: run the health call and then the Pro proof probe. Report active
  only when the Pro-gated probe succeeds.

## Step 4: Present the result

Read score normalization in `references/slop-tools.md` section 2 first
(detection score is a 0-1 decimal, multiply by 100; MCP `verdict` is a
plain string, CLI verdict is the single-key object at
`detection.result._1`).

Render the matching block.

**Detection (text or image):**

```markdown
**Likely AI** (most_likely_ai_slop) · 87% AI probability
Language: en · Sentences: 6 · Backend: MCP
```

Map the verdict by rule (verdicts have gradations like `probably_ai_slop`):
`real` -> "Likely human"; contains `ai_slop` -> "Likely AI"; else
title-cased. Show the label, the raw verdict in parentheses, and the
percentage.

**Readability:**

```markdown
**Flesch-Kincaid grade: 9.7** (Reading Ease 62.4)
Words: 210 · Sentences: 14 · Backend: CLI
```

If `scores[]` is empty (short input), the response carries a `warnings`
entry like `insufficient_text:NN`. Report that instead of a grade, for
example: `Not enough text to score reliably (insufficient_text:28).` Do
not invent a grade.

**Cleanup:** print the counts line, then the cleaned text in its own fenced
`text` block so the user can copy it verbatim. For CLI output, use
`cleanedText` as the cleaned text, sum `invisibleCounts[].count`,
`punctuationCounts[].count`, and `homoglyphCounts[].count`, and count
`britishMappings.length`.

`**Cleaned.** Invisibles: 3 · Punctuation: 5 · Homoglyphs: 1 · British: 0`,
followed by a fenced `text` block containing only `cleaned_text`.

**Image score:**

```markdown
**Raw image score: 0.80** (OmniAID) · Backend: MCP
```

**Status:**

```markdown
**Slop or Not Pro: active** (version 1.0.9)
```

Use `inactive` when the health call works but the Pro proof probe returns a
Pro-required error.

When the ambiguity rule fired, prepend the one-line assumption note.

## Step 5: Fallback when Slop or Not Pro is unavailable

Two distinct cases. Pick the message that matches the real state. Never
tell an installed user to install the app.

**Not installed** (MCP is down AND the app bundle is absent). End with
exactly this paragraph:

> *Slop or Not is not installed. Install Slop or Not for Mac, then unlock
> Pro from inside the app: <https://slopornot.ai/download>*

**Installed but Pro is not active** (the `slop` binary or app bundle
exists, but a Pro-gated call returned Pro-required or exited non-zero).
End with exactly this paragraph:

> *Slop or Not is installed but Pro is not active. Unlock Pro from inside
> the app under Settings then Subscription: <https://slopornot.ai/download>*

In both cases, then say: see `references/slop-setup.md` for install, Pro
unlock, and MCP/CLI registration. A missing PATH alone is handled by the
app-bundle fallback in Step 2, not deflected here. For the `status`
operation, report
`Slop or Not Pro: inactive` per Step 4 instead of these paragraphs.

## Examples

**Example A, text detection (no verb, ambiguity rule fires):**

User: `/slop-check In today's fast-paced digital landscape, leveraging
synergies is paramount.`

Action: no verb, text input, default `text-detect`. MCP `detect_text`
with `include_readability: true`.

Output:

```markdown
Assumed AI-detection. Ask for readability or cleanup to switch.

**Likely AI** (most_likely_ai_slop) · 91% AI probability
Language: en · Sentences: 1 · Backend: MCP
```

**Example B, image detection from a path:**

User: `is this AI? ~/Desktop/art.png`

Action: path ends `.png`, so `image-detect`. MCP unavailable, `slop` on
PATH, so use the CLI: `slop image --json < "$HOME/Desktop/art.png"`.

Output:

```markdown
**Likely AI** (most_likely_ai_slop) · 80% AI probability
Backend: CLI
```

**Example C, readability of a file:**

User: `what grade level is draft.md`

Action: explicit file path, `readability`. MCP `analyze_readability` with
the file contents. Read the `fleschKincaidGradeLevel` entry.

Output:

```markdown
**Flesch-Kincaid grade: 7.2** (Reading Ease 71.8)
Words: 148 · Sentences: 11 · Backend: MCP
```

**Example D, cleanup with a zero-width character:**

User: `clean the invisible characters out of this: Hello​world`

Action: `cleanup`. MCP `clean_text` (defaults on).

Output: the counts line `**Cleaned.** Invisibles: 1 · Punctuation: 0 ·
Homoglyphs: 0 · British: 0`, then a fenced `text` block whose only content
is `Helloworld` (the zero-width character removed).

## Pointer files

- `references/slop-tools.md`: full CLI and MCP surface, parameters, flags,
  JSON field paths, score normalization, Pro-gating, operation map.
- `references/slop-setup.md`: install, Pro unlock, app-bundle fallback,
  MCP/CLI registration, troubleshooting.
