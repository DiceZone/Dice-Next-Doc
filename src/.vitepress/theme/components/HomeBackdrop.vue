<script setup lang="ts">
// 首页的动态底纹，画在一张固定的 canvas 上，不拦截鼠标。
// 可叠加的图层（按下面的顺序从底到顶绘制）：
//   aurora  — 几团主题色光晕缓慢漂移
//   horizon — 画面下半部的透视网格地面，缓慢向前推进
//   ripple  — 点阵网格，从中上方定期扩散波纹
//   rainbow — 页面顶部一道斜向流动的彩虹光带（不画在 canvas 上，见 HomeRainbow.vue）
// 系统要求减少动态效果时只画静态画面。
import { onBeforeUnmount, onMounted, ref } from 'vue'
import HomeRainbow from './HomeRainbow.vue'

type Layer = 'aurora' | 'horizon' | 'ripple' | 'rainbow'
const ALL_LAYERS: Layer[] = ['aurora', 'horizon', 'ripple', 'rainbow']

// 部署时在这里选择要启用的图层。
// 也可以在构建时用环境变量覆盖，例如：VITE_HOME_LAYERS=rainbow,horizon npm run docs:build
// 设为 none 则不显示任何底纹。
const DEFAULT_LAYERS: Layer[] = [
  'aurora',
  'horizon',
  // 'ripple',
  // 'rainbow',
]
const fromEnv = import.meta.env.VITE_HOME_LAYERS as string | undefined
const LAYERS: Layer[] = fromEnv === undefined || fromEnv.trim() === ''
  ? DEFAULT_LAYERS
  : fromEnv.split(',').map((s) => s.trim()).filter((s): s is Layer => (ALL_LAYERS as string[]).includes(s))
const showRainbow = LAYERS.includes('rainbow')
const canvasLayers = LAYERS.filter((layer) => layer !== 'rainbow')

const GAP = 34

const canvas = ref<HTMLCanvasElement | null>(null)
let stop = () => {}

