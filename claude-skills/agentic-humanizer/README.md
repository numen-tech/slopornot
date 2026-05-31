# Agentic Humanizer for Claude Desktop

This is the Claude Desktop build of Agentic Humanizer. It rewrites
AI-generated text with a full 5-pass workflow and optional stylometric voice
matching from a pasted writing sample. Unlike the multi-agent build, this
version has no harness routing: it runs a built-in interview using Claude
Desktop's `ask_user_input_v0` prompt, one question at a time. Because Claude
Desktop skills run in a sandbox, this bundle does not persist preferences,
voice samples, or fingerprints between chats; every run captures what it
needs in-session.

**Core functionality does not require Slop or Not.** Without Slop or Not, the
skill still interviews for preferences, can match a writing sample, runs all
five rewrite passes, and returns the final draft. Slop or Not Pro only adds
the measured local layer: AI score (English only), native-language readability, Text Cleanup
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

Agentic Humanizer detects the source language, then asks four short questions
(language and variant, reading level, tone, length), then optionally one about
matching a writing sample. Answers apply to the current run; the sandbox does
not persist them between chats. It supports English, Spanish, German, Italian,
Swedish, Danish, and Norwegian (Bokmal and Nynorsk); the AI score is English
only, and other languages use native readability and per-language tells.

Skip the interview for one call by passing every preference inline, or pass
`skip-interview` to use defaults:

```text
/agentic-humanizer skip-interview [paste]
```

To match a writing sample for this run, answer **Yes** to the voice question
and paste 200+ words when prompted. The pasted sample is held in memory for
that run only; nothing is written to disk.

## Inline overrides

```text
/agentic-humanizer dialect=us grade=8 tone=casual length=±10 threshold=20 max=7 [paste]
```

| Flag | Effect |
|---|---|
| `language=<code>` | Set the target language (for example `language=de`). |
| `variant=<spec>` | Set the variant (for example `variant=de-AT`). Without `language=`, infers the base language from the variant's BCP-47 prefix (for example `variant=de-AT` resolves to `language=de`). |
| `dialect=us` or `dialect=uk` | Legacy English alias for `variant=en-US` or `variant=en-GB`. |
| `grade=N` | Set the target Flesch-Kincaid grade (English only). |
| `level=<band>` | Set the reading-level band for any language (`elementary` to `graduate`). |
| `tone=casual`, `tone=professional`, or `tone=academic` | Set the rewrite tone. |
| `length=±10`, `length=exp`, or `length=trim` | Keep length close, allow expansion, or allow trimming. |
| `threshold=N` | Override the Slop or Not Pro AI-score target. |
| `max=N` | Override the Slop or Not Pro measured-iteration cap. |
| `voice=off` or `voice-skip` | Skip voice matching. |
| `skip-interview` | Use defaults (American, High school, Professional, ±10%). |

## Sandbox notes

Claude Desktop runs skills in a sandbox, so this bundle intentionally omits
the saved-profile and on-disk voice features of the multi-agent build. There
is no `~/.agentic-humanizer/` directory, and the `voice=/path/to/file.txt`
flag is not honored: pass it and Agentic Humanizer will ask you to paste the
sample into the chat instead.
