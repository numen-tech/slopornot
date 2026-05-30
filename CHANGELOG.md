# Changelog

All notable changes to SlopOrNot are documented here. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Multilingual readability for Spanish, German, Italian, Swedish, Danish, and
  Norwegian Bokmal. The agentic-humanizer loop loads the native readability
  formula for the detected language (Flesch-Kincaid for English, Wiener
  Sachtextformel for German, Flesch-Szigriszt for Spanish, Gulpease for Italian,
  LIX for the Nordic languages), reads whatever score `kind` the app returns,
  and maps it to a reading-level band.
- Per-language AI-tell catalogues under `references/ai-tells/` for Spanish
  (`es`), German (`de`), Italian (`it`), Swedish (`sv`), Danish (`da`), and
  Norwegian (`no`, covering both Bokmal and Nynorsk), each with that language's
  characteristic LLM filler and localized structural tells plus CC BY-SA
  attribution.
- Central registry `references/multilingual.md`: supported languages, BCP-47
  variants, the readability formula per language, the reading-level band
  mapping, and code-normalization rules (Norwegian Bokmal normalizes to `nb`).
- German smoke-test fixture `examples/sample-ai-text-de.md`.
- Inline overrides `language=<code>`, `variant=<spec>`, and `level=<band>` for
  non-English rewrites and non-English reading-level control.

### Changed

- Interview Q1 generalized from "Which English variant?" to a language-confirm
  and variant step. The skill detects the source language from the pasted text,
  confirms it, and offers that language's variants from the registry. The
  interview stays four questions.
- Profile schema bumped to version 3: adds `language` (default `en`) and
  `variant` (replacing `dialect`), and stores a `reading_level` band alongside
  `target_grade`. Old profiles without `language` load as English with the
  legacy `dialect` mapped to `variant`, and are rewritten as v3 on the next
  save. The `dialect` inline override stays as an English alias.
- Non-English AI score is reported as `n/a` with a caveat. The on-device
  detector returns `kind: "not_english"` for non-English input, so the loop
  converges on the reading-level band rather than the AI threshold.
- `slop-check` labels readability by the returned formula instead of hardcoding
  Flesch-Kincaid, shows the detected language and band, and handles
  `unsupported_language` and short-input warnings gracefully.
- `slop-check` handles `detect_text` returning `kind: "not_english"`: it reports
  "AI text detection is English-only; no score available for <language>" and
  still shows the readability block, never inventing a score.
- `slop-check` and the humanizer normalize Norwegian Bokmal to
  `language_code: "nb"` on tool calls; `no` and `nn` return
  `unsupported_language`.

### Fixed

- The final post-loop scoring pass now follows the same per-language rule as the
  iterations: English scores `detect_text` and `analyze_readability`, supported
  non-English scores readability only, and Nynorsk or unsupported languages skip
  both. Earlier the finalization ran `detect_text` and `analyze_readability`
  unconditionally, so non-English and Nynorsk runs could surface a misleading
  `not_english` or `unsupported_language` result after the loop.
- Inline `language=` without `variant=` now resolves to that language's default
  variant from the registry instead of inheriting the saved profile's variant,
  so an English profile plus `language=de` no longer produces the inconsistent
  `de` with `en-US` pair.
- Legacy `dialect`/`target_grade` profiles are upgraded to the v3 schema before
  the missing-rewrite-keys check, so returning users with an older profile keep
  their preferences instead of being pushed back through the interview.
- The per-iteration cookbook no longer points unsupported languages at a
  non-existent `references/ai-tells/<code>.md`. Nynorsk and unsupported
  languages load `references/supplemental-ai-tells.md` only (plus the Nynorsk
  section of `ai-tells/no.md` for `nn`), matching `SKILL.md` Step 6.
- Option-capped harnesses (Claude Code, Cursor, Gemini CLI, OpenCode) now
  collapse College and Graduate into one "College or professional" reading-level
  option so the question stays within the four-option cap; Graduate remains
  reachable via inline `level=graduate` or `grade=N`. Plain-text (generic) and
  free-text (Codex) harnesses, which have no option cap, keep all five bands.
- Every harness now follows Step 3's ambiguous-language branch, asking for the
  language before its variant when the source text is short or mixed, instead of
  asserting a detected language.
- `slop-check` readability handles the CLI's camelCase warning objects
  (`unsupportedLanguage`, `insufficientText`) alongside the MCP colon-tagged
  strings, so CLI-only runs surface the unsupported-language and short-input
  messages.
- Inline `tone`, `length`, and `level` overrides now survive a saved-profile
  language mismatch. When the detected language differs from the saved profile,
  the detection-wins path keeps explicit inline overrides and falls back to
  profile values only for keys not set inline.
- `/agentic-humanizer set language=<code>` (or legacy `dialect=`) without an
  explicit `variant` now resets the saved `variant` to that language's registry
  default instead of persisting a stale pair such as `de` with `en-US`.
- `slop-check` bands English readability from the Flesch-Kincaid grade and shows
  Reading Ease as a supplemental value, instead of risking a reading-level band
  computed from the inverted Reading Ease scale.
- `slop-check` routes native readability formula names (`LIX`, `Wiener
  Sachtextformel`, `Gulpease`, `Flesch-Szigriszt`, `Reading Ease`) to the
  readability operation instead of falling through to AI text detection.
