/**
 * Universal URL Parser and Deep Link Generator
 * Auto-detects platform and generates appropriate deep links
 */

export interface ParsedLink {
  platform: string
  platformName: string
  ios_url: string | null
  android_url: string | null
  ios_appstore_url: string | null
  android_playstore_url: string | null
  web_fallback: string
  title: string | null
}

/**
 * Detect platform from URL
 */
export function detectPlatform(url: string): string | null {
  const lowerUrl = url.toLowerCase()
  
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube'
  if (lowerUrl.includes('instagram.com')) return 'instagram'
  if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return 'twitter'
  if (lowerUrl.includes('tiktok.com')) return 'tiktok'
  if (lowerUrl.includes('spotify.com')) return 'spotify'
  if (lowerUrl.includes('linkedin.com')) return 'linkedin'
  if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.com')) return 'facebook'
  if (lowerUrl.includes('whatsapp.com')) return 'whatsapp'
  if (lowerUrl.includes('telegram.org')) return 'telegram'
  if (lowerUrl.includes('snapchat.com')) return 'snapchat'
  if (lowerUrl.includes('pinterest.com')) return 'pinterest'
  if (lowerUrl.includes('reddit.com')) return 'reddit'
  
  return null
}

/**
 * Extract YouTube video ID
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) return match[1]
  }
  return null
}

/**
 * Extract Instagram post/reel ID
 */
function extractInstagramId(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:p|reel|tv)\/([^\/\?]+)/)
  return match ? match[1] : null
}

/**
 * Extract Twitter/X post ID
 */
function extractTwitterId(url: string): string | null {
  const match = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/)
  return match ? match[1] : null
}

/**
 * Extract TikTok video ID
 */
function extractTikTokId(url: string): string | null {
  const match = url.match(/tiktok\.com\/@[\w\.]+\/video\/(\d+)/)
  return match ? match[1] : null
}

/**
 * Extract Spotify track/album/playlist ID
 */
function extractSpotifyId(url: string): { type: string; id: string } | null {
  const match = url.match(/spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/)
  if (match) {
    return { type: match[1], id: match[2] }
  }
  return null
}

/**
 * Generate deep links for a URL
 */
