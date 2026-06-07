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

function writeJson(filePath, value) {
  writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

test('check-plugin-packaging fails when listed source skill directories are absent', (t) => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'slopornot-packaging-'));
  t.after(() => fs.rmSync(fixture, { recursive: true, force: true }));

  const scriptPath = path.join(fixture, 'scripts', 'check-plugin-packaging.mjs');
  fs.mkdirSync(path.dirname(scriptPath), { recursive: true });
  fs.copyFileSync(path.join(repoRoot, 'scripts', 'check-plugin-packaging.mjs'), scriptPath);

  writeFile(path.join(fixture, 'LICENSE'), 'MIT\n');

  for (const host of ['codex', 'claude']) {
    writeFile(path.join(fixture, 'plugins', host, 'slopornot', 'README.md'), '# SlopOrNot\n');
    writeFile(path.join(fixture, 'plugins', host, 'slopornot', 'LICENSE'), 'MIT\n');
  }

  writeJson(path.join(fixture, 'plugins/codex/slopornot/.codex-plugin/plugin.json'), {
    name: 'slopornot',
    repository: 'https://github.com/numen-tech/slopornot',
    skills: './skills/',
    license: 'MIT',
    keywords: ['slopornot', 'humanizer'],
  });
  writeJson(path.join(fixture, 'plugins/claude/slopornot/.claude-plugin/plugin.json'), {
    name: 'slopornot',
    repository: 'https://github.com/numen-tech/slopornot',
    skills: './skills/',
    license: 'MIT',
    keywords: ['slopornot', 'humanizer'],
  });
  writeJson(path.join(fixture, '.agents/plugins/marketplace.json'), {
    name: 'slopornot',
    interface: { displayName: 'SlopOrNot' },
    plugins: [
      {
        name: 'slopornot',
        source: { source: 'local', path: './plugins/codex/slopornot' },
        policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' },
        category: 'Productivity',
      },
    ],
  });
  writeJson(path.join(fixture, '.claude-plugin/marketplace.json'), {
    name: 'slopornot',
    owner: { name: 'Numen Technologies' },
    plugins: [{ name: 'slopornot', source: './plugins/claude/slopornot' }],
  });

  const result = spawnSync(process.execPath, [scriptPath], { encoding: 'utf8' });

  assert.notEqual(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stderr, /skills\/agentic-humanizer is missing/);
  assert.match(result.stderr, /skills\/slop-check is missing/);
});
