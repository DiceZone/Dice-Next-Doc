<script setup lang="ts">
// 文档内的图标统一使用 Lucide 图标库的 SVG，不使用 emoji。
// 用法：<Icon name="dices" />；新增图标时在 ICONS 里登记。
import { computed } from 'vue'
import {
  Bot, BrainCircuit, Check, CircleAlert, CircleCheck, CircleX, Dices, Languages,
  LayoutDashboard, NotebookPen, Package, Plug, Puzzle, ScrollText, Sparkles,
  TriangleAlert, Wrench, X, Zap
} from 'lucide-vue-next'

const ICONS = {
  'bot': Bot,
  'brain-circuit': BrainCircuit,
  'check': Check,
  'circle-alert': CircleAlert,
  'circle-check': CircleCheck,
  'circle-x': CircleX,
  'dices': Dices,
  'languages': Languages,
  'layout-dashboard': LayoutDashboard,
  'notebook-pen': NotebookPen,
  'package': Package,
  'plug': Plug,
  'puzzle': Puzzle,
  'scroll-text': ScrollText,
  'sparkles': Sparkles,
  'triangle-alert': TriangleAlert,
  'wrench': Wrench,
  'x': X,
  'zap': Zap
} as const

const props = defineProps<{ name: keyof typeof ICONS; label?: string; tone?: 'ok' | 'warn' | 'no' }>()
const component = computed(() => ICONS[props.name])
</script>

<template>
  <span
    class="dn-icon"
    :class="tone ? `dn-icon--${tone}` : undefined"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
  >
    <component :is="component" :size="'1.1em'" :stroke-width="2" />
  </span>
</template>

<style scoped>
.dn-icon {
  display: inline-flex;
  align-items: center;
  vertical-align: -0.15em;
  margin-right: 0.3em;
  color: var(--vp-c-brand-1);
}
.dn-icon--ok { color: var(--vp-c-green-1, #10b981); }
.dn-icon--warn { color: var(--vp-c-yellow-1, #d97706); }
.dn-icon--no { color: var(--vp-c-red-1, #ef4444); }
</style>
