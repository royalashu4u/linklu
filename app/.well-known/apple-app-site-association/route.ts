import { NextResponse } from 'next/server'

// Static iOS Universal Links configuration
// For MVP, this is a single app configuration
// In production, you'd make this dynamic based on the domain
export async function GET() {
  const json = {
    applinks: {
      details: [
        {
          // Replace with your actual iOS Team ID and Bundle ID
          // Format: {TEAM_ID}.{BUNDLE_ID}
          appID: 'TEAM_ID.BUNDLE_ID',
          paths: ['/s/*'],
        },
      ],
    },
  }

  return new NextResponse(JSON.stringify(json), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

