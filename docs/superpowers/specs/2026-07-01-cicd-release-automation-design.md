# CI/CD release automation + QC hardening

Design spec. Handover artifact for the agent implementing this on the
`ci/release-automation` branch as a standalone PR.

## Context

SlopOrNot ships through two distribution channels:

1. **Plugin marketplaces** (`.claude-plugin/marketplace.json`,
   `.agents/plugins/marketplace.json`) install from in-repo local paths
   (`./plugins/claude/slopornot`, `./plugins/codex/slopornot`). Publishing to
   these is implicit: whatever is on the ref users install from is live.
   `scripts/sync-plugins.mjs` keeps those payloads in sync with the canonical
   `skills/` sources.
2. **Claude Desktop bundle**: a zip (`agentic-humanizer-desktop.zip`) built by
   `make -C claude-skills` and attached to a GitHub Release as an asset. This
   is the *only* Desktop distribution channel. The `v0.2.0` release carries
   this zip (411 downloads at time of writing). The zip is not tracked in git.

Releases have been fully manual: promote `CHANGELOG.md` `[Unreleased]` to a
versioned section, create an annotated `vX.Y.Z` tag, create a GitHub Release,
and hand-build + upload the Desktop zip. Two consequences of the manual process
that this work fixes:

- **Stale Desktop zip.** After a feature merges to main, the published zip is
  not rebuilt, so Desktop users lag behind plugin/CLI users until someone
  manually rebuilds and re-uploads.
- **Unbumped version fields.** Six version fields still read `0.1.0` even
  though `v0.2.0` shipped. They are internally consistent with each other but
  never tracked the release tag.

### CI gap this work also closes

`AGENTS.md` Critical rules rule 1 lists six pre-PR gates. Today
`.github/workflows/lint-skill.yml` runs only three of them (markdownlint,
`check-frontmatter`, `check-links`). It does **not** run `sync-plugins --check`,
`check-plugin-packaging`, or `make -C claude-skills check`. A PR can therefore
merge green with drifted plugin payloads or a stale Desktop bundle.

### Version field inventory

Six hand-editable "source" version fields (all currently `0.1.0`):

- `skills/agentic-humanizer/SKILL.md` (frontmatter `version:`)
- `skills/slop-check/SKILL.md` (frontmatter `version:`)
- `claude-skills/agentic-humanizer/SKILL.md` (frontmatter `version:`, Desktop, hand-authored)
- `plugins/claude/slopornot/.claude-plugin/plugin.json` (`"version"`)
- `plugins/codex/slopornot/.codex-plugin/plugin.json` (`"version"`)
- `.claude-plugin/marketplace.json` (`plugins[0].version`)

Four generated copies follow automatically: `sync-plugins.mjs` copies each
`SKILL.md` wholesale into the plugin payloads, so the version frontmatter rides
along into `plugins/{claude,codex}/slopornot/skills/*/SKILL.md`. The three JSON
manifests are independent and hand-maintained (not touched by sync-plugins).
`.agents/plugins/marketplace.json` has no version field.

## Goals / non-goals

**Goals**

- One-click, reviewed, robust releases: promote the curated CHANGELOG, bump all
  version fields, tag, create the GitHub Release, and build + attach the
  Desktop zip.
- Close the CI quality gaps so drifted payloads or a stale Desktop bundle can
  no longer merge green.
- Add a version-consistency guard so the six source fields cannot drift apart.
- Add an advisory prompt-engineering review of changed prompt surfaces.

**Non-goals**

- Auto-computed versions. The maintainer chooses the version.
- Commit-generated changelog. The curated `[Unreleased]` prose is preserved;
  automation only promotes it.
- Any branch-protection bypass. Every released commit goes through a reviewed
  PR.
- Automating the plugin-marketplace channel beyond what `sync-plugins` already
  does. Merging to main is the publish for that channel.

## Architecture overview

```
QC (every PR):        lint-skill.yml (deterministic gates)  +  prompt-review.yml (advisory)

Release (2 phases):
  Phase 1 PREPARE  release-prepare.yml  [workflow_dispatch: version]
                     -> scripts/prepare-release.mjs
                     -> opens release/vX.Y.Z PR via GitHub App token
                     -> all QC gates run on the PR
                     -> maintainer reviews + merges

  Phase 2 PUBLISH  release-publish.yml  [on merge of release/v* PR]
                     -> create annotated tag vX.Y.Z
                     -> make -C claude-skills (build zip)
                     -> gh release create + upload zip
```

