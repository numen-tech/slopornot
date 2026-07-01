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
