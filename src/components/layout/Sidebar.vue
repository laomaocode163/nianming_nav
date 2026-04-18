<script setup>
import { computed } from 'vue'
import { useDataStore } from '../../stores/data'
import { useResponsive } from '../../hooks/useResponsive'

defineProps({
  selectedCategory: {
    type: String,
    default: 'all'
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  collapsed: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select', 'toggle-collapse', 'close'])

const dataStore = useDataStore()
const { isMobile } = useResponsive()

const categories = computed(() => dataStore.visibleCategories)

const allLinksCount = computed(() => {
  return dataStore.links.filter(l => !l.hidden).length
})

const getCategoryCount = (categoryId) => {
  return dataStore.getLinksByCategory(categoryId).length
}

const handleSelect = (categoryId) => {
  emit('select', categoryId)
  // 移动端选择分类后自动关闭侧边栏
  if (isMobile.value) {
    emit('close')
  }
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar-open': isOpen, 'sidebar-collapsed': collapsed, 'is-mobile': isMobile }">
    <!-- Logo Section -->
    <div class="sidebar-logo-section">
      <div class="logo-content" :class="{ 'logo-collapsed': collapsed }">
        <span class="logo-emoji">🐱</span>
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
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <el-button
          v-else
          class="collapse-btn"
          text
          :title="collapsed ? '展开侧边栏' : '收起侧边栏'"
          @click="emit('toggle-collapse')"
        >
          <span class="collapse-icon">{{ collapsed ? '→' : '←' }}</span>
        </el-button>
      </div>
    </div>

    <!-- Navigation Section -->
    <div class="sidebar-nav-section">
      <h2 class="nav-section-title">导航目录</h2>
      <nav class="sidebar-nav">
        <el-button
          class="nav-item"
          :class="{ active: selectedCategory === 'all' }"
          text
          @click="handleSelect('all')"
        >
          <span class="nav-icon">📋</span>
          <span v-show="!collapsed" class="nav-name">全部</span>
          <span v-show="!collapsed" class="nav-count">{{ allLinksCount }}</span>
        </el-button>

        <el-button
          v-for="category in categories"
          :key="category.id"
          class="nav-item"
          :class="{ active: selectedCategory === category.id }"
          text
          @click="handleSelect(category.id)"
        >
          <span class="nav-icon">{{ category.icon }}</span>
          <span v-show="!collapsed" class="nav-name">{{ category.name }}</span>
          <span v-show="!collapsed" class="nav-count">{{ getCategoryCount(category.id) }}</span>
        </el-button>
      </nav>
    </div>


  </aside>
</template>

<style scoped>
.sidebar {
  width: 260px;
  height: 100vh;
  background: var(--color-card);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s ease;
  overflow: hidden;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
}

.sidebar:not(.sidebar-open) {
  transform: translateX(-100%);
}

.sidebar.sidebar-collapsed {
  width: 72px;
}

/* Logo Section */
.sidebar-logo-section {
  padding: 1.5rem 1rem;
  border-bottom: 1px solid var(--color-border);
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.05) 0%, transparent 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.logo-content {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  animation: logoFadeIn 0.5s ease-out;
  flex: 1;
  overflow: hidden;
}

.logo-content.logo-collapsed {
  justify-content: flex-start;
}

.logo-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.collapse-btn {
  width: 32px !important;
  height: 32px !important;
  padding: 0 !important;
  border-radius: 10px !important;
  background: linear-gradient(145deg, var(--color-card), var(--color-bg)) !important;
  border: 2px solid var(--color-border) !important;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
}

.collapse-btn:hover {
  background: linear-gradient(135deg, var(--color-primary), #0d9488) !important;
  border-color: transparent !important;
  transform: scale(1.15) rotate(-5deg);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
}

.collapse-btn:active {
  transform: scale(0.95);
  box-shadow: 0 2px 6px rgba(14, 165, 233, 0.2);
}

.collapse-btn:hover .collapse-icon {
  color: white;
  transform: scale(1.1);
}

.collapse-icon {
  font-size: 0.9375rem;
  color: var(--color-secondary);
  font-weight: bold;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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

.logo-emoji {
  font-size: 2.25rem;
  flex-shrink: 0;
  animation: emojiFloat 3s ease-in-out infinite;
}

@keyframes emojiFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.site-title {
  font-size: 1.375rem;
  font-weight: 800;
  color: var(--color-text);
  white-space: nowrap;
  margin: 0;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Navigation Section */
.sidebar-nav-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.nav-section-title {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--color-secondary);
  padding: 1rem 1rem 0.5rem;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  position: relative;
  white-space: nowrap;
  overflow: hidden;
  transition: opacity 0.2s ease;
}

.sidebar-collapsed .nav-section-title {
  opacity: 0;
  pointer-events: none;
  padding: 0;
  margin: 0.5rem 0;
}

.nav-section-title::after {
  content: '';
  position: absolute;
  bottom: 0.375rem;
  left: 1rem;
  right: 1rem;
  height: 1px;
  background: linear-gradient(90deg, var(--color-border) 0%, transparent 100%);
}

.sidebar-nav {
  flex: 1;
  padding: 0.5rem 0.75rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

/* Nav Item */
.nav-item {
  display: flex !important;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem !important;
  color: var(--color-text-secondary) !important;
  font-size: 0.9375rem !important;
  border-radius: 14px !important;
  text-align: left;
  width: 100% !important;
  white-space: nowrap;
  background: transparent !important;
  border: 1px solid transparent !important;
  box-shadow: none !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  justify-content: flex-start;
  min-height: 48px;
  cursor: pointer;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.sidebar-collapsed .nav-item {
  justify-content: center;
  padding: 0.75rem !important;
  gap: 0 !important;
}

.nav-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 4px;
  background: linear-gradient(180deg, var(--color-primary), #38bdf8);
  transform: scaleY(0);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 0 4px 4px 0;
}

.nav-item:hover {
  background: rgba(14, 165, 233, 0.08) !important;
  color: var(--color-primary) !important;
  border-color: transparent !important;
  transform: translateX(4px);
}

.sidebar-collapsed .nav-item:hover {
  transform: scale(1.05);
}

.nav-item:hover::before {
  transform: scaleY(1);
}

.nav-item.active {
  background: rgba(14, 165, 233, 0.12) !important;
  color: var(--color-primary) !important;
  border-color: transparent !important;
  font-weight: 600;
}

.nav-item.active::before {
  transform: scaleY(1);
}

.nav-item:active {
  transform: translateX(4px) scale(0.98);
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  line-height: 1;
  background: transparent;
  border-radius: 8px;
  position: relative;
  z-index: 1;
}

.nav-item:hover .nav-icon {
  transform: scale(1.1);
}

.nav-item.active .nav-icon {
  transform: scale(1.05);
}

.sidebar-collapsed .nav-icon {
  width: auto;
  height: auto;
}

.nav-name {
  flex: 1;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.5;
  display: flex;
  align-items: center;
  position: relative;
  z-index: 1;
}

.nav-count {
  font-size: 0.75rem;
  padding: 0.25rem 0.625rem;
  background: rgba(14, 165, 233, 0.1);
  border-radius: 12px;
  color: var(--color-primary);
  flex-shrink: 0;
  min-width: 28px;
  text-align: center;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  margin-right: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.nav-item:hover .nav-count {
  background: rgba(14, 165, 233, 0.15);
  color: var(--color-primary);
}

.nav-item.active .nav-count {
  background: rgba(14, 165, 233, 0.2);
  color: var(--color-primary);
}



/* Responsive */
@media (max-width: 768px) {
  .sidebar {
    width: 240px;
  }

  .sidebar:not(.sidebar-open) {
    transform: translateX(-100%);
  }

  .sidebar-open {
    transform: translateX(0);
  }

  /* 移动端优化触摸目标 */
  .nav-item {
    min-height: 52px;
    padding: 0.875rem 1rem !important;
  }

  .nav-icon {
    width: 36px;
    height: 36px;
  }
}

@media (max-width: 480px) {
  .sidebar {
    width: 220px;
  }

  .sidebar-logo-section {
    padding: 1rem;
  }

  .logo-emoji {
    font-size: 2rem;
  }

  .site-title {
    font-size: 1.25rem;
  }

  .nav-section-title {
    padding: 0.75rem 1rem 0.5rem;
    font-size: 0.75rem;
  }

  .sidebar-nav {
    padding: 0.375rem 0.625rem;
  }

  .nav-item {
    padding: 0.75rem 0.875rem !important;
    font-size: 0.875rem !important;
    border-radius: 12px !important;
  }

  .nav-icon {
    width: 40px;
    height: 40px;
    font-size: 1.125rem;
  }
}
</style>
