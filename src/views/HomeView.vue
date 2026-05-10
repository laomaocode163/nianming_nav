<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useDataStore } from '../stores/data'
import { useResponsive } from '../hooks/useResponsive'
import Sidebar from '../components/layout/Sidebar.vue'
import MainHeader from '../components/layout/MainHeader.vue'
import ScrollToTop from '../components/ui/ScrollToTop.vue'
import EmptyState from '../components/ui/EmptyState.vue'
import SubCategoryTabs from '../components/ui/SubCategoryTabs.vue'
import { defineAsyncComponent } from 'vue'
const SiteCard = defineAsyncComponent(() => import('../components/ui/SiteCard.vue'))

const dataStore = useDataStore()
const { isMobile } = useResponsive()

const selectedCategoryId = ref('all')
const selectedSubCategoryId = ref<string | null>(null)
const sidebarOpen = ref(true)
const sidebarCollapsed = ref(false)
const gridKey = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

const toggleSidebarCollapse = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const closeSidebar = () => {
  sidebarOpen.value = false
}

const categories = computed(() => dataStore.visibleCategories)

const subCategories = computed(() => {
  return dataStore.getSubCategories(selectedCategoryId.value)
})

const hasSubCategories = computed(() => {
  return subCategories.value.length > 0
})

const links = computed(() => {
  return dataStore.getLinksByCategory(selectedCategoryId.value, selectedSubCategoryId.value)
})

/** 当前页展示的链接，基于 links 做切片，避免单页渲染过多卡片 */
const paginatedLinks = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return links.value.slice(start, start + pageSize.value)
})

const currentCategory = computed(() => {
  return categories.value.find(c => c.id === selectedCategoryId.value)
})

const selectCategory = (categoryId: string) => {
  selectedCategoryId.value = categoryId
}

const selectSubCategory = (subCategoryId: string | null) => {
  selectedSubCategoryId.value = subCategoryId
  currentPage.value = 1
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isMobile.value && sidebarOpen.value) {
    closeSidebar()
  }
}

watch(selectedCategoryId, () => {
  selectedSubCategoryId.value = null
  currentPage.value = 1
  gridKey.value++
})

/** 翻页后将网站列表滚动到顶部 */
const handlePageChange = () => {
  const sitesSection = document.querySelector('.sites-section')
  if (sitesSection) {
    sitesSection.scrollTop = 0
  }
}

onMounted(() => {
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
        @toggle-sidebar="toggleSidebar"
      />

      <!-- Category Header -->
      <div class="category-header">
        <span class="category-icon">{{ selectedCategoryId === 'all' ? '✓' : currentCategory?.icon || '🌐' }}</span>
        <h2 class="category-title">{{ selectedCategoryId === 'all' ? '全部网站' : currentCategory?.name || '未知分类' }}</h2>
        <span class="site-count">{{ links.length }} 个网站</span>
      </div>

      <!-- Sites Grid -->
      <div class="sites-section">
        <!-- 二级分类标签 -->
        <SubCategoryTabs
          v-if="hasSubCategories"
          :sub-categories="subCategories"
          :selected-id="selectedSubCategoryId"
          :total-count="links.length"
          @select="selectSubCategory"
        />

        <!-- 网站列表 -->
        <div v-if="links.length > 0" class="sites-grid">
          <SiteCard
            v-for="(site, index) in paginatedLinks"
            :key="`${gridKey}-${site.id}`"
            :site="site"
            :style="{ animationDelay: `${index * 0.05}s` }"
          />
        </div>

        <EmptyState
          v-if="links.length === 0"
          icon="📭"
          title="暂无网站"
          description="该分类下暂无网站"
        />
      </div>

      <!-- 分页 -->
      <div v-if="links.length > pageSize" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="links.length"
          layout="prev, pager, next"
          :pager-count="isMobile ? 5 : 7"
          background
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- Scroll to Top Button -->
    <ScrollToTop />

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
  margin-left: var(--sidebar-width, 240px);
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow-y: auto;
  background: var(--color-bg);
  transition: margin-left var(--transition-normal);
}

.main-content.sidebar-collapsed {
  margin-left: 64px;
}

.main-content.sidebar-closed {
  margin-left: 0;
}

.sites-section {
  flex: 1;
  padding: 0 1.5rem 2rem;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem 1.5rem 1.25rem;
  margin-bottom: 1rem;
  border-bottom: 2px solid var(--color-border);
  position: sticky;
  top: 60px;
  z-index: 10;
  background: var(--color-bg);
}

.category-icon {
  font-size: 1.75rem;
  line-height: 1;
  color: var(--color-primary);
  margin-right: 0.5rem;
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
  background: #f3f4f6;
  border-radius: 20px;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.dark .site-count {
  background: #374151;
}

.sites-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-lg);
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--space-lg) 0;
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

/* 平板适配 - 2列过渡 */
@media (max-width: 1024px) and (min-width: 769px) {
  .sites-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
  }

  .sites-section {
    padding: 0 1rem 2rem;
  }

  .category-header {
    flex-wrap: wrap;
    padding: 1rem 1rem 0.75rem;
    top: 50px;
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
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .pagination-wrapper {
    padding: 1.5rem 0 0.5rem;
  }

  .pagination-wrapper :deep(.el-pagination) {
    font-size: 13px;
  }
}

/* 小屏幕手机适配 */
@media (max-width: 480px) {
  .sites-grid {
    gap: 0.75rem;
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 1rem 0;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg);
  flex-shrink: 0;
}

.pagination-wrapper :deep(.el-pagination) {
  --el-pagination-bg-color: var(--color-card);
  --el-pagination-hover-color: var(--color-primary);
}
</style>
