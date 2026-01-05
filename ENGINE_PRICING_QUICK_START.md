# 🚀 AI Engine Pricing System - Quick Start Guide

## What Was Built

A **production-grade dynamic pricing system** that allows you to:
- ✅ Manage AI engine costs without code redeployment
- ✅ Enable/disable engines in real-time
- ✅ Track usage statistics per engine
- ✅ Secure admin-only controls
- ✅ Real-time pricing updates for all users

## 📂 Files Created/Modified

### New Files
1. `/types.ts` - Added engine types (AIEngine, CreditPricing, EngineUsageLog)
2. `/services/firebase.ts` - Added 20+ engine management functions
3. `/services/creditWrapper.ts` - Added engine-aware credit wrappers
4. `/components/AdminDashboard.tsx` - Added Engine Pricing UI section
5. `/functions/src/index.ts` - Added 4 new Cloud Functions
6. `/scripts/init-engines.js` - Engine initialization script
7. `/ENGINE_PRICING_SYSTEM.md` - Complete documentation
8. `/FIRESTORE_ENGINE_RULES.md` - Security rules

### Collections Created
- `ai_engines` - Engine configurations
- `credit_pricing` - Pricing per AI type
- `usage_logs` - Enhanced with engine data

## 🎯 Key Features

### 1. Admin Dashboard
**Location:** Admin Dashboard → Credits Tab → AI Engine Pricing

**Actions:**
- View all engines grouped by type (Image, Video, Voice, Chat)
- Add new engines with custom pricing
- Edit engine costs and descriptions
- Enable/disable engines instantly
- View usage statistics per engine

### 2. Cloud Functions

#### `validateAndDeductEngineCredits`
Deducts credits based on selected engine and input size.

**Example:**
```typescript
const result = await httpsCallable(functions, 'validateAndDeductEngineCredits')({
  userId: user.uid,
  ai_type: 'image',
  engine_id: 'dalle',
  input_size: 1,
  prompt: 'A beautiful sunset'
});
```

#### `getEnginePricing`
Get available engines and pricing.

**Example:**
```typescript
const result = await httpsCallable(functions, 'getEnginePricing')({
  ai_type: 'image',
  include_inactive: false
});
```

#### `updateEngineConfig` (Admin Only)
Update engine configuration.

#### `updateCreditPricingConfig` (Admin Only)
Update pricing per AI type.

### 3. Frontend Integration

**Option A: Use Credit Wrapper (Recommended)**
```typescript
import { withEngineImageCredits } from './services/creditWrapper';

const result = await withEngineImageCredits(
  userId,
  'dalle',  // Engine ID
  prompt,
  async () => await generateImageAPI(prompt)
);

if (result.success) {
  console.log('Image:', result.data);
  console.log('Credits used:', result.creditsUsed);
} else {
  console.error(result.error);
}
```

**Option B: Direct Cloud Function Call**
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const deductCredits = httpsCallable(functions, 'validateAndDeductEngineCredits');

const creditResult = await deductCredits({
  userId: user.uid,
  ai_type: 'image',
  engine_id: 'dalle',
  input_size: 1,
  prompt: prompt
});

if (creditResult.data.success) {
  // Generate image
  const image = await generateImageAPI(prompt);
  
  // Update activity
  await updateAIActivity(creditResult.data.activityId, {
    status: 'completed',
    resultUrl: image.url
  });
}
```

## 🔧 Setup Instructions

### Step 1: Initialize Engines
```bash
node scripts/init-engines.js
```

This creates:
- 11 pre-configured engines (DALL-E, Seddream, Kling AI, ElevenLabs, Gemini, etc.)
- Pricing configuration for all AI types
- Default engine mappings

### Step 2: Deploy Cloud Functions
```bash
firebase deploy --only functions
```

Deploys:
- `validateAndDeductEngineCredits`
- `getEnginePricing`
- `updateEngineConfig`
- `updateCreditPricingConfig`

### Step 3: Update Firestore Rules
Add the rules from `FIRESTORE_ENGINE_RULES.md` to your Firestore security rules:

```bash
firebase deploy --only firestore:rules
```

### Step 4: Test in Admin Dashboard
1. Open Admin Dashboard
2. Navigate to Credits tab
3. Scroll to "AI Engine Pricing" section
4. Verify engines are loaded
5. Try editing an engine
6. Test enable/disable toggle

## 📊 Pre-Configured Engines

### Image Engines
- **DALL-E 3** - 5 credits/image (Active)
- **Seddream Pro** - 2 credits/image (Active)
- **Midjourney** - 8 credits/image (Disabled)

### Video Engines
- **Kling AI** - 10 credits/second (Active)
- **Runway Gen-2** - 15 credits/second (Disabled)
- **Pika Labs** - 8 credits/second (Disabled)

### Voice Engines
- **ElevenLabs** - 3 credits/minute (Active)
- **OpenAI TTS** - 2 credits/minute (Disabled)

### Chat Engines
- **Gemini Pro** - 0.001 credits/token (Active)
- **GPT-4 Turbo** - 0.003 credits/token (Disabled)
- **Claude 3** - 0.002 credits/token (Disabled)

## 🔐 Security

### Access Control
- ✅ Only admins can modify engines
- ✅ Users can only read active engines
- ✅ Credit deduction via Cloud Functions only
- ✅ Immutable usage logs
- ✅ All admin actions logged

### Rate Limiting
Built-in rate limiting per AI type:
- Image: 50 requests/hour
- Video: 10 requests/hour
- Voice: 30 requests/hour
- Chat: 100 requests/hour

### Content Moderation
Automatic prompt filtering for:
- Violence, gore, NSFW content
- Illegal activities
- Hate speech
- Abuse and harassment

## 📈 Usage Analytics

### Get Engine Statistics
```typescript
import { getEngineStats } from './services/firebase';

