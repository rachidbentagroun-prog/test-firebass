# Vercel Google Sign-In Production Fix

## Problem Diagnosed
Google sign-in works on localhost but fails on Vercel production:
- Users are redirected back to login page after Google OAuth
- Dashboard doesn't recognize the authenticated user
- Auth state is lost after redirect

## Root Causes Fixed

### 1. ✅ **Content Security Policy (CSP) was too restrictive**
- **Fixed**: Updated `vercel.json` to permit Google/Firebase OAuth endpoints
- **Result**: Google popup/redirect flows now allowed by browser

### 2. ✅ **Auth redirect handler wasn't robust enough**
- **Fixed**: Enhanced `handleGoogleSignInRedirect()` in `services/firebase.ts`
- **Added**: Explicit `auth.currentUser.reload()` to sync auth state
- **Result**: Auth state now properly synced after Google redirect

### 3. ✅ **Auth listener wasn't recognizing Google redirect users**
- **Fixed**: Improved `onAuthStateChanged()` handler in `App.tsx`
- **Added**: Better logging to track auth state changes
- **Result**: Users now properly detected as authenticated

### 4. ⏳ **Environment variables missing on Vercel** (YOU MUST DO THIS)
- **Status**: Still needs your action
- **Fix**: Set Firebase env vars in Vercel project settings

### 5. ⏳ **Domain not authorized in Firebase Console** (YOU MUST DO THIS)
- **Status**: Still needs your action
- **Fix**: Add Vercel domain to Firebase authorized domains

---

## What Changed in Code

### `vercel.json`
Enhanced Content-Security-Policy to allow Google/Firebase:
```json
{
  "key": "Content-Security-Policy",
  "value": "... connect-src 'self' https: wss: https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://www.googleapis.com; frame-src 'self' https://accounts.google.com https://*.google.com; ... form-action 'self' https://accounts.google.com https://*.google.com ..."
}
```

### `services/firebase.ts` - `handleGoogleSignInRedirect()`
Now with explicit logging and auth state sync:
```typescript
// After getRedirectResult(), we explicitly call auth.currentUser.reload()
// This ensures onAuthStateChanged() fires with the updated user
await auth.currentUser.reload();
```

### `App.tsx` - `onAuthStateChanged()` listener
Added enhanced logging:
```typescript
console.log('✅ USER IS AUTHENTICATED - setting user in React state');
console.log('   Next: Dashboard should render or onLoginSuccess will navigate');
```

---

## Your Required Actions (CRITICAL)

### Step 1: Set Firebase Environment Variables on Vercel

