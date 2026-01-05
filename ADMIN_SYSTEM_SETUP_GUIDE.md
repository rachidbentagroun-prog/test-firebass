# Super Admin Dashboard - Complete Setup Guide

## 🚀 Quick Start

This guide will walk you through setting up the enterprise Super Admin Dashboard from scratch.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firestore Setup](#firestore-setup)
3. [Cloud Functions Deployment](#cloud-functions-deployment)
4. [Security Rules Deployment](#security-rules-deployment)
5. [Frontend Integration](#frontend-integration)
6. [Testing](#testing)
7. [Production Checklist](#production-checklist)

---

## Prerequisites

- Firebase project created
- Firebase CLI installed: `npm install -g firebase-tools`
- Node.js 18+ installed
- Firebase project initialized in your workspace

```bash
firebase login
firebase init
```

---

## 1. Firestore Setup

### Step 1: Initialize Collections

Create initial documents for the system to function:

```bash
# Navigate to your project
cd /workspaces/test-firebass

# Run initialization script
node scripts/init-admin-system.js
```

**Or manually create via Firebase Console:**

Navigate to Firestore Database and create these collections:

#### A. `credit_rules` collection

Create document with ID: `default_rules`

```javascript
{
  imageCost: 1,
  imageHDCost: 2,
  image4KCost: 5,
  videoCostPerSecond: 5,
  video720pMultiplier: 1.0,
  video1080pMultiplier: 1.5,
  video4KMultiplier: 3.0,
  voiceCostPerMinute: 2,
  voiceCloneCostMultiplier: 2.0,
  chatCostPerToken: 0.001,
  chatGPT4Multiplier: 5.0,
  freeSignupCredits: 10,
  basicPlanCredits: 100,
  premiumPlanCredits: 500,
  updatedAt: firebase.firestore.FieldValue.serverTimestamp()
}
```

#### B. `system_config` collection

Create document with ID: `default`

```javascript
{
  maintenanceMode: false,
  signupsEnabled: true,
  freeSignupsEnabled: true,
  maxConcurrentGenerations: 100,
  maxQueueSize: 500,
  rateLimits: {
    free: { maxPerHour: 5, maxPerDay: 20 },
    basic: { maxPerHour: 20, maxPerDay: 100 },
    premium: { maxPerHour: 100, maxPerDay: 500 }
  },
  updatedAt: firebase.firestore.FieldValue.serverTimestamp()
}
```

#### C. `engine_costs` collection

Create documents for each AI engine you support:

**DALL-E 3** (ID: `dalle3`)
```javascript
{
  engineId: "dalle3",
  engineName: "DALL-E 3",
  type: "image",
  baseCostPerGeneration: 2,
  qualityMultipliers: {
    standard: 1.0,
    hd: 1.5
  },
  isActive: true,
  averageProcessingTime: 8,
  successRate: 98.5,
  usageCount: 0,
  updatedAt: firebase.firestore.FieldValue.serverTimestamp()
}
```

**Stable Diffusion** (ID: `stable_diffusion`)
```javascript
{
  engineId: "stable_diffusion",
  engineName: "Stable Diffusion",
  type: "image",
  baseCostPerGeneration: 1,
  qualityMultipliers: {
    standard: 1.0,
    hd: 1.2,
    ultra: 2.0
  },
  isActive: true,
  averageProcessingTime: 5,
  successRate: 96.0,
  usageCount: 0,
  updatedAt: firebase.firestore.FieldValue.serverTimestamp()
}
```

**Add similar documents for your other engines (Midjourney, GPT-4, ElevenLabs, etc.)**

### Step 2: Create Composite Indexes

Navigate to Firestore → Indexes tab and create these composite indexes:

```
Collection: generation_logs
- userId (Ascending) + createdAt (Descending)

Collection: generation_logs
- generationType (Ascending) + createdAt (Descending)

Collection: generation_logs
- status (Ascending) + createdAt (Descending)

Collection: contact_messages
- status (Ascending) + createdAt (Descending)

Collection: contact_messages
- priority (Descending) + createdAt (Descending)

Collection: chat_messages
- sessionId (Ascending) + createdAt (Ascending)

Collection: audit_logs
- adminId (Ascending) + timestamp (Descending)

Collection: audit_logs
- action (Ascending) + timestamp (Descending)
```

**Auto-Index Creation**: When you first query these in the app, Firestore will provide a link to auto-create indexes.

---

## 2. Cloud Functions Deployment

### Step 1: Install Dependencies

```bash
cd functions
npm install firebase-functions firebase-admin
```

### Step 2: Add Admin System Functions

The admin system Cloud Functions are already created in `/functions/admin-system.ts`.

Update `/functions/src/index.ts` to export them:

```typescript
// Add to functions/src/index.ts
export * from '../admin-system';
```

### Step 3: Deploy Cloud Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy specific functions for faster deployment
firebase deploy --only functions:aggregateDailyAnalytics
firebase deploy --only functions:onUserCreated
firebase deploy --only functions:suspendUser
firebase deploy --only functions:grantCredits
firebase deploy --only functions:checkUserSuspension
firebase deploy --only functions:logGeneration
firebase deploy --only functions:checkRateLimit
firebase deploy --only functions:detectAbuse
firebase deploy --only functions:onContactMessageCreated
```

### Step 4: Set Up Scheduled Functions

The `aggregateDailyAnalytics` function runs daily at 00:05 UTC automatically.

The `detectAbuse` function runs every hour automatically.

Verify in Firebase Console → Functions → Scheduled Functions.

### Step 5: Test Cloud Functions Locally (Optional)

```bash
firebase emulators:start --only functions,firestore

# In another terminal
npm run test:functions
```

---

## 3. Security Rules Deployment

### Step 1: Update firestore.rules

Copy the security rules from `/firestore-security-rules/ADMIN_SECURITY_RULES.md` into your `firestore.rules` file:

```bash
# Copy the rules from the documentation
cp firestore-security-rules/ADMIN_SECURITY_RULES.md firestore.rules
```

Edit `firestore.rules` and extract only the JavaScript rules (remove markdown formatting).

### Step 2: Test Rules Locally

```bash
firebase emulators:start --only firestore

# In another terminal
npm run test:rules
```

### Step 3: Deploy Rules

```bash
firebase deploy --only firestore:rules
```

### Step 4: Verify Rules

Go to Firebase Console → Firestore Database → Rules tab and verify the rules are deployed.

---

## 4. Frontend Integration

### Step 1: Import Admin Services

The admin services are already created in `/services/adminService.ts`.

### Step 2: Update AdminDashboard Component

The AdminDashboard component already exists at `/components/AdminDashboard.tsx`.

**Add new features:**

1. **Analytics Section** - Uses `getDailyAnalytics`, `getMonthlyAnalytics`, `getRealtimeAnalyticsSummary`
2. **Credit Management** - Uses `getCreditRules`, `getEngineCosts`, `getPlanCreditOverrides`
3. **User Management** - Uses `getAllUsersAdmin`, `suspendUserAdmin`, `grantCreditsAdmin`
4. **Admin Inbox** - Uses `getContactMessages`, `getChatSessions`, `sendChatReply`

### Step 3: Add Admin Inbox Tab

Update the sidebar to include "Inbox":

```typescript
const tabs = [
  { id: 'overview', label: 'Dashboard', icon: Layout },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'credits', label: 'Credits', icon: CreditCard },
  { id: 'inbox', label: 'Inbox', icon: MessageSquare }, // NEW
  { id: 'live-ai', label: 'Live AI', icon: MonitorPlay },
  { id: 'support', label: 'Support', icon: Mail },
  { id: 'api', label: 'API Keys', icon: Key },
];
```

### Step 4: Implement Inbox Tab

```typescript
{activeTab === 'inbox' && (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-white">Admin Inbox</h2>
    
    {/* Filter tabs */}
    <div className="flex gap-4 border-b border-gray-700">
      <button
        onClick={() => setInboxFilter('all')}
        className={`px-4 py-2 ${inboxFilter === 'all' ? 'border-b-2 border-blue-500' : ''}`}
      >
        All Messages
      </button>
      <button
        onClick={() => setInboxFilter('contact')}
        className={`px-4 py-2 ${inboxFilter === 'contact' ? 'border-b-2 border-blue-500' : ''}`}
      >
        Contact Form
      </button>
      <button
        onClick={() => setInboxFilter('chat')}
        className={`px-4 py-2 ${inboxFilter === 'chat' ? 'border-b-2 border-blue-500' : ''}`}
      >
        Chat Widget
      </button>
    </div>
    
    {/* Messages list */}
    <div className="space-y-4">
      {inboxMessages.map(message => (
        <div key={message.id} className="bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between">
            <div>
              <h3 className="font-bold">{message.subject || 'Chat Message'}</h3>
              <p className="text-sm text-gray-400">{message.userEmail}</p>
            </div>
            <span className={`px-2 py-1 rounded text-xs ${
              message.status === 'new' ? 'bg-green-500' :
              message.status === 'read' ? 'bg-blue-500' :
              'bg-gray-500'
            }`}>
              {message.status}
            </span>
          </div>
          <p className="mt-2 text-gray-300">{message.message}</p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => markAsRead(message.id)}
              className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700"
            >
              Mark as Read
            </button>
            <button
              onClick={() => replyToMessage(message.id)}
              className="px-3 py-1 bg-green-600 rounded hover:bg-green-700"
            >
              Reply
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
```

---

## 5. Testing

### Test Checklist

#### A. Analytics
- [ ] Daily analytics aggregation runs successfully
- [ ] Dashboard shows correct user counts
- [ ] Charts display generation statistics
- [ ] Country traffic data is accurate

#### B. Credit System
- [ ] New users receive signup credits automatically
- [ ] Credit costs calculate correctly based on plan
- [ ] Admin can update credit rules
- [ ] Engine costs can be modified
- [ ] Plan overrides work correctly

#### C. User Management
- [ ] Admin can view all users
- [ ] Search users by email works
- [ ] Suspend user blocks their generations
- [ ] Grant credits updates user balance
- [ ] User activity history displays correctly

#### D. Admin Inbox
- [ ] Contact form messages appear in inbox
- [ ] Chat widget messages are captured
- [ ] Mark as read updates status
- [ ] Reply functionality works

#### E. Security
- [ ] Non-admin users cannot access admin routes
- [ ] Suspended users cannot create generations
- [ ] Firestore rules block unauthorized access
- [ ] Audit logs capture all admin actions

### Manual Testing Script

```javascript
// Test credit calculation
const testCreditCalculation = async () => {
  const rules = await getCreditRules();
  console.log('Credit Rules:', rules);
  
  const engines = await getEngineCosts();
  console.log('Engine Costs:', engines);
  
  // Simulate image generation
  const cost = rules.imageCost * 1; // 1 image
  console.log('Image Generation Cost:', cost);
};

// Test user suspension
const testUserSuspension = async (userId) => {
  await suspendUserAdmin(userId, true, 'Testing suspension');
  console.log('User suspended');
  
  // Try to generate (should fail)
  // ...
  
  await suspendUserAdmin(userId, false, 'Testing unsuspension');
  console.log('User unsuspended');
};

// Test analytics
const testAnalytics = async () => {
  const today = new Date().toISOString().split('T')[0];
  const analytics = await getDailyAnalytics(today, today);
  console.log('Today Analytics:', analytics);
};
```

---

## 6. Production Checklist

### Before Launch

- [ ] All Cloud Functions deployed and tested
- [ ] Firestore security rules deployed
- [ ] Composite indexes created
- [ ] Initial collections populated (credit_rules, system_config, engine_costs)
- [ ] Super admin account created with role='super_admin'
- [ ] Error boundaries added to AdminDashboard
- [ ] Loading states for all async operations
- [ ] Rate limiting configured
- [ ] Abuse detection scheduled function running

### Security

- [ ] Only super_admin can access admin dashboard
- [ ] API keys stored securely (not in frontend code)
- [ ] Audit logs enabled for all admin actions
- [ ] Firestore rules prevent unauthorized access
- [ ] Suspended users cannot perform actions

### Performance

- [ ] Pagination implemented for user lists (max 50-100 per page)
- [ ] Analytics use aggregate documents (no collection scans)
- [ ] Generation logs limited to last 30-90 days
- [ ] Indexes created for frequent queries
- [ ] Frontend caches credit rules

### Monitoring

- [ ] Cloud Functions have logging enabled
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Firebase Analytics tracking admin actions
- [ ] Alerts set up for:
  - Failed Cloud Functions
  - Abuse detection triggers
  - High error rates
  - Suspended user attempts

### Cost Optimization

- [ ] Scheduled functions run at appropriate intervals
- [ ] Queries use indexes (no collection scans)
- [ ] Old generation logs archived or deleted
- [ ] Rate limiting prevents abuse
- [ ] Analytics aggregations reduce read costs

---

## 7. Environment Variables

Create `.env.local` file (never commit to git):

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Admin Configuration
VITE_SUPER_ADMIN_EMAIL=your_admin@email.com

# Feature Flags
VITE_ENABLE_MAINTENANCE_MODE=false
VITE_ENABLE_FREE_SIGNUPS=true
```

---

## 8. Maintenance

### Daily Tasks
- Check abuse detection logs
- Review new contact messages
- Monitor system health (Cloud Functions errors)

### Weekly Tasks
- Review analytics trends
- Audit high-usage users
- Check credit burn rate
- Review and close resolved inbox messages

### Monthly Tasks
- Archive old generation logs (>90 days)
- Review and update credit costs if needed
- Analyze user growth and churn
- Update engine costs based on provider pricing

---

## 9. Troubleshooting

### Issue: Analytics not showing data

**Solution:**
- Check if `aggregateDailyAnalytics` function is running
- Verify Cloud Scheduler is enabled
- Manually trigger function: `firebase functions:shell` → `aggregateDailyAnalytics()`

### Issue: Users not receiving signup credits

**Solution:**
- Check `onUserCreated` trigger is deployed
- Verify `credit_rules` document exists
- Check Cloud Function logs for errors

### Issue: Admin dashboard shows "Permission Denied"

**Solution:**
- Verify user's role in Firestore is exactly 'super_admin' (not 'admin' or 'super-admin')
- Check Firestore rules are deployed
- Clear browser cache and re-login

### Issue: Suspended user can still generate

**Solution:**
- Verify Firestore rules include `isNotSuspended()` checks
- Check generation API calls `checkUserSuspension` Cloud Function
- Redeploy Firestore rules

---

## 10. Support & Resources

- **Firestore Schema**: `/firestore-schema/ADMIN_SYSTEM_SCHEMA.md`
- **Security Rules**: `/firestore-security-rules/ADMIN_SECURITY_RULES.md`
- **Cloud Functions**: `/functions/admin-system.ts`
- **Admin Services**: `/services/adminService.ts`
- **Component**: `/components/AdminDashboard.tsx`

---

## Quick Commands Reference

```bash
# Deploy everything
firebase deploy

# Deploy specific components
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only hosting

# Test locally
firebase emulators:start

# View logs
firebase functions:log --only aggregateDailyAnalytics
firebase functions:log --only onUserCreated

# Initialize admin system
node scripts/init-admin-system.js
```

---

**Status**: Production-Ready  
**Last Updated**: 2026-01-05  
**Compatible With**: Firebase v9+ SDK, React 18+, Vite 6+
