<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDataStore } from '../stores/data'
import Sidebar from '../components/layout/Sidebar.vue'
import MainHeader from '../components/layout/MainHeader.vue'
import SiteCard from '../components/ui/SiteCard.vue'
import Notification from '../components/ui/Notification.vue'
import { useNotification } from '../hooks/useNotification'

// 排序相关变量
const draggedElement = ref(null)
const overElement = ref(null)

// 通知管理
const { notifications, success, error, removeNotification } = useNotification()

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
  // 批量编辑模式快捷键
  if (dataStore.batchEditMode) {
    if (event.key === 'Escape') {
      dataStore.toggleBatchEditMode()
    } else if ((event.metaKey || event.ctrlKey) && event.key === 'a') {
      event.preventDefault()
      dataStore.selectAllLinks(selectedCategoryId.value)
    }
  }
  // 排序模式快捷键
  if (dataStore.sortMode && event.key === 'Escape') {
    dataStore.toggleSortMode()
  }
}

// 批量编辑相关方法
const handleBatchEditClick = () => {
  if (dataStore.sortMode) {
    success('已退出排序模式，进入批量编辑模式')
  }
  dataStore.toggleBatchEditMode()
}

const handleSortClick = () => {
  if (dataStore.batchEditMode) {
    success('已退出批量编辑模式，进入排序模式')
  }
  dataStore.toggleSortMode()
}

const handleSelectAll = () => {
  dataStore.selectAllLinks(selectedCategoryId.value)
}

const handleDeselectAll = () => {
  dataStore.deselectAllLinks()
}

const handleBatchTogglePin = () => {
  dataStore.batchTogglePin()
  success('批量置顶操作完成')
}

const handleBatchDelete = () => {
  if (confirm('确定要删除选中的网站吗？')) {
    dataStore.batchDelete()
    success('批量删除操作完成')
  }
}

const handleBatchMove = (targetCategoryId) => {
  if (targetCategoryId) {
    dataStore.batchMove(targetCategoryId)
    const categoryName = categories.value.find(c => c.id === targetCategoryId)?.name
    success(`批量移动到 ${categoryName} 完成`)
  }
}

// 拖拽排序相关方法
const handleDragStart = (event, siteId) => {
  draggedElement.value = siteId
  event.dataTransfer.effectAllowed = 'move'
  // 为拖拽元素添加视觉效果
  event.target.classList.add('dragging')
}

const handleDragOver = (event, siteId) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
  overElement.value = siteId
  // 为目标元素添加视觉效果
  event.target.classList.add('drag-over')
}

const handleDrop = (event, siteId) => {
  event.preventDefault()
  if (draggedElement.value && draggedElement.value !== siteId) {
    dataStore.reorderLinks(draggedElement.value, siteId, selectedCategoryId.value)
    success('排序已更新')
  }
  draggedElement.value = null
  overElement.value = null
  // 移除视觉效果
  event.target.classList.remove('drag-over')
  document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'))
}

