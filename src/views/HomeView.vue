<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Search, ArrowDown } from '@element-plus/icons-vue'
import { useDataStore } from '../stores/data'
import { useResponsive } from '../hooks/useResponsive.ts'
import Sidebar from '../components/layout/Sidebar.vue'
import MainHeader from '../components/layout/MainHeader.vue'
import ScrollToTop from '../components/ui/ScrollToTop.vue'
import EmptyState from '../components/ui/EmptyState.vue'
import TimeDateComponent from '../components/ui/TimeDateComponent.vue'
import { defineAsyncComponent } from 'vue'
const SiteCard = defineAsyncComponent(() => import('../components/ui/SiteCard.vue'))

const dataStore = useDataStore()
const { isMobile } = useResponsive()

const searchQuery = ref('')
const selectedCategoryId = ref('all')
const sidebarOpen = ref(true)
const sidebarCollapsed = ref(false)
const searchInputRef = ref(null)
const gridKey = ref(0) // 用于触发动画
const iconErrorMap = ref({}) // 记录加载失败的图标及其URL

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

const toggleSidebarCollapse = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const closeSidebar = () => {
  sidebarOpen.value = false
}

const searchEngines = computed(() => {
  return dataStore.searchConfig.externalSources.filter(s => s.enabled)
})

const selectedEngine = computed(() => {
  return searchEngines.value.find(e => e.id === dataStore.searchConfig.selectedSourceId) || searchEngines.value[0]
})

const categories = computed(() => dataStore.visibleCategories)

const links = computed(() => {
  return dataStore.getLinksByCategory(selectedCategoryId.value)
})

const pageTitle = computed(() => {
  if (selectedCategoryId.value === 'all') return '全部网站'
  const category = categories.value.find(c => c.id === selectedCategoryId.value)
  return category?.name || '全部网站'
})

const currentCategory = computed(() => {
  return categories.value.find(c => c.id === selectedCategoryId.value)
})

const handleSearch = () => {
  if (!searchQuery.value.trim()) return
  if (selectedEngine.value) {
    window.open(selectedEngine.value.url + encodeURIComponent(searchQuery.value), '_blank')
  }
}

const selectEngine = (engineId) => {
  dataStore.updateSearchConfig({ selectedSourceId: engineId })
}

const selectCategory = (categoryId) => {
  selectedCategoryId.value = categoryId
  // 触发动画
  gridKey.value++
}

const focusSearchInput = () => {
  if (searchInputRef.value) {
    searchInputRef.value.focus()
    if (searchQuery.value) {
      searchInputRef.value.select()
    }
  }
}

const handleKeydown = (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
    event.preventDefault()
    focusSearchInput()
  }
  // ESC 键关闭移动端侧边栏
  if (event.key === 'Escape' && isMobile.value && sidebarOpen.value) {
    closeSidebar()
  }
}

// 监听分类变化，触发动画
watch(selectedCategoryId, () => {
  gridKey.value++
})

onMounted(() => {
  // 初始化侧边栏状态
  if (isMobile.value) {
    sidebarOpen.value = false
  }
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="home-layout">
    <!-- Sidebar -->
    <Sidebar
      :selected-category="selectedCategoryId"
      :is-open="sidebarOpen"
      :collapsed="sidebarCollapsed"
      @select="selectCategory"
      @toggle-collapse="toggleSidebarCollapse"
      @close="closeSidebar"
    />

    <!-- Main Content -->
    <div class="main-content" :class="{ 'sidebar-closed': !sidebarOpen, 'sidebar-collapsed': sidebarCollapsed, 'is-mobile': isMobile }">
      <!-- Header -->
      <MainHeader
        :title="pageTitle"
        @toggle-sidebar="toggleSidebar"
      />

      <!-- Search Section -->
      <div class="search-section" :class="{ 'is-mobile': isMobile }">
        <div class="search-container">
          <!-- Time Date Component -->
          <TimeDateComponent v-if="!isMobile" />
          
          <div class="search-wrapper">
            <!-- Search Engine Selector -->
            <div class="search-engine-selector">
              <!-- Favicon image with error fallback -->
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
              <el-dropdown class="search-engine-dropdown" trigger="click" @command="selectEngine">
                <el-icon class="dropdown-arrow"><arrow-down /></el-icon>
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
              ref="searchInputRef"
              v-model="searchQuery"
              :placeholder="isMobile ? `在 ${selectedEngine?.name || '必应'} 搜索...` : `在 ${selectedEngine?.name || '必应'} 搜索...`"
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
      </div>

      <!-- Sites Grid -->
      <div class="sites-section">
        <!-- Category Header -->
        <div v-if="selectedCategoryId !== 'all'" class="category-header">
          <span class="category-icon">{{ currentCategory?.icon || '🌐' }}</span>
          <h2 class="category-title">{{ currentCategory?.name || '未知分类' }}</h2>
          <span class="site-count">{{ links.length }} 个网站</span>
        </div>

        <!-- 网站列表 -->
        <div v-if="links.length > 0" class="sites-grid">
          <SiteCard
            v-for="(site, index) in links"
            :key="`${gridKey}-${site.id}`"
            :site="site"
            :style="{ animationDelay: `${index * 0.05}s` }"
          />
        </div>

        <EmptyState
          v-if="links.length === 0"
          icon="📭"
          title="暂无网站"
          :description="selectedCategoryId === 'all' ? '还没有添加任何网站' : `该分类下暂无网站`"
        />
      </div>
    </div>

    <!-- Scroll to Top Button -->
    <ScrollToTop />

    <!-- Keyboard Shortcut Hint -->
    <!-- <KeyboardHint /> -->

    <!-- Mobile Overlay -->
    <div
      v-if="isMobile && sidebarOpen"
      class="sidebar-overlay"
      @click="closeSidebar"
    ></div>

  </div>
</template>

<style scoped>
.home-layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  margin-left: 240px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--color-bg);
  transition: margin-left var(--transition-normal);
  overflow: hidden;
}

