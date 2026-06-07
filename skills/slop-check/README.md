# Slop Check: on-device AI detector for Claude, Codex, Hermes Agent, and OpenClaw

Slop Check is a one-shot on-device AI detector skill for AI coding and writing
agents. Use it to check whether text or an image is AI-generated, score a
draft's readability in English or six other languages, or clean invisible
characters and AI-looking punctuation from text. It is built for Claude, Codex, Hermes
Agent, OpenClaw, OpenCode, Cursor, Gemini CLI, and other agents that can
call local tools on your Mac.

Unlike the `agentic-humanizer` skill, Slop Check does not rewrite
anything. It routes your request to the right Slop or Not Pro tool, runs it
on your Mac, and reports a clear verdict. Detection, readability, image
analysis, and cleanup all run on-device. Nothing is uploaded for the
analysis step.

## What it does

Six operations, all callable in one shot:

- Local AI text detection (verdict plus probability and readability)
- Local AI image detection (JPEG, PNG, HEIC, WebP)
- Raw OmniAID image score, only when explicitly requested
- Readability scoring in English (Flesch-Kincaid) plus Spanish, German, Italian, Swedish, Danish, and Norwegian Bokmal (native formulas)
- Text cleanup (zero-width characters, homoglyphs, fancy punctuation)
- Setup and Pro status check, verified with a Pro-gated probe

Backend order depends on the operation. Image detection and explicit raw
OmniAID image scoring use the app-bundle CLI first when shell commands are
available, so local image paths can be piped directly. Text detection,
readability, cleanup, and status try MCP first, then fall back to the
app-bundle CLI. MCP remains the fallback for image checks in clients without
shell access.

## Install

Install the `slopornot` plugin bundle when your agent supports plugins.

Codex:

```bash
codex plugin marketplace add numen-tech/slopornot
```

Then run `codex`, open `/plugins`, switch to the `slopornot` marketplace,
and choose `Install plugin`.

Claude Code:

```text
/plugin marketplace add numen-tech/slopornot
/plugin install slopornot@slopornot
```

Claude Code namespaces plugin skills by plugin name:

```text
/slopornot:slop-check
```

Direct skill installs and non-plugin clients invoke:

```text
/slop-check
```

## Usage

```text
/slop-check is this AI?
In today's fast-paced digital landscape, leveraging synergies is paramount.
```

```text
/slop-check what reading grade is draft.md
```

```text
/slop-check is this image AI? ~/Desktop/art.png
```

```text
/slop-check clean the invisible characters out of this: <paste text>
```

If you do not name an operation, Slop Check assumes AI-detection and tells
you so, so you can switch to readability or cleanup. It never blocks on a
question.

## Output examples

Text and image detection return a label, raw verdict, and AI probability:

```markdown
**Likely AI** (most_likely_ai_slop) · 87% AI probability
Language: en · Sentences: 6
```

Raw OmniAID image scores are separate from image detection and run only when
you explicitly ask for OmniAID:

```text
/slop-check raw OmniAID score for ~/Desktop/art.png
```

Readability returns Flesch-Kincaid grade and Reading Ease as readability
values, not percentages:

```markdown
**Flesch-Kincaid grade: 9.7** (Reading Ease 62.4)
Language: en · Band: High school · Words: 210 · Sentences: 14
```

For non-English text, readability is labeled by the native formula (for example
"Wiener Sachtextformel" for German, "LIX" for the Nordic languages) with the
detected language and a reading-level band. AI text detection is English only:
for non-English input Slop Check reports "AI text detection is English-only; no
score available for <language>" and still shows the readability block. It never
invents a score.

Cleanup prints the changed text in a fenced block:

```markdown
**Cleaned.** Invisibles: 3 · Punctuation: 5 · Homoglyphs: 1 · British: 0
```

```text
Cleaned text goes here.
```

## Setup Slop or Not Pro

Slop Check needs Slop or Not Pro for Mac (Apple silicon), which ships the
`slop` CLI and the `slop mcp` MCP server.

1. Install Slop or Not for Mac: <https://slopornot.ai/download>
2. Open the app and unlock Pro from Settings, then Subscription.
3. Open Settings, then Command Line in Slop or Not for the current CLI
   setup command. The skill can also call the bundled binary directly:

   ```bash
   "/Applications/Slop Or Not.app/Contents/MacOS/slop" status --json
   ```

4. Optionally register the MCP server. The skill's
   `references/slop-setup.md` has per-client snippets.

## Related Slop or Not skills

The `slopornot` plugin bundle also ships `agentic-humanizer`, which rewrites
AI-generated text with a 5-pass workflow and optional voice matching. It can
run without Slop or Not. When Slop or Not Pro is available, the humanizer adds
on-device AI detector scoring, readability checks, Text Cleanup, and cleanup stats. Use
`slop-check` to measure or clean; use `agentic-humanizer` to rewrite.
