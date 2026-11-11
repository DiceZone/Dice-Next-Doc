import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import Layout from './Layout.vue'
import Icon from './components/Icon.vue'
import './custom.css'

const LOCALE_KEY = 'dicenext-docs-locale'

function localeOf(path: string) {
  const match = path.match(/^\/(zh-hant|en|ja)(\/|$)/)
  return match ? match[1] : 'root'
}

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app, router }) {
    app.component('Icon', Icon)
    if (typeof window === 'undefined') return
    // 记住访问者正在阅读的语言。之后再打开简体中文链接时，按这里的选择跳转。
    const remember = (path: string) => {
      try { localStorage.setItem(LOCALE_KEY, localeOf(path)) } catch {}
    }
    const previous = router.onAfterRouteChange
    router.onAfterRouteChange = (to: string) => {
      previous?.(to)
      remember(new URL(to, window.location.origin).pathname)
    }
    remember(window.location.pathname)
  }
} satisfies Theme
