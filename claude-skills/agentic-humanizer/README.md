# Agentic Humanizer for Claude Desktop

This is the Claude Desktop build of Agentic Humanizer. It rewrites
AI-generated text with a full 5-pass workflow, saved preferences, and
optional stylometric voice matching. Unlike the multi-agent build, this
version has no harness routing: it runs a built-in interview using Claude
Desktop's `ask_user_input_v0` prompt, one question at a time.

**Core functionality does not require Slop or Not.** Without Slop or Not, the
skill still interviews for preferences, can match a writing sample, runs all
five rewrite passes, and returns the final draft. Slop or Not Pro only adds
the measured local layer: AI score, Flesch-Kincaid readability, Text Cleanup
before and after humanization, and cleanup stats. If a Slop or Not MCP
connector is attached in Claude Desktop, the skill uses it automatically;
otherwise it runs the unscored core workflow.

## Install in Claude Desktop

1. Get `agentic-humanizer-desktop.zip`. Build it with `make` (see below) or
   download it from a release.
2. In Claude Desktop, open `Settings`, then `Capabilities`, then `Skills`.
3. Choose `Upload skill` and select `agentic-humanizer-desktop.zip`.
4. Start a chat and ask Claude to humanize text, or type
   `/agentic-humanizer` followed by your text.

## Build the zip

From the repository root:

```bash
make -C claude-skills
```

This produces `claude-skills/agentic-humanizer-desktop.zip`. The zip contains
one folder, `agentic-humanizer/`, with `SKILL.md`, this `README.md`, the
`references/` docs, and the `examples/` fixture.

## Usage

```text
/agentic-humanizer
[paste your AI-generated text here]
```

On first use Claude Desktop asks four short questions (dialect, reading
level, tone, length), then optionally one about matching a writing sample.
Answers can be saved as defaults so later runs skip the interview.

Use a voice sample for one call:

```text
/agentic-humanizer voice=/path/to/sample.txt [paste]
```

Use saved preferences without another interview:

```text
/agentic-humanizer skip-interview [paste]
```

## Inline overrides

```text
/agentic-humanizer dialect=us grade=8 tone=casual length=±10 threshold=20 max=7 [paste]
```

| Flag | Effect |
|---|---|
| `dialect=us` or `dialect=uk` | Set the English variant. |
| `grade=N` | Set the target Flesch-Kincaid grade. |
| `tone=casual`, `tone=professional`, or `tone=academic` | Set the rewrite tone. |
| `length=±10`, `length=exp`, or `length=trim` | Keep length close, allow expansion, or allow trimming. |
| `threshold=N` | Override the Slop or Not Pro AI-score target. |
| `max=N` | Override the Slop or Not Pro measured-iteration cap. |
| `voice=/path/to/file.txt` | Use a writing sample for this run. |
| `voice=off` or `voice-skip` | Skip voice matching. |
| `skip-interview` | Use saved preferences or defaults. |

## Local files

Agentic Humanizer stores preferences and optional voice data under
`~/.agentic-humanizer/`, which can contain `profile.json`, `voice.txt`, and
`voice-fingerprint.json`. Manage them with:

```text
/agentic-humanizer show profile
/agentic-humanizer reset
/agentic-humanizer show voice
/agentic-humanizer reset voice
/agentic-humanizer set voice=/path/to/file.txt
```
