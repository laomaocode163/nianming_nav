<script setup>
import { useThemeStore } from '../../stores/theme'
import { useResponsive } from '../../hooks/useResponsive'
import TimeDateComponent from '../ui/TimeDateComponent.vue'
import { ref, computed } from 'vue'
import { useDataStore } from '../../stores/data'
import { ArrowDown, Search } from '@element-plus/icons-vue'

defineProps({
})

const emit = defineEmits(['toggle-sidebar'])

const themeStore = useThemeStore()
const dataStore = useDataStore()
const { isMobile } = useResponsive()

const iconErrorMap = ref({}) // 记录加载失败的图标及其URL

const searchEngines = computed(() => {
  return dataStore.searchConfig.externalSources.filter(s => s.enabled)
})

const selectedEngine = computed(() => {
  return searchEngines.value.find(e => e.id === dataStore.searchConfig.selectedSourceId) || searchEngines.value[0]
})

const handleIconError = (engineId, iconUrl) => {
  // 记录失败的URL
  iconErrorMap.value[engineId] = iconUrl
}

const getEngineDisplayIcon = (engine) => {
  if (!engine?.icon) {
    return null // 返回 null 显示首字母
  }
  // 如果当前URL加载失败过，则显示fallback
  if (iconErrorMap.value[engine.id] === engine.icon) {
    return null
  }
  return engine.icon
}

const selectEngine = (engineId) => {
  dataStore.updateSearchConfig({ selectedSourceId: engineId })
}

const handleSearch = () => {
  if (!dataStore.searchQuery.trim()) return
  
  if (dataStore.searchMode === 'external') {
    // 外部搜索（搜索引擎）
    if (selectedEngine.value) {
      window.open(selectedEngine.value.url + encodeURIComponent(dataStore.searchQuery), '_blank')
      // 清空搜索框内容
      dataStore.updateSearchQuery('')
    }
  } else {
    // 内部搜索（网站搜索）
    // 搜索已经通过计算属性实时过滤，不需要额外操作
  }
}
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
        <div class="search-mode-toggle" @click="dataStore.updateSearchMode(dataStore.searchMode === 'external' ? 'internal' : 'external')">
          <span class="mode-icon">{{ dataStore.searchMode === 'external' ? '🌐' : '🔍' }}</span>
          <span class="mode-text">{{ dataStore.searchMode === 'external' ? '搜索' : '站内' }}</span>
        </div>
        
        <!-- Search Engine Selector (only show in external mode) -->
        <div v-if="dataStore.searchMode === 'external'" class="search-engine-selector">
          <el-dropdown class="search-engine-dropdown" trigger="click" @command="selectEngine">
            <!-- Favicon image with error fallback -->
            <div class="engine-selector-content">
              <div v-if="getEngineDisplayIcon(selectedEngine)" class="engine-icon-wrapper">
                <img
                  :src="getEngineDisplayIcon(selectedEngine)"
                  :alt="selectedEngine.name"
                  class="engine-icon-img"
                  @error="handleIconError(selectedEngine.id, getEngineDisplayIcon(selectedEngine))"
                />
              </div>
              <!-- Fallback: show first letter when icon fails -->
              <div v-else class="engine-icon-fallback">
                {{ selectedEngine?.name?.charAt(0) || 'G' }}
              </div>
              <span class="engine-name">{{ selectedEngine?.name || 'Bing' }}</span>
              <el-icon class="dropdown-arrow"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="engine in searchEngines"
                  :key="engine.id"
                  :command="engine.id"
                >
                  <div v-if="getEngineDisplayIcon(engine)" class="dropdown-engine-icon-wrapper">
                    <img
                      :src="getEngineDisplayIcon(engine)"
                      :alt="engine.name"
                      class="dropdown-engine-icon"
                      @error="handleIconError(engine.id, getEngineDisplayIcon(engine))"
                    />
                  </div>
                  <div v-else class="dropdown-engine-fallback">
                    {{ engine.name?.charAt(0) || '?' }}
                  </div>
                  {{ engine.name }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <!-- Search Input -->
        <el-input
          v-model="dataStore.searchQuery"
          :placeholder="dataStore.searchMode === 'external' ? (isMobile ? `在 ${selectedEngine?.name || '必应'} 搜索...` : `在 ${selectedEngine?.name || '必应'} 搜索...`) : '搜索站内网站...'"
          :size="isMobile ? 'default' : 'large'"
          clearable
          class="search-input"
          @keyup.enter="handleSearch"
        >
          <template #suffix>
            <el-button type="primary" class="search-button" @click="handleSearch">
              <el-icon><Search /></el-icon>
            </el-button>
          </template>
        </el-input>
      </div>
    </div>

    <div class="header-right">
      <el-button
        class="theme-btn"
        :title="themeStore.isDark ? '切换到亮色模式' : '切换到暗色模式'"
        text
        @click="themeStore.toggleTheme"
      >
        <span v-if="themeStore.isDark">☀️</span>
        <span v-else>🌙</span>
      </el-button>
    </div>
  </header>
</template>

<style scoped>
.main-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.5rem;
  background: var(--color-card);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 50;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.header-center {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: transparent;
  font-size: 1.125rem;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
}

.theme-btn:hover {
  border-color: var(--color-primary);
  background: hsl(var(--hue-primary), 10%, 96%);
  color: var(--color-primary);
}

.dark .theme-btn:hover {
  background: hsl(var(--hue-primary), 20%, 18%);
}

.theme-btn:active {
  transform: scale(0.95);
}

/* 图标动画 */
.theme-btn span {
  display: inline-block;
  transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Search Styles */
.search-wrapper {
  flex: 1;
  min-width: 300px;
  display: flex;
  align-items: center;
  gap: 0;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
}

.search-wrapper:focus-within {
  border-color: rgba(59, 130, 246, 0.4);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1), 0 4px 12px rgba(0, 0, 0, 0.08);
}

.search-mode-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  border-radius: 8px;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  position: relative;
  background: transparent;
  white-space: nowrap;
}

