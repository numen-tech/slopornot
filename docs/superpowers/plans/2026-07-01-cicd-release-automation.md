# CI/CD Release Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two-phase automated releases (prepare PR, publish on merge) with all
pre-PR quality gates enforced in CI, a version-consistency guard, an advisory
prompt review, and a ChatGPT Skills distribution channel.

**Architecture:** Deterministic Node ESM scripts (`check-versions.mjs`,
`prepare-release.mjs`, shared `version-fields.mjs`) do all file transforms;
three new GitHub Actions workflows orchestrate them (`release-prepare.yml`
dispatch opens a release PR via an App/PAT token, `release-publish.yml` tags
and uploads zips on merge, `prompt-review.yml` posts advisory reviews). The
existing `lint-skill.yml` gains the five missing gates.

**Tech Stack:** Node 24 (ESM, `node:test`, no external deps), GitHub Actions,
GNU make, zip, gh CLI, awk.

**Source spec:** `docs/superpowers/specs/2026-07-01-cicd-release-automation-design.md`
(read it before starting a task if anything here seems ambiguous).

## Global Constraints

- No em-dashes in `README.md`, `SKILL.md`, `CHANGELOG.md`, `AGENTS.md`,
  `CONTRIBUTING.md`, commit messages, tag annotations, or release notes. Use
  commas, colons, or parentheses.
- Conventional Commits: `type(scope): subject`, imperative, lowercase, no
  trailing period.
- Scripts: Node ESM, no external dependencies, `process.exit(1)` on failure,
  human-readable `[FAIL]`/`[OK]` output (match `scripts/check-frontmatter.mjs`).
- Workflows: pin actions by full commit SHA with a version comment
  (`actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2`,
  `actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e # v6.4.0`);
  exception: `anthropics/claude-code-action@v1` matches the existing
  `claude-code-review.yml`. Never put `${{ }}` inside `run:` blocks; pass
  values via `env:`. Set `persist-credentials: false` on checkouts except in
  `release-prepare.yml` (pushes the branch with the App token) and
  `release-publish.yml` (pushes the tag with `GITHUB_TOKEN`).
- Every edited or created `.md` file must pass
  `npx markdownlint-cli2@0.18.1 "**/*.md" "#node_modules" "#WARP.md"`.
- Never hand-edit `plugins/*/slopornot/skills/**` or
  `claude-skills/agentic-humanizer/{references,examples}/**`; regenerate with
  `node scripts/sync-plugins.mjs` and `make -C claude-skills build`.
- This PR does NOT bump any version; all six source fields stay `0.1.0`.
- Work happens on the existing `ci/release-automation` branch.

---

### Task 1: Version-consistency check (`check-versions.mjs`)

**Files:**

- Create: `scripts/version-fields.mjs`
- Create: `scripts/check-versions.mjs`
- Test: `scripts/check-versions.test.mjs`

**Interfaces:**

- Consumes: nothing (first task).
- Produces: `scripts/version-fields.mjs` exporting `SKILL_FIELDS`
  (string[] of 3 repo-relative SKILL.md paths), `JSON_FIELDS`
  (array of `{file, get(json), set(json, version)}`),
  `readVersions(root)` returning `Array<{file: string, version: string}>`
  (throws on missing/malformed fields), and `writeVersions(root, version)`.
  Also `scripts/check-versions.mjs` as a zero-arg CLI: exit 0 when all six
  fields agree, exit 1 with a diff-style listing otherwise. Task 3 imports
  `readVersions`/`writeVersions`; Task 2 wires the CLI into CI.

- [ ] **Step 1: Write the failing test**

Create `scripts/check-versions.test.mjs`:

```javascript
#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function skillMd(version) {
  return `---\nname: fixture\nversion: ${version}\ndescription: fixture\n---\n\n# Fixture\n`;
}

function makeFixture(t, versions) {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'slopornot-versions-'));
  t.after(() => fs.rmSync(fixture, { recursive: true, force: true }));

  for (const script of ['check-versions.mjs', 'version-fields.mjs']) {
    const dest = path.join(fixture, 'scripts', script);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(repoRoot, 'scripts', script), dest);
  }

  writeFile(path.join(fixture, 'skills/agentic-humanizer/SKILL.md'), skillMd(versions[0]));
  writeFile(path.join(fixture, 'skills/slop-check/SKILL.md'), skillMd(versions[1]));
  writeFile(path.join(fixture, 'claude-skills/agentic-humanizer/SKILL.md'), skillMd(versions[2]));
  writeFile(
    path.join(fixture, 'plugins/claude/slopornot/.claude-plugin/plugin.json'),
    `${JSON.stringify({ name: 'slopornot', version: versions[3] }, null, 2)}\n`
  );
  writeFile(
    path.join(fixture, 'plugins/codex/slopornot/.codex-plugin/plugin.json'),
    `${JSON.stringify({ name: 'slopornot', version: versions[4] }, null, 2)}\n`
  );
  writeFile(
    path.join(fixture, '.claude-plugin/marketplace.json'),
    `${JSON.stringify({ name: 'slopornot', plugins: [{ name: 'slopornot', version: versions[5] }] }, null, 2)}\n`
  );

  return fixture;
}

