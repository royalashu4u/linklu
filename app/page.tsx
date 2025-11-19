import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          OpenInApp
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Smart link redirects for iOS, Android, and Web
        </p>
        <Link
          href="/dashboard"
          className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}

