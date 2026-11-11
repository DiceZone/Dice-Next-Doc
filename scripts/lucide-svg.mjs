// 输出 Lucide 图标的 SVG 字符串，用于首页 features 的 icon.svg。
// 用法：node scripts/lucide-svg.mjs dices languages ...
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const root = dirname(require.resolve('lucide-vue-next/package.json'))

for (const name of process.argv.slice(2)) {
  const source = await readFile(join(root, 'dist/esm/icons', `${name}.js`), 'utf8')
  const match = source.match(/createLucideIcon\("[^"]+",\s*(\[[\s\S]*?\])\);/)
  if (!match) throw new Error(`icon not found: ${name}`)
  const nodes = Function(`return ${match[1]}`)()
  const body = nodes.map(([tag, attrs]) => {
    const list = Object.entries(attrs).filter(([key]) => key !== 'key').map(([key, value]) => `${key}="${value}"`).join(' ')
    return `<${tag} ${list}/>`
  }).join('')
  console.log(`${name}\t<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`)
}