## Component 1 - QC hardening (`.github/workflows/lint-skill.yml`)

Extend the existing `lint` job with the missing deterministic gates. Order them
after the current three steps:

```yaml
- name: Plugin sync drift
  run: node scripts/sync-plugins.mjs --check
- name: Plugin packaging
  run: node scripts/check-plugin-packaging.mjs
- name: Packaging unit test
  run: node --test scripts/check-plugin-packaging.test.mjs
- name: Desktop bundle drift
  run: make -C claude-skills check
- name: Version consistency
  run: node scripts/check-versions.mjs
```

Notes for the implementer:

- `make` and `zip` are present on `ubuntu-latest`; no extra install needed for
  `make -C claude-skills check` (it only runs `diff -r`).
- Keep `permissions: contents: read` and `persist-credentials: false` as-is.
- Confirm the runner Node (24) runs `node --test` cleanly against
  `scripts/check-plugin-packaging.test.mjs`.

### New script: `scripts/check-versions.mjs`

- Reads the six source version fields listed in the inventory.
- Parses `SKILL.md` frontmatter `version:` and JSON `version` fields.
- Exits non-zero with a clear diff-style message if any two disagree.
- Exits zero when all six are equal.
- No dependency on git tags (unreleased work between releases keeps the fields
  at the last released version, which is valid).
- Style: match the existing `scripts/*.mjs` (Node ESM, no external deps,
  `process.exit(1)` on failure, human-readable output).

## Component 2 - Advisory prompt review (`.github/workflows/prompt-review.yml`)

New workflow mirroring `claude-code-review.yml` but focused on prompt quality.

- Trigger: `pull_request` types `[opened, synchronize, ready_for_review, reopened]`.
- Path filter so it only runs when prompt surfaces change:
  `**/SKILL.md`, `skills/agentic-humanizer/harnesses/**`,
  `skills/**/references/**`, `AGENTS.md`, `README.md`,
  `claude-skills/**/SKILL.md`.
- Uses `anthropics/claude-code-action@v1` with
  `claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}` (already
  configured for the existing review job).
- `prompt`: a prompt-wizard-oriented instruction to review the changed prompt
  files against Anthropic prompt-engineering best practices (clarity, role,
  structure, instruction consistency, stale references, doc-sync drift) and
  post findings as a PR review.
- **Advisory only.** Do not add it to the required-checks set. It posts a
  review; it never blocks merge.
- `permissions`: `contents: read`, `pull-requests: read`, `issues: read`,
  `id-token: write` (match the existing review job).

## Component 3 - Prepare release (`.github/workflows/release-prepare.yml`)

- Trigger: `workflow_dispatch` with input `version` (string, e.g. `0.3.0`).
- `permissions`: `contents: write` (push the release branch),
  `pull-requests: write` (open the PR). The PR must be opened with the GitHub
  App / PAT token (see Prerequisites) so downstream CI triggers.
- Steps:
  1. Checkout main.
  2. Validate input: strict semver `X.Y.Z`; strictly greater than the current
     value in the source fields; tag `vX.Y.Z` must not already exist; the
     `CHANGELOG.md` `[Unreleased]` section must be non-empty. Fail fast with a
     clear message otherwise.
  3. Run `node scripts/prepare-release.mjs <version>` (see below).
  4. Create branch `release/v<version>`, commit with
     `chore(release): prepare v<version>`, push.
  5. Open PR `release/v<version> -> main` using the App/PAT token. Title
     `chore(release): v<version>`; body links the promoted CHANGELOG section.

### New script: `scripts/prepare-release.mjs <version>`

Deterministic release-prep transform (no model use):

1. `CHANGELOG.md`: rename `## [Unreleased]` to `## [<version>] (<YYYY-MM-DD>)`
   and insert a fresh empty `## [Unreleased]` block above it (with the standard
   Keep-a-Changelog subsection scaffolding the repo uses). Date is UTC today.
2. Set `version` to `<version>` in all six source fields.
3. Run the existing propagation so generated copies and the Desktop bundle
   follow: `node scripts/sync-plugins.mjs` then `make -C claude-skills build`.
4. Leave the working tree staged-clean for the workflow to commit.

Implementer notes:

- Reuse the same frontmatter/JSON parsing approach as `check-versions.mjs`
  (share a small helper if it reduces duplication; do not over-abstract).
- The date must be deterministic within a run; read it once.
- Do not hand-edit generated files; always regenerate via the existing scripts
  so `sync-plugins --check` and `make check` stay green on the release PR.

