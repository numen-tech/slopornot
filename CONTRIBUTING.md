# Contributing

Thanks for your interest in SlopOrNot.

## Scope of contributions

- New harness routing files (`harnesses/<name>.md`) are welcome.
- New per-iteration strategies are welcome, but they should compose with
  the existing 5-iteration schedule, not replace it. Open an issue first
  to discuss.
- Edits to `references/patterns.md` only when intentionally refreshing the
  licensed source material. Local divergence on the 29 patterns is out of
  scope.
- Plugin payload files under `plugins/codex/slopornot/skills/` and
  `plugins/claude/slopornot/skills/` are generated from the root skill files.
  Edit the root files, then run `node scripts/sync-plugins.mjs`.

## Pre-PR checklist

```bash
npx markdownlint-cli2@0.18.1 "**/*.md" "#node_modules" "#WARP.md"
node scripts/check-frontmatter.mjs
node scripts/check-links.mjs
node scripts/sync-plugins.mjs --check
node scripts/check-plugin-packaging.mjs
```

All five must pass.

GitHub also requires `lint` and `Run zizmor` on every PR. Required
workflows should not use PR path filters unless the repository ruleset
changes in the same PR.

## Smoke test

```text
/agentic-humanizer
<paste contents of examples/sample-ai-text.md>
```

Verify the output structure matches `SKILL.md` § Step 5. Expect the loop
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
