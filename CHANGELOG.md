# Changelog

All notable changes to SlopOrNot are documented here. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Claude Desktop bundle under `claude-skills/`. A stripped, Desktop-only
  build of `agentic-humanizer` with no harness routing: it runs a built-in
  interview using Claude Desktop's `ask_user_input_v0` prompt, one question
  at a time, and uses a Slop or Not MCP connector when one is attached
  (otherwise the unscored core workflow). It never invokes a local Slop CLI:
  the Desktop sandbox cannot reach the user's machine, so MCP is the only
  Pro backend. The bundle is sandbox-aware: it does not read or write
  `~/.agentic-humanizer/`, captures voice samples by paste rather than file
  path, and keeps any approved fingerprint in memory for one run only.
  `ask_user_input_v0` is declared in `allowed-tools` and called with the
  proper `questions:` array shape, with reading-level bands collapsed to
  four contiguous options so each question stays within the option cap.
  `make -C claude-skills` builds a shippable
  `agentic-humanizer-desktop.zip` a non-technical user can upload via
  Settings, Capabilities, Skills.
- New `slop-check` skill: a self-contained, one-shot router for Slop or Not
  Pro's on-device tools. Detects AI text or images, scores readability
  (Flesch-Kincaid), cleans AI artifacts, returns raw OmniAID scores when
  explicitly requested, and reports Pro status with a Pro-gated proof probe.
  Tries the MCP backend
  first, falls back to the `slop` CLI, and uses the app-bundle binary when
  `slop` is missing from PATH. No interview and no harness routing files;
  works uniformly across Claude Code, Codex, Cursor, Gemini CLI, and
  OpenCode. Invoke as `/slop-check` (or
  `/slopornot:slop-check` under the Claude Code plugin). Bundled
  references `skills/slop-check/references/slop-tools.md` and
  `skills/slop-check/references/slop-setup.md` pack the full CLI and MCP
  surface.
- Dedicated `skills/slop-check/README.md` for on-device AI detector, AI image
  detector, readability, cleanup, and Pro status usage and search indexing.
- Plugin packaging now syncs self-contained skills wholesale into both
  plugin payloads via `scripts/sync-plugins.mjs`, validated by
  `scripts/check-plugin-packaging.mjs`.
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
- New reference doc `skills/agentic-humanizer/references/voice-fingerprint.md` covers the
  extraction prompt, fingerprint schema, cache invalidation rules,
  required-field list, privacy posture, and the Iteration 2 and
  Iteration 5 injection contracts.
- Profile schema bumped to version 2. Version 1 profiles still load;
  missing voice fields default to safe values.
- Output footer adds a `_Voice matched from <path>_` line when voice
  matching ran successfully, or a `_Voice extraction failed_` line with
  reset instructions when it did not.
- Codex and Claude Code plugin packaging under the `slopornot` plugin name,
  with marketplace metadata and synced `agentic-humanizer` skill payloads.
- Plugin packaging validation via `scripts/sync-plugins.mjs --check` and
  `scripts/check-plugin-packaging.mjs`.
- Dedicated `skills/agentic-humanizer/README.md` for Agentic Humanizer usage
  and search indexing.

### Changed

- The `agentic-humanizer` runtime moved from the repo root into
  `skills/agentic-humanizer/` (`SKILL.md`, `harnesses/`, `references/`,
  `examples/`), so both shipped skills are now uniformly self-contained under
  `skills/`. Direct-install instructions changed accordingly: clone the repo
  and copy the `skills/<name>/` directories into your harness skill folder.
  Existing bare-clone installs (repo cloned directly onto the skill directory)
  must re-install.
- `agentic-humanizer` now runs the full 5-pass humanization workflow without
  Slop or Not installed. Slop or Not Pro is now an enhancement for local AI
  scoring, Flesch-Kincaid readability, Text Cleanup, and cleanup stats instead
  of a prerequisite for the main workflow.
- Voice matching now explicitly works both without Slop and with Slop or Not
  Pro.
- Slop or Not Pro humanization now runs Text Cleanup before the baseline and
  after the selected final draft, then surfaces the cleanup counts in the
  final output without exposing MCP or CLI backend labels.
- `slop-check` user-facing result blocks no longer include MCP or CLI backend
  labels.
- Output wording for runs without Slop or Not Pro now avoids mode-like labels
  and keeps the upsell focused on on-device AI detector scoring, readability,
  Text Cleanup, and cleanup stats.
- README, plugin README, and contributor docs now highlight that Agentic
  Humanizer does not need Slop or Not for core rewriting or voice matching.
- README and `references/slop-cli-setup.md` now document the `slop status`
  field as `pro` (renamed from the legacy `premium`). The runtime probe
  was already robust because it calls `detect_text` directly, so neither
  CLI nor MCP behavior changes.
