<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDataStore } from '../stores/data'
import Sidebar from '../components/layout/Sidebar.vue'
import MainHeader from '../components/layout/MainHeader.vue'
import SiteCard from '../components/ui/SiteCard.vue'

const dataStore = useDataStore()

const searchQuery = ref('')
const selectedCategoryId = ref('all')
const sidebarOpen = ref(true)
const isMobile = ref(false)

const searchEngines = computed(() => {
  return dataStore.searchConfig.externalSources.filter(s => s.enabled)
})

const selectedEngine = computed(() => {
  return searchEngines.value.find(e => e.id === dataStore.searchConfig.selectedSourceId) || searchEngines.value[0]
})

const categories = computed(() => dataStore.visibleCategories)

const filteredLinks = computed(() => {
  return dataStore.getLinksByCategory(selectedCategoryId.value)
})

const pageTitle = computed(() => {
  if (selectedCategoryId.value === 'all') return '全部网站'
  const category = categories.value.find(c => c.id === selectedCategoryId.value)
  return category?.name || '全部网站'
})

const handleSearch = () => {
  if (!searchQuery.value.trim()) return
  if (selectedEngine.value) {
    window.open(selectedEngine.value.url + encodeURIComponent(searchQuery.value), '_blank')
  }
}

const selectEngine = (engineId) => {
  dataStore.updateSearchConfig({ selectedSourceId: engineId })
}

const selectCategory = (categoryId) => {
  selectedCategoryId.value = categoryId
  if (isMobile.value) {
    sidebarOpen.value = false
  }
}

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value) {
    sidebarOpen.value = false
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<template>
  <div class="home-layout">
    <!-- Sidebar -->
    <Sidebar
      :selected-category="selectedCategoryId"
      :is-open="sidebarOpen"
      @select="selectCategory"
      @toggle="toggleSidebar"
    />

    <!-- Main Content -->
    <div class="main-content" :class="{ 'sidebar-closed': !sidebarOpen }">
      <!-- Header -->
      <MainHeader 
        :title="pageTitle"
        @menu-click="toggleSidebar"
      />

      <!-- Search Section -->
      <div class="search-section">
        <div class="search-container">
          <div class="search-box">
            <select 
              :value="selectedEngine?.id" 
              class="engine-select"
              @change="selectEngine($event.target.value)"
            >
              <option v-for="engine in searchEngines" :key="engine.id" :value="engine.id">
                {{ engine.name }}
              </option>
            </select>
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="输入搜索内容..."
              @keyup.enter="handleSearch"
            />
            <button class="search-btn" @click="handleSearch">
              <span>🔍</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Sites Grid -->
      <div class="sites-section">
        <div class="sites-grid">
          <SiteCard
            v-for="site in filteredLinks"
            :key="site.id"
            :site="site"
          />
        </div>

        <div v-if="filteredLinks.length === 0" class="empty-state">
          <span class="empty-icon">📭</span>
          <p>暂无网站数据</p>
        </div>
      </div>
    </div>

    <!-- Mobile Overlay -->
    <div 
      v-if="isMobile && sidebarOpen" 
      class="sidebar-overlay"
      @click="sidebarOpen = false"
    ></div>
  </div>
</template>

<style scoped>
.home-layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  margin-left: 260px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--color-bg);
  transition: margin-left 0.3s ease;
}

.main-content.sidebar-closed {
  margin-left: 0;
}

.search-section {
  display: flex;
  justify-content: center;
  padding: 2rem 1rem;
}

.search-container {
  width: 100%;
  max-width: 600px;
}

.search-box {
  display: flex;
  align-items: center;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 0.5rem;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.3s ease;
}

.search-box:focus-within {
  box-shadow: var(--shadow-md), 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.engine-select {
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  color: var(--color-text);
  font-size: 0.875rem;
  cursor: pointer;
  outline: none;
  border-right: 1px solid var(--color-border);
}

.search-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  color: var(--color-text);
  font-size: 1rem;
  outline: none;
}

.search-input::placeholder {
  color: var(--color-secondary);
}

.search-btn {
  padding: 0.75rem 1.25rem;
  border: none;
  background: var(--color-primary);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.25rem;
  transition: background-color 0.2s ease;
}

.search-btn:hover {
  background-color: #0284c7;
}

.sites-section {
  flex: 1;
  padding: 0 1.5rem 2rem;
}

.sites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  max-width: 1400px;
  margin: 0 auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: var(--color-secondary);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 90;
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
  }

  .search-section {
    padding: 1rem;
  }

  .sites-section {
    padding: 0 1rem 2rem;
  }

  .sites-grid {
    grid-template-columns: 1fr;
  }
}
</style>
