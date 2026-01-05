# 🚀 Profit Intelligence System - Quick Start

**5-Minute Integration Guide for Existing AI SaaS Platforms**

---

## Step 1: Install & Initialize (5 minutes)

```bash
# 1. Copy files
cp -r profit-intelligence-system/* your-project/

# 2. Install dependencies
cd functions && npm install

# 3. Initialize system
node scripts/init-profit-system.js

# 4. Deploy
firebase deploy --only functions,firestore:rules
```

---

## Step 2: Integrate with Existing Generation Code

### Before (Your Current Code):

```typescript
// Your existing generation function
async function generateImage(userId: string, prompt: string) {
  const result = await dalleAPI.generate(prompt);
  
  await db.collection('generations').add({
    user_id: userId,
    prompt: prompt,
    image_url: result.url,
    created_at: new Date()
  });
  
  return result;
}
```

### After (With Profit Intelligence):

```typescript
// Enhanced with financial tracking
async function generateImage(userId: string, prompt: string) {
  const result = await dalleAPI.generate(prompt);
  
  // Get user's subscription plan
  const userDoc = await db.collection('users').doc(userId).get();
  const subscriptionPlan = userDoc.data()?.subscription_plan || 'free';
  
  // Log generation with metadata for profit tracking
  await db.collection('generations').add({
    user_id: userId,
    prompt: prompt,
    image_url: result.url,
    created_at: new Date(),
    
    // NEW: Financial tracking fields
    engine_id: 'dalle_3_standard',  // Match ai_engine_costs
    subscription_plan: subscriptionPlan,
    usage_units: 1,  // 1 image
    ai_type: 'image',
    credits_used: 10  // Your credit system
  });
  
  // That's it! Cloud Function handles the rest automatically
  return result;
}
```

**What happens automatically:**
1. ✅ `onGenerationCreated` Cloud Function triggers
2. ✅ Fetches engine cost from `ai_engine_costs`
3. ✅ Calculates real cost, revenue, profit
4. ✅ Writes to `usage_logs` with financial data
5. ✅ Checks for loss users
6. ✅ Daily/monthly aggregations run on schedule

---

## Step 3: Add Dashboard Route

```typescript
// pages/admin/profit-intelligence.tsx
import ProfitDashboard from '@/components/ProfitDashboard';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

export default function ProfitIntelligencePage() {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user || user.role !== 'super_admin') {
    return <Navigate to="/admin" />;
  }
  
  return <ProfitDashboard />;
}
```

---

## Step 4: Grant Admin Access

```bash
# Via Firebase Console or Admin SDK
firebase firestore:set users/YOUR_ADMIN_UID --data '{"role":"super_admin"}'
```

---

## Step 5: Access Dashboard

Navigate to: `https://your-app.com/admin/profit-intelligence`

You should see:
- ✅ Real-time metrics (revenue, cost, profit)
- ✅ Charts (cost vs revenue, engine breakdown)
- ✅ Loss user alerts

---

## 📊 Example: Video Generation Integration

```typescript
async function generateVideo(userId: string, prompt: string, duration: number) {
  const result = await seddreamAPI.generate(prompt, duration);
  
  const userDoc = await db.collection('users').doc(userId).get();
  const subscriptionPlan = userDoc.data()?.subscription_plan || 'free';
  
  await db.collection('generations').add({
    user_id: userId,
    prompt: prompt,
    video_url: result.url,
    created_at: new Date(),
    
    // Financial tracking
    engine_id: 'seddream_video',      // Cost: $0.12/second
    subscription_plan: subscriptionPlan,
    usage_units: duration,            // Number of seconds
    ai_type: 'video',
    credits_used: duration * 5        // Your credit system
  });
  
  return result;
}
```

---

## 🎙️ Example: TTS/Voice Integration

```typescript
async function generateSpeech(userId: string, text: string) {
  const result = await openaiTTS.generate(text);
  
  const userDoc = await db.collection('users').doc(userId).get();
  const subscriptionPlan = userDoc.data()?.subscription_plan || 'free';
  
  const characterCount = text.length;
  const tokensUsed = Math.ceil(characterCount / 1000); // Per 1k chars
  
  await db.collection('generations').add({
    user_id: userId,
    text: text,
    audio_url: result.url,
    created_at: new Date(),
    
    // Financial tracking
    engine_id: 'openai_tts_hd',       // Cost: $0.03/1k chars
    subscription_plan: subscriptionPlan,
    usage_units: tokensUsed,           // 1k character units
    ai_type: 'voice',
    credits_used: characterCount / 100
  });
  
  return result;
}
```

---

## 💬 Example: Chat Integration

