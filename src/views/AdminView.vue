<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import CategoryManager from '../components/admin/CategoryManager.vue'
import SiteManager from '../components/admin/SiteManager.vue'
import SettingsManager from '../components/admin/SettingsManager.vue'

const router = useRouter()
const activeTab = ref('sites')

const tabs = [
  { key: 'sites', name: '网站管理', icon: '🔗' },
  { key: 'categories', name: '分类管理', icon: '📁' },
  { key: 'settings', name: '系统设置', icon: '⚙️' },
]

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="admin-view">
    <!-- Header -->
    <header class="admin-header">
      <div class="header-left">
        <button class="back-btn" @click="goHome">
          ← 返回首页
        </button>
        <h1 class="header-title">管理后台</h1>
      </div>
    </header>

    <div class="admin-body">
      <!-- Sidebar -->
      <aside class="admin-sidebar">
        <nav class="sidebar-nav">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="nav-item"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            <span class="nav-icon">{{ tab.icon }}</span>
            <span class="nav-name">{{ tab.name }}</span>
          </button>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="admin-content">
        <SiteManager v-if="activeTab === 'sites'" />
        <CategoryManager v-else-if="activeTab === 'categories'" />
        <SettingsManager v-else-if="activeTab === 'settings'" />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-view {
  min-height: 100vh;
  background: var(--color-bg);
}

.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: var(--color-card);
  border-bottom: 1px solid var(--color-border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-btn {
  padding: 0.5rem 1rem;
  background: var(--color-bg);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.header-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
}

.admin-body {
  display: flex;
  min-height: calc(100vh - 65px);
}

.admin-sidebar {
  width: 220px;
  background: var(--color-card);
  border-right: 1px solid var(--color-border);
  padding: 1rem;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border: none;
  background: transparent;
  color: var(--color-secondary);
  font-size: 0.9375rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;
}

.nav-item:hover {
  background: var(--color-bg);
  color: var(--color-text);
}

.nav-item.active {
  background: var(--color-primary);
  color: white;
}

.nav-icon {
  font-size: 1.125rem;
}

.admin-content {
  flex: 1;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .admin-body {
    flex-direction: column;
  }

  .admin-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--color-border);
  }

  .sidebar-nav {
    flex-direction: row;
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }

  .nav-item {
    white-space: nowrap;
  }
}
</style>
