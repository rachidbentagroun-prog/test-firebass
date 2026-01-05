# SUBSCRIPTION PLAN & PRICING OVERRIDE SECURITY RULES

## 🔒 Firestore Security Rules

Add these rules to your `firestore.rules` file to secure subscription plans and pricing overrides.

### Complete Rules File

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // ============================================
    // HELPER FUNCTIONS
    // ============================================
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // ============================================
    // SUBSCRIPTION PLANS
    // ============================================
    
    // Only admins can write, all authenticated users can read
    match /subscription_plans/{planId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
      
      // Prevent plan deletion by accident
      allow delete: if false;
    }
    
    // ============================================
    // PLAN PRICING OVERRIDES
    // ============================================
    
    // Only admins can read/write pricing overrides
    // Regular users should NEVER see raw pricing data
    match /plan_pricing_overrides/{planId} {
      allow read: if isAdmin();
      allow write: if isAdmin();
      allow delete: if isAdmin();
    }
    
    // ============================================
    // USAGE LOGS (Enhanced with plan info)
    // ============================================
    
    // Users can only read their own logs
    // System can write logs (via Cloud Functions)
    match /usage_logs/{logId} {
      allow read: if isAuthenticated() && 
                     resource.data.userId == request.auth.uid;
      
      // Only Cloud Functions can write (admin SDK)
      allow write: if false;
      
      // Validate log structure when written via admin SDK
      allow create: if isAdmin() && 
                       request.resource.data.keys().hasAll([
                         'userId', 'aiType', 'creditsUsed', 'timestamp'
                       ]);
    }
    
    // ============================================
    // USERS (with subscription_plan field)
    // ============================================
    
    match /users/{userId} {
      // Users can read their own profile
      allow read: if isOwner(userId) || isAdmin();
      
      // Users can update their own profile, but NOT credits or role
      allow update: if isOwner(userId) && 
                       !request.resource.data.diff(resource.data).affectedKeys()
                         .hasAny(['credits', 'role', 'subscription_plan']);
      
      // Admins can do anything
      allow write: if isAdmin();
      
      // Prevent accidental deletion
      allow delete: if isAdmin();
    }
    
    // ============================================
    // CREDIT PRICING (Global defaults)
    // ============================================
    
    match /credit_pricing/{aiType} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
      allow delete: if false;
    }
    
    // ============================================
    // AI ENGINES
    // ============================================
    
    match /ai_engines/{engineId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
      allow delete: if false;
    }
    
    // ============================================
    // ADMIN AUDIT LOGS
    // ============================================
    
    match /admin_audit_logs/{logId} {
      allow read: if isAdmin();
      allow write: if false; // Only Cloud Functions
    }
    
    // ============================================
    // RATE LIMITING
    // ============================================
    
    match /rate_limits/{key} {
      allow read: if isAdmin();
      allow write: if false; // Only Cloud Functions
    }
  }
}
```

---

## 🛡️ Security Best Practices

### 1. **Never Expose Pricing to Clients**
```javascript
❌ BAD: Fetching pricing overrides in frontend
const overrides = await db.collection('plan_pricing_overrides').doc(userPlan).get();

✅ GOOD: Use Cloud Function
const result = await functions.httpsCallable('getCreditCost')({
  user_plan: userPlan,
  ai_type: 'image',
  engine_id: 'dall-e-3',
  input_size: 1
});
```

### 2. **All Credit Calculations Server-Side**
```javascript
❌ BAD: Client calculates cost
const cost = baseCost * inputSize;
await deductCredits(userId, cost);

✅ GOOD: Cloud Function validates and calculates
const result = await functions.httpsCallable('validateAndDeductEngineCredits')({
  ai_type: 'image',
  engine_id: 'dall-e-3',
  input_size: 1,
  prompt: 'A beautiful sunset'
});
```

### 3. **Validate User Plan on Every Request**
```typescript
// In Cloud Functions
const userDoc = await db.collection('users').doc(userId).get();
const userPlan = userDoc.data()?.subscription_plan || 'free';

// Check if user's plan allows this engine
const engine = await db.collection('ai_engines').doc(engineId).get();
if (engine.data()?.plan_restrictions && !engine.data().plan_restrictions.includes(userPlan)) {
  throw new Error(`Engine ${engineId} not available on ${userPlan} plan`);
}
```

### 4. **Immutable Logs**
```javascript
// Usage logs should NEVER be editable
match /usage_logs/{logId} {
  allow update: if false;
  allow delete: if false;
}
```

### 5. **Admin-Only Pricing Updates**
```javascript
// Always verify admin role in Cloud Functions
if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
  throw new functions.https.HttpsError('permission-denied', 'Admin access required');
}

