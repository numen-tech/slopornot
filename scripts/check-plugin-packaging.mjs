#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

// Self-contained skills live entirely under skills/<name>/ and are copied
// wholesale into each plugin payload (see sync-plugins.mjs). Derive the file
// list from disk so new harnesses, references, or examples are covered
// automatically instead of being hand-maintained here.
const selfContainedSkills = ['agentic-humanizer', 'slop-check'];

function listSkillFiles(skill) {
  const files = [];

  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      const stats = entry.isSymbolicLink() ? fs.statSync(entryPath) : entry;
      if (stats.isDirectory()) {
        walk(entryPath);
      } else if (stats.isFile()) {
        files.push(path.relative(root, entryPath));
      }
    }
  }

  walk(path.join(root, 'skills', skill));
  return files.sort();
}

const selfContainedSkillFiles = selfContainedSkills.flatMap(listSkillFiles);

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

// Each self-contained source is compared against both plugin hosts, so cache
// its contents and read it from disk only once.
const sourceContentCache = new Map();

function readSourceOnce(sourcePath) {
  let content = sourceContentCache.get(sourcePath);
  if (content === undefined) {
    content = fs.readFileSync(path.join(root, sourcePath), 'utf8');
    sourceContentCache.set(sourcePath, content);
  }
  return content;
}

function requireSyncedFile(sourcePath, destinationPath) {
  const destination = path.join(root, destinationPath);

  if (!fs.existsSync(destination)) {
    errors.push(`${destinationPath} is missing`);
    return;
  }

  const destinationContent = fs.readFileSync(destination, 'utf8');

  if (readSourceOnce(sourcePath) !== destinationContent) {
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
