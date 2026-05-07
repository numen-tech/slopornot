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
4. **Conventional Commits**: `type(scope): subject`. Common scopes: `harnesses`, `references`, `docs`, `ci`, `chore`. Subject is imperative, lowercase, no trailing period.
5. **Keep `SKILL.md` and `README.md` in sync** when you change a runtime constant (`AI_THRESHOLD`, `MAX_ITER`, grade tolerance), the interview shape, the output format, or the inline-override grammar. Stale runtime docs mislead users.
6. **Don't add new per-iteration strategies that replace the 5-iteration schedule.** New strategies must compose with it. Open an issue first.
7. **Harness-specific instructions stay in `harnesses/<name>.md`.** Don't sprinkle "Claude Code users…" / "Codex users…" through the top-level SKILL.md.

## Smoke test

```text
/agentic-humanizer
<paste contents of examples/sample-ai-text.md>
```

Expect convergence by iteration 3 or 4 on the sample fixture. Output structure must match `SKILL.md` § Step 5.

## Out of scope

- Adding new detectors. The loop is intentionally Slop or Not Pro only.
- Cloud-detector benchmarking (GPTZero, Originality, Pangram). README § "Will it bypass…" is the canonical answer.
- Voice-calibration mode. Tracked under Roadmap; needs design before code.
