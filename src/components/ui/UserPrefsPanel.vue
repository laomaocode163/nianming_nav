<script setup lang="ts">
  import { ref } from 'vue';
  import { useUserPrefsStore } from '../../stores/userPrefs';
  import { showToast } from '../../composables/useToast';
  import { X, Download, Upload, Star, Clock } from 'lucide-vue-next';

  const emit = defineEmits<{ (e: 'close'): void }>();

  const userPrefs = useUserPrefsStore();
  const fileInput = ref<HTMLInputElement | null>(null);

  const exportPrefs = (): void => {
    const blob = new Blob([userPrefs.exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nianming-nav-prefs-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('已导出偏好配置', 1500);
  };

  const triggerImport = (): void => {
    fileInput.value?.click();
  };

  const onFileChange = async (e: Event): Promise<void> => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      if (userPrefs.importData(text)) {
        showToast('已导入偏好配置', 1500);
      } else {
        showToast('导入失败：文件格式不正确', 2000);
      }
    } catch {
      showToast('导入失败：无法读取文件', 2000);
    } finally {
      input.value = '';
    }
  };

  const clearFavorites = (): void => {
    userPrefs.clearFavorites();
    showToast('已清空收藏', 1500);
  };

  const clearRecent = (): void => {
    userPrefs.clearRecent();
    showToast('已清空最近访问', 1500);
  };
</script>

<template>
  <div class="prefs-overlay" @click.self="emit('close')">
    <div class="prefs-modal" role="dialog" aria-modal="true" aria-label="我的偏好">
      <div class="prefs-header">
        <h3 class="prefs-title">我的偏好</h3>
        <button class="prefs-close" type="button" aria-label="关闭" @click="emit('close')">
          <X :size="18" :stroke-width="2.25" />
        </button>
      </div>

      <div class="prefs-stats">
        <div class="stat-card">
          <Star class="stat-icon" :size="18" :stroke-width="2" />
          <span class="stat-value">{{ userPrefs.state.favorites.length }}</span>
          <span class="stat-label">收藏</span>
        </div>
        <div class="stat-card">
          <Clock class="stat-icon" :size="18" :stroke-width="2" />
          <span class="stat-value">{{ userPrefs.state.recentVisits.length }}</span>
          <span class="stat-label">最近访问</span>
        </div>
      </div>

      <div class="prefs-section">
        <p class="prefs-section-title">备份与恢复</p>
        <div class="prefs-actions">
          <button class="prefs-action" type="button" @click="exportPrefs">
            <Download :size="16" :stroke-width="2" />
            <span>导出配置</span>
          </button>
          <button class="prefs-action" type="button" @click="triggerImport">
            <Upload :size="16" :stroke-width="2" />
            <span>导入配置</span>
          </button>
          <input
            ref="fileInput"
            type="file"
            accept="application/json,.json"
            class="prefs-file-input"
            @change="onFileChange"
          />
        </div>
      </div>

      <div class="prefs-section">
        <p class="prefs-section-title">数据管理</p>
        <div class="prefs-actions">
          <button class="prefs-action danger" type="button" @click="clearFavorites">
            <Star :size="16" :stroke-width="2" />
            <span>清空收藏</span>
          </button>
          <button class="prefs-action danger" type="button" @click="clearRecent">
            <Clock :size="16" :stroke-width="2" />
            <span>清空最近</span>
          </button>
        </div>
      </div>

      <p class="prefs-hint">偏好仅保存在本机浏览器，不会上传服务器。</p>
    </div>
  </div>
</template>

<style scoped>
  .prefs-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(4px);
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    animation: fadeIn 0.15s ease-out;
  }

  .prefs-modal {
    width: 100%;
    max-width: 420px;
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    padding: 1.25rem;
    animation: popIn 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .prefs-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .prefs-title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--color-text);
  }

  .prefs-close {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    color: var(--color-text-secondary);
    transition: all 150ms ease;
  }

  .prefs-close:hover {
    background: hsl(var(--hue-primary), 15%, 94%);
    color: var(--color-primary);
  }

  .dark .prefs-close:hover {
    background: hsl(var(--hue-primary), 20%, 20%);
  }

  .prefs-stats {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }

  .stat-card {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  .stat-icon {
    color: var(--color-primary);
    flex-shrink: 0;
  }

  .stat-value {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--color-text);
  }

  .stat-label {
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
  }

  .prefs-section {
    margin-bottom: 1rem;
  }

  .prefs-section-title {
    margin: 0 0 0.5rem;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  .prefs-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .prefs-action {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.875rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-card);
    color: var(--color-text);
    font-size: 0.875rem;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: all 150ms ease;
  }

  .prefs-action:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: hsl(var(--hue-primary), 12%, 96%);
  }

  .dark .prefs-action:hover {
    background: hsl(var(--hue-primary), 20%, 18%);
  }

  .prefs-action.danger:hover {
    border-color: #ef4444;
    color: #ef4444;
    background: rgba(239, 68, 68, 0.08);
  }

  .prefs-file-input {
    display: none;
  }

  .prefs-hint {
    margin: 0.5rem 0 0;
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    opacity: 0.7;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes popIn {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(8px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
</style>
