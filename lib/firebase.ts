import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getAnalytics, Analytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAfXw4ScV2FpzGHhJz3i8MnTLZ4iaEl-tI",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "openinapp-49c9e.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "openinapp-49c9e",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "openinapp-49c9e.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "116333303226",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:116333303226:web:93a4ae5737ae82d68bb983",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-QHZ79E2XL3"
}

// Initialize Firebase
let app: FirebaseApp
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig)
} else {
  app = getApps()[0]
}

// Initialize Firestore
export const db: Firestore = getFirestore(app)

// Initialize Analytics (only in browser)
export const getAnalyticsInstance = (): Analytics | null => {
  if (typeof window !== 'undefined') {
    return getAnalytics(app)
  }
  return null
}

// Database types
export interface SmartLink {
  id: string
  slug: string
  ios_url: string | null
  android_url: string | null
  ios_appstore_url: string | null
  android_playstore_url: string | null
  web_fallback: string
  title: string | null
  created_at: string
}

export interface Click {
  id: string
  link_id: string
  ua: string | null
  ip: string | null
  referrer: string | null
  timestamp: string
}

