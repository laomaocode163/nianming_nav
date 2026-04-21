<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useDataStore } from '../stores/data'
import { useResponsive } from '../hooks/useResponsive.ts'
import Sidebar from '../components/layout/Sidebar.vue'
import MainHeader from '../components/layout/MainHeader.vue'
import ScrollToTop from '../components/ui/ScrollToTop.vue'
import EmptyState from '../components/ui/EmptyState.vue'
import { defineAsyncComponent } from 'vue'
const SiteCard = defineAsyncComponent(() => import('../components/ui/SiteCard.vue'))

const dataStore = useDataStore()
const { isMobile } = useResponsive()

const selectedCategoryId = ref('all')
const sidebarOpen = ref(true)
const sidebarCollapsed = ref(false)
const gridKey = ref(0) // 用于触发动画



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

const links = computed(() => {
  return dataStore.getLinksByCategory(selectedCategoryId.value)
})



const currentCategory = computed(() => {
  return categories.value.find(c => c.id === selectedCategoryId.value)
})



const selectCategory = (categoryId) => {
  selectedCategoryId.value = categoryId
  // 触发动画
  gridKey.value++
}

const handleKeydown = (event) => {
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
        @toggle-sidebar="toggleSidebar"
      />



      <!-- Sites Grid -->
      <div class="sites-section">
        <!-- Category Header -->
        <div class="category-header">
          <span class="category-icon">{{ selectedCategoryId === 'all' ? '✓' : currentCategory?.icon || '🌐' }}</span>
          <h2 class="category-title">{{ selectedCategoryId === 'all' ? '全部网站' : currentCategory?.name || '未知分类' }}</h2>
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
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
