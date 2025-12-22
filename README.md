# ImaginAI Deployment Guide

## 1. Setup API Key
This app uses Google Gemini API.
1. Get a key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Create a file named `.env` in this folder.
3. Add your key: `API_KEY=AIzaSy...`

## 2. Build for Production
Run these commands in your terminal:
```bash
npm install
npm run build
```

## 3. Upload to Hosting
1. Go to the `dist` folder that was created.
2. Zip the CONTENTS of the `dist` folder.
3. Upload the zip to your cPanel `public_html` (or subdirectory).
4. Extract the zip.

## Troubleshooting
- If the screen is white, check the Console (F12) for errors.
- Ensure you uploaded the contents of `dist`, not the source code.
