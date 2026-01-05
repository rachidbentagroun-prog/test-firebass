# 📋 Profit Intelligence System - Deployment Checklist

**Complete this checklist to ensure successful deployment**

---

## ☁️ Pre-Deployment

### Firebase Project Setup

- [ ] Firebase project created
- [ ] Blaze plan enabled (required for Cloud Functions)
- [ ] Firebase CLI installed: `npm install -g firebase-tools`
- [ ] Logged in: `firebase login`
- [ ] Project selected: `firebase use YOUR_PROJECT_ID`

### Dependencies

- [ ] Node.js 18+ installed
- [ ] Firebase Admin SDK: `npm install firebase-admin`
- [ ] Firebase Functions: `npm install firebase-functions`
- [ ] TypeScript: `npm install --save-dev typescript`
- [ ] Types: `npm install --save-dev @types/node`

### Service Account

- [ ] Service account key downloaded from Firebase Console
- [ ] Saved as `serviceAccountKey.json` in project root
- [ ] Path updated in `scripts/init-profit-system.js`

---

## 📁 File Integration

### Copy Files to Project

- [ ] `functions/profit-intelligence.ts` → Your functions directory
- [ ] `functions/profit-aggregation.ts` → Your functions directory
- [ ] `functions/loss-detection.ts` → Your functions directory
- [ ] `functions/index-profit-system.ts` → Your functions directory
- [ ] `types/profit-intelligence.types.ts` → Your types directory
- [ ] `components/ProfitDashboard.tsx` → Your components directory
- [ ] `scripts/init-profit-system.js` → Your scripts directory
- [ ] `firestore-security-rules/profit-intelligence.rules` → Update firestore.rules

### Update Function Exports

- [ ] Added exports to `functions/index.ts`:
  ```typescript
  export * from './profit-intelligence';
  export * from './profit-aggregation';
  export * from './loss-detection';
  ```

### Update Firebase Config

- [ ] Firebase initialized in frontend: `firebase.ts` or `firebaseConfig.ts`
- [ ] Firestore instance exported: `export const db = getFirestore(app);`
- [ ] Functions instance exported: `export const functions = getFunctions(app);`

---

## 🚀 System Initialization

### Run Initialization Script

- [ ] Updated serviceAccountKey path in script
- [ ] Executed: `node scripts/init-profit-system.js`
- [ ] Verified output shows:
  - ✅ Engine costs seeded (10 documents)
  - ✅ Subscription plans seeded (4 documents)
  - ✅ System config initialized

### Manual Setup Steps

- [ ] Firestore indexes created (see below)
- [ ] TTL policies enabled (see below)

---

## 🗂️ Firestore Indexes

### Create Composite Indexes

**Method 1: Firebase Console**

Go to: https://console.firebase.google.com/project/YOUR_PROJECT/firestore/indexes

- [ ] **usage_logs index 1:**
  - Collection: `usage_logs`
  - Field: `user_id` (Ascending)
  - Field: `created_at` (Descending)

- [ ] **usage_logs index 2:**
  - Collection: `usage_logs`
  - Field: `subscription_plan` (Ascending)
  - Field: `created_at` (Descending)

- [ ] **usage_logs index 3:**
  - Collection: `usage_logs`
  - Field: `engine_id` (Ascending)
  - Field: `created_at` (Descending)

- [ ] **usage_logs index 4:**
  - Collection: `usage_logs`
  - Field: `profit_usd` (Ascending)
  - Field: `created_at` (Descending)

- [ ] **profit_aggregates index:**
  - Collection: `profit_aggregates`
  - Field: `period_type` (Ascending)
  - Field: `period_start` (Descending)

- [ ] **loss_users index:**
  - Collection: `loss_users`
  - Field: `subscription_plan` (Ascending)
  - Field: `profit_margin_percent` (Ascending)

**Method 2: gcloud CLI**

```bash
# Example command (run for each index)
gcloud firestore indexes composite create \
  --collection-group=usage_logs \
  --field-config=field-path=user_id,order=ascending \
  --field-config=field-path=created_at,order=descending
```

- [ ] All indexes created
- [ ] All indexes show "Enabled" status (may take 5-10 minutes)

---

## ⏰ TTL Configuration

### Enable Time-To-Live Policies

**usage_logs (90 day retention):**

```bash
gcloud firestore fields ttls update created_at \
  --collection-group=usage_logs \
  --enable-ttl
```

