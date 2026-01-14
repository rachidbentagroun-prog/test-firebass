# PostHog Analytics Implementation Guide

## 📊 Overview

This guide documents the PostHog analytics implementation for the Imagin AI SaaS platform. PostHog tracks user behavior, traffic attribution, signups, and the complete user journey from first visit to conversion.

## 🎯 What's Tracked

### 1. Traffic Attribution
- **UTM Parameters**: All standard UTM parameters are automatically captured and stored
  - `utm_source` - Where the traffic came from (e.g., youtube, tiktok, facebook)
  - `utm_medium` - Marketing medium (e.g., social, cpc, email)
  - `utm_campaign` - Campaign name
  - `utm_term` - Keywords
  - `utm_content` - Ad variant
  
- **Referrer Detection**: Automatically categorizes referrers
  - YouTube (youtube.com, youtu.be)
  - TikTok (tiktok.com)
  - Facebook (facebook.com, fb.com)
  - Google (google.com)
  - Instagram (instagram.com)
  - Twitter/X (twitter.com, x.com)
  - LinkedIn (linkedin.com)
  - Generic referral
  - Direct traffic (no referrer)

- **Landing Pages**: Captures the initial landing page URL for each user

### 2. Signup Events
- **Email Signups**: Tracked when users create account via email/password
- **Google Signups**: Tracked when users sign up via Google OAuth
- **Event Properties**:
  ```javascript
  {
    plan: 'free',           // User's plan
    signup_method: 'email', // 'email' or 'google'
    email: 'user@email.com',
    name: 'User Name',
    is_new_user: true       // For Google signups
  }
  ```

### 3. Login Events
- Tracks when existing users log in
- Differentiates between email and Google login methods
- Associates login with user profile

### 4. Page Views
- Automatically tracks all page navigation
- Captures page path and page name
- Associates views with authenticated users

### 5. User Identification
- Users are identified by their Firebase UID
- User properties include:
  - Email
  - Name
  - Plan (free/premium)
  - Role (user/admin/super_admin)
  - Verification status
  - Authentication provider

## 🏗️ Architecture

### File Structure
```
/services/posthog.ts          # Core PostHog service
/index.tsx                    # PostHog initialization
/App.tsx                      # Page view tracking & user identification
/components/SignUp.tsx        # Signup tracking
/components/AuthModal.tsx     # Login tracking
```

### Implementation Flow

1. **Initialization** (`index.tsx`)
   - PostHog is initialized on app load
   - Runs only on client-side
   - Captures initial traffic attribution

2. **Page View Tracking** (`App.tsx`)
   - Triggered on every route change
   - Includes user context when available

3. **User Authentication** (`App.tsx`)
   - Users identified via Firebase auth state listener
   - PostHog identity synced with Firebase UID
   - Identity reset on logout

4. **Signup/Login Events**
   - Captured in `SignUp.tsx` and `AuthModal.tsx`
   - Fired immediately after successful authentication
   - Includes comprehensive user metadata

## 🔧 Setup Instructions

### 1. Get PostHog API Key