.search-mode-toggle:hover {
  color: var(--color-primary);
  background: hsl(var(--hue-primary), 15%, 96%);
}

.dark .search-mode-toggle:hover {
  background: hsl(var(--hue-primary), 20%, 18%);
}

.mode-icon {
  font-size: 1rem;
  line-height: 1;
}

.search-engine-dropdown {
  flex-shrink: 0;
}

.search-engine-selector {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  border-radius: 8px;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  position: relative;
  background: transparent;
  white-space: nowrap;
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
  0% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(0.8) rotate(8deg); }
  100% { transform: scale(1) rotate(0deg); }
}

.search-engine-selector.cycling .engine-name {
  animation: nameFade 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes nameFade {
  0% { opacity: 1; transform: translateX(0); }
  50% { opacity: 0; transform: translateX(-4px); }
  100% { opacity: 1; transform: translateX(0); }
}

.dropdown-arrow {
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.75rem;
  padding: 2px;
}

.dropdown-arrow:hover {
  color: var(--color-primary);
}

.search-engine-dropdown :deep(.dropdown-engine-icon) {
  width: 16px;
  height: 16px;
  object-fit: contain;
  margin-right: 8px;
  border-radius: 3px;
  vertical-align: middle;
}

.search-engine-dropdown :deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
}

.search-input {
  flex: 1;
}

.search-input :deep(.el-input__wrapper) {
  box-shadow: none !important;
  padding: 0;
  background: transparent !important;
}

.search-input :deep(.el-input__inner) {
  font-size: 0.9375rem;
  padding: 0.5rem 0.75rem;
  color: var(--color-text);
}

.search-input :deep(.el-input__inner)::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.6;
}

.search-button {
  border-radius: 8px !important;
  width: 38px !important;
  height: 38px !important;
  padding: 0 !important;
  margin: 0 !important;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1) !important;
  background: var(--color-primary) !important;
  border: none !important;
  box-shadow: 0 1px 3px rgba(59, 130, 246, 0.2);
}

.search-button:hover {
  background: hsl(var(--hue-primary), var(--sat-primary), calc(var(--lig-primary) - 5%)) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
}

.search-button:active {
  transform: translateY(0px) scale(0.97);
}

@media (max-width: 768px) {
  .main-header {
    padding: 0.75rem 1rem;
  }

  .search-wrapper {
    padding: 0.625rem 0.875rem;
  }

  .theme-btn {
    width: 34px;
    height: 34px;
    font-size: 1.05rem;
  }

  .hamburger-btn {
    width: 34px;
    height: 34px;
  }

  .hamburger-line {
    width: 16px;
  }
}

@media (max-width: 480px) {
  .main-header {
    padding: 0.625rem 0.75rem;
  }

  .header-left {
    gap: 0.625rem;
  }

  .search-wrapper {
    padding: 0.5rem 0.75rem;
  }

  .header-right {
    gap: 0.5rem;
  }

  .theme-btn {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }

  .hamburger-btn {
    width: 36px;
    height: 36px;
  }

  .hamburger-line {
    width: 16px;
  }
}
</style>
