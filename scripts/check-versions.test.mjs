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
