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
  }
})

const emit = defineEmits(['select', 'toggle'])

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
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar-open': isOpen }">
    <div class="sidebar-header">
      <h2 class="sidebar-title">导航分类</h2>
      <button class="sidebar-toggle" @click="emit('toggle')">
        <span>☰</span>
      </button>
    </div>

    <nav class="sidebar-nav">
      <button
        class="nav-item"
        :class="{ active: selectedCategory === 'all' }"
        @click="handleSelect('all')"
      >
        <span class="nav-icon">📋</span>
        <span class="nav-name">全部</span>
        <span class="nav-count">{{ allLinksCount }}</span>
      </button>

      <button
        v-for="category in categories"
        :key="category.id"
        class="nav-item"
        :class="{ active: selectedCategory === category.id }"
        @click="handleSelect(category.id)"
      >
        <span class="nav-icon">{{ category.icon }}</span>
        <span class="nav-name">{{ category.name }}</span>
        <span class="nav-count">{{ getCategoryCount(category.id) }}</span>
      </button>
    </nav>

    <div class="sidebar-footer">
      <router-link to="/admin" class="admin-link">
        <span class="nav-icon">⚙️</span>
        <span class="nav-name">管理后台</span>
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
  transition: transform 0.3s ease;
}

.sidebar:not(.sidebar-open) {
  transform: translateX(-100%);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1rem;
  border-bottom: 1px solid var(--color-border);
}

.sidebar-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
}

.sidebar-toggle {
  display: none;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1.25rem;
  color: var(--color-text);
  border-radius: 8px;
}

.sidebar-toggle:hover {
  background: var(--color-bg);
}

.sidebar-nav {
  flex: 1;
  padding: 0.75rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
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
  width: 24px;
  text-align: center;
}

.nav-name {
  flex: 1;
  font-weight: 500;
}

.nav-count {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  background: var(--color-bg);
  border-radius: 10px;
  color: var(--color-secondary);
}

.nav-item.active .nav-count {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.sidebar-footer {
  padding: 0.75rem;
  border-top: 1px solid var(--color-border);
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
}

.admin-link:hover {
  background: var(--color-bg);
  color: var(--color-text);
}

@media (max-width: 768px) {
  .sidebar {
    width: 280px;
  }

  .sidebar-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .sidebar:not(.sidebar-open) {
    transform: translateX(-100%);
  }

  .sidebar-open {
    transform: translateX(0);
  }
}
</style>
