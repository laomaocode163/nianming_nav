<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
  import { useDataStore } from '../stores/data';
  import { useUiStore } from '../stores/ui';
  import { useUserPrefsStore } from '../stores/userPrefs';
  import { useResponsive } from '../hooks/useResponsive';
  import Sidebar from '../components/layout/Sidebar.vue';
  import MainHeader from '../components/layout/MainHeader.vue';
  import EmptyState from '../components/ui/EmptyState.vue';
  import SubCategoryTabs from '../components/ui/SubCategoryTabs.vue';
  import Pagination from '../components/ui/Pagination.vue';
  import { defineAsyncComponent } from 'vue';
  import type { Link } from '../types';
  const SiteCard = defineAsyncComponent(() => import('../components/ui/SiteCard.vue'));

  const dataStore = useDataStore();
  const uiStore = useUiStore();
  const userPrefs = useUserPrefsStore();
  const { isMobile, windowWidth, windowHeight } = useResponsive();

  const gridKey = ref(0);
  const sitesSectionRef = ref<HTMLElement | null>(null);

  // 固定估算值，避免 DOM 测量反馈环
  const HEADER_H = 69;
  const CATEGORY_H = 68;
  const PAGINATION_H = 60;
  const CARD_H = 100; // 含 gap 的卡片最小高度
  const GRID_GAP = 24;

  const categories = computed(() => dataStore.visibleCategories);

  const subCategories = computed(() => {
    return dataStore.getSubCategories(uiStore.selectedCategoryId);
  });

  const hasSubCategories = computed(() => {
    return subCategories.value.length > 0;
  });

  // 每个二级分类下的链接数量，用于标签栏计数徽标
  const subCounts = computed<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    const catId = uiStore.selectedCategoryId;
    for (const sub of subCategories.value) {
      map[sub.id] = dataStore.getLinksByCategory(
        catId,
        sub.id,
        uiStore.searchQuery,
        uiStore.searchMode
      ).length;
    }
    return map;
  });

  // 站内搜索过滤（虚拟分类复用，与 getLinksByCategory 内部逻辑保持一致）
  const applyInternalSearch = (list: Link[], term: string): Link[] => {
    const q = term.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        (l.description && l.description.toLowerCase().includes(q)) ||
        l.url.toLowerCase().includes(q)
    );
  };

  const links = computed<Link[]>(() => {
    const catId = uiStore.selectedCategoryId;
    const query = uiStore.searchMode === 'internal' ? uiStore.searchQuery : '';

    if (catId === '__favorites') {
      const favSet = new Set(userPrefs.state.favorites);
      return applyInternalSearch(
        dataStore.links.filter((l) => !l.hidden && favSet.has(l.url)),
        query
      );
    }
    if (catId === '__recent') {
      const tsMap = new Map(userPrefs.state.recentVisits.map((v) => [v.url, v.ts]));
      const result = dataStore.links.filter((l) => !l.hidden && tsMap.has(l.url));
      result.sort((a, b) => (tsMap.get(b.url) || 0) - (tsMap.get(a.url) || 0));
      return applyInternalSearch(result, query);
    }

    return dataStore.getLinksByCategory(
      catId,
      uiStore.selectedSubCategoryId,
      uiStore.searchQuery,
      uiStore.searchMode
    );
  });

  // 列数：根据窗口宽度推断（不依赖 DOM 查询，避免 ResizeObserver 反馈环）
  const columns = computed(() => (windowWidth.value <= 1024 ? 2 : 4));

  // 动态每页数量：基于响应式窗口高度和固定常量推算，不测量 DOM
  const fitPageSize = computed(() => {
    const availableH = windowHeight.value - HEADER_H - CATEGORY_H - PAGINATION_H;
    const rows = Math.max(1, Math.floor((availableH + GRID_GAP) / (CARD_H + GRID_GAP)));
    return Math.max(columns.value, rows * columns.value);
  });

  // 翻页或 size 变化后同步 store 并防止越界
  watch([fitPageSize, () => links.value.length], () => {
    uiStore.pageSize = fitPageSize.value;
    const maxPage = Math.max(1, Math.ceil(links.value.length / uiStore.pageSize));
    if (uiStore.currentPage > maxPage) {
      uiStore.currentPage = 1;
    }
  });

  /** 当前页展示的链接 */
  const paginatedLinks = computed(() => {
    const start = (uiStore.currentPage - 1) * uiStore.pageSize;
    return links.value.slice(start, start + uiStore.pageSize);
  });

  const currentCategory = computed(() => {
    return categories.value.find((c) => c.id === uiStore.selectedCategoryId);
  });

  const categoryTitle = computed(() => {
    const id = uiStore.selectedCategoryId;
    if (id === 'all') return '全部网站';
    if (id === '__favorites') return '我的常用';
    if (id === '__recent') return '最近访问';
    return currentCategory.value?.name || '未知分类';
  });

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isMobile.value && uiStore.sidebarOpen) {
      uiStore.closeSidebar();
    }
  };

  watch(
    () => uiStore.selectedCategoryId,
    () => {
      gridKey.value++;
    }
  );

  /** 翻页后将网站列表滚动到顶部 */
  const handlePageChange = () => {
    if (sitesSectionRef.value) {
      sitesSectionRef.value.scrollTop = 0;
    }
  };

  onMounted(() => {
    if (isMobile.value) {
      uiStore.sidebarOpen = false;
    }
    document.addEventListener('keydown', handleKeydown);
    nextTick(() => {
      uiStore.pageSize = fitPageSize.value;
    });
  });

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown);
  });
