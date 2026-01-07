# Video Carousel - Environment & Deployment Setup

## Quick Reference: What You Need

```bash
# 1. Environment Variables (.env.local)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 2. Packages to install
npm install axios  # For downloading from Drive

# 3. Supabase Setup
# - Create project at supabase.com
# - Create "ai-video-previews" bucket (Public)
# - Copy credentials above

# 4. Run migration (one time)
node scripts/download-drive-videos.js

# 5. Update HomeLanding.tsx with video URLs
# 6. Test locally
npm run dev

# 7. Deploy
npm run build && git push
```

---

## Step 1: Supabase Setup (5 minutes)

### Create Account & Project
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create new project:
   - Name: `imaginai` (or your project name)
   - Database password: Strong password
   - Region: Closest to your users (e.g., us-east-1)
4. Wait 2-3 minutes for creation

### Get Credentials
1. Go to project → Settings → API
2. Copy these:
   ```
   Project URL: https://[PROJECT_ID].supabase.co
   anon public key: eyJhbGc...
   ```

### Create Storage Bucket
1. Go to project → Storage
2. Click "Create new bucket"
3. Settings:
   - Name: `ai-video-previews`
   - **Public** (important!)
4. Click "Create bucket"

---

## Step 2: Local Environment Setup

### Create `.env.local`
```bash
# In project root
cat > .env.local << 'EOF'
# Supabase
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EOF
```

### Install Dependencies
```bash
npm install axios
```

---

## Step 3: Migrate Videos

### Prepare Videos (Optional - Optimization)
```bash
# Install FFmpeg if you want to compress
brew install ffmpeg  # macOS
apt-get install ffmpeg  # Ubuntu
choco install ffmpeg  # Windows

# Compress each video (highly recommended)
ffmpeg -i original.mp4 \
  -vcodec libx264 \
  -crf 23 \
  -preset medium \
  -vf "scale=1080:-1" \
  -c:a aac -b:a 128k \
  optimized.mp4

# Before: 500MB → After: 20MB ✅
```

### Run Migration Script
```bash
node scripts/download-drive-videos.js

# Output:
# ⬇️  Downloading: preview-1.mp4...
# ✅ Downloaded: preview-1.mp4
# ⬆️  Uploading to Supabase: preview-1.mp4...
# ✅ Uploaded: preview-1.mp4
# 📍 Public URL: https://project.supabase.co/storage/v1/object/public/ai-video-previews/preview-1.mp4
```

### Save URLs
The script creates `video-config.json`:
```json
{
  "videoPreviews": [
    "https://project.supabase.co/storage/v1/object/public/ai-video-previews/preview-1.mp4",
    "https://project.supabase.co/storage/v1/object/public/ai-video-previews/preview-2.mp4",
    ...
  ],
  "uploadedAt": "2024-01-06T10:30:00Z"
}
```

---

## Step 4: Update Component

### HomeLanding.tsx
```tsx
// Replace the videoUrls array
const videoUrls = [
  'https://project.supabase.co/storage/v1/object/public/ai-video-previews/preview-1.mp4',
  'https://project.supabase.co/storage/v1/object/public/ai-video-previews/preview-2.mp4',
  // ... rest of URLs
];

// The component already uses VideoCarousel, just verify:
<VideoCarousel
  videos={videoUrls}
  aspectRatio="vertical"
  autoplay={true}
  showControls={true}
  pauseOnHover={true}
/>
```

---

## Step 5: Test Locally

```bash
npm run dev

# Visit http://localhost:5173
# Check:
# ✅ Videos load
# ✅ First video autoplays
# ✅ Slides transition smoothly
# ✅ Controls work (play/pause, dots, arrows)
# ✅ Mobile layout responsive
```

### Browser DevTools Debugging
```javascript
// In browser console

// 1. Check network
const videoUrl = 'https://project.supabase.co/storage/v1/object/public/ai-video-previews/preview-1.mp4';
fetch(videoUrl, { method: 'HEAD' }).then(r => {
  console.log('Status:', r.status);
  console.log('CORS:', r.headers.get('access-control-allow-origin'));
  console.log('Size:', r.headers.get('content-length'));
});

// 2. Check video element
const video = document.querySelector('video');
console.log('Autoplay:', video.autoplay);
console.log('Muted:', video.muted);
console.log('Ready state:', video.readyState); // 4 = ready to play
```

---

## Step 6: Deploy to Vercel

### Push to GitHub
```bash
git add .
git commit -m "Add VideoCarousel component with Supabase storage"
git push origin main
```

### Connect Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Select your GitHub repo
4. Click "Deploy"
5. Go to project settings

