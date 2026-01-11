# DALL·E 3 API Fix - Vercel Environment Variables

## Problem
DALL·E 3 image generation returns 401 error: "DALL·E 3 API key missing or invalid on backend proxy"

## Root Cause
The serverless function `/api/dalle3.js` expects environment variable: **`OPENAI_API_KEY`**

## Solution

### 1. Add Environment Variable in Vercel

Go to your Vercel project dashboard:
1. Navigate to: **Settings** → **Environment Variables**
2. Add new variable:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (starts with `sk-...`)
   - **Environment**: Production, Preview, Development (select all)
3. Click **Save**

### 2. Get Your OpenAI API Key

If you don't have one:
1. Go to: https://platform.openai.com/api-keys
2. Click **"+ Create new secret key"**
3. Copy the key (starts with `sk-...`)
4. Add it to Vercel as shown above

### 3. Redeploy

After adding the environment variable:
- Vercel will automatically redeploy
- Or manually trigger: **Deployments** → **Redeploy**

## Verification

Test image generation in your app - it should work without 401 errors.

## Related Files
- `/api/dalle3.js` - Serverless function that needs the API key
- Line 8: `const apiKey = process.env.OPENAI_API_KEY;`
