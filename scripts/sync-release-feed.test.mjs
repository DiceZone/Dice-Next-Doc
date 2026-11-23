import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { releaseFeed, syncReleaseFeed } from './sync-release-feed.mjs';

const release = (build = 986) => ({
  tag_name: `v3.0.0-beta.${build}`, html_url: `https://github.com/DiceZone/Dice-Next/releases/tag/v3.0.0-beta.${build}`,
  published_at: `2026-11-${build === 986 ? '23' : '22'}T06:00:00Z`, draft: false,
  body: '## 修复\n- 修复登录\n## 源码与完整比较\ninternal details',
  assets: ['windows-amd64', 'windows-arm64', 'linux-amd64', 'linux-arm64', 'macos-arm64'].map(p => ({
    name: `DiceNext-beta-3.0.0-${build}-${p}-2026-11-23.${p.startsWith('windows') ? 'zip' : 'tar.gz'}`,
    state: 'uploaded', size: 100,
  })).concat(['release-sources.json', 'update-manifest.json'].map(name => ({ name, state: 'uploaded', size: 100 }))),
});
test('publishes complete releases newest first without private metadata or full commit history', () => {
  const recent = release(); recent.secret = 'not public';
  const feed = releaseFeed([release(985), recent]);
  assert.equal(feed.schema, 1);
  assert.equal(feed.releases[0].tag_name, recent.tag_name);
  assert.equal(feed.releases[0].body, '## 修复\n- 修复登录');
  assert.equal(JSON.stringify(feed).includes('not public'), false);
});
test('rejects drafts, incomplete uploads, invalid tags and unrelated release links', () => {
  for (const patch of [{ draft: true }, { assets: [] }, { tag_name: '../bad' }, { html_url: 'https://example.com/' }])
    assert.throws(() => releaseFeed([{ ...release(), ...patch }]));
  const missing = release(); missing.assets[0].state = 'new';
  assert.throws(() => releaseFeed([missing]));
});
test('writes only changes and never overwrites a good snapshot on invalid input', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dn-release-feed-'));
  const input = join(dir, 'input.json'), output = join(dir, 'releases.json');
  try {
    await writeFile(input, JSON.stringify([release()]));
    assert.equal(await syncReleaseFeed({ input, output }), true);
    assert.equal(await syncReleaseFeed({ input, output }), false);
    const saved = await readFile(output, 'utf8');
    await writeFile(input, '[]');
    await assert.rejects(syncReleaseFeed({ input, output }));
    assert.equal(await readFile(output, 'utf8'), saved);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
