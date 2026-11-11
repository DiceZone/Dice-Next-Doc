// 文档站多语言脚本的共用工具。
import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export const SRC = fileURLToPath(new URL('../src/', import.meta.url))
export const LOCALE_DIRS = ['zh-hant', 'en', 'ja']
// 只为兼容旧地址保留的跳转页，不需要其他语言版本。
export const SKIP_PAGES = new Set(['other/other/roadmap.md'])

// 列出简体中文（根目录）的全部页面，返回相对 src 的路径（使用 /）。
export async function rootPages() {
  const out = []
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      const rel = relative(SRC, full).split(sep).join('/')
      if (entry.isDirectory()) {
        if (entry.name.startsWith('.') || entry.name === 'public' || LOCALE_DIRS.includes(rel)) continue
        await walk(full)
      } else if (entry.name.endsWith('.md') && !SKIP_PAGES.has(rel)) {
        out.push(rel)
      }
    }
  }
  await walk(SRC)
  return out.sort()
}

// 站内链接是否指向一个文档页（而不是 /logo.svg 这类静态资源）。
export function isDocPage(path) {
  let p = path.replace(/[?#].*$/, '').replace(/^\//, '')
  if (p === '' ) return true
  p = p.replace(/\.(html|md)$/, '')
  if (p.endsWith('/')) p += 'index'
  return existsSync(join(SRC, `${p}.md`)) || existsSync(join(SRC, p, 'index.md'))
}

function localizePath(path, locale) {
  if (!path.startsWith('/') || path.startsWith('//')) return path
  if (new RegExp(`^/(${LOCALE_DIRS.join('|')})(/|$)`).test(path)) return path
  if (!isDocPage(path)) return path
  return `/${locale}${path}`
}

// 把正文里指向简体中文页面的站内链接改成指定语言的链接。
// 代码块与行内代码保持原样。
export function localizeLinks(text, locale) {
  return mapProse(text, prose => prose
    .replace(/(\]\()(\/[^)\s]*)/g, (_, head, path) => head + localizePath(path, locale))
    .replace(/(href=")(\/[^"]*)/g, (_, head, path) => head + localizePath(path, locale))
    .replace(/^(\s*\[[^\]]+\]:\s*)(\/\S+)/gm, (_, head, path) => head + localizePath(path, locale))
    .replace(/^(\s*link:\s*)(\/\S+)/gm, (_, head, path) => head + localizePath(path, locale)))
}

// 找出仍指向简体中文页面的站内链接（用于检查译文）。
export function unlocalizedLinks(text) {
  const found = []
  mapProse(text, prose => {
    for (const re of [/\]\((\/[^)\s]*)/g, /href="(\/[^"]*)/g, /^\s*\[[^\]]+\]:\s*(\/\S+)/gm, /^\s*link:\s*(\/\S+)/gm]) {
      for (const m of prose.matchAll(re)) {
        const path = m[1]
        if (new RegExp(`^/(${LOCALE_DIRS.join('|')})(/|$)`).test(path)) continue
        if (isDocPage(path)) found.push(path)
      }
    }
    return prose
  })
  return found
}

// 对正文（非代码）部分应用 fn。围栏代码块与行内代码原样保留。
export function mapProse(text, fn) {
  const lines = text.split('\n')
  const out = []
  let buffer = []
  let fence = null
  const flush = () => {
    if (buffer.length) out.push(mapInline(buffer.join('\n'), fn))
    buffer = []
  }
  for (const line of lines) {
    const m = line.match(/^\s*(`{3,}|~{3,})/)
    if (fence) {
      out.push(line)
      const close = line.match(/^\s*(`{3,}|~{3,})\s*$/)
      if (close && close[1][0] === fence[0] && close[1].length >= fence.length) fence = null
      continue
    }
    if (m) {
      flush()
      fence = m[1]
      out.push(line)
      continue
    }
    buffer.push(line)
  }
  flush()
  return out.join('\n')
}

function mapInline(text, fn) {
  const parts = text.split(/(`+[^`]*?`+)/g)
  let prose = ''
  const codes = []
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) {
      codes.push(parts[i])
      prose += `\u0000${codes.length - 1}\u0000`
    } else {
      prose += parts[i]
    }
  }
  return fn(prose).replace(/\u0000(\d+)\u0000/g, (_, n) => codes[Number(n)])
}
