<script setup>
import { computed } from 'vue'
import { useDataStore } from '../../stores/data'

const props = defineProps({
  selectedCategory: {
    type: String,
    default: 'all'
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  isCollapsed: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select', 'toggle', 'collapse'])

const dataStore = useDataStore()

const categories = computed(() => dataStore.visibleCategories)

const allLinksCount = computed(() => {
  return dataStore.links.filter(l => !l.hidden).length
})

const getCategoryCount = (categoryId) => {
  return dataStore.getLinksByCategory(categoryId).length
}

const handleSelect = (categoryId) => {
  emit('select', categoryId)
}

const handleCollapse = () => {
  emit('collapse', !props.isCollapsed)
}
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar-open': isOpen, 'sidebar-collapsed': isCollapsed }">
    <div class="sidebar-header">
      <h2 v-if="!isCollapsed" class="sidebar-title">导航分类</h2>
      <div class="sidebar-actions">
        <el-button class="collapse-btn" @click="handleCollapse" text>
          <span v-if="!isCollapsed">«</span>
          <span v-else>»</span>
        </el-button>
      </div>
    </div>

    <nav class="sidebar-nav">
      <el-button
        class="nav-item"
        :class="{ active: selectedCategory === 'all' }"
        @click="handleSelect('all')"
        text
      >
        <span class="nav-icon">📋</span>
        <span v-if="!isCollapsed" class="nav-name">全部</span>
        <span v-if="!isCollapsed" class="nav-count">{{ allLinksCount }}</span>
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
        <span v-if="!isCollapsed" class="nav-name">{{ category.name }}</span>
        <span v-if="!isCollapsed" class="nav-count">{{ getCategoryCount(category.id) }}</span>
      </el-button>
    </nav>

    <div class="sidebar-footer">
      <router-link to="/admin" class="admin-link">
        <span class="nav-icon">⚙️</span>
        <span v-if="!isCollapsed" class="nav-name">管理后台</span>
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
  transition: width 0.3s ease, transform 0.3s ease;
  overflow: hidden;
}

.sidebar:not(.sidebar-open) {
  transform: translateX(-100%);
}

.sidebar.sidebar-collapsed {
  width: 60px;
}

.sidebar.sidebar-collapsed .sidebar-header {
  padding: 0.75rem 0;
  justify-content: center;
  flex-direction: column;
  gap: 0.25rem;
}

.sidebar.sidebar-collapsed .sidebar-title {
  display: none;
}

.sidebar.sidebar-collapsed .sidebar-actions {
  justify-content: center;
}

.sidebar.sidebar-collapsed .collapse-btn {
  width: 40px !important;
  height: 40px !important;
  font-size: 1rem !important;
  border-radius: 50% !important;
  background: var(--color-bg) !important;
}

.sidebar.sidebar-collapsed .nav-name,
.sidebar.sidebar-collapsed .nav-count {
  display: none;
}

.sidebar.sidebar-collapsed .sidebar-nav {
  padding: 0.5rem 0.25rem;
}

.sidebar.sidebar-collapsed .nav-item {
  justify-content: center;
  padding: 0.875rem 0 !important;
  margin: 0.125rem 0;
  border-radius: 12px !important;
}

.sidebar.sidebar-collapsed .nav-icon {
  width: 28px;
  font-size: 1.25rem;
}

.sidebar.sidebar-collapsed .sidebar-footer {
  padding: 0.5rem 0.25rem;
}

.sidebar.sidebar-collapsed .admin-link {
  justify-content: center;
  padding: 0.875rem 0;
  gap: 0;
  border-radius: 12px;
}

.sidebar.sidebar-collapsed .admin-link .nav-icon {
  width: 28px;
  font-size: 1.25rem;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1rem;
  border-bottom: 1px solid var(--color-border);
  transition: padding 0.3s ease;
}

.sidebar-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
}

.sidebar-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: justify-content 0.3s ease;
}

.collapse-btn {
  width: 36px !important;
  height: 36px !important;
  font-size: 1.25rem !important;
  color: var(--color-text) !important;
  border-radius: 8px !important;
  display: flex !important;
  align-items: center;
  justify-content: center;
}

.collapse-btn:hover {
  background: var(--color-bg) !important;
  transform: scale(1.1);
}

.sidebar-nav {
  flex: 1;
  padding: 0.75rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  transition: padding 0.3s ease;
}

.sidebar.sidebar-collapsed .sidebar-nav {
  padding: 0.5rem;
}

.nav-item {
  display: flex !important;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem !important;
  color: var(--color-secondary) !important;
  font-size: 0.9375rem !important;
  border-radius: 10px !important;
  text-align: left;
  width: 100%;
  white-space: nowrap;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.nav-item:hover {
  background: var(--color-bg) !important;
  color: var(--color-text) !important;
  transform: translateX(2px);
}

.nav-item.active {
  background: var(--color-primary) !important;
  color: white !important;
  transform: none;
}

.nav-icon {
  font-size: 1.125rem;
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.nav-name {
  flex: 1;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-count {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  background: var(--color-bg);
  border-radius: 10px;
  color: var(--color-secondary);
  flex-shrink: 0;
  min-width: 24px;
  text-align: center;
}

.nav-item.active .nav-count {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.sidebar-footer {
  padding: 0.75rem;
  border-top: 1px solid var(--color-border);
  transition: padding 0.3s ease;
}

.sidebar.sidebar-collapsed .sidebar-footer {
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
  border-radius: 10px;
  transition: all 0.2s ease;
  white-space: nowrap;
  width: 100%;
}

.admin-link:hover {
  background: var(--color-bg);
  color: var(--color-text);
  transform: translateX(2px);
}

@media (max-width: 768px) {
  .sidebar {
    width: 280px;
  }

  .sidebar.sidebar-collapsed {
    width: 60px;
  }

  .sidebar:not(.sidebar-open) {
    transform: translateX(-100%);
  }

  .sidebar-open {
    transform: translateX(0);
  }
}
</style>
