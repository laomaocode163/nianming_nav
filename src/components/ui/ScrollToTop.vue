<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ArrowUp } from '@element-plus/icons-vue'

const visible = ref(false)
const scrollThreshold = 300

const handleScroll = () => {
  visible.value = window.scrollY > scrollThreshold
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <Transition name="scroll-fade">
    <button
      v-show="visible"
      class="scroll-to-top"
      title="回到顶部"
      aria-label="回到顶部"
      @click="scrollToTop"
    >
      <el-icon><ArrowUp /></el-icon>
    </button>
  </Transition>
</template>

<style scoped>
.scroll-to-top {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 48px;
  height: 48px;
  background: var(--gradient-primary);
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 1.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-lg), var(--shadow-glow);
  transition: all var(--transition-fast);
  z-index: 1000;
}

.scroll-to-top:hover {
  transform: translateY(-4px) scale(1.05);
  box-shadow: var(--shadow-xl), var(--shadow-glow);
}

.scroll-to-top:active {
  transform: translateY(-2px) scale(1.02);
}

.scroll-fade-enter-active,
.scroll-fade-leave-active {
  transition: all var(--transition-normal);
}

.scroll-fade-enter-from,
.scroll-fade-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.9);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .scroll-to-top {
    bottom: 1.5rem;
    right: 1.5rem;
    width: 44px;
    height: 44px;
    font-size: 1.125rem;
  }
}

@media (max-width: 480px) {
  .scroll-to-top {
    bottom: 1rem;
    right: 1rem;
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
}
</style>
