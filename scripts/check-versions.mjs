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