const stats = await getEngineStats(undefined, 30); // Last 30 days

console.log(stats);
// {
//   totalUsage: 1234,
//   totalCredits: 5678,
//   successRate: 95.5,
//   byEngine: [...]
// }
```

### Real-Time Price Updates
```typescript
import { subscribeToEnginePricing } from './services/firebase';

const unsubscribe = subscribeToEnginePricing('image', (pricing) => {
  console.log('Pricing updated:', pricing);
  // Update UI automatically
});
```

## 🎨 Integration Examples

### Example 1: Image Generation
```typescript
import { withEngineImageCredits } from './services/creditWrapper';

async function generateImage(userId: string, prompt: string) {
  const result = await withEngineImageCredits(
    userId,
    'dalle',
    prompt,
    async () => {
      const response = await fetch('/api/dalle3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      return await response.json();
    }
  );

  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
}
```

### Example 2: Video Generation
```typescript
import { withEngineVideoCredits } from './services/creditWrapper';

async function generateVideo(userId: string, prompt: string, duration: number) {
  const result = await withEngineVideoCredits(
    userId,
    'klingai',
    prompt,
    duration,
    async () => {
      return await klingaiAPI.generate(prompt, duration);
    }
  );

  // Cost = 10 credits/second × duration
  // Example: 5 seconds = 50 credits
  
  return result;
}
```

### Example 3: Voice Synthesis
```typescript
import { withEngineVoiceCredits } from './services/creditWrapper';

async function synthesizeVoice(userId: string, text: string) {
  const estimatedMinutes = text.length / 300;
  
  const result = await withEngineVoiceCredits(
    userId,
    'elevenlabs',
    text,
    estimatedMinutes,
    async () => {
      return await elevenlabsAPI.synthesize(text);
    }
  );

  // Cost = 3 credits/minute × estimatedMinutes
  
  return result;
}
```

## 🔄 Migration from Old System

### Before (Fixed Pricing)
```typescript
// Old way - hardcoded costs
const cost = 1; // Fixed cost
await deductUserCredits(userId, cost, 'image');
```

### After (Dynamic Pricing)
```typescript
// New way - engine-based dynamic costs
const result = await withEngineImageCredits(
  userId,
  'dalle',  // Engine determines cost
  prompt,
  async () => await generateImage(prompt)
);
```

## 🛠️ Admin Operations

### Add New Engine
1. Go to Admin Dashboard → Credits → AI Engine Pricing
2. Click "Add Engine"
3. Fill in details:
   - Engine ID: `stable-diffusion` (lowercase, no spaces)
   - Engine Name: `Stable Diffusion XL`
   - AI Type: `image`
   - Status: `Active`
   - Base Cost: `3`
   - Cost Unit: `image`
   - Description: `Open-source image generation`
4. Click "Save Engine"
5. ✅ Immediately available to all users

### Update Engine Cost
1. Find engine in the list
2. Click Edit button
3. Change Base Cost
4. Click Save
5. ✅ New cost applies to all new generations

### Disable Engine
1. Find engine in the list
2. Click X button (red icon)
3. Confirm
4. ✅ Engine blocked for all users immediately

## 🚨 Troubleshooting

### Engine not showing in admin dashboard
- Check browser console for errors
- Verify Firestore rules are deployed
- Run: `firebase deploy --only firestore:rules`

### Credit deduction fails
- Verify Cloud Functions are deployed
- Check function logs: `firebase functions:log`
- Ensure engine is active and exists

### "Insufficient credits" error
- User doesn't have enough credits
- Check user's credit balance
- Grant credits via Admin Dashboard → Users

### Rate limit exceeded
- User has exceeded hourly limit
- Wait for rate limit window to reset
- Or adjust limits in Cloud Functions

## 📚 Documentation Files

1. **ENGINE_PRICING_SYSTEM.md** - Complete system documentation
2. **FIRESTORE_ENGINE_RULES.md** - Security rules reference
3. **This file** - Quick start guide

## 🎯 Next Steps

1. ✅ Deploy to production
2. ✅ Test credit deduction with each engine
3. ✅ Monitor usage statistics
4. ✅ Adjust pricing based on actual API costs
5. ✅ Add more engines as needed

## 💡 Pro Tips

1. **Use "include_inactive: true"** in admin tools to see all engines
2. **Set description carefully** - users see this when selecting engines
3. **Monitor success rates** - disable engines with low success rates
4. **A/B test pricing** - try different costs and measure conversion
5. **Regional pricing** - coming soon in future updates

---

**Built for production at Midjourney/Runway/ElevenLabs scale! 🚀**

Questions? Check `ENGINE_PRICING_SYSTEM.md` for detailed documentation.
