/**
 * 用户偏好 store（Layer2：用户个性化数据）
 *
 * 统一收敛此前散落在 theme.ts / data.ts / MainHeader.vue 中的裸 localStorage 读写，
 * 并新增 per-user 个性化能力：收藏（favorites）与最近访问（recentVisits）。
 *
 * 设计要点：
 * - 单一版本化 key（user-prefs-v1）整块持久化，避免多 key 散落、便于迁移；
 * - 旧版裸 key（theme / selected-search-source）在首次加载时自动迁移；
 * - 防抖落盘，避免高频写入；
 * - 不引入任何外部依赖，沿用 faviconService 的持久化范式但更简单（无 TTL / 淘汰）。
 */
import { defineStore } from 'pinia';
import { reactive, watch } from 'vue';

export interface RecentVisit {
  id: string;
  ts: number;
}

export interface UserPrefsState {
  favorites: string[];
  recentVisits: RecentVisit[];
  theme: 'light' | 'dark' | null;
  selectedSearchSourceId: string | null;
}

const STORAGE_KEY = 'user-prefs-v1';
const FAVORITES_MAX = 300;
const RECENT_MAX = 50;
const SAVE_DEBOUNCE_MS = 200;

const DEFAULT_STATE: UserPrefsState = {
  favorites: [],
  recentVisits: [],
  theme: null,
  selectedSearchSourceId: null,
};

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string');

const isRecentArray = (v: unknown): v is RecentVisit[] =>
  Array.isArray(v) &&
  v.every((x) => !!x && typeof x === 'object' && typeof (x as RecentVisit).id === 'string');

const loadState = (): UserPrefsState => {
  const state: UserPrefsState = { ...DEFAULT_STATE };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<UserPrefsState>;
      if (isStringArray(parsed.favorites)) state.favorites = parsed.favorites;
      if (isRecentArray(parsed.recentVisits)) state.recentVisits = parsed.recentVisits;
      if (parsed.theme === 'light' || parsed.theme === 'dark') state.theme = parsed.theme;
      if (typeof parsed.selectedSearchSourceId === 'string')
        state.selectedSearchSourceId = parsed.selectedSearchSourceId;
    } else {
      // 迁移旧版散落的裸 localStorage 键（一次性）
      const legacyTheme = localStorage.getItem('theme');
      if (legacyTheme === 'light' || legacyTheme === 'dark') state.theme = legacyTheme;
      const legacySource = localStorage.getItem('selected-search-source');
      if (legacySource) state.selectedSearchSourceId = legacySource;
    }
  } catch {
    /* 解析失败或隐私模式读取受限：回退默认 */
  }
  return state;
};

export const useUserPrefsStore = defineStore('userPrefs', () => {
  const state = reactive<UserPrefsState>(loadState());

  // 防抖落盘：多次状态变更合并为一次 localStorage 写入
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  const persist = (): void => {
    saveTimer = null;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* 隐私模式或配额超限时忽略 */
    }
  };
  watch(
    state,
    () => {
      if (saveTimer) return;
      saveTimer = setTimeout(persist, SAVE_DEBOUNCE_MS);
    },
    { deep: true }
  );

  const isFavorite = (id: string): boolean => state.favorites.includes(id);

  const toggleFavorite = (id: string): boolean => {
    const idx = state.favorites.indexOf(id);
    if (idx >= 0) {
      state.favorites.splice(idx, 1);
      return false;
    }
    state.favorites.unshift(id);
    if (state.favorites.length > FAVORITES_MAX) state.favorites.length = FAVORITES_MAX;
    return true;
  };

  const recordVisit = (id: string): void => {
    const idx = state.recentVisits.findIndex((v) => v.id === id);
    const now = Date.now();
    // 重复访问：移除旧记录并前置，保证「最近访问」按时间倒序
    if (idx >= 0) state.recentVisits.splice(idx, 1);
    state.recentVisits.unshift({ id, ts: now });
    if (state.recentVisits.length > RECENT_MAX) state.recentVisits.length = RECENT_MAX;
  };

  const visitTs = (id: string): number => {
    const found = state.recentVisits.find((v) => v.id === id);
    return found ? found.ts : 0;
  };

  const setTheme = (theme: 'light' | 'dark' | null): void => {
    state.theme = theme;
  };

  const setSearchSource = (id: string | null): void => {
    state.selectedSearchSourceId = id;
  };

  const exportData = (): string => JSON.stringify(state, null, 2);

  const importData = (raw: string): boolean => {
    try {
      const parsed = JSON.parse(raw) as Partial<UserPrefsState>;
      if (!parsed || typeof parsed !== 'object') return false;
      if (isStringArray(parsed.favorites)) state.favorites = parsed.favorites;
      if (isRecentArray(parsed.recentVisits)) state.recentVisits = parsed.recentVisits;
      if (parsed.theme === 'light' || parsed.theme === 'dark') state.theme = parsed.theme;
      if (typeof parsed.selectedSearchSourceId === 'string')
        state.selectedSearchSourceId = parsed.selectedSearchSourceId;
      return true;
    } catch {
      return false;
    }
  };

  const clearFavorites = (): void => {
    state.favorites = [];
  };

  const clearRecent = (): void => {
    state.recentVisits = [];
  };

  return {
    state,
    isFavorite,
    toggleFavorite,
    recordVisit,
    visitTs,
    setTheme,
    setSearchSource,
    exportData,
    importData,
    clearFavorites,
    clearRecent,
  };
});
