// 由简体中文页面生成繁体中文（台湾用语）版本，输出到 src/zh-hant/。
// 用法：npm run i18n:hant（构建前会自动运行）。
// 生成的文件不要手工修改；要改繁体用词，请调整下面的 TERMS。
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, relative, sep } from 'node:path'
import * as OpenCC from 'opencc-js'
import { SRC, localizeLinks, mapProse, rootPages } from './i18n-shared.mjs'

const OUT = join(SRC, 'zh-hant')
const convert = OpenCC.Converter({ from: 'cn', to: 'twp' })

// OpenCC 台湾用语之后，再统一成管理面板繁体界面使用的名称，方便对照查找。
const TERMS = [
  ['介面卡', '適配器'],
  ['配接器', '適配器'],
  ['外掛程式', '插件'],
  ['外掛', '插件'],
  ['人工智慧', '人工智能'],
  ['通訊協定', '協議'],
  ['協定', '協議'],
  ['紀錄', '記錄'],
  ['擴充套件', '擴展'],
  ['映象', '映像'],
  ['回撥', '回呼'],
  ['自定義', '自訂'],
  ['例項', '實例']
]

const NOTICE = '<!-- 本页由 scripts/i18n-hant.mjs 根据简体中文版自动生成，请修改简体中文原文后重新生成。 -->'

export function toHant(text) {
  let out = convert(text)
  for (const [from, to] of TERMS) out = out.split(from).join(to)
  return out
}

export function buildPage(source) {
  let body = source.replace(/\r\n/g, '\n')
  let front = ''
  const fm = body.match(/^---\n[\s\S]*?\n---\n/)
  if (fm) {
    front = fm[0]
    body = body.slice(front.length)
  }
  front = localizeLinks(toHant(front), 'zh-hant')
  body = localizeLinks(mapProse(body, toHant), 'zh-hant')
  return `${front}${front ? '\n' : ''}${NOTICE}\n\n${body.replace(/^\n+/, '')}`
}

async function listGenerated(dir) {
  const out = []
  try {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) out.push(...await listGenerated(full))
      else if (entry.name.endsWith('.md')) out.push(full)
    }
  } catch {}
  return out
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('i18n-hant.mjs')) {
  const pages = await rootPages()
  const expected = new Set()
  for (const rel of pages) {
    const target = join(OUT, rel)
    expected.add(target)
    const source = await readFile(join(SRC, rel), 'utf8')
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, buildPage(source), 'utf8')
  }
  // 删除简体中文已不存在的旧页面。
  for (const file of await listGenerated(OUT)) {
    if (!expected.has(file)) {
      await rm(file)
      console.log('removed', relative(SRC, file).split(sep).join('/'))
    }
  }
  console.log(`zh-hant: ${pages.length} pages generated`)
}
