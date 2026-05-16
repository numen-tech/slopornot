# Agentic Humanizer for Claude, Codex, Hermes Agent, and OpenClaw

Agentic Humanizer is an AI humanizer skill that rewrites AI-generated text in
a scored loop. It is built for Claude, Codex, Hermes Agent, OpenClaw,
OpenCode, Cursor, Gemini CLI, and other AI coding or writing agents that can
call local tools on your Mac.

The broader SlopOrNot plugin bundle lets agents call a local AI text detector,
AI image detector, readability analyzer, and text cleanup tool on your Mac.
With Slop or Not Pro installed, the skill can call a local AI text detector,
readability analyzer, and text cleanup tool through the `slop` CLI or
`slop mcp`. Detection and readability scoring run on your Mac. The rewrite
itself runs in whichever assistant you use.

## What It Does

Agentic Humanizer is not a one-shot paraphraser. It loops through a measured
rewrite process:

1. Score the source text with Slop or Not Pro's local AI text detector.
2. Analyze readability with Flesch-Kincaid grade level.
3. Ask for dialect, target reading level, tone, and length preference.
4. Rewrite with a different strategy on each pass.
5. Stop when the AI score and readability target converge, or return the best
   iteration after the cap.

The skill still runs without Slop or Not Pro, but it falls back to one unscored
rewrite pass.

## Install

Install the full `slopornot` plugin bundle when your agent supports plugins.

Codex:

```bash
codex plugin marketplace add numen-tech/slopornot
```

Then run `codex`, open `/plugins`, switch to the `slopornot` marketplace, and
choose `Install plugin`.

Claude Code:

```text
/plugin marketplace add numen-tech/slopornot
/plugin install slopornot@slopornot
```

Claude Code namespaces plugin skills by plugin name:

```text
/slopornot:agentic-humanizer
```

Direct skill installs and non-plugin clients can invoke:

```text
/agentic-humanizer
```

## Inline Overrides

```text
/agentic-humanizer dialect=us grade=8 tone=casual length=±10 threshold=20 max=7 [paste]
```

Available flags:

| Flag | Effect |
|---|---|
| `dialect=us` or `dialect=uk` | Set the English variant. |
| `grade=N` | Set the target Flesch-Kincaid grade. |
| `tone=casual`, `tone=professional`, or `tone=academic` | Set the rewrite tone. |
| `length=±10`, `length=exp`, or `length=trim` | Keep length close, allow expansion, or allow trimming. |
| `threshold=N` | Override the AI-score target. |
| `max=N` | Override the 5-iteration cap. |
| `voice=/path/to/file.txt` | Use a writing sample for this run. |
| `voice=off` or `voice-skip` | Skip voice matching. |
| `skip-interview` | Use saved preferences or defaults. |

## Local Files

Agentic Humanizer stores preferences and optional voice data under:

```text
~/.agentic-humanizer/
```

That directory can contain:

- `profile.json`
- `voice.txt`
- `voice-fingerprint.json`

## Related Slop Or Not Tools

The broader `slopornot` plugin bundle is designed around local Mac analysis
tools:

- AI text detector
- AI image detector
- readability analyzer
- text cleanup tool

The current `agentic-humanizer` skill uses the text detector, readability
analyzer, and cleanup tool. Future skills can use the image detector and other
local Slop or Not capabilities.