onMounted(() => {
  const el = canvas.value
  const ctx = el?.getContext('2d')
  if (!el || !ctx) return

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  let w = 0, h = 0
  let brand = '99, 102, 241'
  let dark = false
  let raf = 0

  const readColors = () => {
    dark = document.documentElement.classList.contains('dark')
    const probe = document.createElement('span')
    probe.style.color = 'var(--vp-c-brand-1)'
    document.body.appendChild(probe)
    const m = getComputedStyle(probe).color.match(/\d+(\.\d+)?/g)
    probe.remove()
    if (m && m.length >= 3) brand = `${m[0]}, ${m[1]}, ${m[2]}`
  }

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    w = window.innerWidth
    h = window.innerHeight
    el.width = Math.round(w * dpr)
    el.height = Math.round(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  // 点阵：离中心越远越淡；boost 返回某个点额外的亮度
  const dots = (boost?: (x: number, y: number, d: number) => number) => {
    const cx = w / 2, cy = h * 0.35
    const base = dark ? 0.16 : 0.12
    const reach = Math.max(w, h * 1.4)
    for (let x = 0; x <= w + GAP; x += GAP) {
      for (let y = 0; y <= h + GAP; y += GAP) {
        const d = Math.hypot(x - cx, y - cy)
        const fade = Math.max(0, 1 - d / reach)
        const a = (base + (boost ? boost(x, y, d) : 0)) * fade
        if (a < 0.01) continue
        ctx.fillStyle = `rgba(${brand}, ${a})`
        ctx.fillRect(x - 1, y - 1, 2, 2)
      }
    }
  }

  const drawRipple = (t: number) => {
    const ring = 300
    const r = (t / 1000) * 90
    dots((_x, _y, d) => {
      const off = (((d - r) % ring) + ring) % ring
      return Math.max(0, 1 - Math.abs(off - ring / 2) / 34) * 0.4
    })
  }

  // 极光：几道帷幕，每道由许多细竖条组成。
  // 帷幕底边沿一条随时间起伏的曲线，竖条亮度沿水平方向流动，顶端渐隐。
  // 每道帷幕有两套「顶 / 中 / 底」配色（a、b），绘制时沿水平方向在两套之间缓慢过渡，
  // 让同一道光幕在不同位置呈现不同颜色（色散）。'brand' 代表站点主题色。
  const curtains = [
    { a: ['brand', '56, 189, 248', '45, 212, 191'], b: ['167, 139, 250', '74, 222, 128', '45, 212, 191'],
      weight: 1, base: 0.34, height: 0.30, amp: 0.05, f1: 0.0042, f2: 0.0011, s1: 0.00055, s2: -0.00031, shimmer: 0.0009, phase: 0 },
    { a: ['244, 114, 182', 'brand', '129, 140, 248'], b: ['brand', '167, 139, 250', '56, 189, 248'],
      weight: 0.9, base: 0.27, height: 0.26, amp: 0.06, f1: 0.0031, f2: 0.0017, s1: -0.00042, s2: 0.00026, shimmer: -0.0011, phase: 2.1 },
    // 金黄：只在零星几段出现（sparse），出现时更亮
    { a: ['254, 240, 138', '253, 224, 71', '251, 191, 36'], b: ['254, 243, 199', '252, 211, 77', '245, 158, 11'],
      weight: 1.25, sparse: true, base: 0.40, height: 0.18, amp: 0.04, f1: 0.0053, f2: 0.0009, s1: 0.00037, s2: 0.00044, shimmer: 0.0013, phase: 4.2 },
  ]
  // 每套配色预先画一根 1px 宽的竖条渐变（上淡下亮），绘制时只需缩放贴图，避免每帧新建上百个渐变。
  const sprites = new Map<string, HTMLCanvasElement>()
  const sprite = (stops: string[]) => {
    const [top, mid, bottom] = stops.map((c) => (c === 'brand' ? brand : c))
    const key = `${top}|${mid}|${bottom}`
    let s = sprites.get(key)
    if (!s) {
      s = document.createElement('canvas')
      s.width = 1
      s.height = 256
      const c = s.getContext('2d')!
      const g = c.createLinearGradient(0, 0, 0, 256)
      g.addColorStop(0, `rgba(${top}, 0)`)
      g.addColorStop(0.35, `rgba(${top}, 0.35)`)
      g.addColorStop(0.7, `rgba(${mid}, 0.7)`)
      g.addColorStop(0.92, `rgba(${bottom}, 1)`)
      g.addColorStop(1, `rgba(${bottom}, 0)`)
      c.fillStyle = g
      c.fillRect(0, 0, 1, 256)
      sprites.set(key, s)
    }
    return s
  }
  // 极光先画在 1/4 分辨率的离屏画布上，再放大并模糊贴回，竖条会融成柔和的光幕。
  const AURORA_SCALE = 4
  const AURORA_BLUR = 10
  const auroraLayer = document.createElement('canvas')
  const actx = auroraLayer.getContext('2d')!
  // 极光的整体速度倍率：数字越小越慢。
  const AURORA_SPEED = 0.4
  const drawAurora = (time: number) => {
    // 浅色模式下不画极光
    if (!dark) return
    const t = time * AURORA_SPEED
    const lw = Math.max(1, Math.ceil(w / AURORA_SCALE))
    const lh = Math.max(1, Math.ceil(h / AURORA_SCALE))
    if (auroraLayer.width !== lw || auroraLayer.height !== lh) {
      auroraLayer.width = lw
      auroraLayer.height = lh
    }
    actx.clearRect(0, 0, lw, lh)
    actx.globalCompositeOperation = dark ? 'lighter' : 'source-over'
    const strength = dark ? 0.55 : 0.36
    for (const c of curtains) {
      const imgA = sprite(c.a)
      const imgB = sprite(c.b)
      const height = c.height * lh
      for (let lx = -1; lx <= lw; lx++) {
        const x = lx * AURORA_SCALE
        const edge = (c.base + c.amp * Math.sin(x * c.f1 + t * c.s1 + c.phase)
          + c.amp * 0.6 * Math.sin(x * c.f2 + t * c.s2)) * lh
        // 亮度：慢速的大块明暗 × 流动的褶皱
        const broad = 0.5 + 0.5 * Math.sin(x * 0.0023 + t * c.shimmer * 0.6 + c.phase)
        const fine = 0.65 + 0.35 * Math.sin(x * 0.012 + t * c.shimmer * 3)
        let a = strength * c.weight * (0.3 + 0.7 * broad * broad) * fine
        if ('sparse' in c) {
          // 只保留正弦峰值附近的几段，其余位置不画
          const patch = Math.max(0, Math.sin(x * 0.0027 + t * c.shimmer * 0.5 + c.phase))
          a *= patch ** 4
          if (a < 0.005) continue
        }
        const stretch = 0.8 + 0.4 * broad
        // 色散：两套配色沿水平方向交替
        const mix = 0.5 + 0.5 * Math.sin(x * 0.0035 - t * c.shimmer * 0.8 + c.phase * 1.7)
        const top = edge - height * stretch
        actx.globalAlpha = a * (1 - mix)
        actx.drawImage(imgA, lx, top, 1.5, height * stretch)
        actx.globalAlpha = a * mix
        actx.drawImage(imgB, lx, top, 1.5, height * stretch)
      }
    }
    actx.globalAlpha = 1
    ctx.save()
    ctx.filter = `blur(${AURORA_BLUR}px)`
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(auroraLayer, 0, 0, w, h)
    ctx.restore()
  }

  const drawHorizon = (t: number) => {
    const horizon = h * 0.48
    const depth = h - horizon
    const alpha = dark ? 0.35 : 0.28
    // 地平线的光
    const glow = ctx.createLinearGradient(0, horizon - 60, 0, horizon + 40)
    glow.addColorStop(0, `rgba(${brand}, 0)`)
    glow.addColorStop(0.6, `rgba(${brand}, ${dark ? 0.12 : 0.08})`)
    glow.addColorStop(1, `rgba(${brand}, 0)`)
    ctx.fillStyle = glow
    ctx.fillRect(0, horizon - 60, w, 100)
    ctx.lineWidth = 1
    // 纵线：从消失点放射
    const vx = w / 2
    for (let i = -24; i <= 24; i++) {
      const bx = vx + i * (w / 12)
      const g = ctx.createLinearGradient(0, horizon, 0, h)
      g.addColorStop(0, `rgba(${brand}, 0)`)
      g.addColorStop(1, `rgba(${brand}, ${alpha})`)
      ctx.strokeStyle = g
      ctx.beginPath()
      ctx.moveTo(vx + i * 6, horizon)
      ctx.lineTo(bx, h)
      ctx.stroke()
    }
    // 横线：越近越疏，缓慢向前推进
    const lines = 14
    const shift = (t / 1000) * 0.18 % 1
    for (let k = 0; k < lines; k++) {
      const z = (k + shift) / lines            // 0 远 → 1 近
      const y = horizon + depth * z * z
      ctx.strokeStyle = `rgba(${brand}, ${alpha * z})`
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }
  }

  const painters = { aurora: drawAurora, horizon: drawHorizon, ripple: drawRipple }
  const order = ['aurora', 'horizon', 'ripple'] as const
  const active = order.filter((layer) => canvasLayers.includes(layer)).map((layer) => painters[layer])
  const draw = (t: number) => active.forEach((paint) => paint(t))

  const frame = (now: number) => {
    ctx.clearRect(0, 0, w, h)
    draw(now)
    raf = requestAnimationFrame(frame)
  }
  const start = () => {
    cancelAnimationFrame(raf)
    if (reduced) {
      ctx.clearRect(0, 0, w, h)
      draw(0)
    } else if (!document.hidden) {
      raf = requestAnimationFrame(frame)
    }
  }

  readColors()
  resize()
  const themeObserver = new MutationObserver(() => { readColors(); if (reduced) start() })
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  const onResize = () => { resize(); if (reduced) start() }
  window.addEventListener('resize', onResize)
  document.addEventListener('visibilitychange', start)
  start()

  stop = () => {
    cancelAnimationFrame(raf)
    themeObserver.disconnect()
    window.removeEventListener('resize', onResize)
    document.removeEventListener('visibilitychange', start)
  }
})

onBeforeUnmount(() => stop())
</script>

<template>
  <canvas v-if="canvasLayers.length" ref="canvas" class="home-backdrop" aria-hidden="true" />
  <HomeRainbow v-if="showRainbow" />
</template>

<style scoped>
.home-backdrop {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  pointer-events: none;
}
</style>
