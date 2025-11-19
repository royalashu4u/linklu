/**
 * YouTube Deep Link Generator
 * Converts YouTube URLs to platform-specific deep links
 */

export interface YouTubeDeepLinks {
  ios_url: string
  android_url: string
  ios_appstore_url: string
  android_playstore_url: string
  web_fallback: string
}

/**
 * Extract video ID from YouTube URL
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * Generate YouTube deep links for all platforms
 */
export function generateYouTubeDeepLinks(youtubeUrl: string): YouTubeDeepLinks | null {
  const videoId = extractYouTubeVideoId(youtubeUrl)
  
  if (!videoId) {
    return null
  }

  return {
    ios_url: `vnd.youtube://watch?v=${videoId}`,
    android_url: `vnd.youtube://watch?v=${videoId}`,
    ios_appstore_url: 'https://apps.apple.com/app/youtube/id544007664',
    android_playstore_url: 'https://play.google.com/store/apps/details?id=com.google.android.youtube',
    web_fallback: youtubeUrl,
  }
}

/**
 * Check if URL is a YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/.test(url)
}

