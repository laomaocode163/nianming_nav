import { z } from 'zod'

/**
 * 配置 Schema —— 在加载期对静态 JSON 做运行时校验，
 * 避免字段拼写错误或类型不符在运行时静默失败。
 */

export const subCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().optional(),
  order: z.number().optional(),
})

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  hidden: z.boolean().optional(),
  order: z.number().optional(),
  subCategories: z.array(subCategorySchema).optional(),
})

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
})

export const searchSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  enabled: z.boolean(),
  icon: z.string().optional(),
  createdAt: z.number().optional(),
})

export const searchConfigSchema = z.object({
  mode: z.string().optional(),
  selectedSourceId: z.string(),
  externalSources: z.array(searchSourceSchema),
})

export const siteSettingsSchema = z.object({
  title: z.string().optional(),
  navTitle: z.string().optional(),
  favicon: z.string().optional(),
  cardStyle: z.string().optional(),
  siteMode: z.string().optional(),
  accentColor: z.string().optional(),
  grayScale: z.string().optional(),
  closeOnBackdrop: z.boolean().optional(),
  backgroundImage: z.string().optional(),
  backgroundImageEnabled: z.boolean().optional(),
  backgroundMotion: z.boolean().optional(),
})

export const categoriesSchema = z.array(categorySchema)
export const linksSchema = z.array(linkSchema)

export const musicSchema = z.array(
  z.object({
    name: z.string(),
    keyword: z.string(),
    kuwoId: z.string().optional(),
    neteaseId: z.string().optional(),
  }),
)
