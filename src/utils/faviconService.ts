import { DEFAULT_ICON_PLACEHOLDER } from './constants.ts'

export const extractDomain = (url: string): string => {
  try {
    let domain = url
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      domain = 'https://' + url
    }
    const urlObj = new URL(domain)
    return urlObj.hostname
  } catch (e) {
    console.error('Failed to extract domain:', e)
    return ''
  }
}

export const getFaviconUrl = (domain: string): string => {
  return `https://www.faviconextractor.com/favicon/${domain}?larger=true`
}

export const getDefaultIcon = (): string => {
  return DEFAULT_ICON_PLACEHOLDER
}