```typescript
async function chatCompletion(userId: string, messages: any[]) {
  const result = await openaiChat.complete(messages);
  
  const userDoc = await db.collection('users').doc(userId).get();
  const subscriptionPlan = userDoc.data()?.subscription_plan || 'free';
  
  const totalTokens = result.usage.total_tokens;
  const tokensIn1k = totalTokens / 1000;
  
  await db.collection('generations').add({
    user_id: userId,
    messages: messages,
    response: result.response,
    created_at: new Date(),
    
    // Financial tracking
    engine_id: 'gpt_4_turbo',         // Cost: $0.03/1k tokens
    subscription_plan: subscriptionPlan,
    usage_units: tokensIn1k,          // 1k token units
    ai_type: 'chat',
    credits_used: totalTokens / 100
  });
  
  return result;
}
```

---

## 🔑 Engine ID Reference

Map your AI models to these engine IDs (from `ai_engine_costs` collection):

| Your Model | Engine ID | Cost/Unit |
|------------|-----------|-----------|
| DALL·E 3 Standard | `dalle_3_standard` | $0.04/image |
| DALL·E 3 HD | `dalle_3_hd` | $0.08/image |
| Gemini Pro Vision | `gemini_pro_vision` | $0.0025/image |
| SEDDREAM Video | `seddream_video` | $0.12/second |
| OpenAI TTS HD | `openai_tts_hd` | $0.03/1k chars |
| GPT-4 Turbo | `gpt_4_turbo` | $0.03/1k tokens |
| GPT-3.5 Turbo | `gpt_3_5_turbo` | $0.002/1k tokens |

**Add custom engines:**

```typescript
await db.collection('ai_engine_costs').doc('your_custom_engine').set({
  engine_id: 'your_custom_engine',
  provider_name: 'YourProvider',
  ai_type: 'image',
  cost_per_unit: 0.05,
  unit_type: 'image',
  is_active: true,
  updated_at: admin.firestore.FieldValue.serverTimestamp(),
  updated_by: 'admin_uid'
});
```

---

## 🎯 Subscription Plan Pricing

Update your plan pricing in `subscription_plans` collection:

```typescript
await db.collection('subscription_plans').doc('pro').set({
  plan_id: 'pro',
  plan_name: 'Pro',
  monthly_price_usd: 29.99,
  annual_price_usd: 299.99,
  credits_per_month: 1000,
  features: ['1000 credits', 'All models', 'HD quality'],
  is_active: true
});
```

**This pricing is used for revenue attribution!**

---

## 📈 Viewing Results

### Check Real-Time Logs

```bash
firebase functions:log --only onGenerationCreated
```

You should see:
```
[COST CALC] Engine: dalle_3_standard, Units: 1, Cost: $0.0400
[REVENUE CALC] User: abc123, Plan: pro ($29.99), Allocated: $0.0300
[PROFIT CALC] Revenue: $0.03, Cost: $0.04, Profit: -$0.01 (-33.33%)
[USAGE LOGGED] User: abc123, Cost: $0.04, Profit: -$0.01
```

### Check Aggregated Data

```typescript
// In your admin panel
const latest = await db.collection('profit_aggregates')
  .where('period_type', '==', 'daily')
  .orderBy('period_start', 'desc')
  .limit(1)
  .get();

const data = latest.docs[0].data();
console.log('Daily Profit:', data.total_profit_usd);
console.log('Profit Margin:', data.profit_margin_percent + '%');
```

---

## ⚠️ Common Mistakes

### ❌ Wrong: Hardcoding costs

```typescript
// DON'T DO THIS
const cost = 0.04; // Hardcoded
```

### ✅ Right: Using ai_engine_costs

```typescript
// DO THIS
engine_id: 'dalle_3_standard'  // Let Cloud Function fetch cost
```

---

### ❌ Wrong: Missing usage_units

```typescript
// DON'T DO THIS
await db.collection('generations').add({
  user_id: userId,
  engine_id: 'seddream_video'
  // Missing usage_units!
});
```

### ✅ Right: Include usage_units

```typescript
// DO THIS
await db.collection('generations').add({
  user_id: userId,
  engine_id: 'seddream_video',
  usage_units: 30  // 30 seconds of video
});
```

---

### ❌ Wrong: Client-side profit calculation

```typescript
// DON'T DO THIS
const profit = revenue - cost;  // Client-side
```

### ✅ Right: Server-side only

```typescript
// DO THIS
// Just log the generation - Cloud Function handles profit calculation
await db.collection('generations').add({ ... });
```

---

## 🎉 You're Done!

**What you now have:**
- ✅ Real-time cost tracking
- ✅ Profit margin analysis
- ✅ Loss user detection
- ✅ Enterprise dashboard
- ✅ Financial audit trail

**Next steps:**
1. Monitor dashboard daily
2. Adjust pricing if margins are low
3. Flag/upgrade loss users
4. Optimize expensive AI engines

---

## 📞 Need Help?

Check [PROFIT_SYSTEM_GUIDE.md](./PROFIT_SYSTEM_GUIDE.md) for:
- Complete architecture
- Financial formulas
- Troubleshooting
- Performance optimization

---

**Built for:** Subscription-based AI SaaS  
**Compatible with:** DALL·E, GPT, Gemini, SEDDREAM, ElevenLabs, etc.  
**Level:** Enterprise-grade
