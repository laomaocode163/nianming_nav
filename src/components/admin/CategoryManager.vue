<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '../../stores/data'

const dataStore = useDataStore()

const editingId = ref(null)
const formData = ref({
  name: '',
  icon: ''
})

const isEditing = computed(() => editingId.value !== null)

const categories = computed(() => dataStore.categories)

const startAdd = () => {
  editingId.value = null
  formData.value = { name: '', icon: '📁' }
}

const startEdit = (category) => {
  editingId.value = category.id
  formData.value = { name: category.name, icon: category.icon }
}

const cancelEdit = () => {
  editingId.value = null
  formData.value = { name: '', icon: '' }
}

const saveCategory = () => {
  if (!formData.value.name.trim()) return

  if (isEditing.value) {
    dataStore.updateCategory({
      id: editingId.value,
      ...formData.value
    })
  } else {
    dataStore.addCategory(formData.value)
  }
  cancelEdit()
}

const deleteCategory = (id) => {
  if (confirm('确定要删除这个分类吗？该分类下的网站将移动到默认分类。')) {
    dataStore.deleteCategory(id)
  }
}

const iconOptions = ['📁', '⭐', '💻', '🎨', '📖', '🎮', '🤖', '🔧', '📱', '🌐', '💼', '🎵', '🎬', '📚', '🛒']
</script>

<template>
  <div class="category-manager">
    <div class="manager-header">
      <h3>分类管理</h3>
      <button class="btn-primary" @click="startAdd" v-if="!isEditing">
        + 添加分类
      </button>
    </div>

    <!-- Add/Edit Form -->
    <div v-if="isEditing || editingId === null" class="form-card">
      <div class="form-group">
        <label>分类名称</label>
        <input 
          v-model="formData.name" 
          type="text" 
          placeholder="输入分类名称"
          class="form-input"
        />
      </div>
      <div class="form-group">
        <label>分类图标</label>
        <div class="icon-selector">
          <button
            v-for="icon in iconOptions"
            :key="icon"
            class="icon-btn"
            :class="{ active: formData.icon === icon }"
            @click="formData.icon = icon"
          >
            {{ icon }}
          </button>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn-secondary" @click="cancelEdit">取消</button>
        <button class="btn-primary" @click="saveCategory">
          {{ isEditing ? '保存' : '添加' }}
        </button>
      </div>
    </div>

    <!-- Category List -->
    <div class="category-list">
      <div 
        v-for="category in categories" 
        :key="category.id" 
        class="category-item"
      >
        <div class="category-info">
          <span class="category-icon">{{ category.icon }}</span>
          <span class="category-name">{{ category.name }}</span>
          <span class="category-count">
            {{ dataStore.getLinksByCategory(category.id).length }} 个网站
          </span>
        </div>
        <div class="category-actions">
          <button class="btn-icon" @click="startEdit(category)">✏️</button>
          <button class="btn-icon btn-danger" @click="deleteCategory(category.id)">🗑️</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.category-manager {
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

.icon-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.icon-btn {
  width: 40px;
  height: 40px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg);
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  border-color: var(--color-primary);
}

.icon-btn.active {
  border-color: var(--color-primary);
  background: var(--color-primary);
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

.category-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 10px;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.category-icon {
  font-size: 1.5rem;
}

.category-name {
  font-weight: 500;
  color: var(--color-text);
}

.category-count {
  font-size: 0.75rem;
  color: var(--color-secondary);
  padding: 0.125rem 0.5rem;
  background: var(--color-bg);
  border-radius: 10px;
}

.category-actions {
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
}

.btn-icon:hover {
  background: var(--color-bg);
}

.btn-icon.btn-danger:hover {
  background: #fee2e2;
}
</style>
