<script setup lang="ts">
// 首页顶部的彩虹光带：两层斜条纹叠加，用差值混合并缓慢平移，右上角最亮、向左下淡出。
// 移植自 NapCat 文档站首页（NapCatDocs，src/.vitepress/theme/Layout.vue）。
//   MIT License — Copyright (c) 2024 NapCat
// 纯 CSS，不拦截鼠标；系统要求减少动态效果时停在第一帧。
</script>

<template>
  <div class="home-rainbow" aria-hidden="true">
    <div class="jumbo" />
  </div>
</template>

<style scoped>
.home-rainbow {
  position: absolute;
  top: -4rem;
  left: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 60vh;
  overflow: hidden;
  opacity: 0.35;
  pointer-events: none;
}

.jumbo {
  --stripes: repeating-linear-gradient(100deg, #fff 0%, #fff 7%, transparent 10%, transparent 12%, #fff 16%);
  --rainbow: repeating-linear-gradient(100deg, #60a5fa 10%, #e879f9 16%, #5eead4 22%, #60a5fa 30%);
  position: absolute;
  inset: 0;
  contain: strict;
  background-image: var(--stripes), var(--rainbow);
  background-size: 300%, 200%;
  background-position: 50% 50%, 50% 50%;
  opacity: 0.6;
  transform: translateZ(0);
  backface-visibility: hidden;
  filter: invert(100%);
  -webkit-mask-image: radial-gradient(ellipse at 100% 0%, black 40%, transparent 70%);
  mask-image: radial-gradient(ellipse at 100% 0%, black 40%, transparent 70%);
}

.jumbo::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: var(--stripes), var(--rainbow);
  background-size: 200%, 100%;
  mix-blend-mode: difference;
  animation: home-rainbow-flow 90s linear infinite;
}

@keyframes home-rainbow-flow {
  from {
    background-position: 50% 50%, 50% 50%;
  }
  to {
    background-position: 350% 50%, 350% 50%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .jumbo::after {
    animation: none;
  }
}
</style>
