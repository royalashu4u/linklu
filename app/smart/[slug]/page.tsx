'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'

export default function SmartRedirectPage() {
  const params = useParams()
  const slug = params.slug as string
  const [countdown, setCountdown] = useState(3)
  const [linkData, setLinkData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [openingInChrome, setOpeningInChrome] = useState(false)

  useEffect(() => {
    // Fetch link data with error handling for Instagram browser
    fetch(`/api/links`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then(links => {
        const link = links.find((l: any) => l.slug === slug)
        if (link) {
          setLinkData(link)
        }
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching link:', error)
        setLoading(false)
        // Show error state
      })
  }, [slug])

  // Check if platform has proper deep link support
  const hasProperDeepLinkSupport = (webFallback: string, iosUrl: string | null, androidUrl: string | null): boolean => {
    if (!webFallback) return false
    
    // If deep links exist, the platform has support
    if (iosUrl || androidUrl) {
      return true
    }
    
    const url = webFallback.toLowerCase()
    
    // Platforms with proper deep link support (even if deep links aren't generated)
    const supportedPlatforms = [
      'youtube.com', 'youtu.be',
      'linkedin.com',
      'linkedinmobileapp.com',
      'twitter.com', 'x.com',
      'spotify.com',
      'instagram.com',
      'tiktok.com',
      'facebook.com', 'fb.com'
    ]
    
    return supportedPlatforms.some(platform => url.includes(platform))
  }

  // Open in Chrome/external browser
  const openInChrome = (url: string) => {
    const userAgent = navigator.userAgent.toLowerCase()
    const isAndroid = /android/.test(userAgent)
    
    if (isAndroid) {
      // Android: Use intent URL to open in Chrome
      try {
        // Remove protocol and create intent URL
        const urlWithoutProtocol = url.replace(/^https?:\/\//, '')
        const intentUrl = `intent://${urlWithoutProtocol}#Intent;scheme=https;package=com.android.chrome;end`
        
        // Try to open in Chrome
        window.location.href = intentUrl
        
        // Fallback: If Chrome intent doesn't work, try default browser
        setTimeout(() => {
          // Try opening in default browser
          window.open(url, '_blank')
          // If that doesn't work, redirect in same window
          setTimeout(() => {
            window.location.href = url
          }, 1000)
        }, 1000)
      } catch (e) {
        // If intent fails, just open the URL
        window.location.href = url
      }
    } else {
      // iOS: Try to open in Safari (can't force Chrome on iOS)
      // Show a message to user to open in Safari
      window.location.href = url
    }
  }

  const attemptRedirect = useCallback((isUserInteraction: boolean = false) => {
    if (!linkData) return

    try {
      const userAgent = navigator.userAgent.toLowerCase()
      const isIOS = /iphone|ipad|ipod/.test(userAgent)
      const isAndroid = /android/.test(userAgent)
      const isInstagram = userAgent.includes('instagram')
      const isFacebook = userAgent.includes('fban') || userAgent.includes('fbav') || userAgent.includes('fbsv')
      const isWhatsApp = userAgent.includes('whatsapp')
      const isLinkedInApp = userAgent.includes('linkedinapp')
      const isTwitter = userAgent.includes('twitter') || userAgent.includes('tweetie')
      const isTelegram = userAgent.includes('telegram')
      
      // Check if we're in an in-app browser
      const isInAppBrowser = isInstagram || isFacebook || isWhatsApp || isLinkedInApp || isTwitter || isTelegram
      
      // Check if platform has proper deep link support (check if deep links exist)
      const hasSupport = hasProperDeepLinkSupport(
        linkData.web_fallback,
        linkData.ios_url,
        linkData.android_url
      )
      
      // If in in-app browser and platform doesn't have proper support, open in Chrome
      // BUT only if we don't have deep links to try first
      if (isInAppBrowser && !hasSupport && !linkData.ios_url && !linkData.android_url) {
        setOpeningInChrome(true)
        openInChrome(linkData.web_fallback)
        return
      }

      // For Instagram browser, try deep link first, then web
      if (isInstagram) {
        if (isIOS && linkData.ios_url) {
          // Try iOS deep link
          tryUniversalLink(linkData.ios_url, isUserInteraction)
          setTimeout(() => {
            window.location.href = linkData.web_fallback
          }, 1000)
        } else if (isAndroid && linkData.android_url) {
          // Try Android deep link
          tryDeepLink(linkData.android_url)
          setTimeout(() => {
            window.location.href = linkData.web_fallback
          }, 1000)
        } else {
          // Fallback to web
          window.location.href = linkData.web_fallback
        }
        return
      }

      // Check if this is a LinkedIn link using the mobile app redirect page
      const isLinkedInMobileApp = linkData.android_url?.includes('linkedinmobileapp.com') || 
                                  linkData.ios_url?.includes('linkedinmobileapp.com')

      if (isIOS) {
        // Try iOS deep link first
        if (linkData.ios_url) {
          // For LinkedIn mobile app page, redirect directly (it handles device detection)
          if (linkData.ios_url.includes('linkedinmobileapp.com')) {
            if (isUserInteraction) {
              window.location.href = linkData.ios_url
            } else {
              window.location.replace(linkData.ios_url)
            }
            return
          }
          
          // For Universal Links (https://), they work directly
          // LinkedIn uses Universal Links which work best on iOS
          if (linkData.ios_url.startsWith('https://')) {
            // Universal Link - will open app if installed
            if (isUserInteraction) {
              window.location.href = linkData.ios_url
            } else {
              window.location.replace(linkData.ios_url)
            }
            
            // Fallback after delay if app doesn't open (iOS needs more time)
            setTimeout(() => {
              if (linkData.ios_appstore_url) {
                window.location.replace(linkData.ios_appstore_url)
              } else {
                window.location.replace(linkData.web_fallback)
              }
            }, 3500)
          } else {
            // For custom schemes (youtube://, instagram://, etc.)
            // iOS REQUIRES user interaction for custom schemes - they won't work without it
            if (isUserInteraction) {
              // User clicked - use anchor tag method (most reliable)
              tryUniversalLink(linkData.ios_url, true)
              // Give more time for app to open before falling back
              setTimeout(() => {
                if (linkData.ios_appstore_url) {
                  window.location.replace(linkData.ios_appstore_url)
                } else {
                  window.location.replace(linkData.web_fallback)
                }
              }, 2500)
            } else {
              // No user interaction - custom schemes won't work on iOS
              // Just return, don't try to redirect
              // The user must click the button
              return
            }
          }
        } else if (linkData.ios_appstore_url) {
          window.location.href = linkData.ios_appstore_url
        } else {
          window.location.href = linkData.web_fallback
        }
      } else if (isAndroid) {
        // Try Android deep link first
        if (linkData.android_url) {
          // For LinkedIn mobile app page, redirect directly (it handles device detection and deep linking)
          if (linkData.android_url.includes('linkedinmobileapp.com')) {
            window.location.href = linkData.android_url
            return
          }
          
          // Try deep link with multiple methods
          tryDeepLink(linkData.android_url)
          setTimeout(() => {
            // Fallback to web
            window.location.href = linkData.web_fallback
          }, 2000)
        } else {
          window.location.href = linkData.web_fallback
        }
      } else {
        // Desktop: Use web fallback
        window.location.href = linkData.web_fallback
      }
    } catch (error) {
      console.error('Redirect error:', error)
      // Fallback to web URL on any error
      if (linkData?.web_fallback) {
        window.location.href = linkData.web_fallback
      }
    }
  }, [linkData])

  useEffect(() => {
    if (!linkData || loading) return

    const userAgent = navigator.userAgent.toLowerCase()
    const isIOS = /iphone|ipad|ipod/.test(userAgent)
    
    // Check if this is a custom scheme (not Universal Link)
    const isCustomScheme = linkData.ios_url && !linkData.ios_url.startsWith('https://')
    
    if (isIOS && isCustomScheme) {
      // For iOS custom schemes, DO NOT auto-redirect
      // iOS blocks programmatic redirects to custom schemes without user interaction
      // User must click the button
      // Just start the countdown, but don't auto-redirect
    } else {
      // For Universal Links or Android, try immediate redirect
      attemptRedirect(false)
    }

    // Set up countdown as fallback
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // On countdown end, try redirect (might work for Universal Links)
          attemptRedirect(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [linkData, loading, attemptRedirect])

  const tryUniversalLink = (url: string, isUserInteraction: boolean = false) => {
    // For Universal Links (https://), they work directly and will open app if installed
    if (url.startsWith('https://')) {
      // iOS prefers location.replace for Universal Links
      if (isUserInteraction) {
        window.location.href = url
      } else {
        window.location.replace(url)
      }
      return
    }
    
    // For custom schemes on iOS, we MUST use user interaction
    // iOS blocks programmatic redirects to custom schemes without user interaction
    if (isUserInteraction) {
      // Method 1: Create hidden anchor and click it (most reliable for iOS)
      const link = document.createElement('a')
      link.href = url
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link)
        }
      }, 100)
      
      // Method 2: Also try direct navigation as backup
      setTimeout(() => {
        window.location.href = url
      }, 50)
    } else {
      // If no user interaction, try anyway (might work for Universal Links)
      window.location.replace(url)
    }
  }

  const tryDeepLink = (url: string) => {
    // For YouTube on Android
    if (url.startsWith('vnd.youtube://')) {
      // Try direct navigation first
      window.location.href = url
      
      // Also try intent URL format for better compatibility
      const path = url.replace('vnd.youtube://', '')
      const intentUrl = `intent://${path}#Intent;scheme=vnd.youtube;package=com.google.android.youtube;end`
      setTimeout(() => {
        window.location.href = intentUrl
      }, 500)
      return
    }
    
    // For YouTube on iOS (youtube:// scheme)
    if (url.startsWith('youtube://')) {
      window.location.href = url
      return
    }
    
    // For LinkedIn on Android (uses voyager:// scheme)
    if (url.startsWith('voyager://')) {
      // Method 1: Try direct navigation first
      window.location.href = url
      
      // Method 2: Try with intent URL format for better compatibility
      const path = url.replace('voyager://', '')
      const intentUrl = `intent://${path}#Intent;scheme=voyager;package=com.linkedin.android;end`
      setTimeout(() => {
        window.location.href = intentUrl
      }, 500)
      
      // Method 3: Also try hidden iframe (some browsers block direct navigation)
      try {
        const iframe = document.createElement('iframe')
        iframe.style.display = 'none'
        iframe.style.width = '0'
        iframe.style.height = '0'
        iframe.src = url
        document.body.appendChild(iframe)
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe)
          }
        }, 1000)
      } catch (e) {
        // Ignore iframe errors
      }
      return
    }
    
    // For LinkedIn on Android (legacy linkedin:// scheme - try both)
    if (url.startsWith('linkedin://')) {
      window.location.href = url
      // Also try voyager:// as fallback
      const path = url.replace('linkedin://', '')
      setTimeout(() => {
        window.location.href = `voyager://${path}`
      }, 500)
      return
    }
    
    // For Android, try intent:// format if needed
    if (url.startsWith('intent://')) {
      window.location.href = url
    } else {
      // Try as regular URL (custom scheme)
      window.location.href = url
      
      // Also try as intent if it's a custom scheme
      if (url.includes('://')) {
        const scheme = url.split('://')[0]
        const path = url.split('://')[1]
        const intentUrl = `intent://${path}#Intent;scheme=${scheme};end`
        setTimeout(() => {
          window.location.href = intentUrl
        }, 200)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!linkData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Not Found</h1>
          <p className="text-gray-600 mb-4">The link you&apos;re looking for doesn&apos;t exist.</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {openingInChrome ? 'Opening in Browser' : (linkData.title || 'Opening App...')}
          </h1>
          <p className="text-gray-600">
            {openingInChrome 
              ? 'Opening link in Chrome browser...'
              : `Redirecting in ${countdown} second${countdown !== 1 ? 's' : ''}...`
            }
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={(e) => {
              e.preventDefault()
              // User interaction is REQUIRED for iOS custom schemes to work
              // This is the only way custom schemes work on iOS
              attemptRedirect(true)
            }}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Open Now
          </button>
          
          <a
            href={linkData.web_fallback}
            className="block text-sm text-indigo-600 hover:text-indigo-700"
          >
            Continue to website instead
          </a>
          
          {/* Direct link button for Instagram browser compatibility */}
          {linkData.web_fallback && (
            <a
              href={linkData.web_fallback}
              className="block mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            >
              Open in Browser
            </a>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Having trouble? Make sure the app is installed, or continue to the website.
          </p>
        </div>
      </div>
    </div>
  )
}

