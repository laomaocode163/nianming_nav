<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'success',
    validator: (value) => ['success', 'error', 'info'].includes(value)
  },
  duration: {
    type: Number,
    default: 3000
  }
})

const emit = defineEmits(['close'])

const isVisible = ref(false)

onMounted(() => {
  // 延迟显示，让动画效果更自然
  setTimeout(() => {
    isVisible.value = true
  }, 100)

  // 自动关闭
  setTimeout(() => {
    closeNotification()
  }, props.duration)
})

const closeNotification = () => {
  isVisible.value = false
  // 等待动画完成后再触发关闭事件
  setTimeout(() => {
    emit('close')
  }, 300)
}
</script>

<template>
  <div 
    class="notification" 
    :class="[type, { 'visible': isVisible }]"
    @click="closeNotification"
  >
    <div class="notification-icon">
      <span v-if="type === 'success'">✅</span>
      <span v-else-if="type === 'error'">❌</span>
      <span v-else>ℹ️</span>
    </div>
    <div class="notification-message">{{ message }}</div>
    <div class="notification-close">×</div>
  </div>
</template>

<style scoped>
.notification {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.8);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  opacity: 0;
  transition: all 0.3s ease;
  cursor: pointer;
  min-width: 300px;
  max-width: 90%;
  text-align: center;
}

.notification.visible {
  transform: translate(-50%, -50%) scale(1);
  opacity: 1;
}

.notification.success {
  background: #f0fdf4;
  border: 1px solid #dcfce7;
  color: #166534;
}

.notification.error {
  background: #fef2f2;
  border: 1px solid #fee2e2;
  color: #991b1b;
}

.notification.info {
  background: #eff6ff;
  border: 1px solid #dbeafe;
  color: #1e40af;
}

.notification-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.notification-message {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}

.notification-close {
  font-size: 18px;
  font-weight: 600;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.notification-close:hover {
  opacity: 1;
}

@media (max-width: 768px) {
  .notification {
    top: 10px;
    right: 10px;
    left: 10px;
    padding: 12px 16px;
  }
}
</style>