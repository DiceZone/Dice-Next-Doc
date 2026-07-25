<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { onMounted } from 'vue'
import confetti from 'canvas-confetti'

const { Layout } = DefaultTheme

onMounted(() => {
  // 只在首页触发彩带效果
  if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
    const duration = 3000
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ['#a8d8ea', '#aa96da', '#fcbad3', '#f472b6']
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ['#a8d8ea', '#aa96da', '#fcbad3', '#f472b6']
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    frame()
  }
})
</script>

<template>
  <Layout />
</template>
