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
 * Detect platform from URL - supports many platforms
 */
export function detectPlatform(url: string): string | null {
  const lowerUrl = url.toLowerCase()
  
  // Video platforms
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube'
  if (lowerUrl.includes('tiktok.com')) return 'tiktok'
  if (lowerUrl.includes('vimeo.com')) return 'vimeo'
  if (lowerUrl.includes('twitch.tv')) return 'twitch'
  
  // Social media
  if (lowerUrl.includes('instagram.com')) return 'instagram'
  if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return 'twitter'
  if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.com')) return 'facebook'
  if (lowerUrl.includes('linkedin.com')) return 'linkedin'
  if (lowerUrl.includes('pinterest.com')) return 'pinterest'
  if (lowerUrl.includes('reddit.com')) return 'reddit'
  if (lowerUrl.includes('snapchat.com')) return 'snapchat'
  if (lowerUrl.includes('discord.com') || lowerUrl.includes('discord.gg')) return 'discord'
  
  // Messaging
  if (lowerUrl.includes('whatsapp.com')) return 'whatsapp'
  if (lowerUrl.includes('telegram.org')) return 'telegram'
  if (lowerUrl.includes('signal.org')) return 'signal'
  
  // Music
  if (lowerUrl.includes('spotify.com')) return 'spotify'
  if (lowerUrl.includes('apple.com/music') || lowerUrl.includes('music.apple.com')) return 'apple-music'
  if (lowerUrl.includes('soundcloud.com')) return 'soundcloud'
  
  // Shopping
  if (lowerUrl.includes('amazon.com') || lowerUrl.includes('amazon.')) return 'amazon'
  if (lowerUrl.includes('shopify.com') || lowerUrl.includes('.myshopify.com')) return 'shopify'
  if (lowerUrl.includes('etsy.com')) return 'etsy'
  
  // Productivity
  if (lowerUrl.includes('notion.so')) return 'notion'
  if (lowerUrl.includes('figma.com')) return 'figma'
  if (lowerUrl.includes('github.com')) return 'github'
  if (lowerUrl.includes('medium.com')) return 'medium'
  
  // Generic detection - if it's a valid URL, return 'web'
  try {
    new URL(url)
    return 'web'
  } catch {
    return null
  }
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
        // iOS uses youtube:// scheme, Android uses vnd.youtube://
        ios_url: `youtube://watch?v=${videoId}`,
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
      
      // LinkedIn deep link formats
      // For profiles: linkedin://in/{username} or linkedin://profile/view?id={id}
      // For posts: linkedin://feed/update/{activityId} or linkedin://feed/update/urn:li:activity:{id}
      // For companies: linkedin://company/{companyId}
      // For jobs: linkedin://job/{jobId}
      
      // Try to extract activity ID from post URLs (multiple formats)
      // Format 1: /feed/update/urn:li:activity:1234567890
      // Format 2: /feed/update/1234567890
      // Format 3: activity-1234567890
      const activityUrnMatch = url.match(/\/feed\/update\/urn:li:activity:(\d+)/)
      const activityIdMatch = url.match(/\/feed\/update\/(\d+)/)
      const activityShortMatch = url.match(/activity-(\d+)/)
      const activityId = activityUrnMatch ? activityUrnMatch[1] : 
                        activityIdMatch ? activityIdMatch[1] : 
                        activityShortMatch ? activityShortMatch[1] : null
      
      // Try to extract username from profile URLs
      const profileMatch = url.match(/linkedin\.com\/in\/([^\/\?&#]+)/)
      const username = profileMatch ? profileMatch[1] : null
      
      // Try to extract company name/ID
      const companyMatch = url.match(/linkedin\.com\/company\/([^\/\?&#]+)/)
      const companyName = companyMatch ? companyMatch[1] : null
      
      // Try to extract job ID
      const jobMatch = url.match(/linkedin\.com\/jobs\/view\/(\d+)/)
      const jobId = jobMatch ? jobMatch[1] : null
      
      // LinkedIn uses https:// scheme for Universal Links on iOS (works best)
      // For Android, use linkedin:// scheme with intent:// fallback
      let iosDeepLink: string
      let androidDeepLink: string
      
      if (activityId) {
        // For posts - use the activity ID
        // iOS: Universal Link format
        iosDeepLink = `https://www.linkedin.com/feed/update/urn:li:activity:${activityId}`
        // Android: linkedin:// scheme
        androidDeepLink = `linkedin://feed/update/urn:li:activity:${activityId}`
      } else if (username) {
        // For profiles - use the username
        iosDeepLink = `https://www.linkedin.com/in/${username}`
        androidDeepLink = `linkedin://in/${username}`
      } else if (companyName) {
        // For companies
        iosDeepLink = `https://www.linkedin.com/company/${companyName}`
        androidDeepLink = `linkedin://company/${companyName}`
      } else if (jobId) {
        // For jobs
        iosDeepLink = `https://www.linkedin.com/jobs/view/${jobId}`
        androidDeepLink = `linkedin://job/${jobId}`
      } else {
        // Fallback: use the full URL (LinkedIn supports Universal Links on iOS)
        // Clean up the URL to ensure it's in the right format
        let cleanUrl = url
        if (!url.startsWith('http')) {
          cleanUrl = `https://${url}`
        }
        iosDeepLink = cleanUrl
        // For Android, try to construct a deep link from the path
        const path = linkedinPath.replace(/^\//, '').replace(/\?.*$/, '')
        androidDeepLink = path ? `linkedin://${path}` : `linkedin://`
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

    case 'vimeo': {
      const videoMatch = url.match(/vimeo\.com\/(\d+)/)
      const videoId = videoMatch ? videoMatch[1] : null
      return {
        platform: 'vimeo',
        platformName: 'Vimeo',
        ios_url: videoId ? `vimeo://videos/${videoId}` : null,
        android_url: videoId ? `vimeo://videos/${videoId}` : null,
        ios_appstore_url: 'https://apps.apple.com/app/vimeo/id425194759',
        android_playstore_url: 'https://play.google.com/store/apps/details?id=com.vimeo.android.videoapp',
        web_fallback: url,
        title: `Vimeo Video`,
      }
    }

    case 'twitch': {
      return {
        platform: 'twitch',
        platformName: 'Twitch',
        ios_url: url.replace('https://www.twitch.tv', 'twitch://'),
        android_url: url.replace('https://www.twitch.tv', 'twitch://'),
        ios_appstore_url: 'https://apps.apple.com/app/twitch/id460177396',
        android_playstore_url: 'https://play.google.com/store/apps/details?id=tv.twitch.android.app',
        web_fallback: url,
        title: `Twitch`,
      }
    }

    case 'pinterest': {
      return {
        platform: 'pinterest',
        platformName: 'Pinterest',
        ios_url: url.replace('https://www.pinterest.com', 'pinterest://'),
        android_url: url.replace('https://www.pinterest.com', 'pinterest://'),
        ios_appstore_url: 'https://apps.apple.com/app/pinterest/id429047995',
        android_playstore_url: 'https://play.google.com/store/apps/details?id=com.pinterest',
        web_fallback: url,
        title: `Pinterest`,
      }
    }

    case 'reddit': {
      return {
        platform: 'reddit',
        platformName: 'Reddit',
        ios_url: url.replace('https://www.reddit.com', 'reddit://'),
        android_url: url.replace('https://www.reddit.com', 'reddit://'),
        ios_appstore_url: 'https://apps.apple.com/app/reddit/id1064216828',
        android_playstore_url: 'https://play.google.com/store/apps/details?id=com.reddit.frontpage',
        web_fallback: url,
        title: `Reddit`,
      }
    }

    case 'snapchat': {
      return {
        platform: 'snapchat',
        platformName: 'Snapchat',
        ios_url: url.replace('https://www.snapchat.com', 'snapchat://'),
        android_url: url.replace('https://www.snapchat.com', 'snapchat://'),
        ios_appstore_url: 'https://apps.apple.com/app/snapchat/id447188370',
        android_playstore_url: 'https://play.google.com/store/apps/details?id=com.snapchat.android',
        web_fallback: url,
        title: `Snapchat`,
      }
    }

    case 'discord': {
      return {
        platform: 'discord',
        platformName: 'Discord',
        ios_url: url.replace('https://discord.com', 'discord://'),
        android_url: url.replace('https://discord.com', 'discord://'),
        ios_appstore_url: 'https://apps.apple.com/app/discord/id985746746',
        android_playstore_url: 'https://play.google.com/store/apps/details?id=com.discord',
        web_fallback: url,
        title: `Discord`,
      }
    }

    case 'amazon': {
      return {
        platform: 'amazon',
        platformName: 'Amazon',
        ios_url: url.replace(/https?:\/\/(www\.)?amazon\./, 'amazon://'),
        android_url: url.replace(/https?:\/\/(www\.)?amazon\./, 'amazon://'),
        ios_appstore_url: 'https://apps.apple.com/app/amazon/id297606951',
        android_playstore_url: 'https://play.google.com/store/apps/details?id=com.amazon.mShop.android.shopping',
        web_fallback: url,
        title: `Amazon`,
      }
    }

    case 'github': {
      return {
        platform: 'github',
        platformName: 'GitHub',
        ios_url: url.replace('https://github.com', 'github://'),
        android_url: url.replace('https://github.com', 'github://'),
        ios_appstore_url: 'https://apps.apple.com/app/github/id1477376905',
        android_playstore_url: 'https://play.google.com/store/apps/details?id=com.github.android',
        web_fallback: url,
        title: `GitHub`,
      }
    }

    case 'web':
    default: {
      // Generic URL - try to generate deep link from domain
      // Extract domain and try common deep link patterns
      try {
        const urlObj = new URL(url)
        const domain = urlObj.hostname.replace('www.', '')
        const path = urlObj.pathname + urlObj.search
        
        // Try to generate a generic deep link
        // Many apps use their domain name as the scheme
        const domainName = domain.split('.')[0]
        const genericDeepLink = `${domainName}://${path.replace(/^\//, '')}`
        
        return {
          platform: 'web',
          platformName: domain,
          ios_url: genericDeepLink,
          android_url: genericDeepLink,
          ios_appstore_url: null,
          android_playstore_url: null,
          web_fallback: url,
          title: null,
        }
      } catch {
        // If URL parsing fails, just use as web fallback
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
  }
}