export function generateDeepLinks(url: string): ParsedLink | null {
  const platform = detectPlatform(url)
  if (!platform) {
    // Generic URL - just use as web fallback
    return {
      platform: 'web',
      platformName: 'Web',
      ios_url: null,
      android_url: null,
      ios_appstore_url: null,
      android_playstore_url: null,
      web_fallback: url,
      title: null,
    }
  }

  switch (platform) {
    case 'youtube': {
      const videoId = extractYouTubeId(url)
      if (!videoId) return null
      
      return {
        platform: 'youtube',
        platformName: 'YouTube',
        ios_url: `vnd.youtube://watch?v=${videoId}`,
        android_url: `vnd.youtube://watch?v=${videoId}`,
        ios_appstore_url: 'https://apps.apple.com/app/youtube/id544007664',
        android_playstore_url: 'https://play.google.com/store/apps/details?id=com.google.android.youtube',
        web_fallback: url,
        title: `YouTube Video ${videoId}`,
      }
    }

    case 'instagram': {
      const postId = extractInstagramId(url)
      if (!postId) return null
      
      return {
        platform: 'instagram',
        platformName: 'Instagram',
        ios_url: `instagram://media?id=${postId}`,
        android_url: `instagram://media?id=${postId}`,
        ios_appstore_url: 'https://apps.apple.com/app/instagram/id389801252',
        android_playstore_url: 'https://play.google.com/store/apps/details?id=com.instagram.android',
        web_fallback: url,
        title: `Instagram Post`,
      }
    }

    case 'twitter': {
      const tweetId = extractTwitterId(url)
      if (!tweetId) return null
      
      return {
        platform: 'twitter',
        platformName: 'Twitter/X',
        ios_url: `twitter://status?id=${tweetId}`,
        android_url: `twitter://status?id=${tweetId}`,
        ios_appstore_url: 'https://apps.apple.com/app/twitter/id333903271',
        android_playstore_url: 'https://play.google.com/store/apps/details?id=com.twitter.android',
        web_fallback: url,
        title: `Twitter Post`,
      }
    }

    case 'tiktok': {
      const videoId = extractTikTokId(url)
      if (!videoId) return null
      
      return {
        platform: 'tiktok',
        platformName: 'TikTok',
        ios_url: `snssdk1233://aweme/detail/${videoId}`,
        android_url: `snssdk1233://aweme/detail/${videoId}`,
        ios_appstore_url: 'https://apps.apple.com/app/tiktok/id835599320',
        android_playstore_url: 'https://play.google.com/store/apps/details?id=com.zhiliaoapp.musically',
        web_fallback: url,
        title: `TikTok Video`,
      }
    }

    case 'spotify': {
      const spotifyData = extractSpotifyId(url)
      if (!spotifyData) return null
      
      return {
        platform: 'spotify',
        platformName: 'Spotify',
        ios_url: `spotify://${spotifyData.type}/${spotifyData.id}`,
        android_url: `spotify://${spotifyData.type}/${spotifyData.id}`,
        ios_appstore_url: 'https://apps.apple.com/app/spotify/id324684580',
        android_playstore_url: 'https://play.google.com/store/apps/details?id=com.spotify.music',
        web_fallback: url,
        title: `Spotify ${spotifyData.type}`,
      }
    }

    case 'linkedin': {
      // Extract LinkedIn path from URL
      let linkedinPath = ''
      try {
        const urlObj = new URL(url)
        linkedinPath = urlObj.pathname + urlObj.search
      } catch {
        // If URL parsing fails, try simple split
        const parts = url.split('linkedin.com')
        linkedinPath = parts[1] || '/'
      }
      
      // LinkedIn deep link formats that work better
      // For profiles: linkedin://profile/view?id={id} or linkedin://in/{username}
      // For posts: linkedin://feed/update/{activityId}
      // For companies: linkedin://company/{companyId}
      
      // Try to extract activity ID from post URLs (format: activity-{id})
      const activityMatch = url.match(/activity-(\d+)/)
      const activityId = activityMatch ? activityMatch[1] : null
      
      // Try to extract username from profile URLs
      const profileMatch = url.match(/linkedin\.com\/in\/([^\/\?]+)/)
      const username = profileMatch ? profileMatch[1] : null
      
      // Try to extract company name
      const companyMatch = url.match(/linkedin\.com\/company\/([^\/\?]+)/)
      const companyName = companyMatch ? companyMatch[1] : null
      
      // LinkedIn uses https:// scheme for Universal Links on iOS
      // For Android, use linkedin:// scheme
      let iosDeepLink: string
      let androidDeepLink: string
      
      if (activityId) {
        // For posts, use the activity ID
        iosDeepLink = `https://www.linkedin.com/feed/update/${activityId}`
        androidDeepLink = `linkedin://feed/update/${activityId}`
      } else if (username) {
        // For profiles, use the username
        iosDeepLink = `https://www.linkedin.com/in/${username}`
        androidDeepLink = `linkedin://in/${username}`
      } else if (companyName) {
        // For companies
        iosDeepLink = `https://www.linkedin.com/company/${companyName}`
        androidDeepLink = `linkedin://company/${companyName}`
      } else {
        // Fallback: use the full URL (LinkedIn supports Universal Links)
        iosDeepLink = url
        androidDeepLink = `linkedin://${linkedinPath.replace(/^\//, '')}`
      }
      
      return {
        platform: 'linkedin',
        platformName: 'LinkedIn',
        ios_url: iosDeepLink,
        android_url: androidDeepLink,
        ios_appstore_url: 'https://apps.apple.com/app/linkedin/id288429040',
        android_playstore_url: 'https://play.google.com/store/apps/details?id=com.linkedin.android',
        web_fallback: url,
        title: `LinkedIn`,
      }
    }

    case 'facebook': {
      return {
        platform: 'facebook',
        platformName: 'Facebook',
        ios_url: `fb://${url.split('facebook.com')[1]}`,
        android_url: `fb://${url.split('facebook.com')[1]}`,
        ios_appstore_url: 'https://apps.apple.com/app/facebook/id284882215',
        android_playstore_url: 'https://play.google.com/store/apps/details?id=com.facebook.katana',
        web_fallback: url,
        title: `Facebook`,
      }
    }

    case 'whatsapp': {
      return {
        platform: 'whatsapp',
        platformName: 'WhatsApp',
        ios_url: `whatsapp://${url.split('whatsapp.com')[1]}`,
        android_url: `whatsapp://${url.split('whatsapp.com')[1]}`,
        ios_appstore_url: 'https://apps.apple.com/app/whatsapp-messenger/id310633997',
        android_playstore_url: 'https://play.google.com/store/apps/details?id=com.whatsapp',
        web_fallback: url,
        title: `WhatsApp`,
      }
    }

    case 'telegram': {
      return {
        platform: 'telegram',
        platformName: 'Telegram',
        ios_url: `tg://${url.split('telegram.org')[1]}`,
        android_url: `tg://${url.split('telegram.org')[1]}`,
        ios_appstore_url: 'https://apps.apple.com/app/telegram-messenger/id686449807',
        android_playstore_url: 'https://play.google.com/store/apps/details?id=org.telegram.messenger',
        web_fallback: url,
        title: `Telegram`,
      }
    }

    default:
      return {
        platform: 'web',
        platformName: 'Web',
        ios_url: null,
        android_url: null,
        ios_appstore_url: null,
        android_playstore_url: null,
        web_fallback: url,
        title: null,
      }
  }
}

