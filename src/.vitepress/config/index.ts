import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import { zh } from './zh'

export default withMermaid(
  defineConfig({
    ...zh,
    themeConfig: {
      ...zh.themeConfig,
    },
  })
)
