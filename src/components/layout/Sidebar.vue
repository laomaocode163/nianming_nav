<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import { useDataStore } from '../../stores/data';
  import { useUiStore } from '../../stores/ui';
  import { useResponsive } from '../../hooks/useResponsive';

  const props = withDefaults(
    defineProps<{
      selectedCategory?: string;
      isOpen?: boolean;
      collapsed?: boolean;
    }>(),
    {
      selectedCategory: '',
      isOpen: true,
      collapsed: false,
    }
  );

  const emit = defineEmits<{
    (e: 'select', categoryId: string): void;
    (e: 'toggle-collapse'): void;
    (e: 'close'): void;
  }>();

  const dataStore = useDataStore();
  const uiStore = useUiStore();
  const { isMobile } = useResponsive();

  const categories = computed(() => dataStore.visibleCategories);

  // 已展开（显示二级分类）的一级分类集合；默认展开当前选中的有子分类项
  const expandedCats = ref<Set<string>>(new Set());

  // 计算某一级分类的展开集合：含二级分类时展开自身，否则全部收起
  const expandSetFor = (catId: string): Set<string> => {
    const cat = dataStore.categories.find((c) => c.id === catId);
    return cat?.subCategories?.length ? new Set([catId]) : new Set();
  };

  // 手风琴式展开：同一时刻仅展开当前选中的、含二级分类的一级分类，其余收起
  watch(
    () => uiStore.selectedCategoryId,
    (catId) => {
      expandedCats.value = expandSetFor(catId);
    },
    { immediate: true }
  );

  // 收起侧边栏时一并收起所有二级分类；重新展开时恢复当前分类的二级树
  watch(
    () => props.collapsed,
    (isCollapsed) => {
      expandedCats.value = isCollapsed ? new Set() : expandSetFor(uiStore.selectedCategoryId);
    }
  );

  const isExpanded = (categoryId: string) => expandedCats.value.has(categoryId);

  // 父级导航激活判定：
  // - 展开态：仅当选中该分类且处于“全部”（未选子分类）时高亮；
  // - 收起态：子树不可见，选中其任意子分类时仍高亮父级瓷砖。
  const isNavActive = (categoryId: string): boolean => {
    if (props.selectedCategory !== categoryId) return false;
    return props.collapsed || !uiStore.selectedSubCategoryId;
  };

  const toggleExpand = (categoryId: string) => {
    const next = new Set(expandedCats.value);
    if (next.has(categoryId)) {
      // 再次点击当前已展开项 → 收起
      next.delete(categoryId);
    } else {
      // 展开新项时收起其他项，保持手风琴行为
      next.clear();
      next.add(categoryId);
    }
    expandedCats.value = next;
  };

  const handleSelect = (categoryId: string) => {
    emit('select', categoryId);
    if (isMobile.value) {
      emit('close');
    }
  };

  // 直接选择二级分类（保留父级选中，不关闭嵌套）
  const handleSelectSub = (subId: string) => {
    uiStore.selectSubCategory(subId);
    if (isMobile.value) {
      emit('close');
    }
  };

  const handleClose = () => {
    emit('close');
  };

  const handleLogoClick = () => {
    emit('select', 'all');
    if (isMobile.value) {
      emit('close');
    }
  };
</script>

