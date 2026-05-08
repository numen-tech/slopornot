# Changelog

All notable changes to Agentic Humanizer are documented here. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- `AGENTS.md` agent guide for contributors, with `CLAUDE.md` symlinked to it.
- Saved-preferences profile at `~/.agentic-humanizer/profile.json`. After
  the first interview the skill offers to remember your answers; subsequent
  runs skip the interview silently. Manage via `/agentic-humanizer show profile`,
  `/agentic-humanizer reset`, and `/agentic-humanizer set dialect=... grade=... tone=... length=...`.
- README explanation of what Flesch-Kincaid reading level means, with a link
  to the Wikipedia overview.
- Optional voice matching. Drop a writing sample at
  `~/.agentic-humanizer/voice.txt` or pass `voice=/path/to/file.txt` for one
  call. The skill extracts a cached stylometric fingerprint and applies it
  inside Iteration 2 (tone) and Iteration 5 (concrete phrasing). The
  interview offers to capture a sample on first run with a Yes / No /
  Never-ask-again gate.
- New inline flags: `voice=/path/to/file.txt`, `voice=off`, and
  `voice-skip` (alias for `voice=off`).
- New profile subcommands: `/agentic-humanizer show voice`,
  `/agentic-humanizer reset voice`, and
  `/agentic-humanizer set voice=/path/to/file.txt`.
- New reference doc `references/voice-fingerprint.md` covers the
  extraction prompt, fingerprint schema, cache invalidation rules,
  required-field list, privacy posture, and the Iteration 2 and
  Iteration 5 injection contracts.
- Profile schema bumped to version 2. Version 1 profiles still load;
  missing voice fields default to safe values.
- Output footer adds a `_Voice matched from <path>_` line when voice
  matching ran successfully, or a `_Voice extraction failed_` line with
  reset instructions when it did not.

### Changed

- README and `references/slop-cli-setup.md` now document the `slop status`
  field as `pro` (renamed from the legacy `premium`). The runtime probe
  was already robust because it calls `detect_text` directly, so neither
  CLI nor MCP behavior changes.

## [0.1.0] (2026-05-07)

Initial release. Forked from
[`blader/humanizer`](https://github.com/blader/humanizer) by Siqi Chen.

### Added

- `SKILL.md` orchestrating harness detection, Slop or Not Pro probe,
  4-question interview, and 5-iteration rewrite loop.
- Harness routing files for Claude Code, Codex CLI, Cursor, Gemini CLI,
  OpenCode, and a generic plain-text fallback.
- `references/patterns.md` (29 AI-tells from upstream, attributed).
- `references/per-iteration-strategies.md` (per-iteration cookbook).
- `references/slop-cli-setup.md` and `references/slop-mcp-setup.md`
  (install guides).
- `examples/sample-ai-text.md` smoke-test fixture.
- GitHub Actions CI for markdownlint, frontmatter validation, and
  relative-link checking.
