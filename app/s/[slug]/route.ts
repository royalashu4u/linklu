import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getDeviceInfo, isSocialApp } from '@/utils/device'
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params

  try {
    // Fetch the link from Firestore
    const linksRef = collection(db, 'smart_links')
    const q = query(linksRef, where('slug', '==', slug))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    const linkDoc = querySnapshot.docs[0]
    const link = { id: linkDoc.id, ...linkDoc.data() } as any

    // Get request info
    const userAgent = req.headers.get('user-agent') || ''
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown'
    const referrer = req.headers.get('referer') || null
    
    // Get URL search params for UTM tracking
    const url = new URL(req.url)
    const utmParams: Record<string, string> = {}
    url.searchParams.forEach((value, key) => {
      if (key.startsWith('utm_')) {
        utmParams[key] = value
      }
    })

    // Get device info
    const deviceInfo = getDeviceInfo(userAgent)

    // Log click analytics (non-blocking)
    addDoc(collection(db, 'clicks'), {
      link_id: link.id,
      ua: userAgent,
      ip: ip,
      referrer: referrer,
      device: deviceInfo.device,
      browser: deviceInfo.browser,
      platform: deviceInfo.platform,
      is_social_app: deviceInfo.isSocialApp,
      utm_source: utmParams.utm_source || null,
      utm_medium: utmParams.utm_medium || null,
      utm_campaign: utmParams.utm_campaign || null,
      timestamp: new Date().toISOString(),
    }).catch(() => {
      // Silently fail analytics
    })

    // Smart redirect logic - ALL mobile devices need client-side deep link handling
    // Server-side redirects to custom schemes (vnd.youtube://, linkedin://) don't work
    // So we use the smart landing page for all mobile devices
    
    // For mobile devices (iOS/Android), always use smart landing page for deep link handling
    if (deviceInfo.device === 'ios' || deviceInfo.device === 'android') {
      // Redirect to smart landing page that handles deep links client-side
      const smartPageUrl = new URL(`/smart/${slug}`, req.url)
      // Preserve UTM parameters
      Object.entries(utmParams).forEach(([key, value]) => {
        smartPageUrl.searchParams.set(key, value)
      })
      return NextResponse.redirect(smartPageUrl)
    }
    
    // Desktop: Use web fallback directly
    let redirectUrl = link.web_fallback

    // Preserve UTM parameters in redirect URL (only for web URLs)
    if (Object.keys(utmParams).length > 0 && redirectUrl.startsWith('http')) {
      const redirectUrlObj = new URL(redirectUrl)
      Object.entries(utmParams).forEach(([key, value]) => {
        redirectUrlObj.searchParams.set(key, value)
      })
      redirectUrl = redirectUrlObj.toString()
    }

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('Redirect error:', error)
    return NextResponse.redirect(new URL('/', req.url))
  }
}
