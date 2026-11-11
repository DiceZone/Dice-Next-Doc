import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import { locales, searchLocales } from './locales'

// 首次进入简体中文（根目录）页面时，按浏览器语言跳到对应语言版本。
// 用户在语言菜单里选过语言后，以选择为准（主题里会记录到 localStorage）。
// 读不到浏览器语言，或浏览器语言不在支持范围内时，保留简体中文。
// 直接打开 /zh-hant/、/en/、/ja/ 的链接不会被改写。
const languageRedirect = `(function () {
  try {
    var path = location.pathname;
    if (/^\\/(zh-hant|en|ja)(\\/|$)/.test(path)) return;
    var target = null;
    try { target = localStorage.getItem('dicenext-docs-locale'); } catch (e) {}
    if (!target) {
      var list = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || ''];
      for (var i = 0; i < list.length && !target; i++) {
        var lang = String(list[i] || '').toLowerCase();
        if (!lang) continue;
        if (lang.indexOf('zh') === 0) {
          target = /^zh-(tw|hk|mo)|^zh-hant/.test(lang) ? 'zh-hant' : 'root';
        } else if (lang.indexOf('en') === 0) {
          target = 'en';
        } else if (lang.indexOf('ja') === 0) {
          target = 'ja';
        }
      }
    }
    if (target === 'zh-hant' || target === 'en' || target === 'ja') {
      location.replace('/' + target + path + location.search + location.hash);
    }
  } catch (e) {}
})();`

export default withMermaid(
  defineConfig({
    title: 'Dice!Next',
    locales,
    head: [['script', {}, languageRedirect]],
    themeConfig: {
      logo: '/logo.svg',
      search: {
        provider: 'local',
        options: { locales: searchLocales }
      },
      socialLinks: [
        { icon: 'github', link: 'https://github.com/DiceZone/Dice-Next' }
      ]
    }
  })
)