// Log all admin actions
await db.collection('admin_audit_logs').add({
  adminId: context.auth.uid,
  action: 'update_pricing',
  timestamp: Date.now()
});
```

---

## 🔐 User Document Structure

### Required Fields
```typescript
{
  userId: string;
  email: string;
  credits: number;
  subscription_plan: 'free' | 'basic' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'canceled' | 'past_due';
  role: 'user' | 'admin';
  createdAt: number;
  updatedAt: number;
}
```

### Subscription Fields
```typescript
{
  // Plan information
  subscription_plan: 'pro',
  subscription_status: 'active',
  subscription_start_date: 1704067200000,
  subscription_end_date: 1735689600000,
  billing_interval: 'monthly',
  
  // Payment information (stored separately in Stripe)
  stripe_customer_id: 'cus_xyz123',
  stripe_subscription_id: 'sub_abc456',
  
  // Credits
  credits: 500,
  credits_reset_date: 1706745600000,
  lifetime_credits_used: 12500
}
```

---

## 🚨 Rate Limiting Rules

### Per-User Rate Limits
```typescript
// In Cloud Functions
const userId = context.auth.uid;
const rateLimitKey = `user:${userId}:generations`;
const rateLimitDoc = await db.collection('rate_limits').doc(rateLimitKey).get();

if (rateLimitDoc.exists) {
  const data = rateLimitDoc.data();
  const resetTime = data.resetTime;
  
  if (Date.now() < resetTime) {
    const count = data.count || 0;
    const limit = getUserDailyLimit(userPlan); // From plan limits
    
    if (count >= limit) {
      throw new Error('Daily generation limit reached');
    }
  }
}
```

### Per-IP Rate Limits
```typescript
// Prevent abuse from same IP
const ipAddress = getUserIP(context.rawRequest);
const ipRateLimitKey = `ip:${ipAddress}:generations`;
const ipLimitDoc = await db.collection('rate_limits').doc(ipRateLimitKey).get();

// Max 100 generations per hour per IP
if (ipLimitDoc.exists && ipLimitDoc.data().count > 100) {
  throw new Error('Too many requests from this IP');
}
```

---

## 📊 Data Access Patterns

### ✅ Allowed (Server-Side)
```typescript
// Cloud Functions can read everything
const overrides = await db.collection('plan_pricing_overrides').doc(planId).get();
const engine = await db.collection('ai_engines').doc(engineId).get();
const pricing = await db.collection('credit_pricing').doc(aiType).get();

// Admins can read/write via admin dashboard
if (isAdmin) {
  await db.collection('plan_pricing_overrides').doc(planId).set(data);
}
```

### ❌ Forbidden (Client-Side)
```typescript
// Users should NEVER access these directly
await db.collection('plan_pricing_overrides').get(); // ❌
await db.collection('credit_pricing').get(); // ❌
await db.collection('rate_limits').get(); // ❌

// Users cannot modify credits or plans
await db.collection('users').doc(userId).update({
  credits: 9999999 // ❌ BLOCKED
});
```

---

## 🧪 Testing Security Rules

### Test Admin Access
```javascript
const admin = firebase.auth().currentUser;
await db.collection('plan_pricing_overrides').doc('pro').get(); // ✅ Should work
```

### Test User Access
```javascript
const user = firebase.auth().currentUser;
await db.collection('plan_pricing_overrides').doc('pro').get(); // ❌ Should fail
await db.collection('subscription_plans').get(); // ✅ Should work
```

### Test Credit Modification
```javascript
const user = firebase.auth().currentUser;
await db.collection('users').doc(user.uid).update({ 
  credits: 9999 
}); // ❌ Should fail
```

---

## 📝 Checklist

Before deploying to production:

- [ ] Firestore rules deployed via `firebase deploy --only firestore:rules`
- [ ] Admin users have `role: 'admin'` in Firestore
- [ ] All pricing calculations moved to Cloud Functions
- [ ] No client-side pricing logic exists
- [ ] Rate limiting configured for all AI endpoints
- [ ] Usage logs are immutable
- [ ] Audit logs capture all admin actions
- [ ] Tested with regular user account
- [ ] Tested with admin account
- [ ] Validated rate limits trigger correctly

---

## 🆘 Troubleshooting

### "Permission Denied" Errors
1. Check if user is authenticated: `firebase.auth().currentUser`
2. Verify user role: `await db.collection('users').doc(userId).get()`
3. Confirm rules deployed: `firebase firestore:rules list`

### Pricing Not Working
1. Verify engine exists: `await db.collection('ai_engines').doc(engineId).get()`
2. Check plan overrides: `await functions.httpsCallable('getCreditCost')(...)`
3. Review Cloud Function logs: `firebase functions:log`

### Rate Limiting Issues
1. Check rate limit document: `await db.collection('rate_limits').doc(key).get()`
2. Verify reset time hasn't passed
3. Confirm plan limits are correct

---

## 📚 Related Documentation

- [Engine Pricing System](./ENGINE_PRICING_SYSTEM.md)
- [Plan Pricing System](./PLAN_PRICING_SYSTEM.md)
- [Admin Dashboard Guide](./ADMIN_DASHBOARD_FEATURES.md)
- [Cloud Functions API](./functions/README.md)
