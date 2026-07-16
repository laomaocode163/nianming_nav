/**
 * 配置导入/导出（备份与恢复）的纯函数工具。
 * 合并逻辑放在此处而非 userPrefs store 内，避免 userPrefs 反向依赖 dataStore 形成循环。
 */
import type { UserPrefsState } from '../stores/userPrefs';
import type { SiteConfig } from '../types';

export interface ExportPayload {
  version: 1;
  exportedAt: string;
  prefs: UserPrefsState;
  siteConfig: SiteConfig;
}

/** 组装完整导出 payload：用户偏好 + 站点配置（分类/链接/搜索/设置） */
export const buildExportPayload = (
  prefs: UserPrefsState,
  siteConfig: SiteConfig
): ExportPayload => ({
  version: 1,
  exportedAt: new Date().toISOString(),
  prefs,
  siteConfig,
});

export interface ParsedImport {
  prefs: Partial<UserPrefsState>;
  siteConfig?: SiteConfig;
}

/**
 * 解析导入文件，兼容两种格式：
 * - 新格式：{ version, prefs, siteConfig }
 * - 旧格式：直接含 favorites/recentVisits/theme/selectedSearchSourceId（视为仅偏好）
 * 解析失败（非法 JSON）会向上抛出，由调用方提示。
 */
export const parseImportPayload = (text: string): ParsedImport => {
  const parsed = JSON.parse(text) as Record<string, unknown>;
  const prefsRaw = ('prefs' in parsed ? parsed.prefs : parsed) as Partial<UserPrefsState>;
  const siteConfigRaw = ('siteConfig' in parsed ? parsed.siteConfig : undefined) as
    | SiteConfig
    | undefined;
  return { prefs: prefsRaw, siteConfig: siteConfigRaw };
};
