# Contributing

Thanks for your interest in SlopOrNot.

## Scope of contributions

- New harness routing files (`skills/agentic-humanizer/harnesses/<name>.md`)
  are welcome.
- New per-iteration strategies are welcome, but they should compose with
  the existing 5-iteration schedule, not replace it. Open an issue first
  to discuss.
- Edits to `skills/agentic-humanizer/references/patterns.md` only when
  intentionally refreshing the licensed source material. Local divergence on
  the 30 patterns is out of scope.
- Plugin payload files under `plugins/codex/slopornot/skills/` and
  `plugins/claude/slopornot/skills/` are generated from the canonical skill
  files under `skills/agentic-humanizer/` and `skills/slop-check/`. Edit the
  canonical files, then run `node scripts/sync-plugins.mjs`.
- The Claude Desktop bundle under `claude-skills/` is a separate generated
  artifact. Its `SKILL.md` and `README.md` are hand-authored and
  intentionally diverge (no harness routing); its `references/` and
  `examples/` are copied verbatim by `make -C claude-skills build` and must
  not be hand-edited. Rebuild the zip with `make -C claude-skills`.

## Pre-PR checklist

```bash
npx markdownlint-cli2@0.18.1 "**/*.md" "#node_modules" "#WARP.md"
node scripts/check-frontmatter.mjs
node scripts/check-links.mjs
node scripts/sync-plugins.mjs --check
node scripts/check-plugin-packaging.mjs
make -C claude-skills check
```

All six must pass.

GitHub also requires `lint` and `Run zizmor` on every PR. Required
workflows should not use PR path filters unless the repository ruleset
changes in the same PR.

## Smoke test

```text
/agentic-humanizer
<paste contents of skills/agentic-humanizer/examples/sample-ai-text.md>
```

Verify the output structure matches `skills/agentic-humanizer/SKILL.md`
§ Step 7. Expect the loop
to reach iteration 3 or 4 before converging on the sample fixture.

## Commit conventions

Conventional Commits: `type(scope): subject`. Common types:

- `feat(harnesses)`: new harness routing
- `feat(references)`: new or updated reference doc
- `docs`: README, CHANGELOG edits
- `ci`: workflow and lint config changes
- `chore`: housekeeping

## Code of conduct

Be respectful. Issues that argue about academic-integrity ethics or
school-policy enforcement will be closed without engagement, since this
repository is a tool, not a debate forum. Report abuse via GitHub.