test('check-versions passes when all six fields agree', (t) => {
  const fixture = makeFixture(t, ['0.1.0', '0.1.0', '0.1.0', '0.1.0', '0.1.0', '0.1.0']);
  const result = spawnSync(process.execPath, [path.join(fixture, 'scripts/check-versions.mjs')], {
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /all 6 source version fields read 0\.1\.0/);
});

test('check-versions fails when one field drifts', (t) => {
  const fixture = makeFixture(t, ['0.1.0', '0.1.0', '0.1.0', '0.1.0', '0.1.0', '0.2.0']);
  const result = spawnSync(process.execPath, [path.join(fixture, 'scripts/check-versions.mjs')], {
    encoding: 'utf8',
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /source version fields disagree/);
  assert.match(result.stderr, /0\.2\.0 {2}\.claude-plugin\/marketplace\.json/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/check-versions.test.mjs`
Expected: FAIL (cannot copy `scripts/check-versions.mjs`, file does not exist).

- [ ] **Step 3: Write the implementation**

Create `scripts/version-fields.mjs`:

```javascript
import fs from 'node:fs';
import path from 'node:path';

// The six hand-editable source version fields. Generated plugin copies
// follow via scripts/sync-plugins.mjs and are not listed here.
export const SKILL_FIELDS = [
  'skills/agentic-humanizer/SKILL.md',
  'skills/slop-check/SKILL.md',
  'claude-skills/agentic-humanizer/SKILL.md',
];

export const JSON_FIELDS = [
  {
    file: 'plugins/claude/slopornot/.claude-plugin/plugin.json',
    get: (json) => json.version,
    set: (json, version) => { json.version = version; },
  },
  {
    file: 'plugins/codex/slopornot/.codex-plugin/plugin.json',
    get: (json) => json.version,
    set: (json, version) => { json.version = version; },
  },
  {
    file: '.claude-plugin/marketplace.json',
    get: (json) => json.plugins[0].version,
    set: (json, version) => { json.plugins[0].version = version; },
  },
];

function frontmatterBounds(text, file) {
  if (!text.startsWith('---\n')) throw new Error(`${file}: missing frontmatter`);
  const end = text.indexOf('\n---\n', 4);
  if (end < 0) throw new Error(`${file}: malformed frontmatter (no closing ---)`);
  return { start: 4, end };
}

export function readVersions(root) {
  const versions = [];
  for (const file of SKILL_FIELDS) {
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    const { start, end } = frontmatterBounds(text, file);
    const match = text.slice(start, end).match(/^version:\s*(\S+)\s*$/m);
    if (!match) throw new Error(`${file}: no version key in frontmatter`);
    versions.push({ file, version: match[1] });
  }
  for (const { file, get } of JSON_FIELDS) {
    const json = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
    const version = get(json);
    if (typeof version !== 'string') throw new Error(`${file}: no version field`);
    versions.push({ file, version });
  }
  return versions;
}

export function writeVersions(root, version) {
  for (const file of SKILL_FIELDS) {
    const filePath = path.join(root, file);
    const text = fs.readFileSync(filePath, 'utf8');
    const { start, end } = frontmatterBounds(text, file);
    const fm = text.slice(start, end).replace(/^version:.*$/m, `version: ${version}`);
    fs.writeFileSync(filePath, text.slice(0, start) + fm + text.slice(end));
  }
  for (const { file, set } of JSON_FIELDS) {
    const filePath = path.join(root, file);
    const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    set(json, version);
    fs.writeFileSync(filePath, `${JSON.stringify(json, null, 2)}\n`);
  }
}
```

Create `scripts/check-versions.mjs`:

```javascript
#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readVersions } from './version-fields.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let versions;
try {
  versions = readVersions(root);
} catch (error) {
  console.error(`[FAIL] ${error.message}`);
  process.exit(1);
}

const unique = [...new Set(versions.map((entry) => entry.version))];
if (unique.length > 1) {
  console.error('[FAIL] source version fields disagree:');
  for (const { file, version } of versions) {
    console.error(`       ${version}  ${file}`);
  }
  process.exit(1);
}

console.log(`[OK]   all ${versions.length} source version fields read ${unique[0]}`);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test scripts/check-versions.test.mjs`
Expected: PASS (2 tests).

Run: `node scripts/check-versions.mjs`
Expected: `[OK]   all 6 source version fields read 0.1.0`, exit 0.

- [ ] **Step 5: Commit**

```bash
git add scripts/version-fields.mjs scripts/check-versions.mjs scripts/check-versions.test.mjs
git commit -m "ci(scripts): add version-consistency check across source version fields"
```

---

### Task 2: Wire the five missing gates into `lint-skill.yml`

**Files:**

- Modify: `.github/workflows/lint-skill.yml` (append after the
  `Relative-link check` step, line 37)

**Interfaces:**

- Consumes: `scripts/check-versions.mjs` CLI from Task 1.
- Produces: the `lint` job (a required check) now enforces all eight gates.
  Note `node --test scripts/` auto-discovers every `scripts/*.test.mjs`, so
  Task 3's tests join CI with no further workflow edit.

- [ ] **Step 1: Append the new steps**

Add to the end of the `steps:` list in `.github/workflows/lint-skill.yml`
(keep the existing `permissions: contents: read` and
`persist-credentials: false` untouched):

```yaml
      - name: Plugin sync drift
        run: node scripts/sync-plugins.mjs --check

      - name: Plugin packaging
        run: node scripts/check-plugin-packaging.mjs

      - name: Unit tests
        run: node --test scripts/

      - name: Desktop bundle drift
        run: make -C claude-skills check

      - name: Version consistency
        run: node scripts/check-versions.mjs
```

- [ ] **Step 2: Verify every gate passes locally**

Run each command and confirm exit 0:

```bash
node scripts/sync-plugins.mjs --check
node scripts/check-plugin-packaging.mjs
node --test scripts/
make -C claude-skills check
node scripts/check-versions.mjs
```

Expected: `Plugin payloads are in sync.`, `[OK]` packaging lines, all tests
pass, silent `diff -r` success, `[OK]   all 6 source version fields read 0.1.0`.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/lint-skill.yml
git commit -m "ci: run all pre-pr gates in the lint workflow"
```

---

### Task 3: Release-prep transform (`prepare-release.mjs`)

**Files:**

- Create: `scripts/prepare-release.mjs`
- Test: `scripts/prepare-release.test.mjs`

**Interfaces:**

- Consumes: `readVersions(root)` / `writeVersions(root, version)` from
  `scripts/version-fields.mjs` (Task 1).
- Produces: CLI `node scripts/prepare-release.mjs <X.Y.Z>`. Validates the
  argument (strict semver, strictly greater than the current agreed version,
  non-empty `[Unreleased]`), promotes the CHANGELOG heading to
  `## [<version>] (<YYYY-MM-DD UTC>)` with a fresh bare `## [Unreleased]`
  above it (matching the post-v0.2.0 precedent, commit `0b32d8f`), bumps all
  six fields, then runs `node scripts/sync-plugins.mjs` and
  `make -C claude-skills build`. Exit 0 leaves the tree ready to commit.
  Task 4's workflow invokes this CLI; tag-existence checking is the
  workflow's job, not this script's (no git dependency here).

- [ ] **Step 1: Write the failing test**

Create `scripts/prepare-release.test.mjs`:

```javascript
#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function skillMd(version) {
  return `---\nname: fixture\nversion: ${version}\ndescription: fixture\n---\n\n# Fixture\n`;
}

const CHANGELOG = [
  '# Changelog',
  '',
  '## [Unreleased]',
  '',
  '### Added',
  '',
  '- A new thing.',
  '',
  '## [0.1.0] (2026-05-07)',
  '',
  '### Added',
  '',
  '- Initial release.',
  '',
].join('\n');

function makeFixture(t, { unreleasedBody = true } = {}) {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'slopornot-prepare-'));
  t.after(() => fs.rmSync(fixture, { recursive: true, force: true }));

  for (const script of ['prepare-release.mjs', 'version-fields.mjs']) {
    const dest = path.join(fixture, 'scripts', script);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(repoRoot, 'scripts', script), dest);
  }

  // Stub propagation: a fake sync script and Makefile that write markers,
  // proving both are invoked without needing the real payloads.
  writeFile(
    path.join(fixture, 'scripts/sync-plugins.mjs'),
    "import fs from 'node:fs';\nfs.writeFileSync(new URL('../sync-ran.marker', import.meta.url), 'ok\\n');\n"
  );
  writeFile(path.join(fixture, 'claude-skills/Makefile'), 'build:\n\ttouch build-ran.marker\n');

  writeFile(path.join(fixture, 'skills/agentic-humanizer/SKILL.md'), skillMd('0.1.0'));
  writeFile(path.join(fixture, 'skills/slop-check/SKILL.md'), skillMd('0.1.0'));
  writeFile(path.join(fixture, 'claude-skills/agentic-humanizer/SKILL.md'), skillMd('0.1.0'));
  writeFile(
    path.join(fixture, 'plugins/claude/slopornot/.claude-plugin/plugin.json'),
    `${JSON.stringify({ name: 'slopornot', version: '0.1.0' }, null, 2)}\n`
  );
  writeFile(
    path.join(fixture, 'plugins/codex/slopornot/.codex-plugin/plugin.json'),
    `${JSON.stringify({ name: 'slopornot', version: '0.1.0' }, null, 2)}\n`
  );
  writeFile(
    path.join(fixture, '.claude-plugin/marketplace.json'),
    `${JSON.stringify({ name: 'slopornot', plugins: [{ name: 'slopornot', version: '0.1.0' }] }, null, 2)}\n`
  );

  writeFile(
    path.join(fixture, 'CHANGELOG.md'),
    unreleasedBody ? CHANGELOG : CHANGELOG.replace('### Added\n\n- A new thing.\n\n', '')
  );

  return fixture;
}

function run(fixture, args) {
  return spawnSync(process.execPath, [path.join(fixture, 'scripts/prepare-release.mjs'), ...args], {
    encoding: 'utf8',
  });
}

test('prepare-release promotes the changelog, bumps all fields, and propagates', (t) => {
  const fixture = makeFixture(t);
  const result = run(fixture, ['0.2.0']);
  assert.equal(result.status, 0, result.stdout + result.stderr);

  const changelog = fs.readFileSync(path.join(fixture, 'CHANGELOG.md'), 'utf8');
  assert.match(
    changelog,
    /## \[Unreleased\]\n\n## \[0\.2\.0\] \(\d{4}-\d{2}-\d{2}\)\n\n### Added\n\n- A new thing\./
  );

  for (const file of [
    'skills/agentic-humanizer/SKILL.md',
    'skills/slop-check/SKILL.md',
    'claude-skills/agentic-humanizer/SKILL.md',
  ]) {
    assert.match(fs.readFileSync(path.join(fixture, file), 'utf8'), /^version: 0\.2\.0$/m, file);
  }
  for (const file of [
    'plugins/claude/slopornot/.claude-plugin/plugin.json',
    'plugins/codex/slopornot/.codex-plugin/plugin.json',
  ]) {
    assert.equal(JSON.parse(fs.readFileSync(path.join(fixture, file), 'utf8')).version, '0.2.0', file);
  }
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(fixture, '.claude-plugin/marketplace.json'), 'utf8'))
      .plugins[0].version,
    '0.2.0'
  );

  assert.ok(fs.existsSync(path.join(fixture, 'sync-ran.marker')), 'sync-plugins.mjs was not invoked');
  assert.ok(
    fs.existsSync(path.join(fixture, 'claude-skills/build-ran.marker')),
    'make build was not invoked'
  );
});

test('prepare-release rejects a malformed version', (t) => {
  const fixture = makeFixture(t);
  const result = run(fixture, ['v0.2.0']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /usage/);
});

test('prepare-release rejects a version that is not greater', (t) => {
  const fixture = makeFixture(t);
  const result = run(fixture, ['0.1.0']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /not greater/);
});

test('prepare-release rejects an empty [Unreleased] section', (t) => {
  const fixture = makeFixture(t, { unreleasedBody: false });
  const result = run(fixture, ['0.2.0']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /\[Unreleased\] is empty/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/prepare-release.test.mjs`
Expected: FAIL (cannot copy `scripts/prepare-release.mjs`, file does not
exist).

- [ ] **Step 3: Write the implementation**

Create `scripts/prepare-release.mjs`:

```javascript
#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readVersions, writeVersions } from './version-fields.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(message) {
  console.error(`[FAIL] ${message}`);
  process.exit(1);
}

const version = process.argv[2];
if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  fail('usage: node scripts/prepare-release.mjs <X.Y.Z>');
}

function greater(a, b) {
  const left = a.split('.').map(Number);
  const right = b.split('.').map(Number);
  for (let i = 0; i < 3; i += 1) {
    if (left[i] !== right[i]) return left[i] > right[i];
  }
  return false;
}

let current;
try {
  const versions = readVersions(root);
  const unique = [...new Set(versions.map((entry) => entry.version))];
  if (unique.length > 1) {
    fail('source version fields disagree; run node scripts/check-versions.mjs');
  }
  [current] = unique;
} catch (error) {
  fail(error.message);
}
if (!greater(version, current)) {
  fail(`${version} is not greater than the current version ${current}`);
}

const changelogPath = path.join(root, 'CHANGELOG.md');
const changelog = fs.readFileSync(changelogPath, 'utf8');
const marker = '## [Unreleased]';
const markerIndex = changelog.indexOf(marker);
if (markerIndex < 0) fail('CHANGELOG.md has no [Unreleased] section');
const rest = changelog.slice(markerIndex + marker.length);
const nextHeading = rest.indexOf('\n## [');
const body = nextHeading >= 0 ? rest.slice(0, nextHeading) : rest;
if (!body.trim()) fail('CHANGELOG.md [Unreleased] is empty; nothing to release');

// Read the date once so it is deterministic within a run. UTC by contract.
const date = new Date().toISOString().slice(0, 10);
fs.writeFileSync(changelogPath, changelog.replace(marker, `${marker}\n\n## [${version}] (${date})`));

writeVersions(root, version);

execFileSync(process.execPath, [path.join(root, 'scripts/sync-plugins.mjs')], { stdio: 'inherit' });
execFileSync('make', ['-C', path.join(root, 'claude-skills'), 'build'], { stdio: 'inherit' });

console.log(`[OK]   prepared release v${version} (${date})`);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test scripts/prepare-release.test.mjs`
Expected: PASS (4 tests).

Run: `node --test scripts/`
Expected: PASS (all suites: packaging, check-versions, prepare-release).

- [ ] **Step 5: Commit**

```bash
git add scripts/prepare-release.mjs scripts/prepare-release.test.mjs
git commit -m "ci(scripts): add deterministic release-prep transform"
```

---

### Task 4: Prepare-release workflow

**Files:**

- Create: `.github/workflows/release-prepare.yml`

**Interfaces:**

- Consumes: `node scripts/prepare-release.mjs <X.Y.Z>` CLI (Task 3).
- Produces: a `workflow_dispatch` that pushes `release/v<version>` and opens
  a PR titled `chore(release): v<version>`. Task 5's publish workflow keys
  off that exact branch-name prefix `release/v`. Requires the
  `RELEASE_APP_TOKEN` repo secret (documented in Task 8).

- [ ] **Step 1: Create the workflow**

Create `.github/workflows/release-prepare.yml`:

```yaml
name: Prepare release

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Release version (X.Y.Z, no leading v)'
        required: true
        type: string

permissions:
  contents: write
  pull-requests: write

concurrency:
  group: release-prepare
  cancel-in-progress: false

jobs:
  prepare:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      # persist-credentials stays on: the push step below uses this token,
      # and a branch pushed with the default GITHUB_TOKEN would not trigger
      # CI on the release PR (GitHub loop prevention).
      - name: Checkout main
        uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
        with:
          ref: main
          token: ${{ secrets.RELEASE_APP_TOKEN }}

      - name: Set up Node
        uses: actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e # v6.4.0
        with:
          node-version: '24'

      - name: Refuse an existing tag
        env:
          VERSION: ${{ inputs.version }}
        run: |
          if [ -n "$(git ls-remote --tags origin "refs/tags/v${VERSION}")" ]; then
            echo "tag v${VERSION} already exists" >&2
            exit 1
          fi

      - name: Prepare release files
        env:
          VERSION: ${{ inputs.version }}
        run: node scripts/prepare-release.mjs "${VERSION}"

      - name: Push release branch
        env:
          VERSION: ${{ inputs.version }}
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git switch -c "release/v${VERSION}"
          git add -A
          git commit -m "chore(release): prepare v${VERSION}"
          git push origin "release/v${VERSION}"

      - name: Open release PR
        env:
          GH_TOKEN: ${{ secrets.RELEASE_APP_TOKEN }}
          VERSION: ${{ inputs.version }}
        run: |
          gh pr create \
            --base main \
            --head "release/v${VERSION}" \
            --title "chore(release): v${VERSION}" \
            --body "Promotes CHANGELOG.md [Unreleased] to v${VERSION}, bumps all six source version fields, and regenerates the plugin payloads and Desktop bundle copies. Release notes: the [v${VERSION}] CHANGELOG section on this branch. Merging triggers the publish workflow (tag, GitHub Release, Desktop and ChatGPT zips)."
```

Semver format, strictly-greater, and non-empty `[Unreleased]` validation all
live inside `prepare-release.mjs` (Task 3), so this workflow only adds the
git-side check the script cannot do (tag existence).

- [ ] **Step 2: Verify the YAML**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/release-prepare.yml')); print('yaml ok')"`
Expected: `yaml ok`.

If zizmor is available locally (`brew install zizmor` or `uvx zizmor`), run:
`zizmor .github/workflows/release-prepare.yml` and expect no findings above
informational. Otherwise the required `Run zizmor` CI check verifies this on
the PR.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/release-prepare.yml
git commit -m "ci(release): add prepare-release workflow"
```

---

### Task 5: Publish workflow (tag, Release, Desktop + ChatGPT zips)

**Files:**

- Create: `.github/workflows/release-publish.yml`

**Interfaces:**

- Consumes: the `release/v<version>` branch-name convention (Task 4) and the
  CHANGELOG heading format `## [<version>] (<YYYY-MM-DD>)` written by Task 3.
- Produces: annotated tag `v<version>`, a GitHub Release titled `v<version>`
  with the CHANGELOG section as notes, and two assets:
  `claude-skills/agentic-humanizer-desktop.zip` and
  `agentic-humanizer-chatgpt.zip`.

- [ ] **Step 1: Create the workflow**

Create `.github/workflows/release-publish.yml`:

```yaml
name: Publish release

on:
  pull_request:
    types: [closed]
    branches: [main]

permissions:
  contents: write

concurrency:
  group: release-publish
  cancel-in-progress: false

jobs:
  publish:
    if: >-
      github.event.pull_request.merged == true &&
      startsWith(github.event.pull_request.head.ref, 'release/v')
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      # Checkout the merge commit explicitly: on closed events the default
      # ref is the PR merge ref, which is unreliable after the merge.
      # persist-credentials stays on: the tag push below uses GITHUB_TOKEN.
      - name: Checkout merge commit
        uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
        with:
          ref: ${{ github.event.pull_request.merge_commit_sha }}

      - name: Derive version from branch name
        env:
          HEAD_REF: ${{ github.event.pull_request.head.ref }}
        run: echo "VERSION=${HEAD_REF#release/v}" >> "$GITHUB_ENV"

      - name: Create annotated tag
        run: |
          if [ -n "$(git ls-remote --tags origin "refs/tags/v${VERSION}")" ]; then
            echo "tag v${VERSION} already exists; skipping"
          else
            git config user.name "github-actions[bot]"
            git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
            git tag -a "v${VERSION}" -m "v${VERSION}"
            git push origin "v${VERSION}"
          fi

      - name: Build Desktop zip
        run: make -C claude-skills

      - name: Build ChatGPT skill zip
        run: cd skills && zip -r ../agentic-humanizer-chatgpt.zip agentic-humanizer -x '*/.DS_Store'

      - name: Extract release notes
        run: |
          awk -v ver="${VERSION}" '
            index($0, "## [" ver "]") == 1 { found = 1; next }
            found && /^## \[/ { exit }
            found { print }
          ' CHANGELOG.md > release-notes.md
          if ! grep -q '[^[:space:]]' release-notes.md; then
            echo "no CHANGELOG section found for v${VERSION}" >&2
            exit 1
          fi

      - name: Create GitHub Release
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          if gh release view "v${VERSION}" >/dev/null 2>&1; then
            echo "release v${VERSION} already exists; skipping"
          else
            gh release create "v${VERSION}" \
              --title "v${VERSION}" \
              --notes-file release-notes.md \
              claude-skills/agentic-humanizer-desktop.zip \
              agentic-humanizer-chatgpt.zip
          fi
```

The tag and release steps are re-run-safe on purpose: a partial failure
(tag pushed, release flaked) recovers by re-running the job. The release
title is deterministic (`v<version>`); the maintainer edits the Release
afterward to append a theme, matching the `v0.2.0: Agentic Humanizer for
Claude Desktop` convention.

- [ ] **Step 2: Verify the notes extraction against the real CHANGELOG**

Run:

```bash
awk -v ver="0.2.0" '
  index($0, "## [" ver "]") == 1 { found = 1; next }
  found && /^## \[/ { exit }
  found { print }
' CHANGELOG.md | head -12
```

Expected: the first lines of the `## [0.2.0] (2026-05-21)` section
(`### Added`, the Claude Desktop bundle bullet), and nothing from
`[Unreleased]` or `[0.1.0]`.

- [ ] **Step 3: Verify both zip builds locally**

Run:

```bash
make -C claude-skills
(cd skills && zip -r ../agentic-humanizer-chatgpt.zip agentic-humanizer -x '*/.DS_Store')
unzip -l agentic-humanizer-chatgpt.zip | head -8
unzip -l agentic-humanizer-chatgpt.zip | tail -2
```

Expected: every path in the zip starts with `agentic-humanizer/`, exactly one
`SKILL.md` at `agentic-humanizer/SKILL.md`, roughly 24 files, well under
ChatGPT's limits (50 MB zip, 500 files, 25 MB per uncompressed file).

Then clean up the local artifacts (they are not tracked):

```bash
rm agentic-humanizer-chatgpt.zip
make -C claude-skills clean
git status --short
```

Expected: `git status` shows no changes beyond the new workflow file.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/release-publish.yml
git commit -m "ci(release): add publish workflow with desktop and chatgpt bundles"
```

---

### Task 6: Advisory prompt-review workflow

**Files:**

- Create: `.github/workflows/prompt-review.yml`

**Interfaces:**

- Consumes: the existing `CLAUDE_CODE_OAUTH_TOKEN` repo secret (already used
  by `.github/workflows/claude-code-review.yml`).
- Produces: an advisory PR comment on prompt-surface changes. Never added to
  required checks; path filters are safe here because it is not required.

- [ ] **Step 1: Create the workflow**

Create `.github/workflows/prompt-review.yml`:

```yaml
name: Prompt Review

on:
  pull_request:
    types: [opened, synchronize, ready_for_review, reopened]
    paths:
      - '**/SKILL.md'
      - 'skills/agentic-humanizer/harnesses/**'
      - 'skills/**/references/**'
      - 'AGENTS.md'
      - 'README.md'

permissions: {}

concurrency:
  group: prompt-review-${{ github.ref }}
  cancel-in-progress: true

jobs:
  prompt-review:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    permissions:
      contents: read
      pull-requests: read
      issues: read
      id-token: write
    steps:
      - name: Checkout
        uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
        with:
          persist-credentials: false
          fetch-depth: 1

      - name: Run prompt review
        uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          prompt: |
            Review pull request #${{ github.event.pull_request.number }} in
            ${{ github.repository }} as a prompt engineer, not a code
            reviewer.

            Scope: only changed files that are prompt surfaces (SKILL.md
            files, skills/agentic-humanizer/harnesses/*.md, files under
            skills/*/references/, AGENTS.md, README.md). Ignore generated
            copies under plugins/ and all other changes.

            For each in-scope changed file, check:
            - Clarity: instructions are imperative, unambiguous, testable.
            - Structure: heading hierarchy and step ordering a model can
              follow without backtracking.
            - Consistency: no instruction contradicts SKILL.md or another
              file it references.
            - Staleness: every referenced file path, tool name, step
              number, and constant exists in the repo at this PR's head.
              Verify paths before reporting.
            - Doc-sync: the change satisfies the doc-sync matrix in
              AGENTS.md Critical rules rule 5.

            Post one PR comment with findings grouped by file, citing line
            numbers, prefixed "Advisory prompt review (non-blocking)". If
            nothing is wrong, post a single sentence saying the prompt
            surfaces look good. Never request changes; this review must not
            block merge.
```

`anthropics/claude-code-action@v1` is deliberately tag-pinned to match the
existing `claude-code-review.yml`; the two should be bumped together.

- [ ] **Step 2: Verify the YAML**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/prompt-review.yml')); print('yaml ok')"`
Expected: `yaml ok`. Run `zizmor` on it too if installed locally.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/prompt-review.yml
git commit -m "ci: add advisory prompt review workflow"
```

---

### Task 7: ChatGPT runtime notes in the canonical skill

**Files:**

- Modify: `skills/agentic-humanizer/SKILL.md` (Step 1 harness table, line 67)
- Modify: `skills/agentic-humanizer/harnesses/generic.md` ("When this file
  applies" list plus one new section)
- Modify: `CHANGELOG.md` (`[Unreleased]` entries)
- Regenerate: `plugins/{claude,codex}/slopornot/skills/agentic-humanizer/`
  via `node scripts/sync-plugins.mjs` (never by hand)

**Interfaces:**

- Consumes: nothing from other tasks (independent).
- Produces: ChatGPT named as a generic runtime. Do NOT create
  `harnesses/chatgpt.md` and do NOT add `chatgpt` to the SKILL.md
  `compatibility:` frontmatter (that field lists peer harnesses with
  dedicated files only).

- [ ] **Step 1: Edit the SKILL.md Step 1 table**

In `skills/agentic-humanizer/SKILL.md`, change the last harness-table row:

```text
| Anything else | n/a; fall back to plain text | `harnesses/generic.md` |
```

to:

```text
| Anything else (e.g. ChatGPT Skills) | n/a; fall back to plain text | `harnesses/generic.md` |
```

- [ ] **Step 2: Edit generic.md**

In `skills/agentic-humanizer/harnesses/generic.md`, under
`## When this file applies`, extend the first bullet list with one item after
the "Any harness not listed" bullet:

```text
- ChatGPT Skills (the uploaded `agentic-humanizer-chatgpt.zip`); see the
  ChatGPT note below
```

Then append this section at the end of the file:

```text
## ChatGPT note

When running as an uploaded ChatGPT skill, keep the interview fully
plain-text as above and assume none of the local-agent surface exists: no
local files, no shell, no MCP tools, and no durable profile storage under
`~/.agentic-humanizer/`. Treat every run as profile-less: skip saved-profile
reads and writes, and take voice samples only as text pasted in the current
conversation. Keep the question set and order unchanged; when the user
answers `never` to the voice question, treat it as `n` for this run, since
nothing persists across conversations. Slop or Not Pro scoring is
unavailable unless the chat has a connected tool that can reach it, so the
loop normally runs unscored with `n/a` score and grade values.
```

- [ ] **Step 3: Add CHANGELOG entries**

In `CHANGELOG.md` under `## [Unreleased]`, append to the existing `### Added`
list:

```text
- ChatGPT Skills distribution: releases now attach
  `agentic-humanizer-chatgpt.zip`, the canonical `agentic-humanizer` skill
  zipped for upload via ChatGPT > Skills > New skill (plan-gated beta).
  ChatGPT runs the core 5-pass rewrite through the generic plain-text path;
  Slop or Not Pro scoring is unavailable there.
```

and to the existing `### Changed` list:

```text
- The generic harness and `SKILL.md` Step 1 now name ChatGPT Skills as a
  supported generic runtime.
```

- [ ] **Step 4: Regenerate plugin payloads and verify**

```bash
node scripts/sync-plugins.mjs
node scripts/sync-plugins.mjs --check
make -C claude-skills check
npx markdownlint-cli2@0.18.1 "**/*.md" "#node_modules" "#WARP.md"
node scripts/check-links.mjs
```

Expected: sync copies the two edited files into both plugin payloads, then
`--check` reports `Plugin payloads are in sync.`; `make check` passes (the
Desktop bundle ships no `harnesses/`, so it is unaffected); lint and links
pass.

- [ ] **Step 5: Commit**

```bash
git add skills/agentic-humanizer/SKILL.md skills/agentic-humanizer/harnesses/generic.md \
  CHANGELOG.md plugins/claude/slopornot/skills plugins/codex/slopornot/skills
git commit -m "docs(harnesses): name chatgpt skills as a supported generic runtime"
```

---

### Task 8: Documentation (AGENTS.md, CONTRIBUTING.md, READMEs)

**Files:**

- Modify: `AGENTS.md` (Critical rules rule 1, Layout table)
- Modify: `CONTRIBUTING.md` (pre-PR checklist, new Releasing and ChatGPT
  sections)
- Modify: `README.md` (new ChatGPT install subsection)
- Modify: `skills/agentic-humanizer/README.md` (Install section addition)
- Regenerate: plugin payload copies of the skill README via
  `node scripts/sync-plugins.mjs`

**Interfaces:**

- Consumes: the gate list from Task 2, workflow names and the
  `RELEASE_APP_TOKEN` secret from Tasks 4-5, the zip command from Task 5.
- Produces: docs matching the shipped behavior. All copy must be em-dash
  free.

- [ ] **Step 1: Update AGENTS.md rule 1**

Replace the six-command block in Critical rules rule 1 with:

```bash
npx markdownlint-cli2@0.18.1 "**/*.md" "#node_modules" "#WARP.md"
node scripts/check-frontmatter.mjs
node scripts/check-links.mjs
node scripts/sync-plugins.mjs --check
node scripts/check-plugin-packaging.mjs
node scripts/check-versions.mjs
node --test scripts/
make -C claude-skills check
```

After the existing "GitHub also requires `lint` and `Run zizmor`" paragraph
in rule 1, add:

```text
Releases are automated: run the "Prepare release" workflow with a version,
review and merge the `release/v*` PR it opens, and the publish workflow
tags, creates the GitHub Release, and attaches the Desktop and ChatGPT
zips. The prepare workflow needs the `RELEASE_APP_TOKEN` repo secret (a
GitHub App or fine-grained PAT with contents and pull-requests write).
```

- [ ] **Step 2: Update the AGENTS.md Layout table**

Add these rows after the existing `scripts/check-plugin-packaging.mjs` row,
matching the table's terse style:

```text
| `scripts/check-versions.mjs` | Verifies the six source version fields agree. CI gate. |
| `scripts/version-fields.mjs` | Shared source-version-field list and read/write helpers for `check-versions.mjs` and `prepare-release.mjs`. |
| `scripts/prepare-release.mjs` | Release-prep transform: promotes `[Unreleased]`, bumps all version fields, regenerates payloads. |
| `.github/workflows/release-{prepare,publish}.yml` | Two-phase release automation: dispatch opens a release PR; merge tags and uploads release zips. |
| `.github/workflows/prompt-review.yml` | Advisory prompt-quality review on prompt-surface PRs. Not a required check. |
```

- [ ] **Step 3: Update CONTRIBUTING.md**

Extend the pre-PR checklist code block with the two new commands (same order
as AGENTS.md above) and change the sentence `All six must pass.` to
`All eight must pass.`

Append two sections before `## Commit conventions`:

````markdown
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
````

- [ ] **Step 4: Update the root README.md**

Insert a new subsection between `### Claude Desktop` and
`## Optional: Set Up Slop or Not Pro`:

```markdown
### ChatGPT (beta)

ChatGPT Skills can run `agentic-humanizer` as an uploaded skill on
Business, Enterprise, Edu, Teachers, and Healthcare plans. Download
`agentic-humanizer-chatgpt.zip` from the
[latest release](https://github.com/numen-tech/slopornot/releases/latest),
then in ChatGPT open `Skills`, choose `New skill`, then
`Upload from your computer`, and select the zip.

ChatGPT runs the core 5-pass rewrite through the plain-text generic path.
Slop or Not Pro scoring, saved profiles, and voice files are unavailable
there; paste a voice sample into the chat instead. Skills do not sync
across products, so a ChatGPT upload is independent of a Codex or Claude
install. `slop-check` is not available on ChatGPT because it depends on
local Pro tools.
```

- [ ] **Step 5: Update skills/agentic-humanizer/README.md**

At the end of the `## Install` section (after the "Direct skill installs and
non-plugin clients invoke" block), add:

```markdown
ChatGPT (Business, Enterprise, Edu, Teachers, and Healthcare plans; beta)
runs this skill as an upload: download `agentic-humanizer-chatgpt.zip` from
the [latest release](https://github.com/numen-tech/slopornot/releases/latest),
then open `Skills`, choose `New skill`, then `Upload from your computer`.
ChatGPT uses the plain-text generic interview; Slop or Not Pro scoring,
saved profiles, and voice files are unavailable there, so paste a voice
sample instead.
```

- [ ] **Step 6: Regenerate payloads and run the full gate**

```bash
node scripts/sync-plugins.mjs
npx markdownlint-cli2@0.18.1 "**/*.md" "#node_modules" "#WARP.md"
node scripts/check-frontmatter.mjs
node scripts/check-links.mjs
node scripts/sync-plugins.mjs --check
node scripts/check-plugin-packaging.mjs
node scripts/check-versions.mjs
node --test scripts/
make -C claude-skills check
```

Expected: all eight pass.

- [ ] **Step 7: Commit**

```bash
git add AGENTS.md CONTRIBUTING.md README.md skills/agentic-humanizer/README.md \
  plugins/claude/slopornot/skills plugins/codex/slopornot/skills
git commit -m "docs: document release automation and chatgpt distribution"
```

---

### Task 9: Final verification

**Files:** none (verification only).

**Interfaces:**

- Consumes: everything above.
- Produces: evidence the branch is PR-ready.

- [ ] **Step 1: Run the complete gate one last time**

```bash
npx markdownlint-cli2@0.18.1 "**/*.md" "#node_modules" "#WARP.md"
node scripts/check-frontmatter.mjs
node scripts/check-links.mjs
node scripts/sync-plugins.mjs --check
node scripts/check-plugin-packaging.mjs
node scripts/check-versions.mjs
node --test scripts/
make -C claude-skills check
```

Expected: all eight exit 0. If any fails, fix within the task that owns the
file, amend or add a commit, and re-run.

- [ ] **Step 2: Scan for banned characters in user-facing files**

```bash
grep -n $'—' README.md AGENTS.md CONTRIBUTING.md CHANGELOG.md \
  skills/agentic-humanizer/SKILL.md skills/slop-check/SKILL.md \
  claude-skills/agentic-humanizer/SKILL.md \
  skills/agentic-humanizer/README.md || echo "no em-dashes introduced"
```

Expected: no matches in any line this branch touched (`git diff main --stat`
tells you which). Pre-existing em-dashes in untouched lines are inherited
and out of scope.

- [ ] **Step 3: Review the branch diff**

```bash
git log --oneline main..HEAD
git diff main --stat
```

Expected: roughly 9 commits; new files `scripts/version-fields.mjs`,
`scripts/check-versions.mjs`, `scripts/check-versions.test.mjs`,
`scripts/prepare-release.mjs`, `scripts/prepare-release.test.mjs`, three new
workflows; edits to `lint-skill.yml`, `AGENTS.md`, `CONTRIBUTING.md`,
`README.md`, both skill surfaces, `CHANGELOG.md`, and the synced plugin
copies. No version field changed from `0.1.0`.

Post-merge manual steps (maintainer, not this branch): configure
`RELEASE_APP_TOKEN`, run "Prepare release" with the first real version
(likely `0.3.0`), merge the release PR, confirm tag, Release, and both zips,
then upload the ChatGPT zip once to confirm the frontmatter scan accepts the
non-standard `compatibility:` field (spec, Risks section).
