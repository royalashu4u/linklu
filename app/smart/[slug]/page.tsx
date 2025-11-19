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
    // Fetch link data
    fetch(`/api/links`)
      .then(res => res.json())
      .then(links => {
        const link = links.find((l: any) => l.slug === slug)
        if (link) {
          setLinkData(link)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  const attemptRedirect = useCallback(() => {
    if (!linkData) return

    const userAgent = navigator.userAgent.toLowerCase()
    const isIOS = /iphone|ipad|ipod/.test(userAgent)
    const isAndroid = /android/.test(userAgent)

    let redirectUrl = linkData.web_fallback

    if (isIOS) {
      // Try iOS deep link first
      if (linkData.ios_url) {
        // Try multiple methods for social apps
        tryUniversalLink(linkData.ios_url)
        setTimeout(() => {
          // Fallback to App Store or web
          if (linkData.ios_appstore_url) {
            window.location.href = linkData.ios_appstore_url
          } else {
            window.location.href = linkData.web_fallback
          }
        }, 500)
      } else if (linkData.ios_appstore_url) {
        redirectUrl = linkData.ios_appstore_url
      }
    } else if (isAndroid) {
      // Try Android deep link first
      if (linkData.android_url) {
        // Try intent URL format
        tryDeepLink(linkData.android_url)
        setTimeout(() => {
          // Fallback to web (Play Store disabled)
          window.location.href = linkData.web_fallback
        }, 500)
      } else {
        redirectUrl = linkData.web_fallback
      }
    }

    // Final redirect
    window.location.href = redirectUrl
  }, [linkData])

  useEffect(() => {
    if (!linkData || loading) return

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
    // Method 1: Direct navigation
    window.location.href = url
    
    // Method 2: Hidden iframe (for Instagram/Facebook)
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.src = url
    document.body.appendChild(iframe)
    
    // Method 3: Window open (for some browsers)
    setTimeout(() => {
      window.open(url, '_blank')
    }, 100)
  }

  const tryDeepLink = (url: string) => {
    // For Android, try intent:// format if needed
    if (url.startsWith('intent://')) {
      window.location.href = url
    } else {
      // Try as regular URL
      window.location.href = url
      
      // Also try as intent if it's a custom scheme
      if (url.includes('://')) {
        const intentUrl = `intent://${url.split('://')[1]}#Intent;scheme=${url.split('://')[0]};end`
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Not Found</h1>
          <p className="text-gray-600">The link you&apos;re looking for doesn&apos;t exist.</p>
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

