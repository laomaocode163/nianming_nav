import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref<boolean>(false)

  const initTheme = (): void => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      isDark.value = savedTheme === 'dark'
    } else {
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    applyTheme()
  }

  const toggleTheme = (): void => {
    isDark.value = !isDark.value
    applyTheme()
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  }

  const applyTheme = (): void => {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return {
    isDark,
    initTheme,
    toggleTheme,
  }
})
