import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref<boolean>(false)
  let systemListenerAttached = false

  const safeGetItem = (key: string): string | null => {
    try { return localStorage.getItem(key) } catch { return null }
  }

  const safeSetItem = (key: string, value: string): void => {
    try { localStorage.setItem(key, value) } catch { /* ignore */ }
  }

  const applyTheme = (): void => {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const initTheme = (): void => {
    const savedTheme = safeGetItem('theme')
    if (savedTheme) {
      isDark.value = savedTheme === 'dark'
    } else {
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    applyTheme()

    if (!systemListenerAttached) {
      systemListenerAttached = true
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!safeGetItem('theme')) {
          isDark.value = e.matches
          applyTheme()
        }
      })
    }
  }

  const toggleTheme = (): void => {
    isDark.value = !isDark.value
    applyTheme()
    safeSetItem('theme', isDark.value ? 'dark' : 'light')
  }

  return {
    isDark,
    initTheme,
    toggleTheme,
  }
})
