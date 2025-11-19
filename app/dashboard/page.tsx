'use client'

import { useState, useEffect } from 'react'
import { generateDeepLinks, detectPlatform } from '@/lib/url-parser'

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
  const [activeTab, setActiveTab] = useState<'all' | 'socials' | 'favourites'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'clicks'>('newest')
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
  const [detectedPlatform, setDetectedPlatform] = useState<string | null>(null)
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)

  useEffect(() => {
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
    
    if (value && value.startsWith('http')) {
      const platform = detectPlatform(value)
      setDetectedPlatform(platform)
      
      const deepLinks = generateDeepLinks(value)
      if (deepLinks) {
        setFormData({
          ...formData,
          web_fallback: deepLinks.web_fallback,
          ios_url: deepLinks.ios_url || '',
          android_url: deepLinks.android_url || '',
          ios_appstore_url: deepLinks.ios_appstore_url || '',
          android_playstore_url: deepLinks.android_playstore_url || '',
          title: deepLinks.title || formData.title,
        })
      }
    } else {
      setDetectedPlatform(null)
    }
  }

  const fillFromUrl = () => {
    const url = prompt('Enter any URL (YouTube, Instagram, Twitter, TikTok, Spotify, etc.):')
    if (url && url.startsWith('http')) {
      const deepLinks = generateDeepLinks(url)
      if (deepLinks) {
        setFormData({
          ...formData,
          web_fallback: deepLinks.web_fallback,
          ios_url: deepLinks.ios_url || '',
          android_url: deepLinks.android_url || '',
          ios_appstore_url: deepLinks.ios_appstore_url || '',
          android_playstore_url: deepLinks.android_playstore_url || '',
          title: deepLinks.title || '',
        })
        setDetectedPlatform(deepLinks.platform)
      } else {
        alert('Could not parse URL')
      }
    } else if (url) {
      alert('Please enter a valid URL starting with http:// or https://')
    }
  }

  const copyToClipboard = (text: string, slug: string) => {
    navigator.clipboard.writeText(text)
    setCopiedSlug(slug)
    setTimeout(() => setCopiedSlug(null), 2000)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate()
    const month = date.toLocaleString('default', { month: 'short' })
    return `${day} ${month}`
  }

  const getPlatformIcon = (url: string) => {
    const lowerUrl = url.toLowerCase()
    if (lowerUrl.includes('youtube') || lowerUrl.includes('youtu.be')) {
      return '▶️'
    } else if (lowerUrl.includes('linkedin')) {
      return '🔗'
    } else if (lowerUrl.includes('instagram')) {
      return '📷'
    } else if (lowerUrl.includes('twitter') || lowerUrl.includes('x.com')) {
      return '🐦'
    }
    return '🔗'
  }

  const filteredLinks = links.filter(link => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        link.title?.toLowerCase().includes(query) ||
        link.slug.toLowerCase().includes(query) ||
        link.web_fallback.toLowerCase().includes(query)
      )
    }
    return true
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    } else if (sortBy === 'oldest') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    } else {
      return (b.click_count || 0) - (a.click_count || 0)
    }
  })

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Smart Link</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <span>+</span>
              <span>Smart Link</span>
            </button>
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Alert Banner */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-yellow-800">Action required on links</span>
          </div>
          <svg className="w-5 h-5 text-yellow-600 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>

        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {/* User Profile Section */}
            <div className="flex items-center gap-3 mb-6">
              <div className="relative">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <p className="text-sm text-gray-500">{getGreeting()}</p>
                <p className="font-semibold text-gray-900">dev</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                All Links
              </button>
              <button
                onClick={() => setActiveTab('socials')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'socials'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Socials
              </button>
              <button
                onClick={() => setActiveTab('favourites')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'favourites'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Favourites
              </button>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search link"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'clicks')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest Links</option>
                <option value="oldest">Oldest Links</option>
                <option value="clicks">Most Clicks</option>
              </select>
            </div>

            {/* Create Form Modal */}
            {showForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">Create Smart Link</h2>
                      <button
                        onClick={() => setShowForm(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
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
                              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                              placeholder="my-link"
                              required
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="My App Link"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-sm font-medium text-gray-700">
                            URL (Auto-detect) *
                          </label>
                          <button
                            type="button"
                            onClick={fillFromUrl}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            Quick Fill
                          </button>
                        </div>
                        <input
                          type="url"
                          value={formData.web_fallback}
                          onChange={(e) => handleWebFallbackChange(e.target.value)}
                          placeholder="Enter any URL: YouTube, Instagram, Twitter, TikTok, Spotify, etc."
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {detectedPlatform && (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ {detectedPlatform.charAt(0).toUpperCase() + detectedPlatform.slice(1)} detected! Deep links auto-filled.
                          </p>
                        )}
                      </div>

                      <div className="flex gap-4 pt-4">
                        <button
                          type="button"
                          onClick={() => setShowForm(false)}
                          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submitting ? 'Creating...' : 'Create Link'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Links List */}
            {filteredLinks.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <p className="text-gray-500">No links found. Create your first smart link!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLinks.map((link) => (
                  <div key={link.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                        {getPlatformIcon(link.web_fallback)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {link.title || 'Untitled Link'}
                            </h3>
                            <p className="text-sm text-gray-500">{formatDate(link.created_at)}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">
                              {link.click_count || 0} Clicks
                            </span>
                            <div className="relative">
                              <button className="text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-blue-600 font-mono">
                            {baseUrl}/s/{link.slug}
                          </span>
                          <button
                            onClick={() => copyToClipboard(`${baseUrl}/s/${link.slug}`, link.slug)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {copiedSlug === link.slug ? (
                              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-80 space-y-6">
            {/* How it works */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">How it works?</h3>
                <div className="flex gap-2">
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">Convert your Instagram Followers to YouTube</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button className="w-full px-4 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Book a Call</span>
              </button>
              <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
                <span>Get App</span>
              </button>
              <button className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span>Let&apos;s Chat</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
