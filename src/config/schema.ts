import { z } from 'zod';

/**
 * 配置 Schema —— 在加载期对静态 JSON 做运行时校验，
 * 避免字段拼写错误或类型不符在运行时静默失败。
 */

export const subCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().optional(),
  order: z.number().optional(),
});

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  hidden: z.boolean().optional(),
  order: z.number().optional(),
  subCategories: z.array(subCategorySchema).optional(),
});

export const linkSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  categoryId: z.string(),
  subCategoryId: z.string().optional(),
  icon: z.string().optional(),
  pinned: z.boolean().optional(),
  pinnedOrder: z.number().optional(),
  order: z.number().optional(),
  hidden: z.boolean().optional(),
  description: z.string().optional(),
  createdAt: z.number().optional(),
});

export const searchSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  enabled: z.boolean(),
  icon: z.string().optional(),
  createdAt: z.number().optional(),
});

export const searchConfigSchema = z.object({
  selectedSourceId: z.string(),
  externalSources: z.array(searchSourceSchema),
});

/** 导航页背景配置：default=弥散光斑（默认）；solid/gradient/image 自定义 */
export const backgroundSchema = z.object({
  type: z.enum(['default', 'solid', 'gradient', 'image']).default('default'),
  /** solid=十六进制色；gradient=完整 CSS 渐变字符串；image=图片 URL */
  value: z.string().optional(),
  /** 仅 image 生效：cover / contain / repeat */
  fit: z.enum(['cover', 'contain', 'repeat']).default('cover'),
  /** 是否显示弥散光斑层（default 类型下默认 true） */
  showBlobs: z.boolean().default(true),
});

export const siteSettingsSchema = z.object({
  accentColor: z.string().optional(),
  background: backgroundSchema.optional(),
});

export type BackgroundConfig = z.infer<typeof backgroundSchema>;

export const categoriesSchema = z.array(categorySchema);
export const linksSchema = z.array(linkSchema);

// 由 schema 派生的类型，单一事实来源，避免与手写接口漂移
export type SubCategory = z.infer<typeof subCategorySchema>;
export type Category = z.infer<typeof categorySchema>;
export type Link = z.infer<typeof linkSchema>;
export type SearchSource = z.infer<typeof searchSourceSchema>;
export type SearchConfig = z.infer<typeof searchConfigSchema>;
export type SiteSettings = z.infer<typeof siteSettingsSchema>;
