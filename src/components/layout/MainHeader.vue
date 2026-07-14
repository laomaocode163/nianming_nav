<script setup lang="ts">
  import { useThemeStore } from '../../stores/theme';
  import { useResponsive } from '../../hooks/useResponsive';
  import TimeDateComponent from '../ui/TimeDateComponent.vue';
  import { ref, computed, onMounted, onUnmounted } from 'vue';
  import { useDataStore } from '../../stores/data';
  import { useUiStore } from '../../stores/ui';
  import type { SearchSource } from '../../types';
  import { safeUrl } from '../../utils/url';
  import { useRouter } from 'vue-router';
  import { Sun, Moon, Globe, Search, X, ChevronDown, Settings } from 'lucide-vue-next';

  const emit = defineEmits(['toggle-sidebar']);

  const router = useRouter();
  const isDev = import.meta.env.DEV;
  const themeStore = useThemeStore();
  const dataStore = useDataStore();
  const uiStore = useUiStore();
  const { isMobile } = useResponsive();

  // 搜索引擎图标加载失败记录：按「引擎 id + 图标 url」维度记录，带 TTL，过期后允许重试
  const ICON_ERROR_TTL = 5 * 60 * 1000;
  const iconErrorMap = ref<Record<string, { url: string; ts: number }>>({});
  const showEngineMenu = ref(false);
  const engineSelectorRef = ref<HTMLElement | null>(null);
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
  };

  const selectEngine = (engineId: string) => {
    dataStore.updateSearchConfig({ selectedSourceId: engineId });
    try {
      localStorage.setItem('selected-search-source', engineId);
    } catch {
      /* 隐私模式等写入失败时忽略 */
    }
    showEngineMenu.value = false;
  };

  const closeEngineMenu = (e: Event): void => {
    if (engineSelectorRef.value && !engineSelectorRef.value.contains(e.target as Node)) {
      showEngineMenu.value = false;
    }
  };

  onMounted(() => document.addEventListener('click', closeEngineMenu));
  onUnmounted(() => document.removeEventListener('click', closeEngineMenu));

  const handleSearch = () => {
    if (!uiStore.searchQuery.trim()) return;

    if (uiStore.searchMode === 'external') {
      // 外部搜索（搜索引擎）
      if (selectedEngine.value) {
        window.open(
          safeUrl(selectedEngine.value.url + encodeURIComponent(uiStore.searchQuery)),
          '_blank',
          'noopener,noreferrer'
        );
        // 清空搜索框内容
        uiStore.updateSearchQuery('');
      }
    } else {
      // 内部搜索（网站搜索）
      // 搜索已经通过计算属性实时过滤，不需要额外操作
    }
  };
</script>

<template>
  <header class="main-header">
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
        <div class="search-mode-toggle" @click="uiStore.toggleSearchMode()">
          <span class="mode-icon">
            <Globe v-if="uiStore.searchMode === 'external'" :size="16" :stroke-width="2" />
            <Search v-else :size="16" :stroke-width="2" />
          </span>
          <span class="mode-text">{{ uiStore.searchMode === 'external' ? '搜索' : '站内' }}</span>
        </div>

        <!-- Search Engine Selector (only show in external mode) -->
        <div
          v-if="uiStore.searchMode === 'external'"
          ref="engineSelectorRef"
          class="search-engine-selector"
        >
          <div class="engine-selector-content" @click="toggleEngineMenu">
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
          <div v-if="showEngineMenu" class="engine-dropdown-menu">
            <div
              v-for="engine in searchEngines"
              :key="engine.id"
              class="engine-dropdown-item"
              :class="{ selected: engine.id === selectedEngine?.id }"
              @click="selectEngine(engine.id)"
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
          class="search-input"
          type="text"
          :value="uiStore.searchQuery"
          :placeholder="
            uiStore.searchMode === 'external'
              ? `在 ${selectedEngine?.name || DEFAULT_ENGINE_NAME} 搜索...`
              : '搜索站内网站...'
          "
          @input="uiStore.updateSearchQuery(($event.target as HTMLInputElement).value)"
          @keyup.enter="handleSearch"
        />
        <button
          v-if="uiStore.searchQuery"
          class="search-clear"
          type="button"
          aria-label="清空搜索"
          @click="uiStore.updateSearchQuery('')"
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
        v-if="isDev"
        class="admin-btn"
        type="button"
        title="管理后台"
        aria-label="打开管理后台"
        @click="router.push('/admin')"
      >
        <Settings class="admin-icon" :size="20" :stroke-width="2" />
      </button>
      <button
        class="theme-btn"
        type="button"
        :title="themeStore.isDark ? '切换到亮色模式' : '切换到暗色模式'"
        :aria-pressed="themeStore.isDark"
        @click="themeStore.toggleTheme"
      >
        <Sun v-if="themeStore.isDark" class="theme-icon" :size="20" :stroke-width="2" />
        <Moon v-else class="theme-icon" :size="20" :stroke-width="2" />
      </button>
    </div>
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
    background: var(--color-card);
    border-bottom: 1px solid var(--color-border);
    position: sticky;
    top: 0;
    z-index: 50;
    transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
    gap: var(--space-lg);
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

  .theme-btn {
    width: var(--header-module-h);
    height: var(--header-module-h);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-card);
    cursor: pointer;
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);
    box-shadow: var(--shadow-sm);
  }

  .theme-btn:hover {
    border-color: var(--color-primary);
    background: hsl(var(--hue-primary), 10%, 96%);
    color: var(--color-primary);
    box-shadow: var(--shadow-md);
  }

  .dark .theme-btn:hover {
    background: hsl(var(--hue-primary), 20%, 18%);
  }

  .theme-btn:active {
    transform: scale(0.95);
  }

  .admin-btn {
    width: var(--header-module-h);
    height: var(--header-module-h);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-card);
    cursor: pointer;
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);
    box-shadow: var(--shadow-sm);
  }

  .admin-btn:hover {
    border-color: var(--color-primary);
    background: hsl(var(--hue-primary), 10%, 96%);
    color: var(--color-primary);
    box-shadow: var(--shadow-md);
  }

  .dark .admin-btn:hover {
    background: hsl(var(--hue-primary), 20%, 18%);
  }

  .admin-btn:active {
    transform: scale(0.95);
  }

  .admin-icon {
    transition: transform 500ms var(--ease-in-out-quint);
  }

  .admin-btn:hover .admin-icon {
    transform: rotate(90deg);
  }

  /* 图标动画 */
  .theme-icon {
    display: block;
    transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .theme-btn:hover .theme-icon {
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
    background: var(--color-bg);
    border: 1px solid var(--color-border);
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
    border-radius: var(--radius-sm);
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
    position: relative;
    background: transparent;
    white-space: nowrap;
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
    background: var(--color-card);
    border: 1px solid var(--color-border);
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

  .engine-dropdown-item:hover {
    background: hsl(var(--hue-primary), 15%, 96%);
    color: var(--color-primary);
  }

  .dark .engine-dropdown-item:hover {
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
