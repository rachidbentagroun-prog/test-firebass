# 🚀 PLAN PRICING QUICK START GUIDE

Get your subscription plan pricing system up and running in 10 minutes!

---

## ⚡ Quick Setup (10 Minutes)

### Step 1: Initialize Subscription Plans (2 min)

```bash
# Create default plans (Free, Basic, Pro, Enterprise)
node scripts/init-plans.js

# Or with pricing overrides for Pro/Enterprise
node scripts/init-plans.js --with-overrides
```

**Output:**
```
✅ Free - $0/mo - 10 credits
✅ Basic - $9.99/mo - 100 credits
✅ Pro - $29.99/mo - 500 credits
✅ Enterprise - $99.99/mo - 2000 credits
```

---

### Step 2: Deploy Cloud Functions (3 min)

```bash
cd functions
npm install
firebase deploy --only functions
```

**Functions Deployed:**
- `getCreditCost` - Pricing resolver with 3-tier logic
- `validateAndDeductEngineCredits` - Credit deduction
- `getEnginePricing` - Get all engine pricing
- `updateEngineConfig` - Admin: Update engines
- `updateCreditPricingConfig` - Admin: Update pricing

---

### Step 3: Update Firestore Security Rules (1 min)

```bash
firebase deploy --only firestore:rules
```

**Rules Applied:**
- ✅ Admin-only write to `plan_pricing_overrides`
- ✅ Users can read `subscription_plans`
- ✅ Users cannot read pricing overrides
- ✅ Immutable usage logs

---

### Step 4: Update User Documents (2 min)

Add `subscription_plan` field to existing users:

```javascript
// Quick migration script
const db = require('firebase-admin').firestore();

async function migrateUsers() {
  const users = await db.collection('users').get();
  
  for (const doc of users.docs) {
    if (!doc.data().subscription_plan) {
      await doc.ref.update({
        subscription_plan: 'free',
        subscription_status: 'active'
      });
      console.log(`✅ ${doc.id} → free plan`);
    }
  }
}

migrateUsers();
```

---

### Step 5: Test in Admin Dashboard (2 min)

1. Open your app
2. Navigate to Admin Dashboard
3. Click "Credits" tab
4. Scroll to "Plan Pricing Overrides"
5. Select "Pro" plan
6. Set override for `dall-e-3`: **4 credits** (20% discount)
7. Click "Save Overrides"

✅ Done! Pro users now pay 4 credits instead of 5 for DALL-E 3.

---

## 📝 Usage in Your Code

### Get Credit Cost

```typescript
import { functions } from './services/firebase';

const getCost = functions.httpsCallable('getCreditCost');

const result = await getCost({
  user_plan: 'pro',
  ai_type: 'image',
  engine_id: 'dall-e-3',
  input_size: 1
});

console.log(result.data.cost_per_unit); // 4
console.log(result.data.pricing_source); // 'plan_override'
```

### Deduct Credits

```typescript
const deduct = functions.httpsCallable('validateAndDeductEngineCredits');

const result = await deduct({
  ai_type: 'image',
  engine_id: 'dall-e-3',
  input_size: 1,
  prompt: 'A beautiful sunset'
});

if (result.data.success) {
  // Proceed with generation
  console.log(`✅ Charged ${result.data.creditsUsed} credits`);
} else {
  alert(result.data.message);
}
```

---

## 🎯 Common Tasks

### Set Pro User Discounts (20% off)

```javascript
// Admin Dashboard → Credits → Plan Pricing Overrides
// Select: Pro plan
// AI Type: Image

dall-e-3:         5 → 4 credits
midjourney-v6:   10 → 8 credits
stable-diffusion: 3 → 3 credits (no discount)
```

### Set Enterprise Discounts (40% off)

```javascript
// Select: Enterprise plan
// AI Type: Video

runway-gen3:  15 → 9 credits
kling-ai-pro: 20 → 12 credits
sora:        100 → 60 credits
```

### Remove Override (Revert to Default)

1. Navigate to engine in Plan Pricing Overrides
2. Click "X" button next to "Override Active"
3. Engine now uses default cost

---

## 🔍 Verify It's Working

### Test 1: Check Pricing Resolution

```bash
# In Firebase Console → Functions → getCreditCost → Test

{
  "user_plan": "pro",
  "ai_type": "image",
  "engine_id": "dall-e-3",
  "input_size": 1
}

# Expected result:
{
  "cost_per_unit": 4,
  "pricing_source": "plan_override",
  "total_cost": 4
}
```

### Test 2: Check Usage Logs

```javascript
// After a generation, check Firestore
db.collection('usage_logs')
  .orderBy('timestamp', 'desc')
  .limit(1)
  .get()

// Should have these fields:
{
  userId: "user123",
  creditsUsed: 4,
  subscription_plan: "pro",
  pricing_source: "plan_override",
  engine_id: "dall-e-3",
  aiType: "image"
}
```

---

## 🛠️ Troubleshooting

### "No pricing found" Error

```bash
# Check if engine exists
firebase firestore:get ai_engines/dall-e-3

# Check if it has base_cost
# Expected: { base_cost: 5, is_active: true, ... }
```

### Plan Override Not Applying

```bash
# Check override exists
firebase firestore:get plan_pricing_overrides/pro

# Check user's plan
firebase firestore:get users/{userId}
# Expected: { subscription_plan: "pro", ... }

# Clear Cloud Function cache
firebase deploy --only functions
```

### Permission Denied

```bash
# Grant admin role
firebase firestore:set users/{adminUserId} --merge '{"role":"admin"}'

# Or use script
node scripts/grant-admin.js admin@example.com
```

---

## 📊 Monitoring

### View Plan Usage Stats

```typescript
import { getPlanUsageStats } from './services/firebase';

const stats = await getPlanUsageStats('pro', 30); // Pro plan, last 30 days

console.log(stats);
// {
//   plan_id: 'pro',
//   total_users: 50,
//   total_generations: 1200,
//   total_credits_used: 4800,
//   average_credits_per_user: 96,
//   by_ai_type: { ... }
// }
```

---

## 🎓 Next Steps

1. **Read Full Documentation**: [PLAN_PRICING_SYSTEM.md](./PLAN_PRICING_SYSTEM.md)
2. **Security Best Practices**: [PLAN_PRICING_SECURITY_RULES.md](./PLAN_PRICING_SECURITY_RULES.md)
3. **Engine Pricing System**: [ENGINE_PRICING_SYSTEM.md](./ENGINE_PRICING_SYSTEM.md)
4. **Admin Dashboard Guide**: [ADMIN_DASHBOARD_FEATURES.md](./ADMIN_DASHBOARD_FEATURES.md)

---

## 💡 Pro Tips

1. **Start with Free Plan**: Don't set overrides for free plan - use defaults
2. **Test on Staging**: Test pricing changes on staging before production
3. **Monitor Usage**: Check plan usage stats weekly
4. **Gradual Rollout**: Start with one engine, expand to others
5. **Cache Awareness**: Pricing changes may take 5 minutes to apply (cache TTL)

---

## 📞 Support

Need help? Check the troubleshooting section in [PLAN_PRICING_SYSTEM.md](./PLAN_PRICING_SYSTEM.md)

**Built with ❤️ for Firebass AI SaaS Platform**
