<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, ArrowDown } from '@element-plus/icons-vue'
import { useDataStore } from '../stores/data'
import { useThemeStore } from '../stores/theme'
import { useResponsive } from '../hooks/useResponsive'
import Sidebar from '../components/layout/Sidebar.vue'
import MainHeader from '../components/layout/MainHeader.vue'
import SiteCard from '../components/ui/SiteCard.vue'
import { VueDraggable } from 'vue-draggable-plus'

const dataStore = useDataStore()
const themeStore = useThemeStore()
const { isMobile, isSmallMobile } = useResponsive()

const searchQuery = ref('')
const selectedCategoryId = ref('all')
const sidebarOpen = ref(true)
const sidebarCollapsed = ref(false)
const searchInputRef = ref(null)
const selectedMoveCategory = ref('')
const batchLoading = ref(false)

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

const sortableLinks = computed({
  get: () => {
    return dataStore.getLinksByCategory(selectedCategoryId.value)
  },
  set: (newList) => {
    updateLinksOrder(newList)
  }
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
  if (dataStore.batchEditMode) {
    if (event.key === 'Escape') {
      dataStore.toggleBatchEditMode()
    } else if ((event.metaKey || event.ctrlKey) && event.key === 'a') {
      event.preventDefault()
      dataStore.selectAllLinks(selectedCategoryId.value)
    }
  }
  if (dataStore.sortMode && event.key === 'Escape') {
    dataStore.toggleSortMode()
  }
}

const handleBatchEditClick = () => {
  if (dataStore.sortMode) {
    ElMessage.info('已退出排序模式，进入批量编辑模式')
  }
  dataStore.toggleBatchEditMode()
}

const handleSortClick = () => {
  if (dataStore.batchEditMode) {
    ElMessage.info('已退出批量编辑模式，进入排序模式')
  }
  dataStore.toggleSortMode()
}

const handleSelectAll = () => {
  dataStore.selectAllLinks(selectedCategoryId.value)
  ElMessage.success(`已选择 ${dataStore.selectedLinks.length} 个网站`)
}

const handleDeselectAll = () => {
  dataStore.deselectAllLinks()
  ElMessage.info('已取消全选')
}

const handleBatchTogglePin = () => {
  if (dataStore.selectedLinks.length === 0) {
    ElMessage.warning('请先选择要操作的网站')
    return
  }
  batchLoading.value = true
  dataStore.batchTogglePin()
  batchLoading.value = false
  ElMessage.success('批量置顶操作完成')
}

const handleBatchDelete = async () => {
  if (dataStore.selectedLinks.length === 0) {
    ElMessage.warning('请先选择要删除的网站')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${dataStore.selectedLinks.length} 个网站吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    batchLoading.value = true
    dataStore.batchDelete()
    batchLoading.value = false
    ElMessage.success('批量删除操作完成')
  } catch {
    // 用户取消
  }
}

const handleBatchMove = (targetCategoryId) => {
  if (!targetCategoryId) return
  if (dataStore.selectedLinks.length === 0) {
    ElMessage.warning('请先选择要移动的网站')
    selectedMoveCategory.value = ''
    return
  }
  batchLoading.value = true
  dataStore.batchMove(targetCategoryId)
  batchLoading.value = false
  const categoryName = categories.value.find(c => c.id === targetCategoryId)?.name
  ElMessage.success(`已移动 ${dataStore.selectedLinks.length} 个网站到 ${categoryName}`)
  selectedMoveCategory.value = ''
}

const updateLinksOrder = (newList) => {
  newList.forEach((link, index) => {
    const originalLink = dataStore.links.find(l => l.id === link.id)
    if (originalLink) {
      originalLink.order = index
    }
  })
  dataStore.saveData()
}

const onSortEnd = () => {
  ElMessage.success('排序已更新')
}

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
    <div class="main-content" :class="{ 'sidebar-closed': !sidebarOpen, 'is-mobile': isMobile }">
      <!-- Header -->
      <MainHeader
        :title="pageTitle"
        @batch-edit-click="handleBatchEditClick"
        @sort-click="handleSortClick"
        @toggle-sidebar="toggleSidebar"
      />

      <!-- Search Section -->
      <div class="search-section" v-if="!dataStore.batchEditMode && !dataStore.sortMode" :class="{ 'is-mobile': isMobile }">
        <div class="search-container">
          <div class="search-wrapper">
            <!-- Search Engine Selector -->
            <el-dropdown
              class="search-engine-dropdown"
              trigger="click"
            >
              <div class="search-engine-selector">
                <span class="engine-name">{{ selectedEngine?.name || 'Bing' }}</span>
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="engine in searchEngines"
                    :key="engine.id"
                    :command="engine.id"
                    :class="{ active: dataStore.searchConfig.selectedSourceId === engine.id }"
                    @click="selectEngine(engine.id)"
                  >
                    {{ engine.name }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>

            <!-- Search Input -->
            <el-input
              ref="searchInputRef"
              v-model="searchQuery"
              :placeholder="isMobile ? `在 ${selectedEngine?.name || '必应'} 搜索...` : `在 ${selectedEngine?.name || '必应'} 搜索... (点 logo 切换搜索引擎)`"
              :size="isMobile ? 'default' : 'large'"
              clearable
              class="search-input"
              @keyup.enter="handleSearch"
            >
              <template #suffix>
                <el-button type="primary" @click="handleSearch" class="search-button">
                  <el-icon><Search /></el-icon>
                </el-button>
              </template>
            </el-input>
          </div>

          <!-- Theme Toggle - 小屏幕手机隐藏 -->
          <el-button
            v-if="!isSmallMobile"
            class="theme-toggle-btn"
            @click="themeStore.toggleTheme"
            text
            :size="isMobile ? 'default' : 'large'"
          >
            <span v-if="themeStore.isDark">☀️</span>
            <span v-else>🌙</span>
          </el-button>
        </div>
      </div>

      <!-- Batch Edit Toolbar -->
      <div v-if="dataStore.batchEditMode" class="batch-edit-toolbar">
        <div class="batch-edit-container">
          <el-button-group class="batch-edit-actions">
            <el-button type="primary" @click="handleSelectAll">
              全选 <el-tag size="small" type="info" class="shortcut-tag">⌘A</el-tag>
            </el-button>
            <el-button type="info" @click="handleDeselectAll">
              取消全选
            </el-button>
            <el-button type="success" @click="handleBatchTogglePin" :loading="batchLoading">
              置顶/取消置顶
            </el-button>
            <el-button type="danger" @click="handleBatchDelete" :loading="batchLoading">
              删除
            </el-button>
          </el-button-group>

          <div class="batch-edit-secondary">
            <el-select
              v-model="selectedMoveCategory"
              placeholder="移动到..."
              @change="handleBatchMove"
              class="move-select"
              :disabled="batchLoading"
            >
              <el-option
                v-for="category in categories"
                :key="category.id"
                :label="`${category.icon} ${category.name}`"
                :value="category.id"
              />
            </el-select>

            <el-button type="warning" @click="handleBatchEditClick">
              完成 <el-tag size="small" type="info" class="shortcut-tag">Esc</el-tag>
            </el-button>
          </div>

          <div class="batch-edit-info">
            <el-tag type="primary">已选择 {{ dataStore.selectedLinks.length }} 个网站</el-tag>
          </div>
        </div>
      </div>

      <!-- Sort Mode Toolbar -->
      <div v-if="dataStore.sortMode" class="sort-toolbar">
        <div class="sort-container">
          <div class="sort-info">
            <el-tag type="success">排序模式：拖拽调整网站顺序</el-tag>
          </div>
          <el-button type="primary" @click="handleSortClick">
            完成排序 <el-tag size="small" type="info" class="shortcut-tag">Esc</el-tag>
          </el-button>
        </div>
      </div>

      <!-- Sites Grid -->
      <div class="sites-section">
        <!-- Category Header -->
        <div v-if="selectedCategoryId !== 'all'" class="category-header">
          <span class="category-icon">{{ currentCategory?.icon || '🌐' }}</span>
          <h2 class="category-title">{{ currentCategory?.name || '未知分类' }}</h2>
          <span class="site-count">{{ sortableLinks.length }} 个网站</span>
        </div>

        <!-- 普通模式：不使用拖拽 -->
        <TransitionGroup v-if="!dataStore.sortMode" name="card-list" class="sites-grid" tag="div">
          <SiteCard
            v-for="site in sortableLinks"
            :key="site.id"
            :site="site"
          />
        </TransitionGroup>

        <!-- 排序模式：使用 vue-draggable-plus -->
        <VueDraggable
          v-else
          v-model="sortableLinks"
          class="sites-grid"
          :animation="200"
          :delay="0"
          :delay-on-touch-only="true"
          ghost-class="sortable-ghost"
          drag-class="sortable-drag"
          @end="onSortEnd"
        >
          <SiteCard
            v-for="site in sortableLinks"
            :key="site.id"
            :site="site"
          />
        </VueDraggable>

        <el-empty v-if="sortableLinks.length === 0" description="暂无网站数据" />
      </div>
    </div>

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
  margin-left: 260px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--color-bg);
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.main-content.sidebar-collapsed {
  margin-left: 72px;
}

.main-content.sidebar-closed {
  margin-left: 0;
}

.search-section {
  display: flex;
  justify-content: center;
  padding: 2rem 1rem;
}

.search-container {
  width: 100%;
  max-width: 800px;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.search-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0;
  background: linear-gradient(145deg, var(--color-card), var(--color-bg));
  border: 2px solid var(--color-border);
  border-radius: 18px;
  padding: 0.5rem;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  position: relative;
  overflow: hidden;
}

.search-wrapper::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.05) 0%, transparent 50%);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.search-wrapper:hover,
.search-wrapper:focus-within {
  border-color: var(--color-primary);
  box-shadow:
    0 8px 24px rgba(14, 165, 233, 0.2),
    0 4px 12px rgba(14, 165, 233, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  transform: translateY(-3px);
}

.search-wrapper:hover::before,
.search-wrapper:focus-within::before {
  opacity: 1;
}

.search-engine-dropdown {
  flex-shrink: 0;
}

.search-engine-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  cursor: pointer;
  border-radius: 14px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--color-text);
  font-size: 0.9375rem;
  font-weight: 600;
  position: relative;
  background: linear-gradient(145deg, var(--color-bg), transparent);
  border: 1px solid transparent;
}

