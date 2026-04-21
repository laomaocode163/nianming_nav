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
      <nav class="sidebar-nav">
        <el-button
          class="nav-item"
          :class="{ active: selectedCategory === 'all' }"
          text
          @click="handleSelect('all')"
        >
          <span class="nav-icon">✓</span>
          <span v-show="!collapsed" class="nav-name">全部网站</span>
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
  width: 220px;
  height: 100vh;
  background: var(--color-card);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
  transition: width var(--transition-normal), transform var(--transition-normal);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  will-change: width, transform;
  backdrop-filter: blur(10px);
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
  
  .nav-count {
    font-size: 0.8125rem !important;
    padding: 0.25rem 0.5rem !important;
    min-width: 28px;
    flex-shrink: 0;
  }
}

/* Logo Section */
.sidebar-logo-section {
  padding: 1rem 0.875rem;
  border-bottom: 1px solid var(--color-border);
  background: linear-gradient(135deg, hsl(var(--hue-primary), 20%, 96%) 0%, transparent 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-xs);
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
  position: relative;
  overflow: visible;
  min-height: 72px;
}

.sidebar-logo-section.sidebar-collapsed-header {
  justify-content: center;
}

.sidebar-logo-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    hsl(var(--hue-primary), 70%, 60%) 50%, 
    transparent 100%
  );
  opacity: 0.7;
}

.dark .sidebar-logo-section {
  background: linear-gradient(135deg, hsl(var(--hue-primary), 20%, 14%) 0%, transparent 100%);
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
}

.logo-signature {
  height: 40px;
  width: auto;
  flex-shrink: 0;
  object-fit: contain;
}

.site-title {
  font-size: 1.25rem;
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
  width: 32px !important;
  height: 32px !important;
  padding: 0 !important;
  border-radius: var(--radius-md) !important;
  background: var(--color-bg) !important;
  border: 1px solid var(--color-border) !important;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast) !important;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  margin: 0 auto;
}

.collapse-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at center, rgba(14, 165, 233, 0.1) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.collapse-btn:hover::before {
  opacity: 1;
}

.collapse-btn:hover {
  background: var(--color-primary) !important;
  border-color: var(--color-primary) !important;
  color: white !important;
  transform: scale(1.05);
  box-shadow: var(--shadow-md);
}

.collapse-btn:active {
  transform: scale(0.95);
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
  font-size: 1.875rem;
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
  font-size: 1.125rem;
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
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-secondary);
  padding: 0.875rem 0.875rem 0.5rem;
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

/* Add subtle animation to section title */
.nav-section-title {
  animation: fadeInSlide 0.5s ease-out;
}

@keyframes fadeInSlide {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
  gap: var(--space-sm);
  padding: 0.625rem 0.75rem !important;
  color: var(--color-text-secondary) !important;
  font-size: 0.9375rem !important;
  border-radius: var(--radius-lg) !important;
  text-align: left;
  width: calc(100% - 0.75rem) !important;
  margin: 0.25rem auto !important;
  white-space: nowrap;
  background: transparent !important;
  border: 1px solid transparent !important;
  box-shadow: none !important;
  transition: all var(--transition-fast);
  position: relative;
  overflow: hidden;
  justify-content: flex-start;
  min-height: 44px;
  cursor: pointer;
  /* Add subtle entrance animation */
  animation: navItemFadeIn 0.4s ease-out backwards;
}

/* Staggered animation for nav items */
.nav-item:nth-child(1) { animation-delay: 0.05s; }
.nav-item:nth-child(2) { animation-delay: 0.1s; }
.nav-item:nth-child(3) { animation-delay: 0.15s; }
.nav-item:nth-child(4) { animation-delay: 0.2s; }
.nav-item:nth-child(5) { animation-delay: 0.25s; }
.nav-item:nth-child(6) { animation-delay: 0.3s; }
.nav-item:nth-child(7) { animation-delay: 0.35s; }
.nav-item:nth-child(8) { animation-delay: 0.4s; }
.nav-item:nth-child(9) { animation-delay: 0.45s; }
.nav-item:nth-child(10) { animation-delay: 0.5s; }

@keyframes navItemFadeIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.nav-item::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, 
    rgba(14, 165, 233, 0.05) 0%, 
    transparent 100%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.sidebar-collapsed .nav-item {
  justify-content: center !important;
  padding: var(--space-sm) 0.375rem !important;
  gap: 0 !important;
  width: 100% !important;
  margin: 0.25rem 0 !important;
}

.nav-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 3px;
  background: var(--color-primary);
  transform: scaleY(0);
  transition: transform var(--transition-fast);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  opacity: 0;
}

.nav-item:hover {
  background: hsl(var(--hue-primary), 20%, 96%) !important;
  color: var(--color-primary) !important;
  border-color: transparent !important;
  transform: translateX(4px);
  box-shadow: inset 0 0 0 1px rgba(14, 165, 233, 0.1);
}

.nav-item:hover::after {
  opacity: 1;
}

.dark .nav-item:hover {
  background: hsl(var(--hue-primary), 20%, 16%) !important;
}

.sidebar-collapsed .nav-item:hover {
  transform: scale(1.05);
}

.nav-item:hover::before {
  transform: scaleY(0);
  opacity: 0;
}

.nav-item.active {
  background: transparent !important;
  color: var(--color-primary) !important;
  border-color: transparent !important;
  font-weight: 600;
  box-shadow: none !important;
}

.nav-item.active::after {
  opacity: 0;
  background: transparent;
}

.dark .nav-item.active {
  background: transparent !important;
}

.nav-item.active::before {
  transform: scaleY(0);
  opacity: 0;
}

.nav-item:active {
  transform: translateX(4px) scale(0.98);
}

.nav-icon {
  font-size: 1.125rem;
  width: 28px;
  height: 28px;
  text-align: center;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  line-height: 1;
  background: transparent;
  border-radius: var(--radius-sm);
  position: relative;
  z-index: 1;
  color: var(--color-text-secondary);
}

.sidebar-collapsed .nav-icon {
  margin: 0;
}

.nav-item:hover .nav-icon {
  transform: scale(1.1);
  color: var(--color-primary);
}

.nav-item.active .nav-icon {
  color: var(--color-primary);
}

/* 为全部网站项添加特殊样式 */
.nav-item.active:has(.nav-name:contains('全部网站')) {
  background: rgba(14, 165, 233, 0.1) !important;
}

.nav-item.active:has(.nav-name:contains('全部网站')) .nav-icon {
  color: var(--color-primary);
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
  font-size: 0.6875rem;
  padding: 0.2rem 0.5rem;
  background: rgba(14, 165, 233, 0.1);
  border-radius: 10px;
  color: var(--color-primary);
  flex-shrink: 0;
  min-width: 24px;
  text-align: center;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  margin-right: 0.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(14, 165, 233, 0.2);
}

.nav-item:hover .nav-count {
  background: rgba(14, 165, 233, 0.15);
  color: var(--color-primary);
  border-color: rgba(14, 165, 233, 0.3);
  transform: scale(1.05);
}

.nav-item.active .nav-count {
  background: rgba(14, 165, 233, 0.2);
  color: var(--color-primary);
  border-color: rgba(14, 165, 233, 0.4);
  box-shadow: 0 2px 6px rgba(14, 165, 233, 0.2);
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
  
  .nav-count {
    min-width: 24px;
    padding: 0.2rem 0.5rem;
    font-size: 0.65rem;
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
</style>
