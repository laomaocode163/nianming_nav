<script setup>
import { ref } from 'vue'
import { useThemeStore } from '../stores/theme'

const themeStore = useThemeStore()
const searchQuery = ref('')
const searchEngine = ref('google')

const searchEngines = [
  { key: 'google', name: 'Google', url: 'https://www.google.com/search?q=' },
  { key: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=' },
  { key: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd=' },
]

const handleSearch = () => {
  if (!searchQuery.value.trim()) return
  const engine = searchEngines.find(e => e.key === searchEngine.value)
  if (engine) {
    window.open(engine.url + encodeURIComponent(searchQuery.value), '_blank')
  }
}

const categories = ref([
  {
    id: 1,
    name: '开发工具',
    icon: '💻',
    sites: [
      { id: 1, name: 'GitHub', url: 'https://github.com', desc: '代码托管平台' },
      { id: 2, name: 'Stack Overflow', url: 'https://stackoverflow.com', desc: '开发者问答社区' },
    ],
  },
  {
    id: 2,
    name: '设计资源',
    icon: '🎨',
    sites: [
      { id: 3, name: 'Figma', url: 'https://figma.com', desc: '协作设计工具' },
      { id: 4, name: 'Dribbble', url: 'https://dribbble.com', desc: '设计灵感社区' },
    ],
  },
])
</script>

<template>
  <div class="home-view">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <h1 class="logo">nianming_nav</h1>
        <button class="theme-toggle" @click="themeStore.toggleTheme" :title="themeStore.isDark ? '切换到亮色模式' : '切换到暗色模式'">
          <span v-if="themeStore.isDark">☀️</span>
          <span v-else>🌙</span>
        </button>
      </div>
    </header>

    <!-- Search Section -->
    <div class="search-section">
      <div class="search-container">
        <div class="search-box">
          <select v-model="searchEngine" class="engine-select">
            <option v-for="engine in searchEngines" :key="engine.key" :value="engine.key">
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

    <!-- Categories Section -->
    <div class="categories-section">
      <div class="categories-container">
        <div v-for="category in categories" :key="category.id" class="category-card">
          <div class="category-header">
            <span class="category-icon">{{ category.icon }}</span>
            <h3 class="category-name">{{ category.name }}</h3>
          </div>
          <div class="sites-grid">
            <a
              v-for="site in category.sites"
              :key="site.id"
              :href="site.url"
              target="_blank"
              class="site-card"
            >
              <div class="site-name">{{ site.name }}</div>
              <div class="site-desc">{{ site.desc }}</div>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-view {
  min-height: 100vh;
  padding: 2rem;
}

/* Header */
.header {
  max-width: 1200px;
  margin: 0 auto 1rem;
  padding: 0 0.5rem;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--color-primary), #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.theme-toggle {
  width: 44px;
  height: 44px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-card);
  cursor: pointer;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.theme-toggle:hover {
  border-color: var(--color-primary);
  transform: scale(1.05);
}

.search-section {
  display: flex;
  justify-content: center;
  padding: 4rem 1rem;
}

.search-container {
  width: 100%;
  max-width: 700px;
}

.search-box {
  display: flex;
  align-items: center;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 0.5rem;
  box-shadow: var(--shadow-md);
  transition: box-shadow 0.3s ease;
}

.search-box:focus-within {
  box-shadow: var(--shadow-lg), 0 0 0 3px rgba(14, 165, 233, 0.1);
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
  background-color: var(--color-primary-600, #0284c7);
}

.categories-section {
  max-width: 1200px;
  margin: 0 auto;
}

.categories-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.category-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
}

.category-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.category-icon {
  font-size: 1.5rem;
}

.category-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
}

.sites-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.site-card {
  display: block;
  padding: 1rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.2s ease;
}

.site-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.site-name {
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.25rem;
}

.site-desc {
  font-size: 0.75rem;
  color: var(--color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 640px) {
  .home-view {
    padding: 1rem;
  }

  .search-section {
    padding: 2rem 0.5rem;
  }

  .categories-container {
    grid-template-columns: 1fr;
  }

  .sites-grid {
    grid-template-columns: 1fr;
  }
}
</style>