.main-content.sidebar-collapsed {
  margin-left: 64px;
}

.main-content.sidebar-closed {
  margin-left: 0;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
  }

  .main-content.sidebar-collapsed,
  .main-content.sidebar-closed {
    margin-left: 0;
  }
}

.search-section {
  display: flex;
  justify-content: center;
  padding: var(--space-xl) var(--space-md);
  margin-bottom: var(--space-lg);
}

.search-container {
  width: 100%;
  max-width: 1200px;
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex-wrap: wrap;
  justify-content: center;
}

.search-wrapper {
  flex: 1;
  min-width: 300px;
  display: flex;
  align-items: center;
  gap: 0;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 0.375rem;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
}

.search-wrapper:focus-within {
  border-color: rgba(59, 130, 246, 0.4);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1), 0 4px 12px rgba(0, 0, 0, 0.08);
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

.theme-toggle-btn {
  font-size: 1.5rem !important;
  padding: 1rem !important;
  border-radius: 16px !important;
  flex-shrink: 0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
  background: linear-gradient(145deg, var(--color-card), var(--color-bg)) !important;
  border: 2px solid var(--color-border) !important;
  position: relative;
  overflow: hidden;
}

.theme-toggle-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(139, 92, 246, 0.2) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.theme-toggle-btn:hover {
  transform: scale(1.12) rotate(180deg);
  border-color: var(--color-primary) !important;
  box-shadow:
    0 8px 24px rgba(139, 92, 246, 0.3),
    0 4px 12px rgba(139, 92, 246, 0.2) !important;
}

.theme-toggle-btn:hover::before {
  opacity: 1;
}

.theme-toggle-btn:active {
  transform: scale(1.05) rotate(180deg);
}

.sites-section {
  flex: 1;
  padding: 0 1.5rem 2rem;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem 0 1.25rem;
  margin-bottom: 1rem;
  border-bottom: 2px solid var(--color-border);
}

.category-icon {
  font-size: 1.75rem;
  line-height: 1;
}

.category-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  line-height: 1.2;
}

.site-count {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  padding: 0.25rem 0.75rem;
  background: var(--color-bg);
  border-radius: 20px;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.sites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-md);
  max-width: 1400px;
  margin: 0 auto;
  padding-bottom: var(--space-xl);
  animation: fadeInUp 0.5s var(--ease-out-expo);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.main-content.sidebar-collapsed .sites-grid {
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--space-lg);
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 90;
  backdrop-filter: blur(4px);
}

/* Transition Animations */
.category-fade-enter-active,
.category-fade-leave-active {
  transition: all var(--transition-normal);
}

.category-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.category-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.grid-fade-enter-active,
.grid-fade-leave-active {
  transition: all var(--transition-normal);
}

.grid-fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.grid-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Staggered animation for site cards */
.sites-grid > * {
  animation: cardFadeIn 0.4s var(--ease-out-expo) backwards;
}

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(15px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Smooth scroll behavior */
html {
  scroll-behavior: smooth;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
  }

  .search-section {
    padding: 1rem;
  }

  .search-section.is-mobile .search-container {
    flex-direction: column;
    gap: 0.75rem;
  }

  .search-section.is-mobile .search-wrapper {
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
    border-radius: 16px;
  }

  .search-section.is-mobile .search-engine-selector {
    width: 100%;
    justify-content: center;
    padding: 0.625rem 1rem;
  }

  .search-section.is-mobile .search-input :deep(.el-input__inner) {
    padding: 0.625rem 0.875rem;
    font-size: 0.9375rem;
  }

  .search-section.is-mobile .search-button {
    padding: 0.625rem 1.25rem !important;
  }

  .search-section.is-mobile .theme-toggle-btn {
    width: 100%;
    padding: 0.75rem !important;
  }

  .sites-section {
    padding: 0 1rem 2rem;
  }

  .category-header {
    flex-wrap: wrap;
    padding: 1rem 0 0.75rem;
  }

  .category-icon {
    font-size: 1.5rem;
  }

  .category-title {
    font-size: 1.25rem;
  }

  .site-count {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }

  .sites-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

/* 小屏幕手机适配 */
@media (max-width: 480px) {
  .search-section.is-mobile .search-wrapper {
    padding: 0.625rem;
  }

  .search-section.is-mobile .search-engine-selector {
    padding: 0.5rem 0.875rem;
    font-size: 0.875rem;
  }

  .search-section.is-mobile .search-input :deep(.el-input__inner) {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
  }

  .search-section.is-mobile .search-button {
    padding: 0.5rem 1rem !important;
  }

  .sites-grid {
    gap: 0.75rem;
  }
}

/* Empty State Transitions */
.empty-fade-enter-active,
.empty-fade-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.empty-fade-enter-from {
  opacity: 0;
  transform: translateY(15px) scale(0.98);
}

.empty-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}

/* Grid Transitions */
.grid-fade-enter-active,
.grid-fade-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.grid-fade-enter-from {
  opacity: 0;
  transform: translateY(15px) scale(0.98);
}

.grid-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}

/* Category Header Transitions */
.category-fade-enter-active,
.category-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.category-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.category-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