.search-engine-selector::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 14px;
}

.search-engine-selector:hover::before {
  opacity: 1;
}

.search-engine-selector:hover {
  background: var(--color-bg);
  border-color: var(--color-border);
  transform: scale(1.03);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.1);
}

.search-engine-selector:active {
  transform: scale(0.98);
}

.engine-name {
  white-space: nowrap;
}

.search-input {
  flex: 1;
}

.search-input :deep(.el-input__wrapper) {
  box-shadow: none !important;
  padding: 0;
}

.search-input :deep(.el-input__inner) {
  font-size: 1rem;
  padding: 0.75rem 1rem;
}

.search-button {
  border-radius: 14px !important;
  padding: 0.75rem 1.5rem !important;
  height: auto !important;
  margin: 0.25rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  background: linear-gradient(135deg, var(--color-primary), #0d9488) !important;
  border: none !important;
  position: relative;
  overflow: hidden;
}

.search-button::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.search-button:hover {
  transform: scale(1.08) translateY(-2px);
  box-shadow:
    0 8px 20px rgba(14, 165, 233, 0.3),
    0 4px 8px rgba(14, 165, 233, 0.2) !important;
}

.search-button:hover::before {
  opacity: 1;
}

.search-button:active {
  transform: scale(0.98) translateY(0);
}

.search-button .el-icon {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.search-button:hover .el-icon {
  transform: scale(1.2) rotate(-10deg);
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
  background: radial-gradient(circle at center, rgba(139, 92, 246, 0.15) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.theme-toggle-btn:hover {
  transform: scale(1.12) rotate(180deg);
  border-color: #8b5cf6 !important;
  box-shadow:
    0 8px 24px rgba(139, 92, 246, 0.25),
    0 4px 12px rgba(139, 92, 246, 0.15) !important;
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
  color: var(--color-secondary);
  padding: 0.25rem 0.75rem;
  background: var(--color-bg);
  border-radius: 20px;
  font-weight: 500;
}

.sites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.25rem;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100px;
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
  background: var(--color-card);
  border-bottom: 1px solid var(--color-border);
}

.batch-edit-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.batch-edit-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.batch-edit-secondary {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
}

.move-select {
  min-width: 150px;
}

.shortcut-tag {
  margin-left: 0.25rem;
  font-size: 0.6875rem;
}

.batch-edit-info {
  font-size: 0.875rem;
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
  gap: 1rem;
}

.sort-info {
  font-size: 0.875rem;
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

  .batch-edit-toolbar {
    padding: 0.75rem 1rem;
  }

  .batch-edit-actions {
    width: 100%;
  }

  .batch-edit-actions :deep(.el-button) {
    flex: 1;
    min-width: 0;
    padding: 0.5rem 0.75rem;
  }

  .batch-edit-secondary {
    width: 100%;
    flex-direction: column;
  }

  .batch-edit-secondary :deep(.el-button) {
    width: 100%;
  }

  .move-select {
    width: 100%;
  }

  .sort-toolbar {
    padding: 0.75rem 1rem;
  }

  .sort-container {
    flex-direction: column;
    gap: 0.5rem;
    align-items: stretch;
  }

  .sort-container :deep(.el-button) {
    width: 100%;
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

/* Card List Transitions */
.card-list-enter-active,
.card-list-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-list-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
}

.card-list-leave-active {
  position: absolute;
}

.card-list-leave-to {
  opacity: 0;
  transform: translateX(-30px) scale(0.95);
}

.card-list-move {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* vue-draggable-plus 样式 */
:deep(.sortable-ghost) {
  opacity: 0.4;
  background: rgba(16, 185, 129, 0.1);
  border: 2px dashed #10b981;
  border-radius: 12px;
}

:deep(.sortable-drag) {
  opacity: 0.9;
  transform: scale(1.05) rotate(2deg);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  background: var(--color-card);
  border: 2px solid #10b981;
  border-radius: 12px;
}
</style>
