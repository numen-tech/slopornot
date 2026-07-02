#!/usr/bin/env node
// Optionally drafts a "Highlights" summary at the top of the most recent
// released CHANGELOG section using the DeepSeek chat completions API
// (OpenAI-compatible). Meant to run in the prepare-release workflow, after
// prepare-release.mjs has promoted [Unreleased] to a dated version section,
// so the drafted highlights land in the release PR for human review.
//
// Non-blocking by contract: without DEEPSEEK_API_KEY, or on any API/parse
// failure, it leaves CHANGELOG.md unchanged and exits 0. A release is never
// blocked on note polish.
//
// Env:
//   DEEPSEEK_API_KEY   required to run; absent -> skip (exit 0)
//   DEEPSEEK_MODEL     optional, default "deepseek-chat"
//   DEEPSEEK_BASE_URL  optional, default "https://api.deepseek.com"
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const changelogPath = path.join(root, 'CHANGELOG.md');

const SYSTEM_PROMPT = [
  'You are drafting the "Highlights" summary for a software release. You will',
  'be given the raw CHANGELOG entries for one version. Write 3 to 5 concise',
  'Markdown bullet points capturing the most user-visible themes, ordered by',
  'impact.',
  '',
  'Rules:',
  '- Output ONLY the bullet list. No heading, no preamble, no closing remarks.',
  '- Each line starts with "- ".',
  '- Plain, direct language. No marketing tone, no filler.',
  '- Do not use em-dashes. Use commas, colons, or parentheses instead.',
  '- Group related entries into themes rather than restating every line.',
].join('\n');

// Locate the most recent released section: the first "## [X.Y.Z] ..." heading
// (skips "## [Unreleased]", which has no version number) and its body up to
// the next "## [" heading. Returns { header, bodyStart, end, body } or null.
export function topReleasedSection(changelog) {
  const match = /^## \[\d+\.\d+\.\d+\][^\n]*$/m.exec(changelog);
  if (!match) return null;
  const bodyStart = match.index + match[0].length;
  const rest = changelog.slice(bodyStart);
  const nextIndex = rest.search(/\n## \[/);
  const end = nextIndex >= 0 ? bodyStart + nextIndex : changelog.length;
  return { header: match[0], bodyStart, end, body: changelog.slice(bodyStart, end) };
}

// Insert (or replace) a "### Highlights" block immediately after the section
// header. Idempotent: a re-run replaces a previously injected block.
export function injectHighlights(changelog, section, bullets) {
  let body = section.body.replace(/^\n\n### Highlights\n\n[\s\S]*?(?=\n\n### )/, '');
  const insert = `\n\n### Highlights\n\n${bullets.trim()}`;
  return changelog.slice(0, section.bodyStart) + insert + body + changelog.slice(section.end);
}

// Normalize model output into a clean bullet list: drop a wrapping code fence
// and honor the repo's no-em-dash rule as a deterministic safety net.
export function sanitizeHighlights(content) {
  let text = content.trim();
  text = text.replace(/^```[a-z]*\n/i, '').replace(/\n```$/, '').trim();
  text = text.replace(/\s*—\s*/g, ', ');
  return text;
}

export async function requestHighlights(sectionBody, { apiKey, model, baseUrl }) {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: sectionBody },
      ],
    }),
  });
  if (!response.ok) throw new Error(`DeepSeek returned HTTP ${response.status}`);
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content || !content.trim()) throw new Error('DeepSeek returned no content');
  return sanitizeHighlights(content);
}

async function run() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.log('[skip] DEEPSEEK_API_KEY not set; release notes will have no auto-drafted highlights');
    return;
  }
  const changelog = fs.readFileSync(changelogPath, 'utf8');
  const section = topReleasedSection(changelog);
  if (!section) {
    console.log('[skip] no released CHANGELOG section found to summarize');
    return;
  }
  try {
    const bullets = await requestHighlights(section.body, {
      apiKey,
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      baseUrl: (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, ''),
    });
    fs.writeFileSync(changelogPath, injectHighlights(changelog, section, bullets));
    console.log('[OK]   drafted release highlights into CHANGELOG.md');
  } catch (error) {
    console.log(`[skip] highlights drafting failed (${error.message}); continuing without highlights`);
  }
}

const invokedDirectly =
  process.argv[1] &&
  fs.realpathSync(fileURLToPath(import.meta.url)) === fs.realpathSync(process.argv[1]);
if (invokedDirectly) run();
