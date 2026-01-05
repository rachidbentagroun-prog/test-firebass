# AI Engine Pricing System - Complete Guide

## 🚀 Overview

This system allows **dynamic control of credit costs per AI engine** without code redeployment. Admins can:
- Manage multiple AI engines (DALL-E, Gemini, Seddream, etc.)
- Set custom credit costs per engine
- Enable/disable engines in real-time
- Track usage statistics per engine
- All changes apply immediately to all users

---

## 📊 Architecture

### Firestore Collections

#### 1. `ai_engines` Collection
Stores all AI engine configurations.

**Document Structure:**
```typescript
Document ID: engine_id (e.g., "dalle", "gemini", "seddream")

Fields:
{
  engine_name: string,        // Display name: "DALL-E 3", "Gemini Pro"
  ai_type: string,            // "image" | "video" | "voice" | "chat"
  is_active: boolean,         // Enable/disable engine
  base_cost: number,          // Credit cost per unit
  cost_unit: string,          // "image" | "second" | "minute" | "token"
  description: string,        // Engine description
  created_at: number,         // Timestamp
  updated_at: number,         // Timestamp
  version?: string,           // Optional: "v3", "1.5"
  provider?: string,          // Optional: "OpenAI", "Google"
  capabilities?: string[]     // Optional: ["HD", "4K", "Fast"]
}
```

**Example Documents:**
```javascript
// Image engines
dalle: {
  engine_name: "DALL-E 3",
  ai_type: "image",
  is_active: true,
  base_cost: 5,
  cost_unit: "image",
  description: "High-quality image generation from OpenAI",
  provider: "OpenAI",
  version: "3"
}

seddream: {
  engine_name: "Seddream Pro",
  ai_type: "image",
  is_active: true,
  base_cost: 2,
  cost_unit: "image",
  description: "Fast, cost-effective image generation"
}

// Video engines
klingai: {
  engine_name: "Kling AI",
  ai_type: "video",
  is_active: true,
  base_cost: 10,
  cost_unit: "second",
  description: "Advanced video generation engine"
}

// Voice engines
elevenlabs: {
  engine_name: "ElevenLabs",
  ai_type: "voice",
  is_active: true,
  base_cost: 3,
  cost_unit: "minute",
  description: "Natural voice synthesis"
}

// Chat engines
gemini: {
  engine_name: "Gemini Pro",
  ai_type: "chat",
  is_active: true,
  base_cost: 0.001,
  cost_unit: "token",
  description: "Google's multimodal AI"
}
```

#### 2. `credit_pricing` Collection
Stores pricing configuration per AI type.

**Document Structure:**
```typescript
Document ID: ai_type ("image" | "video" | "voice" | "chat")

Fields:
{
  ai_type: string,
  default_engine: string,     // Default engine ID for this type
  engines: {
    [engine_id]: {
      cost: number,           // Override cost (optional)
      is_active: boolean      // Override status (optional)
    }
  },
  updated_at: number,
  updated_by: string          // Admin email
}
```

**Example Documents:**
```javascript
image: {
  ai_type: "image",
  default_engine: "dalle",
  engines: {
    dalle: { cost: 5 },
    seddream: { cost: 2 },
    midjourney: { cost: 8 }
  },
  updated_at: 1704400000000,
  updated_by: "admin@example.com"
}

video: {
  ai_type: "video",
  default_engine: "klingai",
  engines: {
    klingai: { cost: 10 },
    runway: { cost: 15 }
  },
  updated_at: 1704400000000,
  updated_by: "admin@example.com"
}
```

#### 3. `usage_logs` Collection (Enhanced)
Logs every AI generation with engine details.

**Document Structure:**
```typescript
{
  userId: string,
  userEmail: string,
  aiType: string,
  service: string,              // Engine name
  engine_id: string,            // NEW: Engine ID
  engine_name: string,          // NEW: Display name
  creditsUsed: number,
  input_size: number,           // NEW: Actual input (tokens, seconds, etc.)
  cost_per_unit: number,        // NEW: Cost at time of usage
  cost_unit: string,            // NEW: Unit type
  total_cost: number,           // NEW: Calculated cost
  status: string,               // "success" | "failed" | "pending"
  prompt?: string,
  promptHash?: string,
  duration?: number,
  tokens?: number,
  outputUrl?: string,
  errorMessage?: string,
  metadata?: object,
  timestamp: number,
  ipAddress?: string,
  deviceInfo?: string
}
```

