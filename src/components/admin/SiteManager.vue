<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useDataStore } from '../../stores/data'
import { extractDomain } from '../../utils/faviconService'

const dataStore = useDataStore()

const editingId = ref(null)
const formData = ref({
  title: '',
  url: '',
  description: '',
  categoryId: '',
  pinned: false,
  icon: ''
})
const iconPreview = ref('')
const isFetchingIcon = ref(false)
const autoFetchIcon = ref(true)

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
    pinned: false,
    icon: ''
  }
  iconPreview.value = ''
  autoFetchIcon.value = true
}

const startEdit = (link) => {
  editingId.value = link.id
  formData.value = {
    title: link.title,
    url: link.url,
    description: link.description || '',
    categoryId: link.categoryId,
    pinned: link.pinned || false,
    icon: ''
  }
  iconPreview.value = dataStore.getLinkIcon(link)
  autoFetchIcon.value = false
}

const handleFetchIcon = async () => {
  if (!formData.value.url) return
  
  isFetchingIcon.value = true
  try {
    const domain = extractDomain(formData.value.url)
    const iconUrl = dataStore.fetchIconForDomain(domain)
    formData.value.icon = iconUrl
    iconPreview.value = iconUrl
    dataStore.setDomainIcon(domain, iconUrl)
    ElMessage.success('图标获取成功')
  } catch (e) {
    console.error('Failed to fetch icon:', e)
    ElMessage.error('图标获取失败')
  } finally {
    isFetchingIcon.value = false
  }
}

watch(() => formData.value.url, (newUrl) => {
  if (newUrl && autoFetchIcon.value && !editingId.value) {
    setTimeout(() => {
      if (formData.value.url === newUrl) {
        handleFetchIcon()
      }
    }, 500)
  }
})

const handleFileUpload = (options) => {
  const { file } = options
  
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']
  if (!validTypes.includes(file.type)) {
    ElMessage.error('请上传 PNG、JPG、SVG 或 ICO 格式的图标')
    return
  }
  
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error('图标文件大小不能超过 2MB')
    return
  }
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const base64String = e.target?.result
    formData.value.icon = base64String
    iconPreview.value = base64String
    if (formData.value.url) {
      const domain = extractDomain(formData.value.url)
      dataStore.setDomainIcon(domain, base64String)
    }
    ElMessage.success('图标上传成功')
  }
  reader.onerror = () => {
    ElMessage.error('读取图标文件失败')
  }
  reader.readAsDataURL(file)
}

const cancelEdit = () => {
  editingId.value = null
}

const checkDuplicateLink = (url, categoryId, excludeId = null) => {
  let processedUrl = url
  if (processedUrl && !processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
    processedUrl = 'https://' + processedUrl
  }

  const sameCategoryDuplicate = links.value.some(link => 
    link.id !== excludeId && 
    link.categoryId === categoryId && 
    link.url === processedUrl
  )

  if (sameCategoryDuplicate) {
    return { duplicate: true, message: '当前分类中已存在相同链接' }
  }

  const otherCategoryDuplicate = links.value.some(link => 
    link.id !== excludeId && 
    link.categoryId !== categoryId && 
    link.url === processedUrl
  )

  if (otherCategoryDuplicate) {
    return { duplicate: true, message: '该链接已在其他分类中添加过', otherCategory: true }
  }

  return { duplicate: false }
}

const saveLink = async () => {
  if (!formData.value.title.trim() || !formData.value.url.trim()) {
    ElMessage.error('请填写网站名称和地址')
    return
  }

  const duplicateCheck = checkDuplicateLink(formData.value.url, formData.value.categoryId, editingId.value)
  
  if (duplicateCheck.duplicate) {
    if (duplicateCheck.otherCategory) {
      try {
        await ElMessageBox.confirm(
          `${duplicateCheck.message}，确定要在当前分类中再次添加吗？`,
          '确认添加',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        proceedSave()
      } catch {
        // 用户取消
      }
    } else {
      ElMessage.error(duplicateCheck.message)
    }
  } else {
    proceedSave()
  }
}

const proceedSave = () => {
  if (formData.value.icon && formData.value.url) {
    const domain = extractDomain(formData.value.url)
    dataStore.setDomainIcon(domain, formData.value.icon)
  }

  if (isEditing.value) {
    dataStore.updateLink({
      id: editingId.value,
      ...formData.value
    })
    ElMessage.success('网站更新成功')
  } else {
    dataStore.addLink(formData.value)
    ElMessage.success('网站添加成功')
  }
  cancelEdit()
}

const deleteLink = async (id) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个网站吗？',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    dataStore.deleteLink(id)
    ElMessage.success('网站删除成功')
  } catch {
    // 用户取消
  }
}

