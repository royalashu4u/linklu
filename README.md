# OpenInApp - Smart Link Redirect MVP

A minimal viable product for smart link redirects that automatically sends users to the right app (iOS/Android) or web fallback based on their device.

## Features

- 🚀 Enhanced device detection (iOS/Android/Desktop with browser detection)
- 🔗 Universal Links support (iOS)
- 📱 Android App Links support
- 🏪 App Store & Play Store fallback URLs
- 📊 Enhanced analytics (device, browser, platform, social app detection, UTM tracking)
- 🎨 Dashboard for link management
- 🧠 Smart landing page for social apps (Instagram, WhatsApp, Facebook, LinkedIn)
- 🔄 Smart redirect logic with fallback chains

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Firebase

1. The Firebase configuration is already set up in `lib/firebase.ts` with your project credentials
2. Go to [Firebase Console](https://console.firebase.google.com/) and enable Firestore Database
3. Create the following Firestore collections:

**Collection: `smart_links`**
- Fields:
  - `slug` (string, indexed)
  - `ios_url` (string, optional) - iOS deep link or Universal Link
  - `android_url` (string, optional) - Android deep link or App Link
  - `ios_appstore_url` (string, optional) - iOS App Store fallback
  - `android_playstore_url` (string, optional) - Android Play Store fallback
  - `web_fallback` (string, required) - Web fallback URL
  - `title` (string, optional)
  - `created_at` (timestamp/string)

**Collection: `clicks`**
- Fields:
  - `link_id` (string, indexed)
  - `ua` (string, optional) - User agent
  - `ip` (string, optional)
  - `referrer` (string, optional)
  - `device` (string) - ios/android/desktop
  - `browser` (string) - Browser type
  - `platform` (string) - mobile/tablet/desktop
  - `is_social_app` (boolean) - If opened in social app
  - `utm_source` (string, optional) - UTM tracking
  - `utm_medium` (string, optional)
  - `utm_campaign` (string, optional)
  - `timestamp` (timestamp/string)

4. Set up Firestore Security Rules (for MVP, you can use these permissive rules for testing):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // For MVP only - restrict in production
    }
  }
}
```

**Important:** For production, you should set up proper security rules to restrict access.

### 3. Configure Environment Variables (Optional)

The Firebase config is already hardcoded in `lib/firebase.ts`. If you want to use environment variables, copy `.env.local.example` to `.env.local` and update the values:

```bash
cp .env.local.example .env.local
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Go to `/dashboard` to create a new smart link
2. Fill in:
   - iOS Deep Link (Universal Link or custom scheme)
   - iOS App Store URL (fallback if app not installed)
   - Android Deep Link (App Link or custom scheme)
   - Android Play Store URL (fallback if app not installed)
   - Web Fallback URL (required)
3. Get your short link at `/s/[slug]`
4. The link will automatically:
   - Detect device type (iOS/Android/Desktop)
   - Detect browser (including social apps like Instagram, WhatsApp)
   - Redirect to appropriate URL with smart fallback chain
   - Track analytics with UTM parameters

### Smart Redirect Logic

- **iOS**: Deep Link → App Store → Web Fallback
- **Android**: Deep Link → Play Store → Web Fallback
- **Social Apps**: Shows smart landing page that handles deep links properly
- **UTM Parameters**: Automatically preserved through redirects

## Project Structure

```
/app
  /api/links          # Link CRUD API
  /s/[slug]           # Redirect engine (smart redirects)
  /smart/[slug]       # Smart landing page (for social apps)
  /dashboard          # Dashboard UI
  /.well-known        # Universal Links files
/lib
  firebase.ts         # Firebase client
  db.ts               # Database exports
/utils
  device.ts           # Enhanced device & browser detection
```

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Firebase Firestore
- Tailwind CSS

## Firebase Collections

The app uses two Firestore collections:

1. **smart_links** - Stores all the smart link configurations
2. **clicks** - Stores click analytics data

Make sure to create indexes in Firestore for:
- `smart_links.slug` (for fast lookups)
- `clicks.link_id` (for analytics queries)
