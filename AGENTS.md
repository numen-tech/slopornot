# Agentic Humanizer: agent guide

Brief for AI coding agents (Claude Code, Codex, Cursor, Gemini CLI, Aider) editing this repo. The runtime skill itself is `SKILL.md`; this file is for agents working *on* the repo, not running the skill.

## What this repo is

A community fork of [`blader/humanizer`](https://github.com/blader/humanizer) that wraps the upstream 29-pattern rewrite playbook in an iterative AI-detection loop scored by Slop or Not Pro's on-device CLI / MCP. Single skill, no build step, all Markdown.

## Layout

| Path | Role |
|---|---|
| `SKILL.md` | Skill orchestrator. Steps 1–5 (harness detect → Pro probe → interview → loop → output). |
| `harnesses/{claude-code,codex,cursor,gemini-cli,opencode,generic}.md` | Per-harness interview protocols. Edit only the file for the harness you're targeting. |
| `references/patterns.md` | 29-pattern rewrite vocabulary, **synced verbatim from upstream**. Local divergence is out of scope. |
| `references/per-iteration-strategies.md` | The 5-iteration cookbook + mid-flight Pro-gate fallback. |
| `references/voice-fingerprint.md` | Voice sample policy, fingerprint schema, extraction prompt, cache rules, and loop injection contracts. |
| `references/slop-{cli,mcp}-setup.md` | User-facing install guides. |
| `examples/sample-ai-text.md` | Smoke-test fixture. |
| `scripts/check-{frontmatter,links}.mjs` | Lint scripts run by CI. |

## Critical rules

1. **Pre-PR gate**, these three must pass:

   ```bash
   npx markdownlint-cli2@0.18.1 "**/*.md" "#node_modules" "#WARP.md"
   node scripts/check-frontmatter.mjs
   node scripts/check-links.mjs
   ```

2. **No em-dashes in `README.md`, `SKILL.md`, `CHANGELOG.md`, `AGENTS.md`, commits, tag annotations, or release notes.** Use commas, colons, or parentheses. The user-facing surface of a humanizer can't credibly ship em-dash-laden copy. (Inherited em-dashes in `references/` and `harnesses/` predate the rule and are getting cleaned up incrementally; do not introduce new ones.)
3. **Don't edit `references/patterns.md` for local taste.** Only sync from upstream `blader/humanizer`. The 29 patterns are upstream's contribution.
4. **Conventional Commits are required, not optional.** Format: `type(scope): subject`. Subject is imperative, lowercase, no trailing period. Allowed types and their changelog mapping:

   | Type | Changelog section | Use for |
   |---|---|---|
   | `feat` | Added | new behavior, new harness, new reference doc |
   | `fix` | Fixed | bug fixes in scripts, lint rules, runtime logic |
   | `perf` | Changed | measurable speed or token wins |
   | `refactor` | Changed | restructuring without behavior change |
   | `docs` | Changed (or omit) | `README`, `AGENTS.md`, `CHANGELOG`, `NOTICE`, `CONTRIBUTING` edits |
   | `build` / `ci` | (omit) | workflow, lint config, release tooling |
   | `test` | (omit) | adding or fixing tests and fixtures |
   | `chore` | (omit) | housekeeping, dependency bumps |
   | `revert` | matches reverted type | use `revert: <original subject>` |

   Use `!` after the type/scope or a `BREAKING CHANGE:` footer for breaking changes (these always land in changelog under "Changed" with a "BREAKING" prefix). Common scopes: `harnesses`, `references`, `docs`, `ci`, `chore`, `scripts`. The changelog generator reads commit history, so a malformed subject silently drops the change from the next release notes.

5. **Doc-sync is part of the change, not a follow-up.** Any PR that changes runtime behavior MUST update every affected surface in the same commit (or stack of commits). Use this matrix:

   | What you changed | Update these in the same PR |
   |---|---|
   | Runtime constant (`AI_THRESHOLD`, `MAX_ITER`, grade tolerance) | `SKILL.md`, `README.md`, `CHANGELOG.md` (Unreleased) |
   | Interview shape, question count, or order | `SKILL.md`, `README.md`, every `harnesses/*.md`, `CHANGELOG.md` |
   | Output format (Step 5 structure, fields, ordering) | `SKILL.md`, `README.md`, `CHANGELOG.md` |
   | Inline-override grammar or saved-profile schema | `SKILL.md`, `README.md`, `CHANGELOG.md` |
   | Voice fingerprint behavior, schema, or extraction prompt | `SKILL.md`, `README.md`, `references/voice-fingerprint.md`, `references/per-iteration-strategies.md`, `CHANGELOG.md` |
   | New or renamed reference doc under `references/` | `SKILL.md` (links), `AGENTS.md` (Layout table), `scripts/check-links.mjs` if it hardcodes paths |
   | Harness routing (added, removed, renamed harness) | `SKILL.md` Step 1, `harnesses/<name>.md`, `README.md`, `CHANGELOG.md` |
   | Lint rules, CI gates, release scripts | `AGENTS.md` (Critical rules § 1), `CONTRIBUTING.md`, `CHANGELOG.md` |
   | Slop CLI / MCP install steps | `references/slop-cli-setup.md` or `references/slop-mcp-setup.md`, `README.md`, `CHANGELOG.md` |

   If you can't tell whether a doc is affected, grep it for the symbol you changed. Stale runtime docs mislead users and corrupt the changelog.

6. **Every user-visible change appends to `CHANGELOG.md` § `[Unreleased]`** under the matching Keep-a-Changelog heading (`Added`, `Changed`, `Fixed`, `Removed`, `Deprecated`, `Security`). Internal-only changes (`ci`, `build`, `test`, `chore`) skip the changelog. The release script promotes `[Unreleased]` to a versioned section; missing entries can't be recovered after the tag.
7. **Don't add new per-iteration strategies that replace the 5-iteration schedule.** New strategies must compose with it. Open an issue first.
8. **Harness-specific instructions stay in `harnesses/<name>.md`.** Don't sprinkle "Claude Code users…" / "Codex users…" through the top-level `SKILL.md`.

## Smoke test

```text
/agentic-humanizer
<paste contents of examples/sample-ai-text.md>
```

Expect convergence by iteration 3 or 4 on the sample fixture. Output structure must match `SKILL.md` § Step 5.