<template>
  <aside
    class="sidebar"
    :class="{ 'sidebar-open': isOpen, 'sidebar-collapsed': collapsed, 'is-mobile': isMobile }"
  >
    <!-- Logo Section -->
    <div class="sidebar-logo-section">
      <div
        class="logo-content"
        :class="{ 'logo-collapsed': collapsed }"
        role="button"
        tabindex="0"
        title="返回全部网站"
        aria-label="返回全部网站"
        @click="handleLogoClick"
        @keydown.enter="handleLogoClick"
      >
        <img src="/signature.png" alt="签名" class="logo-signature" />
        <h1 class="site-title">念铭导航</h1>
      </div>
      <div class="logo-actions">
        <!-- 移动端关闭按钮 -->
        <button
          v-if="isMobile"
          class="mobile-close-btn"
          title="关闭菜单"
          aria-label="关闭菜单"
          @click="handleClose"
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <button
          v-else
          type="button"
          class="collapse-btn"
          :class="{ collapsed }"
          :title="collapsed ? '展开侧边栏' : '收起侧边栏'"
          aria-label="收起/展开侧边栏"
          @click="emit('toggle-collapse')"
        >
          <svg
            class="collapse-icon"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <path d="M15 6l-6 6 6 6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Navigation Section -->
    <div class="sidebar-nav-section">
      <nav class="sidebar-nav">
        <!-- 用户个性化虚拟分类：收藏与最近访问 -->
        <button
          type="button"
          class="nav-item"
          :class="{ active: isNavActive('__favorites') }"
          :aria-current="isNavActive('__favorites') ? 'page' : undefined"
          @click="handleSelect('__favorites')"
        >
          <span class="nav-icon"><CategoryIcon name="star" /></span>
          <span class="nav-name">我的常用</span>
        </button>
        <button
          type="button"
          class="nav-item"
          :class="{ active: isNavActive('__recent') }"
          :aria-current="isNavActive('__recent') ? 'page' : undefined"
          @click="handleSelect('__recent')"
        >
          <span class="nav-icon"><CategoryIcon name="clock" /></span>
          <span class="nav-name">最近访问</span>
        </button>

        <template v-for="(category, index) in categories" :key="category.id">
          <button
            type="button"
            class="nav-item"
            :style="{ '--item-index': index }"
            :class="{
              active: isNavActive(category.id),
            }"
            :aria-current="isNavActive(category.id) ? 'page' : undefined"
            @click="handleSelect(category.id)"
          >
            <span class="nav-icon"><CategoryIcon :name="category.icon" /></span>
            <span class="nav-name">{{ category.name }}</span>
            <span
              v-if="!collapsed && category.subCategories?.length"
              class="nav-expand"
              :class="{ expanded: isExpanded(category.id) }"
              role="button"
              tabindex="-1"
              :aria-label="isExpanded(category.id) ? '收起子分类' : '展开子分类'"
              @click.stop="toggleExpand(category.id)"
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
          </button>

          <!-- 二级分类树 -->
          <div
            v-if="!collapsed && category.subCategories?.length && isExpanded(category.id)"
            class="sidebar-sub"
          >
            <button
              v-for="sub in dataStore.getSubCategories(category.id)"
              :key="sub.id"
              type="button"
              class="sub-item"
              :class="{ active: uiStore.selectedSubCategoryId === sub.id }"
              @click="handleSelectSub(sub.id)"
            >
              <span v-if="sub.icon" class="sub-icon"><CategoryIcon :name="sub.icon" /></span>
              <span v-else class="sub-icon sub-icon--placeholder"></span>
              <span class="sub-name">{{ sub.name }}</span>
            </button>
          </div>
        </template>
      </nav>
    </div>
  </aside>
</template>

