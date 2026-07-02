#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  injectHighlights,
  requestHighlights,
  sanitizeHighlights,
  topReleasedSection,
} from './draft-highlights.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const CHANGELOG = [
  '# Changelog',
  '',
  '## [Unreleased]',
  '',
  '## [0.3.0] (2026-07-02)',
  '',
  '### Added',
  '',
  '- A new thing.',
  '',
  '### Fixed',
  '',
  '- A fix.',
  '',
  '## [0.2.0] (2026-05-21)',
  '',
  '### Added',
  '',
  '- Old thing.',
  '',
].join('\n');

test('topReleasedSection targets the first versioned section, not [Unreleased]', () => {
  const section = topReleasedSection(CHANGELOG);
  assert.ok(section);
  assert.equal(section.header, '## [0.3.0] (2026-07-02)');
  assert.match(section.body, /### Added\n\n- A new thing\./);
  assert.match(section.body, /### Fixed\n\n- A fix\./);
  assert.ok(!section.body.includes('0.2.0'), 'body must stop before the next version');
});

test('injectHighlights inserts after the header and is idempotent', () => {
  const section = topReleasedSection(CHANGELOG);
  const once = injectHighlights(CHANGELOG, section, '- First\n- Second');
  assert.match(once, /## \[0\.3\.0\] \(2026-07-02\)\n\n### Highlights\n\n- First\n- Second\n\n### Added/);

  const twice = injectHighlights(once, topReleasedSection(once), '- Only');
  assert.equal((twice.match(/### Highlights/g) || []).length, 1, 're-run must not duplicate');
  assert.match(twice, /### Highlights\n\n- Only\n\n### Added/);
  assert.ok(!twice.includes('- First'), 're-run must replace the old block');
});

test('sanitizeHighlights drops a code fence and strips em-dashes', () => {
  const raw = '```markdown\n- Multilingual support — six languages\n```';
  assert.equal(sanitizeHighlights(raw), '- Multilingual support, six languages');
});

test('requestHighlights sends the bearer key and model, then returns sanitized content', async (t) => {
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  let seenUrl;
  let seenAuth;
  let seenModel;
  globalThis.fetch = async (url, init) => {
    seenUrl = url;
    seenAuth = init.headers.Authorization;
    seenModel = JSON.parse(init.body).model;
    return new Response(
      JSON.stringify({
        choices: [{ message: { content: '- Multilingual — six languages\n- ChatGPT distribution' } }],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  };

  const bullets = await requestHighlights('the changelog body', {
    apiKey: 'secret-key',
    model: 'deepseek-chat',
    baseUrl: 'https://api.deepseek.com',
  });
  assert.equal(seenUrl, 'https://api.deepseek.com/chat/completions');
  assert.equal(seenAuth, 'Bearer secret-key');
  assert.equal(seenModel, 'deepseek-chat');
  assert.equal(bullets, '- Multilingual, six languages\n- ChatGPT distribution');
});

test('requestHighlights throws on a non-200 response so the caller can skip', async (t) => {
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  globalThis.fetch = async () => new Response('nope', { status: 500 });
  await assert.rejects(
    requestHighlights('body', { apiKey: 'k', model: 'm', baseUrl: 'https://x' }),
    /HTTP 500/
  );
});

test('without DEEPSEEK_API_KEY the CLI skips and leaves CHANGELOG unchanged', (t) => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'slopornot-highlights-'));
  t.after(() => fs.rmSync(fixture, { recursive: true, force: true }));
  fs.mkdirSync(path.join(fixture, 'scripts'), { recursive: true });
  fs.copyFileSync(
    path.join(repoRoot, 'scripts/draft-highlights.mjs'),
    path.join(fixture, 'scripts/draft-highlights.mjs')
  );
  fs.writeFileSync(path.join(fixture, 'CHANGELOG.md'), CHANGELOG);

  const result = spawnSync(process.execPath, [path.join(fixture, 'scripts/draft-highlights.mjs')], {
    encoding: 'utf8',
    env: { ...process.env, DEEPSEEK_API_KEY: '' },
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /\[skip\] DEEPSEEK_API_KEY not set/);
  assert.equal(fs.readFileSync(path.join(fixture, 'CHANGELOG.md'), 'utf8'), CHANGELOG);
});
