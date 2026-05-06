#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let errors = 0;

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.git') || e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.name.endsWith('.md')) yield p;
  }
}

/** Strip fenced and indented code blocks so their content isn't link-checked. */
function stripCodeBlocks(text) {
  // Remove fenced code blocks (``` or ~~~)
  let stripped = text.replace(/^```[\s\S]*?^```/gm, '');
  stripped = stripped.replace(/^~~~[\s\S]*?^~~~/gm, '');
  // Remove indented code blocks (4-space or tab indent)
  stripped = stripped.replace(/^(?: {4}|\t).*/gm, '');
  return stripped;
}

const linkRe = /(?:\[[^\]]+\]\(|\b)([A-Za-z0-9_./-]+\.md)(?:[)#]|$|\s)/g;

for (const file of walk(root)) {
  const text = fs.readFileSync(file, 'utf8');
  const stripped = stripCodeBlocks(text);
  const dir = path.dirname(file);
  for (const m of stripped.matchAll(linkRe)) {
    const target = m[1];
    if (target.startsWith('http')) continue;
    const resolved = path.resolve(dir, target);
    if (!fs.existsSync(resolved)) {
      console.error(
        `[FAIL] ${path.relative(root, file)} → ${target} (resolved: ${path.relative(root, resolved)})`
      );
      errors++;
    }
  }
}

if (errors) {
  console.error(`\n${errors} broken link(s).`);
  process.exit(1);
} else {
  console.log('All relative .md links resolve.');
}