<style scoped>
  .sidebar {
    width: var(--sidebar-width, 240px);
    height: 100vh;
    background: var(--glass-bg);
    -webkit-backdrop-filter: blur(var(--glass-blur));
    backdrop-filter: blur(var(--glass-blur));
    border-right: none;
    display: flex;
    flex-direction: column;
    position: fixed;
    left: 0;
    top: 0;
    z-index: 100;
    transition:
      width 300ms var(--ease-out-expo),
      transform 300ms var(--ease-out-expo);
    overflow: hidden;
    will-change: width, transform;
  }

  /* 柔化右侧分隔：用渐变淡入淡出替代生硬边框，使侧栏与主内容区融为一体 */
  .sidebar::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 1px;
    background: linear-gradient(
      to bottom,
      transparent,
      var(--color-border) 14%,
      var(--color-border) 86%,
      transparent
    );
    pointer-events: none;
  }

  .sidebar:not(.sidebar-open) {
    transform: translateX(-100%);
  }

  .sidebar.sidebar-collapsed {
    width: 72px;
  }

  /* 移动端侧边栏样式 */
  @media (max-width: 768px) {
    .sidebar {
      width: 240px;
      box-shadow: var(--shadow-lg);
      backdrop-filter: blur(15px);
    }

    .sidebar:not(.sidebar-open) {
      transform: translateX(-100%);
    }

    .sidebar-open {
      transform: translateX(0);
    }

    /* Enhanced mobile nav items */
    .nav-item {
      min-height: 50px;
      padding: 0.75rem 0.75rem !important;
      border-radius: 12px !important;
      margin: 0 !important;
    }

    .nav-icon {
      font-size: 1.375rem !important;
      width: 36px !important;
      height: 36px !important;
      flex-shrink: 0;
      background: transparent !important;
      color: var(--color-text-secondary) !important;
    }

    .nav-name {
      font-size: 1rem !important;
      flex: 1;
      font-weight: 500;
    }
  }

  /* Logo Section */
  .sidebar-logo-section {
    padding: 1rem 0.75rem 1rem 1rem;
    border-bottom: 1px solid var(--glass-border);
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
    flex-shrink: 0;
    position: relative;
    overflow: visible;
    min-height: 64px;
  }

  .logo-content {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.375rem 0.5rem 0.375rem 0.375rem;
    border-radius: 10px;
    animation: logoFadeIn 0.5s ease-out;
    overflow: hidden;
    justify-content: flex-start;
    flex-shrink: 1;
    min-width: 0;
    cursor: pointer;
    user-select: none;
    transition:
      background 200ms var(--ease-out-expo),
      transform 200ms var(--ease-out-expo);
  }

  .logo-content:hover {
    background: hsl(var(--hue-primary), 12%, 96%);
    transform: translateX(2px);
  }

  .dark .logo-content:hover {
    background: hsl(var(--hue-primary), 20%, 18%);
  }

  .logo-content:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
    border-radius: 10px;
  }

  .logo-signature {
    height: 34px;
    width: auto;
    flex-shrink: 0;
    object-fit: contain;
    vertical-align: middle;
    opacity: 0.95;
  }

  .site-title {
    font-size: 1.25rem;
    font-weight: 800;
    white-space: nowrap;
    margin: 0;
    background: var(--gradient-primary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    letter-spacing: -0.02em;
    line-height: 1;
    vertical-align: middle;
  }

  .logo-content.logo-collapsed {
    justify-content: center;
    width: 100%;
    padding: 0.375rem;
  }

  .sidebar-collapsed .site-title {
    opacity: 0;
    max-width: 0;
    width: 0;
    margin: 0;
    overflow: hidden;
  }

  .logo-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    flex-shrink: 0;
    margin-left: auto;
  }

  .sidebar-collapsed .sidebar-logo-section {
    justify-content: center;
    padding: 1rem 0.75rem;
  }

  .sidebar-collapsed .logo-content {
    display: none;
  }

  .sidebar-collapsed .logo-actions {
    position: relative;
    right: auto;
    width: 100%;
    justify-content: center;
  }

  .collapse-btn {
    width: 30px !important;
    height: 30px !important;
    padding: 0 !important;
    border-radius: 50% !important;
    background: transparent !important;
    border: 1px solid transparent !important;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1) !important;
    cursor: pointer;
    position: relative;
    margin: 0 auto;
    color: var(--color-text-secondary);
    font-family: inherit;
  }

  .collapse-btn:hover {
    background: var(--gradient-primary) !important;
    border-color: transparent !important;
    color: #fff !important;
    box-shadow: var(--shadow-glow) !important;
    transform: translateX(-1px);
  }

  .dark .collapse-btn:hover {
    background: var(--gradient-primary) !important;
  }

  .collapse-btn:active {
    transform: scale(0.92);
  }

  .collapse-btn:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
    border-color: var(--color-primary) !important;
  }

  .collapse-icon {
    transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
    display: inline-block;
  }

  /* 收起态：箭头旋转 180° 指向右侧（展开） */
  .collapse-btn.collapsed .collapse-icon {
    transform: rotate(180deg);
  }

  /* 移动端关闭按钮 */
  .mobile-close-btn {
    width: 34px;
    height: 34px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 50%;
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .mobile-close-btn:hover {
    background: #ef4444;
    border-color: #ef4444;
    color: white;
    transform: scale(1.05);
  }

  .mobile-close-btn:active {
    transform: scale(0.95);
  }

  .mobile-close-btn:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  @keyframes logoFadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Navigation Section */
  .sidebar-nav-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .sidebar-nav {
    flex: 1;
    padding: 0.25rem 0.5rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    /* Smooth scrolling */
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }

  /* Nav Item */
  .nav-item {
    display: flex !important;
    align-items: center;
    gap: var(--space-md);
    padding: 0.75rem 1rem !important;
    color: var(--color-text-secondary) !important;
    font-size: 1rem !important;
    border-radius: 10px !important;
    text-align: left;
    width: calc(100% - 1rem) !important;
    margin: 0.25rem auto !important;
    white-space: nowrap;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    transition:
      background 150ms var(--ease-out-expo),
      color 150ms var(--ease-out-expo),
      transform 150ms var(--ease-out-expo),
      width 300ms var(--ease-out-expo),
      border-radius 300ms var(--ease-out-expo),
      margin 300ms var(--ease-out-expo),
      padding 300ms var(--ease-out-expo);
    position: relative;
    overflow: hidden;
    justify-content: flex-start;
    min-height: 50px;
    cursor: pointer;
    font-weight: 500;
    font-family: inherit;
  }

  .sidebar-collapsed .nav-item {
    justify-content: center !important;
    width: 44px !important;
    height: 44px !important;
    min-height: 44px !important;
    padding: 0 !important;
    gap: 0 !important;
    margin: 0.375rem auto !important;
    border-radius: 14px !important;
    overflow: hidden !important;
    background: transparent !important;
    animation: navItemIn 320ms var(--ease-out-expo) backwards;
    animation-delay: calc(var(--item-index, 0) * 28ms);
  }

  @keyframes navItemIn {
    from {
      opacity: 0;
      transform: scale(0.85) translateY(4px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .sidebar-collapsed .nav-icon {
    margin: 0;
    width: 24px !important;
    height: 24px !important;
    font-size: 1.2rem !important;
  }

  .sidebar-collapsed .nav-item:hover {
    background: hsl(var(--hue-primary), 12%, 95%) !important;
    color: var(--color-primary) !important;
    transform: scale(1.04);
  }

  .dark .sidebar-collapsed .nav-item:hover {
    background: hsl(var(--hue-primary), 20%, 20%) !important;
  }

  .sidebar-collapsed .nav-item.active {
    background: transparent !important;
    color: var(--color-primary) !important;
    box-shadow: var(--shadow-glow) !important;
  }

  .sidebar-collapsed .nav-item.active .nav-icon {
    color: var(--color-primary) !important;
  }

  .sidebar-collapsed .nav-item:active {
    transform: scale(0.96);
  }

  .nav-item:hover {
    background: hsl(var(--hue-primary), 10%, 96%) !important;
    color: var(--color-primary) !important;
  }

  .dark .nav-item:hover {
    background: hsl(var(--hue-primary), 20%, 18%) !important;
  }

  .sidebar-collapsed .nav-item:hover {
    transform: scale(1.02);
  }

  .nav-item.active {
    color: var(--color-primary) !important;
    font-weight: 600;
  }

  .nav-item:active {
    transform: scale(0.98);
  }

  .nav-icon {
    font-size: 1.25rem;
    width: 32px;
    height: 32px;
    text-align: center;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
    line-height: 1;
    background: transparent;
    color: var(--color-text-secondary);
  }

  .sidebar-collapsed .nav-icon {
    margin: 0;
  }

  .nav-item:hover .nav-icon {
    color: var(--color-primary);
  }

  .nav-item.active .nav-icon {
    color: var(--color-primary);
  }

  .nav-name {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.4;
    display: flex;
    align-items: center;
    position: relative;
    z-index: 1;
    transform-origin: left center;
    transition:
      opacity 250ms var(--ease-out-expo),
      transform 250ms var(--ease-out-expo);
  }

  .sidebar-collapsed .nav-name {
    display: none;
  }

  @media (max-width: 480px) {
    .sidebar {
      width: 220px;
    }

    .sidebar-logo-section {
      padding: 1rem;
    }

    .site-title {
      font-size: 1.25rem;
    }

    .sidebar-nav {
      padding: 0.375rem 0.625rem;
    }

    .nav-item {
      padding: 0.625rem 0.75rem !important;
      font-size: 0.8125rem !important;
      border-radius: 10px !important;
      min-height: 46px;
    }

    .nav-icon {
      width: 32px;
      height: 32px;
      font-size: 1rem;
      background: transparent;
      color: var(--color-text-secondary);
    }

    .nav-name {
      font-size: 0.85rem;
    }
  }

  /* 触摸设备优化 */
  @media (hover: none) and (pointer: coarse) {
    .nav-item:hover {
      transform: none;
      background: transparent !important;
      box-shadow: none;
    }

    .nav-item:active {
      transform: scale(0.98);
      background: hsl(var(--hue-primary), 20%, 94%) !important;
      box-shadow:
        inset 0 0 0 1px rgba(14, 165, 233, 0.2),
        0 2px 8px rgba(14, 165, 233, 0.1);
    }

    .dark .nav-item:active {
      background: hsl(var(--hue-primary), 20%, 18%) !important;
    }

    .collapse-btn:active {
      transform: scale(0.95);
    }

    .mobile-close-btn:active {
      transform: scale(0.95);
    }

    /* Larger touch targets for mobile */
    .nav-item {
      min-height: 52px;
    }

    .nav-icon {
      width: 36px;
      height: 36px;
      background: transparent;
      color: var(--color-text-secondary);
    }
  }

  /* 改善滚动体验 */
  .sidebar-nav {
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
    scrollbar-color: var(--color-border) transparent;
  }

  .sidebar-nav::-webkit-scrollbar {
    width: 4px;
  }

  .sidebar-nav::-webkit-scrollbar-track {
    background: transparent;
  }

  .sidebar-nav::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 2px;
  }

  /* 二级分类展开箭头 */
  .nav-expand {
    margin-left: auto;
    width: 22px;
    height: 22px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    color: var(--color-text-secondary);
    flex-shrink: 0;
    transition:
      transform 200ms cubic-bezier(0.4, 0, 0.2, 1),
      background 150ms cubic-bezier(0.4, 0, 0.2, 1),
      color 150ms cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
  }

  .nav-expand:hover {
    background: hsl(var(--hue-primary), 15%, 92%);
    color: var(--color-primary);
  }

  .dark .nav-expand:hover {
    background: hsl(var(--hue-primary), 20%, 22%);
  }

  .nav-expand svg {
    transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .nav-expand.expanded svg {
    transform: rotate(90deg);
  }

  .nav-item.active .nav-expand {
    color: var(--color-primary);
  }

  /* 二级分类树 */
  .sidebar-sub {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    margin: 0 0.5rem 0.25rem 0.5rem;
    padding-left: 1.25rem;
    border-left: 1px solid var(--color-border);
    animation: subTreeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @keyframes subTreeIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .sub-item {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.5rem 0.5rem 0.5rem 0.75rem;
    min-height: 38px;
    width: 100%;
    border: none;
    background: transparent;
    border-radius: 8px;
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
    font-family: inherit;
    text-align: left;
    cursor: pointer;
    position: relative;
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .sub-item::before {
    content: '';
    position: absolute;
    left: -1.25rem;
    top: 50%;
    width: 0.875rem;
    height: 1px;
    background: var(--color-border);
  }

  .sub-item:hover {
    background: var(--glass-bg);
    color: var(--color-primary);
  }

  .sub-item.active {
    color: var(--color-primary);
    font-weight: 600;
  }

  .sub-item.active::before {
    background: var(--glass-border);
  }

  /* 命中态保留分类树边框线上的蓝色小圆点作为指示，外圈描边与玻璃侧边栏底色协调 */
  .sub-item.active::after {
    content: '';
    position: absolute;
    left: -1.25rem;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-bg);
    z-index: 1;
  }

  .dark .sub-item.active::after {
    box-shadow: 0 0 0 3px #1e293b;
  }

  .sub-icon {
    font-size: 0.95rem;
    width: 20px;
    height: 20px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    line-height: 1;
  }

  .sub-icon--placeholder {
    position: relative;
  }

  .sub-icon--placeholder::after {
    content: '';
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: currentColor;
    opacity: 0.4;
  }

  .sub-name {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (max-width: 480px) {
    .sub-item {
      min-height: 42px;
      font-size: 0.8125rem;
    }
  }

  @media (hover: none) and (pointer: coarse) {
    .sub-item:active {
      transform: scale(0.98);
      background: hsl(var(--hue-primary), 20%, 94%);
    }

    .dark .sub-item:active {
      background: hsl(var(--hue-primary), 20%, 18%);
    }
  }
</style>
