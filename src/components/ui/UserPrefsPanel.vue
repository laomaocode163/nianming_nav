<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useUserPrefsStore } from '../../stores/userPrefs';
  import { useUiStore } from '../../stores/ui';
  import { useDataStore } from '../../stores/data';
  import { useSettingsStore } from '../../stores/settings';
  import { adminApi } from '../../services/adminApi';
  import { showToast } from '../../composables/useToast';
  import { buildExportPayload, parseImportPayload } from '../../utils/configIo';
  import type { SearchConfig, SiteConfig } from '../../types';
  import { X, Download, Upload, Star, Clock, Info } from 'lucide-vue-next';

  const emit = defineEmits<{ (e: 'close'): void }>();

  const onKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') emit('close');
  };

  onMounted(() => window.addEventListener('keydown', onKeydown));
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));

  const userPrefs = useUserPrefsStore();
  const uiStore = useUiStore();
  const dataStore = useDataStore();
  const settingsStore = useSettingsStore();
  const fileInput = ref<HTMLInputElement | null>(null);

  const exportPrefs = (): void => {
    const payload = buildExportPayload(userPrefs.state, {
      categories: dataStore.categories,
      links: dataStore.links,
      searchConfig: dataStore.searchConfig as SearchConfig,
      settings: settingsStore.settings,
    });
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nianming-nav-config-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('已导出完整配置', 1500);
  };

  const triggerImport = (): void => {
    fileInput.value?.click();
  };

  /** 将导入的站点配置应用到运行时内存；DEV 模式额外写盘持久化 */
  const applyImportedSiteConfig = async (cfg: SiteConfig): Promise<void> => {
    dataStore.applySiteConfig({
      categories: cfg.categories,
      links: cfg.links,
      searchConfig: cfg.searchConfig,
    });
    if (cfg.settings) {
      Object.assign(settingsStore.settings, cfg.settings);
      settingsStore.apply();
    }
    if (import.meta.env.DEV) {
      try {
        await adminApi.restoreAll(cfg);
        showToast('已导入并保存到磁盘', 2000);
      } catch {
        showToast('已应用到当前会话（写盘失败）', 2000);
      }
    } else {
      showToast('站点配置已应用到当前会话', 2000);
    }
  };

  const onFileChange = async (e: Event): Promise<void> => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const { prefs, siteConfig } = parseImportPayload(text);
      if (userPrefs.importData(JSON.stringify(prefs))) {
        if (siteConfig) {
          await applyImportedSiteConfig(siteConfig);
        } else {
          showToast('已导入偏好配置', 1500);
        }
      } else {
        showToast('导入失败：文件格式不正确', 2000);
      }
    } catch {
      showToast('导入失败：文件无法解析', 2000);
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
          <Star class="stat-icon" :size="20" :stroke-width="1.5" />
          <div class="stat-body">
            <span class="stat-value">{{ userPrefs.state.favorites.length }}</span>
            <span class="stat-label">收藏</span>
          </div>
        </div>
        <div class="stat-card">
          <Clock class="stat-icon" :size="20" :stroke-width="1.5" />
          <div class="stat-body">
            <span class="stat-value">{{ userPrefs.state.recentVisits.length }}</span>
            <span class="stat-label">最近访问</span>
          </div>
        </div>
      </div>

      <div class="prefs-section">
        <p class="prefs-section-title">显示密度</p>
        <div class="density-toggle" role="radiogroup" aria-label="卡片显示密度">
          <button
            type="button"
            class="density-option"
            :class="{ active: uiStore.density === 'comfortable' }"
            role="radio"
            :aria-checked="uiStore.density === 'comfortable'"
            @click="uiStore.setDensity('comfortable')"
          >
            舒适
          </button>
          <button
            type="button"
            class="density-option"
            :class="{ active: uiStore.density === 'compact' }"
            role="radio"
            :aria-checked="uiStore.density === 'compact'"
            @click="uiStore.setDensity('compact')"
          >
            紧凑
          </button>
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

      <p class="prefs-hint">
        <Info :size="14" :stroke-width="2" />
        <span>偏好仅保存在本机浏览器，不会上传服务器。</span>
      </p>
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
    justify-content: flex-end;
    animation: fadeIn 0.15s ease-out;
  }

  .prefs-modal {
    width: 100%;
    max-width: 400px;
    height: 100dvh;
    overflow-y: auto;
    background: var(--color-card);
    border-left: 1px solid var(--color-border);
    border-radius: 0;
    box-shadow: var(--shadow-lg);
    padding: 1.5rem;
    animation: slideIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .prefs-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0 0 1.25rem;
    padding: 0 0 1rem;
    border-bottom: 1px solid var(--color-border);
  }

  .prefs-title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--color-text);
  }

  .prefs-close {
    flex-shrink: 0;
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    border-radius: 9px;
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
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    transition: all 150ms ease;
  }

  .stat-card:hover {
    border-color: var(--color-primary);
    background: hsl(var(--hue-primary), 12%, 96%);
  }

  .dark .stat-card:hover {
    background: hsl(var(--hue-primary), 20%, 18%);
  }

  .stat-icon {
    flex-shrink: 0;
    color: var(--color-text-secondary);
    transition: color 150ms ease;
  }

  .stat-card:hover .stat-icon {
    color: var(--color-primary);
  }

  .stat-body {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .stat-value {
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1;
    color: var(--color-text);
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
  }

  .prefs-section {
    margin-bottom: 1rem;
    padding: 1rem;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
  }

  .prefs-section-title {
    margin: 0 0 0.75rem;
    font-size: 0.6875rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--color-primary);
    text-transform: uppercase;
  }

  .prefs-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.625rem;
  }

  .prefs-action {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.875rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
    color: var(--color-text);
    font-size: 0.8125rem;
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
    border-color: var(--color-danger);
    color: var(--color-danger);
    background: rgba(239, 68, 68, 0.06);
  }

  .prefs-file-input {
    display: none;
  }

  .density-toggle {
    display: flex;
    gap: 0.5rem;
  }

  .density-option {
    flex: 1;
    padding: 0.5rem 0.875rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
    color: var(--color-text);
    font-size: 0.8125rem;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: all 150ms ease;
  }

  .density-option:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: hsl(var(--hue-primary), 12%, 96%);
  }

  .dark .density-option:hover {
    background: hsl(var(--hue-primary), 20%, 18%);
  }

  .density-option.active {
    border-color: var(--color-primary);
    color: #fff;
    background: var(--color-primary);
  }

  .prefs-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    margin: 1.25rem 0 0;
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    opacity: 0.8;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
</style>
