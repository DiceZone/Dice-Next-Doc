// Checks in-site links with #anchors against the heading slugs VitePress will generate.
// Usage: node scripts/i18n-anchors.mjs [--fix]
// --fix rewrites an anchor when it matches a heading after normalization (e.g. NFKD, leading digit).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src')
const fix = process.argv.includes('--fix')

// Same as VitePress 1.6 (markdown-it anchor slugify).
const rControl = /[\u0000-\u001f]/g
const rSpecial = /[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g
const rCombining = /[̀-ͯ]/g
const slugify = (s) => s.normalize('NFKD').replace(rCombining, '').replace(rControl, '')
  .replace(rSpecial, '-').replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '')
  .replace(/^(\d)/, '_$1').toLowerCase()

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'public') continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (e.name.endsWith('.md')) out.push(p)
  }
  return out
}

function stripCode(text) {
  return text.replace(/^(```|~~~)[\s\S]*?^\1/gm, (m) => m.replace(/[^\n]/g, ' '))
}

function headingText(raw) {
  return raw
    .replace(/<[^>]+>/g, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/(\*\*|__|\*|_)(.+?)\1/g, '$2')
    .trim()
}

const files = walk(root)
const slugsOf = new Map()
for (const f of files) {
  const text = stripCode(fs.readFileSync(f, 'utf8'))
  const seen = new Map()
  const set = new Set()
  for (const m of text.matchAll(/^#{1,6}\s+(.+?)\s*$/gm)) {
    let raw = m[1]
    let id
    const custom = raw.match(/\s*\{#([^}]+)\}\s*$/)
    if (custom) { id = custom[1]; raw = raw.slice(0, custom.index) }
    else {
      id = slugify(headingText(raw))
      const n = seen.get(id) ?? 0
      seen.set(id, n + 1)
      if (n) id = `${id}-${n}`
    }
    set.add(id)
  }
  slugsOf.set(path.resolve(f), set)
}

function resolveTarget(from, href) {
  if (href.startsWith('#') || href === '') return path.resolve(from)
  let p = href.replace(/\.html$/, '').replace(/\.md$/, '')
  let abs = p.startsWith('/') ? path.join(root, p) : path.resolve(path.dirname(from), p)
  const cands = [abs + '.md', path.join(abs, 'index.md')]
  if (abs.endsWith(path.sep) || p.endsWith('/')) cands.unshift(path.join(abs, 'index.md'))
  return cands.find((c) => slugsOf.has(path.resolve(c)))
}

let bad = 0, fixed = 0
for (const f of files) {
  const original = fs.readFileSync(f, 'utf8')
  const codeMasked = stripCode(original)
  let out = ''
  let last = 0
  const re = /\]\(([^)\s]*?)#([^)\s]+)\)/g
  for (const m of codeMasked.matchAll(re)) {
    const [, href, anchorRaw] = m
    if (/^[a-z]+:/i.test(href)) continue
    const target = resolveTarget(f, href)
    if (!target) continue
    const slugs = slugsOf.get(path.resolve(target))
    let anchor
    try { anchor = decodeURIComponent(anchorRaw) } catch { anchor = anchorRaw }
    if (slugs.has(anchor)) continue
    const guess = slugify(anchor)
    const rel = path.relative(root, f)
    if (slugs.has(guess) && fix) {
      const start = m.index + 2 + href.length + 1
      out += original.slice(last, start) + guess
      last = start + anchorRaw.length
      fixed++
      continue
    }
    bad++
    console.log(`${rel}: #${anchor} → ${path.relative(root, target)}${slugs.has(guess) ? ` (use #${guess})` : ''}`)
  }
  if (last) fs.writeFileSync(f, out + original.slice(last))
}
console.log(`${bad} broken anchor(s)${fix ? `, ${fixed} fixed` : ''}`)
process.exitCode = bad ? 1 : 0
