import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useUserPrefsStore } from './userPrefs';

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref<boolean>(false);
  let systemListenerAttached = false;

  const applyTheme = (): void => {
    document.documentElement.classList.toggle('dark', isDark.value);
  };

  const initTheme = (): void => {
    const prefs = useUserPrefsStore();
    const savedTheme = prefs.state.theme;
    if (savedTheme) {
      isDark.value = savedTheme === 'dark';
    } else {
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    applyTheme();

    if (!systemListenerAttached) {
      systemListenerAttached = true;
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!prefs.state.theme) {
          isDark.value = e.matches;
          applyTheme();
        }
      });
    }
  };

  const toggleTheme = (): void => {
    isDark.value = !isDark.value;
    applyTheme();
    const prefs = useUserPrefsStore();
    prefs.setTheme(isDark.value ? 'dark' : 'light');
  };

  return {
    isDark,
    initTheme,
    toggleTheme,
  };
});
