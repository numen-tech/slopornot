# SlopOrNot Claude Code Plugin

This plugin packages SlopOrNot skills for Claude Code. SlopOrNot lets Claude,
Codex, Hermes Agent, OpenClaw, and other agents call a local AI text detector,
AI image detector, readability analyzer, and text cleanup tool on your Mac.
This release includes two skills: `agentic-humanizer` and `slop-check`.

## Install

```text
/plugin marketplace add numen-tech/slopornot
/plugin install slopornot@slopornot
```

## Use

Claude Code namespaces plugin skills by plugin name. Run:

```text
/slopornot:agentic-humanizer
/slopornot:slop-check
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
