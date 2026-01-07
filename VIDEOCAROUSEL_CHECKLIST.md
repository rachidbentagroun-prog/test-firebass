#!/bin/bash
# Video Carousel Implementation Checklist
# Track your progress through the setup

cat << 'EOF'

╔════════════════════════════════════════════════════════════════════════════╗
║                   VIDEO CAROUSEL IMPLEMENTATION CHECKLIST                  ║
║                    SaaS AI Image & Video Generator                         ║
╚════════════════════════════════════════════════════════════════════════════╝

PHASE 1: PLANNING & UNDERSTANDING (✅ COMPLETE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ✅ Understand why Google Drive fails (CORS, auth, no direct streaming)
 ✅ Learn about browser autoplay policies (muted, HTTPS, user gesture)
 ✅ Review production-ready architecture (CDN-based videos)
 ✅ Choose CDN solution (Supabase recommended)
 ✅ Plan migration strategy (download → upload → deploy)


PHASE 2: SETUP INFRASTRUCTURE (⏳ NOW)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ 1. Create Supabase Project (5 minutes)
   □ Go to https://supabase.com
   □ Click "Start your project"
   □ Enter project name: "imaginai"
   □ Set strong database password
   □ Choose region closest to your users
   □ Wait for project creation (2-3 min)

□ 2. Get Supabase Credentials (2 minutes)
   □ Go to Settings → API
   □ Copy "Project URL" → paste to .env.local
   □ Copy "anon public key" → paste to .env.local
   └─ Save .env.local:
      VITE_SUPABASE_URL=https://[PROJECT_ID].supabase.co
      VITE_SUPABASE_ANON_KEY=eyJhbGci...

□ 3. Create Storage Bucket (2 minutes)
   □ Go to Storage
   □ Click "Create new bucket"
   □ Name: "ai-video-previews"
   □ Select "Public" (important!)
   □ Click "Create bucket"
   └─ Result: Your videos will be publicly accessible via HTTPS

□ 4. Install Dependencies (1 minute)
   □ Run: npm install axios
   └─ axios is needed for the migration script


PHASE 3: VERIFY COMPONENT FILES (✅ COMPLETE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ✅ VideoCarousel.tsx created (200 lines, production-ready)
 ✅ HomeLanding.tsx updated (removed broken Drive logic)
 ✅ Migration script created (download-drive-videos.js)
 ✅ Documentation created (5 guides)


PHASE 4: MIGRATE YOUR VIDEOS (⏳ NEXT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ 1. (Optional) Compress Videos First
   □ Install FFmpeg: brew install ffmpeg (or apt-get, choco)
   □ For each video:
      ffmpeg -i original.mp4 \
        -vcodec libx264 \
        -crf 23 \
        -preset medium \
        -vf "scale=1080:-1" \
        -c:a aac -b:a 128k \
        optimized.mp4
   □ Expected: 500MB → 20MB (25x smaller!)
   └─ This is HIGHLY RECOMMENDED for fast loading

□ 2. Run Migration Script (10 minutes)
   □ Command: node scripts/download-drive-videos.js
   □ Script will:
      • Download 5 videos from Google Drive
      • Upload to Supabase Storage
      • Return public HTTPS URLs
      • Save URLs to video-config.json
   □ Watch the output for each step
   └─ Example output:
      ⬇️  Downloading: preview-1.mp4...
      ✅ Downloaded: preview-1.mp4
      ⬆️  Uploading to Supabase: preview-1.mp4...
      ✅ Uploaded: preview-1.mp4
      📍 Public URL: https://...

□ 3. Verify URLs in video-config.json (1 minute)
   □ Open video-config.json
   □ Copy the "videoPreviews" array
   □ Test one URL in browser (should download or play)
   □ If blank: check CORS headers (next step)


PHASE 5: UPDATE YOUR COMPONENT (✅ SIMPLE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ 1. Open HomeLanding.tsx
   □ Find the "videoUrls" array
   □ Replace with URLs from video-config.json
   □ Your code should look like:
      const videoUrls = [
        'https://project.supabase.co/storage/v1/object/public/ai-video-previews/preview-1.mp4',
        'https://project.supabase.co/storage/v1/object/public/ai-video-previews/preview-2.mp4',
        // ... more URLs
      ];

□ 2. Verify VideoCarousel is imported
   □ Check top of HomeLanding.tsx
   □ Should see: import VideoCarousel from './VideoCarousel';
   □ If missing, add it manually

□ 3. Verify VideoCarousel is used
   □ Search for <VideoCarousel in the file
   □ Should be in the hero section
   □ If missing, search for the old video code and replace

□ 4. Save the file
   └─ No other changes needed!


PHASE 6: LOCAL TESTING (⏳ VERIFY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ 1. Start dev server
   □ Command: npm run dev
   □ Open http://localhost:5173 in browser

□ 2. Check Hero Section
   □ Videos should appear immediately
   □ First video should autoplay (muted)
   □ After ~5-10 sec, should transition to next video
   □ If blank: check Network tab in DevTools

□ 3. Test Controls
   □ Hover over video → controls appear
   □ Click play/pause → works
   □ Click dots → jumps to that video
   □ Click arrows → next/prev video
   □ Click progress bar → seeks to that time

□ 4. Test Mobile Layout
   □ Open DevTools → Toggle device toolbar (Ctrl+Shift+M)
   □ Select iPhone/Android
   □ Videos should fill screen in 9:16 aspect ratio
   □ Controls should be touch-friendly

□ 5. Test on Real Mobile (Recommended)
   □ Get your local IP: ipconfig getifaddr en0 (macOS)
   □ Visit http://[YOUR_IP]:5173 on phone
   □ Test autoplay (critical on iOS!)
   □ Test touch controls

□ 6. Open Browser Console (DevTools → Console)
   □ No red errors should appear
   □ May see yellow warnings (okay)
   □ Test video load:
      fetch('https://your-url.mp4', { method: 'HEAD' })
        .then(r => console.log('Status:', r.status))

□ 7. Debug if needed
   □ Open VIDEOCAROUSEL_TROUBLESHOOTING.js
   □ Copy relevant test code into console
   □ Follow the debugging steps


PHASE 7: PRODUCTION BUILD (⏳ BEFORE DEPLOY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ 1. Build for production
   □ Command: npm run build
   □ Wait for build to complete
   □ Check for any errors (red text)

□ 2. Preview production build
   □ Command: npm run preview
   □ Open shown URL (usually http://localhost:4173)
   □ Test same things as local testing
   □ This is how users will see it

□ 3. Check build size
   □ npm run build should output file sizes
   □ Expected: ~300-400KB for your bundle
   □ If > 1MB, something might be wrong


PHASE 8: DEPLOY TO VERCEL (🚀 FINAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ 1. Push to GitHub
   □ Command:
      git add .
      git commit -m "Add VideoCarousel with Supabase storage"
      git push origin main

□ 2. Go to Vercel
   □ Visit https://vercel.com
   □ Sign in (create account if needed)
   □ Click "Add New..." → "Project"
   □ Select your GitHub repo
   □ Click "Import"

□ 3. Configure Environment Variables
   □ Before deploying, click "Environment Variables"
   □ Add:
      Key: VITE_SUPABASE_URL
      Value: https://[PROJECT_ID].supabase.co
   □ Add:
      Key: VITE_SUPABASE_ANON_KEY
      Value: eyJhbGci...
   □ Click "Deploy"

□ 4. Wait for Deployment
   □ Vercel will build and deploy automatically
   □ Takes 1-3 minutes
   □ You'll get a URL when done

□ 5. Test Production Deployment
   □ Click the deployment URL
   □ Test same things as local
   □ Open DevTools → Network tab
   □ Check video requests return 200 status
   □ Check CORS headers are present

□ 6. Test on Mobile (Real Device!)
   □ Share URL with a friend
   □ Test on iPhone/Android
   □ Verify autoplay works
   □ Verify controls are responsive


PHASE 9: OPTIMIZATION (⏳ OPTIONAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ 1. Add Video Thumbnails (Posters)
   □ Create poster images for each video (1080x1920px)
   □ Upload to Supabase Storage
   □ Update VideoCarousel to use poster attribute
   □ Videos show thumbnail while loading

□ 2. Add Analytics
   □ Track when videos start playing
   □ Track completion rate
   □ Use Firebase or Supabase for tracking
   □ Add to your dashboard

□ 3. Lazy Load Component
   □ Wrap VideoCarousel in React.lazy()
   □ Only load when in viewport
   □ Saves bandwidth for users not scrolling down

□ 4. Performance Monitoring
   □ Use Vercel Analytics
   □ Monitor First Contentful Paint (FCP)
   □ Target: < 2 seconds for video visible


PHASE 10: MAINTENANCE (🔄 ONGOING)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Daily
  □ Monitor Vercel deployment status
  □ Check if videos load (occasional spot checks)

□ Weekly
  □ Review video engagement metrics
  □ Check storage usage in Supabase

□ Monthly
  □ Update videos if needed
  □ Clean up old videos from Supabase
  □ Review costs ($0 expected if under free tier)

□ Quarterly
  □ Optimize new videos with FFmpeg
  □ Test on new devices/browsers
  □ Review performance metrics


═════════════════════════════════════════════════════════════════════════════

🎯 QUICK START FLOW

1. Create Supabase account (5 min)
   → supabase.com → Create project

2. Create storage bucket (2 min)
   → Storage → Create "ai-video-previews" (Public)

3. Save credentials to .env.local (1 min)
   → Copy URL and key from Settings → API

4. Install axios (1 min)
   → npm install axios

5. Run migration script (10 min)
   → node scripts/download-drive-videos.js

6. Update HomeLanding.tsx (2 min)
   → Replace videoUrls array with output from step 5

7. Test locally (5 min)
   → npm run dev → http://localhost:5173

8. Deploy to Vercel (10 min)
   → git push → add env vars → deploy

TOTAL TIME: ~40 minutes to production! 🚀

═════════════════════════════════════════════════════════════════════════════

📚 DOCUMENTATION REFERENCE

• VIDEOCAROUSEL_README.md ......... Start here!
• VIDEOCAROUSEL_GUIDE.md ......... Deep technical details
• VIDEOCAROUSEL_DEPLOYMENT.md .... Step-by-step deployment
• VIDEOCAROUSEL_TROUBLESHOOTING.js Debug utilities
• VIDEOCAROUSEL_SETUP.sh ......... Quick reference

═════════════════════════════════════════════════════════════════════════════

🎬 YOU'RE READY! 

The hardest part (building the component + infrastructure) is done.
Next step: Create your Supabase account and run the migration script.

Good luck! 🚀✨

EOF
