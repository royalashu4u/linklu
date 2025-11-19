'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { generateYouTubeDeepLinks, isYouTubeUrl } from '@/lib/youtube-deeplink'

interface SmartLink {
  id: string
  slug: string
  ios_url: string | null
  android_url: string | null
  ios_appstore_url: string | null
  android_playstore_url: string | null
  web_fallback: string
  title: string | null
  created_at: string
  click_count?: number
}

export default function Dashboard() {
  const [links, setLinks] = useState<SmartLink[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    ios_url: '',
    android_url: '',
    ios_appstore_url: '',
    android_playstore_url: '',
    web_fallback: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [baseUrl, setBaseUrl] = useState('')

  useEffect(() => {
    // Get base URL for displaying links
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin)
    }
    fetchLinks()
  }, [])

  const fetchLinks = async () => {
    try {
      const res = await fetch('/api/links')
      const data = await res.json()
      setLinks(data)
    } catch (error) {
      console.error('Failed to fetch links:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Failed to create link')
        return
      }

      // Reset form and refresh links
      setFormData({
        slug: '',
        title: '',
        ios_url: '',
        android_url: '',
        ios_appstore_url: '',
        android_playstore_url: '',
        web_fallback: '',
      })
      setShowForm(false)
      fetchLinks()
    } catch (error) {
      console.error('Failed to create link:', error)
      alert('Failed to create link')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this link?')) return

    try {
      const res = await fetch(`/api/links/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        alert('Failed to delete link')
        return
      }

      fetchLinks()
    } catch (error) {
      console.error('Failed to delete link:', error)
      alert('Failed to delete link')
    }
  }

  const generateSlug = () => {
    const randomSlug = Math.random().toString(36).substring(2, 10)
    setFormData({ ...formData, slug: randomSlug })
  }

  const handleWebFallbackChange = (value: string) => {
    setFormData({ ...formData, web_fallback: value })
    
    // Auto-detect YouTube URL and generate deep links
    if (isYouTubeUrl(value)) {
      const deepLinks = generateYouTubeDeepLinks(value)
      if (deepLinks) {
        setFormData({
          ...formData,
          web_fallback: value,
          ios_url: deepLinks.ios_url,
          android_url: deepLinks.android_url,
          ios_appstore_url: deepLinks.ios_appstore_url,
          android_playstore_url: deepLinks.android_playstore_url,
        })
      }
    }
  }

  const fillFromYouTubeUrl = () => {
    const url = prompt('Enter YouTube URL:')
    if (url && isYouTubeUrl(url)) {
      const deepLinks = generateYouTubeDeepLinks(url)
      if (deepLinks) {
        setFormData({
          ...formData,
          web_fallback: deepLinks.web_fallback,
          ios_url: deepLinks.ios_url,
          android_url: deepLinks.android_url,
          ios_appstore_url: deepLinks.ios_appstore_url,
          android_playstore_url: deepLinks.android_playstore_url,
        })
      } else {
        alert('Invalid YouTube URL')
      }
    } else if (url) {
      alert('Please enter a valid YouTube URL')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your smart links</p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/"
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Home
            </Link>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {showForm ? 'Cancel' : '+ New Link'}
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Create New Link</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({ ...formData, slug: e.target.value })
                      }
                      placeholder="my-link"
                      required
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={generateSlug}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      Random
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="My App Link"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    iOS Deep Link
                  </label>
                  <input
                    type="url"
                    value={formData.ios_url}
                    onChange={(e) =>
                      setFormData({ ...formData, ios_url: e.target.value })
                    }
                    placeholder="myapp://path or https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Universal Link or custom scheme</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    iOS App Store URL
                  </label>
                  <input
                    type="url"
                    value={formData.ios_appstore_url}
                    onChange={(e) =>
                      setFormData({ ...formData, ios_appstore_url: e.target.value })
                    }
                    placeholder="https://apps.apple.com/app/..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Fallback if app not installed</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Android Deep Link
                  </label>
                  <input
                    type="url"
                    value={formData.android_url}
                    onChange={(e) =>
                      setFormData({ ...formData, android_url: e.target.value })
                    }
                    placeholder="myapp://path or https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">App Link or custom scheme</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Android Play Store URL
                  </label>
                  <input
                    type="url"
                    value={formData.android_playstore_url}
                    onChange={(e) =>
                      setFormData({ ...formData, android_playstore_url: e.target.value })
                    }
                    placeholder="https://play.google.com/store/apps/..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Fallback if app not installed</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Web Fallback URL *
                  </label>
                  <button
                    type="button"
                    onClick={fillFromYouTubeUrl}
                    className="text-xs text-indigo-600 hover:text-indigo-700"
                  >
                    Quick Fill from YouTube
                  </button>
                </div>
                <input
                  type="url"
                  value={formData.web_fallback}
                  onChange={(e) => handleWebFallbackChange(e.target.value)}
                  placeholder="https://example.com or https://youtube.com/watch?v=..."
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {isYouTubeUrl(formData.web_fallback) && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ YouTube URL detected! Deep links auto-filled.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Creating...' : 'Create Link'}
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Your Links</h2>
          </div>
          {links.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No links yet. Create your first link to get started!
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {links.map((link) => (
                <div key={link.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {link.title || link.slug}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {link.click_count || 0} clicks
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <a
                          href={`${baseUrl}/s/${link.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-700 font-mono"
                        >
                          {baseUrl}/s/{link.slug}
                        </a>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        {link.ios_url && (
                          <div>iOS Deep Link: {link.ios_url}</div>
                        )}
                        {link.ios_appstore_url && (
                          <div>iOS App Store: {link.ios_appstore_url}</div>
                        )}
                        {link.android_url && (
                          <div>Android Deep Link: {link.android_url}</div>
                        )}
                        {link.android_playstore_url && (
                          <div>Android Play Store: {link.android_playstore_url}</div>
                        )}
                        <div>Web: {link.web_fallback}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="ml-4 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