1. Sign up at [posthog.com](https://posthog.com) (or use your self-hosted instance)
2. Create a new project or select existing project
3. Go to **Settings** → **Project Settings**
4. Copy your **Project API Key**
5. Note your **Host URL** (default: `https://app.posthog.com`)

### 2. Configure Environment Variables

Add to your `.env.local` file (or Vercel environment variables):

```bash
VITE_POSTHOG_KEY=phc_your_api_key_here
VITE_POSTHOG_HOST=https://app.posthog.com
```

> **Note**: The `VITE_POSTHOG_HOST` is optional. If not provided, it defaults to `https://app.posthog.com`

### 3. Deploy to Vercel

Add the environment variables in Vercel:
1. Go to your Vercel project
2. Navigate to **Settings** → **Environment Variables**
3. Add both `VITE_POSTHOG_KEY` and `VITE_POSTHOG_HOST`
4. Select all environments (Production, Preview, Development)
5. Save and redeploy

## 📈 Viewing Analytics in PostHog

### Traffic Sources
1. Go to **Insights** → **New Insight**
2. Select event: `traffic_attribution_captured`
3. Break down by: `traffic_source`
4. View by: Unique users or Total count

### Signup Funnel
1. Go to **Funnels**
2. Create funnel:
   - Step 1: `$pageview` (any landing page)
   - Step 2: `sign_up`
3. Break down by `signup_method` to see email vs Google
4. Break down by `utm_source` to see which channels convert best

### User Journey
1. Go to **Recordings**
2. Filter by users who completed `sign_up` event
3. Watch session replays to understand user behavior

### UTM Analysis
1. Go to **Insights** → **Trends**
2. Select event: `sign_up`
3. Break down by:
   - `utm_source` - Which channel
   - `utm_campaign` - Which campaign
   - `utm_medium` - Which medium

### Conversion by Referrer
1. Create a cohort of users with `sign_up` event
2. Group by `referrer` property
3. View conversion rates by traffic source

## 🔍 Key Events Reference

| Event Name | Trigger | Properties |
|------------|---------|------------|
| `traffic_attribution_captured` | First page load with UTM/referrer | traffic_source, utm_*, referrer, landing_page |
| `$pageview` | Every page navigation | path, page_name, user_id, user_email |
| `sign_up` | User creates account | plan, signup_method, email, name |
| `user_login` | User logs in | login_method, email, name |
| `user_logout` | User logs out | - |

## 🎨 Example Queries

### "Show me all signups from YouTube in the last 30 days"
```
Event: sign_up
Filter: traffic_source = 'youtube'
Date range: Last 30 days
```

### "What's my Google Ads conversion rate?"
```
Funnel:
1. $pageview with utm_source = 'google' and utm_medium = 'cpc'
2. sign_up
```

### "Which landing page converts best?"
```
Event: sign_up
Break down by: initial_landing_page
Show as: Conversion rate
```

## 🔐 Privacy & Performance

### Privacy Features
- **Do Not Track**: Respects browser DNT setting
- **Input Masking**: All form inputs are masked in session recordings
- **Sensitive Data**: Add `.sensitive` class to any element to mask it

### Performance Optimizations
- PostHog loads asynchronously (non-blocking)
- Client-side only (no server overhead)
- Minimal bundle size (~30KB gzipped)
- Attribution data persisted via PostHog's built-in storage

## 🧪 Testing

### Local Testing
```bash
# Enable PostHog in development
VITE_POSTHOG_KEY=phc_your_test_key npm run dev
```

1. Open browser console
2. Look for: `PostHog initialized successfully`
3. Navigate between pages and check for `$pageview` events
4. Sign up or log in and verify events in PostHog dashboard

### Testing UTM Parameters
Test different traffic sources:
```
http://localhost:5173/?utm_source=youtube&utm_medium=video&utm_campaign=launch
http://localhost:5173/?utm_source=tiktok&utm_medium=social&utm_campaign=viral
http://localhost:5173/?utm_source=google&utm_medium=cpc&utm_campaign=brand
```

### Verify in PostHog
1. Go to **Activity** tab in PostHog
2. Filter by your test user email
3. Check that all events appear with correct properties

## 🚨 Troubleshooting

### Events Not Appearing

1. **Check API Key**
   ```bash
   echo $VITE_POSTHOG_KEY
   ```
   Should output your PostHog project API key

2. **Check Browser Console**
   - Open DevTools → Console
   - Look for PostHog initialization message
   - Check for errors

3. **Check PostHog Dashboard**
   - Go to **Settings** → **Project Settings** → **Danger Zone**
   - Verify project is active

4. **Check Network Tab**
   - Open DevTools → Network
   - Filter by "posthog"
   - Verify requests are being sent to PostHog

### Attribution Not Working

1. **Clear Browser Data**
   - PostHog stores attribution in cookies
   - Clear cookies and try again with fresh UTM parameters

2. **Check URL Parameters**
   - Verify UTM parameters are correctly formatted
   - Parameters should be lowercase

3. **Verify Traffic Source Logic**
   - Check `services/posthog.ts` → `captureTrafficAttribution()`
   - Add console.logs to debug categorization

### Signup Events Not Firing

1. **Check Import Statements**
   - Verify `trackSignup` is imported in signup components
   - Check for TypeScript errors

2. **Add Debug Logging**
   ```typescript
   console.log('PostHog: Tracking signup', userId, properties);
   trackSignup(userId, properties);
   ```

3. **Verify User ID**
   - Ensure Firebase UID is being passed correctly
   - Check that user object exists before calling track

## 🔄 Migration & Updates

### Updating PostHog
```bash
npm update posthog-js
```

### Adding Custom Events
To track custom events, use the `trackEvent` function:

```typescript
import { trackEvent } from '../services/posthog';

// Track custom event
trackEvent('video_generated', {
  video_length: '10s',
  engine: 'sora2',
  quality: '1080p',
});
```

### Setting User Properties
```typescript
import { setUserProperties } from '../services/posthog';

setUserProperties({
  total_generations: 42,
  subscription_tier: 'premium',
  last_active: new Date().toISOString(),
});
```

## 📞 Support

- **PostHog Docs**: https://posthog.com/docs
- **PostHog Community**: https://posthog.com/community
- **Implementation Issues**: Check browser console and PostHog Activity tab

## ✅ Implementation Checklist

- [x] PostHog installed (`posthog-js`)
- [x] Service created (`services/posthog.ts`)
- [x] Initialized in app entry point (`index.tsx`)
- [x] Page view tracking on navigation (`App.tsx`)
- [x] User identification on auth state change (`App.tsx`)
- [x] Signup tracking (email & Google) (`SignUp.tsx`, `AuthModal.tsx`)
- [x] Login tracking (`AuthModal.tsx`)
- [x] Traffic attribution capture (UTM + referrer)
- [x] Environment variables documented (`.env.example`)
- [x] Privacy features enabled (DNT, input masking)
- [x] Performance optimized (client-side only, async loading)

## 🎉 You're All Set!

Your PostHog analytics is now fully configured. Start collecting data and gain insights into:
- Where your users come from
- Which channels convert best
- User journey from landing to signup
- Feature usage and engagement

Monitor your dashboard at: https://app.posthog.com