const togglePin = (id) => {
  dataStore.togglePin(id)
  const link = links.value.find(l => l.id === id)
  ElMessage.success(link?.pinned ? '网站已置顶' : '已取消置顶')
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
      <el-button type="primary" @click="startAdd" v-if="!isEditing">
        + 添加网站
      </el-button>
    </div>

    <!-- Add/Edit Form -->
    <el-card v-if="isEditing || editingId === null" class="form-card" shadow="never">
      <el-form label-position="top">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="网站名称" required>
              <el-input 
                v-model="formData.title" 
                placeholder="输入网站名称"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="网站地址" required>
              <el-input 
                v-model="formData.url" 
                placeholder="https://example.com"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="所属分类">
              <el-select v-model="formData.categoryId" placeholder="选择分类" style="width: 100%">
                <el-option 
                  v-for="cat in categories" 
                  :key="cat.id" 
                  :label="`${cat.icon} ${cat.name}`"
                  :value="cat.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="网站描述">
              <el-input 
                v-model="formData.description" 
                placeholder="简短描述（可选）"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- Icon Section -->
        <el-form-item label="网站图标">
          <div class="icon-section">
            <div class="icon-preview">
              <img v-if="iconPreview" :src="iconPreview" alt="图标预览" />
              <div v-else class="icon-placeholder">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </div>
            </div>
            <div class="icon-controls">
              <el-input 
                v-model="formData.icon"
                placeholder="图标URL..."
                size="small"
              />
              <div class="icon-buttons">
                <el-button 
                  size="small"
                  @click="handleFetchIcon"
                  :disabled="!formData.url || isFetchingIcon"
                  :loading="isFetchingIcon"
                >
                  🪄 获取
                </el-button>
                <el-upload
                  :show-file-list="false"
                  :before-upload="() => false"
                  :on-change="handleFileUpload"
                  accept=".png,.jpg,.jpeg,.svg,.ico"
                >
                  <el-button size="small">📤 上传</el-button>
                </el-upload>
              </div>
            </div>
          </div>
          <div class="icon-options">
            <el-checkbox v-model="autoFetchIcon">输入链接时自动获取图标</el-checkbox>
            <span class="icon-hint">支持 PNG, JPG, SVG, ICO</span>
          </div>
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="formData.pinned">📌 置顶显示</el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button @click="cancelEdit">取消</el-button>
          <el-button type="primary" @click="saveLink">
            {{ isEditing ? '保存' : '添加' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Site List -->
    <div class="site-list">
      <el-card 
        v-for="link in links" 
        :key="link.id" 
        class="site-item"
        :class="{ pinned: link.pinned }"
        shadow="never"
      >
        <div class="site-info">
          <span class="site-title">{{ link.title }}</span>
          <span class="site-url">{{ link.url }}</span>
          <el-tag size="small" type="info">{{ getCategoryName(link.categoryId) }}</el-tag>
        </div>
        <div class="site-actions">
          <el-button 
            :type="link.pinned ? 'primary' : 'default'"
            size="small"
            @click="togglePin(link.id)"
            :title="link.pinned ? '取消置顶' : '置顶'"
          >
            📌
          </el-button>
          <el-button size="small" @click="startEdit(link)">✏️</el-button>
          <el-button size="small" type="danger" @click="deleteLink(link.id)">🗑️</el-button>
        </div>
      </el-card>
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
  margin-bottom: 1.5rem;
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

.site-actions {
  display: flex;
  gap: 0.5rem;
}

/* Icon Section Styles */
.icon-section {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.icon-preview {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.icon-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 4px;
}

.icon-placeholder {
  color: var(--color-secondary);
}

.icon-controls {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.icon-buttons {
  display: flex;
  gap: 0.5rem;
}

.icon-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}

.icon-hint {
  font-size: 0.75rem;
  color: var(--color-secondary);
}

@media (max-width: 768px) {
  .site-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .icon-section {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* 调整复选框对号位置 */
:deep(.el-checkbox__inner::after) {
  top: 4px !important;
  left: 7px !important;
}
</style>
