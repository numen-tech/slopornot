# SlopOrNot Claude Code Plugin

This plugin packages SlopOrNot skills for Claude Code. SlopOrNot lets Claude,
Codex, Hermes Agent, OpenClaw, and other agents call a local AI text detector,
AI image detector, readability analyzer, and text cleanup tool on your Mac.
This release includes the `agentic-humanizer` skill.

## Install

```text
/plugin marketplace add numen-tech/slopornot
/plugin install slopornot@slopornot
```

## Use

Claude Code namespaces plugin skills by plugin name. Run:

```text
/slopornot:agentic-humanizer
```

The skill needs Slop or Not Pro for the full on-device detection loop. Without
Pro, it falls back to a single-pass rewrite.

See [skills/agentic-humanizer/SKILL.md](skills/agentic-humanizer/SKILL.md).
