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
