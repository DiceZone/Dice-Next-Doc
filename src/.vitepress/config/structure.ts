import type { DefaultTheme } from 'vitepress'

// 文档站的四个语言版本。root 为简体中文，其余语言放在同名子目录下。
export type LocaleKey = 'root' | 'zh-hant' | 'en' | 'ja'
export const LOCALES: LocaleKey[] = ['root', 'zh-hant', 'en', 'ja']

type Text = Record<LocaleKey, string>

interface Page { text: Text; link: string }
interface Group { text: Text; items: Page[] }
interface Section { key: string; text: Text; base: string; items: (Page | Group)[] }

const t = (root: string, hant: string, en: string, ja: string): Text => ({ root, 'zh-hant': hant, en, ja })

// 侧边栏与顶栏下拉菜单共用的目录结构。新增页面时只需在这里加一行。
export const SECTIONS: Section[] = [
  {
    key: 'guide', base: '/guide', text: t('快速开始', '快速開始', 'Getting Started', 'はじめに'),
    items: [
      { text: t('概览', '概覽', 'Overview', '概要'), link: '/index' },
      { text: t('安装部署', '安裝部署', 'Installation', 'インストール'), link: '/install' },
      { text: t('快速开始', '快速開始', 'Quick Start', 'クイックスタート'), link: '/quickstart' },
      { text: t('部署与运维', '部署與維運', 'Deployment & Operations', 'デプロイと運用'), link: '/deploy' },
      { text: t('数据迁移', '資料遷移', 'Data Migration', 'データ移行'), link: '/migration' },
      { text: t('故障排查', '疑難排解', 'Troubleshooting', 'トラブルシューティング'), link: '/troubleshooting' }
    ]
  },
  {
    key: 'config', base: '/config', text: t('配置', '設定', 'Configuration', '設定'),
    items: [
      { text: t('基础配置', '基礎設定', 'Basic Configuration', '基本設定'), link: '/basic' },
      { text: t('适配器配置', '適配器設定', 'Adapter Configuration', 'アダプター設定'), link: '/adapter' }
    ]
  },
  {
    key: 'use', base: '/use', text: t('使用手册', '使用手冊', 'User Guide', '使い方'),
    items: [
      { text: t('掷骰与检定', '擲骰與檢定', 'Dice & Checks', 'ダイスと判定'), link: '/dice' },
      { text: t('角色卡管理', '角色卡管理', 'Character Sheets', 'キャラクターシート'), link: '/card' },
      { text: t('云服务与身份绑定', '雲端服務與身分綁定', 'Cloud Services & Identity', 'クラウドと本人確認'), link: '/cloud' },
      { text: t('牌堆与随机', '牌堆與隨機', 'Decks & Randomness', 'デッキとランダム'), link: '/deck' },
      { text: t('规则速查', '規則速查', 'Rules Reference', 'ルール早見'), link: '/rules' },
      { text: t('CoC7 Keeper Companion', 'CoC7 Keeper Companion', 'CoC7 Keeper Companion', 'CoC7 Keeper Companion'), link: '/coc7r' },
      { text: t('娱乐与互动', '娛樂與互動', 'Fun & Interaction', '娯楽と交流'), link: '/fun' },
      { text: t('团务管理', '團務管理', 'Campaign Management', 'セッション管理'), link: '/game' },
      { text: t('跑团记录', '跑團記錄', 'Session Logs', 'セッションログ'), link: '/log' },
      { text: t('关键词回复', '關鍵字回覆', 'Keyword Replies', 'キーワード返信'), link: '/reply' },
      { text: t('群管与系统', '群管與系統', 'Group & System Admin', 'グループ管理とシステム'), link: '/admin' },
      { text: t('帮助与语言', '幫助與語言', 'Help & Language', 'ヘルプと言語'), link: '/help' }
    ]
  },
  {
    key: 'manage', base: '/manage', text: t('管理面板', '管理面板', 'Web Panel', '管理パネル'),
    items: [
      { text: t('面板总览', '面板總覽', 'Dashboard', 'ダッシュボード'), link: '/dashboard' },
      { text: t('适配器管理', '適配器管理', 'Adapters', 'アダプター管理'), link: '/adapter-manager' },
      { text: t('规则管理', '規則管理', 'Rules', 'ルール管理'), link: '/rules' },
      {
        text: t('高级回复', '進階回覆', 'Advanced Replies', '高度な返信'),
        items: [
          { text: t('自定义回复', '自訂回覆', 'Custom Replies', 'カスタム返信'), link: '/replies' },
          { text: t('卡片与按钮', '卡片與按鈕', 'Cards & Buttons', 'カードとボタン'), link: '/cards-buttons' }
        ]
      },
      { text: t('指令列表', '指令列表', 'Commands', 'コマンド一覧'), link: '/commands' },
      { text: t('群组管理', '群組管理', 'Groups', 'グループ管理'), link: '/groups' },
      { text: t('玩家管理', '玩家管理', 'Players', 'プレイヤー管理'), link: '/players' },
      { text: t('文件管理', '檔案管理', 'Files', 'ファイル管理'), link: '/files' },
      { text: t('权限设置', '權限設定', 'Permissions', '権限設定'), link: '/permissions' },
      { text: t('通知设置', '通知設定', 'Notifications', '通知設定'), link: '/notice' },
      { text: t('定时任务', '定時任務', 'Scheduled Tasks', '定期タスク'), link: '/schedules' },
      { text: t('人工智能', '人工智能', 'AI', 'AI'), link: '/ai' },
      { text: t('插件管理', '插件管理', 'Plugins', 'プラグイン管理'), link: '/plugins' },
      { text: t('帮助文档', '幫助文件', 'Help Documents', 'ヘルプ文書'), link: '/help-docs' },
      { text: t('指令测试', '指令測試', 'Command Playground', 'コマンドテスト'), link: '/playground' },
      { text: t('基础设置', '基礎設定', 'Settings', '基本設定'), link: '/settings' },
      { text: t('云服务', '雲端服務', 'Cloud Services', 'クラウドサービス'), link: '/cloud-services' },
      { text: t('MCP 服务', 'MCP 服務', 'MCP Server', 'MCP サービス'), link: '/mcp' }
    ]
  },
  {
    key: 'develop', base: '/develop', text: t('开发', '開發', 'Development', '開発'),
    items: [
      { text: t('系统架构', '系統架構', 'Architecture', 'システム構成'), link: '/architecture' },
      { text: t('插件开发快速上手', '插件開發快速上手', 'Plugin Quick Start', 'プラグイン開発入門'), link: '/plugin-quickstart' },
      { text: t('JS 插件 API 参考', 'JS 插件 API 參考', 'JS Plugin API', 'JS プラグイン API'), link: '/js-plugin-api' },
      { text: t('QQ 官方 API v2 能力', 'QQ 官方 API v2 能力', 'QQ Official API v2', 'QQ 公式 API v2'), link: '/qq-official-api' },
      { text: t('Lua mod 参考', 'Lua mod 參考', 'Lua Mod Reference', 'Lua mod リファレンス'), link: '/lua-mod' },
      { text: t('规则包编写', '規則包編寫', 'Writing Rule Packs', 'ルールパックの作成'), link: '/rulepack' },
      { text: t('实战：转化海豹规则插件', '實戰：轉換海豹規則插件', 'Example: Converting a SealDice Plugin', '実例：SealDice プラグインの変換'), link: '/rulepack-example-fu' },
      { text: t('从源码构建', '從原始碼建置', 'Building from Source', 'ソースからビルド'), link: '/build' },
      { text: t('API 参考', 'API 參考', 'API Reference', 'API リファレンス'), link: '/api' },
      { text: t('适配器开发', '適配器開發', 'Adapter Development', 'アダプター開発'), link: '/adapter-dev' },
      { text: t('贡献指南', '貢獻指南', 'Contributing', 'コントリビュート'), link: '/contribution' }
    ]
  },
  {
    key: 'other', base: '/other', text: t('其他', '其他', 'More', 'その他'),
    items: [
      { text: t('开发计划', '開發計劃', 'Roadmap', 'ロードマップ'), link: '/roadmap' },
      { text: t('关于项目', '關於專案', 'About', 'プロジェクトについて'), link: '/about' },
      { text: t('更新日志', '更新日誌', 'Changelog', '更新履歴'), link: '/changelog' },
      { text: t('开源协议', '開源協議', 'License', 'ライセンス'), link: '/license' }
    ]
  }
]

