<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useDataStore } from '../stores/data'
import Sidebar from '../components/layout/Sidebar.vue'
import MainHeader from '../components/layout/MainHeader.vue'
import SiteCard from '../components/ui/SiteCard.vue'
import { VueDraggable } from 'vue-draggable-plus'

const dataStore = useDataStore()

const searchQuery = ref('')
const selectedCategoryId = ref('all')
const sidebarOpen = ref(true)
const sidebarCollapsed = ref(false)
const isMobile = ref(false)
const searchInputRef = ref(null)
const selectedMoveCategory = ref('')
const batchLoading = ref(false)

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

const handleCollapse = (collapsed) => {
  sidebarCollapsed.value = collapsed
}

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value) {
    sidebarOpen.value = false
  }
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
  checkMobile()
  window.addEventListener('resize', checkMobile)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
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
      @collapse="handleCollapse"
    />

    <!-- Main Content -->
    <div class="main-content" :class="{ 'sidebar-closed': !sidebarOpen, 'sidebar-collapsed': sidebarCollapsed }">
      <!-- Header -->
      <MainHeader 
        :title="pageTitle"
        @batch-edit-click="handleBatchEditClick"
        @sort-click="handleSortClick"
      />

      <!-- Search Section -->
      <div class="search-section" v-if="!dataStore.batchEditMode && !dataStore.sortMode">
        <div class="search-container">
          <!-- Search Box using Element Plus -->
          <el-input
            ref="searchInputRef"
            v-model="searchQuery"
            :placeholder="`在 ${selectedEngine?.name || '必应'} 搜索...`"
            size="large"
            clearable
            class="search-input-wrapper"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg></el-icon>
            </template>
            <template #suffix>
              <div class="search-shortcut">
                <el-tag size="small" type="info">⌘</el-tag>
                <el-tag size="small" type="info">K</el-tag>
              </div>
            </template>
          </el-input>
          
          <!-- Engine Selector using Element Plus -->
          <el-radio-group 
            v-model="dataStore.searchConfig.selectedSourceId" 
            class="engine-selector"
            @change="selectEngine"
          >
            <el-radio-button 
              v-for="engine in searchEngines.slice(0, 4)" 
              :key="engine.id" 
              :value="engine.id"
            >
              {{ engine.name }}
            </el-radio-button>
          </el-radio-group>
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
        <!-- 普通模式：不使用拖拽 -->
        <div v-if="!dataStore.sortMode" class="sites-grid">
          <SiteCard
            v-for="site in sortableLinks"
            :key="site.id"
            :site="site"
          />
        </div>

        <!-- 排序模式：使用vue-draggable-plus -->
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

.search-input-wrapper {
  --el-input-border-radius: 12px;
}

.search-input-wrapper :deep(.el-input__wrapper) {
  padding: 0.5rem 1rem;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}

.search-input-wrapper :deep(.el-input__wrapper:focus-within) {
  box-shadow: var(--shadow-md), 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.search-shortcut {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.search-shortcut .el-tag {
  font-size: 0.6875rem;
  padding: 0 4px;
  height: 20px;
  line-height: 18px;
}

.engine-selector {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}

.engine-selector :deep(.el-radio-button__inner) {
  border-radius: 20px !important;
  border: 1px solid var(--color-border);
  background: var(--color-card);
  color: var(--color-secondary);
  padding: 0.375rem 0.875rem;
  font-size: 0.8125rem;
}

.engine-selector :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
  box-shadow: none;
}

.engine-selector :deep(.el-radio-button:first-child .el-radio-button__inner) {
  border-radius: 20px !important;
}

.engine-selector :deep(.el-radio-button:last-child .el-radio-button__inner) {
  border-radius: 20px !important;
}

.engine-selector :deep(.el-radio-button__inner:hover) {
  border-color: var(--color-primary);
  color: var(--color-primary);
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

  .batch-edit-toolbar {
    padding: 0.75rem 1rem;
  }

  .batch-edit-actions {
    width: 100%;
  }

  .batch-edit-secondary {
    width: 100%;
    flex-direction: column;
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
