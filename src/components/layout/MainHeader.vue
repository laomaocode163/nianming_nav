<script setup lang="ts">
  import { useThemeStore } from '../../stores/theme';
  import { useResponsive } from '../../hooks/useResponsive';
  import TimeDateComponent from '../ui/TimeDateComponent.vue';
  import UserPrefsPanel from '../ui/UserPrefsPanel.vue';
  import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
  import { useDataStore } from '../../stores/data';
  import { useUiStore } from '../../stores/ui';
  import { useUserPrefsStore } from '../../stores/userPrefs';
  import type { SearchSource } from '../../types';
  import { safeUrl } from '../../utils/url';
  import { useRouter } from 'vue-router';
  import {
    Sun,
    Moon,
    Globe,
    Search,
    X,
    ChevronDown,
    Settings,
    SlidersHorizontal,
  } from 'lucide-vue-next';

  const emit = defineEmits(['toggle-sidebar']);

  const router = useRouter();
  const isDev = import.meta.env.DEV;
  const themeStore = useThemeStore();
  const dataStore = useDataStore();
  const uiStore = useUiStore();
  const userPrefs = useUserPrefsStore();
  const { isMobile } = useResponsive();

  // 偏好面板开关
  const showPrefsPanel = ref(false);

  // 搜索引擎图标加载失败记录：按「引擎 id + 图标 url」维度记录，带 TTL，过期后允许重试
  const ICON_ERROR_TTL = 5 * 60 * 1000;
  const iconErrorMap = ref<Record<string, { url: string; ts: number }>>({});
  const showEngineMenu = ref(false);
  const engineSelectorRef = ref<HTMLElement | null>(null);
  const searchInputRef = ref<HTMLInputElement | null>(null);
  // 引擎下拉键盘导航高亮项索引（-1 表示无高亮）
  const highlightedIndex = ref(-1);
  // 引擎名默认值：图标 fallback 首字母、名称展示、输入框占位统一使用
  const DEFAULT_ENGINE_NAME = '必应';

  const searchEngines = computed(() => {
    return dataStore.searchConfig?.externalSources.filter((s) => s.enabled) ?? [];
  });

  const selectedEngine = computed(() => {
    const cfg = dataStore.searchConfig;
    if (!cfg) return null;
    return (
      searchEngines.value.find((e) => e.id === cfg.selectedSourceId) ||
      searchEngines.value[0] ||
      null
    );
  });

  const handleIconError = (engineId: string, iconUrl: string) => {
    if (!engineId || !iconUrl) return;
    const key = `${engineId}|${iconUrl}`;
    iconErrorMap.value[key] = { url: iconUrl, ts: Date.now() };
  };

  // 纯函数：近期是否加载失败（未过期）。不产生副作用，可安全用于 computed。
  const isIconBroken = (engine: SearchSource | null): boolean => {
    if (!engine?.icon) return false;
    const record = iconErrorMap.value[`${engine.id}|${engine.icon}`];
    return record ? Date.now() - record.ts <= ICON_ERROR_TTL : false;
  };

  const getEngineDisplayIcon = (engine: SearchSource | null): string | null => {
    if (!engine?.icon) return null; // 无图标 → 显示首字母
    return isIconBroken(engine) ? null : engine.icon;
  };

  // 选中引擎图标只算一次，避免模板中多次调用重算
  const selectedEngineIcon = computed(() => getEngineDisplayIcon(selectedEngine.value));

  const toggleEngineMenu = (): void => {
    showEngineMenu.value = !showEngineMenu.value;
    if (showEngineMenu.value) {
      // 打开时把高亮定位到当前选中引擎，方便方向键接续
      highlightedIndex.value = searchEngines.value.findIndex(
        (e) => e.id === selectedEngine.value?.id
      );
    }
  };

  const selectEngine = (engineId: string) => {
    dataStore.updateSearchConfig({ selectedSourceId: engineId });
    userPrefs.setSearchSource(engineId);
    showEngineMenu.value = false;
    highlightedIndex.value = -1;
  };

  // 引擎选择器键盘导航：↑/↓ 移动高亮，Enter 选择，Esc 关闭
  const onEngineKeydown = (e: KeyboardEvent): void => {
    const list = searchEngines.value;
    if (!list.length) return;
    if (!showEngineMenu.value) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        toggleEngineMenu();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        highlightedIndex.value = (highlightedIndex.value + 1) % list.length;
        break;
      case 'ArrowUp':
        e.preventDefault();
        highlightedIndex.value = (highlightedIndex.value - 1 + list.length) % list.length;
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex.value >= 0) selectEngine(list[highlightedIndex.value].id);
        break;
      case 'Escape':
        e.preventDefault();
        showEngineMenu.value = false;
        highlightedIndex.value = -1;
        break;
    }
  };

  const closeEngineMenu = (e: Event): void => {
    if (engineSelectorRef.value && !engineSelectorRef.value.contains(e.target as Node)) {
      showEngineMenu.value = false;
      highlightedIndex.value = -1;
    }
  };

  // 全局快捷键：⌘/Ctrl+K 或 /（非输入态）聚焦搜索框
  const onGlobalKeydown = (e: KeyboardEvent): void => {
    // 模态（如偏好面板）打开时不抢占按键，避免干扰面板内交互
    if (showPrefsPanel.value) return;
    const isShortcutK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
    const target = e.target as HTMLElement | null;
    const inEditable =
      !!target &&
      (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
    // ⌘/Ctrl+K 始终聚焦搜索（即便焦点在按钮上也允许），仅排除输入态
    if (isShortcutK && !inEditable) {
      e.preventDefault();
      searchInputRef.value?.focus();
      searchInputRef.value?.select();
      return;
    }
    // 单独的 / 快捷键：排除输入态，且焦点在按钮上时也不抢占（避免键盘在按钮间导航被吞）
    if (e.key === '/' && !inEditable && target?.tagName !== 'BUTTON') {
      e.preventDefault();
      searchInputRef.value?.focus();
      searchInputRef.value?.select();
    }
  };

  onMounted(() => {
    document.addEventListener('click', closeEngineMenu);
    document.addEventListener('keydown', onGlobalKeydown);
  });
  onUnmounted(() => {
    document.removeEventListener('click', closeEngineMenu);
    document.removeEventListener('keydown', onGlobalKeydown);
  });

  // 本地输入模型 + 防抖：避免每次按键都驱动全量过滤，提升输入流畅度
  const searchText = ref(uiStore.searchQuery);
  const SEARCH_DEBOUNCE_MS = 200;
  let searchTimer: ReturnType<typeof setTimeout> | null = null;
  const flushSearch = (): void => {
    searchTimer = null;
    uiStore.updateSearchQuery(searchText.value);
  };
  const onSearchInput = (value: string): void => {
    searchText.value = value;
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(flushSearch, SEARCH_DEBOUNCE_MS);
  };
  // 外部清空（如清除按钮、切换分类）时同步本地模型
  watch(
    () => uiStore.searchQuery,
    (val) => {
      if (val !== searchText.value) searchText.value = val;
    }
  );

  const handleSearch = () => {
    // 立即同步最新输入，避免防抖未触发时外部搜索取到旧值
    if (searchTimer) {
      clearTimeout(searchTimer);
      searchTimer = null;
    }
    uiStore.updateSearchQuery(searchText.value);
    if (!searchText.value.trim()) return;

    if (uiStore.searchMode === 'external') {
      // 外部搜索（搜索引擎）
      if (selectedEngine.value) {
        window.open(
          safeUrl(selectedEngine.value.url + encodeURIComponent(searchText.value)),
          '_blank',
          'noopener,noreferrer'
        );
        // 清空搜索框内容
        searchText.value = '';
        uiStore.updateSearchQuery('');
      }
    } else {
      // 内部搜索（网站搜索）
      // 搜索已经通过计算属性实时过滤，不需要额外操作
    }
  };
</script>

<template>
  <header class="main-header glass-surface">
    <div class="header-left">
      <!-- 移动端汉堡菜单按钮 -->
      <button
        v-if="isMobile"
        class="hamburger-btn"
        title="打开菜单"
        aria-label="打开菜单"
        @click="emit('toggle-sidebar')"
      >
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>
    </div>

    <!-- Search Section -->
    <div class="header-center">
      <!-- Time Date Component -->
      <TimeDateComponent v-if="!isMobile" />

      <div class="search-wrapper">
        <!-- Search Mode Toggle -->
        <button
          type="button"
          class="search-mode-toggle"
          :class="{ 'is-external': uiStore.searchMode === 'external' }"
          :title="
            uiStore.searchMode === 'external'
              ? '当前：网络搜索（点击切换到站内）'
              : '当前：站内搜索（点击切换到网络）'
          "
          :aria-label="
            uiStore.searchMode === 'external' ? '搜索模式：网络搜索' : '搜索模式：站内搜索'
          "
          @click="uiStore.toggleSearchMode()"
        >
          <span class="mode-icon">
            <Globe v-if="uiStore.searchMode === 'external'" :size="16" :stroke-width="2" />
            <Search v-else :size="16" :stroke-width="2" />
          </span>
          <span class="mode-text">{{ uiStore.searchMode === 'external' ? '搜索' : '站内' }}</span>
        </button>

        <!-- Search Engine Selector (only show in external mode) -->
        <div
          v-if="uiStore.searchMode === 'external'"
          ref="engineSelectorRef"
          class="search-engine-selector"
        >
          <div
            class="engine-selector-content"
            role="button"
            tabindex="0"
            aria-haspopup="listbox"
            :aria-expanded="showEngineMenu"
            aria-label="选择搜索引擎"
            @click="toggleEngineMenu"
            @keydown="onEngineKeydown"
          >
            <!-- Favicon image with error fallback -->
            <div v-if="selectedEngineIcon" class="engine-icon-wrapper">
              <img
                :src="selectedEngineIcon"
                :alt="selectedEngine?.name"
                class="engine-icon-img"
                @error="handleIconError(selectedEngine?.id || '', selectedEngine?.icon || '')"
              />
            </div>
            <!-- Fallback: show first letter when icon fails -->
            <div v-else class="engine-icon-fallback">
              {{ selectedEngine?.name?.charAt(0) || DEFAULT_ENGINE_NAME.charAt(0) }}
            </div>
            <span class="engine-name">{{ selectedEngine?.name || DEFAULT_ENGINE_NAME }}</span>
            <ChevronDown
              class="dropdown-arrow"
              :class="{ open: showEngineMenu }"
              :size="14"
              :stroke-width="2"
              aria-hidden="true"
            />
          </div>
          <div v-if="showEngineMenu" class="engine-dropdown-menu glass-surface" role="listbox">
            <div
              v-for="(engine, idx) in searchEngines"
              :key="engine.id"
              class="engine-dropdown-item"
              :class="{
                selected: engine.id === selectedEngine?.id,
                highlighted: idx === highlightedIndex,
              }"
              role="option"
              :aria-selected="engine.id === selectedEngine?.id"
              @click="selectEngine(engine.id)"
              @mouseenter="highlightedIndex = idx"
            >
              <div v-if="getEngineDisplayIcon(engine)" class="dropdown-engine-icon-wrapper">
                <img
                  :src="getEngineDisplayIcon(engine) || undefined"
                  :alt="engine.name"
                  class="dropdown-engine-icon"
                  @error="handleIconError(engine.id, getEngineDisplayIcon(engine) || '')"
                />
              </div>
              <div v-else class="dropdown-engine-fallback">
                {{ engine.name?.charAt(0) || '?' }}
              </div>
              {{ engine.name }}
            </div>
          </div>
        </div>

        <!-- Search Input -->
        <input
          ref="searchInputRef"
          class="search-input"
          type="text"
          :value="searchText"
          :aria-label="uiStore.searchMode === 'external' ? '网络搜索输入框' : '站内网站搜索输入框'"
          :placeholder="
            uiStore.searchMode === 'external'
              ? `在 ${selectedEngine?.name || DEFAULT_ENGINE_NAME} 搜索...（按 / 或 ⌘K 聚焦）`
              : '搜索站内网站...（按 / 或 ⌘K 聚焦）'
          "
          @input="onSearchInput(($event.target as HTMLInputElement).value)"
          @keyup.enter="handleSearch"
        />
        <button
          v-if="searchText"
          class="search-clear"
          type="button"
          aria-label="清空搜索"
          @click="onSearchInput('')"
        >
          <X :size="16" :stroke-width="2.25" />
        </button>
        <button class="search-button" type="button" aria-label="搜索" @click="handleSearch">
          <Search :size="18" :stroke-width="2.25" aria-hidden="true" />
        </button>
      </div>
    </div>

    <div class="header-right">
      <button
        class="icon-btn"
        type="button"
        title="我的偏好（收藏 / 最近 / 导入导出）"
        aria-label="打开偏好设置"
        @click="showPrefsPanel = true"
      >
        <SlidersHorizontal class="prefs-icon" :size="20" :stroke-width="2" />
      </button>
      <button
        v-if="isDev"
        class="icon-btn"
        type="button"
        title="管理后台"
        aria-label="打开管理后台"
        @click="router.push('/admin')"
      >
        <Settings class="admin-icon" :size="20" :stroke-width="2" />
      </button>
      <button
        class="icon-btn"
        type="button"
        :title="themeStore.isDark ? '切换到亮色模式' : '切换到暗色模式'"
        :aria-pressed="themeStore.isDark"
        @click="themeStore.toggleTheme"
      >
        <Sun v-if="themeStore.isDark" class="theme-icon" :size="20" :stroke-width="2" />
        <Moon v-else class="theme-icon" :size="20" :stroke-width="2" />
      </button>
    </div>

    <UserPrefsPanel v-if="showPrefsPanel" @close="showPrefsPanel = false" />
  </header>
