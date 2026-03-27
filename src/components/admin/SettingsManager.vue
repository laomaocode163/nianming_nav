<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '../../stores/data'

const dataStore = useDataStore()

const settings = computed(() => dataStore.settings)

const updateSettings = (key, value) => {
  dataStore.updateSettings({ [key]: value })
}

const exportData = () => {
  const data = dataStore.exportData()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `nianming_nav_${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const importInput = ref(null)

const triggerImport = () => {
  importInput.value?.click()
}

const handleImport = (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      dataStore.importData(data)
      alert('导入成功！')
    } catch (err) {
      alert('导入失败：文件格式不正确')
    }
  }
  reader.readAsText(file)
  event.target.value = ''
}

const resetData = () => {
  if (confirm('确定要重置所有数据吗？此操作不可恢复！')) {
    dataStore.resetData()
    alert('数据已重置！')
  }
}
</script>

<template>
  <div class="settings-manager">
    <div class="manager-header">
      <h3>系统设置</h3>
    </div>

    <!-- Site Settings -->
    <div class="settings-section">
      <h4 class="section-title">站点设置</h4>
      
      <div class="setting-item">
        <label>网站标题</label>
        <input 
          :value="settings.title" 
          @input="updateSettings('title', $event.target.value)"
          type="text" 
          class="form-input"
        />
      </div>

      <div class="setting-item">
        <label>导航标题</label>
        <input 
          :value="settings.navTitle" 
          @input="updateSettings('navTitle', $event.target.value)"
          type="text" 
          class="form-input"
        />
      </div>

      <div class="setting-item">
        <label>卡片样式</label>
        <select 
          :value="settings.cardStyle" 
          @change="updateSettings('cardStyle', $event.target.value)"
          class="form-input"
        >
          <option value="detailed">详细模式</option>
          <option value="simple">简洁模式</option>
        </select>
      </div>

      <div class="setting-item">
        <label>站点模式</label>
        <select 
          :value="settings.siteMode" 
          @change="updateSettings('siteMode', $event.target.value)"
          class="form-input"
        >
          <option value="personal">个人模式</option>
          <option value="webmaster">站长模式（公开只读）</option>
        </select>
      </div>
    </div>

    <!-- Data Management -->
    <div class="settings-section">
      <h4 class="section-title">数据管理</h4>
      
      <div class="data-actions">
        <button class="btn-secondary" @click="exportData">
          📤 导出数据
        </button>
        <button class="btn-secondary" @click="triggerImport">
          📥 导入数据
        </button>
        <input 
          ref="importInput" 
          type="file" 
          accept=".json"
          style="display: none"
          @change="handleImport"
        />
        <button class="btn-danger" @click="resetData">
          🗑️ 重置数据
        </button>
      </div>
    </div>

    <!-- Statistics -->
    <div class="settings-section">
      <h4 class="section-title">数据统计</h4>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ dataStore.categories.length }}</div>
          <div class="stat-label">分类数量</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ dataStore.links.length }}</div>
          <div class="stat-label">网站数量</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ dataStore.links.filter(l => l.pinned).length }}</div>
          <div class="stat-label">置顶网站</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-manager {
  padding: 1rem;
}

.manager-header {
  margin-bottom: 1.5rem;
}

.manager-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
}

.settings-section {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.setting-item {
  margin-bottom: 1rem;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-item label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  max-width: 400px;
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

.data-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.btn-secondary {
  padding: 0.75rem 1.25rem;
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

.btn-danger {
  padding: 0.75rem 1.25rem;
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-danger:hover {
  background: #fecaca;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-card {
  text-align: center;
  padding: 1.25rem;
  background: var(--color-bg);
  border-radius: 10px;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--color-secondary);
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
