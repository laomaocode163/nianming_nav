<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import { useAdminStore } from '../../stores/admin';
  import { useSettingsStore } from '../../stores/settings';
  import { showToast } from '../../composables/useToast';
  import { handleAdminError } from '../../composables/useAdminToast';
  import { ACCENT_PRESETS, hexToRgbString, rgbStringToHex } from '../../utils/color';
  import { Palette, Search, ShieldCheck } from 'lucide-vue-next';
  import AdminSearch from './AdminSearch.vue';
  import IntegrityCheck from './IntegrityCheck.vue';
  import '../../components/admin/admin.css';

  const adminStore = useAdminStore();
  const settingsStore = useSettingsStore();

  type Tab = 'appearance' | 'search' | 'integrity';
  const tab = ref<Tab>('appearance');
  const tabs: { key: Tab; label: string; icon: unknown }[] = [
    { key: 'appearance', label: '外观', icon: Palette },
    { key: 'search', label: '搜索源', icon: Search },
    { key: 'integrity', label: '数据检查', icon: ShieldCheck },
  ];

  /* ---------- 外观：主题色 ---------- */
  const DEFAULT_HEX = '#0EA5E9';
  const hex = ref(rgbStringToHex(adminStore.settings.accentColor));
  const savedRgb = ref(adminStore.settings.accentColor ?? '');
  const dirty = computed(() => hexToRgbString(hex.value) !== savedRgb.value);

  const applyPreview = (value: string): void => {
    settingsStore.settings.accentColor = hexToRgbString(value);
  };
  const onInput = (value: string): void => {
    hex.value = value;
    applyPreview(value);
  };
  const selectPreset = (value: string): void => onInput(value);
  const restoreDefault = (): void => onInput(DEFAULT_HEX);
  const save = async (): Promise<void> => {
    try {
      await adminStore.saveSettings({ accentColor: hexToRgbString(hex.value) });
      savedRgb.value = hexToRgbString(hex.value);
      showToast('已保存主题色');
    } catch (e) {
      handleAdminError(e, '保存失败');
    }
  };
  watch(
    () => adminStore.settings.accentColor,
    (v) => {
      if (!dirty.value) hex.value = rgbStringToHex(v);
    }
  );

  /* ---------- 数据检查 ---------- */
  const checkShow = ref(false);
  const openCheck = (): void => {
    checkShow.value = true;
  };
</script>

<template>
  <div class="adm-page">
    <div class="adm-page__head">
      <div>
        <h1 class="adm-page__title">设置</h1>
        <p class="adm-page__subtitle">站点外观、搜索引擎与数据完整性配置</p>
      </div>
    </div>

    <div class="adm-tabs">
      <button
        v-for="t in tabs"
        :key="t.key"
        class="adm-tab"
        :class="{ active: tab === t.key }"
        @click="tab = t.key"
      >
        <component :is="t.icon" :size="16" :stroke-width="1.6" />
        {{ t.label }}
      </button>
    </div>

    <div v-show="tab === 'appearance'">
      <div class="adm-toolbar">
        <div class="admin-preview" :style="{ background: hex }">
          <Palette :size="18" :stroke-width="1.6" />
          <span>主色预览</span>
        </div>
        <span class="adm-toolbar__spacer"></span>
        <span class="adm-toolbar__count">RGB：{{ hexToRgbString(hex) }}</span>
      </div>
      <div class="admin-card">
        <p class="admin-section-title">选择主色</p>
        <div class="admin-color-row">
          <input
            class="admin-color-input"
            type="color"
            :value="hex"
            aria-label="选择主色"
            @input="onInput(($event.target as HTMLInputElement).value)"
          />
          <input
            class="admin-input admin-hex-input"
            type="text"
            :value="hex"
            aria-label="十六进制颜色值"
            @change="onInput(($event.target as HTMLInputElement).value)"
          />
        </div>
        <p class="admin-section-title">预设色板</p>
        <div class="admin-swatches">
          <button
            v-for="c in ACCENT_PRESETS"
            :key="c"
            class="admin-swatch"
            :class="{ active: hex.toLowerCase() === c.toLowerCase() }"
            :style="{ background: c }"
            :aria-label="`选择 ${c}`"
            @click="selectPreset(c)"
          ></button>
        </div>
        <div class="admin-modal-actions">
          <button class="admin-btn admin-btn-ghost" :disabled="!dirty" @click="restoreDefault">
            恢复默认
          </button>
          <button class="admin-btn admin-btn-primary" :disabled="!dirty" @click="save">
            保存主题色
          </button>
        </div>
      </div>
      <p class="admin-hint">改动会实时预览，保存后写入 <code>settings.json</code> 并应用到前台。</p>
    </div>

    <div v-show="tab === 'search'">
      <AdminSearch />
    </div>

    <div v-show="tab === 'integrity'">
      <div class="admin-card">
        <p class="admin-section-title">数据完整性</p>
        <p class="adm-muted" style="font-size: 0.875rem; margin: 0 0 1rem">
          检查链接与分类的引用完整性（如悬空的分类 / 子分类引用、重复 ID 等），确保前台渲染正常。
        </p>
        <button class="admin-btn admin-btn-primary" @click="openCheck">
          <ShieldCheck :size="16" :stroke-width="1.6" /> 运行数据检查
        </button>
      </div>
    </div>

    <IntegrityCheck :show="checkShow" @close="checkShow = false" />
  </div>
</template>

<style scoped>
  .adm-tabs {
    display: flex;
    gap: 0.4rem;
    margin-bottom: 1.25rem;
    border-bottom: 1px solid var(--color-border);
    flex-wrap: wrap;
  }
  .adm-tab {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.65rem 1rem;
    border: none;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: var(--color-text-secondary);
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    margin-bottom: -1px;
    transition:
      color var(--transition-fast),
      border-color var(--transition-fast);
    font-family: inherit;
  }
  .adm-tab:hover {
    color: var(--color-primary);
  }
  .adm-tab.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
  }
  .admin-preview {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.8rem;
    border-radius: 0.5rem;
    color: #fff;
    font-size: 0.8125rem;
    font-weight: 600;
  }
  .admin-card {
    margin-top: 0.25rem;
    padding: 1.25rem;
    border: 1px solid var(--color-border);
    border-radius: 0.75rem;
    background: var(--color-card);
  }
  .admin-color-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }
  .admin-color-input {
    width: 48px;
    height: 40px;
    padding: 0;
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    background: none;
    cursor: pointer;
  }
  .admin-hex-input {
    flex: 1;
    max-width: 160px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    text-transform: uppercase;
  }
  .admin-swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
  }
  .admin-swatch {
    width: 32px;
    height: 32px;
    border-radius: 0.5rem;
    border: 2px solid transparent;
    cursor: pointer;
    transition: transform 0.12s ease;
  }
  .admin-swatch:hover {
    transform: scale(1.08);
  }
  .admin-swatch.active {
    border-color: var(--color-text);
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.6) inset;
  }
  .admin-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
</style>
