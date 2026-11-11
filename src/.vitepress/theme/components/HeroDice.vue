<script setup lang="ts">
// 首页右侧的线稿二十面骰。
// 和 logo 一样由二十个互相留缝的三角面组成，每个面只画轮廓线；静止时与 logo 的形状完全一致。
// 进入页面先停在 logo 的姿态，然后一次转动一步：每一步都是让骰子换一个面朝前的对称转动，
// 转完稍作停顿，停下来时看到的又是 logo。每一步走哪条路径随机挑选，可走的路径见 icosahedron.ts。
// 转动途中背面的线隔着正面隐约透出来。系统要求减少动态效果时保持静止。
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { CENTER, MOVES, RADIUS, REST, frame, type FaceState } from '../icosahedron'

const HOLD = 1400              // 进入页面后停在 logo 姿态的时间（毫秒）
const PAUSE = 1300             // 每转完一步停顿的时间（毫秒）
const SPEED = 0.42             // 转动的平均角速度（弧度 / 秒）

const HALF = RADIUS + 4
const viewBox = `${(CENTER[0] - HALF).toFixed(2)} ${(CENTER[1] - HALF).toFixed(2)} ${HALF * 2} ${HALF * 2}`

// 起步和收尾都很缓的缓动
const ease = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)

const svg = ref<SVGSVGElement | null>(null)
let stop = () => {}

onMounted(() => {
  const el = svg.value
  if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const back = [...el.querySelectorAll<SVGPathElement>('.back path')]
  const front = [...el.querySelectorAll<SVGPathElement>('.front path')]

  const show = (faces: FaceState[]) => {
    faces.forEach((f, i) => {
      front[i].setAttribute('d', f.d)
      front[i].style.opacity = f.front.toFixed(3)
      front[i].style.setProperty('--l', f.tone.toFixed(3))
      back[i].style.opacity = f.back.toFixed(3)
      if (f.back > 0) back[i].setAttribute('d', f.d)
    })
  }

  let step = -1                // 正在走的路径在 MOVES 里的下标；-1 表示停着
  let lastStep = -1
  let clock = 0                // 当前这一步（或这次停顿）已经过去的时间
  let wait = HOLD
  let last = 0
  let raf = 0
  let visible = true
  const tick = (now: number) => {
    clock += last ? Math.min(now - last, 50) : 0        // 切回页面时不补转
    last = now
    if (step < 0) {
      if (clock >= wait) {
        // MOVES 里相邻两条互为反向；不走上一步的反向，免得原路退回
        do step = Math.floor(Math.random() * MOVES.length)
        while (lastStep >= 0 && step === (lastStep ^ 1))
        clock = 0
      }
    } else {
      const total = Math.abs(MOVES[step].angle)
      const progress = clock / ((total / SPEED) * 1000)
      if (progress < 1) {
        show(frame(MOVES[step], total * ease(progress)))
      } else {
        show(REST)
        lastStep = step
        step = -1
        clock = 0
        wait = PAUSE
      }
    }
    raf = requestAnimationFrame(tick)
  }
  const run = () => {
    cancelAnimationFrame(raf)
    last = 0
    if (visible && !document.hidden) raf = requestAnimationFrame(tick)
  }
  // 滚出视野或切到后台时停下
  const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; run() })
  io.observe(el)
  document.addEventListener('visibilitychange', run)
  stop = () => {
    cancelAnimationFrame(raf)
    io.disconnect()
    document.removeEventListener('visibilitychange', run)
  }
})

onBeforeUnmount(() => stop())
</script>

<template>
  <svg ref="svg" class="image-src hero-dice" width="320" height="320" :viewBox="viewBox" role="img" aria-label="Dice!Next">
    <g class="back">
      <path v-for="(f, i) in REST" :key="i" :d="f.d" style="opacity: 0" />
    </g>
    <g class="front">
      <path v-for="(f, i) in REST" :key="i" :d="f.d" :style="{ opacity: f.front, '--l': f.tone }" />
    </g>
  </svg>
</template>

<style>
.hero-dice {
  --dice-ink: #1c2030;
  --dice-glow: hsl(239 84% 62% / 0.45);
  overflow: visible;
  /* 外发光：贴着线的一圈柔光，加上一层更大、更淡的光晕 */
  filter: drop-shadow(0 0 3px var(--dice-glow)) drop-shadow(0 0 14px var(--dice-glow));
}
.dark .hero-dice {
  --dice-ink: #f4f6ff;
  --dice-glow: hsl(232 100% 78% / 0.6);
}
.hero-dice path {
  stroke: var(--dice-ink);
  stroke-linejoin: round;
}
/* 正面：线的深浅跟随 logo 的明暗（浅色模式下暗面线更重，深色模式下亮面线更亮），面内只留一层很淡的底色 */
.hero-dice .front path {
  fill: var(--dice-ink);
  stroke-width: 1.2;
  stroke-opacity: calc(1 - 0.6 * var(--l));
  fill-opacity: calc((1 - var(--l)) * 0.13 + 0.015);
}
.dark .hero-dice .front path {
  stroke-opacity: calc(0.3 + 0.7 * var(--l));
  fill-opacity: calc(var(--l) * 0.13 + 0.015);
}
/* 背面：隔着正面透出来的细线 */
.hero-dice .back path {
  fill: none;
  stroke-width: 0.7;
  stroke-opacity: 0.13;
}
</style>
