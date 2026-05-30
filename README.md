# SlopOrNot: AI humanizer and on-device AI detector for agents

SlopOrNot is a plugin bundle for Claude, Codex, Hermes Agent, OpenClaw,
OpenCode, Cursor, Gemini CLI, and other AI agents.

It ships two skills:

- `agentic-humanizer`: an AI humanizer that rewrites AI-generated text with a
  full 5-pass workflow in English and six other languages, saved preferences,
  and optional voice matching.
- `slop-check`: a one-shot on-device AI detector for AI text detection, AI image
  detection, readability, Text Cleanup, raw OmniAID scores when explicitly
  requested, and Pro status.

**Agentic Humanizer does not need Slop or Not for its core functionality.**
Without Slop or Not, it still runs the full rewrite workflow and can match a
writing sample. Slop or Not Pro adds the measured on-device AI detector loop:
AI score (English only), native-language readability, Text Cleanup before and
after humanization, and a cleanup summary in the final output.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## What Agentic Humanizer Does

Agentic Humanizer is not a one-shot paraphraser. Paste a draft, answer a few
rewrite preferences, and the skill works through five targeted passes:

1. Pattern surgery against common AI-writing tells.
2. Variant and tone alignment (language variant and register).
3. Reading-level adjustment.
4. Cleanup-aware targeted editing.
5. Final structural rewrite when earlier passes are not enough.

Voice matching is part of the core skill. Add a writing sample at
`~/.agentic-humanizer/voice.txt` or pass `voice=/path/to/file.txt`, and the
skill extracts a stylometric fingerprint for rhythm, register, contractions,
sentence shape, and concrete phrasing. Voice matching works with or without
Slop or Not Pro.

### Languages

Agentic Humanizer supports English, Spanish, German, Italian, Swedish, Danish,
and Norwegian Bokmal, plus Norwegian Nynorsk for tells. It detects the source
language and confirms it in the interview, loads that language's AI-tell
catalogue, and measures readability with the language's native formula
(Flesch-Kincaid for English, Wiener Sachtextformel for German, Flesch-Szigriszt
for Spanish, Gulpease for Italian, LIX for the Nordic languages). The on-device
AI detector is English only, so for other languages the AI score shows as n/a
and, with Slop or Not Pro, the loop then converges on the reading-level band
instead; the no-Slop core workflow runs all five passes and selects by quality,
the same as English. Nynorsk runs with
tells but without readability; other languages fall back to language-agnostic
structural tells with a clear warning.

## How It Runs

### Without Slop or Not

This path runs anywhere the skill can run. It does not require Slop or Not,
the `slop` CLI, or MCP.

- Uses inline settings, a saved profile, or the interview.
- Uses optional voice matching from your writing sample.
- Runs all five rewrite strategies.
- Returns loop history with score and grade shown as `n/a`.
- Does not claim detector convergence or cleanup stats.

### Slop or Not Pro

This runs when Slop or Not Pro is reachable through MCP or the `slop` CLI on
Mac.

- Runs Text Cleanup on the source before the baseline.
- Scores each pass with Slop or Not's local AI text detector.
- Checks the native reading grade (Flesch-Kincaid for English; Wiener Sachtextformel, LIX, or another formula per language) against your target band.
- Runs Text Cleanup again on the selected final text.
- Shows a Text Cleanup summary with hidden-character, punctuation,
  homoglyph, and dialect-substitution counts.

The only capability Slop or Not adds to `agentic-humanizer` is local measured
feedback and cleanup instrumentation. The humanization workflow itself remains
available without it.

## Slop Check

Use `slop-check` when you want local analysis without a rewrite:

```text
/slop-check is this AI? <paste text>
/slop-check what reading grade is draft.md
/slop-check is this image AI? ~/Desktop/art.png
/slop-check clean the invisible characters out of this: <paste text>
```

`slop-check` needs Slop or Not Pro because all of its work is on-device AI
detector, readability, image, cleanup, or status tooling.

## Install

### Recommended: plugins

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

For non-interactive Claude setup after adding the marketplace:

