# CI/CD release automation + QC hardening

Design spec. Handover artifact for the agent implementing this on the
`ci/release-automation` branch as a standalone PR.

## Context

SlopOrNot ships through three distribution channels:

1. **Plugin marketplaces** (`.claude-plugin/marketplace.json`,
   `.agents/plugins/marketplace.json`) install from in-repo local paths
   (`./plugins/claude/slopornot`, `./plugins/codex/slopornot`). Publishing to
   these is implicit: whatever is on the ref users install from is live.
   `scripts/sync-plugins.mjs` keeps those payloads in sync with the canonical
   `skills/` sources.
2. **Claude Desktop bundle**: a zip (`agentic-humanizer-claude-desktop.zip`) built by
   `make -C claude-skills` and attached to a GitHub Release as an asset. This
   is the *only* Desktop distribution channel. The `v0.2.0` release carries
   this zip (411 downloads at time of writing). The zip is not tracked in git.
3. **ChatGPT Skills bundle**: a zip (`agentic-humanizer-chatgpt.zip`) of the
   raw canonical `skills/agentic-humanizer/` folder, attached to the same GitHub
   Release as a second asset. The maintainer (or any user) downloads it and
   uploads it in ChatGPT via Skills > New skill > Upload from your computer.
   Unlike the Desktop bundle, this is not a hand-authored variant: it is the
   canonical skill zipped as-is, so ChatGPT runs it through the existing
   `generic` (plain-text) harness. ChatGPT Skills is a plan-gated beta
   (Business, Enterprise, Edu, Teachers, Healthcare) and does **not** sync
   across products, so a ChatGPT upload is independent of the Codex plugin. The
   zip is not tracked in git. Only `agentic-humanizer` ships this way;
   `slop-check` depends on local Pro tools ChatGPT cannot reach.

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

### Goals

- One-click, reviewed, robust releases: promote the curated CHANGELOG, bump all
  version fields, tag, create the GitHub Release, and build + attach both the
  Desktop and ChatGPT zips.
- Make ChatGPT an explicit, documented runtime for the core rewrite workflow
  (first-class but shallow): ship an uploadable zip and set expectations, without
  pretending to have local-agent parity.
- Close the CI quality gaps so drifted payloads or a stale Desktop bundle can
  no longer merge green.
- Add a version-consistency guard so the six source fields cannot drift apart.
- Add an advisory prompt-engineering review of changed prompt surfaces.

### Non-goals

- Auto-computed versions. The maintainer chooses the version.
- Commit-generated changelog. The curated `[Unreleased]` prose is preserved;
  automation only promotes it.
- Any branch-protection bypass. Every released commit goes through a reviewed
  PR.
- Automating the plugin-marketplace channel beyond what `sync-plugins` already
  does. Merging to main is the publish for that channel.

## Architecture overview

```text
QC (every PR):        lint-skill.yml (deterministic gates)  +  prompt-review.yml (advisory)

Release (2 phases):
  Phase 1 PREPARE  release-prepare.yml  [workflow_dispatch: version]
                     -> scripts/prepare-release.mjs
                     -> opens release/vX.Y.Z PR via GitHub App token
                     -> all QC gates run on the PR
                     -> maintainer reviews + merges

  Phase 2 PUBLISH  release-publish.yml  [on merge of release/v* PR]
                     -> create annotated tag vX.Y.Z
                     -> make -C claude-skills (build Desktop zip)
                     -> zip canonical skill -> agentic-humanizer-chatgpt.zip
                     -> gh release create + upload both zips
```

## Component 1 - QC hardening (`.github/workflows/lint-skill.yml`)

Extend the existing `lint` job with the missing deterministic gates. Order them
after the current three steps:

```yaml
- name: Plugin sync drift
  run: node scripts/sync-plugins.mjs --check
- name: Plugin packaging
  run: node scripts/check-plugin-packaging.mjs
- name: Unit tests
  run: node --test scripts/*.test.mjs
- name: Desktop bundle drift
  run: make -C claude-skills check
- name: Version consistency
  run: node scripts/check-versions.mjs
```

Notes for the implementer:

- `make` and `zip` are present on `ubuntu-latest`; no extra install needed for
  `make -C claude-skills check` (it only runs `diff -r`).
