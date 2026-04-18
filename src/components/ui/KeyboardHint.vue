<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const showHint = ref(true)
const isMac = ref(false)

onMounted(() => {
  isMac.value = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  
  // 检查用户是否已经关闭过提示
  const hintClosed = localStorage.getItem('keyboard_hint_closed')
  if (hintClosed === 'true') {
    showHint.value = false
  }
})

const closeHint = () => {
  showHint.value = false
  localStorage.setItem('keyboard_hint_closed', 'true')
}
</script>

<template>
  <Transition name="hint-fade">
    <div v-if="showHint" class="keyboard-hint">
      <div class="hint-content">
        <span class="hint-text">
          按 <kbd class="kbd">{{ isMac ? '⌘' : 'Ctrl' }}</kbd> + <kbd class="kbd">K</kbd> 快速聚焦搜索
        </span>
        <button class="hint-close" aria-label="关闭提示" @click="closeHint">
          ×
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.keyboard-hint {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 0.75rem 1rem;
  box-shadow: var(--shadow-lg), var(--shadow-glow);
  z-index: 1000;
  backdrop-filter: blur(8px);
}

.hint-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.hint-text {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 1.5rem;
  padding: 0 0.375rem;
  margin: 0 0.25rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text);
  box-shadow: 0 2px 0 var(--color-border);
  line-height: 1;
}

.hint-close {
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.hint-close:hover {
  background: var(--color-bg);
  color: var(--color-text);
}

.hint-fade-enter-active,
.hint-fade-leave-active {
  transition: all var(--transition-normal);
}

.hint-fade-enter-from,
.hint-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}

/* 移动端隐藏 */
@media (max-width: 768px) {
  .keyboard-hint {
    display: none;
  }
}
</style>
