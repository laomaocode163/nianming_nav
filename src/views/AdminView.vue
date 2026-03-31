<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useResponsive } from '../hooks/useResponsive'
import CategoryManager from '../components/admin/CategoryManager.vue'
import SiteManager from '../components/admin/SiteManager.vue'
import SettingsManager from '../components/admin/SettingsManager.vue'

const router = useRouter()
const { isMobile } = useResponsive()

const activeTab = ref('sites')
const sidebarOpen = ref(true)
const sidebarCollapsed = ref(false)

const tabs = [
  { key: 'sites', name: '网站管理', icon: '🔗' },
  { key: 'categories', name: '分类管理', icon: '📁' },
  { key: 'settings', name: '系统设置', icon: '⚙️' },
]

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const closeSidebar = () => {
  sidebarOpen.value = false
}

const toggleSidebarCollapse = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const goHome = () => {
  router.push('/')
}

const handleTabClick = (tabKey) => {
  activeTab.value = tabKey
  if (isMobile.value) {
    closeSidebar()
  }
}

onMounted(() => {
  if (isMobile.value) {
    sidebarOpen.value = false
  }
})
</script>

<template>
  <div class="admin-layout">
    <!-- Sidebar -->
    <aside
      class="admin-sidebar"
      :class="{
        'sidebar-open': sidebarOpen,
        'sidebar-collapsed': sidebarCollapsed,
        'is-mobile': isMobile
      }"
    >
      <!-- Logo Section -->
      <div class="sidebar-logo-section">
        <div class="logo-content" :class="{ 'logo-collapsed': sidebarCollapsed }">
          <span class="logo-emoji">⚙️</span>
          <h1 class="site-title" v-show="!sidebarCollapsed">管理后台</h1>
        </div>
        <div class="logo-actions">
          <button
            v-if="isMobile"
            class="mobile-close-btn"
            @click="closeSidebar"
            title="关闭菜单"
            aria-label="关闭菜单"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button
            v-else
            class="collapse-btn"
            @click="toggleSidebarCollapse"
            :title="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'"
            aria-label="切换侧边栏"
          >
            <span class="collapse-icon">{{ sidebarCollapsed ? '→' : '←' }}</span>
          </button>
        </div>
      </div>

      <!-- Navigation Section -->
      <div class="sidebar-nav-section">
        <h2 class="nav-section-title">功能导航</h2>
        <nav class="sidebar-nav">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="nav-item"
            :class="{ active: activeTab === tab.key }"
            @click="handleTabClick(tab.key)"
          >
            <span class="nav-icon">{{ tab.icon }}</span>
            <span class="nav-name" v-show="!sidebarCollapsed">{{ tab.name }}</span>
          </button>
        </nav>
      </div>

      <!-- Footer Section -->
      <div class="sidebar-footer">
        <button class="back-home-link" @click="goHome">
          <span class="nav-icon">🏠</span>
          <span class="nav-name" v-show="!sidebarCollapsed">返回首页</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div
      class="admin-content"
      :class="{
        'sidebar-open': sidebarOpen && !isMobile,
        'sidebar-collapsed': sidebarCollapsed && !isMobile,
        'sidebar-closed': !sidebarOpen && !isMobile,
        'is-mobile': isMobile
      }"
    >
      <!-- Header -->
      <header class="admin-header">
        <div class="header-left">
          <button
            v-if="isMobile"
            class="hamburger-btn"
            @click="toggleSidebar"
            title="打开菜单"
            aria-label="打开菜单"
          >
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
          </button>
          <button class="back-btn" @click="goHome">
            ← 返回首页
          </button>
          <h1 class="header-title">{{ tabs.find(t => t.key === activeTab)?.name || '管理后台' }}</h1>
        </div>
      </header>

      <!-- Content -->
      <main class="content-main">
        <SiteManager v-if="activeTab === 'sites'" />
        <CategoryManager v-else-if="activeTab === 'categories'" />
        <SettingsManager v-else-if="activeTab === 'settings'" />
      </main>
    </div>

    <!-- Mobile Overlay -->
    <div
      v-if="isMobile && sidebarOpen"
      class="sidebar-overlay"
      @click="closeSidebar"
    ></div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
}

