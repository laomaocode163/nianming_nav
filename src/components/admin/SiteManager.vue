<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '../../stores/data'

const dataStore = useDataStore()

const editingId = ref(null)
const formData = ref({
  title: '',
  url: '',
  description: '',
  categoryId: '',
  pinned: false
})

const isEditing = computed(() => editingId.value !== null)

const links = computed(() => dataStore.links)
const categories = computed(() => dataStore.categories)

const startAdd = () => {
  editingId.value = null
  formData.value = {
    title: '',
    url: '',
    description: '',
    categoryId: categories.value[0]?.id || '',
    pinned: false
  }
}

const startEdit = (link) => {
  editingId.value = link.id
  formData.value = {
    title: link.title,
    url: link.url,
    description: link.description || '',
    categoryId: link.categoryId,
    pinned: link.pinned || false
  }
}

const cancelEdit = () => {
  editingId.value = null
}

const saveLink = () => {
  if (!formData.value.title.trim() || !formData.value.url.trim()) return

  if (isEditing.value) {
    dataStore.updateLink({
      id: editingId.value,
      ...formData.value
    })
  } else {
    dataStore.addLink(formData.value)
  }
  cancelEdit()
}

const deleteLink = (id) => {
  if (confirm('确定要删除这个网站吗？')) {
    dataStore.deleteLink(id)
  }
}

const togglePin = (id) => {
  dataStore.togglePin(id)
}

const getCategoryName = (categoryId) => {
  const category = categories.value.find(c => c.id === categoryId)
  return category?.name || '未分类'
}
</script>

<template>
  <div class="site-manager">
    <div class="manager-header">
      <h3>网站管理</h3>
      <button class="btn-primary" @click="startAdd" v-if="!isEditing">
        + 添加网站
      </button>
    </div>

    <!-- Add/Edit Form -->
    <div v-if="isEditing || editingId === null" class="form-card">
      <div class="form-row">
        <div class="form-group">
          <label>网站名称 *</label>
          <input 
            v-model="formData.title" 
            type="text" 
            placeholder="输入网站名称"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label>网站地址 *</label>
          <input 
            v-model="formData.url" 
            type="text" 
            placeholder="https://example.com"
            class="form-input"
          />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>所属分类</label>
          <select v-model="formData.categoryId" class="form-input">
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.icon }} {{ cat.name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>网站描述</label>
          <input 
            v-model="formData.description" 
            type="text" 
            placeholder="简短描述（可选）"
            class="form-input"
          />
        </div>
      </div>
      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" v-model="formData.pinned" />
          <span>📌 置顶显示</span>
        </label>
      </div>
      <div class="form-actions">
        <button class="btn-secondary" @click="cancelEdit">取消</button>
        <button class="btn-primary" @click="saveLink">
          {{ isEditing ? '保存' : '添加' }}
        </button>
      </div>
    </div>

    <!-- Site List -->
    <div class="site-list">
      <div 
        v-for="link in links" 
        :key="link.id" 
        class="site-item"
        :class="{ pinned: link.pinned }"
      >
        <div class="site-info">
          <span class="site-title">{{ link.title }}</span>
          <span class="site-url">{{ link.url }}</span>
          <span class="site-category">{{ getCategoryName(link.categoryId) }}</span>
        </div>
        <div class="site-actions">
          <button 
            class="btn-icon" 
            :class="{ active: link.pinned }"
            @click="togglePin(link.id)"
            :title="link.pinned ? '取消置顶' : '置顶'"
          >
            📌
          </button>
          <button class="btn-icon" @click="startEdit(link)">✏️</button>
          <button class="btn-icon btn-danger" @click="deleteLink(link.id)">🗑️</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.site-manager {
  padding: 1rem;
}

.manager-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.manager-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
}

.form-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.9375rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  border-color: var(--color-primary);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-label input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1rem;
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

.site-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.site-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.site-item.pinned {
  border-color: var(--color-primary);
  background: rgba(14, 165, 233, 0.05);
}

.site-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

.site-title {
  font-weight: 500;
  color: var(--color-text);
  min-width: 120px;
}

.site-url {
  color: var(--color-secondary);
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.site-category {
  font-size: 0.75rem;
  color: var(--color-secondary);
  padding: 0.125rem 0.5rem;
  background: var(--color-bg);
  border-radius: 10px;
}

.site-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1rem;
  border-radius: 8px;
  transition: background-color 0.2s ease;
  opacity: 0.6;
}

.btn-icon:hover {
  background: var(--color-bg);
  opacity: 1;
}

.btn-icon.active {
  opacity: 1;
}

.btn-icon.btn-danger:hover {
  background: #fee2e2;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .site-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>
