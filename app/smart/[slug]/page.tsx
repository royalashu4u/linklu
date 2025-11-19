'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'

export default function SmartRedirectPage() {
  const params = useParams()
  const slug = params.slug as string
  const [countdown, setCountdown] = useState(3)
  const [linkData, setLinkData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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

  const attemptRedirect = useCallback(() => {
    if (!linkData) return

    try {
      const userAgent = navigator.userAgent.toLowerCase()
      const isIOS = /iphone|ipad|ipod/.test(userAgent)
      const isAndroid = /android/.test(userAgent)
      const isInstagram = userAgent.includes('instagram')

      // For Instagram browser, try deep link first, then web
      if (isInstagram) {
        if (isIOS && linkData.ios_url) {
          // Try iOS deep link
          tryUniversalLink(linkData.ios_url)
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

      if (isIOS) {
        // Try iOS deep link first
        if (linkData.ios_url) {
          // For Universal Links (https://), they work directly
          if (linkData.ios_url.startsWith('https://')) {
            // Universal Link - will open app if installed
            window.location.href = linkData.ios_url
            // Fallback after delay if app doesn't open
            setTimeout(() => {
              if (linkData.ios_appstore_url) {
                window.location.href = linkData.ios_appstore_url
              } else {
                window.location.href = linkData.web_fallback
              }
            }, 2500)
          } else {
            // For custom schemes (youtube://, instagram://, etc.)
            tryUniversalLink(linkData.ios_url)
            // Give more time for app to open before falling back
            setTimeout(() => {
              // Fallback to App Store or web
              if (linkData.ios_appstore_url) {
                window.location.href = linkData.ios_appstore_url
              } else {
                window.location.href = linkData.web_fallback
              }
            }, 2000)
          }
        } else if (linkData.ios_appstore_url) {
          window.location.href = linkData.ios_appstore_url
        } else {
          window.location.href = linkData.web_fallback
        }
      } else if (isAndroid) {
        // Try Android deep link first
        if (linkData.android_url) {
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

    // Try immediate redirect on page load (for better app opening)
    attemptRedirect()

    // Also set up countdown as fallback
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          attemptRedirect()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [linkData, loading, attemptRedirect])

  const tryUniversalLink = (url: string) => {
    // For Universal Links (https://), they work directly and will open app if installed
    if (url.startsWith('https://')) {
      window.location.href = url
      return
    }
    
    // For custom schemes (vnd.youtube://, linkedin://, etc.)
    // Method 1: Direct navigation (primary method)
    window.location.href = url
    
    // Method 2: Hidden iframe (for Instagram/Facebook browsers)
    try {
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.src = url
      document.body.appendChild(iframe)
    } catch (e) {
      // Ignore iframe errors
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
    
    // For LinkedIn on Android
    if (url.startsWith('linkedin://')) {
      // Try direct navigation first
      window.location.href = url
      
      // Also try with intent URL format for better compatibility
      const path = url.replace('linkedin://', '')
      const intentUrl = `intent://${path}#Intent;scheme=linkedin;package=com.linkedin.android;end`
      setTimeout(() => {
        window.location.href = intentUrl
      }, 300)
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
            {linkData.title || 'Opening App...'}
          </h1>
          <p className="text-gray-600">
            Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={attemptRedirect}
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