- Keep `permissions: contents: read` and `persist-credentials: false` as-is.
- The `scripts/*.test.mjs` glob discovers every test file, so the existing
  packaging test and the new `check-versions` / `prepare-release` tests all
  run without listing files one by one. Use the glob, not a bare directory
  argument (`node --test scripts/`): the bare-directory form is not a stable
  discovery root across Node versions (Node 26 treats it as a single module
  and fails with "Cannot find module"), whereas the shell-expanded glob
  reduces to explicit file paths that every Node version accepts.

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
  `pull-requests: write` (open the PR). Both the branch push and the PR
  creation must use the GitHub App / PAT token (see Prerequisites): check out
  with that token so the push carries it, because a PR opened (or a branch
  pushed) by the default `GITHUB_TOKEN` does not trigger downstream CI.
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
  1. Checkout `github.event.pull_request.merge_commit_sha` explicitly. On
     `closed` events the default checkout ref is the PR merge ref, which is
     unreliable after the merge.
  2. Derive `<version>` from the head branch name (`release/v<version>`).
  3. Create and push annotated tag `v<version>`.
  4. `make -C claude-skills` to build `agentic-humanizer-claude-desktop.zip`.
  5. Build `agentic-humanizer-chatgpt.zip` from the canonical skill (inline; see
     Component 5).
  6. `gh release create v<version>` with:
     - title `v<version>` (deterministic; the maintainer may edit the Release
       afterward to append a theme, matching the `v0.2.0` convention),
     - notes = the promoted `## [<version>]` CHANGELOG section (extract with a
       small step or `awk`),
     - assets `claude-skills/agentic-humanizer-claude-desktop.zip` and
       `agentic-humanizer-chatgpt.zip`.
  7. Uses `GITHUB_TOKEN`; no special credential needed to tag/release.

## Component 5 - ChatGPT Skills distribution

Adds ChatGPT as a supported runtime. Scope is deliberately shallow: ChatGPT is
a documented *generic* runtime, not a peer harness. The skill runs its core
5-pass rewrite there; on-device Slop or Not Pro scoring is unavailable unless
ChatGPT has an attached tool that can reach it.

### 5a - Publish the ChatGPT zip (`.github/workflows/release-publish.yml`)

Extend the publish job (Component 4) to also produce and attach the ChatGPT
bundle. No new script or Makefile: the bundle is the canonical skill zipped
as-is, so one inline step is enough.

```yaml
- name: Build ChatGPT skill zip
  run: cd skills && zip -r ../agentic-humanizer-chatgpt.zip agentic-humanizer -x '*/.DS_Store'
```

Then add `agentic-humanizer-chatgpt.zip` to the `gh release create` asset list
alongside the Desktop zip (Component 4 step 6). The zip built this way is a
single top-level `agentic-humanizer/` folder containing `SKILL.md`, `README.md`,
`harnesses/`, `references/`, and `examples/`, which is the exact structure
ChatGPT's Skills upload expects (one top-level folder, exactly one `SKILL.md`).

Implementer notes:

- `zip` is present on `ubuntu-latest`; no install needed.
- Because the SKILL.md `version:` frontmatter is already bumped by the merged
  release PR, the zip built at publish time carries the correct version.
- Do **not** add a drift/packaging CI gate for this zip. It has no committed
  copy to drift against (unlike the Desktop bundle), and its sources are already
  covered by `check-frontmatter.mjs` and `check-links.mjs` on `skills/`.

### 5b - Runtime notes (shallow, additive)

- `skills/agentic-humanizer/SKILL.md` Step 1: in the harness table, the
  "Anything else" / generic row should name ChatGPT Skills as a generic
  runtime, so it is an explicitly known surface rather than an unnamed fallback.
- `skills/agentic-humanizer/harnesses/generic.md`: add a short ChatGPT note:
  plain-text interview, pasted voice samples only, and no assumption of local
  files, shell, MCP, or durable profile storage. This is additive prose; it does
  not change the question set or order.
- **Do not** add `harnesses/chatgpt.md` (a wrapper that only duplicates
  `generic.md` is churn), and **do not** add `chatgpt` to the SKILL.md
  `compatibility:` frontmatter (that field lists peer harnesses with dedicated
  files; ChatGPT is intentionally treated as generic).

## Workflow hygiene (all new workflows)

`Run zizmor` is a required check, so every new workflow must pass it:

- Never interpolate `${{ ... }}` expressions directly into `run:` blocks.
  `inputs.version` (release-prepare) and
  `github.event.pull_request.head.ref` (release-publish) must be passed via
  `env:` and referenced as shell variables; zizmor's template-injection audit
  flags direct interpolation, and branch names are its canonical example.
- Pin all actions by full commit SHA with a version comment, matching
  `lint-skill.yml` and `zizmor.yml`.
- Set `persist-credentials: false` on every checkout except where a later
  step pushes with that checkout's token: the release-prepare checkout (pushes
  the release branch with the App/PAT token) and the release-publish checkout
  (pushes the tag with `GITHUB_TOKEN`).

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

- `AGENTS.md` Critical rules rule 1: add `node scripts/check-versions.mjs` and
  `node --test scripts/*.test.mjs` to the pre-PR gate list so the documented local gates
  match CI; note the new release workflows and the App/PAT secret.
- `CONTRIBUTING.md`: document the release process (run "Prepare release" with a
  version, review + merge the release PR, publish happens automatically).
- `AGENTS.md` Layout table and the doc-sync matrix: add the new scripts
  (`check-versions.mjs`, `prepare-release.mjs`) and workflows.