---

## 🔐 Security Rules

Add these rules to your Firestore security rules:

```javascript
// AI Engines - Read by authenticated users, write by admins only
match /ai_engines/{engineId} {
  allow read: if isAuthenticated() && isAccountActive();
  allow write: if isAdmin();
}

// Credit Pricing - Read by authenticated users, write by admins only
match /credit_pricing/{aiType} {
  allow read: if isAuthenticated() && isAccountActive();
  allow write: if isAdmin();
}

// Usage Logs - Users can only read their own, admins can read all
match /usage_logs/{logId} {
  allow read: if isAdmin() || 
                 (isAuthenticated() && resource.data.userId == request.auth.uid);
  allow create: if false; // Only Cloud Functions can create
  allow update, delete: if false; // Immutable logs
}
```

---

## ☁️ Cloud Functions

### 1. `validateAndDeductEngineCredits`
Main function for engine-based credit deduction.

**Usage:**
```typescript
const functions = getFunctions();
const deductCredits = httpsCallable(functions, 'validateAndDeductEngineCredits');

const result = await deductCredits({
  userId: user.uid,
  ai_type: 'image',
  engine_id: 'dalle',
  input_size: 1,           // 1 image
  prompt: 'A beautiful sunset',
  metadata: {
    resolution: 'HD',
    aspect_ratio: '16:9'
  }
});

// Response:
{
  success: true,
  activityId: 'abc123',
  cost: 5,
  newBalance: 95,
  message: 'Successfully deducted 5 credits for DALL-E 3'
}
```

**Flow:**
1. ✅ Authenticate user
2. ✅ Validate engine exists and is active
3. ✅ Calculate cost: `base_cost × input_size`
4. ✅ Check rate limits
5. ✅ Moderate prompt (if provided)
6. ✅ Check user credits
7. ✅ Deduct credits atomically
8. ✅ Log credit transaction
9. ✅ Create AI activity record
10. ✅ Log engine usage
11. ✅ Return success response

### 2. `getEnginePricing`
Get available engines and pricing.

**Usage:**
```typescript
const result = await httpsCallable(functions, 'getEnginePricing')({
  ai_type: 'image',        // Optional filter
  include_inactive: false  // Optional
});

// Response:
{
  success: true,
  engines: [...],
  pricing_config: [...]
}
```

### 3. `updateEngineConfig` (Admin Only)
Update engine configuration.

**Usage:**
```typescript
await httpsCallable(functions, 'updateEngineConfig')({
  engine_id: 'dalle',
  updates: {
    base_cost: 6,
    is_active: true,
    description: 'Updated description'
  }
});
```

### 4. `updateCreditPricingConfig` (Admin Only)
Update pricing configuration.

**Usage:**
```typescript
await httpsCallable(functions, 'updateCreditPricingConfig')({
  ai_type: 'image',
  pricing: {
    default_engine: 'dalle',
    engines: {
      dalle: { cost: 5 },
      seddream: { cost: 2 }
    }
  }
});
```

---

## 🎨 Admin Dashboard

### Features

#### 1. Engine Management Table
- **View all engines** grouped by AI type (Image, Video, Voice, Chat)
- **Real-time status**: Active/Disabled badge
- **Cost display**: Shows cost per unit
- **Usage statistics**: 30-day usage count and success rate
- **Quick actions**: Edit, Enable/Disable buttons

#### 2. Engine Editor Modal
**Fields:**
- Engine ID (unique, lowercase, immutable after creation)
- Engine Name (display name)
- AI Type (image/video/voice/chat dropdown)
- Status (Active/Disabled)
- Base Cost (numeric input)
- Cost Unit (dropdown: image, second, minute, token, message)
- Description (textarea)

**Actions:**
- Add new engine
- Edit existing engine
- Save changes (immediate effect)
- Cancel editing

#### 3. Statistics Dashboard
**Metrics:**
- Total Engines
- Active Engines
- Total Usage (30 days)
- Success Rate

**Per-Engine Stats:**
- Usage count
- Total credits consumed
- Average credits per use
- Success rate
- Last used timestamp

---

## 🔧 Integration Examples

### Example 1: DALL-E Integration
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

