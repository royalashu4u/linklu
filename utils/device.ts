export type DeviceType = 'ios' | 'android' | 'desktop'
export type BrowserType = 'instagram' | 'facebook' | 'whatsapp' | 'linkedin' | 'twitter' | 'telegram' | 'safari' | 'chrome' | 'firefox' | 'edge' | 'other'
export type PlatformType = 'mobile' | 'tablet' | 'desktop'

export interface DeviceInfo {
  device: DeviceType
  browser: BrowserType
  platform: PlatformType
  isInAppBrowser: boolean
  isSocialApp: boolean
}

export function detectDevice(userAgent: string): DeviceType {
  if (!userAgent) return 'desktop'
  
  const ua = userAgent.toLowerCase()
  
  // iOS detection
  if (/iphone|ipad|ipod/.test(ua)) {
    return 'ios'
  }
  
  // Android detection
  if (/android/.test(ua)) {
    return 'android'
  }
  
  return 'desktop'
}

export function detectBrowser(userAgent: string): BrowserType {
  if (!userAgent) return 'other'
  
  const ua = userAgent.toLowerCase()
  
  // Social app in-app browsers (check first as they often contain other browser strings)
  if (ua.includes('instagram')) return 'instagram'
  if (ua.includes('fban') || ua.includes('fbav') || ua.includes('fbsv')) return 'facebook'
  if (ua.includes('whatsapp')) return 'whatsapp'
  if (ua.includes('linkedinapp')) return 'linkedin'
  if (ua.includes('twitter') || ua.includes('tweetie')) return 'twitter'
  if (ua.includes('telegram')) return 'telegram'
  
  // Regular browsers
  if (ua.includes('safari') && !ua.includes('chrome') && !ua.includes('crios')) return 'safari'
  if (ua.includes('chrome') || ua.includes('crios')) return 'chrome'
  if (ua.includes('firefox') || ua.includes('fxios')) return 'firefox'
  if (ua.includes('edg') || ua.includes('edge')) return 'edge'
  
  return 'other'
}

export function detectPlatform(userAgent: string): PlatformType {
  if (!userAgent) return 'desktop'
  
  const ua = userAgent.toLowerCase()
  
  // Tablets
  if (/ipad|android(?!.*mobile)|tablet/.test(ua)) {
    return 'tablet'
  }
  
  // Mobile
  if (/iphone|ipod|android|mobile/.test(ua)) {
    return 'mobile'
  }
  
  return 'desktop'
}

export function isInAppBrowser(userAgent: string): boolean {
  if (!userAgent) return false
  
  const ua = userAgent.toLowerCase()
  const socialBrowsers = ['instagram', 'fban', 'fbav', 'fbsv', 'whatsapp', 'linkedinapp', 'twitter', 'telegram']
  
  return socialBrowsers.some(browser => ua.includes(browser))
}

export function isSocialApp(userAgent: string): boolean {
  return isInAppBrowser(userAgent)
}

export function getDeviceInfo(userAgent: string): DeviceInfo {
  return {
    device: detectDevice(userAgent),
    browser: detectBrowser(userAgent),
    platform: detectPlatform(userAgent),
    isInAppBrowser: isInAppBrowser(userAgent),
    isSocialApp: isSocialApp(userAgent),
  }
}
