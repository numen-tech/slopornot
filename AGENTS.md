# SlopOrNot: agent guide

Brief for AI coding agents (Claude Code, Codex, Cursor, Gemini CLI, Aider) editing this repo. The runtime skill itself is `skills/agentic-humanizer/SKILL.md`; this file is for agents working *on* the repo, not running the skill.

## What this repo is

SlopOrNot is a plugin bundle for assistant workflows built around Slop or Not.
It ships two skills. `agentic-humanizer` runs a full 5-pass humanization
workflow with saved preferences and optional voice matching. It works without
Slop or Not; Slop or Not Pro only adds on-device AI detector scoring,
readability checks, Text Cleanup before and after humanization, and cleanup
stats. `slop-check` is a
self-contained one-shot router for the same on-device tools (text and image
detection, readability, cleanup, status) with no interview and no harness
routing files.

## Layout

| Path | Role |
|---|---|
| `skills/agentic-humanizer/SKILL.md` | Self-contained `agentic-humanizer` orchestrator. Steps 1-7 (harness detect, profile commands, preferences, voice, optional Slop probe, loop, output). |
| `skills/agentic-humanizer/harnesses/{claude-code,codex,cursor,gemini-cli,opencode,generic}.md` | Per-harness interview protocols. Edit only the file for the harness you're targeting. |
| `skills/agentic-humanizer/references/patterns.md` | 30-pattern rewrite vocabulary. Local divergence is out of scope. |
| `skills/agentic-humanizer/references/supplemental-ai-tells.md` | SlopOrNot-authored supplemental AI-tell checks inspired by Wikipedia's field guide. |
| `skills/agentic-humanizer/references/per-iteration-strategies.md` | The 5-iteration cookbook for Core mode and Slop or Not Pro, plus mid-flight Pro-gate fallback. |
| `skills/agentic-humanizer/references/voice-fingerprint.md` | Voice sample policy, fingerprint schema, extraction prompt, cache rules, and loop injection contracts. |
| `skills/agentic-humanizer/references/slop-{cli,mcp}-setup.md` | User-facing install guides. |
| `skills/agentic-humanizer/examples/sample-ai-text.md` | Smoke-test fixture. |
| `skills/agentic-humanizer/README.md` | Dedicated Agentic Humanizer README for users and search indexing. |
| `skills/slop-check/SKILL.md` | Self-contained `slop-check` orchestrator. Steps 1-5 (identify op, resolve backend MCP/CLI/app-bundle fallback, run, format, fallback). |
| `skills/slop-check/references/slop-tools.md` | Full CLI + MCP tool surface for `slop-check`: params, flags, JSON field paths, score normalization, Pro-gating. |
| `skills/slop-check/references/slop-setup.md` | `slop-check` install, Pro unlock, app-bundle fallback, MCP/CLI registration. |
| `skills/slop-check/README.md` | Dedicated Slop Check README for users and search indexing. |
| `claude-skills/agentic-humanizer/SKILL.md` | Hand-authored Claude Desktop variant (no harness routing; built-in `ask_user_input_v0` interview). Canonical source for the Desktop build. |
| `claude-skills/agentic-humanizer/README.md` | Hand-authored Claude Desktop install/use guide. |
| `claude-skills/agentic-humanizer/{references,examples}/` | Copied verbatim from `skills/agentic-humanizer/` by `make -C claude-skills build`. Do not hand-edit. |
| `claude-skills/Makefile` | Builds and zips the Claude Desktop bundle (`build`, `zip`, `check`, `clean`). |
| `plugins/codex/slopornot/` | Generated Codex plugin payload. Do not edit synced skill files here by hand. |
| `plugins/claude/slopornot/` | Generated Claude Code plugin payload. Do not edit synced skill files here by hand. |
| `.agents/plugins/marketplace.json` | Codex repo marketplace for the `slopornot` plugin. |
| `.claude-plugin/marketplace.json` | Claude Code marketplace for the `slopornot` plugin. |
| `scripts/check-{frontmatter,links}.mjs` | Lint scripts run by CI. |
| `scripts/sync-plugins.mjs` | Copies canonical runtime files into plugin payloads, with `--check` drift detection. |
| `scripts/check-plugin-packaging.mjs` | Validates plugin manifests, marketplaces, required files, and sync state. |

## Critical rules

1. **Pre-PR gate**, these commands must pass:

   ```bash
   npx markdownlint-cli2@0.18.1 "**/*.md" "#node_modules" "#WARP.md"
   node scripts/check-frontmatter.mjs
   node scripts/check-links.mjs
   node scripts/sync-plugins.mjs --check
   node scripts/check-plugin-packaging.mjs
   make -C claude-skills check
   ```

   GitHub also requires `lint` and `Run zizmor` on every PR. Do not add
   PR path filters to required workflows unless the repository ruleset is
   updated in the same change.

