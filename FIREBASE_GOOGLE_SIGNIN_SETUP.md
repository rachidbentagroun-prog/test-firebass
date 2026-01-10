# Firebase Google Sign-In Setup Guide

## Problem: "AUTHENTICATION SERVICE ERROR" or "auth/internal-error"

This error means one of the following is missing:
1. **Google provider not enabled in Firebase Console**
2. **OAuth consent screen not fully configured in Google Cloud**
3. **Your Google account not added as a TEST USER**
4. **Authorized domains not configured**

## Solution: Configure Google Sign-In in Firebase Console

### Step 1: Enable Google Provider
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `image-ai-generator-adf8c`
3. Go to **Authentication** → **Sign-in method**
4. Find **Google** provider
5. Click **Enable** if not already enabled
6. Click **Save**

### Step 2: Configure OAuth Credentials
1. In the **Google** provider settings, you'll see "Web SDK configuration"
2. Click **Get Support Email** or configure the OAuth consent screen
3. This will redirect you to Google Cloud Console

### Step 3: Add Authorized Domains
1. In Firebase Console → **Settings** (gear icon) → **Project Settings**
2. Go to **Authentication** tab
3. Scroll to **Authorized domains**
4. Add your domain:
   - Development: `localhost:3000`
   - Production: Your actual domain (e.g., `imaginai.com`)

### Step 4: Configure OAuth Consent Screen (Google Cloud) ⚠️ CRITICAL
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **OAuth consent screen**
4. If not configured, click **Create** (User Type: External)
5. Fill in:
   - App name: `ImaginAI`
   - User support email: Your email
   - Developer contact email: Your email
6. Click **Save and Continue**
7. **Add Scopes**: Click **Add or remove scopes** → Select `email` and `profile` → Save
8. Click **Save and Continue** again
9. **⚠️ IMPORTANT: Add your Google account as a TEST USER**:
   - In the "Test users" section, click **Add users**
   - Add your Google account email address
   - Click **Add**
10. **⚠️ If you DON'T see "Test users" section**: This means the app is in TESTING mode (good for development)
11. Save the OAuth consent screen configuration

### Step 5: Create OAuth 2.0 Credentials
1. In Google Cloud Console → **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Add Authorized JavaScript origins:
   ```
   http://localhost:3000
   https://yourproduction.com
   ```
5. Add Authorized redirect URIs:
   ```
   http://localhost:3000
   http://localhost:3000/__/auth/callback
   https://yourproduction.com
   https://yourproduction.com/__/auth/callback
   ```
6. Copy the **Client ID** and **Client Secret**

### Step 6: (Optional) Update Firebase Config
If using environment variables:
```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
```

## Troubleshooting

### Check browser console for debug info
Open DevTools (F12) → Console tab. Look for:
- 🔵 Blue messages = Configuration being checked
- ✅ Green messages = Success
- ❌ Red messages = Error details
- ⚠️ Yellow/orange messages = Warnings or fallback attempts

### My specific error: "auth/internal-error"

**This means the OAuth configuration is incomplete. Try EXACTLY these steps:**

1. **Firebase Console:**
   - Go to https://console.firebase.google.com/
   - Select project `image-ai-generator-adf8c`
   - Authentication → Sign-in method
   - **Scroll down to Google provider**
   - Make sure the toggle is **ON** (blue/enabled)
   - Authorized domains: Add `localhost:3000`
   - Save

2. **Google Cloud Console:**
   - Go to https://console.cloud.google.com/
   - Select same project
   - APIs & Services → **OAuth consent screen**
   - You should see either:
     - **TESTING mode** (shows Test users section) ← Current state for you
     - **PUBLISHED mode** (shows but restricted)
   
   - Fill in the form if not complete:
     - App name: ImaginAI
     - User support email: (any email)
     - Developer contact: (any email)
   
   - Add **Test users** (this is the critical missing step):
     - Scroll to "Test users" section
     - Click **Add users**
     - Paste your Google account email
     - Click **Add**
     - Save

3. **Try signing in again**
   - If still fails, check browser console (F12) for the exact error code
   - If you see "redirect" message, the app is using fallback method (this is okay)

### Common Issues:

**"popup blocked"**
- Allow popups for this site in browser settings

**"internal-error" persists**
- Check: Is the Google provider toggle ON in Firebase?
- Check: Is your Google email added as a test user in OAuth consent?
- Try in Incognito mode (private browsing)
- Clear browser cache and try again

**"operation-not-supported"**
- Try a different browser
- Disable browser extensions
- Try Incognito mode

## Quick Checklist

- [ ] Google provider enabled in Firebase Console
- [ ] Authorized domain includes `localhost:3000` (for dev)
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 credentials created
- [ ] Redirect URIs include your domain
- [ ] Test user added to OAuth consent screen
- [ ] Firebase API Key is valid
- [ ] Try in non-private browser window

## Firebase Project Details

- **Project ID**: `image-ai-generator-adf8c`
- **Auth Domain**: `image-ai-generator-adf8c.firebaseapp.com`
- **Current Config Location**: `src/services/firebase.ts`

## Contact Support

If issues persist:
1. Take screenshot of Firebase Console → Authentication → Sign-in method
2. Check browser console for error code
3. Share error details for troubleshooting
