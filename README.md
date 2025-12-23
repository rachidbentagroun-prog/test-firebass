# ImaginAI Deployment Guide

## 1. Setup API Keys
This app uses Google Gemini API and Sora API for video generation.

### Required API Keys
1. **Sora API Key** (for AI Video generation):
   - Get your Sora API key from your Sora account
   - This is the primary key for video generation features

2. **Google Gemini API Key** (for image/audio generation):
   - Get a key from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Used as fallback for other AI features

### Configuration
1. Create a file named `.env` in the project root folder
2. Add your keys:
```env
# Sora Video Generation API Key (required for AI Video moteur)
SORA_API_KEY=your_sora_api_key_here

# Generic API Key (fallback for Gemini and other services)
API_KEY=your_gemini_api_key_here

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Video Generation Features
The AI Video moteur supports:
- **Text-to-Video**: Generate videos from text prompts
- **Video-to-Video**: Transform videos with reference frames
- **Aspect Ratios**: 16:9 (Landscape) or 9:16 (Portrait)
- **Quality**: 720p (HD, 8s) or 1080p (FHD, 10s)

## 2. Build for Production
Run these commands in your terminal:
```bash
npm install
npm run build
```

## 3. Deploy to Vercel (Recommended)
1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel dashboard:
   - `SORA_API_KEY`
   - `API_KEY`
   - All `VITE_FIREBASE_*` variables
4. Deploy

## 4. Alternative: Upload to cPanel
1. Go to the `dist` folder that was created.
2. Zip the CONTENTS of the `dist` folder.
3. Upload the zip to your cPanel `public_html` (or subdirectory).
4. Extract the zip.

## Troubleshooting
- If the screen is white, check the Console (F12) for errors.
- Ensure you uploaded the contents of `dist`, not the source code.
- Check that `.env` file exists and has valid API keys
- For video generation errors, verify `SORA_API_KEY` is set correctly