const handleDragEnd = () => {
  draggedElement.value = null
  overElement.value = null
  // 移除所有视觉效果
  document.querySelectorAll('.dragging, .drag-over').forEach(el => {
    el.classList.remove('dragging', 'drag-over')
  })
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
        @batch-edit-click="handleBatchEditClick"
        @sort-click="handleSortClick"
      />

      <!-- Search Section -->
      <div class="search-section" v-if="!dataStore.batchEditMode && !dataStore.sortMode">
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

      <!-- Batch Edit Toolbar -->
      <div v-if="dataStore.batchEditMode" class="batch-edit-toolbar">
        <div class="batch-edit-container">
          <div class="batch-edit-actions">
            <button class="batch-btn" @click="handleSelectAll">
              <span>全选</span>
              <span class="shortcut-hint">⌘A</span>
            </button>
            <button class="batch-btn" @click="handleDeselectAll">
              <span>取消全选</span>
            </button>
            <button class="batch-btn" @click="handleBatchTogglePin">
              <span>置顶/取消置顶</span>
            </button>
            <button class="batch-btn danger" @click="handleBatchDelete">
              <span>删除</span>
            </button>
            <div class="batch-move">
              <select @change="handleBatchMove($event.target.value)" class="move-select">
                <option value="">移动到...</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </div>
            <button class="batch-btn close" @click="handleBatchEditClick">
              <span>完成</span>
              <span class="shortcut-hint">Esc</span>
            </button>
          </div>
          <div class="batch-edit-info">
            已选择 {{ dataStore.selectedLinks.length }} 个网站
          </div>
        </div>
      </div>

      <!-- Sort Mode Toolbar -->
      <div v-if="dataStore.sortMode" class="sort-toolbar">
        <div class="sort-container">
          <div class="sort-info">
            <span>排序模式：拖拽调整网站顺序</span>
          </div>
          <button class="sort-btn close" @click="handleSortClick">
            <span>完成排序</span>
            <span class="shortcut-hint">Esc</span>
          </button>
        </div>
      </div>

      <!-- Sites Grid -->
      <div class="sites-section">
        <div class="sites-grid">
          <SiteCard
            v-for="site in filteredLinks"
            :key="site.id"
            :site="site"
            :on-drag-start="handleDragStart"
            :on-drag-over="handleDragOver"
            :on-drop="handleDrop"
            :on-drag-end="handleDragEnd"
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

    <!-- Notifications -->
    <Notification
      v-for="notification in notifications"
      :key="notification.id"
      :message="notification.message"
      :type="notification.type"
      :duration="notification.duration"
      @close="removeNotification(notification.id)"
    />
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
  padding: 1.5rem 1.5rem 2rem;
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

/* Batch Edit Toolbar */
.batch-edit-toolbar {
  padding: 1.5rem 1.5rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.batch-edit-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.batch-edit-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 1.25rem;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
}

.batch-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.9);
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  min-width: 120px;
  justify-content: center;
}

.batch-btn:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.batch-btn.danger {
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
  background: rgba(239, 68, 68, 0.05);
}

.batch-btn.danger:hover {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

.batch-btn.close {
  margin-left: auto;
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: rgba(14, 165, 233, 0.05);
}

.batch-btn.close:hover {
  background: var(--color-primary);
  color: white;
}

.batch-move {
  margin-left: 0;
}

.move-select {
  padding: 0.75rem 1.5rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.9);
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  min-width: 150px;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 16px;
}

.move-select:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%230ea5e9' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
}

.move-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.batch-edit-info {
  font-size: 0.875rem;
  color: var(--color-secondary);
}

.shortcut-hint {
  font-size: 0.75rem;
  color: var(--color-secondary);
  background: var(--color-bg);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  border: 1px solid var(--color-border);
}

/* Sort Toolbar */
.sort-toolbar {
  padding: 1rem 1.5rem;
  background: var(--color-card);
  border-bottom: 1px solid var(--color-border);
}

.sort-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sort-info {
  font-size: 0.875rem;
  color: var(--color-text);
}

.sort-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-primary);
  border-radius: 8px;
  background: var(--color-primary);
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.sort-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
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

  /* Batch Edit Toolbar - Mobile */
  .batch-edit-toolbar {
    padding: 0.75rem 1rem;
  }

  .batch-edit-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .batch-btn {
    justify-content: center;
  }

  .batch-btn.close {
    margin-left: 0;
  }

  .batch-move {
    margin-left: 0;
    width: 100%;
  }

  .move-select {
    width: 100%;
  }

  /* Sort Toolbar - Mobile */
  .sort-toolbar {
    padding: 0.75rem 1rem;
  }

  .sort-container {
    flex-direction: column;
    gap: 0.5rem;
    align-items: stretch;
  }

  .sort-btn {
    justify-content: center;
  }
}
</style>
