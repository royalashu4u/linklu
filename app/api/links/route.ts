import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { collection, query, getDocs, addDoc, orderBy, where, getCountFromServer, doc, getDoc } from 'firebase/firestore'

// GET - List all links
export async function GET() {
  try {
    const linksRef = collection(db, 'smart_links')
    const q = query(linksRef, orderBy('created_at', 'desc'))
    const querySnapshot = await getDocs(q)

    const links = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))

    // Get click counts for each link
    const linksWithCounts = await Promise.all(
      links.map(async (link) => {
        const clicksRef = collection(db, 'clicks')
        const clicksQuery = query(clicksRef, where('link_id', '==', link.id))
        const clicksSnapshot = await getCountFromServer(clicksQuery)
        
        return {
          ...link,
          click_count: clicksSnapshot.data().count || 0,
        }
      })
    )

    return NextResponse.json(linksWithCounts)
  } catch (error) {
    console.error('Error fetching links:', error)
    return NextResponse.json(
      { error: 'Failed to fetch links' },
      { status: 500 }
    )
  }
}

// POST - Create a new link
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { 
      slug, 
      ios_url, 
      android_url, 
      ios_appstore_url,
      android_playstore_url,
      web_fallback, 
      title 
    } = body

    if (!slug || !web_fallback) {
      return NextResponse.json(
        { error: 'Slug and web_fallback are required' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const linksRef = collection(db, 'smart_links')
    const slugQuery = query(linksRef, where('slug', '==', slug))
    const slugSnapshot = await getDocs(slugQuery)

    if (!slugSnapshot.empty) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 409 }
      )
    }

    // Create new link
    const docRef = await addDoc(collection(db, 'smart_links'), {
      slug,
      ios_url: ios_url || null,
      android_url: android_url || null,
      ios_appstore_url: ios_appstore_url || null,
      android_playstore_url: android_playstore_url || null,
      web_fallback,
      title: title || null,
      created_at: new Date().toISOString(),
    })

    // Fetch the created document
    const newDoc = await getDoc(docRef)
    const data = { id: docRef.id, ...newDoc.data() }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating link:', error)
    return NextResponse.json(
      { error: 'Failed to create link' },
      { status: 500 }
    )
  }
}
