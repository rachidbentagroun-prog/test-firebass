# 🔥 PLAN PRICING SYSTEM - COMPLETE DOCUMENTATION

**Version:** 2.0  
**Last Updated:** January 2025

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Pricing Resolution Logic](#pricing-resolution-logic)
4. [Data Models](#data-models)
5. [Implementation Guide](#implementation-guide)
6. [Admin Dashboard Usage](#admin-dashboard-usage)
7. [Integration Examples](#integration-examples)
8. [Testing & Validation](#testing--validation)
9. [Troubleshooting](#troubleshooting)
10. [Migration Guide](#migration-guide)

---

## 1. Overview

### What is the Plan Pricing System?

The Plan Pricing System allows you to set **different credit costs per subscription plan** for each AI engine. This enables:

- **Tiered Pricing**: Free users pay more credits, Pro/Enterprise users pay less
- **Dynamic Discounts**: Apply plan-specific discounts without code changes
- **No Code Redeployment**: All pricing changes happen in Firestore
- **3-Tier Resolution**: Plan override → Engine default → Global default

### Key Features

✅ Per-plan engine pricing overrides  
✅ 3-tier pricing resolution with fallback  
✅ Admin dashboard for pricing management  
✅ Caching with TTL to reduce Firestore reads  
✅ Real-time pricing updates  
✅ Server-side credit calculations  
✅ Comprehensive security rules  
✅ Usage analytics by plan  

---

## 2. Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React)                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  User triggers AI generation (image/video/voice/chat)    │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CLOUD FUNCTION: getCreditCost                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  1. Check plan_pricing_overrides (Plan Override)         │  │
│  │  2. Check ai_engines (Engine Default)                    │  │
│  │  3. Check credit_pricing (Global Default)                │  │
│  │  4. Return cost + pricing_source                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│             CLOUD FUNCTION: validateAndDeductEngineCredits       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  1. Call getCreditCost to get final price                │  │
│  │  2. Validate user has enough credits                     │  │
│  │  3. Deduct credits                                       │  │
│  │  4. Log usage with pricing_source                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FIRESTORE COLLECTIONS                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  subscription_plans: Plan configs (Free/Basic/Pro/Ent)   │  │
│  │  plan_pricing_overrides: Per-plan engine costs           │  │
│  │  ai_engines: Engine default costs                        │  │
│  │  credit_pricing: Global AI type defaults                 │  │
│  │  usage_logs: Usage history with pricing_source           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Collections

| Collection | Purpose | Admin Write | User Read |
|------------|---------|-------------|-----------|
| `subscription_plans` | Plan configs (price, credits, features) | ✅ | ✅ |
| `plan_pricing_overrides` | Per-plan engine cost overrides | ✅ | ❌ |
| `ai_engines` | Engine configs with default costs | ✅ | ✅ |
| `credit_pricing` | Global AI type default costs | ✅ | ✅ |
| `usage_logs` | Usage history with pricing source | ❌ (Cloud Function) | ✅ (own logs) |

---

## 3. Pricing Resolution Logic

### 3-Tier Priority System

```javascript
// Priority 1: Plan-specific override (HIGHEST)
if (plan_pricing_overrides[userPlan][aiType][engineId]) {
  return plan_pricing_overrides[userPlan][aiType][engineId].cost;
}

// Priority 2: Engine default cost
if (ai_engines[engineId].base_cost) {
  return ai_engines[engineId].base_cost;
}

// Priority 3: Global AI type default (LOWEST)
if (credit_pricing[aiType].engines[engineId]) {
  return credit_pricing[aiType].engines[engineId].cost;
}

// No pricing found
throw new Error('No pricing found for this engine');
```

### Example Scenario

**User:** Pro plan  
**Action:** Generate image with `dall-e-3`

```
1. Check: plan_pricing_overrides/pro/ai_types/image/dall-e-3
   ✅ Found: 4 credits (20% discount)
   
2. Return: {
     cost_per_unit: 4,
     total_cost: 4,
     pricing_source: 'plan_override'
   }
```

**User:** Basic plan  
**Action:** Generate image with `dall-e-3`

```
1. Check: plan_pricing_overrides/basic/ai_types/image/dall-e-3
   ❌ Not found
   
2. Check: ai_engines/dall-e-3/base_cost
   ✅ Found: 5 credits
   
3. Return: {
     cost_per_unit: 5,
     total_cost: 5,
     pricing_source: 'engine_default'
   }
```

### Caching Strategy

```javascript
// Cache key: plan:aiType:engineId
const cacheKey = `pro:image:dall-e-3`;

// TTL: 5 minutes
const CACHE_TTL = 5 * 60 * 1000;

// Cache structure
{
  data: {
    cost_per_unit: 4,
    pricing_source: 'plan_override',
    engine_name: 'DALL-E 3',
    cost_unit: 'image'
  },
  timestamp: 1704067200000
}
```

---

## 4. Data Models

### SubscriptionPlan

```typescript
interface SubscriptionPlan {
  id: PlanTier; // 'free' | 'basic' | 'pro' | 'enterprise'
  name: string; // "Pro"
  description: string;
  monthly_price: number; // 29.99
  yearly_price: number; // 299.00
  monthly_credits: number; // 500
  yearly_credits: number; // 6000
  
  features: {
    image: boolean;
    video: boolean;
    voice: boolean;
    chat: boolean;
    multimodal: boolean;
    priority_queue: boolean;
    api_access: boolean;
    custom_models: boolean;
    team_collaboration: boolean;
    advanced_analytics: boolean;
  };
  
  limits: {
    daily_generations: number; // 200
    max_image_resolution: string; // '1920x1080'
    max_video_duration: number; // 30 seconds
    max_voice_duration: number; // 300 seconds
    concurrent_generations: number; // 5
    max_storage_gb: number; // 50
  };
  
  billing_interval: 'monthly' | 'yearly' | null;
  is_popular: boolean;
  sort_order: number;
  created_at: number;
  updated_at: number;
}
```

### PlanPricingOverride

```typescript
interface PlanPricingOverride {
  plan_id: PlanTier;
  
  ai_types: {
    image?: {
      [engineId: string]: {
        cost: number; // Override cost in credits
        enabled?: boolean; // Default: true
      };
    };
    video?: {
      [engineId: string]: {
        cost: number;
        enabled?: boolean;
      };
    };
    voice?: {
      [engineId: string]: {
        cost: number;
        enabled?: boolean;
      };
    };
    chat?: {
      [engineId: string]: {
        cost: number;
        enabled?: boolean;
      };
    };
  };
  
  updated_at: number;
  updated_by?: string;
}
```

### CreditCostResult

```typescript
interface CreditCostResult {
  cost_per_unit: number; // Cost per unit
  total_cost: number; // Final cost after multiplying by input_size
  input_size: number; // Input size (tokens, seconds, images, etc.)
  pricing_source: 'plan_override' | 'engine_default' | 'global_default';
  engine_id: string;
  engine_name: string;
  ai_type: AIType;
  user_plan: PlanTier;
  cost_unit: 'image' | 'second' | 'token' | 'message' | 'minute';
}
```

### PlanUsageLog

```typescript
interface PlanUsageLog {
  userId: string;
  aiType: AIType;
  engine_id: string;
  engine_name: string;
  creditsUsed: number;
  pricing_source: 'plan_override' | 'engine_default' | 'global_default';
  subscription_plan: PlanTier;
  prompt: string;
  promptHash: string;
  status: 'pending' | 'completed' | 'failed';
  resultUrl?: string;
  errorMessage?: string;
  timestamp: number;
  ipAddress: string;
}
```

---

## 5. Implementation Guide

### Step 1: Initialize Subscription Plans

```bash
# Run initialization script
node scripts/init-plans.js

# With pricing overrides
node scripts/init-plans.js --with-overrides
```

This creates:
- 4 subscription plans (Free, Basic, Pro, Enterprise)
- Default pricing overrides for Pro and Enterprise (20-40% discounts)

### Step 2: Update Firestore Security Rules

```bash
# Deploy security rules
firebase deploy --only firestore:rules
```

See [PLAN_PRICING_SECURITY_RULES.md](./PLAN_PRICING_SECURITY_RULES.md) for complete rules.

### Step 3: Update User Documents

Add `subscription_plan` field to user documents:

```javascript
// In your user creation function
await db.collection('users').doc(userId).set({
  email: email,
  credits: 10,
  subscription_plan: 'free', // 👈 Add this
  subscription_status: 'active',
  role: 'user',
  createdAt: Date.now()
});
```

### Step 4: Integrate Credit Deduction

```typescript
// In your AI generation function
import { functions } from './services/firebase';

const deductCredits = functions.httpsCallable('validateAndDeductEngineCredits');

const result = await deductCredits({
  ai_type: 'image',
  engine_id: 'dall-e-3',
  input_size: 1,
  prompt: userPrompt
});

if (result.data.success) {
  // Proceed with generation
  console.log(`✅ Charged ${result.data.creditsUsed} credits`);
  console.log(`💰 Pricing source: ${result.data.pricing_source}`);
} else {
  alert(result.data.message);
}
```

### Step 5: Deploy Cloud Functions

```bash
cd functions
npm install
firebase deploy --only functions
```

Functions deployed:
- `getCreditCost` - Pricing resolver
- `validateAndDeductEngineCredits` - Credit deduction
- `getEnginePricing` - Get all engine pricing
- `updateEngineConfig` - Admin: Update engine
- `updateCreditPricingConfig` - Admin: Update pricing

---

## 6. Admin Dashboard Usage

### Accessing Plan Pricing Overrides

1. Navigate to Admin Dashboard
2. Click "Credits" tab
3. Scroll to "Plan Pricing Overrides" section

### Setting Plan-Specific Pricing

#### Step 1: Select Plan

Use the dropdown to select which plan to configure:

```
Select Plan: [Pro - $29.99/mo ▼]
```

#### Step 2: Choose AI Type

Filter by AI type to see relevant engines:

```
[Image] [Video] [Voice] [Chat]
```

#### Step 3: Set Override Costs

For each engine, you can:

- **Override Cost**: Set custom credit cost
- **Enable/Disable**: Toggle engine availability for this plan
- **Remove Override**: Revert to engine default

```
┌────────────────────────────────────────────────────────────────┐
│ Engine             │ Default │ Override │ Status     │ Action │
├────────────────────┼─────────┼──────────┼────────────┼────────┤
│ DALL-E 3          │ 5       │ [4____]  │ [Enabled]  │ ✓ Active│
│ Midjourney V6     │ 10      │ [8____]  │ [Enabled]  │ ✓ Active│
│ Stable Diffusion  │ 3       │ [3____]  │ [Enabled]  │ Default │
└────────────────────────────────────────────────────────────────┘
```

#### Step 4: Save Changes

Click "Save Overrides" to commit changes to Firestore.

### Best Practices

1. **Start with Pro Plan**: Set discounted rates for Pro users first
2. **Test Before Saving**: Verify override costs make sense
3. **Monitor Usage**: Check Plan Usage Stats regularly
4. **Gradual Rollout**: Test with one engine before mass updates

---

## 7. Integration Examples

### Example 1: Get Credit Cost Before Generation

```typescript
import { functions } from './services/firebase';

async function checkCreditCost(userPlan: string, aiType: string, engineId: string) {
  const getCost = functions.httpsCallable('getCreditCost');
  
  const result = await getCost({
    user_plan: userPlan,
    ai_type: aiType,
    engine_id: engineId,
    input_size: 1
  });
  
  const { cost_per_unit, pricing_source } = result.data;
  
  console.log(`💰 Cost: ${cost_per_unit} credits (${pricing_source})`);
  
  return result.data;
}

// Usage
const cost = await checkCreditCost('pro', 'image', 'dall-e-3');
// Output: 💰 Cost: 4 credits (plan_override)
```

### Example 2: Display Pricing to User

```typescript
function DisplayPricing({ userPlan, aiType, engines }) {
  const [pricing, setPricing] = useState({});
  
  useEffect(() => {
    async function loadPricing() {
      const getCost = functions.httpsCallable('getCreditCost');
      const prices = {};
      
      for (const engine of engines) {
        const result = await getCost({
          user_plan: userPlan,
          ai_type: aiType,
          engine_id: engine.id,
          input_size: 1
        });
        prices[engine.id] = result.data;
      }
      
      setPricing(prices);
    }
    
    loadPricing();
  }, [userPlan, aiType, engines]);
  
  return (
    <div>
      {engines.map(engine => (
        <div key={engine.id}>
          <h3>{engine.name}</h3>
          <p>{pricing[engine.id]?.cost_per_unit || '...'} credits</p>
          {pricing[engine.id]?.pricing_source === 'plan_override' && (
            <span className="badge">Pro Discount Active!</span>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Example 3: Upgrade Flow

```typescript
async function upgradeUserPlan(userId: string, newPlan: string) {
  const db = getFirestore();
  
  // Update user's plan
  await db.collection('users').doc(userId).update({
    subscription_plan: newPlan,
    subscription_status: 'active',
    subscription_start_date: Date.now(),
    updated_at: Date.now()
  });
  
  // Add credits for new plan
  const planDoc = await db.collection('subscription_plans').doc(newPlan).get();
  const planData = planDoc.data();
  
  await db.collection('users').doc(userId).update({
    credits: firebase.firestore.FieldValue.increment(planData.monthly_credits)
  });
  
  console.log(`✅ User upgraded to ${newPlan} plan with ${planData.monthly_credits} credits`);
}
```

### Example 4: Usage Analytics by Plan

```typescript
import { getPlanUsageStats } from './services/firebase';

async function showPlanAnalytics() {
  const stats = await getPlanUsageStats(undefined, 30); // All plans, last 30 days
  
  stats.forEach(plan => {
    console.log(`
      Plan: ${plan.plan_id.toUpperCase()}
      Users: ${plan.total_users}
      Generations: ${plan.total_generations}
      Credits Used: ${plan.total_credits_used}
      Avg per User: ${plan.average_credits_per_user.toFixed(2)}
    `);
  });
}
```

---

## 8. Testing & Validation

### Test Plan Override Resolution

```javascript
// Test script: test-pricing-resolution.js
const admin = require('firebase-admin');
admin.initializeApp();

async function testPricingResolution() {
  const testCases = [
    {
      plan: 'pro',
      aiType: 'image',
      engineId: 'dall-e-3',
      expected: 'plan_override',
      expectedCost: 4
    },
    {
      plan: 'basic',
      aiType: 'image',
      engineId: 'dall-e-3',
      expected: 'engine_default',
      expectedCost: 5
    },
    {
      plan: 'free',
      aiType: 'image',
      engineId: 'unknown-engine',
      expected: 'error'
    }
  ];
  
  for (const test of testCases) {
    try {
      const result = await functions.httpsCallable('getCreditCost')({
        user_plan: test.plan,
        ai_type: test.aiType,
        engine_id: test.engineId,
        input_size: 1
      });
      
      console.log(`✅ ${test.plan}/${test.aiType}/${test.engineId}`);
      console.log(`   Source: ${result.data.pricing_source}`);
      console.log(`   Cost: ${result.data.cost_per_unit}`);
      
      if (result.data.pricing_source !== test.expected) {
        console.error(`❌ FAILED: Expected ${test.expected}, got ${result.data.pricing_source}`);
      }
    } catch (err) {
      if (test.expected === 'error') {
        console.log(`✅ ${test.plan}/${test.aiType}/${test.engineId} - Error expected and caught`);
      } else {
        console.error(`❌ FAILED: ${err.message}`);
      }
    }
  }
}

testPricingResolution();
```

### Validate Firestore Security

```javascript
// Test with regular user account
firebase.auth().signInWithEmailAndPassword('user@example.com', 'password');

// Should succeed: Read own plan
await db.collection('subscription_plans').get();

// Should fail: Write to pricing overrides
await db.collection('plan_pricing_overrides').doc('pro').set({});
// Error: Missing or insufficient permissions

// Should fail: Read pricing overrides
await db.collection('plan_pricing_overrides').get();
// Error: Missing or insufficient permissions
```

---

## 9. Troubleshooting

### Issue: "No pricing found" Error

**Cause:** Engine has no pricing in any tier

**Solution:**
1. Check engine exists: `db.collection('ai_engines').doc(engineId).get()`
2. Verify engine has `base_cost` field
3. Check global pricing: `db.collection('credit_pricing').doc(aiType).get()`

### Issue: Plan override not applying

**Cause:** Cache or incorrect plan ID

**Solution:**
```javascript
// Clear Cloud Function cache (redeploy)
firebase deploy --only functions

// Verify override exists
const override = await db.collection('plan_pricing_overrides').doc(userPlan).get();
console.log(override.data());

// Check user's plan
const user = await db.collection('users').doc(userId).get();
console.log(user.data().subscription_plan);
```

### Issue: Pricing changed but user still sees old price

**Cause:** Client-side caching or cache TTL not expired

**Solution:**
- Cache TTL is 5 minutes
- Wait for cache to expire or redeploy Cloud Functions
- Use `Date.now()` in cache key to force refresh during testing

### Issue: Permission denied when saving overrides

**Cause:** User is not admin

**Solution:**
```javascript
// Grant admin role
await db.collection('users').doc(userId).update({
  role: 'admin'
});

// Or use init script
node scripts/grant-admin.js user@example.com
```

---

## 10. Migration Guide

### Migrating from Old Credit System

If you had hardcoded credit costs:

```javascript
// OLD CODE (REMOVE)
const imageCost = 5;
await deductCredits(userId, imageCost);

// NEW CODE
const deduct = functions.httpsCallable('validateAndDeductEngineCredits');
await deduct({
  ai_type: 'image',
  engine_id: 'dall-e-3',
  input_size: 1,
  prompt: prompt
});
```

### Adding subscription_plan to Existing Users

```javascript
// Migration script
const users = await db.collection('users').get();

for (const userDoc of users.docs) {
  if (!userDoc.data().subscription_plan) {
    await userDoc.ref.update({
      subscription_plan: 'free',
      subscription_status: 'active',
      subscription_start_date: Date.now()
    });
    console.log(`✅ Updated ${userDoc.id} to free plan`);
  }
}
```

### Migrating Old Usage Logs

Old logs won't have `pricing_source` or `subscription_plan` fields. That's okay - they're backward compatible. New logs will include these fields automatically.

---

## 📚 Related Documentation

- [Engine Pricing System](./ENGINE_PRICING_SYSTEM.md) - Base engine pricing
- [Security Rules](./PLAN_PRICING_SECURITY_RULES.md) - Firestore security
- [Admin Dashboard Guide](./ADMIN_DASHBOARD_FEATURES.md) - Dashboard usage
- [Firebase Functions](./functions/README.md) - Cloud Functions API

---

## 🆘 Support

If you encounter issues:

1. Check Cloud Function logs: `firebase functions:log`
2. Verify Firestore rules: `firebase firestore:rules list`
3. Test with admin account first
4. Review usage logs for pricing_source field
5. Check this documentation's troubleshooting section

---

## 📝 Changelog

**Version 2.0 (January 2025)**
- Added per-plan pricing overrides
- 3-tier pricing resolution
- Plan management UI in Admin Dashboard
- Caching with TTL
- Enhanced usage logs with pricing source

**Version 1.0 (December 2024)**
- Initial engine pricing system
- Admin dashboard for engine management
- Cloud Functions for credit deduction

---

**Built with ❤️ for Firebass AI SaaS Platform**
