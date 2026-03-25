<script setup>
import { ref } from 'vue'

const activeTab = ref('categories')

const tabs = [
  { key: 'categories', name: '分类管理', icon: '📁' },
  { key: 'sites', name: '网站管理', icon: '🔗' },
  { key: 'settings', name: '系统设置', icon: '⚙️' },
]
</script>

<template>
  <div class="admin-view">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>管理后台</h2>
      </div>
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

    <main class="main-content">
      <header class="content-header">
        <h1>{{ tabs.find(t => t.key === activeTab)?.name }}</h1>
      </header>

      <div class="content-body">
        <div v-if="activeTab === 'categories'" class="placeholder">
          <p>分类管理功能开发中...</p>
        </div>
        <div v-else-if="activeTab === 'sites'" class="placeholder">
          <p>网站管理功能开发中...</p>
        </div>
        <div v-else-if="activeTab === 'settings'" class="placeholder">
          <p>系统设置功能开发中...</p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.admin-view {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 260px;
  background: var(--color-card);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.sidebar-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
}

.sidebar-nav {
  padding: 1rem;
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
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
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
  font-size: 1.25rem;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
}

.content-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-card);
}

.content-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text);
}

.content-body {
  flex: 1;
  padding: 2rem;
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-secondary);
  font-size: 1.125rem;
}

@media (max-width: 768px) {
  .admin-view {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--color-border);
  }

  .sidebar-nav {
    flex-direction: row;
    overflow-x: auto;
    padding: 0.75rem;
  }

  .nav-item {
    white-space: nowrap;
  }
}
</style>