## Component 4 - Publish (`.github/workflows/release-publish.yml`)

- Trigger: `pull_request` `closed` on base `main`, guarded by
  `if: github.event.pull_request.merged == true &&
  startsWith(github.event.pull_request.head.ref, 'release/v')`.
- `permissions`: `contents: write` (create tag + release).
- Steps:
  1. Checkout the merge commit on main.
  2. Derive `<version>` from the head branch name (`release/v<version>`).
  3. Create and push annotated tag `v<version>`.
  4. `make -C claude-skills` to build `agentic-humanizer-desktop.zip`.
  5. `gh release create v<version>` with:
     - title matching the repo's convention (see `v0.2.0` for tone),
     - notes = the promoted `## [<version>]` CHANGELOG section (extract with a
       small step or `awk`),
     - asset `claude-skills/agentic-humanizer-desktop.zip`.
  6. Uses `GITHUB_TOKEN`; no special credential needed to tag/release.

## Prerequisites (maintainer, one-time)

- **GitHub App or fine-grained PAT** stored as a repo secret (e.g.
  `RELEASE_APP_TOKEN`) used by `release-prepare.yml` to open the release PR.
  Rationale: a PR opened by the default `GITHUB_TOKEN` does not trigger other
  workflows (GitHub loop-prevention), so the QC gates would not run on the
  release PR. The App/PAT needs `contents: write` and `pull-requests: write`
  on this repo. It does **not** need to bypass branch protection.
- Confirm branch protection on `main` allows the `release/v*` PR to merge under
  the normal review rules (no new bypass required).

## Doc-sync required in the same PR

- `AGENTS.md` Critical rules rule 1: add `node scripts/check-versions.mjs` to the
  pre-PR gate list; note the new release workflows and the App/PAT secret.
- `CONTRIBUTING.md`: document the release process (run "Prepare release" with a
  version, review + merge the release PR, publish happens automatically).
- `AGENTS.md` Layout table and the doc-sync matrix: add the new scripts
  (`check-versions.mjs`, `prepare-release.mjs`) and workflows.
- `CHANGELOG.md` `[Unreleased]`: add entries under Added/Changed for the CI and
  release tooling (these are user-relevant for contributors; if the team treats
  pure `ci` as changelog-exempt per rule 6, keep it minimal or omit per that rule).

## Testing / verification

- **Scripts:** unit-test `check-versions.mjs` (equal -> pass; one field drifted
  -> fail) and `prepare-release.mjs` (fixture CHANGELOG + version files ->
  asserts promotion, reseeded `[Unreleased]`, all six fields bumped, generated
  copies synced). Follow the `node --test` pattern of the existing
  `check-plugin-packaging.test.mjs`.
- **Workflows:** validate YAML with the existing zizmor gate; dry-run
  `prepare-release.mjs` locally against a scratch checkout; verify the six
  pre-PR gates pass on this PR itself.
- **End-to-end (manual, after merge):** run "Prepare release" with a real next
  version, confirm the release PR opens with gates running, merge it, confirm
  the tag, GitHub Release, and attached zip appear.

## Risks / edge cases

- **First release after this lands** bumps the six fields from `0.1.0` to the
  chosen version, finally catching them up to the tag line. Decide the first
  target version (likely `0.3.0`, bundling merged-but-unreleased work: the
  multilingual PR #11 already on main plus the patterns PR #12 once merged).
- **Release PR gets extra commits** (e.g. a reviewer edit): publish derives the
  version from the branch name, so it stays correct as long as the branch name
  is untouched.
- **App/PAT expiry** (if PAT chosen): releases silently fail to open the PR.
  Prefer a GitHub App for longevity, or track PAT rotation.
- **`make -C claude-skills` needs the canonical references committed** on the
  release branch; `prepare-release.mjs` regenerates them, so ensure the commit
  includes those regenerated files.

## Handover notes

- Branch: `ci/release-automation` (off `origin/main`). Independent of PR #12.
  Intended merge order per the maintainer: this PR first, then PR #12.
- New files: `scripts/check-versions.mjs`, `scripts/prepare-release.mjs`,
  `scripts/*.test.mjs` for both, `.github/workflows/prompt-review.yml`,
  `.github/workflows/release-prepare.yml`, `.github/workflows/release-publish.yml`.
- Edited files: `.github/workflows/lint-skill.yml`, `AGENTS.md`,
  `CONTRIBUTING.md`, `CHANGELOG.md`.
- Keep all new user-facing doc edits em-dash-free per `AGENTS.md` Critical rules
  rule 2.