- The Claude Desktop bundle's ambiguous-language prompt now stays within the
  four-option `ask_user_input_v0` cap: it offers the three most likely languages
  plus "Other", instead of listing every supported language in one call.
- Option-capped harnesses (Claude Code, Cursor, Gemini CLI, OpenCode) now cap the
  ambiguous-language question at the three most likely languages plus "Other
  (different language)", matching the Desktop bundle, instead of listing all
  seven supported languages past the four-option cap. Generic and Codex, which
  have no option cap, still list them all.
- English `level=<band>` without `grade=` now derives `target_grade` from the
  band midpoint (graduate maps to 17), so the English convergence check
  `|grade - target_grade| <= 1` is always defined. Non-English profiles store
  `target_grade: null`.
- Added a deterministic band-assignment rule to `references/multilingual.md` and
  the `slop-check` tool surface: a value on a shared band boundary belongs to the
  higher-numeric band, and a grade score that lands in a gap takes the nearest
  band midpoint (ties to the higher band), so reading-level labels and band-range
  termination are unambiguous.
- Corrected the `slop-check` skill description, which still advertised
  Flesch-Kincaid readability only, to name each language's native formula.
- Removed the ambiguous "we" row (`vi` in both standards) from the Norwegian
  Nynorsk vs Bokmal contrast table in `references/ai-tells/no.md`, which could
  flag legitimate Nynorsk `vi` as Bokmal contamination.
- The per-iteration cookbook restates the non-English tell-file substitution at
  each step that names `references/patterns.md`, and scopes the grade-tolerance
  note to English (non-English grade scales use the target band midpoint).
- Clarified in the READMEs that non-English reading-level band convergence
  applies with Slop or Not Pro; the core workflow runs all five passes and
  selects by quality, the same as English. The output Language line uses the
  registry display name "Flesch-Kincaid grade".
- Inline `variant=` matching the detected language is now honored on the
  saved-profile language-mismatch path, instead of being overridden by the
  registry default variant. This completes the inline-override preservation that
  previously covered only `tone`, `length`, and `level`.
- The English `target_grade` is now derived from the reading-level band midpoint
  when a detected English run overrides a saved non-English profile (which stores
  `target_grade: null`), so the English convergence check
  `|grade - target_grade| <= 1` is always defined after a language switch.
- The Slop MCP and CLI setup guides (`references/slop-mcp-setup.md`,
  `references/slop-cli-setup.md`) now describe native per-language readability
  instead of Flesch-Kincaid only, matching the runtime's multilingual scoring
  path.
- `/agentic-humanizer set level=<band>` (or `grade=N`) now keeps the saved
  English `target_grade` and `reading_level` in sync, and writes
  `target_grade: null` when the saved language becomes non-English. The
  profile-management path stops before Step 3's derivation, so previously
  changing only the level left a stale `target_grade` that future
  profile-loaded English runs terminated against.
- `skip-interview` with no saved profile now keeps the detected source language
  and its registry default variant, defaulting only the reading level, tone, and
  length. It falls back to English/en-US only when detection is ambiguous or no
  text was pasted, so a non-English draft no longer takes the English variant,
  tell catalogue, and detector path. The Claude Desktop bundle gets the same
  detected-language fallback.
- An explicit inline `language=` now wins over detection on the saved-profile
  language-mismatch path, instead of the branch always running in the detected
  language. Correcting a misdetection with `language=<code>` while a different
  saved profile exists now loads that language's tells and readability rules.
- Choosing `Never ask again` for the voice prompt no longer writes a complete
  profile full of default rewrite settings when the user has no saved profile
  (or declined to save one). The skill now persists a voice-only record holding
  just `voice_skip`, so the next run still asks the language, tone, and
  reading-level questions instead of silently skipping the interview.
- Supported non-English Pro runs can again take the Iteration 0 baseline
  short-circuit. The cookbook required both the AI and grade targets to pass,
  which a non-English run (readability only, AI score `n/a`) could never satisfy;
  it now short-circuits on readability band membership alone, matching the
  non-English termination rule.
- German (and other grade-scale) runs targeting `level=graduate` no longer stop
  one band early. The open-ended Graduate band terminates on range membership
  (`score >=` its lower edge, de Wiener `15`) instead of the symmetric
  `|score - band_midpoint| <= 1` tolerance, so a College-level Wiener score of
  `14` no longer satisfies a Graduate target.
- The one-call harnesses (Claude Code, Gemini CLI, OpenCode) now spell out that
  the ambiguous-language path is the one exception to the single
  `AskUserQuestion` call: a first call resolves the language, then a second
  carries the variant, reading-level, tone, length, and voice questions. The
  previous wording required exactly one call yet also told the agent to ask the
  language before building the variant question, which cannot both hold.
- The generic harness's token-reply parse fallback keeps the language already
  resolved for the run. After three unparseable replies it now defaults only the
  reading level, tone, and length (keeping a detected or chosen non-English
  language with its registry default variant) instead of hard-resetting to
  American English, which had dropped a German or Spanish user onto the English
  variant, tell, and detector path.

## [0.2.0] (2026-05-21)

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
- Supplemental AI-tell checks for `agentic-humanizer`, inspired by
  Wikipedia's AI-writing field guide, covering broadly reusable artifacts such
  as placeholders, markup leakage, citation leakage, correspondence wrappers,
  abrupt generation remnants, compliance claims, and style discontinuities.

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
