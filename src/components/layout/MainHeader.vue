<script setup>
import { useThemeStore } from '../../stores/theme'
import { useResponsive } from '../../hooks/useResponsive'

defineProps({
  title: {
    type: String,
    default: '全部网站'
  }
})

const emit = defineEmits(['toggle-sidebar'])

const themeStore = useThemeStore()
const { isMobile } = useResponsive()
</script>

<template>
  <header class="main-header">
    <div class="header-left">
      <!-- 移动端汉堡菜单按钮 -->
      <button
        v-if="isMobile"
        class="hamburger-btn"
        title="打开菜单"
        aria-label="打开菜单"
        @click="emit('toggle-sidebar')"
      >
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>
      <h1 class="header-title">{{ title }}</h1>
    </div>

    <div class="header-right">
      <el-button
        class="theme-btn"
        :title="themeStore.isDark ? '切换到亮色模式' : '切换到暗色模式'"
        text
        @click="themeStore.toggleTheme"
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
  padding: 0.875rem 1.5rem;
  background: var(--color-card);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 50;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: -0.01em;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* 汉堡菜单按钮样式 */
.hamburger-btn {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  gap: 4px;
}

.hamburger-btn:hover {
  border-color: var(--color-primary);
  background: hsl(var(--hue-primary), 10%, 96%);
}

.dark .hamburger-btn:hover {
  background: hsl(var(--hue-primary), 20%, 18%);
}

.hamburger-btn:active {
  transform: scale(0.95);
}

.hamburger-line {
  display: block;
  width: 18px;
  height: 2px;
  background: var(--color-text-secondary);
  border-radius: 2px;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.hamburger-btn:hover .hamburger-line {
  background: var(--color-primary);
}

.theme-btn {
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: transparent;
  font-size: 1.125rem;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
}

.theme-btn:hover {
  border-color: var(--color-primary);
  background: hsl(var(--hue-primary), 10%, 96%);
  color: var(--color-primary);
}

.dark .theme-btn:hover {
  background: hsl(var(--hue-primary), 20%, 18%);
}

.theme-btn:active {
  transform: scale(0.95);
}

/* 图标动画 */
.theme-btn span {
  display: inline-block;
  transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

@media (max-width: 768px) {
  .main-header {
    padding: 0.75rem 1rem;
  }

  .header-title {
    font-size: 1.05rem;
  }

  .theme-btn {
    width: 34px;
    height: 34px;
    font-size: 1.05rem;
  }

  .hamburger-btn {
    width: 34px;
    height: 34px;
  }

  .hamburger-line {
    width: 16px;
  }
}

@media (max-width: 480px) {
  .main-header {
    padding: 0.625rem 0.75rem;
  }

  .header-left {
    gap: 0.625rem;
  }

  .header-title {
    font-size: 1rem;
  }

  .header-right {
    gap: 0.5rem;
  }

  .theme-btn {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }

  .hamburger-btn {
    width: 36px;
    height: 36px;
  }

  .hamburger-line {
    width: 16px;
  }
}
</style>
