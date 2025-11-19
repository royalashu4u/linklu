import { NextResponse } from 'next/server'

// Static Android App Links configuration
// For MVP, this is a single app configuration
// In production, you'd make this dynamic based on the domain
export async function GET() {
  const json = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        // Replace with your actual Android package name
        package_name: 'com.example.app',
        // Replace with your actual SHA-256 certificate fingerprint
        sha256_cert_fingerprints: [
          'SHA256_CERT_FINGERPRINT_HERE',
        ],
      },
    },
  ]

  return NextResponse.json(json, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

