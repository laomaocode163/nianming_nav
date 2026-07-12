<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import { useDataStore } from '../../stores/data';
  import { useUiStore } from '../../stores/ui';
  import { useResponsive } from '../../hooks/useResponsive';

  withDefaults(
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

  // 手风琴式展开：同一时刻仅展开当前选中的、含二级分类的一级分类，其余收起
  watch(
    () => uiStore.selectedCategoryId,
    (catId) => {
      const cat = dataStore.categories.find((c) => c.id === catId);
      expandedCats.value = cat?.subCategories?.length ? new Set([catId]) : new Set();
    },
    { immediate: true }
  );

  const isExpanded = (categoryId: string) => expandedCats.value.has(categoryId);

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
        <h1 v-show="!collapsed" class="site-title">念铭导航</h1>
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
          :title="collapsed ? '展开侧边栏' : '收起侧边栏'"
          @click="emit('toggle-collapse')"
        >
          <span class="collapse-icon">{{ collapsed ? '→' : '←' }}</span>
        </button>
      </div>
    </div>

    <!-- Navigation Section -->
    <div class="sidebar-nav-section">
      <nav class="sidebar-nav">
        <template v-for="category in categories" :key="category.id">
          <button
            type="button"
            class="nav-item"
            :class="{
              active: selectedCategory === category.id && !uiStore.selectedSubCategoryId,
            }"
            @click="handleSelect(category.id)"
          >
            <span class="nav-icon">{{ category.icon }}</span>
            <span v-show="!collapsed" class="nav-name">{{ category.name }}</span>
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
              <span v-if="sub.icon" class="sub-icon">{{ sub.icon }}</span>
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
    background: var(--color-card);
    border-right: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    position: fixed;
    left: 0;
    top: 0;
    z-index: 100;
    transition:
      width 200ms cubic-bezier(0.4, 0, 0.2, 1),
      transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    will-change: width, transform;
  }

  .sidebar:not(.sidebar-open) {
    transform: translateX(-100%);
  }

  .sidebar.sidebar-collapsed {
    width: 64px;
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
    padding: 1rem 0.875rem;
    border-bottom: 1px solid var(--color-border);
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-xs);
    flex-shrink: 0;
    position: relative;
    overflow: visible;
    min-height: 64px;
  }

  .logo-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    animation: logoFadeIn 0.5s ease-out;
    overflow: hidden;
    justify-content: flex-start;
    flex-shrink: 1;
    min-width: 0;
    cursor: pointer;
    user-select: none;
  }

  .logo-content:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
    border-radius: 6px;
  }

  .logo-signature {
    height: 32px;
    width: auto;
    flex-shrink: 0;
    object-fit: contain;
    vertical-align: middle;
  }

  .site-title {
    font-size: 1.125rem;
    font-weight: 800;
    white-space: nowrap;
    margin: 0;
    background: var(--gradient-primary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    letter-spacing: -0.01em;
    line-height: 1;
    vertical-align: middle;
  }

  .logo-content.logo-collapsed {
    justify-content: center;
    width: 100%;
  }

  .logo-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
    margin-left: auto;
  }

  .sidebar-collapsed .logo-actions {
    position: relative;
    right: auto;
    width: 100%;
    justify-content: center;
  }

  .collapse-btn {
    width: 28px !important;
    height: 28px !important;
    padding: 0 !important;
    border-radius: 6px !important;
    background: transparent !important;
    border: 1px solid var(--color-border) !important;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1) !important;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    margin: 0 auto;
    color: var(--color-text-secondary);
    font-family: inherit;
  }

  .collapse-btn:hover {
    background: hsl(var(--hue-primary), 15%, 96%) !important;
    border-color: var(--color-primary) !important;
    color: var(--color-primary) !important;
  }

  .dark .collapse-btn:hover {
    background: hsl(var(--hue-primary), 20%, 18%) !important;
  }

  .collapse-btn:active {
    transform: scale(0.95);
  }

  .collapse-icon {
    font-size: 0.875rem;
    font-weight: 600;
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
    display: inline-block;
  }

  /* 移动端关闭按钮 */
  .mobile-close-btn {
    width: 36px;
    height: 36px;
    padding: 0;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-bg);
    color: var(--color-text);
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
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
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
    padding: var(--space-sm) 0.375rem !important;
    gap: 0 !important;
    width: 100% !important;
    margin: 0.125rem 0 !important;
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
    background: hsl(var(--hue-primary), 15%, 96%) !important;
    color: var(--color-primary) !important;
    font-weight: 600;
  }

  .dark .nav-item.active {
    background: hsl(var(--hue-primary), 25%, 20%) !important;
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

  .sidebar-collapsed .nav-icon {
    width: auto;
    height: auto;
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
    background: hsl(var(--hue-primary), 10%, 96%);
    color: var(--color-primary);
  }

  .dark .sub-item:hover {
    background: hsl(var(--hue-primary), 20%, 18%);
  }

  .sub-item.active {
    background: hsl(var(--hue-primary), 15%, 96%);
    color: var(--color-primary);
    font-weight: 600;
  }

  .dark .sub-item.active {
    background: hsl(var(--hue-primary), 25%, 20%);
  }

  .sub-item.active::after {
    content: '';
    position: absolute;
    left: -1.25rem;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-primary);
    box-shadow: 0 0 0 3px hsl(var(--hue-primary), 15%, 96%);
  }

  .dark .sub-item.active::after {
    box-shadow: 0 0 0 3px hsl(var(--hue-primary), 25%, 20%);
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
