#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

// Self-contained skills are synced verbatim into each plugin payload at
// the same skills/<name>/ relative path.
const selfContainedSkillFiles = [
  'skills/agentic-humanizer/SKILL.md',
  'skills/agentic-humanizer/README.md',
  'skills/agentic-humanizer/harnesses/claude-code.md',
  'skills/agentic-humanizer/harnesses/codex.md',
  'skills/agentic-humanizer/harnesses/cursor.md',
  'skills/agentic-humanizer/harnesses/gemini-cli.md',
  'skills/agentic-humanizer/harnesses/generic.md',
  'skills/agentic-humanizer/harnesses/opencode.md',
  'skills/agentic-humanizer/references/patterns.md',
  'skills/agentic-humanizer/references/per-iteration-strategies.md',
  'skills/agentic-humanizer/references/slop-cli-setup.md',
  'skills/agentic-humanizer/references/slop-mcp-setup.md',
  'skills/agentic-humanizer/references/voice-fingerprint.md',
  'skills/agentic-humanizer/examples/sample-ai-text.md',
  'skills/slop-check/SKILL.md',
  'skills/slop-check/README.md',
  'skills/slop-check/references/slop-tools.md',
  'skills/slop-check/references/slop-setup.md',
];

function readJson(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    errors.push(`${relativePath} is missing`);
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (error) {
    errors.push(`${relativePath} is invalid JSON: ${error.message}`);
    return null;
  }
}

function requireFile(relativePath) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    errors.push(`${relativePath} is missing`);
  }
}

function requireEqual(actual, expected, label) {
  if (actual !== expected) {
    errors.push(
      `${label} expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`
    );
  }
}

function requireArrayIncludes(values, expected, label) {
  if (!Array.isArray(values) || !values.includes(expected)) {
    errors.push(`${label} must include ${JSON.stringify(expected)}`);
  }
}

function requireSyncedFile(sourcePath, destinationPath) {
  const source = path.join(root, sourcePath);
  const destination = path.join(root, destinationPath);

  if (!fs.existsSync(destination)) {
    errors.push(`${destinationPath} is missing`);
    return;
  }

  const sourceContent = fs.readFileSync(source, 'utf8');
  const destinationContent = fs.readFileSync(destination, 'utf8');

  if (sourceContent !== destinationContent) {
    errors.push(`${destinationPath} is out of sync with ${sourcePath}`);
  }
}

const codexManifest = readJson('plugins/codex/slopornot/.codex-plugin/plugin.json');
const claudeManifest = readJson('plugins/claude/slopornot/.claude-plugin/plugin.json');
const codexMarketplace = readJson('.agents/plugins/marketplace.json');
const claudeMarketplace = readJson('.claude-plugin/marketplace.json');

for (const manifest of [codexManifest, claudeManifest].filter(Boolean)) {
  const label = manifest.name || 'plugin';
  requireEqual(manifest.name, 'slopornot', `${label} manifest name`);
  requireEqual(
    manifest.repository,
    'https://github.com/numen-tech/slopornot',
    `${label} repository`
  );
  requireEqual(manifest.skills, './skills/', `${label} skills path`);
  requireEqual(manifest.license, 'MIT', `${label} license`);
  requireArrayIncludes(manifest.keywords, 'slopornot', `${label} keywords`);
  requireArrayIncludes(manifest.keywords, 'humanizer', `${label} keywords`);
}

if (codexMarketplace) {
  requireEqual(codexMarketplace.name, 'slopornot', 'Codex marketplace name');
  requireEqual(
    codexMarketplace.interface?.displayName,
    'SlopOrNot',
    'Codex marketplace display name'
  );

  const entry = codexMarketplace.plugins?.find((plugin) => plugin.name === 'slopornot');
  if (!entry) {
    errors.push('Codex marketplace missing slopornot plugin entry');
  } else {
    requireEqual(entry.source?.source, 'local', 'Codex marketplace source type');
    requireEqual(entry.source?.path, './plugins/codex/slopornot', 'Codex marketplace path');
    requireEqual(entry.policy?.installation, 'AVAILABLE', 'Codex installation policy');
    requireEqual(entry.policy?.authentication, 'ON_INSTALL', 'Codex authentication policy');
    requireEqual(entry.category, 'Productivity', 'Codex marketplace category');
  }
}

if (claudeMarketplace) {
  requireEqual(claudeMarketplace.name, 'slopornot', 'Claude marketplace name');
  requireEqual(
    claudeMarketplace.owner?.name,
    'Numen Technologies',
    'Claude marketplace owner'
  );

  const entry = claudeMarketplace.plugins?.find((plugin) => plugin.name === 'slopornot');
  if (!entry) {
    errors.push('Claude marketplace missing slopornot plugin entry');
  } else {
    requireEqual(entry.source, './plugins/claude/slopornot', 'Claude marketplace source path');
  }
}

for (const host of ['codex', 'claude']) {
  const pluginRoot = `plugins/${host}/slopornot`;

  requireFile(`${pluginRoot}/README.md`);
  requireSyncedFile('LICENSE', `${pluginRoot}/LICENSE`);

  for (const sourceFile of selfContainedSkillFiles) {
    requireSyncedFile(sourceFile, `${pluginRoot}/${sourceFile}`);
  }
}

if (errors.length) {
  for (const error of errors) console.error(`[FAIL] ${error}`);
  process.exit(1);
}

console.log('Plugin packaging structure is valid.');