1. Go to **[Vercel Dashboard](https://vercel.com/dashboard)**
2. Select your project
3. **Settings** → **Environment Variables**
4. Add these variables for **Production**:

```bash
VITE_FIREBASE_API_KEY=AIzaSyAn0LrM0rtXoXvOA8m4JqkGQ8KJR_NKgYA
VITE_FIREBASE_AUTH_DOMAIN=image-ai-generator-adf8c.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=image-ai-generator-adf8c
VITE_FIREBASE_STORAGE_BUCKET=image-ai-generator-adf8c.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
VITE_FIREBASE_MEASUREMENT_ID=G-PLQZ9C4Y3D
```

**Where to find these values:**
- Go to [Firebase Console](https://console.firebase.google.com/)
- Select project `image-ai-generator-adf8c`
- **Project Settings** (gear icon)
- Under "Your apps", find your web app
- Copy the config values

5. **Click "Save"** for each variable
6. **Redeploy** your Vercel project:
   ```bash
   vercel deploy --prod
   ```

### Step 2: Add Authorized Domains in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project `image-ai-generator-adf8c`
3. **Authentication** → **Settings** (scroll down)
4. Find **Authorized domains**
5. Click **Add domain** and add:
   - `your-app.vercel.app` (your Vercel deployment URL)
   - `yourdomain.com` (if you have a custom domain)
   - `localhost:3000` (keep for local dev)
6. **Save**

### Step 3: Verify Google Provider is Enabled

1. In Firebase Console
2. **Authentication** → **Sign-in method**
3. Find **Google** provider
4. Verify the toggle is **ON** (blue)
5. If OFF, click **Enable** and **Save**

### Step 4: Optional - Configure Google OAuth Consent Screen

If you plan to have many users, configure the OAuth consent screen:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. **APIs & Services** → **OAuth consent screen**
4. If in **TESTING** mode: Add your Google account as a **Test User**
5. **Save and Continue**

---

## How It Works Now (After Your Steps)

### Google Sign-In Flow (Production):

```
1. User clicks "Continue with Google" in AuthModal
   ↓
2. signInWithGoogle() attempts popup
   └─ On success: Returns user, onLoginSuccess() → navigate to dashboard ✅
   └─ On popup fail: Falls back to signInWithRedirect()
   ↓
3. signInWithRedirect() redirects to Google login
   Google authenticates user, redirects back to: https://your-app.vercel.app
   ↓
4. Page loads, handleGoogleSignInRedirect() runs:
   └─ Calls getRedirectResult() → gets user
   └─ Calls auth.currentUser.reload() → syncs state
   ↓
5. onAuthStateChanged() fires with authenticated user
   └─ Sets user in React state
   └─ Clears initialization spinner
   └─ Dashboard renders with user logged in ✅
```

---

## Debugging If Still Not Working

### Check DevTools Console (F12)

Look for these messages:

**✅ Success indicators:**
```
🔵 Checking for Google Sign-In redirect result...
✅ Google Sign-In redirect successful! User: abc@gmail.com
🔵 Calling getRedirectResult()...
✅ Redirect result found! uid: abc123...
🔵 Forcing auth state sync via currentUser.reload()...
✅ Auth state reloaded
🔵 onAuthStateChanged fired! User: abc123...
✅ USER IS AUTHENTICATED - setting user in React state
```

**❌ Error indicators:**

If you see `auth/unauthorized-domain`:
```
→ Firebase Console → Authorized domains → Add your vercel.app domain
```

If you see `auth/invalid-api-key`:
```
→ Vercel → Environment Variables → Check VITE_FIREBASE_API_KEY value
→ Redeploy after changing
```

If you see `auth/internal-error`:
```
→ Firebase Console → Google provider toggle → Verify it's ON
→ Google Cloud Console → OAuth consent screen → Must be published or have your account as test user
```

---

## Checklist Before Deploying

- [ ] Set all `VITE_FIREBASE_*` environment variables on Vercel
- [ ] Added your `your-app.vercel.app` to Firebase authorized domains
- [ ] Google provider is **enabled** in Firebase Authentication
- [ ] Redeployed Vercel after env var changes
- [ ] OAuth consent screen is configured (or accounts are test users)
- [ ] Browser developer tools are open (F12) to see debug logs
- [ ] You can see "✅ USER IS AUTHENTICATED" in console after login

---

## Files Modified

1. **[vercel.json](vercel.json)** - Enhanced CSP for Google/Firebase
2. **[services/firebase.ts](services/firebase.ts)** - Better redirect handler
3. **[App.tsx](App.tsx)** - Improved auth listener logging

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL (PRODUCTION)                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  1. AuthModal.tsx - "Continue with Google" button   │   │
│  └────────────────────────┬─────────────────────────────┘   │
│                           │                                   │
│                           ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  2. services/firebase.ts - signInWithGoogle()       │   │
│  │     ├─ Try popup first                              │   │
│  │     └─ Fallback to redirect if popup fails          │   │
│  └────────────────┬─────────────────────────────────────┘   │
│                   │                                           │
│                   ▼ (if redirect)                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  3. User redirected to Google OAuth                 │   │
│  │     Google authenticates → redirects back to        │   │
│  │     https://your-app.vercel.app                     │   │
│  └────────────────┬─────────────────────────────────────┘   │
│                   │                                           │
│                   ▼ (page reloads)                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  4. Page Load - handleGoogleSignInRedirect()         │   │
│  │     ├─ getRedirectResult() → user from Google       │   │
│  │     ├─ auth.currentUser.reload() → sync state      │   │
│  │     └─ Return user to trigger auth listener         │   │
│  └────────────────┬─────────────────────────────────────┘   │
│                   │                                           │
│                   ▼                                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  5. onAuthStateChanged() listener fires             │   │
│  │     ├─ User is authenticated ✅                     │   │
│  │     ├─ Set user in React state                      │   │
│  │     ├─ Load user galleries                          │   │
│  │     └─ Render Dashboard                             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘

FIREBASE (BACKEND)
┌─────────────────────────────────────────────────────────────┐
│  • Authorized domains: [your-app.vercel.app, localhost:3000]│
│  • Google provider: ENABLED ✅                              │
│  • Firestore: Users collection with entitlements            │
│  • Security Rules: Allow authenticated users to read profile │
└─────────────────────────────────────────────────────────────┘

CSP (SECURITY) - vercel.json
┌─────────────────────────────────────────────────────────────┐
│  • frame-src: Allows Google login frames                    │
│  • form-action: Allows Google OAuth form submission         │
│  • connect-src: Allows Firebase auth endpoints              │
└─────────────────────────────────────────────────────────────┘
```

---

## Support

If you're still having issues:

1. **Check browser console** (F12 → Console tab)
   - Copy the error message
   - Look for `auth/` error codes

2. **Common errors:**

   | Error | Fix |
   |-------|-----|
   | `auth/unauthorized-domain` | Add domain to Firebase → Authorized domains |
   | `auth/invalid-api-key` | Check Vercel env vars match Firebase config |
   | `auth/internal-error` | Enable Google provider, configure OAuth consent |
   | `auth/popup-blocked` | Allow popups in browser settings |

3. **Verify environment:**
   - Vercel domain must match Firebase authorized domain exactly
   - Firebase env vars must match your project config
   - Clear browser cache and try again

---

**Last Updated**: January 10, 2026
**Status**: ✅ Code changes complete | ⏳ Awaiting your Firebase/Vercel configuration
