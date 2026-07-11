<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useThemeStore } from './stores/theme'
import { useSettingsStore } from './stores/settings'
import { useDataStore } from './stores/data'

const themeStore = useThemeStore()
const settingsStore = useSettingsStore()
const dataStore = useDataStore()

const ready = ref(false)

onMounted(async () => {
  themeStore.initTheme()
  // 配置（含 Zod 校验）异步加载，期间展示骨架，不阻塞首屏绘制
  await dataStore.init()
  await settingsStore.init()
  settingsStore.apply()
  ready.value = true
})
</script>

<template>
  <div v-if="ready" class="app-container">
    <router-view />
  </div>
  <div v-else class="app-splash" aria-hidden="true">
    <div class="app-splash__logo">念</div>
    <div class="app-splash__spinner"></div>
    <p class="app-splash__text">正在加载导航站…</p>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: var(--color-bg);
  background-image: var(--app-bg-image, none);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: var(--app-bg-attachment, scroll);
  color: var(--color-text);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.app-splash {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: var(--color-bg, #ffffff);
  color: var(--color-text, #0f172a);
  z-index: 9999;
}

.app-splash__logo {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
}

.app-splash__spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(59, 130, 246, 0.2);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: app-splash-spin 0.8s linear infinite;
}

.app-splash__text {
  margin: 0;
  font-size: 0.875rem;
  opacity: 0.7;
}

@keyframes app-splash-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
