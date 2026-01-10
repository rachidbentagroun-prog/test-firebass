# Production Google Sign-In Debug Checklist

## Test on: https://test-firebass.vercel.app/

### Step 1: Check Firebase Config is Loading
1. Open DevTools Console (F12)
2. Look for: `🔧 Firebase Configuration:`
3. Verify these values:
   - `authDomain: "image-ai-generator-adf8c.firebaseapp.com"`
   - `projectId: "image-ai-generator-adf8c"`
   - `apiKeyExists: true`
   - `isProduction: true`
   - `currentUrl: "https://test-firebass.vercel.app/"`

### Step 2: Check Auth Persistence
Look for: `🔒 Firebase Auth persistence set to browserLocalPersistence`

### Step 3: Test Google Sign-In Flow
1. Click "Continue with Google" or "Sign In"
2. Complete Google OAuth in popup/redirect
3. **Watch console for these SUCCESS indicators:**

```
✅ Expected Success Flow:
🔵 Checking for Google Sign-In redirect result...
✅ Google Sign-In redirect successful! User: your@email.com
🎯 FORCING NAVIGATION TO DASHBOARD after Google OAuth
🔄 Replacing URL from / to /AI-Image
🔵 Calling getRedirectResult()...
✅ Redirect result found! uid: abc123...
🔵 Forcing auth state sync via currentUser.reload()...
✅ Auth state reloaded
🔵 onAuthStateChanged fired! User: abc123...
✅ USER IS AUTHENTICATED - setting user in React state
🎯 Auth listener forcing navigation to dashboard (current page: home)
```

### Step 4: Check for ERROR Indicators

❌ **Common Errors:**

**Error: `auth/unauthorized-domain`**
```
Solution: Firebase Console → Authentication → Settings → Authorized domains
Add: test-firebass.vercel.app
```

**Error: `auth/invalid-api-key`**
```
Solution: Vercel → Project Settings → Environment Variables
Check: VITE_FIREBASE_API_KEY = AIzaSyAn0LrM0rtXoXvOA8m4JqkGQ8KJR_NKgYA
Then: Redeploy
```

**Error: `auth/popup-blocked`**
```
Normal - will fallback to redirect automatically
Look for: "🔄 Popup blocked - falling back to redirect"
```

**Error: User authenticated but stays on home page**
```
Check console for:
- "🎯 FORCING NAVIGATION TO DASHBOARD" (should appear)
- "🎯 Auth listener forcing navigation to dashboard" (should appear)
If missing, there's a timing issue or state race
```

### Step 5: Verify Dashboard Access
After Google sign-in completes:
- ✅ URL should be: `https://test-firebass.vercel.app/AI-Image`
- ✅ Navbar should show user email/name
- ✅ Login/Signup buttons should disappear
- ✅ Dashboard content should render
- ✅ No auth modal should appear

### Step 6: Verify Session Persistence
1. Refresh the page (F5)
2. You should:
   - ✅ Stay logged in
   - ✅ Still be on dashboard or redirected to dashboard
   - ✅ See your user info in navbar

### Step 7: Common Issues & Solutions

**Issue: Redirects back to home with auth modal**
- Timing issue - check if `google_signin_completed` flag is being set/read
- Console should show: "🔵 Detected completed Google sign-in - starting on dashboard"

**Issue: Gets stuck in redirect loop**
- Check Network tab for repeated redirects to `accounts.google.com`
- Likely: Domain not authorized in Firebase

**Issue: "Cannot read properties of null" errors**
- Auth state not persisting across redirect
- Check `browserLocalPersistence` is logging success

**Issue: Navbar shows "Sign In" after successful login**
- User state not being set in React
- Check: "✅ USER IS AUTHENTICATED - setting user in React state"

### Step 8: Vercel Environment Variables Check

Go to Vercel Dashboard → test-firebass → Settings → Environment Variables

Verify these are set for **Production**:
```
VITE_FIREBASE_API_KEY = AIzaSyAn0LrM0rtXoXvOA8m4JqkGQ8KJR_NKgYA
VITE_FIREBASE_AUTH_DOMAIN = image-ai-generator-adf8c.firebaseapp.com
VITE_FIREBASE_PROJECT_ID = image-ai-generator-adf8c
VITE_FIREBASE_STORAGE_BUCKET = image-ai-generator-adf8c.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID = 542889738426
VITE_FIREBASE_APP_ID = 1:542889738426:web:dc69859ebfaae6d2b4c283
VITE_FIREBASE_MEASUREMENT_ID = G-PLQZ9C4Y3D
```

**After changing env vars, you MUST redeploy!**

### Step 9: Firebase Console Check

1. Go to: https://console.firebase.google.com/
2. Select project: `image-ai-generator-adf8c`
3. Authentication → Settings → Authorized domains
4. Verify these domains are listed:
   - ✅ `localhost` (for local dev)
   - ✅ `test-firebass.vercel.app` (CRITICAL)
   - ✅ Any custom domain you use

5. Authentication → Sign-in method → Google
6. Verify toggle is **ENABLED** (blue)

### Step 10: Check Latest Deployment

Vercel Dashboard → Deployments tab
- Latest commit should be: `b682cd7` (auth race condition fix)
- Build status should be: ✅ Ready
- If still building: Wait for completion before testing

---

## Quick Test Script

Run this in browser console on production:
```javascript
// Check auth state
console.log('Auth:', window.firebase?.auth);
console.log('Current User:', window.firebase?.auth?.currentUser);

// Check localStorage
console.log('post_login_target:', localStorage.getItem('post_login_target'));
console.log('google_signin_completed:', localStorage.getItem('google_signin_completed'));
```

---

## Report Back With:
1. Full console logs from sign-in attempt
2. Network tab showing any failed requests
3. Current URL after sign-in attempt
4. Whether user info appears in navbar
