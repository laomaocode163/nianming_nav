<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDataStore } from '../stores/data'
import Sidebar from '../components/layout/Sidebar.vue'
import MainHeader from '../components/layout/MainHeader.vue'
import SiteCard from '../components/ui/SiteCard.vue'

const dataStore = useDataStore()

const searchQuery = ref('')
const selectedCategoryId = ref('all')
const sidebarOpen = ref(true)
const sidebarCollapsed = ref(false)
const isMobile = ref(false)
const searchInputRef = ref(null)

const searchEngines = computed(() => {
  return dataStore.searchConfig.externalSources.filter(s => s.enabled)
})

const selectedEngine = computed(() => {
  return searchEngines.value.find(e => e.id === dataStore.searchConfig.selectedSourceId) || searchEngines.value[0]
})

const categories = computed(() => dataStore.visibleCategories)

const filteredLinks = computed(() => {
  return dataStore.getLinksByCategory(selectedCategoryId.value)
})

const pageTitle = computed(() => {
  if (selectedCategoryId.value === 'all') return '全部网站'
  const category = categories.value.find(c => c.id === selectedCategoryId.value)
  return category?.name || '全部网站'
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
  if (isMobile.value) {
    sidebarOpen.value = false
  }
}

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const handleCollapse = (collapsed) => {
  sidebarCollapsed.value = collapsed
}

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value) {
    sidebarOpen.value = false
  }
}

// 聚焦搜索框
const focusSearchInput = () => {
  if (searchInputRef.value) {
    searchInputRef.value.focus()
    // 如果有内容，选中所有文本
    if (searchQuery.value) {
      searchInputRef.value.select()
    }
  }
}

// 键盘事件处理
const handleKeydown = (event) => {
  // 检测 ⌘K (Mac) 或 Ctrl+K (Windows/Linux)
  if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
    event.preventDefault()
    focusSearchInput()
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  // 移除键盘事件监听
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="home-layout">
    <!-- Sidebar -->
    <Sidebar
      :selected-category="selectedCategoryId"
      :is-open="sidebarOpen"
      :is-collapsed="sidebarCollapsed"
      @select="selectCategory"
      @toggle="toggleSidebar"
      @collapse="handleCollapse"
    />

    <!-- Main Content -->
    <div class="main-content" :class="{ 'sidebar-closed': !sidebarOpen, 'sidebar-collapsed': sidebarCollapsed }">
      <!-- Header -->
      <MainHeader 
        :title="pageTitle"
        @menu-click="toggleSidebar"
      />

      <!-- Search Section -->
      <div class="search-section">
        <div class="search-container">
          <!-- Search Box -->
          <div class="search-box">
            <div class="search-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </div>
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              class="search-input"
              :placeholder="`在 ${selectedEngine?.name || '必应'} 搜索...`"
              @keyup.enter="handleSearch"
            />
            <div class="search-shortcut">
              <span class="shortcut-key">⌘</span>
              <span class="shortcut-key">K</span>
            </div>
            <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <!-- Engine Selector -->
          <div class="engine-selector">
            <button
              v-for="engine in searchEngines.slice(0, 4)"
              :key="engine.id"
              class="engine-tag"
              :class="{ active: selectedEngine?.id === engine.id }"
              @click="selectEngine(engine.id)"
            >
              {{ engine.name }}
            </button>
          </div>
        </div>
      </div>

      <!-- Sites Grid -->
      <div class="sites-section">
        <div class="sites-grid">
          <SiteCard
            v-for="site in filteredLinks"
            :key="site.id"
            :site="site"
          />
        </div>

        <div v-if="filteredLinks.length === 0" class="empty-state">
          <span class="empty-icon">📭</span>
          <p>暂无网站数据</p>
        </div>
      </div>
    </div>

    <!-- Mobile Overlay -->
    <div 
      v-if="isMobile && sidebarOpen" 
      class="sidebar-overlay"
      @click="sidebarOpen = false"
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
  margin-left: 260px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--color-bg);
  transition: margin-left 0.3s ease;
}

.main-content.sidebar-closed {
  margin-left: 0;
}

.main-content.sidebar-collapsed {
  margin-left: 60px;
}

.search-section {
  display: flex;
  justify-content: center;
  padding: 2rem 1rem;
}

.search-container {
  width: 100%;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.search-box {
  display: flex;
  align-items: center;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}

.search-box:focus-within {
  box-shadow: var(--shadow-md), 0 0 0 3px rgba(14, 165, 233, 0.1);
  border-color: var(--color-primary);
}

.search-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-secondary);
  margin-right: 0.75rem;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--color-text);
  font-size: 0.9375rem;
  outline: none;
  padding: 0;
}

.search-input::placeholder {
  color: var(--color-secondary);
}

.search-shortcut {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-right: 0.5rem;
}

.shortcut-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 4px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--color-secondary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;
}

.search-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--color-secondary);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.search-clear:hover {
  background: var(--color-bg);
  color: var(--color-text);
}

.engine-selector {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.engine-tag {
  padding: 0.375rem 0.875rem;
  border: 1px solid var(--color-border);
  background: var(--color-card);
  color: var(--color-secondary);
  font-size: 0.8125rem;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.engine-tag:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.engine-tag.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.sites-section {
  flex: 1;
  padding: 0 1.5rem 2rem;
}

.sites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  max-width: 1400px;
  margin: 0 auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: var(--color-secondary);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 90;
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
  }

  .search-section {
    padding: 1rem;
  }

  .sites-section {
    padding: 0 1rem 2rem;
  }

  .sites-grid {
    grid-template-columns: 1fr;
  }
}
</style>