```bash
claude plugin install slopornot@slopornot
```

Claude Code namespaces plugin skills by plugin name, so use:

```text
/slopornot:agentic-humanizer
/slopornot:slop-check
```

Direct skill installs and other harnesses use:

```text
/agentic-humanizer
/slop-check
```

### Fallback: direct skill install

Use this path for clients that do not support plugins yet.

For Claude Code, Cursor, or Windsurf:

```bash
npx skills add numen-tech/slopornot
```

For Codex CLI, Gemini CLI, or OpenCode, clone the repo once and copy both
self-contained skill directories into the harness skill directory:

```bash
git clone https://github.com/numen-tech/slopornot /tmp/slopornot

# Codex CLI
rm -rf ~/.codex/skills/agentic-humanizer ~/.codex/skills/slop-check && \
  mkdir -p ~/.codex/skills && \
  cp -R /tmp/slopornot/skills/agentic-humanizer ~/.codex/skills/ && \
  cp -R /tmp/slopornot/skills/slop-check ~/.codex/skills/

# Gemini CLI
rm -rf ~/.gemini/skills/agentic-humanizer ~/.gemini/skills/slop-check && \
  mkdir -p ~/.gemini/skills && \
  cp -R /tmp/slopornot/skills/agentic-humanizer ~/.gemini/skills/ && \
  cp -R /tmp/slopornot/skills/slop-check ~/.gemini/skills/

# OpenCode
rm -rf ~/.config/opencode/skills/agentic-humanizer ~/.config/opencode/skills/slop-check && \
  mkdir -p ~/.config/opencode/skills && \
  cp -R /tmp/slopornot/skills/agentic-humanizer ~/.config/opencode/skills/ && \
  cp -R /tmp/slopornot/skills/slop-check ~/.config/opencode/skills/
```

After copying, restart your harness so the skills are discovered.

### Claude Desktop

Claude Desktop has no plugin marketplace, so it gets a dedicated bundle.
Build the zip from a clone:

```bash
git clone https://github.com/numen-tech/slopornot /tmp/slopornot
make -C /tmp/slopornot/claude-skills
```

This writes `claude-skills/agentic-humanizer-desktop.zip`. In Claude Desktop,
open `Settings`, then `Capabilities`, then `Skills`, choose `Upload skill`,
and select that zip. This build has no harness routing: it runs a built-in
interview using Claude Desktop's `ask_user_input_v0` prompt, one question at
a time, and uses a Slop or Not MCP connector when one is attached.

## Optional: Set Up Slop or Not Pro

This section is optional for Agentic Humanizer's core rewrite and voice
matching features. Set it up if you want Slop or Not Pro scoring, readability,
Text Cleanup, cleanup stats, or the `slop-check` skill.

1. Install Slop or Not for Mac: <https://slopornot.ai/download>
2. Open the app and unlock Pro from Settings, then Subscription.
3. Open Settings, then Command Line in Slop or Not for the current CLI setup
   command. You can also call the bundled binary directly:

   ```bash
   "/Applications/Slop Or Not.app/Contents/MacOS/slop" status --json
   ```

4. Optionally register `slop mcp` with your AI client. See
   [`skills/agentic-humanizer/references/slop-mcp-setup.md`](skills/agentic-humanizer/references/slop-mcp-setup.md)
   for per-harness configuration snippets.

Verify:

```bash
"/Applications/Slop Or Not.app/Contents/MacOS/slop" status --json
```

Recent builds print `{"pro": true, ...}` when Pro is active. Older builds use
the legacy `"premium": true` field. The skill still verifies Pro with a real
detector call before using Slop or Not Pro.

## Usage

```text
/agentic-humanizer
[paste your AI-generated text here]
```

Claude Code plugin installs use:

```text
/slopornot:agentic-humanizer
[paste your AI-generated text here]
```

The skill detects the source language, then asks for language and variant,
reading level, tone, and length preference unless you pass inline overrides or
have a saved profile. It may also ask whether to use a writing sample for voice
matching.