- The project repository moved from `thilak-rao/agentic-humanizer` to
  `numen-tech/slopornot`. Runtime identifiers remain `agentic-humanizer`,
  `/agentic-humanizer`, and `~/.agentic-humanizer/`.
- README and plugin metadata now describe SlopOrNot as local Mac tooling for
  AI text detection, AI image detection, readability analysis, text cleanup,
  and humanization across Claude, Codex, OpenClaw, Hermes Agent, and other
  agents.
- README, skill metadata, and plugin marketplace copy now target Hermes Agent
  and OpenClaw alongside Claude and Codex for AI humanizer and local AI
  detector discovery.
- Slop CLI and MCP docs now reflect the verified Slop or Not Pro 1.0.9 JSON
  shapes, including MCP `score`, CLI `detection.result._0`, CLI
  `detection.resultFewSentences._0`, and readability score arrays.
- The skill description no longer lists host harness names (the skill is
  harness-agnostic and the names carried no trigger value); it still triggers
  on `/agentic-humanizer` and "humanize text using on-device AI detection".
- README now documents the non-interactive `claude plugin install
  slopornot@slopornot` form alongside the in-session slash commands.
- README now carries the single source credit in Credits & License, and the
  standalone attribution file was removed.
- Claude marketplace metadata now lists `Numen Technologies` as the owner and
  author.

### Fixed

- Interview no longer drops the custom dialect string when both Q1 is
  `Other` and Q5 is `Yes`. The Other-dialect turn is now collected before
  the voice-sample prompt across the structured-input harnesses
  (claude-code, codex, cursor, gemini-cli, opencode) and the Claude
  Desktop bundle, so the resolved `dialect` is never empty for that user
  segment. The generic plain-text harness already serializes the
  Other-dialect prompt at parse time and was not changed.
- Claude Desktop Agentic Humanizer now allowlists the Slop or Not MCP tools
  it calls for Pro scoring, readability, and Text Cleanup.
- The shared voice-fingerprint reference now states that the Claude Desktop
  bundle keeps pasted voice samples and fingerprints in memory only, with no
  `~/.agentic-humanizer/` disk cache.
- Agentic Humanizer's CLI Text Cleanup instructions now pipe the selected
  source or final text into `slop cleanup --json`, so CLI-only Pro runs do
  not receive an empty `cleanedText` result.
- Direct skill reinstall commands now remove the old `agentic-humanizer` and
  `slop-check` directories before copying, which prevents nested
  `agentic-humanizer/agentic-humanizer` installs.
- Generic harness voice-fingerprint validation now points malformed
  fingerprints to the Step 7 output footer instead of the obsolete Step 5
  probe section.
- `slop-check` README now documents the CLI-first backend order for local
  image checks and the app-bundle CLI fallback for non-image operations.
- `slop-check` now defaults image requests to `detect_image` so skill output
  matches the app's image check. It uses `score_image` only for explicit raw
  OmniAID score requests.
- `slop-check` now prefers the app-bundle CLI for local image detection and
  raw OmniAID image scoring, using MCP image tools only when CLI execution is
  unavailable.
- CLI docs now include `slop score-image --json` and its `rawSlopScore`
  output.
- Harness voice-sample prompts now point to `SKILL.md` Step 4 instead of the
  obsolete voice-step reference.
- `Run zizmor` now reports on every PR so the required status check does
  not remain pending when non-workflow files change.
- Codex plugin install docs now use the current flow: add the marketplace,
  then install from the Codex `/plugins` browser.
- Slop MCP setup now documents all six exposed tools, including `score_image`.
- High-school readability options now match the actual grade 10 target window
  by labeling it as Grade 9-11. The adjacent College option now spans Grade
  12-15 (target grade 13, was 14) so Grade 12 still has a covered band; the
  reading-level options are contiguous again across every harness.
- Saved-preferences copy no longer implies the optional voice question can
  never appear after saving the four rewrite preferences.

## [0.1.0] (2026-05-07)

Initial release.

### Added

- `SKILL.md` orchestrating harness detection, Slop or Not Pro probe,
  4-question interview, and 5-iteration rewrite loop.
- Harness routing files for Claude Code, Codex CLI, Cursor, Gemini CLI,
  OpenCode, and a generic plain-text fallback.
- `references/patterns.md` (29 AI-tells, attributed).
- `references/per-iteration-strategies.md` (per-iteration cookbook).
- `references/slop-cli-setup.md` and `references/slop-mcp-setup.md`
  (install guides).
- `examples/sample-ai-text.md` smoke-test fixture.
- GitHub Actions CI for markdownlint, frontmatter validation, and
  relative-link checking.