.admin-sidebar {
  width: 240px;
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

.admin-sidebar:not(.sidebar-open) {
  transform: translateX(-100%);
}

.admin-sidebar.sidebar-collapsed {
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
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: 6px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  cursor: pointer;
}

.collapse-btn:hover {
  background: var(--color-primary);
  border-color: var(--color-primary);
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
  font-size: 1.25rem;
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

.admin-sidebar.sidebar-collapsed .nav-section-title {
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
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: var(--color-secondary);
  font-size: 0.9375rem;
  border-radius: 14px;
  text-align: left;
  width: 100%;
  white-space: nowrap;
  background: transparent;
  border: 1px solid transparent;
  box-shadow: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  justify-content: flex-start;
  min-height: 48px;
  cursor: pointer;
}

.admin-sidebar.sidebar-collapsed .nav-item {
  justify-content: center;
  padding: 0.75rem;
  gap: 0;
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
  background: var(--color-bg);
  color: var(--color-text);
  border-color: var(--color-border);
  transform: translateX(4px);
}

.nav-item:hover::after {
  opacity: 1;
}

.admin-sidebar.sidebar-collapsed .nav-item:hover {
  transform: scale(1.08);
  border-color: transparent;
}

.nav-item:hover::before {
  transform: scaleY(1);
}

.nav-item.active {
  background: linear-gradient(135deg, var(--color-primary), #0d9488);
  color: white;
  border-color: transparent;
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

.admin-sidebar.sidebar-collapsed .nav-icon {
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

/* Footer Section */
.sidebar-footer {
  padding: 0.75rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.admin-sidebar.sidebar-collapsed .sidebar-footer {
  padding: 0.5rem;
}

.back-home-link {
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
  background: transparent;
  cursor: pointer;
}

.admin-sidebar.sidebar-collapsed .back-home-link {
  justify-content: center;
  padding: 0.75rem;
  gap: 0;
}

.back-home-link::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.back-home-link::after {
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

.back-home-link:hover::before {
  opacity: 1;
}

.back-home-link:hover::after {
  transform: scaleY(1);
}

.back-home-link:hover {
  background: var(--color-bg);
  color: var(--color-text);
  transform: translateX(4px);
  border-color: var(--color-border);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15);
}

.back-home-link:active {
  transform: translateX(4px) scale(0.98);
}

/* Main Content */
.admin-content {
  flex: 1;
  margin-left: 240px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--color-bg);
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.admin-content.sidebar-collapsed {
  margin-left: 72px;
}

.admin-content.sidebar-closed {
  margin-left: 0;
}

.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: var(--color-card);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* 汉堡菜单按钮 */
.hamburger-btn {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 2px solid var(--color-border);
  border-radius: 12px;
  background: linear-gradient(145deg, var(--color-card), var(--color-bg));
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  gap: 5px;
}

.hamburger-btn:hover {
  border-color: var(--color-primary);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.2);
}

.hamburger-btn:active {
  transform: scale(0.95);
}

.hamburger-line {
  display: block;
  width: 20px;
  height: 2px;
  background: var(--color-text);
  border-radius: 2px;
  transition: all 0.3s ease;
}

.hamburger-btn:hover .hamburger-line {
  background: var(--color-primary);
}

.back-btn {
  padding: 0.625rem 1rem;
  background: var(--color-bg);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
}

.back-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15);
}

.header-title {
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--color-primary), #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.content-main {
  flex: 1;
  overflow-y: auto;
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 90;
}

/* Responsive */
@media (max-width: 768px) {
  .admin-sidebar {
    width: 240px;
  }

  .admin-content {
    margin-left: 0;
  }

  .admin-header {
    padding: 0.75rem 1rem;
  }

  .header-title {
    font-size: 1.1rem;
  }

  .back-btn {
    padding: 0.5rem 0.875rem;
    font-size: 0.8125rem;
  }

  /* 移动端优化触摸目标 */
  .nav-item {
    min-height: 52px;
    padding: 0.875rem 1rem;
  }

  .back-home-link {
    min-height: 52px;
    padding: 0.875rem 1rem;
  }

  .nav-icon {
    width: 44px;
    height: 44px;
  }
}

@media (max-width: 480px) {
  .admin-sidebar {
    width: 220px;
  }

  .sidebar-logo-section {
    padding: 1rem;
  }

  .logo-emoji {
    font-size: 2rem;
  }

  .site-title {
    font-size: 1.125rem;
  }

  .nav-section-title {
    padding: 0.75rem 1rem 0.5rem;
    font-size: 0.75rem;
  }

  .sidebar-nav {
    padding: 0.375rem 0.625rem;
  }

  .nav-item {
    padding: 0.75rem 0.875rem;
    font-size: 0.875rem;
    border-radius: 12px;
  }

  .nav-icon {
    width: 40px;
    height: 40px;
    font-size: 1.125rem;
  }

  .admin-header {
    padding: 0.75rem 1rem;
  }

  .header-title {
    font-size: 1rem;
  }

  .hamburger-btn {
    width: 40px;
    height: 40px;
  }

  .hamburger-line {
    width: 18px;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .nav-item:hover {
    transform: none;
  }

  .nav-item:hover .nav-icon {
    transform: none;
  }

  .back-home-link:hover {
    transform: none;
  }

  .nav-item:active {
    transform: scale(0.98);
    background: rgba(14, 165, 233, 0.05);
  }

  .back-home-link:active {
    transform: scale(0.98);
    background: rgba(14, 165, 233, 0.05);
  }
}
</style>