Output without Slop or Not shows the full workflow without detector claims:

```markdown
## Humanized text
<the rewritten text>

## Language
English (en-US). Readability: Flesch-Kincaid grade.

## Loop history
| Iter | AI score | Readability | Strategy |
|---|---:|---:|---|
| 1 | n/a | n/a | pattern surgery |
| 2 | n/a | n/a | variant + tone |
| 3 | n/a | n/a | grade gap |
| 4 | n/a | n/a | clean + targeted |
| 5 | n/a | n/a | emergency surgery |

> _Ran without Slop or Not Pro. Add Slop or Not Pro for on-device AI detector scoring, readability checks, Text Cleanup, and cleanup stats: <https://slopornot.ai/download>_

## Highest-impact edits
- ...
```

Slop or Not Pro output adds on-device AI detector scores and cleanup stats:

```markdown
## Humanized text
<the rewritten text>

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
- ...
```

The final output does not expose MCP or CLI backend labels.

## Inline Overrides

```text
/agentic-humanizer dialect=us grade=8 tone=casual length=±10 threshold=20 max=7 [paste]
```

Available flags:

| Flag | Effect |
|---|---|
| `language=<code>` | Set the target language (for example `language=de`). Without `variant=`, uses that language's default variant from the registry. |
| `variant=<spec>` | Set the variant (for example `variant=de-AT`). |
| `dialect=us` or `dialect=uk` | Legacy English alias for `variant=en-US` or `variant=en-GB`. |
| `grade=N` | Set the target Flesch-Kincaid grade (English only). |
| `level=<band>` | Set the reading-level band for any language (`elementary` to `graduate`). |
| `tone=casual`, `tone=professional`, or `tone=academic` | Set the rewrite tone. |
| `length=±10`, `length=exp`, or `length=trim` | Keep length close, allow expansion, or allow trimming. |
| `threshold=N` | Override the Slop or Not Pro AI-score target. |
| `max=N` | Override the Slop or Not Pro measured-iteration cap. |
| `voice=/path/to/file.txt` | Use this voice sample for this call only. |
| `voice=off` or `voice-skip` | Skip voice matching for this call. |
| `skip-interview` | Use the saved profile if present, otherwise use defaults. |

## Saved Preferences And Voice

Agentic Humanizer stores optional profile and voice files under:

```text
~/.agentic-humanizer/
```

Manage them with:

```text
/agentic-humanizer show profile
/agentic-humanizer reset
/agentic-humanizer set language=de variant=de-AT level=high_school tone=casual length=±10
/agentic-humanizer show voice
/agentic-humanizer reset voice
/agentic-humanizer set voice=/path/to/file.txt
```

The voice sample and fingerprint are local files. Fingerprint extraction runs
through your current AI assistant, so privacy follows that assistant's local or
cloud setup. A saved profile from an earlier version (without a `language`
field) loads as English and upgrades to the current schema on the next write.

## What Slop or Not Adds

Slop or Not Pro makes the humanizer more measurable:

- Local AI score per iteration.
- Local reading grade per iteration (Flesch-Kincaid for English; native formula for other languages).
- Text Cleanup before and after humanization.
- Cleanup stats that show hidden characters, punctuation artifacts,
  homoglyphs, and dialect substitutions.
- Pro-gated local tools for `slop-check`.

Detection runs on-device on Apple silicon. Rewriting still runs in your AI
assistant, which may be cloud or local depending on the assistant you use.

## Credits And License

The 29-pattern rewrite playbook is from
[blader/humanizer](https://github.com/blader/humanizer). It is used under the
MIT License.

The supplemental AI-tell checks are SlopOrNot-authored and inspired by
[Wikipedia:Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing).
They are a broad field-guide supplement, not a replacement for the licensed
29-pattern playbook.

SlopOrNot is licensed under the [MIT License](LICENSE).

Slop or Not is a separate Mac app from Numen Technologies. See
<https://slopornot.ai>.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). New harness routing files are
welcome. PRs that change the 29-pattern catalogue should sync from the
licensed source material rather than diverging.