async function generateImage(prompt: string, userId: string) {
  const functions = getFunctions();
  const deductCredits = httpsCallable(functions, 'validateAndDeductEngineCredits');

  // 1. Deduct credits
  const creditResult = await deductCredits({
    userId,
    ai_type: 'image',
    engine_id: 'dalle',
    input_size: 1,
    prompt,
    metadata: { quality: 'hd' }
  });

  if (!creditResult.data.success) {
    throw new Error(creditResult.data.message);
  }

  const activityId = creditResult.data.activityId;

  try {
    // 2. Call DALL-E API
    const response = await fetch('/api/dalle3', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    const result = await response.json();

    // 3. Update activity status
    await updateAIActivityStatus(activityId, 'completed', result.url);

    return result;
  } catch (error) {
    // 4. Update activity as failed
    await updateAIActivityStatus(activityId, 'failed', null, error.message);
    throw error;
  }
}
```

### Example 2: Video Generation (Per-Second Pricing)
```typescript
async function generateVideo(prompt: string, durationSeconds: number, userId: string) {
  const functions = getFunctions();
  const deductCredits = httpsCallable(functions, 'validateAndDeductEngineCredits');

  // Calculate cost: 10 credits per second
  const creditResult = await deductCredits({
    userId,
    ai_type: 'video',
    engine_id: 'klingai',
    input_size: durationSeconds,
    prompt,
    metadata: { duration: durationSeconds }
  });

  // Cost will be: 10 * durationSeconds
  // Example: 5 seconds = 50 credits
}
```

### Example 3: Voice Synthesis (Per-Minute Pricing)
```typescript
async function generateVoice(text: string, userId: string) {
  const estimatedMinutes = text.length / 300; // Rough estimate

  const creditResult = await deductCredits({
    userId,
    ai_type: 'voice',
    engine_id: 'elevenlabs',
    input_size: estimatedMinutes,
    prompt: text.substring(0, 100),
    metadata: { text_length: text.length }
  });

  // Cost will be: 3 * estimatedMinutes
}
```

### Example 4: Chat (Per-Token Pricing)
```typescript
async function sendChatMessage(message: string, userId: string) {
  const estimatedTokens = message.length / 4; // ~4 chars per token

  const creditResult = await deductCredits({
    userId,
    ai_type: 'chat',
    engine_id: 'gemini',
    input_size: estimatedTokens,
    prompt: message,
    metadata: {}
  });

  // Cost will be: 0.001 * estimatedTokens
}
```

---

## 📈 Analytics & Monitoring

### Get Engine Statistics
```typescript
import { getEngineStats } from '../services/firebase';

// Get stats for all engines (last 30 days)
const stats = await getEngineStats(undefined, 30);

console.log(stats);
// {
//   totalUsage: 1234,
//   totalCredits: 5678,
//   successRate: 95.5,
//   byEngine: [
//     {
//       engine_id: 'dalle',
//       engine_name: 'DALL-E 3',
//       ai_type: 'image',
//       total_usage_count: 456,
//       total_credits_used: 2280,
//       average_credits_per_use: 5,
//       success_rate: 98.2
//     },
//     ...
//   ]
// }
```

### Real-Time Pricing Updates
```typescript
import { subscribeToEnginePricing } from '../services/firebase';

// Subscribe to pricing changes for image engines
const unsubscribe = subscribeToEnginePricing('image', (pricing) => {
  console.log('Pricing updated:', pricing);
  // Update UI immediately
});

// Cleanup
unsubscribe();
```

---

## 🚀 Deployment Steps

### 1. Initialize Engine Data
```bash
node scripts/init-engines.js
```

### 2. Deploy Cloud Functions
```bash
firebase deploy --only functions
```

### 3. Update Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 4. Test in Admin Dashboard
- Navigate to Admin Dashboard → Credits tab
- Scroll to "AI Engine Pricing" section
- Add your first engine
- Test credit deduction

---

## 📝 Engine Configuration Script

Create `scripts/init-engines.js`:

```javascript
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

const engines = [
  // Image engines
  {
    id: 'dalle',
    engine_name: 'DALL-E 3',
    ai_type: 'image',
    is_active: true,
    base_cost: 5,
    cost_unit: 'image',
    description: 'High-quality image generation from OpenAI',
    provider: 'OpenAI',
    version: '3'
  },
  {
    id: 'seddream',
    engine_name: 'Seddream Pro',
    ai_type: 'image',
    is_active: true,
    base_cost: 2,
    cost_unit: 'image',
    description: 'Fast, cost-effective image generation'
  },
  // Video engines
  {
    id: 'klingai',
    engine_name: 'Kling AI',
    ai_type: 'video',
    is_active: true,
    base_cost: 10,
    cost_unit: 'second',
    description: 'Advanced video generation engine'
  },
  // Voice engines
  {
    id: 'elevenlabs',
    engine_name: 'ElevenLabs',
    ai_type: 'voice',
    is_active: true,
    base_cost: 3,
    cost_unit: 'minute',
    description: 'Natural voice synthesis'
  },
  // Chat engines
  {
    id: 'gemini',
    engine_name: 'Gemini Pro',
    ai_type: 'chat',
    is_active: true,
    base_cost: 0.001,
    cost_unit: 'token',
    description: "Google's multimodal AI"
  }
];

async function initEngines() {
  for (const engine of engines) {
    await db.collection('ai_engines').doc(engine.id).set({
      ...engine,
      created_at: Date.now(),
      updated_at: Date.now()
    });
    console.log(`✅ Created engine: ${engine.id}`);
  }

  // Initialize pricing config
  const pricingConfigs = [
    { ai_type: 'image', default_engine: 'dalle', engines: { dalle: { cost: 5 }, seddream: { cost: 2 } } },
    { ai_type: 'video', default_engine: 'klingai', engines: { klingai: { cost: 10 } } },
    { ai_type: 'voice', default_engine: 'elevenlabs', engines: { elevenlabs: { cost: 3 } } },
    { ai_type: 'chat', default_engine: 'gemini', engines: { gemini: { cost: 0.001 } } }
  ];

  for (const config of pricingConfigs) {
    await db.collection('credit_pricing').doc(config.ai_type).set({
      ...config,
      updated_at: Date.now(),
      updated_by: 'system'
    });
    console.log(`✅ Created pricing config: ${config.ai_type}`);
  }

  console.log('\n🎉 Engine initialization complete!');
  process.exit(0);
}

initEngines().catch(console.error);
```

Run: `node scripts/init-engines.js`

---

## ✨ Benefits

1. **Zero Code Deployment**: Change prices instantly without redeploying
2. **Multi-Engine Support**: Run multiple engines per AI type
3. **Flexible Pricing**: Different cost units (image, second, minute, token)
4. **Real-Time Updates**: Changes apply immediately to all users
5. **Complete Audit Trail**: All changes logged with admin info
6. **Usage Analytics**: Track which engines are popular
7. **A/B Testing**: Enable/disable engines to test performance
8. **Cost Optimization**: Adjust prices based on actual API costs
9. **Scalable**: Add unlimited engines without code changes
10. **Secure**: Admin-only access, client-side read-only

---

## 🎯 Future Enhancements

1. **Regional Pricing**: Different costs per user location
2. **Plan-Based Pricing**: Premium users get discounts
3. **Time-Based Pricing**: Different costs during peak hours
4. **Bulk Discounts**: Lower cost per unit for large batches
5. **Engine Fallbacks**: Automatic failover to backup engine
6. **Cost Predictions**: Estimate cost before generation
7. **Budget Limits**: Set monthly spending caps per user
8. **Promotional Pricing**: Temporary discounts on engines
9. **Engine Recommendations**: Suggest best engine based on prompt
10. **Cost Analytics Dashboard**: Visualize spending by engine

---

## 📚 API Reference

See `services/firebase.ts` for complete function documentation:
- `getAllEngines()`
- `getEnginesByType(aiType)`
- `getActiveEngines()`
- `getEngine(engineId)`
- `setEngine(engineId, data)`
- `updateEngineStatus(engineId, isActive)`
- `updateEngineCost(engineId, cost)`
- `getCreditPricing(aiType)`
- `setCreditPricing(aiType, data)`
- `calculateEngineCost(engineId, inputSize)`
- `logEngineUsage(data)`
- `getEngineStats(engineId?, days?)`
- `subscribeToEnginePricing(aiType, callback)`
- `subscribeToAllEngines(callback)`

---

**Built for Runway/Midjourney-level AI SaaS platforms 🚀**