</script>

<template>
  <div class="home-layout">
    <!-- Sidebar -->
    <Sidebar
      :selected-category="uiStore.selectedCategoryId"
      :is-open="uiStore.sidebarOpen"
      :collapsed="uiStore.sidebarCollapsed"
      @select="uiStore.selectCategory"
      @toggle-collapse="uiStore.toggleSidebarCollapse"
      @close="uiStore.closeSidebar"
    />

    <!-- Main Content -->
    <div
      class="main-content"
      :class="{
        'sidebar-closed': !uiStore.sidebarOpen,
        'sidebar-collapsed': uiStore.sidebarCollapsed,
        'is-mobile': isMobile,
      }"
    >
      <!-- Header -->
      <MainHeader @toggle-sidebar="uiStore.toggleSidebar" />

      <!-- Category Header -->
      <div class="category-header">
        <h2 class="category-title">
          {{ categoryTitle }}
        </h2>
        <span class="site-count">{{ links.length }} 个网站</span>
      </div>

      <!-- Sites Grid -->
      <div ref="sitesSectionRef" class="sites-section">
        <!-- 二级分类标签：侧边栏展开（桌面）时已由侧边栏树提供导航，此处仅在折叠/移动端显示 -->
        <div
          v-if="hasSubCategories && (uiStore.sidebarCollapsed || isMobile)"
          class="sub-category-wrapper"
        >
          <SubCategoryTabs
            :sub-categories="subCategories"
            :selected-id="uiStore.selectedSubCategoryId"
            :total-count="links.length"
            :counts="subCounts"
            @select="uiStore.selectSubCategory"
          />
        </div>

        <!-- 网站列表 -->
        <div v-if="links.length > 0" class="sites-grid">
          <SiteCard
            v-for="(site, index) in paginatedLinks"
            :key="`${gridKey}-${site.id}`"
            :site="site"
            :highlight="uiStore.searchMode === 'internal' ? uiStore.searchQuery.trim() : ''"
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
      <div v-if="links.length > uiStore.pageSize" class="pagination-wrapper">
        <Pagination
          :current-page="uiStore.currentPage"
          :page-size="uiStore.pageSize"
          :total="links.length"
          :max-visible="5"
          @update:current-page="uiStore.currentPage = $event"
          @change="handlePageChange"
        />
      </div>
    </div>

    <!-- Mobile Overlay -->
    <div
      v-if="isMobile && uiStore.sidebarOpen"
      class="sidebar-overlay"
      @click="uiStore.closeSidebar"
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
    overflow: hidden;
    background: var(--color-bg);
    transition: margin-left 300ms var(--ease-out-expo);
  }

  .main-content.sidebar-collapsed {
    margin-left: 72px;
  }

  .main-content.sidebar-closed {
    margin-left: 0;
  }

  .sites-section {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0 1.5rem 2rem;
  }

  .sub-category-wrapper {
    flex-shrink: 0;
  }

  .category-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1.25rem 1.5rem 1rem;
    margin-bottom: 1rem;
    border-bottom: 2px solid var(--color-border);
  }

  .category-title {
    font-size: 1.125rem;
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
    flex: 1;
    min-height: 0;
    overflow: hidden;
    max-width: 1400px;
    width: 100%;
    margin: 0 auto;
    padding: var(--space-lg) 0;
    align-content: start;
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
      padding: 0.875rem 1rem 0.625rem;
    }

    .category-title {
      font-size: 1rem;
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
</style>
