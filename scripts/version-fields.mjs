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
