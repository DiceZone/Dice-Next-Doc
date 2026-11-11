// 检查多语言版本是否齐全：
// 1. 每个简体中文页面都有 zh-hant / en / ja 版本；
// 2. 繁体中文版与简体中文原文一致（否则请运行 npm run i18n:hant）；
// 3. 英文、日文页面里的站内链接都指向同语言页面；
// 4. 英文、日文版本比简体中文旧时给出提示（按 git 最近提交时间）。
// 用法：npm run i18n:check
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { SRC, rootPages, unlocalizedLinks } from './i18n-shared.mjs'
import { buildPage } from './i18n-hant.mjs'

const errors = []
const warnings = []

function lastCommit(rel) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%ct', '--', join('src', rel)], { encoding: 'utf8' }).trim()
    return out ? Number(out) : 0
  } catch {
    return 0
  }
}

for (const rel of await rootPages()) {
  const source = await readFile(join(SRC, rel), 'utf8')
  const hant = join(SRC, 'zh-hant', rel)
  if (!existsSync(hant)) errors.push(`zh-hant/${rel}: missing`)
  else if ((await readFile(hant, 'utf8')) !== buildPage(source)) errors.push(`zh-hant/${rel}: out of date, run npm run i18n:hant`)
  const rootTime = lastCommit(rel)
  for (const locale of ['en', 'ja']) {
    const file = join(SRC, locale, rel)
    if (!existsSync(file)) {
      errors.push(`${locale}/${rel}: missing`)
      continue
    }
    for (const link of unlocalizedLinks(await readFile(file, 'utf8'))) {
      errors.push(`${locale}/${rel}: link ${link} points to the Simplified Chinese page`)
    }
    const time = lastCommit(`${locale}/${rel}`)
    if (rootTime && time && time < rootTime) warnings.push(`${locale}/${rel}: older than the Simplified Chinese page`)
  }
}

for (const w of warnings) console.warn(`warning: ${w}`)
for (const e of errors) console.error(`error: ${e}`)
if (errors.length) process.exit(1)
console.log(`i18n check passed (${warnings.length} warnings)`)