export const prefixOf = (locale: LocaleKey) => (locale === 'root' ? '' : `/${locale}`)

function isGroup(item: Page | Group): item is Group {
  return 'items' in item
}

export function sidebar(locale: LocaleKey): DefaultTheme.SidebarItem[] {
  const prefix = prefixOf(locale)
  return SECTIONS.map(section => ({
    text: section.text[locale],
    base: prefix + section.base,
    collapsed: true,
    items: section.items.map(item => isGroup(item)
      ? { text: item.text[locale], collapsed: true, items: item.items.map(p => ({ text: p.text[locale], link: p.link })) }
      : { text: item.text[locale], link: item.link })
  }))
}

// 顶栏：鼠标悬浮时展开二级目录。「快速开始」下拉同时收纳「配置」分组。
export function nav(locale: LocaleKey): DefaultTheme.NavItem[] {
  const prefix = prefixOf(locale)
  const link = (section: Section, page: Page) => prefix + section.base + page.link
  const entries = (section: Section): (DefaultTheme.NavItemWithLink | DefaultTheme.NavItemChildren)[] =>
    section.items.map(item => isGroup(item)
      ? { text: item.text[locale], items: item.items.map(p => ({ text: p.text[locale], link: link(section, p) })) }
      : { text: item.text[locale], link: link(section, item) })
  const byKey = (key: string) => SECTIONS.find(s => s.key === key)!
  const guide = byKey('guide')
  const config = byKey('config')
  return [
    {
      text: guide.text[locale],
      activeMatch: `^${prefix}/(guide|config)/`,
      items: [
        { text: guide.text[locale], items: entries(guide) as DefaultTheme.NavItemWithLink[] },
        { text: config.text[locale], items: entries(config) as DefaultTheme.NavItemWithLink[] }
      ]
    },
    ...['use', 'manage', 'develop', 'other'].map(key => {
      const section = byKey(key)
      return { text: section.text[locale], activeMatch: `^${prefix}${section.base}/`, items: entries(section) }
    })
  ]
}