- `CHANGELOG.md` `[Unreleased]`: add entries under Added/Changed for the CI and
  release tooling (these are user-relevant for contributors; if the team treats
  pure `ci` as changelog-exempt per rule 6, keep it minimal or omit per that rule).
- **ChatGPT channel docs** (Component 5): document how to install the skill in
  ChatGPT in the same PR.
  - `README.md` (root) and `skills/agentic-humanizer/README.md`: add ChatGPT to
    the support/install matrix. State that ChatGPT runs the core 5-pass rewrite
    via the generic path, that Slop or Not Pro scoring is unavailable there, that
    it is a plan-gated beta, and that skills do not sync across products.
  - `CONTRIBUTING.md`: document the ChatGPT upload flow: download
    `agentic-humanizer-chatgpt.zip` from the Release (or build it locally with
    the Component 5a command), then ChatGPT > Skills > New skill > Upload from
    your computer. Include the caveat: do **not** upload `plugins/codex/slopornot/`
    (that is the Codex plugin payload, not the raw skill).
  - After editing `harnesses/generic.md`, run `node scripts/sync-plugins.mjs` so
    the plugin payloads pick up the change. The Desktop bundle is unaffected (it
    ships no `harnesses/`), so no `make -C claude-skills` rebuild is required for
    this note; the runtime change lives only in the canonical skill and its
    synced plugin copies.
  - `CHANGELOG.md` `[Unreleased]`: Added, ChatGPT Skills distribution and docs;
    Changed, generic harness now names ChatGPT as a supported runtime.

## Testing / verification

- **Scripts:** unit-test `check-versions.mjs` (equal -> pass; one field drifted
  -> fail) and `prepare-release.mjs` (fixture CHANGELOG + version files ->
  asserts promotion, reseeded `[Unreleased]`, all six fields bumped, generated
  copies synced). Follow the `node --test` pattern of the existing
  `check-plugin-packaging.test.mjs`.
- **Workflows:** validate YAML with the existing zizmor gate; dry-run
  `prepare-release.mjs` locally against a scratch checkout; verify the full
  pre-PR gate list (eight commands once `check-versions.mjs` and
  `node --test scripts/*.test.mjs` are added) passes on this PR itself.
- **ChatGPT zip:** confirm the Component 5a command produces a single top-level
  `agentic-humanizer/` folder containing `SKILL.md` (verify with `unzip -l`), and
  that it stays under ChatGPT's limits (50 MB zip, 500 files, 25 MB per
  uncompressed file). Current bundle is ~80 KB / 24 files / 38 KB largest file,
  so there is ample headroom.
- **End-to-end (manual, after merge):** run "Prepare release" with a real next
  version, confirm the release PR opens with gates running, merge it, confirm
  the tag, GitHub Release, and both attached zips appear.
- **ChatGPT upload (manual):** upload `agentic-humanizer-chatgpt.zip` in ChatGPT
  and confirm the scan accepts it. This is the check that resolves the
  frontmatter risk below.

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
- **Publish is not atomic.** If the publish job fails after the tag is pushed
  (e.g. release creation flakes), a naive re-run dies on "tag already exists".
  Make the steps re-run-safe: skip tag creation when the tag already points at
  the merge commit, and guard release creation with
  `gh release view v<version> || gh release create ...`.
- **ChatGPT frontmatter validation.** ChatGPT validates skill frontmatter
  against the Agent Skills spec. The skill carries a non-standard
  `compatibility:` field. If (and only if) upload fails on it, the publish step
  must strip that field from the zipped `SKILL.md` before packaging; this is the
  one transform that would justify diverging the ChatGPT zip from canonical.
  Confirm via the manual upload check before relying on the raw-zip path.
- **ChatGPT surface is degraded by design.** No local files, shell, MCP, or Pro
  scoring; core rewrite only. The generic-path note and README set this
  expectation so users are not surprised. Plan-gated beta and no cross-product
  sync compound this: a Codex install does not carry over to ChatGPT.

## Handover notes

- Branch: `ci/release-automation` (off `origin/main`). Independent of PR #12.
  Intended merge order per the maintainer: this PR first, then PR #12.
- New files: `scripts/check-versions.mjs`, `scripts/prepare-release.mjs`,
  `scripts/*.test.mjs` for both, `.github/workflows/prompt-review.yml`,
  `.github/workflows/release-prepare.yml`, `.github/workflows/release-publish.yml`.
- Edited files: `.github/workflows/lint-skill.yml`, `AGENTS.md`,
  `CONTRIBUTING.md`, `CHANGELOG.md`, `README.md`,
  `skills/agentic-humanizer/SKILL.md` (Step 1 note),
  `skills/agentic-humanizer/harnesses/generic.md` (ChatGPT note),
  `skills/agentic-humanizer/README.md`, plus the generated plugin copies that
  `node scripts/sync-plugins.mjs` updates from the edited `SKILL.md` and
  `generic.md`.
- Keep all new user-facing doc edits em-dash-free per `AGENTS.md` Critical rules
  rule 2.
