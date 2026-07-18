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
  import { Search, Star, History, Inbox } from 'lucide-vue-next';
  import { byOrder } from '@/utils/sort';
  import { matchesLinkQuery, filterLinksByQuery } from '@/utils/search';
  const SiteCard = defineAsyncComponent(() => import('../components/ui/SiteCard.vue'));

  const dataStore = useDataStore();
  const uiStore = useUiStore();
  const userPrefs = useUserPrefsStore();
  const { isMobile, windowWidth, windowHeight } = useResponsive();

  const gridKey = ref(0);
  const sitesSectionRef = ref<HTMLElement | null>(null);

  // 固定估算值，避免 DOM 测量反馈环
  // 高度值须与真实 CSS 对齐，否则分页会算多行导致卡片被底部裁切
  const HEADER_H = 84; // 主头部 padding + 搜索条高度
  const CATEGORY_H = 76; // 分类标题 padding + 底边距 + 标题行高
  const PAGINATION_H = 72; // 分页器 padding + 内容高度
  const GRID_GAP = 24;
  const SECTION_BOTTOM_PADDING = 32; // .sites-section padding-bottom: 2rem
  const GRID_PADDING_V = 48; // .sites-grid padding-top + padding-bottom: 24px*2
  const SUB_CATEGORY_H = 64; // 二级标签栏近似高度（折叠/移动端显示时）
  // 卡片最小宽度（用于列数估算）与含 gap 的卡片最小高度（随密度变化）
  const CARD_MIN_W = 240;
  const SECTION_PADDING = 48; // .sites-section 左右各 1.5rem
  const SIDEBAR_W = 240;
  const SIDEBAR_COLLAPSED_W = 72;

  // 密度：紧凑模式下卡片更矮、每页可容纳更多
  const cardHeight = computed(() => (uiStore.density === 'compact' ? 76 : 100));

  const categories = computed(() => dataStore.visibleCategories);

  const subCategories = computed(() => {
    return dataStore.getSubCategories(uiStore.selectedCategoryId);
  });

  const hasSubCategories = computed(() => {
    return subCategories.value.length > 0;
  });

  // 每个二级分类下的链接数量，用于标签栏计数徽标。
  // 单趟遍历 visibleLinks：仅统计当前分类、匹配搜索词的链接，按二级分类计数（O(n)），
  // 替代原先对每个二级分类调用 getLinksByCategory（含过滤 + 新建数组）的 O(n×m) 做法。
  const subCounts = computed<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    const catId = uiStore.selectedCategoryId;
    const query = uiStore.searchMode === 'internal' ? uiStore.searchQuery : '';
    for (const link of dataStore.visibleLinks) {
      if (link.categoryId !== catId) continue;
      if (!matchesLinkQuery(link, query)) continue;
      const subId = link.subCategoryId;
      if (!subId) continue;
      map[subId] = (map[subId] || 0) + 1;
    }
    return map;
  });

  const links = computed<Link[]>(() => {
    const catId = uiStore.selectedCategoryId;
    const query = uiStore.searchMode === 'internal' ? uiStore.searchQuery : '';

    if (catId === '__favorites') {
      const favSet = new Set(userPrefs.state.favorites);
      const result = dataStore.links.filter((l) => !l.hidden && favSet.has(l.url));
      // 与普通分类视图保持一致：按 order 排序，避免收藏顺序与分类视图割裂
      result.sort(byOrder);
      return filterLinksByQuery(result, query);
    }
    if (catId === '__recent') {
      const tsMap = new Map(userPrefs.state.recentVisits.map((v) => [v.url, v.ts]));
      const result = dataStore.links.filter((l) => !l.hidden && tsMap.has(l.url));
      // 主排序为访问时间（最近优先），同时间戳回退到 order，保证与分类视图顺序一致
      result.sort((a, b) => (tsMap.get(b.url) || 0) - (tsMap.get(a.url) || 0) || byOrder(a, b));
      return filterLinksByQuery(result, query);
    }

    return dataStore.getLinksByCategory(
      catId,
      uiStore.selectedSubCategoryId,
      uiStore.searchQuery,
      uiStore.searchMode
    );
  });

  // 列数：根据「可用内容宽度」估算，使分页列数与实际渲染列数一致，
  // 避免折叠侧边栏时网格列数与分页假设不符导致卡片被裁切。
  const columns = computed(() => {
    const w = windowWidth.value;
    if (w <= 768) return 2; // 移动端
    if (w <= 1024) return 2; // 平板固定 2 列
    // 桌面：扣除侧边栏与内边距后按卡片最小宽度估算
    const sidebar = isMobile.value ? 0 : uiStore.sidebarCollapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W;
    const available = w - sidebar - SECTION_PADDING;
    const cols = Math.floor((available + GRID_GAP) / (CARD_MIN_W + GRID_GAP));
    return Math.max(1, Math.min(cols, 6));
  });

  // 动态每页数量：基于响应式窗口高度和固定常量推算，不测量 DOM
  const fitPageSize = computed(() => {
    let availableH = windowHeight.value - HEADER_H - CATEGORY_H - PAGINATION_H;
    // 扣除 section 底边距与 grid 上下内边距，避免算出的行数放不下而被裁切
    availableH -= SECTION_BOTTOM_PADDING + GRID_PADDING_V;
    // 折叠/移动端在主内容区额外渲染二级分类标签，再扣除其近似高度
    if (hasSubCategories.value && (uiStore.sidebarCollapsed || isMobile.value)) {
      availableH -= SUB_CATEGORY_H;
    }
    const rows = Math.max(1, Math.floor((availableH + GRID_GAP) / (cardHeight.value + GRID_GAP)));
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

  // 空状态文案：针对搜索无结果、收藏、最近访问给出更贴心的引导
  const emptyState = computed(() => {
    const query = uiStore.searchQuery.trim();
    if (query && uiStore.searchMode === 'internal') {
      return {
        icon: Search,
        title: '没有匹配的网站',
        description: `未找到与「${query}」相关的网站，换个关键词试试？`,
      };
    }
    const id = uiStore.selectedCategoryId;
    if (id === '__favorites') {
      return {
        icon: Star,
        title: '还没有收藏',
        description: '点击网站卡片右上角的星标，把常用网站收藏到这里。',
      };
    }
    if (id === '__recent') {
      return {
        icon: History,
        title: '还没有访问记录',
        description: '访问过的网站会自动出现在这里，方便快速回访。',
      };
    }
    return { icon: Inbox, title: '暂无网站', description: '该分类下暂无网站' };
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
        'density-compact': uiStore.density === 'compact',
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
        <div v-if="links.length > 0" class="sites-grid" :style="{ '--grid-cols': columns }">
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
          :icon="emptyState.icon"
          :title="emptyState.title"
          :description="emptyState.description"
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
    <button
      v-if="isMobile && uiStore.sidebarOpen"
      type="button"
      class="sidebar-overlay"
      aria-label="关闭侧边栏"
      @click="uiStore.closeSidebar"
    ></button>
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
    background: var(--glass-bg);
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
    background: transparent;
    border: none;
  }

  .category-title {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--color-text);
    margin: 0;
    line-height: 1.2;
    letter-spacing: -0.02em;
    position: relative;
    padding-left: 0.875rem;
  }

  /* 标题左侧渐变 accent 条，呼应玻璃主题 */
  .category-title::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 1.1em;
    border-radius: 2px;
    background: var(--gradient-primary);
  }

  .site-count {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    margin-left: auto;
    font-weight: 500;
    white-space: nowrap;
  }

  .sites-grid {
    display: grid;
    /* 列数由 JS 按可用宽度估算并通过 --grid-cols 注入，
       保证分页假设的列数与实际渲染列数始终一致，避免卡片被裁切 */
    grid-template-columns: repeat(var(--grid-cols, 4), 1fr);
    gap: var(--space-lg);
    flex: 1;
    min-height: 0;
    overflow: hidden;
    max-width: 1400px;
    width: 100%;
    margin: 0 auto;
    padding: var(--space-lg) 0;
    align-content: start;
    /* 隔离网格重绘范围，避免单卡 hover 触发整页合成 */
    contain: layout style paint;
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

  /* 紧凑密度：缩小卡片内边距与高度，一屏容纳更多 */
  .main-content.density-compact :deep(.site-card) {
    padding: 0.75rem 1rem;
    min-height: 60px;
  }

  .main-content.density-compact :deep(.site-icon-wrapper) {
    width: 40px;
    height: 40px;
  }

  .sidebar-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.4);
    z-index: 90;
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
    border: none;
    padding: 0;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
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
    border-top: 1px solid var(--glass-border);
    background: transparent;
    flex-shrink: 0;
  }
</style>