- [ ] usage_logs TTL enabled
- [ ] Verified in Firebase Console

**profit_audit_log (2 year retention):**

```bash
gcloud firestore fields ttls update changed_at \
  --collection-group=profit_audit_log \
  --enable-ttl
```

- [ ] profit_audit_log TTL enabled
- [ ] Verified in Firebase Console

---

## 🔒 Security Rules

### Deploy Firestore Security Rules

- [ ] Reviewed `firestore-security-rules/profit-intelligence.rules`
- [ ] Merged with existing `firestore.rules` (if any)
- [ ] Deployed: `firebase deploy --only firestore:rules`
- [ ] Verified deployment succeeded

### Test Security Rules

- [ ] Non-admin user CANNOT access `ai_engine_costs`
- [ ] Non-admin user CANNOT access `profit_aggregates`
- [ ] Non-admin user CANNOT write to `usage_logs`
- [ ] Super admin CAN access all collections

---

## ☁️ Cloud Functions Deployment

### Deploy All Functions

```bash
firebase deploy --only functions
```

- [ ] Deployment started
- [ ] All functions deployed successfully:
  - [ ] onGenerationCreated
  - [ ] aggregateDailyProfit
  - [ ] aggregateMonthlyProfit
  - [ ] detectLossUsers
  - [ ] onLossUserDetected
  - [ ] getCostEstimate
  - [ ] updateEngineCost
  - [ ] triggerManualAggregation
  - [ ] getProfitAggregates
  - [ ] getLossUsers
  - [ ] takeLossUserAction

### Verify Scheduled Functions

Go to: https://console.cloud.google.com/cloudscheduler

- [ ] `aggregateDailyProfit` schedule exists (1 0 * * *)
- [ ] `aggregateMonthlyProfit` schedule exists (0 1 1 * *)
- [ ] `detectLossUsers` schedule exists (0 * * * *)
- [ ] All schedules enabled

---

## 👤 Admin Access

### Grant Super Admin Role

**Method 1: Firebase Console**

- [ ] Go to Firestore
- [ ] Navigate to `users/{ADMIN_UID}`
- [ ] Add field: `role` = `"super_admin"`

**Method 2: Firebase CLI**

```bash
firebase firestore:set users/YOUR_ADMIN_UID --data '{"role":"super_admin"}'
```

**Method 3: Admin SDK**

```javascript
await admin.firestore().collection('users').doc(ADMIN_UID).update({
  role: 'super_admin'
});
```

- [ ] Super admin role granted
- [ ] Verified in Firestore Console

---

## 🎨 Frontend Integration

### Add Dashboard Route

- [ ] Created admin route: `/admin/profit-intelligence`
- [ ] Imported ProfitDashboard component
- [ ] Added role check (super_admin only)
- [ ] Tested navigation

### Install Chart Dependencies

```bash
npm install recharts lucide-react
```

- [ ] recharts installed (for charts)
- [ ] lucide-react installed (for icons)

### Update Navigation

- [ ] Added "Profit Intelligence" link to admin nav
- [ ] Link visible to super_admin only
- [ ] Icon added (💰 or chart icon)

---

## 🧪 Testing

### Test Real-Time Cost Tracking

- [ ] Generate AI content (image/video/chat)
- [ ] Check Cloud Function logs: `firebase functions:log --only onGenerationCreated`
- [ ] Verify log shows:
  - [ ] Cost calculated
  - [ ] Revenue calculated
  - [ ] Profit calculated
  - [ ] Usage logged

### Verify Firestore Data

- [ ] Check `usage_logs` collection has new entry
- [ ] Verify financial fields populated:
  - [ ] `real_cost_usd` (not 0)
  - [ ] `revenue_estimated_usd` (not 0)
  - [ ] `profit_usd` (calculated)
  - [ ] `profit_margin_percent` (calculated)

### Test Aggregation

**Option 1: Wait for Scheduled Run**
- [ ] Wait for next daily aggregation (00:01 UTC)
- [ ] Check `profit_aggregates` collection

**Option 2: Manual Trigger**
- [ ] Call `triggerManualAggregation` function
- [ ] Verify `profit_aggregates` document created
- [ ] Check metrics look correct

### Test Loss Detection

**Option 1: Wait for Scheduled Run**
- [ ] Wait for hourly scan
- [ ] Check Cloud Function logs

