#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = ['skills/agentic-humanizer/SKILL.md', 'skills/slop-check/SKILL.md'];
let errors = 0;

for (const f of files) {
  const text = fs.readFileSync(path.join(root, f), 'utf8');
  if (!text.startsWith('---\n')) {
    console.error(`[FAIL] ${f}: missing frontmatter`);
    errors++;
    continue;
  }
  const end = text.indexOf('\n---\n', 4);
  if (end < 0) {
    console.error(`[FAIL] ${f}: malformed frontmatter (no closing ---)`);
    errors++;
    continue;
  }
  const fm = text.slice(4, end);
  const requiredKeys = ['name', 'description'];
  for (const key of requiredKeys) {
    if (!new RegExp(`^${key}:`, 'm').test(fm)) {
      console.error(`[FAIL] ${f}: missing required frontmatter key '${key}'`);
      errors++;
    }
  }
  console.log(`[OK]   ${f}: frontmatter present with required keys`);
}

if (errors) process.exit(1);
