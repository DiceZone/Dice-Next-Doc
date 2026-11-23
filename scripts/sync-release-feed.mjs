import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RELEASES_API = 'https://api.github.com/repos/DiceZone/Dice-Next/releases?per_page=30';
const tagPattern = /^v\d+\.\d+\.\d+(?:-beta\.\d+)?$/;
const platforms = ['windows-amd64', 'windows-arm64', 'linux-amd64', 'linux-arm64', 'macos-arm64'];

export function releaseFeed(payload) {
  if (!Array.isArray(payload)) throw new Error('Expected GitHub release list');
  const seen = new Set();
  const releases = payload.filter(r => {
    if (!r || r.draft || !tagPattern.test(r.tag_name) || seen.has(r.tag_name)) return false;
    if (r.html_url !== `https://github.com/DiceZone/Dice-Next/releases/tag/${r.tag_name}`) return false;
    if (typeof r.published_at !== 'string' || !Number.isFinite(Date.parse(r.published_at))) return false;
    const files = new Set((r.assets || []).filter(a => a.state === 'uploaded' && a.size > 0).map(a => a.name));
    if (!files.has('update-manifest.json') || !files.has('release-sources.json')) return false;
    if (!platforms.every(p => [...files].some(n => n.startsWith('DiceNext-') && n.includes(`-${p}-`) && n.endsWith(p.startsWith('windows') ? '.zip' : '.tar.gz')))) return false;
    seen.add(r.tag_name);
    return true;
  }).sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at)).slice(0, 5).map(r => {
    let body = typeof r.body === 'string' ? r.body : '';
    for (const marker of ['## 源码与完整比较', '## Source', '<details>']) body = body.split(marker)[0];
    return { tag_name: r.tag_name, html_url: r.html_url, published_at: r.published_at,
      body: [...body.trim()].slice(0, 16000).join('') };
  });
  if (!releases.length) throw new Error('No complete published releases; keeping the existing feed');
  return { schema: 1, repository: 'DiceZone/Dice-Next', releases };
}

export async function syncReleaseFeed({ input, output = 'src/public/releases.json' } = {}) {
  let payload;
  if (input) payload = JSON.parse(await readFile(input, 'utf8'));
  else {
    const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'DiceNext-Docs' };
    if (process.env.GH_TOKEN) headers.Authorization = `Bearer ${process.env.GH_TOKEN}`;
    const response = await fetch(RELEASES_API, { headers, redirect: 'follow', signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`GitHub releases HTTP ${response.status}`);
    payload = await response.json();
  }
  const text = JSON.stringify(releaseFeed(payload), null, 2) + '\n';
  let current = '';
  try { current = (await readFile(output, 'utf8')).replace(/\r\n/g, '\n'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  if (text === current) return false;
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output + '.tmp', text);
  await rename(output + '.tmp', output);
  return true;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const index = process.argv.indexOf('--input');
  await syncReleaseFeed({ input: index < 0 ? undefined : process.argv[index + 1] });
}
