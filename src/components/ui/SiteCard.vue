<script setup>
import { computed, ref, watch } from 'vue'
import { useDataStore } from '../../stores/data'
import { getDefaultIcon } from '../../utils/constants'

const props = defineProps({
  site: {
    type: Object,
    required: true
  }
})

const dataStore = useDataStore()

const siteIcon = computed(() => {
  return dataStore.getLinkIcon(props.site)
})

const isSelected = ref(false)

// 监听selectedLinks的变化
watch(
  () => dataStore.selectedLinks,
  (newSelectedLinks) => {
    isSelected.value = newSelectedLinks.includes(props.site.id)
  },
  { deep: true, immediate: true }
)

const onIconError = (event) => {
  const img = event.target
  img.src = getDefaultIcon()
  img.onerror = null
}

const handleSelect = (event) => {
  event.preventDefault()
  event.stopPropagation()
  dataStore.toggleLinkSelection(props.site.id)
}

const handleClick = (event) => {
  if (dataStore.batchEditMode) {
    event.preventDefault()
    event.stopPropagation()
    dataStore.toggleLinkSelection(props.site.id)
  } else if (dataStore.sortMode) {
    event.preventDefault()
    event.stopPropagation()
  }
}
</script>

<template>
  <a
    :href="dataStore.sortMode || dataStore.batchEditMode ? '#' : site.url"
    :target="dataStore.sortMode || dataStore.batchEditMode ? '_self' : '_blank'"
    rel="noopener noreferrer"
    class="site-card"
    :class="{ 
      'selected': isSelected, 
      'sort-mode': dataStore.sortMode
    }"
    @click="handleClick"
  >
    <!-- 拖拽手柄 - 仅在排序模式下显示 -->
    <div v-if="dataStore.sortMode" class="drag-handle">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="9" cy="6" r="1.5" fill="currentColor"/>
        <circle cx="9" cy="12" r="1.5" fill="currentColor"/>
        <circle cx="9" cy="18" r="1.5" fill="currentColor"/>
        <circle cx="15" cy="6" r="1.5" fill="currentColor"/>
        <circle cx="15" cy="12" r="1.5" fill="currentColor"/>
        <circle cx="15" cy="18" r="1.5" fill="currentColor"/>
      </svg>
    </div>

    <div v-if="dataStore.batchEditMode" class="select-checkbox">
      <input
        type="checkbox"
        :checked="isSelected"
        @click.stop="handleSelect"
      />
    </div>

    <div class="site-icon-wrapper">
      <img
        :src="siteIcon"
        :alt="site.title"
        class="site-icon"
        loading="lazy"
        @error="onIconError"
      />
    </div>

    <div class="site-info">
      <div class="site-name">{{ site.title }}</div>
      <div v-if="site.description" class="site-desc">{{ site.description }}</div>
    </div>

    <div v-if="site.pinned && !dataStore.sortMode" class="pinned-badge">📌</div>
  </a>
</template>

<style scoped>
.site-card {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem 1.125rem;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  user-select: none;
}

.site-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* 排序模式样式 */
.site-card.sort-mode {
  cursor: grab;
  border: 2px solid #10b981;
  background: rgba(16, 185, 129, 0.05);
  padding-left: 0.75rem;
}

.site-card.sort-mode:hover {
  border-color: #059669;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.25);
  background: rgba(16, 185, 129, 0.08);
}

.site-card.sort-mode:active {
  cursor: grabbing;
  transform: scale(0.98);
}

/* 拖拽手柄 */
.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  margin-right: 0.25rem;
  color: #10b981;
  cursor: grab;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.drag-handle:hover {
  background: rgba(16, 185, 129, 0.15);
}

.drag-handle:active {
  cursor: grabbing;
}

.drag-handle svg {
  opacity: 0.7;
}

/* 拖拽时的样式 - 由vue-draggable-plus自动添加 */
:global(.sortable-drag) {
  opacity: 0.95;
  transform: scale(1.03) rotate(1deg) !important;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  background: var(--color-card);
  border: 2px solid #10b981;
  border-radius: 12px;
}

:global(.sortable-drag) .drag-handle {
  cursor: grabbing;
}

/* 拖拽占位符样式 */
:global(.sortable-ghost) {
  opacity: 0.35;
  background: rgba(16, 185, 129, 0.08);
  border: 2px dashed #10b981;
  border-radius: 12px;
}

:global(.sortable-ghost) * {
  opacity: 0;
}

.site-icon-wrapper {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  border-radius: 8px;
  transition: transform 0.2s ease;
}

.site-card:hover .site-icon-wrapper {
  transform: scale(1.05);
}

.site-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
  transition: transform 0.2s ease;
}

.site-info {
  flex: 1;
  min-width: 0;
}

.site-name {
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.125rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s ease;
}

.site-card:hover .site-name {
  color: var(--color-primary);
}

.site-desc {
  font-size: 0.75rem;
  color: var(--color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pinned-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 0.75rem;
  opacity: 0.6;
}

.select-checkbox {
  margin-right: 0.75rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.select-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
  cursor: pointer;
  transition: transform 0.15s ease;
}

.select-checkbox input[type="checkbox"]:hover {
  transform: scale(1.1);
}

.site-card.selected {
  border-color: var(--color-primary);
  background: rgba(14, 165, 233, 0.08);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
}

@media (max-width: 640px) {
  .site-card {
    padding: 0.875rem 1rem;
  }

  .site-card.sort-mode {
    padding-left: 0.5rem;
  }

  .site-icon-wrapper {
    width: 32px;
    height: 32px;
  }

  .site-icon {
    width: 20px;
    height: 20px;
  }

  .drag-handle {
    padding: 0.375rem;
  }

  .select-checkbox input[type="checkbox"] {
    width: 16px;
    height: 16px;
  }
}
</style>