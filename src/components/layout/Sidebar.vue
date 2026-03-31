<script setup>
import { computed } from 'vue'
import { useDataStore } from '../../stores/data'
import { useResponsive } from '../../hooks/useResponsive'

const props = defineProps({
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
        <h1 class="site-title" v-show="!collapsed">nianming_nav</h1>
      </div>
      <div class="logo-actions">
        <!-- 移动端关闭按钮 -->
        <button
          v-if="isMobile"
          class="mobile-close-btn"
          @click="handleClose"
          title="关闭菜单"
          aria-label="关闭菜单"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <el-button
          v-else
          class="collapse-btn"
          @click="emit('toggle-collapse')"
          text
          :title="collapsed ? '展开侧边栏' : '收起侧边栏'"
        >
          <span class="collapse-icon">{{ collapsed ? '→' : '←' }}</span>
        </el-button>
      </div>
    </div>

    <!-- Navigation Section -->
    <div class="sidebar-nav-section">
      <h2 class="nav-section-title">分类导航</h2>
      <nav class="sidebar-nav">
        <el-button
          class="nav-item"
          :class="{ active: selectedCategory === 'all' }"
          @click="handleSelect('all')"
          text
        >
          <span class="nav-icon">📋</span>
          <span class="nav-name" v-show="!collapsed">全部</span>
          <span class="nav-count" v-show="!collapsed">{{ allLinksCount }}</span>
        </el-button>

        <el-button
          v-for="category in categories"
          :key="category.id"
          class="nav-item"
          :class="{ active: selectedCategory === category.id }"
          @click="handleSelect(category.id)"
          text
        >
          <span class="nav-icon">{{ category.icon }}</span>
          <span class="nav-name" v-show="!collapsed">{{ category.name }}</span>
          <span class="nav-count" v-show="!collapsed">{{ getCategoryCount(category.id) }}</span>
        </el-button>
      </nav>
    </div>

    <!-- Footer Section -->
    <div class="sidebar-footer">
      <router-link to="/admin" class="admin-link">
        <span class="nav-icon">⚙️</span>
        <span class="nav-name" v-show="!collapsed">管理后台</span>
      </router-link>
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
  width: 28px !important;
  height: 28px !important;
  padding: 0 !important;
  border-radius: 6px !important;
  background: var(--color-bg) !important;
  border: 1px solid var(--color-border) !important;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease !important;
}

.collapse-btn:hover {
  background: var(--color-primary) !important;
  border-color: var(--color-primary) !important;
  transform: scale(1.1);
}

.collapse-btn:hover .collapse-icon {
  color: white;
}

.collapse-icon {
  font-size: 0.875rem;
  color: var(--color-secondary);
  font-weight: bold;
  transition: all 0.2s ease;
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
  background: linear-gradient(135deg, var(--color-primary), #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
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
  color: var(--color-secondary) !important;
  font-size: 0.9375rem !important;
  border-radius: 14px !important;
  text-align: left;
  width: 100%;
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

.nav-item::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.nav-item:hover {
  background: var(--color-bg) !important;
  color: var(--color-text) !important;
  border-color: var(--color-border) !important;
  transform: translateX(4px);
}

.nav-item:hover::after {
  opacity: 1;
}

.sidebar-collapsed .nav-item:hover {
  transform: scale(1.08);
  border-color: transparent !important;
}

.nav-item:hover::before {
  transform: scaleY(1);
}

.nav-item.active {
  background: linear-gradient(135deg, var(--color-primary), #0d9488) !important;
  color: white !important;
  border-color: transparent !important;
  box-shadow:
    0 4px 6px -1px rgba(14, 165, 233, 0.2),
    0 2px 4px -2px rgba(14, 165, 233, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.nav-item.active::before {
  transform: scaleY(1);
  background: rgba(255, 255, 255, 0.5);
}

.nav-item:active {
  transform: translateX(4px) scale(0.98);
}

.nav-icon {
  font-size: 1.25rem;
  width: 40px;
  height: 40px;
  text-align: center;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  line-height: 1;
  background: var(--color-bg);
  border-radius: 10px;
  position: relative;
  z-index: 1;
}

.nav-icon::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, transparent 100%);
  border-radius: 10px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.nav-item:hover .nav-icon {
  transform: translateY(-2px) scale(1.1);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.2);
}

.nav-item:hover .nav-icon::before {
  opacity: 1;
}

.nav-item.active .nav-icon {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.nav-item.active .nav-icon::before {
  opacity: 0;
}

.sidebar-collapsed .nav-icon {
  width: auto;
  height: auto;
  background: transparent;
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
  padding: 0.375rem 0.75rem;
  background: var(--color-bg);
  border-radius: 20px;
  color: var(--color-secondary);
  flex-shrink: 0;
  min-width: 32px;
  text-align: center;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.nav-item:hover .nav-count {
  background: var(--color-primary);
  color: white;
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.3);
}

.nav-item.active .nav-count {
  background: rgba(255, 255, 255, 0.25);
  color: white;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* Footer Section */
.sidebar-footer {
  padding: 0.75rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.sidebar-collapsed .sidebar-footer {
  padding: 0.5rem;
}

.admin-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: var(--color-secondary);
  text-decoration: none;
  font-size: 0.9375rem;
  border-radius: 14px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  width: 100%;
  position: relative;
  overflow: hidden;
  justify-content: flex-start;
  border: 1px solid transparent;
  min-height: 48px;
}

.sidebar-collapsed .admin-link {
  justify-content: center;
  padding: 0.75rem;
  gap: 0 !important;
}

.admin-link::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.admin-link::after {
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

.admin-link:hover::before {
  opacity: 1;
}

.admin-link:hover::after {
  transform: scaleY(1);
}

.admin-link:hover {
  background: var(--color-bg);
  color: var(--color-text);
  transform: translateX(4px);
  border-color: var(--color-border);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15);
}

.admin-link:active {
  transform: translateX(4px) scale(0.98);
}

/* Responsive */
@media (max-width: 768px) {
  .sidebar {
    width: 280px;
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

  .admin-link {
    min-height: 52px;
    padding: 0.875rem 1rem;
  }

  .nav-icon {
    width: 44px;
    height: 44px;
  }
}

@media (max-width: 480px) {
  .sidebar {
    width: 260px;
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