</template>

<style scoped>
  .main-header {
    /* 统一的模块高度，保证 header 内各卡片/按钮在同一基线对齐 */
    --header-module-h: 52px;
    --header-accent: var(--hue-primary), var(--sat-primary), var(--lig-primary);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-md) var(--space-lg);
    background: var(--glass-bg);
    border-bottom: none;
    position: sticky;
    top: 0;
    z-index: 50;
    transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
    gap: var(--space-lg);
  }

  /* 柔化底部分隔：渐变淡入淡出替代生硬边框，与侧栏风格统一 */
  .main-header::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 1px;
    background: linear-gradient(
      to right,
      transparent,
      var(--color-border) 14%,
      var(--color-border) 86%,
      transparent
    );
    pointer-events: none;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    flex-shrink: 0;
  }

  .header-center {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--space-md);
    min-width: 0;
    justify-content: flex-start;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    flex-shrink: 0;
  }

  /* 汉堡菜单按钮样式 */
  .hamburger-btn {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 36px;
    height: 36px;
    padding: 0;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: transparent;
    cursor: pointer;
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
    gap: 4px;
  }

  .hamburger-btn:hover {
    border-color: var(--color-primary);
    background: hsl(var(--hue-primary), 10%, 96%);
  }

  .dark .hamburger-btn:hover {
    background: hsl(var(--hue-primary), 20%, 18%);
  }

  .hamburger-btn:active {
    transform: scale(0.95);
  }

  .hamburger-line {
    display: block;
    width: 18px;
    height: 2px;
    background: var(--color-text-secondary);
    border-radius: 2px;
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .hamburger-btn:hover .hamburger-line {
    background: var(--color-primary);
  }

  .admin-icon {
    transition: transform 500ms var(--ease-in-out-quint);
  }

  .icon-btn:hover .admin-icon {
    transform: rotate(90deg);
  }

  /* 图标动画 */
  .theme-icon {
    display: block;
    transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .icon-btn:hover .theme-icon {
    transform: rotate(20deg) scale(1.1);
  }

  /* Search Styles */
  .search-wrapper {
    flex: 1;
    min-width: 0;
    height: var(--header-module-h);
    display: flex;
    align-items: center;
    gap: 0;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    padding: 0 0.5rem;
    transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: var(--shadow-sm);
    position: relative;
  }

  .search-wrapper:focus-within {
    border-color: hsl(var(--header-accent) / 0.5);
    box-shadow:
      0 0 0 4px hsl(var(--header-accent) / 0.12),
      var(--shadow-md);
  }

  .search-mode-toggle {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.625rem;
    margin-right: 0.375rem;
    cursor: pointer;
    border: none;
    border-radius: var(--radius-sm);
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
    /* 默认即以主色呈现，强化「这是当前搜索模式」的视觉权重 */
    color: var(--color-primary);
    background: hsl(var(--hue-primary), 15%, 96%);
    font-size: 0.875rem;
    font-weight: 600;
    font-family: inherit;
    position: relative;
    white-space: nowrap;
  }

  .dark .search-mode-toggle {
    background: hsl(var(--hue-primary), 20%, 18%);
  }

  .search-mode-toggle:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  /* 段落分割线：模式切换与后续内容之间 */
  .search-mode-toggle::after {
    content: '';
    position: absolute;
    right: -0.375rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1px;
    height: 20px;
    background: var(--color-border);
  }

  .search-mode-toggle:hover {
    color: var(--color-primary);
    background: hsl(var(--hue-primary), 15%, 96%);
  }

  .dark .search-mode-toggle:hover {
    background: hsl(var(--hue-primary), 20%, 18%);
  }

  .mode-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  .engine-dropdown-menu {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    z-index: 60;
    min-width: 12rem;
    padding: 0.375rem;
    background: var(--glass-bg-strong);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .engine-dropdown-item {
    display: flex;
    align-items: center;
    padding: 0.5rem 0.625rem;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--color-text);
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .engine-dropdown-item:hover,
  .engine-dropdown-item.highlighted {
    background: hsl(var(--hue-primary), 15%, 96%);
    color: var(--color-primary);
  }

  .dark .engine-dropdown-item:hover,
  .dark .engine-dropdown-item.highlighted {
    background: hsl(var(--hue-primary), 20%, 18%);
  }

  .engine-dropdown-item.selected {
    color: var(--color-primary);
    font-weight: 600;
  }

  .search-engine-selector {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: 0.375rem 0.625rem;
    margin-right: 0.375rem;
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
    position: relative;
    background: transparent;
    white-space: nowrap;
  }

  /* 段落分割线：引擎选择器与输入框之间 */
  .search-engine-selector::after {
    content: '';
    position: absolute;
    right: -0.375rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1px;
    height: 20px;
    background: var(--color-border);
  }

  .engine-selector-content {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    cursor: pointer;
  }

  .search-engine-selector:hover {
    color: var(--color-primary);
    background: hsl(var(--hue-primary), 15%, 96%);
  }

  .dark .search-engine-selector:hover {
    background: hsl(var(--hue-primary), 20%, 18%);
  }

  .engine-name {
    white-space: nowrap;
  }

  .engine-icon-img {
    width: 16px;
    height: 16px;
    object-fit: contain;
    flex-shrink: 0;
    border-radius: 4px;
    transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .engine-icon-wrapper {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .engine-icon-fallback {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: var(--gradient-primary);
    color: white;
    font-size: 0.6875rem;
    font-weight: 600;
    border-radius: 5px;
    text-transform: uppercase;
  }

  .dropdown-engine-icon-wrapper {
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-right: 8px;
  }

  .dropdown-engine-fallback {
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-right: 8px;
    background: var(--gradient-primary);
    color: white;
    font-size: 0.625rem;
    font-weight: 700;
    border-radius: 4px;
    text-transform: uppercase;
  }

  .engine-icon-img.switching {
    animation: iconSwitch 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @keyframes iconSwitch {
    0% {
      transform: scale(1) rotate(0deg);
    }
    50% {
      transform: scale(0.8) rotate(8deg);
    }
    100% {
      transform: scale(1) rotate(0deg);
    }
  }

  .search-engine-selector.cycling .engine-name {
    animation: nameFade 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @keyframes nameFade {
    0% {
      opacity: 1;
      transform: translateX(0);
    }
    50% {
      opacity: 0;
      transform: translateX(-4px);
    }
    100% {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .dropdown-arrow {
    color: var(--color-text-secondary);
    cursor: pointer;
    transition:
      transform 150ms cubic-bezier(0.4, 0, 0.2, 1),
      color 150ms cubic-bezier(0.4, 0, 0.2, 1);
    font-size: 0.75rem;
    padding: 2px;
  }

  .dropdown-arrow:hover {
    color: var(--color-primary);
  }

  .dropdown-arrow.open {
    transform: rotate(180deg);
  }

  .dropdown-engine-icon {
    width: 16px;
    height: 16px;
    object-fit: contain;
    margin-right: 8px;
    border-radius: 3px;
    vertical-align: middle;
  }

  .search-input {
    flex: 1;
    min-width: 0;
    height: 100%;
    border: none;
    outline: none;
    background: transparent;
    font-size: 0.9375rem;
    padding: 0.5rem 0.5rem;
    color: var(--color-text);
  }

  .search-input::placeholder {
    color: var(--color-text-secondary);
    opacity: 0.6;
  }

  .search-clear {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--color-text-secondary);
    line-height: 1;
    cursor: pointer;
    border-radius: 50%;
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .search-clear:hover {
    color: var(--color-primary);
    background: hsl(var(--hue-primary), 15%, 92%);
  }

  .dark .search-clear:hover {
    background: hsl(var(--hue-primary), 20%, 20%);
  }

  .search-button {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    padding: 0;
    margin: 0 2px 0 4px;
    border: none;
    cursor: pointer;
    border-radius: var(--radius-lg);
    background: var(--gradient-button);
    color: #fff;
    box-shadow: 0 2px 6px hsl(var(--header-accent) / 0.3);
    transition:
      transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1),
      box-shadow 180ms cubic-bezier(0.4, 0, 0.2, 1),
      filter 180ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .search-button svg {
    transition: transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .search-button:hover {
    filter: brightness(1.06);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px hsl(var(--header-accent) / 0.4);
  }

  .search-button:hover svg {
    transform: scale(1.12) rotate(-6deg);
  }

  .search-button:active {
    transform: translateY(0) scale(0.94);
    box-shadow: 0 1px 4px hsl(var(--header-accent) / 0.3);
  }

  @media (max-width: 768px) {
    .main-header {
      --header-module-h: 42px;
      padding: 0.625rem 0.75rem;
      gap: 0.75rem;
    }

    .header-center {
      gap: 0.75rem;
    }

    .search-wrapper {
      min-width: 0;
    }

    .search-mode-toggle {
      padding: 0.375rem 0.5rem;
      gap: 0.25rem;
      font-size: 0.8125rem;
    }

    .mode-text {
      display: none;
    }

    .search-engine-selector {
      padding: 0.375rem 0.5rem;
      gap: 0.25rem;
    }

    .engine-name {
      display: none;
    }

    .search-button {
      width: 32px;
      height: 32px;
      margin: 0 1px 0 3px;
    }

    .search-clear {
      width: 22px;
      height: 22px;
    }

    .theme-icon {
      width: 18px;
      height: 18px;
    }

    .hamburger-btn {
      width: var(--header-module-h);
      height: var(--header-module-h);
    }

    .hamburger-line {
      width: 16px;
    }
  }

  @media (max-width: 480px) {
    .main-header {
      --header-module-h: 40px;
      padding: 0.625rem 0.75rem;
    }

    .header-left {
      gap: 0.625rem;
    }

    .header-right {
      gap: 0.5rem;
    }

    .hamburger-line {
      width: 16px;
    }
  }
</style>
