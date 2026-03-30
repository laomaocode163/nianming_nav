<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useDataStore } from '../../stores/data'
import { CATEGORY_ICONS } from '../../utils/constants'

const dataStore = useDataStore()

const editingId = ref(null)
const formData = ref({
  name: '',
  icon: CATEGORY_ICONS[0]
})

const isEditing = computed(() => editingId.value !== null)

const categories = computed(() => dataStore.categories)

const startAdd = () => {
  editingId.value = null
  formData.value = {
    name: '',
    icon: CATEGORY_ICONS[0]
  }
}

const startEdit = (category) => {
  editingId.value = category.id
  formData.value = {
    name: category.name,
    icon: category.icon
  }
}

const cancelEdit = () => {
  editingId.value = null
}

const saveCategory = () => {
  if (!formData.value.name.trim()) {
    ElMessage.error('请输入分类名称')
    return
  }

  if (isEditing.value) {
    dataStore.updateCategory({
      id: editingId.value,
      ...formData.value
    })
    ElMessage.success('分类更新成功')
  } else {
    dataStore.addCategory(formData.value)
    ElMessage.success('分类添加成功')
  }
  cancelEdit()
}

const deleteCategory = async (id) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个分类吗？删除后该分类下的网站将移动到默认分类。',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    dataStore.deleteCategory(id)
    ElMessage.success('分类删除成功')
  } catch {
    // 用户取消
  }
}

const getCategoryCount = (categoryId) => {
  return dataStore.getLinksByCategory(categoryId).length
}
</script>

<template>
  <div class="category-manager">
    <div class="manager-header">
      <h3>分类管理</h3>
      <el-button type="primary" @click="startAdd" v-if="!isEditing">
        + 添加分类
      </el-button>
    </div>

    <!-- Add/Edit Form -->
    <el-card v-if="isEditing || editingId === null" class="form-card" shadow="never">
      <el-form label-position="top">
        <el-form-item label="分类名称" required>
          <el-input 
            v-model="formData.name" 
            placeholder="输入分类名称"
          />
        </el-form-item>

        <el-form-item label="分类图标">
          <el-radio-group v-model="formData.icon" class="icon-grid">
            <el-radio-button 
              v-for="icon in CATEGORY_ICONS" 
              :key="icon" 
              :value="icon"
            >
              {{ icon }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item>
          <el-button @click="cancelEdit">取消</el-button>
          <el-button type="primary" @click="saveCategory">
            {{ isEditing ? '保存' : '添加' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Category List -->
    <div class="category-list">
      <el-card 
        v-for="category in categories" 
        :key="category.id" 
        class="category-item"
        shadow="never"
      >
        <div class="category-info">
          <span class="category-icon">{{ category.icon }}</span>
          <span class="category-name">{{ category.name }}</span>
          <el-tag size="small" type="info">{{ getCategoryCount(category.id) }} 个网站</el-tag>
        </div>
        <div class="category-actions">
          <el-button size="small" @click="startEdit(category)">✏️</el-button>
          <el-button size="small" type="danger" @click="deleteCategory(category.id)">🗑️</el-button>
        </div>
      </el-card>
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
  margin-bottom: 1.5rem;
}

.icon-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.icon-grid :deep(.el-radio-button__inner) {
  padding: 0.5rem 0.75rem;
  font-size: 1.25rem;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.category-icon {
  font-size: 1.5rem;
}

.category-name {
  font-weight: 500;
  color: var(--color-text);
}

.category-actions {
  display: flex;
  gap: 0.5rem;
}
</style>
