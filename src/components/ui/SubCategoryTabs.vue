<script setup lang="ts">
import type { SubCategory } from '@/types'

interface Props {
  subCategories: SubCategory[]
  selectedId: string | null
  totalCount: number
}

defineProps<Props>()

defineEmits<{
  select: [id: string | null]
}>()
</script>

<template>
  <div class="sub-category-tabs">
    <button
      class="tab-item"
      :class="{ active: selectedId === null }"
      @click="$emit('select', null)"
    >
      全部
      <span class="tab-count">{{ totalCount }}</span>
    </button>
    <button
      v-for="sub in subCategories"
      :key="sub.id"
      class="tab-item"
      :class="{ active: selectedId === sub.id }"
      @click="$emit('select', sub.id)"
    >
      <span v-if="sub.icon" class="tab-icon">{{ sub.icon }}</span>
      {{ sub.name }}
    </button>
  </div>
</template>

<style scoped>
.sub-category-tabs {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.sub-category-tabs::-webkit-scrollbar {
  display: none;
}

.tab-item {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  font-size: 0.875rem;
}

.tab-item:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.tab-item.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.tab-count {
  font-size: 0.75rem;
  opacity: 0.8;
}

.tab-icon {
  font-size: 1rem;
}

@media (max-width: 768px) {
  .tab-item {
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
  }
}
</style>
