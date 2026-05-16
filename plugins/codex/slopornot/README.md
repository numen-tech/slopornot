# SlopOrNot Codex Plugin

This plugin packages SlopOrNot skills for Codex. SlopOrNot lets Codex,
Claude, Hermes Agent, OpenClaw, and other agents call a local AI text detector,
AI image detector, readability analyzer, and text cleanup tool on your Mac.
This release includes the `agentic-humanizer` skill.

## Install

```bash
codex plugin marketplace add numen-tech/slopornot
```

Then run `codex`, open `/plugins`, switch to the `slopornot` marketplace, and
choose `Install plugin`.

## Use

Ask Codex to use the `agentic-humanizer` skill, or invoke
`/agentic-humanizer` if your Codex surface exposes plugin skill commands.

The skill needs Slop or Not Pro for the full on-device detection loop. Without
Pro, it falls back to a single-pass rewrite.

See [skills/agentic-humanizer/SKILL.md](skills/agentic-humanizer/SKILL.md).
