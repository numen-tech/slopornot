# Agentic Humanizer for Claude, Codex, Hermes Agent, and OpenClaw

Agentic Humanizer rewrites AI-generated text with a full 5-pass workflow,
saved preferences, and optional stylometric voice matching. It is built for
Claude, Codex, Hermes Agent, OpenClaw, OpenCode, Cursor, Gemini CLI, and other
AI coding or writing agents.

**Core functionality does not require Slop or Not.** Without Slop or Not, the
skill still interviews for preferences, can match a writing sample, runs all
five rewrite passes, and returns the final draft. Slop or Not Pro only adds the
measured local layer: AI score (English only), native-language readability,
Text Cleanup before and after humanization, and cleanup stats.

## What It Does

1. Resolves language and variant, reading level, tone, and length preferences.
2. Optionally extracts a stylometric voice fingerprint from your sample.
3. Runs five rewrite strategies against common AI-writing tells and
   supplemental artifact checks.
4. Uses Slop or Not Pro for on-device AI detector scoring and Text Cleanup when available.
5. Returns humanized text, loop history, highest-impact edits, and, when
   Slop or Not Pro cleanup ran, a Text Cleanup summary.

Without Slop or Not, score and grade show as `n/a` and the skill does not
claim detector convergence. Slop or Not Pro stops when the on-device AI detector score and
readability target converge, or returns the best measured iteration after the
cap.

## Languages

Agentic Humanizer supports English, Spanish, German, Italian, Swedish, Danish,
and Norwegian Bokmal, plus Norwegian Nynorsk for tells. It detects the source
language, confirms it in the interview, loads that language's AI-tell catalogue,
and measures readability with the language's native formula (Flesch-Kincaid for
English, Wiener Sachtextformel for German, Flesch-Szigriszt for Spanish, Gulpease
for Italian, LIX for the Nordic languages). The on-device AI detector is English
only, so other languages show the AI score as `n/a`; with Slop or Not Pro the
loop then converges on the reading-level band, and the no-Slop core workflow runs
all five passes and selects by quality, the same as English.

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

Direct skill installs and non-plugin clients invoke:

```text
/agentic-humanizer
```

## Usage

```text
/agentic-humanizer
[paste your AI-generated text here]
```

Use a voice sample for one call:

```text
/agentic-humanizer voice=/path/to/sample.txt [paste]
```

Use saved preferences without another interview:

```text
/agentic-humanizer skip-interview [paste]
```

## Inline Overrides

```text
/agentic-humanizer dialect=us grade=8 tone=casual length=±10 threshold=20 max=7 [paste]
```

Available flags:

| Flag | Effect |
|---|---|
| `language=<code>` | Set the target language (for example `language=de`). Without `variant=`, uses that language's default variant from the registry, or `other:<code>` for an unsupported language. |
| `variant=<spec>` | Set the variant (for example `variant=de-AT`). Without `language=`, the base language is inferred from the variant's BCP-47 prefix (for example `variant=de-AT` -> `language=de`). |
| `dialect=us` or `dialect=uk` | Legacy English alias for `variant=en-US` or `variant=en-GB`. |
| `grade=N` | Set the target Flesch-Kincaid grade (English only). |
| `level=<band>` | Set the reading-level band for any language (`elementary` to `graduate`). |
| `tone=casual`, `tone=professional`, or `tone=academic` | Set the rewrite tone. |
| `length=±10`, `length=exp`, or `length=trim` | Keep length close, allow expansion, or allow trimming. |
| `threshold=N` | Override the Slop or Not Pro AI-score target. |
| `max=N` | Override the Slop or Not Pro measured-iteration cap. |
| `voice=/path/to/file.txt` | Use a writing sample for this run. |
| `voice=off` or `voice-skip` | Skip voice matching. |
| `skip-interview` | Use saved preferences, or defaults in the detected language. |

## Local Files

Agentic Humanizer stores preferences and optional voice data under:

```text
~/.agentic-humanizer/
```

That directory can contain:

- `profile.json`
- `voice.txt`
- `voice-fingerprint.json`

Manage them with:

```text
/agentic-humanizer show profile
/agentic-humanizer reset
/agentic-humanizer set language=de variant=de-AT level=high_school tone=casual length=±10
/agentic-humanizer show voice
/agentic-humanizer reset voice
/agentic-humanizer set voice=/path/to/file.txt
```

## Related Slop Or Not Tools

The broader `slopornot` plugin bundle includes local Mac tools for:

- AI text detection
- AI image detection
- readability analysis
- Text Cleanup
- raw image scoring
- Pro status checks

Use `slop-check` for one-shot local analysis. Use `agentic-humanizer` for
rewriting. Slop or Not makes the rewrite measurable, but it is not required
for the rewrite workflow or voice matching.