2. **No em-dashes in `README.md`, `SKILL.md`, `CHANGELOG.md`, `AGENTS.md`, commits, tag annotations, or release notes.** Use commas, colons, or parentheses. The user-facing surface of a humanizer can't credibly ship em-dash-laden copy. (Inherited em-dashes in `skills/agentic-humanizer/references/` and `skills/agentic-humanizer/harnesses/` predate the rule and are getting cleaned up incrementally; do not introduce new ones.)
3. **Don't edit `skills/agentic-humanizer/references/patterns.md` for local taste.** The 30-pattern catalogue is licensed source material. Only refresh it intentionally with attribution and license notices checked.
4. **Conventional Commits are required, not optional.** Format: `type(scope): subject`. Subject is imperative, lowercase, no trailing period. Allowed types and their changelog mapping:

   | Type | Changelog section | Use for |
   |---|---|---|
   | `feat` | Added | new behavior, new harness, new reference doc |
   | `fix` | Fixed | bug fixes in scripts, lint rules, runtime logic |
   | `perf` | Changed | measurable speed or token wins |
   | `refactor` | Changed | restructuring without behavior change |
   | `docs` | Changed (or omit) | `README`, `AGENTS.md`, `CHANGELOG`, `CONTRIBUTING` edits |
   | `build` / `ci` | (omit) | workflow, lint config, release tooling |
   | `test` | (omit) | adding or fixing tests and fixtures |
   | `chore` | (omit) | housekeeping, dependency bumps |
   | `revert` | matches reverted type | use `revert: <original subject>` |

   Use `!` after the type/scope or a `BREAKING CHANGE:` footer for breaking changes (these always land in changelog under "Changed" with a "BREAKING" prefix). Common scopes: `harnesses`, `references`, `docs`, `ci`, `chore`, `scripts`. The changelog generator reads commit history, so a malformed subject silently drops the change from the next release notes.

5. **Doc-sync is part of the change, not a follow-up.** Any PR that changes runtime behavior MUST update every affected surface in the same commit (or stack of commits). Use this matrix:

   | What you changed | Update these in the same PR |
   |---|---|
   | Runtime constant (`AI_THRESHOLD`, `MAX_ITER`, grade tolerance) | `skills/agentic-humanizer/SKILL.md`, `README.md`, `CHANGELOG.md` (Unreleased) |
   | Interview shape, question count, or order | `skills/agentic-humanizer/SKILL.md`, `README.md`, every `skills/agentic-humanizer/harnesses/*.md`, `CHANGELOG.md` |
   | Output format (Step 7 structure, fields, ordering) | `skills/agentic-humanizer/SKILL.md`, `README.md`, `CHANGELOG.md` |
   | Inline-override grammar or saved-profile schema | `skills/agentic-humanizer/SKILL.md`, `README.md`, `CHANGELOG.md` |
   | Voice fingerprint behavior, schema, or extraction prompt | `skills/agentic-humanizer/SKILL.md`, `README.md`, `skills/agentic-humanizer/references/voice-fingerprint.md`, `skills/agentic-humanizer/references/per-iteration-strategies.md`, `CHANGELOG.md` |
   | New or renamed reference doc under `skills/agentic-humanizer/references/` | `skills/agentic-humanizer/SKILL.md` (links), `AGENTS.md` (Layout table), `scripts/check-links.mjs` if it hardcodes paths |
   | Harness routing (added, removed, renamed harness) | `skills/agentic-humanizer/SKILL.md` Step 1, `skills/agentic-humanizer/harnesses/<name>.md`, `README.md`, `CHANGELOG.md` |
   | Lint rules, CI gates, release scripts | `AGENTS.md` (Critical rules § 1), `CONTRIBUTING.md`, `CHANGELOG.md` |
   | Slop CLI / MCP install steps | `skills/agentic-humanizer/references/slop-cli-setup.md` or `skills/agentic-humanizer/references/slop-mcp-setup.md`, `README.md`, `CHANGELOG.md` |
   | Anything the Desktop fork mirrors (interview shape, output format, runtime constants, inline-override grammar, voice behavior) | `claude-skills/agentic-humanizer/SKILL.md` and `claude-skills/agentic-humanizer/README.md` (hand-authored; port the change, keep harness routing out), then `make -C claude-skills` |

   If you can't tell whether a doc is affected, grep it for the symbol you changed. Stale runtime docs mislead users and corrupt the changelog.

6. **Every user-visible change appends to `CHANGELOG.md` § `[Unreleased]`** under the matching Keep-a-Changelog heading (`Added`, `Changed`, `Fixed`, `Removed`, `Deprecated`, `Security`). Internal-only changes (`ci`, `build`, `test`, `chore`) skip the changelog. The release script promotes `[Unreleased]` to a versioned section; missing entries can't be recovered after the tag.
7. **Don't add new per-iteration strategies that replace the 5-iteration schedule.** New strategies must compose with it. Open an issue first.
8. **Harness-specific instructions stay in `skills/agentic-humanizer/harnesses/<name>.md`.** Don't sprinkle "Claude Code users…" / "Codex users…" through `skills/agentic-humanizer/SKILL.md`.
9. **Plugin payloads are generated distribution artifacts.** Both skills are
   self-contained: edit canonical runtime files under
   `skills/agentic-humanizer/` or `skills/slop-check/`, then run
   `node scripts/sync-plugins.mjs`. Never hand-edit files under
   `plugins/*/slopornot/skills/`. Manifest-only changes may be made directly
   inside plugin folders.

   The Claude Desktop bundle is a separate generated artifact. Its `SKILL.md`
   and `README.md` under `claude-skills/agentic-humanizer/` are hand-authored
   and intentionally diverge from canonical (no harness routing). Its
   `references/` and `examples/` are copied verbatim by
   `make -C claude-skills build`; never hand-edit those copies. Run
   `make -C claude-skills check` before a PR to catch drift, and `make -C
   claude-skills` to rebuild the shippable zip.

## Smoke test

```text
/agentic-humanizer
<paste contents of skills/agentic-humanizer/examples/sample-ai-text.md>
```

Expect convergence by iteration 3 or 4 on the sample fixture. Output
structure must match `skills/agentic-humanizer/SKILL.md` Step 7.
With Slop or Not unavailable, expect the same five rewrite passes with `n/a`
score and grade values, no detector-convergence claim, and no Text Cleanup
summary.
