<script setup>
import { onMounted } from 'vue'
import { useThemeStore } from './stores/theme'
import { useSettingsStore } from './stores/settings'

const themeStore = useThemeStore()
const settingsStore = useSettingsStore()

onMounted(() => {
  themeStore.initTheme()
  settingsStore.apply()
})
</script>

<template>
  <div class="app-container">
    <router-view />
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
</style>
