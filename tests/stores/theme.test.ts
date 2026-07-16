import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useThemeStore } from '../../src/stores/theme';
import { useUserPrefsStore } from '../../src/stores/userPrefs';

describe('themeStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    vi.restoreAllMocks();
  });

  it('initTheme falls back to system preference when no saved theme', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: true,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    const store = useThemeStore();
    store.initTheme();
    expect(store.isDark).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggleTheme flips and persists to userPrefs (not a bare localStorage key)', () => {
    const store = useThemeStore();
    store.initTheme();
    const before = store.isDark;
    store.toggleTheme();
    expect(store.isDark).toBe(!before);
    // 主题偏好统一收敛到 userPrefs，不再裸写 'theme' 键
    expect(localStorage.getItem('theme')).toBeNull();
    expect(useUserPrefsStore().state.theme).toBe(store.isDark ? 'dark' : 'light');
  });
});
