<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  width: {
    type: String,
    default: '400px'
  },
  closeOnClickModal: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

const isVisible = ref(props.visible)

watch(() => props.visible, (newValue) => {
  isVisible.value = newValue
})

const handleClose = () => {
  isVisible.value = false
  emit('update:visible', false)
  emit('cancel')
}

const handleConfirm = () => {
  emit('confirm')
  isVisible.value = false
  emit('update:visible', false)
}

const handleModalClick = () => {
  if (props.closeOnClickModal) {
    handleClose()
  }
}
</script>

<template>
  <div v-if="isVisible" class="dialog-overlay" @click="handleModalClick">
    <div class="dialog" :style="{ width }">
      <div class="dialog-header">
        <h3 class="dialog-title">{{ title }}</h3>
        <button class="dialog-close" @click="handleClose">×</button>
      </div>
      <div class="dialog-body">
        <slot></slot>
      </div>
      <div class="dialog-footer">
        <button class="btn-secondary" @click="handleClose">取消</button>
        <button class="btn-primary" @click="handleConfirm">确定</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.dialog {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.dialog-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.dialog-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1.5rem;
  color: var(--color-secondary);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.dialog-close:hover {
  background: var(--color-bg);
  color: var(--color-text);
}

.dialog-body {
  padding: 1.5rem;
  color: var(--color-text);
  line-height: 1.6;
}

.dialog-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg);
}

.btn-primary {
  padding: 0.625rem 1.25rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-primary:hover {
  background-color: #0284c7;
}

.btn-secondary {
  padding: 0.625rem 1.25rem;
  background: var(--color-bg);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  border-color: var(--color-primary);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .dialog {
    width: 90% !important;
    max-width: 400px;
  }
}
</style>