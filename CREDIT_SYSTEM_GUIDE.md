# 🎯 CREDIT SYSTEM & AI COST CONTROL - COMPLETE GUIDE

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Credit System](#credit-system)
4. [Live AI Activity](#live-ai-activity)
5. [Security & Abuse Prevention](#security--abuse-prevention)
6. [Cloud Functions](#cloud-functions)
7. [Admin Dashboard](#admin-dashboard)
8. [Integration Guide](#integration-guide)
9. [Deployment](#deployment)
10. [Testing](#testing)

---

## 🎯 Overview

This is a **production-grade credit system** for AI SaaS applications (Midjourney/Runway level).

### Features Implemented

✅ **Credit System (AI Cost Control)**
- Configurable credit costs per AI feature
- Automatic credit deduction
- Credit balance tracking
- Admin credit grants
- Credit transaction logs

✅ **Live AI Activity Monitoring**
- Real-time Firestore listeners (onSnapshot)
- Live generation tracking
- Status updates (pending → processing → completed/failed)
- Processing time analytics
- User activity monitoring

✅ **Security & Abuse Prevention**
- Rate limiting per user and IP
- Prompt moderation (content filtering)
- Abuse detection and logging
- Automatic account suspension
- Admin audit logging
- IP tracking and blocking

---

## 🏗️ Architecture

### Data Flow

```
User Request → Credit Check → Rate Limit → Prompt Moderation → 
Deduct Credits → Create Activity → AI Generation → Update Activity → 
Log Usage → Return Result
```

### Firestore Collections

```
📦 Firestore Database
├── 📁 users/
│   ├── {userId}
│   │   ├── credits: number
│   │   ├── status: 'active' | 'suspended'
│   │   └── ...
│
├── 📁 system_config/
│   └── credit_config
│       ├── imageCost: number
│       ├── videoCostPerSecond: number
│       ├── voiceCostPerMinute: number
│       ├── chatCostPerToken: number
│       └── ...
│
├── 📁 credit_logs/
│   └── {logId}
│       ├── userId: string
│       ├── type: 'deduction' | 'grant' | 'bonus'
│       ├── amount: number
│       ├── balanceBefore: number
│       ├── balanceAfter: number
│       ├── timestamp: number
│       └── ...
│
├── 📁 usage_logs/
│   └── {logId}
│       ├── userId: string
│       ├── aiType: 'image' | 'video' | 'voice' | 'chat'
│       ├── creditsUsed: number
│       ├── status: 'success' | 'failed'
│       ├── prompt: string (truncated)
│       ├── promptHash: string
│       └── timestamp: number
│
├── 📁 ai_activity/          ⚡ Real-time listener
│   └── {activityId}
│       ├── userId: string
│       ├── aiType: string
│       ├── status: 'pending' | 'processing' | 'completed' | 'failed'
│       ├── progress: number
│       ├── creditsUsed: number
│       ├── timestamp: number
│       └── ...
│
├── 📁 rate_limits/
│   └── {userId}_{aiType}
│       ├── maxRequests: number
│       ├── currentCount: number
│       ├── windowStart: number
│       └── blockedUntil?: number
│
├── 📁 abuse_detection/
│   └── {abuseId}
│       ├── userId: string
│       ├── abuseType: string
│       ├── severity: 'low' | 'medium' | 'high' | 'critical'
│       └── timestamp: number
│
└── 📁 admin_audit_logs/
    └── {logId}
        ├── adminId: string
        ├── action: string
        ├── details: string
        └── timestamp: number
```

---

## 💳 Credit System

### 1. Credit Configuration

Admins can configure credit costs via the **Admin Dashboard → Credits** tab:

```typescript
{
  imageCost: 1,                  // Credits per image
  videoCostPerSecond: 5,         // Credits per second of video
  voiceCostPerMinute: 2,         // Credits per minute of voice
  chatCostPerToken: 0.001,       // Credits per chat token
  freeSignupCredits: 10,         // Initial credits for new users
  basicPlanCredits: 100,         // Monthly credits for basic plan
  premiumPlanCredits: 500        // Monthly credits for premium plan
}
```

### 2. Credit Deduction Flow

```typescript
// services/creditWrapper.ts
import { withCredits } from './services/creditWrapper';

const result = await withCredits({
  userId: 'user123',
  aiType: 'image',
  service: 'dalle3',
  prompt: 'A beautiful sunset',
  callback: async () => {
    return await generateImageWithDalle(prompt);
  }
});

if (result.success) {
  console.log('Image generated:', result.data);
  console.log('Credits used:', result.creditsUsed);
  console.log('Remaining:', result.remainingCredits);
} else {
  console.error('Error:', result.error);
}
```

### 3. Credit Blocking Logic

```typescript
// Automatic blocking conditions:
if (userCredits <= 0) {
  throw new Error('Insufficient credits');
}

if (userStatus === 'suspended') {
  throw new Error('Account suspended');
}

if (rateLimitExceeded) {
  throw new Error('Rate limit exceeded');
}
```

### 4. Admin Credit Management

```typescript
// Grant credits to user
await grantUserCredits(
  userId,
  amount,
  reason,
  adminId,
  adminEmail,
  'bonus' // or 'grant', 'refund'
);
```

---

## 📡 Live AI Activity

### 1. Real-time Listener Setup

```typescript
// Admin Dashboard - Live AI tab
useEffect(() => {
  if (activeTab === 'live-ai') {
    const unsubscribe = subscribeToAIActivity((activities) => {
      setAiActivities(activities);
    }, 100);
    
    return () => unsubscribe();
  }
}, [activeTab]);
```

### 2. Activity Lifecycle

```
1. Create Activity:
   → createAIActivity(userId, aiType, service, prompt, credits)
   → status: 'pending', progress: 0

2. Update Progress:
   → updateAIActivity(activityId, { status: 'processing', progress: 50 })

3. Complete:
   → updateAIActivity(activityId, { 
       status: 'completed', 
       progress: 100,
       resultUrl: 'https://...'
     })

4. Or Fail:
   → updateAIActivity(activityId, { 
       status: 'failed',
       errorMessage: 'API error'
     })
```

### 3. Real-time Dashboard Features

- **Live Activity Stream**: See all generations in real-time
- **User Information**: Email, name, country
- **AI Type Indicators**: Image 🖼️, Video 📹, Voice 🎤, Chat 💬
- **Status Tracking**: Pending, Processing, Completed, Failed
- **Credit Usage**: Credits used per generation
- **Timestamps**: Creation and completion times
- **Processing Time**: Duration from start to finish

---

## 🔒 Security & Abuse Prevention

### 1. Rate Limiting

**User-level rate limits:**
```typescript
const rateLimits = {
  image: 50 requests / hour,
  video: 10 requests / hour,
  voice: 30 requests / hour,
  chat: 100 requests / hour
};
```

**IP-level rate limits:**
```typescript
const ipLimit = {
  maxRequests: 100,
  windowMinutes: 10
};
```

### 2. Prompt Moderation

```typescript
const bannedKeywords = [
  'violence', 'gore', 'nsfw', 'nude', 'explicit',
  'illegal', 'weapon', 'drug', 'hate speech'
];

// Automatic blocking if prompt contains banned words
const moderation = await moderatePrompt(prompt);
if (!moderation.allowed) {
  throw new Error('Inappropriate content');
}
```

### 3. Abuse Detection

```typescript
// Automatically log abuse
await logAbuseDetection(
  userId,
  'rate_limit' | 'inappropriate_prompt' | 'suspicious_activity',
  'low' | 'medium' | 'high' | 'critical',
  description
);

// Auto-suspend for critical abuse
if (severity === 'critical') {
  await updateUserStatus(userId, 'suspended');
}
```

### 4. Admin Audit Logging

All admin actions are logged:
```typescript
await logAdminAudit(
  adminId,
  adminEmail,
  'grant_credits' | 'edit_config' | 'suspend_user' | ...,
  targetType,
  targetId,
  details
);
```

---

## ☁️ Cloud Functions

### Deploy Functions

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

### Available Functions

1. **validateAndDeductCredits** (HTTPS Callable)
   - Validates user credits
   - Checks rate limits
   - Moderates prompts
   - Deducts credits
   - Creates AI activity

2. **updateAIActivityStatus** (HTTPS Callable)
   - Updates generation status
   - Logs completion time
   - Creates usage logs

3. **grantCreditsToUser** (HTTPS Callable, Admin Only)
   - Grants credits to users
   - Logs transactions
   - Logs admin actions

4. **updateCreditConfiguration** (HTTPS Callable, Admin Only)
   - Updates credit costs
   - Logs configuration changes

5. **cleanupOldData** (Scheduled, Daily)
   - Removes old logs (90+ days)
   - Keeps database clean

6. **resetRateLimits** (Scheduled, Hourly)
   - Clears expired rate limits

---

## 🎛️ Admin Dashboard

### Credit System Tab

**Features:**
- ✏️ Edit credit costs (image, video, voice, chat)
- 💰 Set default credit grants (free, basic, premium)
- 📊 View global usage statistics
- 👥 See top users by credit usage
- 📈 Usage breakdown by AI type
- 💳 Grant bonus credits to users

### Live AI Activity Tab

**Features:**
- ⚡ Real-time activity stream (Firestore onSnapshot)
- 🔴 Live status indicator
- 👤 User details (email, name, country)
- 🎨 AI type icons
- ⏱️ Processing time tracking
- 🚨 Abuse detection alerts
- 📝 Admin audit log viewer

### Usage

1. Navigate to Admin Dashboard
2. Click **Credits** tab
3. Configure costs
4. Click **Save Config**
5. View statistics
6. Grant credits to users

---

## 🔌 Integration Guide

### Step 1: Wrap Existing AI Calls

**Before:**
```typescript
const image = await generateImageWithDalle(prompt);
```

**After:**
```typescript
import { withImageCredits } from './services/creditWrapper';

const result = await withImageCredits(
  userId,
  prompt,
  'dalle3',
  async () => await generateImageWithDalle(prompt)
);

if (result.success) {
  const image = result.data;
} else {
  alert(result.error);
}
```

### Step 2: Update All Service Calls

**Image Generation:**
```typescript
const result = await withImageCredits(userId, prompt, 'dalle3', callback);
```

**Video Generation:**
```typescript
const result = await withVideoCredits(userId, prompt, 'klingai', 5, callback);
```

**Voice Generation:**
```typescript
const result = await withVoiceCredits(userId, text, 'elevenlabs', 30, callback);
```

**Chat:**
```typescript
const result = await withChatCredits(userId, prompt, 'gemini', 500, callback);
```

### Step 3: Deploy Firestore Rules

1. Copy rules from `FIRESTORE_RULES.md`
2. Go to Firebase Console → Firestore → Rules
3. Paste and publish

### Step 4: Deploy Cloud Functions

```bash
cd functions
npm install
firebase deploy --only functions
```

---

## 🚀 Deployment

### 1. Update Environment Variables

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
```

### 2. Initialize Firestore

Create initial credit configuration:
```javascript
// In Firebase Console or via script
db.collection('system_config').doc('credit_config').set({
  imageCost: 1,
  videoCostPerSecond: 5,
  voiceCostPerMinute: 2,
  chatCostPerToken: 0.001,
  freeSignupCredits: 10,
  basicPlanCredits: 100,
  premiumPlanCredits: 500,
  updatedAt: Date.now()
});
```

### 3. Grant Admin Access

```bash
# Use the grant-admin script
node scripts/grant-admin.js admin@example.com
```

Or manually in Firestore:
```javascript
db.collection('users').doc(userId).update({
  role: 'admin'
});
```

### 4. Deploy Application

```bash
npm run build
firebase deploy
```

---

## 🧪 Testing

### Test Credit Flow

```typescript
// 1. Check initial balance
const user = await getUserProfile(userId);
console.log('Initial credits:', user.credits);

// 2. Generate image
const result = await withImageCredits(
  userId, 
  'test prompt', 
  'dalle3',
  async () => ({ url: 'https://example.com/image.jpg' })
);

// 3. Verify deduction
console.log('Credits used:', result.creditsUsed);
console.log('Remaining:', result.remainingCredits);

// 4. Check logs
const logs = await getCreditLogs(userId);
console.log('Transaction logs:', logs);
```

### Test Rate Limiting

```typescript
// Make multiple rapid requests
for (let i = 0; i < 60; i++) {
  const result = await withImageCredits(userId, 'test', 'dalle3', callback);
  console.log(`Request ${i}:`, result.success);
}
// Should hit rate limit after 50 requests
```

### Test Prompt Moderation

```typescript
const inappropriatePrompt = 'generate nsfw content';
const result = await withImageCredits(userId, inappropriatePrompt, 'dalle3', callback);
// Should return: { success: false, error: 'Inappropriate content' }
```

---

## 📊 Monitoring

### Key Metrics to Track

1. **Credit Usage**
   - Total credits used per day/week/month
   - Average credits per generation
   - Credits used by AI type

2. **Generation Stats**
   - Total generations
   - Success rate
   - Average processing time
   - Failures and errors

3. **User Behavior**
   - Active users
   - Top users by credit usage
   - Suspension rate
   - Abuse incidents

4. **Performance**
   - API response times
   - Database query performance
   - Function execution times

### View in Admin Dashboard

- Navigate to **Live AI** tab for real-time monitoring
- Navigate to **Credits** tab for usage statistics
- Check **Abuse Detection** panel for security alerts

---

## 🎯 Best Practices

### 1. Credit Pricing
- Set competitive rates based on actual API costs
- Add markup for sustainability (20-30%)
- Offer volume discounts for premium users

### 2. Rate Limiting
- Balance user experience with abuse prevention
- Adjust limits based on user tier
- Provide clear error messages

### 3. Security
- Regularly review abuse logs
- Update banned keywords list
- Monitor for suspicious patterns
- Keep audit logs for compliance

### 4. User Experience
- Show credit balance prominently
- Display cost before generation
- Provide clear upgrade paths
- Send notifications before running out

---

## 🆘 Troubleshooting

### Credits Not Deducting

1. Check Firestore rules are deployed
2. Verify user authentication
3. Check Cloud Functions logs
4. Verify credit wrapper is used

### Real-time Updates Not Working

1. Check Firestore onSnapshot listener
2. Verify admin role in user document
3. Check browser console for errors
4. Test with Firestore emulator

### Rate Limit Issues

1. Check rate limit documents in Firestore
2. Verify window expiration logic
3. Test with different users
4. Review Cloud Function logs

---

## 📚 Additional Resources

- **Firestore Security Rules**: `FIRESTORE_RULES.md`
- **Cloud Functions**: `functions/src/index.ts`
- **Credit Wrapper**: `services/creditWrapper.ts`
- **Firebase Service**: `services/firebase.ts`
- **Admin Dashboard**: `components/AdminDashboard.tsx`

---

## 🎉 Success Criteria

✅ **Credit System**
- [x] Configurable costs
- [x] Automatic deduction
- [x] Admin controls
- [x] Transaction logging
- [x] Usage analytics

✅ **Live AI Activity**
- [x] Real-time monitoring
- [x] Firestore onSnapshot
- [x] Status tracking
- [x] Processing metrics

✅ **Security**
- [x] Rate limiting
- [x] Prompt moderation
- [x] Abuse detection
- [x] Admin audit logs
- [x] IP tracking

---

**Built with enterprise-grade architecture for AI SaaS applications** 🚀

Production-ready • Scalable • Secure • Real-time
