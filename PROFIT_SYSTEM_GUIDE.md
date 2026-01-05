# 💰 Profit & Cost Intelligence System - Complete Guide

> **Enterprise-Grade Financial Tracking for AI SaaS Platforms**  
> Version 1.0.0 | Built for subscription-based AI services

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Financial Formulas](#financial-formulas)
4. [Deployment Guide](#deployment-guide)
5. [Cloud Functions](#cloud-functions)
6. [Admin Dashboard](#admin-dashboard)
7. [Maintenance & Operations](#maintenance--operations)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 System Overview

### What is Profit Intelligence?

A **complete financial tracking system** that calculates **real AI costs**, **subscription revenue**, and **profit margins** in real-time for every AI generation request.

### Key Features

✅ **Real-time Cost Tracking** - Calculate actual AI costs per request  
✅ **Revenue Attribution** - Allocate subscription revenue proportionally  
✅ **Profit Margins** - Track profitability by user, plan, and engine  
✅ **Loss Detection** - Identify unprofitable users and plans  
✅ **Enterprise Dashboard** - Visual analytics for Super Admins  
✅ **Cloud Function-Driven** - Zero client-side calculations  
✅ **Firestore Optimized** - Efficient reads with caching & aggregation

### Technology Stack

- **Backend**: Firebase Cloud Functions (Node.js/TypeScript)
- **Database**: Firestore with TTL & composite indexes
- **Frontend**: Next.js + Tailwind CSS + Recharts
- **Security**: Firestore Security Rules (Super Admin only)
- **Scheduling**: Cloud Scheduler (cron jobs)

---

## 🏗️ Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. USER GENERATES AI CONTENT (Image/Video/Chat)            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  2. FIRESTORE TRIGGER: onGenerationCreated                   │
│     - Fetches engine cost from ai_engine_costs              │
│     - Calculates: cost, revenue, profit                     │
│     - Writes to usage_logs (with financial data)            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  3. SCHEDULED AGGREGATIONS (Daily/Monthly)                   │
│     - Reads all usage_logs for period                       │
│     - Aggregates by engine, plan, user                      │
│     - Writes to profit_aggregates                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  4. LOSS DETECTION (Hourly)                                  │
│     - Scans active users                                    │
│     - Calculates 30-day profit margins                      │
│     - Flags users with negative margins                     │
│     - Writes to loss_users & admin_alerts                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  5. ADMIN DASHBOARD                                          │
│     - Fetches profit_aggregates (pre-computed)              │
│     - Displays charts, metrics, loss alerts                 │
│     - NO client-side aggregation                            │
└─────────────────────────────────────────────────────────────┘
```

### Firestore Collections

| Collection | Purpose | TTL | Access |
|------------|---------|-----|--------|
| `ai_engine_costs` | Master AI pricing config | ∞ | Super Admin |
| `usage_logs` | Per-request financial data | 90d | Admin read-only |
| `profit_aggregates` | Pre-computed summaries | ∞ | Admin read-only |
| `loss_users` | Unprofitable users | ∞ | Admin read-only |
| `profit_audit_log` | Pricing change history | 2yr | Admin read-only |
| `admin_alerts` | Loss detection alerts | 30d | Admin read-only |

---

## 📐 Financial Formulas

### 1️⃣ Cost Calculation

```typescript
real_cost_usd = engine_cost_per_unit × usage_units
```

**Example:**
- DALL·E 3: $0.04 per image
- User generates 1 image
- **Cost = $0.04**

### 2️⃣ Revenue Allocation

```typescript
allocated_revenue_usd = (plan_monthly_price / user_total_monthly_usage) × current_usage_units
```

**Example:**
- User on Pro plan: $29.99/month
- User's total monthly usage: 1000 images
- Current generation: 1 image
- **Revenue = $29.99 / 1000 × 1 = $0.03**

### 3️⃣ Profit Calculation

```typescript
profit_usd = revenue_estimated_usd - real_cost_usd
profit_margin_percent = (profit_usd / revenue_estimated_usd) × 100
```

**Example:**
- Revenue: $0.03
- Cost: $0.04
- **Profit = -$0.01 (LOSS)**
- **Margin = -33.33%**

### 4️⃣ Loss User Detection

```typescript
if (30_day_profit_margin < -10%) {
  flag_as_loss_user()
  send_admin_alert()
}
```

---

## 🚀 Deployment Guide

### Prerequisites

- Firebase project with Blaze plan (Cloud Functions)
- Firebase CLI installed: `npm install -g firebase-tools`
- Service account key (for initialization)
- Node.js 18+ and npm/yarn

### Step 1: Install Dependencies

```bash
cd functions
npm install firebase-admin firebase-functions
npm install --save-dev typescript @types/node
```

### Step 2: Copy Files to Your Project

```bash
# Cloud Functions
cp functions/profit-intelligence.ts functions/
cp functions/profit-aggregation.ts functions/
cp functions/loss-detection.ts functions/

# Types
cp types/profit-intelligence.types.ts types/

# Frontend Components
cp components/ProfitDashboard.tsx components/

# Scripts
cp scripts/init-profit-system.js scripts/
chmod +x scripts/init-profit-system.js

# Security Rules
cp firestore-security-rules/profit-intelligence.rules firestore.rules
```

### Step 3: Update functions/index.ts

```typescript
// Export all profit intelligence functions
export * from './profit-intelligence';
export * from './profit-aggregation';
export * from './loss-detection';
```

### Step 4: Initialize System

```bash
# Update serviceAccountKey.json path in script
node scripts/init-profit-system.js
```

This will:
- ✅ Seed AI engine costs (DALL·E, Gemini, GPT, etc.)
- ✅ Create subscription plan pricing
- ✅ Initialize system configuration
- ✅ Display required Firestore indexes

### Step 5: Create Firestore Indexes

**Option A: Firebase Console**

Go to: https://console.firebase.google.com/project/YOUR_PROJECT/firestore/indexes

Create composite indexes:

1. **usage_logs**
   - `user_id` (Ascending) + `created_at` (Descending)
   - `subscription_plan` (Ascending) + `created_at` (Descending)
   - `engine_id` (Ascending) + `created_at` (Descending)
   - `profit_usd` (Ascending) + `created_at` (Descending)

2. **profit_aggregates**
   - `period_type` (Ascending) + `period_start` (Descending)

3. **loss_users**
   - `subscription_plan` (Ascending) + `profit_margin_percent` (Ascending)

**Option B: gcloud CLI**

```bash
gcloud firestore indexes composite create \
  --collection-group=usage_logs \
  --field-config=field-path=user_id,order=ascending \
  --field-config=field-path=created_at,order=descending
```

### Step 6: Enable TTL (Time-To-Live)

```bash
# Usage logs - 90 day retention
gcloud firestore fields ttls update created_at \
  --collection-group=usage_logs \
  --enable-ttl

# Audit logs - 2 year retention
gcloud firestore fields ttls update changed_at \
  --collection-group=profit_audit_log \
  --enable-ttl
```

### Step 7: Deploy Cloud Functions

```bash
firebase deploy --only functions
```

Functions deployed:
- ✅ `onGenerationCreated` - Real-time cost tracking
- ✅ `aggregateDailyProfit` - Daily 00:01 UTC
- ✅ `aggregateMonthlyProfit` - Monthly 1st 01:00 UTC
- ✅ `detectLossUsers` - Hourly
- ✅ `getCostEstimate` - HTTP callable
- ✅ `updateEngineCost` - Admin only
- ✅ `getProfitAggregates` - Admin only
- ✅ `getLossUsers` - Admin only

### Step 8: Deploy Firestore Security Rules

```bash
firebase deploy --only firestore:rules
```

### Step 9: Grant Super Admin Role

```javascript
// In Firebase Console or Admin SDK
await admin.firestore().collection('users').doc(ADMIN_UID).update({
  role: 'super_admin'
});
```

### Step 10: Access Dashboard

Navigate to: `/admin/profit-intelligence` or integrate component:

```tsx
import ProfitDashboard from '@/components/ProfitDashboard';

export default function AdminProfitPage() {
  return <ProfitDashboard />;
}
```

---

## ☁️ Cloud Functions

### 1. Real-Time Cost Tracking

**Function:** `onGenerationCreated`  
**Trigger:** Firestore onCreate `/generations/{generationId}`  
**Purpose:** Calculate and log financial data for each AI generation

```typescript
export const onGenerationCreated = functions.firestore
  .document('generations/{generationId}')
  .onCreate(async (snap, context) => {
    // Fetch engine cost
    // Calculate cost, revenue, profit
    // Write to usage_logs
  });
```

### 2. Daily Aggregation

**Function:** `aggregateDailyProfit`  
**Schedule:** `1 0 * * *` (00:01 UTC daily)  
**Purpose:** Aggregate yesterday's financial data

```typescript
export const aggregateDailyProfit = functions
  .pubsub.schedule('1 0 * * *')
  .onRun(async () => {
    // Calculate aggregate for previous day
    // Write to profit_aggregates
  });
```

### 3. Monthly Aggregation

**Function:** `aggregateMonthlyProfit`  
**Schedule:** `0 1 1 * *` (01:00 UTC on 1st of month)  
**Purpose:** Aggregate previous month's financial data

### 4. Loss Detection

**Function:** `detectLossUsers`  
**Schedule:** `0 * * * *` (Every hour)  
**Purpose:** Scan for users with negative profit margins

---

## 📊 Admin Dashboard

### Features

1. **Metric Cards**
   - Total Revenue (with % change)
   - Total Cost (with % change)
   - Net Profit (with % change)
   - Profit Margin % (with trend)

2. **Charts**
   - Cost vs Revenue (line chart)
   - Top Cost Engines (bar chart)
   - Profit by Plan (bar chart)

3. **Loss Alerts**
   - Table of unprofitable users
   - Email, plan, cost, profit, margin
   - Days in loss

4. **Summary Stats**
   - Total users
   - Total generations
   - Loss user count

### Security

- ✅ Protected by super_admin role check
- ✅ All data fetched from Cloud Functions
- ✅ No client-side aggregation
- ✅ Read-only access to financial data

---

## 🔧 Maintenance & Operations

### Monitoring

**1. Check Aggregation Status**

```javascript
const latestDaily = await db.collection('profit_aggregates')
  .where('period_type', '==', 'daily')
  .orderBy('period_start', 'desc')
  .limit(1)
  .get();

console.log('Latest aggregation:', latestDaily.docs[0].data());
```

**2. Monitor Loss Users**

```javascript
const lossUsers = await db.collection('loss_users').get();
console.log(`${lossUsers.size} loss-making users`);
```

**3. Cloud Function Logs**

```bash
firebase functions:log --only onGenerationCreated
firebase functions:log --only aggregateDailyProfit
firebase functions:log --only detectLossUsers
```

### Updating Engine Costs

**Via Cloud Function (Recommended):**

```typescript
const updateEngineCost = httpsCallable(functions, 'updateEngineCost');
await updateEngineCost({
  engine_id: 'dalle_3_standard',
  cost_per_unit: 0.045, // New cost
  reason: 'OpenAI price increase effective 2026-01-15'
});
```

**Via Firestore Console:**

Go to `ai_engine_costs/{engineId}` → Edit → Update `cost_per_unit`

**Changes are audited** in `profit_audit_log` collection.

### Manual Aggregation

Trigger aggregation for any period:

```typescript
const triggerManualAggregation = httpsCallable(functions, 'triggerManualAggregation');
await triggerManualAggregation({
  period_start: '2026-01-01',
  period_end: '2026-01-31',
  period_type: 'monthly'
});
```

### Backfilling Historical Data

If deploying to existing project with usage data:

```javascript
// Run once to backfill financial data for existing generations
async function backfillFinancials() {
  const generations = await db.collection('generations')
    .where('real_cost_usd', '==', null)
    .get();

  for (const gen of generations.docs) {
    // Re-trigger financial calculation
    await calculateAndLogFinancials(gen.id, gen.data());
  }
}
```

---

## 🐛 Troubleshooting

### Issue: Aggregation Not Running

**Symptoms:** No data in `profit_aggregates` collection  
**Solutions:**

1. Check Cloud Scheduler is enabled:
   ```bash
   gcloud scheduler jobs list
   ```

2. Verify function deployed:
   ```bash
   firebase functions:list
   ```

3. Check function logs:
   ```bash
   firebase functions:log --only aggregateDailyProfit
   ```

4. Manually trigger:
   ```typescript
   await triggerManualAggregation({ period_start: '2026-01-01', period_end: '2026-01-01', period_type: 'daily' });
   ```

### Issue: Cost Always $0

**Symptoms:** `real_cost_usd` is 0 in `usage_logs`  
**Solutions:**

1. Check `ai_engine_costs` collection exists and has data
2. Verify `engine_id` matches between generations and costs
3. Check cost cache TTL (may be stale)
4. Verify `is_active: true` on engine cost

### Issue: Permission Denied on Dashboard

**Symptoms:** Dashboard shows "Permission denied"  
**Solutions:**

1. Verify user has `role: 'super_admin'` in `users` collection
2. Check Firestore security rules deployed correctly
3. Verify user is authenticated

### Issue: Loss Users Not Detected

**Symptoms:** No entries in `loss_users` despite unprofitable usage  
**Solutions:**

1. Check `detectLossUsers` function logs
2. Verify loss threshold: default is -10%
3. Ensure usage_logs has `profit_usd` field populated
4. Manually trigger loss detection

---

## 📈 Performance Optimization

### Cost Cache

Engine costs cached in-memory for **5 minutes** to reduce Firestore reads:

```typescript
const COST_CACHE_TTL_MS = 5 * 60 * 1000;
```

### Batch Processing

Aggregations use batch writes (500 documents per batch) for efficiency.

### TTL Policy

- `usage_logs`: Auto-deleted after 90 days
- `profit_audit_log`: Auto-deleted after 2 years

### Query Optimization

All dashboard queries use pre-computed `profit_aggregates` - **zero aggregation on read**.

---

## 🔐 Security Best Practices

1. **Super Admin Access Only** - All financial data requires `super_admin` role
2. **Audit Logging** - Every cost/pricing change logged to `profit_audit_log`
3. **Cloud Functions Only** - Zero client-side financial calculations
4. **Immutable Records** - `usage_logs` cannot be updated/deleted
5. **Rate Limiting** - Consider rate limiting admin API calls

---

## 📚 Additional Resources

- [Firestore TTL Documentation](https://firebase.google.com/docs/firestore/ttl)
- [Cloud Scheduler Documentation](https://cloud.google.com/scheduler/docs)
- [Firestore Composite Indexes](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

---

## 🎓 Financial Concepts

### Profit Margin

> **Definition:** Percentage of revenue retained as profit  
> **Formula:** `(profit / revenue) × 100`  
> **Healthy Range:** 40-70% for SaaS  
> **Danger Zone:** <0% (loss-making)

### Loss User

> **Definition:** User whose AI costs exceed allocated revenue  
> **Detection:** 30-day profit margin < -10%  
> **Action:** Rate limit, upgrade plan, or monitor

### Revenue Attribution

> **Definition:** Allocating subscription revenue to individual AI requests  
> **Method:** Proportional distribution based on usage  
> **Challenge:** Heavy users in low-tier plans

---

## ✅ Deployment Checklist

- [ ] Install dependencies
- [ ] Copy all files to project
- [ ] Run initialization script
- [ ] Create Firestore indexes
- [ ] Enable TTL policies
- [ ] Deploy Cloud Functions
- [ ] Deploy Firestore security rules
- [ ] Grant super_admin role to admins
- [ ] Test cost calculation (generate sample content)
- [ ] Verify aggregation runs (check logs)
- [ ] Access admin dashboard
- [ ] Configure monitoring/alerts
- [ ] Document custom engine costs
- [ ] Train admin team on dashboard

---

## 📞 Support

For issues or questions:
1. Check Cloud Function logs
2. Review Firestore security rules
3. Verify indexes created
4. Check initialization script output
5. Review this guide's troubleshooting section

---

**System Version:** 1.0.0  
**Last Updated:** 2026-01-04  
**Built for:** Enterprise AI SaaS Platforms  
**License:** Proprietary

---

🎉 **Congratulations!** You now have an enterprise-grade profit intelligence system like Runway, Jasper, and ElevenLabs!
