<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import { onMounted } from 'vue'
import confetti from 'canvas-confetti'

const { Layout } = DefaultTheme
const { frontmatter } = useData()

onMounted(() => {
  // 只在各语言的首页触发彩带效果
  if (frontmatter.value.layout !== 'home') return
  const duration = 3000
  const end = Date.now() + duration
  const colors = ['#a8d8ea', '#aa96da', '#fcbad3', '#f472b6']

  const frame = () => {
    confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors })
    confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors })
    if (Date.now() < end) requestAnimationFrame(frame)
  }

  frame()
})
</script>

<template>
  <Layout />
</template>
