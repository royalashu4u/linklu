import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { collection, doc, getDoc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore'

// PUT - Update a link
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
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

    // Check if link exists
    const linkRef = doc(db, 'smart_links', id)
    const linkSnap = await getDoc(linkRef)

    if (!linkSnap.exists()) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }

    const existingData = linkSnap.data()

    // If slug is being changed, check if new slug exists
    if (slug && slug !== existingData.slug) {
      const linksRef = collection(db, 'smart_links')
      const slugQuery = query(linksRef, where('slug', '==', slug))
      const slugSnapshot = await getDocs(slugQuery)

      if (!slugSnapshot.empty) {
        return NextResponse.json(
          { error: 'Slug already exists' },
          { status: 409 }
        )
      }
    }

    // Update the link
    const updateData: any = {}
    if (slug) updateData.slug = slug
    if (ios_url !== undefined) updateData.ios_url = ios_url || null
    if (android_url !== undefined) updateData.android_url = android_url || null
    if (ios_appstore_url !== undefined) updateData.ios_appstore_url = ios_appstore_url || null
    if (android_playstore_url !== undefined) updateData.android_playstore_url = android_playstore_url || null
    if (web_fallback) updateData.web_fallback = web_fallback
    if (title !== undefined) updateData.title = title || null

    await updateDoc(linkRef, updateData)

    // Fetch updated document
    const updatedSnap = await getDoc(linkRef)
    const data = { id: updatedSnap.id, ...updatedSnap.data() }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating link:', error)
    return NextResponse.json(
      { error: 'Failed to update link' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a link
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const linkRef = doc(db, 'smart_links', id)
    await deleteDoc(linkRef)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting link:', error)
    return NextResponse.json(
      { error: 'Failed to delete link' },
      { status: 500 }
    )
  }
}
