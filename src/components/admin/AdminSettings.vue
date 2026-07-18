<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import { useAdminStore } from '../../stores/admin';
  import { useSettingsStore } from '../../stores/settings';
  import { showToast } from '../../composables/useToast';
  import { handleAdminError } from '../../composables/useAdminToast';
  import { ACCENT_PRESETS, hexToRgbString, rgbStringToHex } from '../../utils/color';
  import { Palette } from 'lucide-vue-next';
  import '../../components/admin/admin.css';

  const adminStore = useAdminStore();
  const settingsStore = useSettingsStore();

  const DEFAULT_HEX = '#0EA5E9';
  const hex = ref(rgbStringToHex(adminStore.settings.accentColor));

  // 本地草稿与已保存值不同步时允许保存
  const savedRgb = ref(adminStore.settings.accentColor ?? '');
  const dirty = computed(() => hexToRgbString(hex.value) !== savedRgb.value);

  const applyPreview = (value: string): void => {
    // 直接写入 settings store，触发其 watch -> apply() 实时改变全站主色
    settingsStore.settings.accentColor = hexToRgbString(value);
  };

  const onInput = (value: string): void => {
    hex.value = value;
    applyPreview(value);
  };

  const selectPreset = (value: string): void => {
    onInput(value);
  };

  const restoreDefault = (): void => {
    onInput(DEFAULT_HEX);
  };

  const save = async (): Promise<void> => {
    try {
      await adminStore.saveSettings({ accentColor: hexToRgbString(hex.value) });
      savedRgb.value = hexToRgbString(hex.value);
      showToast('已保存主题色');
    } catch (e) {
      handleAdminError(e, '保存失败');
    }
  };

  // 后台数据重载（如其它 Tab 改动）后同步本地草稿
  watch(
    () => adminStore.settings.accentColor,
    (v) => {
      if (!dirty.value) hex.value = rgbStringToHex(v);
    }
  );
</script>

<template>
  <section>
    <div class="admin-toolbar">
      <div class="admin-preview" :style="{ background: hex }">
        <Palette :size="18" :stroke-width="1.5" />
        <span>主色预览</span>
      </div>
      <span class="admin-spacer"></span>
      <span class="admin-count">RGB：{{ hexToRgbString(hex) }}</span>
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
  </section>
</template>

<style scoped>
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
    margin-top: 1rem;
    padding: 1.25rem;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 0.75rem;
    background: var(--color-surface, #fff);
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
    border: 1px solid var(--color-border, #e5e7eb);
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
    border-color: var(--color-text, #1f2937);
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.6) inset;
  }
  .admin-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
</style>
