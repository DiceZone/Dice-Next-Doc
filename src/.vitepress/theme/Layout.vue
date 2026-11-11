<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import { computed } from 'vue'
import HomeBackdrop from './components/HomeBackdrop.vue'
import HeroDice from './components/HeroDice.vue'

const { Layout } = DefaultTheme
const { frontmatter } = useData()
const isHome = computed(() => frontmatter.value.layout === 'home')
</script>

<template>
  <Layout>
    <template #layout-top>
      <HomeBackdrop v-if="isHome" />
    </template>
    <template #home-hero-image>
      <HeroDice />
    </template>
  </Layout>
</template>
