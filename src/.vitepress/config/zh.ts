import { defineConfig, type DefaultTheme } from 'vitepress'

export const zh = defineConfig({
  lang: 'zh-CN',
  title: 'Dice!Next',
  description: '新一代 TRPG 骰子机器人 · 基于 OneBot v11 协议 · 前后端分离 · 即插即用',

  themeConfig: {
    logo: '/logo.svg',

    nav: nav(),

    sidebar: sidebarGuide(),

    editLink: {
      pattern: 'https://github.com/DiceZone/Dice-Next-Doc/edit/main/src/:path',
      text: '在 GitHub 上编辑此页面'
    },

    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    outline: {
      label: '页面导航'
    },

    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    },

    langMenuLabel: '多语言',
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',

    search: {
      provider: 'local'
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/DiceZone/dice-next' }
    ],

    footer: {
      message: '基于 AGPLv3 协议发布',
      copyright: 'Copyright © 2025-2026 Dice!Next'
    }
  }
})

function nav(): DefaultTheme.NavItem[] {
  return [
    {
      text: '快速开始',
      link: '/guide/index',
      activeMatch: '/guide/'
    },
    {
      text: '使用手册',
      link: '/use/dice',
      activeMatch: '/use/'
    },
    {
      text: '管理面板',
      link: '/manage/dashboard',
      activeMatch: '/manage/'
    },
    {
      text: '开发',
      link: '/develop/architecture',
      activeMatch: '/develop/'
    },
    {
      text: '关于',
      link: '/other/about',
      activeMatch: '/other/'
    }
  ]
}

function sidebarGuide(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: '快速开始',
      base: '/guide',
      collapsed: true,
      items: [
        { text: '概览', link: '/index' },
        { text: '安装部署', link: '/install' },
        { text: '快速开始', link: '/quickstart' },
        { text: '部署与运维', link: '/deploy' },
        { text: '数据迁移', link: '/migration' }
      ]
    },
    {
      text: '配置',
      base: '/config',
      collapsed: true,
      items: [
        { text: '基础配置', link: '/basic' },
        { text: '适配器配置', link: '/adapter' }
      ]
    },
    {
      text: '使用手册',
      base: '/use',
      collapsed: true,
      items: [
        { text: '掷骰与检定', link: '/dice' },
        { text: '角色卡管理', link: '/card' },
        { text: '牌堆与随机', link: '/deck' },
        { text: '规则速查', link: '/rules' },
        { text: '娱乐与互动', link: '/fun' },
        { text: '跑团记录', link: '/log' },
        { text: '关键词回复', link: '/reply' },
        { text: '群管与系统', link: '/admin' }
      ]
    },
    {
      text: '管理面板',
      base: '/manage',
      collapsed: true,
      items: [
        { text: '面板总览', link: '/dashboard' },
        { text: '适配器管理', link: '/adapter-manager' },
        { text: '规则管理', link: '/rules' },
        { text: '回复管理', link: '/replies' },
        { text: '群组管理', link: '/groups' },
        { text: '玩家管理', link: '/players' },
        { text: '定时任务', link: '/schedules' },
        { text: '系统设置', link: '/settings' }
      ]
    },
    {
      text: '开发',
      base: '/develop',
      collapsed: true,
      items: [
        { text: '系统架构', link: '/architecture' },
        { text: '规则包编写', link: '/rulepack' },
        { text: '实战：转化海豹规则插件', link: '/rulepack-example-fu' },
        { text: '从源码构建', link: '/build' },
        { text: 'API 参考', link: '/api' },
        { text: '适配器开发', link: '/adapter-dev' },
        { text: '贡献指南', link: '/contribution' }
      ]
    },
    {
      text: '其他',
      base: '/other',
      collapsed: true,
      items: [
        { text: '开发计划', link: '/roadmap' },
        { text: '关于项目', link: '/about' },
        { text: '更新日志', link: '/changelog' },
        { text: '开源协议', link: '/license' }
      ]
    }
  ]
}
