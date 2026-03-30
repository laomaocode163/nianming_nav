<script setup>
import { useThemeStore } from '../../stores/theme'

const props = defineProps({
  title: {
    type: String,
    default: '全部网站'
  }
})

const emit = defineEmits(['batch-edit-click', 'sort-click'])

const themeStore = useThemeStore()
</script>

<template>
  <header class="main-header">
    <div class="header-left">
      <h1 class="header-title">{{ title }}</h1>
    </div>

    <div class="header-right">
      <el-button 
        class="action-btn" 
        @click="emit('batch-edit-click')"
        :title="'批量编辑'"
        text
      >
        <span>📋</span>
      </el-button>
      <el-button 
        class="action-btn" 
        @click="emit('sort-click')"
        :title="'排序'"
        text
      >
        <span>🔄</span>
      </el-button>
      <el-button 
        class="theme-btn" 
        @click="themeStore.toggleTheme"
        :title="themeStore.isDark ? '切换到亮色模式' : '切换到暗色模式'"
        text
      >
        <span v-if="themeStore.isDark">☀️</span>
        <span v-else>🌙</span>
      </el-button>
    </div>
  </header>
</template>

<style scoped>
.main-header {
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

.header-title {
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--color-primary), #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-btn, .theme-btn {
  width: 40px;
  height: 40px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-bg);
  font-size: 1.125rem;
  transition: all 0.2s ease;
}

.action-btn:hover, .theme-btn:hover {
  border-color: var(--color-primary);
  transform: scale(1.05);
}

@media (max-width: 768px) {
  .main-header {
    padding: 0.75rem 1rem;
  }
}
</style>
