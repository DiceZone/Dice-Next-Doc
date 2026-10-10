// Check the runtime command catalog against the backend's source locales.
// This is a read-only check; run with: npm run catalog:check -- <i18n-directory>
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const directory = resolve(process.argv[2] || '../Dice-Next/server/i18n');
const catalog = JSON.parse(await readFile(new URL('../commands.json', import.meta.url), 'utf8'));
const categories = new Set(['掷骰', 'COC', 'DND', '团务', '互动', '工具', '管理', '权限', '系统']);
function flatten(value, prefix = '', out = {}) {
  for (const [name, child] of Object.entries(value)) {
    if (name === '_meta') continue;
    const key = prefix ? `${prefix}.${name}` : name;
    if (typeof child === 'string') out[key] = child;
    else if (child && typeof child === 'object' && !Array.isArray(child)) flatten(child, key, out);
  }
  return out;
}

for (const lang of ['zh-Hans', 'zh-Hant', 'en', 'ja']) {
  const defaults = flatten(JSON.parse(await readFile(resolve(directory, `${lang}.json`), 'utf8')));
  const keys = Object.keys(defaults).filter(key => !key.startsWith('tplvar.'));
  const linked = new Set();
  const identifiers = new Set();
  for (const command of catalog) {
    const title = typeof command.title === 'string' ? command.title : command.title?.[lang] || command.title?.['zh-Hans'];
    assert.ok(title, `${lang}: command has no title`);
    assert.ok(categories.has(command.category), `${title}: unknown category ${command.category}`);
    const id = command.cmd || title;
    assert.ok(!identifiers.has(id), `${lang}: duplicate row ${id}`);
    identifiers.add(id);
    for (const key of command.replyKeys || []) {
      assert.ok(key in defaults, `${lang}: ${title} references missing key ${key}`);
      linked.add(key);
    }
    for (const prefix of command.replyPrefixes || []) {
      const matches = keys.filter(key => key.startsWith(prefix));
      assert.ok(matches.length, `${lang}: ${title} has an empty prefix ${prefix}`);
      matches.forEach(key => linked.add(key));
    }
    for (const key of Object.keys(command.replyExamples || {})) {
      assert.ok(key in defaults, `${lang}: example references missing key ${key}`);
      // The API reads examples from explicit keys, not prefix-only matches.
      assert.ok(command.replyKeys?.includes(key), `${lang}: ${key} example needs replyKeys`);
    }
  }
  const missing = keys.filter(key => !linked.has(key));
  assert.deepEqual(missing, [], `${lang}: editable text is missing from functional tabs`);
  const outcomes = catalog.find(command => command.replyPrefixes?.includes('dice.level.'));
  assert.equal(outcomes?.category, 'COC');
  assert.equal(catalog.find(command => command.cmd === '.ba/.bav')?.category, 'COC');
  const legacy = catalog.find(command => command.replyPrefixes?.includes('legacy_str.'));
  assert.ok(legacy?.replyPrefixes?.includes('self.'));
  const shortcut = catalog.find(command => command.cmd === '.alias');
  assert.equal(shortcut?.category, '工具');
  assert.deepEqual(shortcut?.replyPrefixes, ['shortcut.']);
  const accountAlias = catalog.find(command => command.cmd === '.admin account-alias');
  assert.equal(accountAlias?.category, '权限');
  assert.deepEqual(accountAlias?.replyPrefixes, ['alias.']);
  console.log(`${lang}: all ${keys.length} editable texts linked; catalog keys, categories and examples valid`);
}