### Add Environment Variables
1. Settings → Environment Variables
2. Add:
   ```
   VITE_SUPABASE_URL = https://...
   VITE_SUPABASE_ANON_KEY = eyJ...
   ```
3. Redeploy

### Verify Deployment
```bash
# Visit your Vercel URL
# Open DevTools → Network tab
# Check video URLs load with 200 status
```

---

## Step 7: Production Optimizations

### Enable Caching Headers
In Supabase dashboard, videos are cached for 1 hour by default ✅

### Monitor Performance
```javascript
// Add to HomeLanding.tsx
const VideoCarousel = React.lazy(() => import('./VideoCarousel'));

// Measure video load time
useEffect(() => {
  const videoElement = document.querySelector('video');
  if (videoElement) {
    videoElement.addEventListener('canplay', () => {
      const loadTime = performance.now();
      console.log(`🎬 Video ready in ${loadTime.toFixed(0)}ms`);
      
      // Optional: Send to analytics
      // analytics.event('video_carousel_loaded', { duration: loadTime });
    });
  }
}, []);
```

### Add Analytics
```tsx
import { getAnalytics, logEvent } from 'firebase/analytics';

const handleVideoChange = (index: number) => {
  logEvent(getAnalytics(), 'video_carousel_change', {
    video_index: index,
    timestamp: new Date().toISOString()
  });
};

<VideoCarousel
  videos={videoUrls}
  onVideoChange={handleVideoChange}
/>
```

---

## Troubleshooting Deployment

### Issue: 404 on Video URLs
**Cause:** Bucket not public or URLs incorrect  
**Fix:**
```bash
# Verify in Supabase:
# 1. Go to Storage → ai-video-previews
# 2. Check "Policies" tab
# 3. Should see public read access
# 4. Copy exact URL from bucket file listing
```

### Issue: "CORS error" in production
**Cause:** Supabase CORS headers not set correctly  
**Fix:**
```bash
# Verify CORS headers are present:
curl -I https://project.supabase.co/storage/v1/object/public/ai-video-previews/preview-1.mp4

# Should see:
# Access-Control-Allow-Origin: *
# Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
```

### Issue: Videos buffer/stall
**Cause:** Large video files or slow internet  
**Fix:**
```bash
# Re-compress videos (< 20MB)
ffmpeg -i video.mp4 -crf 24 -preset fast optimized.mp4

# Re-upload to Supabase
node scripts/download-drive-videos.js
```

### Issue: Autoplay not working in production
**Cause:** HTTP instead of HTTPS  
**Fix:**
```bash
# Ensure your domain uses HTTPS
# Check: https:// not http://
# Chrome requires HTTPS for autoplay
```

---

## Maintenance Checklist

### Weekly
- [ ] Monitor video load times
- [ ] Check storage usage in Supabase
- [ ] Verify no 404 errors in Vercel analytics

### Monthly
- [ ] Review video engagement metrics
- [ ] Update videos if needed
- [ ] Clean up old video files from Supabase

### Quarterly
- [ ] Review Supabase storage costs
- [ ] Optimize new videos with FFmpeg
- [ ] Test autoplay on different devices

---

## Cost Estimate

### Supabase
- **Storage:** $25 per 100 GB
- **Bandwidth:** 2 GB included per month, then $0.12/GB
- **For 5 videos × 20MB:** $0 (under free tier)

### If you scale (1M visitors/month)
- **Storage:** $25 (5 videos)
- **Bandwidth:** $100-200 (10-20 GB/month)
- **Total:** $125-225/month

### Cloudinary Alternative (Recommended for Video)
- **Free tier:** 25 GB bandwidth/month + 10 GB storage
- **Paid:** $99+/month for 500 GB bandwidth
- **Advantage:** Built-in video optimization & CDN

---

## Advanced: Custom Domain CDN

If you want maximum performance:

```bash
# Use Cloudflare to cache Supabase videos
# 1. Add CNAME to Cloudflare
# 2. Set cache rules to 24 hours
# 3. Enable automatic image optimization
# Result: Faster load times globally
```

---

## Quick Copy-Paste Commands

```bash
# 1. One-liner setup
npm install axios && echo 'VITE_SUPABASE_URL=https://...' > .env.local

# 2. Test video access
curl -I https://your-project.supabase.co/storage/v1/object/public/ai-video-previews/preview-1.mp4

# 3. View migration log
cat video-config.json

# 4. Build and test
npm run build && npm run preview

# 5. Deploy
git add . && git commit -m 'Video carousel ready' && git push
```

---

That's it! You're ready to show off beautiful AI-generated video previews on your SaaS. 🚀
