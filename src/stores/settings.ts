/**
 * 设置 store
 * 将 settings.json 中定义的运行时设置真正应用到界面：
 * - accentColor -> 主色 HSL CSS 变量（让配置闭环生效）
 * - backgroundImage / backgroundImageEnabled / backgroundMotion -> 应用背景
 * - cardStyle -> 写到 documentElement 的 data 属性，供 CSS 定向样式
 */
import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import { loadSiteConfig } from '../config/loadConfig'
import type { SiteSettings } from '../types'

const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  const d = max - min
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1))
    switch (max) {
      case rn:
        h = ((gn - bn) / d) % 6
        break
      case gn:
        h = (bn - rn) / d + 2
        break
      default:
        h = (rn - gn) / d + 4
    }
    h *= 60
    if (h < 0) h += 360
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export const useSettingsStore = defineStore('settings', () => {
  const ready = ref(false)
  const settings = reactive({}) as SiteSettings

  const init = async (): Promise<void> => {
    if (ready.value) return
    const config = await loadSiteConfig()
    Object.assign(settings, config.settings)
    ready.value = true
  }

  const apply = (): void => {
    if (typeof document === 'undefined') return
    const root = document.documentElement

    if (settings.accentColor) {
      const parts = settings.accentColor.split(/\s+/).map(Number)
      if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
        const { h, s, l } = rgbToHsl(parts[0], parts[1], parts[2])
        root.style.setProperty('--hue-primary', String(h))
        root.style.setProperty('--sat-primary', `${s}%`)
        root.style.setProperty('--lig-primary', `${l}%`)
      }
    }

    if (settings.backgroundImageEnabled && settings.backgroundImage) {
      root.style.setProperty('--app-bg-image', `url("${settings.backgroundImage}")`)
      root.style.setProperty('--app-bg-attachment', settings.backgroundMotion ? 'fixed' : 'scroll')
    } else {
      root.style.setProperty('--app-bg-image', 'none')
    }

    if (settings.cardStyle) {
      root.setAttribute('data-card-style', settings.cardStyle)
    }
  }

  return { ready, init, settings, apply }
})
