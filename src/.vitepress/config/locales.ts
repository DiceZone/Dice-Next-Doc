import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'
import { nav, sidebar, type LocaleKey } from './structure'

type LocaleConfig = LocaleSpecificConfig<DefaultTheme.Config> & { label: string; link?: string }

interface Strings {
  label: string
  lang: string
  description: string
  editLink: string
  prev: string
  next: string
  outline: string
  lastUpdated: string
  langMenu: string
  returnToTop: string
  sidebarMenu: string
  darkMode: string
  lightTitle: string
  darkTitle: string
  footer: string
  notFoundTitle: string
  notFoundQuote: string
  notFoundLink: string
  skipToContent: string
}

const STRINGS: Record<LocaleKey, Strings> = {
  root: {
    label: '简体中文',
    lang: 'zh-CN',
    description: '新一代 TRPG 骰子机器人 · QQ / Discord / KOOK 多平台 · 前后端分离 · 即插即用',
    editLink: '在 GitHub 上编辑此页面',
    prev: '上一页',
    next: '下一页',
    outline: '页面导航',
    lastUpdated: '最后更新于',
    langMenu: '切换语言',
    returnToTop: '回到顶部',
    sidebarMenu: '菜单',
    darkMode: '主题',
    lightTitle: '切换到浅色模式',
    darkTitle: '切换到深色模式',
    footer: '基于 AGPLv3 协议发布',
    notFoundTitle: '页面不存在',
    notFoundQuote: '这个页面可能已移动或删除。',
    notFoundLink: '返回首页',
    skipToContent: '跳到正文'
  },
  'zh-hant': {
    label: '繁體中文',
    lang: 'zh-TW',
    description: '新一代 TRPG 骰子機器人 · QQ / Discord / KOOK 多平台 · 前後端分離 · 即插即用',
    editLink: '在 GitHub 上編輯此頁面',
    prev: '上一頁',
    next: '下一頁',
    outline: '頁面導覽',
    lastUpdated: '最後更新於',
    langMenu: '切換語言',
    returnToTop: '回到頂部',
    sidebarMenu: '選單',
    darkMode: '主題',
    lightTitle: '切換到淺色模式',
    darkTitle: '切換到深色模式',
    footer: '以 AGPLv3 授權發布',
    notFoundTitle: '頁面不存在',
    notFoundQuote: '這個頁面可能已移動或刪除。',
    notFoundLink: '返回首頁',
    skipToContent: '跳到正文'
  },
  en: {
    label: 'English',
    lang: 'en-US',
    description: 'A next-generation TRPG dice bot · QQ / Discord / KOOK · Separate backend and web panel · Ready to run',
    editLink: 'Edit this page on GitHub',
    prev: 'Previous page',
    next: 'Next page',
    outline: 'On this page',
    lastUpdated: 'Last updated',
    langMenu: 'Change language',
    returnToTop: 'Return to top',
    sidebarMenu: 'Menu',
    darkMode: 'Appearance',
    lightTitle: 'Switch to light theme',
    darkTitle: 'Switch to dark theme',
    footer: 'Released under the AGPLv3 License',
    notFoundTitle: 'Page not found',
    notFoundQuote: 'This page may have been moved or deleted.',
    notFoundLink: 'Back to home',
    skipToContent: 'Skip to content'
  },
  ja: {
    label: '日本語',
    lang: 'ja-JP',
    description: '次世代の TRPG ダイスボット · QQ / Discord / KOOK 対応 · バックエンドと Web パネルを分離 · すぐに使える',
    editLink: 'GitHub でこのページを編集',
    prev: '前のページ',
    next: '次のページ',
    outline: 'このページの内容',
    lastUpdated: '最終更新',
    langMenu: '言語を切り替え',
    returnToTop: 'トップに戻る',
    sidebarMenu: 'メニュー',
    darkMode: '外観',
    lightTitle: 'ライトテーマに切り替え',
    darkTitle: 'ダークテーマに切り替え',
    footer: 'AGPLv3 ライセンスで公開',
    notFoundTitle: 'ページが見つかりません',
    notFoundQuote: 'このページは移動または削除された可能性があります。',
    notFoundLink: 'ホームに戻る',
    skipToContent: '本文へスキップ'
  }
}

function localeConfig(locale: LocaleKey): LocaleConfig {
  const s = STRINGS[locale]
  return {
    label: s.label,
    lang: s.lang,
    ...(locale === 'root' ? {} : { link: `/${locale}/` }),
    description: s.description,
    themeConfig: {
      nav: nav(locale),
      sidebar: sidebar(locale),
      editLink: {
        // 繁体中文页由简体中文自动生成，编辑链接指向简体中文原文。
        pattern: locale === 'zh-hant'
          ? ({ filePath }) => `https://github.com/DiceZone/Dice-Next-Doc/edit/main/src/${filePath.replace(/^zh-hant\//, '')}`
          : 'https://github.com/DiceZone/Dice-Next-Doc/edit/main/src/:path',
        text: s.editLink
      },
      docFooter: { prev: s.prev, next: s.next },
      outline: { label: s.outline },
      lastUpdated: {
        text: s.lastUpdated,
        formatOptions: { dateStyle: 'short', timeStyle: 'medium' }
      },
      langMenuLabel: s.langMenu,
      returnToTopLabel: s.returnToTop,
      sidebarMenuLabel: s.sidebarMenu,
      darkModeSwitchLabel: s.darkMode,
      lightModeSwitchTitle: s.lightTitle,
      darkModeSwitchTitle: s.darkTitle,
      skipToContentLabel: s.skipToContent,
      notFound: {
        title: s.notFoundTitle,
        quote: s.notFoundQuote,
        linkText: s.notFoundLink,
        linkLabel: s.notFoundLink
      },
      footer: {
        message: s.footer,
        copyright: 'Copyright © 2025-2026 Dice!Next'
      }
    }
  }
}

export const locales = Object.fromEntries(
  (['root', 'zh-hant', 'en', 'ja'] as LocaleKey[]).map(key => [key, localeConfig(key)])
)

// 本地搜索框的界面文字。
export const searchLocales = {
  root: {
    translations: {
      button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
      modal: {
        displayDetails: '显示详细列表',
        resetButtonTitle: '清除查询条件',
        backButtonTitle: '关闭搜索',
        noResultsText: '没有找到相关结果',
        footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' }
      }
    }
  },
  'zh-hant': {
    translations: {
      button: { buttonText: '搜尋文件', buttonAriaLabel: '搜尋文件' },
      modal: {
        displayDetails: '顯示詳細列表',
        resetButtonTitle: '清除查詢條件',
        backButtonTitle: '關閉搜尋',
        noResultsText: '找不到相關結果',
        footer: { selectText: '選擇', navigateText: '切換', closeText: '關閉' }
      }
    }
  },
  ja: {
    translations: {
      button: { buttonText: 'ドキュメントを検索', buttonAriaLabel: 'ドキュメントを検索' },
      modal: {
        displayDetails: '詳細リストを表示',
        resetButtonTitle: '検索条件をクリア',
        backButtonTitle: '検索を閉じる',
        noResultsText: '一致する結果がありません',
        footer: { selectText: '選択', navigateText: '移動', closeText: '閉じる' }
      }
    }
  }
}
