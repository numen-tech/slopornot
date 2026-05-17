# SlopOrNot: AI humanizer and local AI detector for Claude, Codex, Hermes Agent, and OpenClaw

SlopOrNot is a plugin bundle for AI agents that need local AI detection and
humanization on a Mac. Claude, Codex, Hermes Agent, OpenClaw, OpenCode,
Cursor, Gemini CLI, and other agents can call Slop or Not Pro's local AI text
detector, AI image detector, readability analyzer, and text cleanup tool
through the `slop` CLI or `slop mcp`.

The bundle ships two skills. `agentic-humanizer` rewrites AI-generated text
in a scored loop; each iteration uses Slop or Not Pro's on-device AI text
detector and Flesch-Kincaid readability analyzer. `slop-check` is a
one-shot router for the same on-device tools: ask whether text or an image
is AI-generated, score readability, or clean AI artifacts, and get a clear
verdict back with no interview and no loop. Detection stays local; only the
`agentic-humanizer` rewrite runs wherever your AI assistant runs.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## What is this?

Agentic Humanizer is an AI humanizer skill. You paste AI-generated text into
your AI assistant, and the skill rewrites it iteratively until two targets are
met:

1. The output's AI-generation probability falls below 40% per Slop or
   Not's on-device detector.
2. The [Flesch-Kincaid reading level](https://en.wikipedia.org/wiki/Flesch%E2%80%93Kincaid_readability_tests)
   is within ±1 grade of the target you pick (Elementary, Middle, High
   school, College, or Graduate). Flesch-Kincaid is a standard readability
   formula that maps text to a US school grade level based on average
   sentence length and syllables per word: shorter sentences and simpler
   words mean a lower grade. Picking "High school" tells the loop to aim
   for grade 9-11 prose.

It is not a one-shot rewriter. It is an agentic loop: detect, rewrite,
re-detect, repeat, up to 5 iterations with a different strategy on each
pass (pattern surgery, dialect + tone, grade gap, clean + targeted,
emergency surgery).

If you do not have Slop or Not Pro installed, the skill still humanizes
in a single pass using the 29-pattern rewrite playbook and points you to the
download.

## How the detection loop works

```text
You paste text.

Skill probes for Slop or Not Pro (MCP first, CLI second).
Skill asks 4 questions: dialect, reading level, tone, length.
Optional: skill asks whether to mimic your writing sample.

Iteration 0   baseline       detect_text + analyze_readability
Iteration 1   pattern surgery (top-5 of the 29 AI-tells)
Iteration 2   dialect + tone (US/UK spellings, casual/pro/academic)
Iteration 3   grade gap      (close the Flesch-Kincaid distance)
Iteration 4   clean + targeted (clean_text + residual signal)
Iteration 5   emergency surgery (sentence shapes, broken rule-of-three)

Stop when AI score ≤ 40% AND |grade - target| ≤ 1
   OR after iteration 5.
```

Tools the loop uses: `detect_text`, `analyze_readability`, `clean_text`
(MCP) or `slop text`, `slop readability`, `slop cleanup` (CLI). Both run
on-device on Apple silicon. Your text is not uploaded to any server for
the *detection* step. Rewriting still runs in your AI assistant, which
may be cloud or local depending on which one you use.

Slop or Not Pro also exposes local AI image detection through the same Mac app,
CLI, and MCP server. The `agentic-humanizer` skill focuses on text rewrites;
the `slop-check` skill uses the same install for local AI text detection, AI
image detection, readability scoring, text cleanup, raw image scores, and Pro
status checks.

## Slop Check

`slop-check` is the fast path when you do not want a rewrite. It routes one
request to the right Slop or Not Pro tool and reports a verdict:

- AI text detection (verdict, probability, readability)
- AI image detection plus the raw OmniAID image score
- Flesch-Kincaid readability scoring
- Text cleanup (zero-width characters, homoglyphs, fancy punctuation)
- Setup and Pro status check, verified with a Pro-gated probe

It tries the SlopOrNot MCP server first, falls back to the `slop` CLI, and
if `slop` is not on PATH it uses the app-bundle binary directly when Slop
or Not is installed. It never blocks on a question: if you do not name an
operation it assumes AI-detection and says so.

```text
/slop-check is this AI? <paste text>
/slop-check what reading grade is draft.md
/slop-check is this image AI? ~/Desktop/art.png
/slop-check clean the invisible characters out of this: <paste text>
```

Under the Claude Code plugin, use `/slopornot:slop-check`. Full guide:
[`skills/slop-check/README.md`](skills/slop-check/README.md).

## Install

### Recommended: plugins

Codex:

```bash
codex plugin marketplace add numen-tech/slopornot
```

Then run `codex`, open `/plugins`, switch to the `slopornot` marketplace, and
choose `Install plugin`. Current OpenAI Codex docs install marketplace plugins
through the plugin browser; `codex-cli 0.130.0` does not expose a separate
`codex plugin install` command.

Claude Code:

```text
/plugin marketplace add numen-tech/slopornot
/plugin install slopornot@slopornot
```

For a non-interactive setup (CI, dotfiles), the install step also has a CLI
form (the marketplace must still be added from an interactive session first):

```bash
claude plugin install slopornot@slopornot
```

Claude Code namespaces plugin skills by plugin name, so use
`/slopornot:agentic-humanizer` there. Direct skill installs and other harnesses
still use `/agentic-humanizer`.

### Fallback: direct skill install

Use this path for clients that do not support plugins yet, including current
Hermes Agent and OpenClaw setups that load skills from a configured local
skills directory.

For Claude Code, Cursor, or Windsurf:

```bash
npx skills add numen-tech/slopornot
```

For Codex CLI, Gemini CLI, or OpenCode, clone into the harness's skill
directory directly:

```bash
# Codex CLI
mkdir -p ~/.codex/skills && \
  git clone https://github.com/numen-tech/slopornot ~/.codex/skills/agentic-humanizer

# Gemini CLI
mkdir -p ~/.gemini/skills && \
  git clone https://github.com/numen-tech/slopornot ~/.gemini/skills/agentic-humanizer

# OpenCode (if not running via skills.sh)
mkdir -p ~/.config/opencode/skills && \
  git clone https://github.com/numen-tech/slopornot ~/.config/opencode/skills/agentic-humanizer
```

After cloning, restart your harness so the skill is discovered.

## Setup Slop or Not Pro

The agentic loop is gated behind Slop or Not Pro for Mac, which ships
the `slop` CLI and `slop mcp` MCP server.

1. Install Slop or Not for Mac: <https://slopornot.ai/download>
2. Open the app and unlock Pro from Settings → Subscription.
3. Open Settings, then Command Line in Slop or Not for the current CLI
   setup command. You can also call the bundled binary directly:

   ```bash
   "/Applications/Slop Or Not.app/Contents/MacOS/slop" status --json
   ```

4. Optionally register `slop mcp` with your AI client. See
   [`references/slop-mcp-setup.md`](references/slop-mcp-setup.md) for
   per-harness configuration snippets.

Verify:

```bash
slop status --json
```

Should print `{"pro": true, ...}` on recent builds (older builds use the
legacy `"premium": true` field). If the value is `false`, finish step 2.

## Usage

For the full Agentic Humanizer guide, see
[`skills/agentic-humanizer/README.md`](skills/agentic-humanizer/README.md).

```text
/agentic-humanizer
[paste your AI-generated text here]
```

For Claude Code plugin installs, use:

```text
/slopornot:agentic-humanizer
[paste your AI-generated text here]
```

The skill asks four quick questions, plus an optional voice question when
no saved sample exists, then runs the loop and returns:

```markdown
## Humanized text
<the rewritten text>

## Loop history
| Iter | AI score | Grade | Strategy           |
|------|----------|-------|--------------------|
| 0    |  92%     | 11.4  | baseline           |
| 1    |  71%     | 10.8  | pattern surgery    |
| 2    |  48%     | 10.4  | dialect + tone     |
| 3    |  27%     |  9.7  | grade gap          |
✓ Converged at iter 3.

## Highest-impact edits
- ...
```

When voice matching is active, the output ends with a footer line like
`_Voice matched from ~/.agentic-humanizer/voice.txt (fingerprint cached 2026-05-08)._`

### Inline overrides

Skip the interview by passing flags directly:

```text
/agentic-humanizer dialect=us grade=8 tone=casual length=±10 threshold=20 max=7 [paste]
```

Or just skip the interview and use defaults (American · High school ·
Professional · ±10%):

```text
/agentic-humanizer skip-interview [paste]
```

Available override flags:

| Flag | Effect |
|---|---|
| `dialect=us` or `dialect=uk` | Set the English variant for this call. |
| `grade=N` | Set the target Flesch-Kincaid grade for this call. |
| `tone=casual`, `tone=professional`, or `tone=academic` | Set the tone for this call. |
| `length=±10`, `length=exp`, or `length=trim` | Keep length close, allow expansion, or allow trimming. |
| `threshold=N` | Override the AI-score target. |
| `max=N` | Override the 5-iteration cap. |
| `voice=/path/to/file.txt` | Use this voice sample for this call only. |
| `voice=off` | Skip voice matching for this call. |
| `voice-skip` | Alias for `voice=off`. |
| `skip-interview` | Use the saved profile if present, otherwise use defaults. |

### Voice matching

Voice matching lets the rewrite mimic a sample of your own writing. It
extracts a compact fingerprint once, caches it at
`~/.agentic-humanizer/voice-fingerprint.json`, and uses that fingerprint
inside Iteration 2 for register and Iteration 5 for concrete phrasing. It
does not replace the 5-iteration schedule.

To bootstrap it, say yes to the optional interview question and paste
200+ words when asked. You can also drop a file at
`~/.agentic-humanizer/voice.txt`, or pass
`voice=/path/to/file.txt` inline for one run. The minimum sample is 50
words, 200+ is recommended, and extraction uses the first 3000 words.

Manage the saved voice with:

```text
/agentic-humanizer show voice
/agentic-humanizer reset voice
/agentic-humanizer set voice=/path/to/file.txt
```

The sample and fingerprint cache live under `~/.agentic-humanizer/`.
The skill reads the sample from disk on each run. Fingerprint extraction
runs through your current AI assistant, so privacy follows that assistant's
local or cloud setup.

This flow is inspired by Grammarly's custom voice interaction, where the
Humanizer asks for a 200-word sample. Expect register, contractions,
sentence rhythm, and a few signature phrasing habits to shift. It does not
fully clone every idiosyncrasy of your style.

### Save your preferences once

After the first interview, the skill offers to save your four answers
(dialect, reading level, tone, length) to `~/.agentic-humanizer/profile.json`.
Say yes and the four rewrite-preference questions will be skipped on that
machine. The optional voice question can still appear later unless you save a
voice sample or choose `Never ask again`. Inline overrides still work for
one-off changes without touching the saved profile.

```text
/agentic-humanizer show profile     # print the saved profile
/agentic-humanizer reset            # delete the saved profile
/agentic-humanizer set dialect=uk grade=10 tone=casual length=±10
                                    # write a profile without the interview
```

The profile lives at `~/.agentic-humanizer/profile.json` as plain JSON.
Edit it directly if you prefer.

## What Agentic Humanizer adds

Agentic Humanizer adds four things on top:

- **Iterative scoring loop.** Each rewrite is measured by Slop or Not
  Pro's on-device detector and readability analyzer, so you can see the
  loop converging from 92% → 71% → 48% → 27% AI score across iterations.
- **Different strategy per iteration.** Five strategies in a fixed
  schedule, not the same edit twice. The schedule is documented in
  [`references/per-iteration-strategies.md`](references/per-iteration-strategies.md).
- **Pre-loop interview.** Four questions (dialect, reading level, tone,
  length) so the rewrite targets a specific reader, not a generic one.
- **Optional voice matching.** A cached stylometric fingerprint can steer
  register and concrete phrasing toward a writing sample you provide.

The 29-pattern catalogue lives in
[`references/patterns.md`](references/patterns.md).

## Does it work against GPTZero / ZeroGPT / Pangram / Originality.ai?

The loop is designed against Slop or Not's on-device detector. Slop or
Not reports 95% accuracy on AI text, 100% detection for watermarked
C2PA/IPTC images, and 90% accuracy on other AI-generated images in internal
tests, with the caveat that results can vary as models and evasion methods
change.

We do not benchmark against external detectors. Cross-detector
generalization is real but not guaranteed. If your goal is bypassing a
specific competitor detector, this skill is not the right tool for that
job.

## Why Slop or Not specifically?

- **On-device.** Detection runs on the Apple Neural Engine. Your text
  never leaves your machine for the *detection* step.
- **No word-count limits.** Most cloud detectors meter usage. Slop or
  Not has no per-document word cap; the free tier limits *number* of
  daily checks instead.
- **Pro tier is one-time-or-subscription.** A Lifetime purchase removes
  the daily check limit and unlocks the `slop` CLI and `slop mcp` MCP
  server that this skill uses.

For the full feature surface, see <https://slopornot.ai>.

## Roadmap

- Multi-language readability in `slop-check`, extending its current
  Flesch-Kincaid scoring beyond English to the other languages Slop or Not
  supports.
- `agentic-imagegen`, an agentic image generation skill based on OpenAI's
  imagegen workflow.
- Additional harnesses (AiderDesk, Continue, Roo Code).
- Optional second-detector cross-check (when Slop or Not adds an MCP
  client for external detectors).
- Multi-voice profiles for different writing contexts.

Open an issue if you want a specific harness or feature prioritized.

## Credits & License

The 29-pattern rewrite playbook is from
[blader/humanizer](https://github.com/blader/humanizer). It is used under the
MIT License.

SlopOrNot is licensed under the [MIT License](LICENSE).

The agentic detection loop, harness routing, interview, and per-iteration
strategy schedule are part of this repository. Slop or Not is a separate Mac
app from Numen Technologies; see <https://slopornot.ai>.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). New harness routing files
welcome. PRs that change the 29-pattern catalogue should sync from
the licensed source material rather than diverging.
