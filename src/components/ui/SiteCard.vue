<script setup>
import { computed } from 'vue'
import { useDataStore } from '../../stores/data'
import { getDefaultIcon } from '../../utils/constants'

const props = defineProps({
  site: {
    type: Object,
    required: true
  },
  onDragStart: {
    type: Function,
    default: () => {}
  },
  onDragOver: {
    type: Function,
    default: () => {}
  },
  onDrop: {
    type: Function,
    default: () => {}
  },
  onDragEnd: {
    type: Function,
    default: () => {}
  }
})

const dataStore = useDataStore()

const siteIcon = computed(() => {
  return dataStore.getLinkIcon(props.site)
})

const isSelected = computed(() => {
  return dataStore.selectedLinks.includes(props.site.id)
})

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
    if (dataStore.batchEditMode || dataStore.sortMode) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  const handleDragStart = (event) => {
    // 确保event.target是正确的元素
    const target = event.currentTarget
    event.dataTransfer.setData('text/plain', props.site.id)
    event.dataTransfer.effectAllowed = 'move'
    // 为拖拽元素添加视觉效果
    target.classList.add('dragging')
    props.onDragStart(event, props.site.id)
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    // 为目标元素添加视觉效果
    const target = event.currentTarget
    target.classList.add('drag-over')
    props.onDragOver(event, props.site.id)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    // 移除视觉效果
    const target = event.currentTarget
    target.classList.remove('drag-over')
    document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'))
    props.onDrop(event, props.site.id)
  }

  const handleDragEnd = () => {
    // 移除所有视觉效果
    document.querySelectorAll('.dragging, .drag-over').forEach(el => {
      el.classList.remove('dragging', 'drag-over')
    })
    props.onDragEnd()
  }
</script>

<template>
  <a
    :href="dataStore.sortMode || dataStore.batchEditMode ? '#' : site.url"
    :target="dataStore.sortMode || dataStore.batchEditMode ? '_self' : '_blank'"
    rel="noopener noreferrer"
    class="site-card"
    :class="{ 'selected': isSelected, 'sort-mode': dataStore.sortMode }"
    @click="handleClick"
    :draggable="dataStore.sortMode"
    @dragstart="dataStore.sortMode ? handleDragStart : undefined"
    @dragover.prevent="dataStore.sortMode ? handleDragOver : undefined"
    @drop.prevent="dataStore.sortMode ? handleDrop : undefined"
    @dragend="dataStore.sortMode ? handleDragEnd : undefined"
  >
    <div v-if="dataStore.batchEditMode" class="select-checkbox">
      <input
        type="checkbox"
        :checked="isSelected"
        @click="handleSelect"
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
    <div v-if="site.pinned" class="pinned-badge">📌</div>
    <div v-if="dataStore.sortMode" class="sort-indicator">↕️</div>
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
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.site-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
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
}

.site-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.site-icon-placeholder {
  font-size: 1.125rem;
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

.sort-indicator {
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
}

.site-card.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.site-card.sort-mode {
  cursor: move;
  border-color: var(--color-border);
}

.site-card.dragging {
  opacity: 0.5;
  transform: rotate(2deg);
}

.site-card.drag-over {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.2);
}

@media (max-width: 640px) {
  .site-card {
    padding: 0.875rem 1rem;
  }

  .site-icon-wrapper {
    width: 32px;
    height: 32px;
  }

  .site-icon {
    width: 20px;
    height: 20px;
  }

  .select-checkbox input[type="checkbox"] {
    width: 16px;
    height: 16px;
  }
}
</style>
