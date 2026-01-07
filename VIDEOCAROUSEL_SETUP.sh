#!/bin/bash
# Quick Start: Video Carousel Setup
# Run this after reading VIDEOCAROUSEL_GUIDE.md

echo "🎬 Video Carousel Quick Start"
echo "=============================="
echo ""

# Step 1: Check if you have the required files
echo "✓ Checking files..."
[ -f "components/VideoCarousel.tsx" ] && echo "  ✅ VideoCarousel.tsx exists"
[ -f "scripts/download-drive-videos.js" ] && echo "  ✅ download-drive-videos.js exists"
[ -f "components/HomeLanding.tsx" ] && echo "  ✅ HomeLanding.tsx updated"

echo ""
echo "📋 Manual Setup Steps:"
echo "1. Create Supabase bucket 'ai-video-previews' (public)"
echo ""
echo "2. Update environment variables:"
echo "   VITE_SUPABASE_URL=https://your-project.supabase.co"
echo "   VITE_SUPABASE_ANON_KEY=eyJ..."
echo ""
echo "3. Install dependencies:"
echo "   npm install axios"
echo ""
echo "4. Run migration script:"
echo "   node scripts/download-drive-videos.js"
echo ""
echo "5. Copy URLs from video-config.json"
echo ""
echo "6. Update videoUrls array in HomeLanding.tsx"
echo ""
echo "7. Test locally:"
echo "   npm run dev"
echo ""
echo "✨ Done! Your carousel is ready."
