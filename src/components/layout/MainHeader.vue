<script setup>
import { useThemeStore } from '../../stores/theme'
import { useResponsive } from '../../hooks/useResponsive'

const props = defineProps({
  title: {
    type: String,
    default: '全部网站'
  }
})

const emit = defineEmits(['batch-edit-click', 'sort-click', 'toggle-sidebar'])

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
        @click="emit('toggle-sidebar')"
        title="打开菜单"
        aria-label="打开菜单"
      >
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-title {
  font-size: 1.25rem;
  font-weight: 700;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* 汉堡菜单按钮样式 */
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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

.action-btn, .theme-btn {
  width: 48px;
  height: 48px;
  border: 2px solid var(--color-border);
  border-radius: 14px;
  background: linear-gradient(145deg, var(--color-card), var(--color-bg));
  font-size: 1.25rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.action-btn::before, .theme-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.2) 0%, transparent 70%);
  transform: translate(-50%, -50%);
  transition: width 0.4s ease, height 0.4s ease;
}

.action-btn::after, .theme-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, transparent 50%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.action-btn:hover::before, .theme-btn:hover::before {
  width: 120%;
  height: 120%;
}

.action-btn:hover::after, .theme-btn:hover::after {
  opacity: 1;
}

.action-btn:hover, .theme-btn:hover {
  border-color: var(--color-primary);
  transform: translateY(-3px) scale(1.08);
  box-shadow:
    0 8px 20px rgba(14, 165, 233, 0.2),
    0 4px 8px rgba(14, 165, 233, 0.1);
}

.action-btn:active, .theme-btn:active {
  transform: translateY(-1px) scale(0.96);
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.15);
}

/* 批量编辑按钮特殊样式 */
.action-btn:nth-child(1):hover {
  border-color: var(--color-success);
  box-shadow:
    0 8px 20px rgba(16, 185, 129, 0.2),
    0 4px 8px rgba(16, 185, 129, 0.1);
}

.action-btn:nth-child(1)::before {
  background: radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%);
}

/* 排序按钮特殊样式 */
.action-btn:nth-child(2):hover {
  border-color: var(--color-warning);
  box-shadow:
    0 8px 20px rgba(245, 158, 11, 0.2),
    0 4px 8px rgba(245, 158, 11, 0.1);
}

.action-btn:nth-child(2)::before {
  background: radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, transparent 70%);
}

/* 主题按钮特殊样式 */
.theme-btn:hover {
  border-color: var(--color-secondary);
  box-shadow:
    0 8px 20px rgba(139, 92, 246, 0.2),
    0 4px 8px rgba(139, 92, 246, 0.1);
}

.theme-btn::before {
  background: radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%);
}

/* 图标动画 */
.action-btn span, .theme-btn span {
  display: inline-block;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1;
}

.action-btn:hover span, .theme-btn:hover span {
  transform: scale(1.15) rotate(5deg);
}

.action-btn:active span, .theme-btn:active span {
  transform: scale(0.95);
}

@media (max-width: 768px) {
  .main-header {
    padding: 0.75rem 1rem;
  }

  .header-title {
    font-size: 1.1rem;
  }

  .action-btn, .theme-btn {
    width: 40px;
    height: 40px;
    font-size: 1.1rem;
  }

  .hamburger-btn {
    width: 40px;
    height: 40px;
  }

  .hamburger-line {
    width: 18px;
  }
}

@media (max-width: 480px) {
  .main-header {
    padding: 0.625rem 0.75rem;
  }

  .header-left {
    gap: 0.75rem;
  }

  .header-title {
    font-size: 1rem;
  }

  .header-right {
    gap: 0.5rem;
  }

  .action-btn, .theme-btn {
    width: 36px;
    height: 36px;
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
