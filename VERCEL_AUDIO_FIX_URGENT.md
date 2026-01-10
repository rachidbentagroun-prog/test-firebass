# 🚨 URGENT: Vercel Audio Fix - Configuration Required

## ⚠️ CRITICAL STEPS - DO THIS NOW!

Your audio generation is now using secure serverless API routes, but they **REQUIRE** environment variables to be configured in Vercel.

### 🔧 Step 1: Add Environment Variables in Vercel

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project**: `test-firebass`
3. **Go to**: Settings → Environment Variables
4. **Add these variables**:

```
Variable Name: API_KEY
Value: [Your Google Gemini API Key]
Environment: Production, Preview, Development
```

```
Variable Name: ELEVENLABS_API_KEY  
Value: [Your ElevenLabs API Key]
Environment: Production, Preview, Development
```

### 🚀 Step 2: Redeploy

**CRITICAL**: After adding environment variables, you **MUST** redeploy:

1. Go to: Deployments tab
2. Click the "..." menu on the latest deployment
3. Click **"Redeploy"**
4. Wait 1-3 minutes for deployment to complete

**OR** use CLI:
```bash
vercel --prod
```

### 📍 API Routes Created

Two new serverless functions have been deployed:

1. `/api/tts-elevenlabs` - Handles ElevenLabs TTS (returns audio/mpeg)
2. `/api/tts-gemini` - Handles Google Gemini TTS (returns audio/wav)

### 🔍 How to Debug

After redeployment, go to: https://test-firebass.vercel.app/AI-Voice

Open **Browser Console** (F12) and try generating audio. You'll see:

#### ✅ If Working:
```
🎙️ ElevenLabs: Starting voice generation via API route...
📡 Calling /api/tts-elevenlabs...
📥 Response received: { status: 200, contentType: 'audio/mpeg', contentLength: '45632' }
📥 Converting response to blob...
✅ Blob created: { size: 45632, type: 'audio/mpeg' }
```

#### ❌ If API Keys Missing:
```
📡 Calling /api/tts-elevenlabs...
📥 Response received: { status: 500, contentType: 'application/json' }
❌ API route error: { status: 500, error: 'ElevenLabs API key not configured' }
```

### 🔐 Security Benefits

✅ API keys are now server-side only (never exposed to client)
✅ No API keys visible in browser DevTools
✅ Proper binary audio transfer without corruption
✅ Correct Content-Type headers
✅ Production-ready serverless architecture

### 📋 Checklist

- [ ] Add `API_KEY` in Vercel environment variables
- [ ] Add `ELEVENLABS_API_KEY` in Vercel environment variables
- [ ] Redeploy the application
- [ ] Test audio generation in production
- [ ] Check browser console for detailed logs
- [ ] Verify narrator preview works
- [ ] Confirm downloaded audio has sound

### 🆘 If Still Not Working

Check the browser console logs and look for:
1. **404 errors** → API routes not deployed (wait 1-3 min)
2. **500 errors with "not configured"** → Environment variables missing
3. **Empty blob (size: 0)** → API returned no data
4. **CORS errors** → Should not happen with same-origin API routes

### 📞 API Route Endpoints

**Production URLs:**
- https://test-firebass.vercel.app/api/tts-elevenlabs
- https://test-firebass.vercel.app/api/tts-gemini

Test with curl (after adding env vars):
```bash
curl -X POST https://test-firebass.vercel.app/api/tts-elevenlabs \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world","voice":"Rachel"}' \
  --output test.mp3
```

If this works and produces a valid audio file, the API is working!

---

## 🎯 Summary

**What Changed:**
- Audio generation now happens server-side via Vercel serverless functions
- API keys are secure and never exposed to the client
- Binary audio data is handled correctly without corruption

**What You Need to Do:**
1. Add environment variables in Vercel
2. Redeploy
3. Test audio generation

**Estimated Time:** 5 minutes

🚀 Once environment variables are added and redeployed, audio will work perfectly!
