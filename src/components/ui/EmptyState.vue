<script setup>
import { computed } from 'vue'

const props = defineProps({
  icon: {
    type: String,
    default: '📭'
  },
  title: {
    type: String,
    default: '暂无数据'
  },
  description: {
    type: String,
    default: ''
  },
  actionText: {
    type: String,
    default: ''
  },
  showAction: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['action'])

const hasDescription = computed(() => !!props.description)
const hasAction = computed(() => props.showAction && !!props.actionText)
</script>

<template>
  <div class="empty-state">
    <div class="empty-icon">{{ icon }}</div>
    <h3 class="empty-title">{{ title }}</h3>
    <p v-if="hasDescription" class="empty-description">{{ description }}</p>
    <button
      v-if="hasAction"
      class="empty-action"
      @click="emit('action')"
    >
      {{ actionText }}
    </button>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl) var(--space-xl);
  text-align: center;
  animation: fadeInUp 0.5s var(--ease-out-expo);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.empty-icon {
  font-size: 4rem;
  line-height: 1;
  margin-bottom: var(--space-lg);
  opacity: 0.6;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 var(--space-sm);
  line-height: 1.4;
}

.empty-description {
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-lg);
  max-width: 320px;
  line-height: 1.6;
}

.empty-action {
  padding: 0.75rem 1.5rem;
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-md);
}

.empty-action:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg), var(--shadow-glow);
}

.empty-action:active {
  transform: translateY(0);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .empty-state {
    padding: var(--space-xl) var(--space-md);
  }

  .empty-icon {
    font-size: 3rem;
  }

  .empty-title {
    font-size: 1.125rem;
  }

  .empty-description {
    font-size: 0.875rem;
  }
}
</style>
