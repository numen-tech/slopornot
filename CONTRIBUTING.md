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
  the 29 patterns is out of scope.
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
node scripts/check-versions.mjs
node --test scripts/*.test.mjs
make -C claude-skills check
```

All eight must pass. The relative-link check skips the docs/ planning tree,
whose design docs reference filenames in prose rather than as resolvable
links.

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

## Releasing

Releases are automated in two phases:

1. Run the "Prepare release" workflow (Actions > Prepare release > Run
   workflow) with the new version, for example `0.3.0`. It validates the
   version, promotes `CHANGELOG.md` `[Unreleased]` to a dated section,
   bumps every version field, regenerates the plugin payloads and Desktop
   bundle copies, and opens a `release/v0.3.0` PR.
2. Review and merge that PR. On merge, the publish workflow creates the
   annotated `v0.3.0` tag and a GitHub Release with the CHANGELOG section
   as notes, attaching `agentic-humanizer-desktop.zip` and
   `agentic-humanizer-chatgpt.zip`.

The prepare workflow requires the `RELEASE_APP_TOKEN` repository secret (a
GitHub App or fine-grained PAT with contents and pull-requests write; it
does not need to bypass branch protection). The release title defaults to
`v<version>`; edit the Release afterward to append a theme, matching
earlier releases.

## ChatGPT Skills upload

ChatGPT (Business, Enterprise, Edu, Teachers, and Healthcare plans; beta)
runs `agentic-humanizer` as an uploaded skill. Download
`agentic-humanizer-chatgpt.zip` from the latest GitHub Release, or build
it locally:

```bash
cd skills && zip -r ../agentic-humanizer-chatgpt.zip agentic-humanizer -x '*/.DS_Store'
```

Then in ChatGPT: Skills > New skill > Upload from your computer. Do not
upload `plugins/codex/slopornot/`; that is the Codex plugin payload, not
the raw skill. Skills do not sync across products, so a Codex install does
not carry over to ChatGPT. `slop-check` is not shipped this way because it
depends on local Pro tools ChatGPT cannot reach.

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