**Option 2: Create Test Loss User**
- [ ] Create user with high cost, low revenue
- [ ] Wait for hourly scan
- [ ] Verify user appears in `loss_users` collection

### Test Admin Dashboard

- [ ] Navigate to `/admin/profit-intelligence`
- [ ] Verify metrics displayed:
  - [ ] Total Revenue
  - [ ] Total Cost
  - [ ] Net Profit
  - [ ] Profit Margin %
- [ ] Verify charts render:
  - [ ] Cost vs Revenue line chart
  - [ ] Top Cost Engines bar chart
  - [ ] Profit by Plan bar chart
- [ ] Verify loss users table (if any)
- [ ] Test refresh button
- [ ] Test period selector

---

## 🔍 Verification

### System Health Check

- [ ] Cloud Functions all deployed
- [ ] Scheduled functions running on schedule
- [ ] Firestore indexes enabled
- [ ] TTL policies enabled
- [ ] Security rules deployed
- [ ] Admin access granted
- [ ] Dashboard accessible

### Data Flow Verification

- [ ] User generates content → usage_logs updated with financials
- [ ] Hourly scan → loss_users updated
- [ ] Daily aggregation → profit_aggregates updated
- [ ] Dashboard → displays aggregated data

### Performance Check

- [ ] Cost cache working (check logs for "CACHE HIT")
- [ ] Aggregation completes in <2 minutes
- [ ] Dashboard loads in <3 seconds
- [ ] No Firestore read quota warnings

---

## 📊 Monitoring

### Set Up Alerts

**Firebase Console:**
- [ ] Go to Functions → Metrics
- [ ] Set up alerts for:
  - [ ] Function errors
  - [ ] Function timeouts
  - [ ] High execution time

**Cloud Logging:**
- [ ] Set up log-based metrics
- [ ] Alert on error patterns

### Regular Checks

**Daily:**
- [ ] Check dashboard for anomalies
- [ ] Review loss users

**Weekly:**
- [ ] Review profit margins
- [ ] Check engine costs accuracy
- [ ] Verify aggregations running

**Monthly:**
- [ ] Update engine costs (if provider prices change)
- [ ] Review plan pricing
- [ ] Export financial data for reporting

---

## 📚 Documentation

### Internal Documentation

- [ ] Share PROFIT_SYSTEM_GUIDE.md with team
- [ ] Share PROFIT_QUICK_START.md with developers
- [ ] Document custom engine costs (if added)
- [ ] Document subscription plan pricing

### Team Training

- [ ] Admin team trained on dashboard usage
- [ ] Developers trained on integration
- [ ] Finance team trained on data export

---

## ✅ Go-Live Checklist

**Final verification before production:**

- [ ] All Cloud Functions deployed and tested
- [ ] Real-time cost tracking working
- [ ] Aggregations running on schedule
- [ ] Loss detection active
- [ ] Admin dashboard accessible
- [ ] Security rules enforced
- [ ] TTL policies enabled
- [ ] Monitoring alerts configured
- [ ] Team trained
- [ ] Documentation complete

---

## 🎉 Post-Deployment

### First 24 Hours

- [ ] Monitor Cloud Function logs
- [ ] Verify usage_logs accumulating
- [ ] Check first daily aggregation (next day 00:01 UTC)
- [ ] Verify loss detection running hourly

### First Week

- [ ] Review dashboard daily
- [ ] Monitor profit margins
- [ ] Check for loss users
- [ ] Verify data accuracy

### First Month

- [ ] Review monthly aggregation
- [ ] Analyze trends
- [ ] Adjust pricing if needed
- [ ] Export financial report

---

## 🚨 Troubleshooting Resources

If issues occur, refer to:

1. **PROFIT_SYSTEM_GUIDE.md** - Troubleshooting section
2. **Cloud Function logs** - `firebase functions:log`
3. **Firestore Console** - Verify data structure
4. **Security Rules** - Check access permissions
5. **Indexes** - Verify all enabled

---

## 📞 Support Checklist

Before requesting support, verify:

- [ ] All checklist items completed
- [ ] Cloud Function logs reviewed
- [ ] Firestore data structure correct
- [ ] Security rules deployed
- [ ] Indexes created and enabled
- [ ] Error messages documented

---

**Deployment Date:** ________________  
**Deployed By:** ________________  
**Project ID:** ________________  
**Admin Email:** ________________

---

✅ **Checklist Complete!** Your Profit Intelligence System is live! 🎉
