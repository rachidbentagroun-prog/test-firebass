# 🚀 PostHog Analytics - Quick Reference

## 📦 Installation
```bash
npm install posthog-js
```

## 🔑 Environment Variables
```bash
VITE_POSTHOG_KEY=phc_your_api_key_here
VITE_POSTHOG_HOST=https://app.posthog.com
```

## 📊 Key Events

| Event | When Fired | Where |
|-------|-----------|-------|
| `traffic_attribution_captured` | First visit with UTM/referrer | `services/posthog.ts` |
| `$pageview` | Every page navigation | `App.tsx` |
| `sign_up` | New user signup | `SignUp.tsx`, `AuthModal.tsx` |
| `user_login` | User login | `AuthModal.tsx` |
| `user_logout` | User logout | `App.tsx` |

## 🎯 Traffic Sources Auto-Detected
- YouTube → `youtube.com`, `youtu.be`
- TikTok → `tiktok.com`
- Facebook → `facebook.com`, `fb.com`
- Google → `google.com`
- Instagram → `instagram.com`
- Twitter/X → `twitter.com`, `x.com`
- LinkedIn → `linkedin.com`
- Direct (no referrer)
- Referral (other domains)

## 🔧 Core Functions

```typescript
import { 
  trackPageView,
  trackSignup,
  trackLogin,
  trackEvent,
  identifyUser,
  setUserProperties,
  resetPostHogIdentity 
} from './services/posthog';

// Track page view
trackPageView('/dashboard', { custom_prop: 'value' });

// Track signup
trackSignup(userId, {
  email: 'user@email.com',
  plan: 'free',
  signup_method: 'email'
});

// Track login
trackLogin(userId, {
  email: 'user@email.com',
  login_method: 'google'
});

// Track custom event
trackEvent('video_generated', {
  engine: 'sora2',
  duration: '10s'
});

// Identify user
identifyUser(userId, {
  email: 'user@email.com',
  name: 'John Doe',
  plan: 'premium'
});

// Set user properties
setUserProperties({
  total_videos: 10,
  subscription_tier: 'premium'
});

// Reset on logout
resetPostHogIdentity();
```

## 🧪 Testing URLs

```bash
# YouTube campaign
/?utm_source=youtube&utm_medium=video&utm_campaign=launch

# TikTok campaign
/?utm_source=tiktok&utm_medium=social&utm_campaign=viral

# Google Ads
/?utm_source=google&utm_medium=cpc&utm_campaign=brand

# Facebook Ads
/?utm_source=facebook&utm_medium=social&utm_campaign=retargeting
```

## 📈 Common Queries in PostHog

### Signups by Source
```
Event: sign_up
Break down by: traffic_source
Date range: Last 30 days
```

### Conversion Funnel
```
Funnel:
1. $pageview
2. sign_up
Break down by: utm_source
```

### User Journey
```
Recordings → Filter by: sign_up event
View session replays
```

## 🔍 Quick Debug

```javascript
// Check if PostHog is loaded
console.log(window.posthog);

// Check current user
window.posthog?.get_distinct_id();

// Manual event
window.posthog?.capture('test_event', { foo: 'bar' });
```

## 🚨 Troubleshooting

1. **Events not showing?**
   - Check API key in `.env.local`
   - Verify key starts with `phc_`
   - Check browser console for errors

2. **Attribution not working?**
   - Clear browser cookies
   - Test with fresh incognito window
   - Verify UTM parameters in URL

3. **Users not identified?**
   - Check Firebase auth state
   - Verify `identifyUser()` is called
   - Check PostHog Activity tab

## 📱 Files Modified

- `services/posthog.ts` - Core service
- `index.tsx` - Initialization
- `App.tsx` - Page views & user ID
- `components/SignUp.tsx` - Signup tracking
- `components/AuthModal.tsx` - Login tracking
- `.env.example` - Environment variables

## 🎯 Implementation Status

✅ PostHog installed  
✅ Traffic attribution  
✅ Signup tracking (email & Google)  
✅ Login tracking  
✅ Page view tracking  
✅ User identification  
✅ Logout reset  
✅ UTM parameter capture  
✅ Referrer detection  
✅ Privacy features (DNT, masking)  

## 🔗 Resources

- PostHog Dashboard: https://app.posthog.com
- PostHog Docs: https://posthog.com/docs
- Full Guide: `POSTHOG_ANALYTICS_GUIDE.md`

---

**Ready to deploy!** 🚀
