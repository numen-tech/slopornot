#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');
const errors = [];

const pluginRoots = [
  path.join(root, 'plugins/codex/slopornot'),
  path.join(root, 'plugins/claude/slopornot'),
];

const skillFiles = [
  ['SKILL.md', 'SKILL.md'],
  ['skills/agentic-humanizer/README.md', 'README.md'],
];
const rootFiles = ['LICENSE'];
const skillDirs = ['harnesses', 'references', 'examples'];

function relative(filePath) {
  return path.relative(root, filePath);
}

function readFile(filePath) {
  return fs.readFileSync(filePath);
}

function filesEqual(source, destination) {
  if (!fs.existsSync(destination)) return false;
  return readFile(source).equals(readFile(destination));
}

function listFiles(dir) {
  const files = [];

  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath);
      } else if (entry.isFile()) {
        files.push(path.relative(dir, entryPath));
      }
    }
  }

  walk(dir);
  return files.sort();
}

function directoriesEqual(source, destination) {
  if (!fs.existsSync(destination)) return false;

  const sourceFiles = listFiles(source);
  const destinationFiles = listFiles(destination);

  if (sourceFiles.length !== destinationFiles.length) return false;

  for (const [index, sourceFile] of sourceFiles.entries()) {
    const destinationFile = destinationFiles[index];
    if (sourceFile !== destinationFile) return false;

    if (!filesEqual(path.join(source, sourceFile), path.join(destination, destinationFile))) {
      return false;
    }
  }

  return true;
}

function syncFile(source, destination) {
  if (checkOnly) {
    if (!filesEqual(source, destination)) {
      errors.push(`${relative(destination)} differs from ${relative(source)}`);
    }
    return;
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function syncDirectory(source, destination) {
  if (checkOnly) {
    if (!directoriesEqual(source, destination)) {
      errors.push(`${relative(destination)} differs from ${relative(source)}`);
    }
    return;
  }

  fs.rmSync(destination, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true });
}

for (const pluginRoot of pluginRoots) {
  const skillRoot = path.join(pluginRoot, 'skills/agentic-humanizer');

  for (const file of rootFiles) {
    syncFile(path.join(root, file), path.join(pluginRoot, file));
  }

  for (const [sourceFile, destinationFile] of skillFiles) {
    syncFile(path.join(root, sourceFile), path.join(skillRoot, destinationFile));
  }

  for (const dir of skillDirs) {
    syncDirectory(path.join(root, dir), path.join(skillRoot, dir));
  }
}

if (errors.length) {
  for (const error of errors) console.error(`[FAIL] ${error}`);
  process.exit(1);
}

console.log(checkOnly ? 'Plugin payloads are in sync.' : 'Plugin payloads synced.');
