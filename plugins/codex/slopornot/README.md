# SlopOrNot Codex Plugin

This plugin packages SlopOrNot skills for Codex. SlopOrNot lets Codex,
Claude, Hermes Agent, OpenClaw, and other agents call a local AI text detector,
AI image detector, readability analyzer, and text cleanup tool on your Mac.
This release includes two skills: `agentic-humanizer` and `slop-check`.

## Install

```bash
codex plugin marketplace add numen-tech/slopornot
```

Then run `codex`, open `/plugins`, switch to the `slopornot` marketplace, and
choose `Install plugin`.

## Use

Ask Codex to use one of the bundled skills, or invoke the skill command if
your Codex surface exposes plugin skill commands:

```text
/agentic-humanizer
/slop-check
```

Use `agentic-humanizer` to rewrite AI-generated text in a scored loop. Use
`slop-check` to run one-shot local AI text detection, AI image detection,
Flesch-Kincaid readability scoring, text cleanup, raw image scoring, or a
Pro status check.

`agentic-humanizer` needs Slop or Not Pro for the full on-device detection
loop. Without Pro, it falls back to a single-pass rewrite. `slop-check`
needs Pro for detection, readability, cleanup, and image scoring.

See [skills/agentic-humanizer/SKILL.md](skills/agentic-humanizer/SKILL.md)
and [skills/slop-check/SKILL.md](skills/slop-check/SKILL.md).
