# Super Admin Dashboard - Firestore Schema

## Collections Overview

This document defines the complete Firestore schema for the enterprise Super Admin Dashboard system.

---

## 1. analytics_daily

**Purpose**: Store daily aggregated analytics data to avoid expensive queries on the frontend.

**Document ID**: `YYYY-MM-DD` (e.g., "2026-01-05")

**Fields**:
```typescript
{
  date: string;                    // ISO date "YYYY-MM-DD"
  totalUsers: number;              // Total registered users at end of day
  activeUsers24h: number;          // Users who logged in in last 24h
  activeUsers7d: number;           // Users who logged in in last 7d
  newSignups: number;              // New signups on this day
  totalGenerations: number;        // Total AI generations
  imageGenerations: number;        // Image generations count
  videoGenerations: number;        // Video generations count
  voiceGenerations: number;        // Voice/audio generations count
  chatGenerations: number;         // Chat/GPT generations count
  creditsConsumed: number;         // Total credits consumed
  creditsGranted: number;          // Total credits granted (signups, purchases)
  revenue: number;                 // Revenue in USD (from subscriptions)
  pageViews: number;               // Total page views
  uniqueVisitors: number;          // Unique visitors
  trafficByCountry: {              // Traffic breakdown by country
    [countryCode: string]: number;
  };
  topReferrers: {                  // Top 10 referrers
    [referrer: string]: number;
  };
  updatedAt: Timestamp;            // Last update time
}
```

**Indexes**: Auto-indexed by document ID (date)

---

## 2. analytics_monthly

**Purpose**: Store monthly aggregated analytics for long-term trends.

**Document ID**: `YYYY-MM` (e.g., "2026-01")

**Fields**:
```typescript
{
  month: string;                   // "YYYY-MM"
  totalUsers: number;              // Total users at end of month
  newSignups: number;              // New signups this month
  totalGenerations: number;        // Total AI generations
  imageGenerations: number;
  videoGenerations: number;
  voiceGenerations: number;
  chatGenerations: number;
  creditsConsumed: number;
  creditsGranted: number;
  revenue: number;                 // Total revenue
  avgDailyActiveUsers: number;     // Average DAU
  churnRate: number;               // User churn rate %
  topCountries: string[];          // Top 5 countries by traffic
  updatedAt: Timestamp;
}
```

---

## 3. credit_rules

**Purpose**: Define base credit costs for different generation types and quality levels.

**Document ID**: Auto-generated or named (e.g., "default_rules")

**Fields**:
```typescript
{
  // Base costs for generation types
  imageCost: number;               // Base cost for standard image (e.g., 1 credit)
  imageHDCost: number;             // Cost for HD image (e.g., 2 credits)
  image4KCost: number;             // Cost for 4K image (e.g., 5 credits)
  
  videoCostPerSecond: number;      // Video cost per second (e.g., 5 credits)
  video720pMultiplier: number;     // Multiplier for 720p (e.g., 1.0)
  video1080pMultiplier: number;    // Multiplier for 1080p (e.g., 1.5)
  video4KMultiplier: number;       // Multiplier for 4K (e.g., 3.0)
  
  voiceCostPerMinute: number;      // Voice cost per minute (e.g., 2 credits)
  voiceCloneCostMultiplier: number;// Multiplier for voice cloning (e.g., 2.0)
  
  chatCostPerToken: number;        // Chat cost per token (e.g., 0.001 credits)
  chatGPT4Multiplier: number;      // Multiplier for GPT-4 (e.g., 5.0)
  
  // Signup and plan credits
  freeSignupCredits: number;       // Credits given on free signup (e.g., 10)
  basicPlanCredits: number;        // Monthly credits for Basic plan (e.g., 100)
  premiumPlanCredits: number;      // Monthly credits for Premium plan (e.g., 500)
  
  updatedAt: Timestamp;
  updatedBy: string;               // Admin UID who last updated
  auditLog: string;                // Reason for update
}
```

---

## 4. engine_costs

**Purpose**: Define credit costs per AI engine (DALL-E, Midjourney, Stable Diffusion, etc.).

**Document ID**: Engine name (e.g., "dalle3", "midjourney", "stable_diffusion")

**Fields**:
```typescript
{
  engineId: string;                // Unique engine identifier
  engineName: string;              // Display name (e.g., "DALL-E 3")
  type: 'image' | 'video' | 'voice' | 'chat'; // Generation type
  baseCostPerGeneration: number;   // Base cost in credits
  qualityMultipliers: {            // Quality-based multipliers
    standard?: number;             // e.g., 1.0
    hd?: number;                   // e.g., 1.5
    ultra?: number;                // e.g., 2.5
  };
  isActive: boolean;               // Whether engine is currently active
  averageProcessingTime: number;   // Average time in seconds
  successRate: number;             // Success rate % (for monitoring)
  usageCount: number;              // Total usage count
  lastUsed: Timestamp;             // Last time this engine was used
  updatedAt: Timestamp;
  updatedBy: string;               // Admin UID
}
```

**Indexes**:
- `type` (for filtering by generation type)
- `isActive` (for showing only active engines)

---

## 5. plan_credit_overrides

**Purpose**: Override default credit costs per subscription plan (e.g., Premium users get discounts).

**Document ID**: `{planName}_{engineId}` (e.g., "premium_dalle3")

**Fields**:
```typescript
{
  planName: 'free' | 'basic' | 'premium';
  engineId: string;                // Reference to engine_costs document
  engineName: string;              // Display name
  type: 'image' | 'video' | 'voice' | 'chat';
  overrideCost: number;            // Overridden cost in credits (null = use default)
  discountPercentage: number;      // Discount % for this plan (e.g., 20)
  isActive: boolean;
  updatedAt: Timestamp;
  updatedBy: string;
}
```

**Indexes**:
- `planName` (for querying plan-specific overrides)
- `type` (for filtering by generation type)

---

## 6. contact_messages

**Purpose**: Store messages from "Contact Us" form.

**Document ID**: Auto-generated

**Fields**:
```typescript
{
  userId?: string;                 // UID if user is logged in (optional)
  userEmail: string;               // Sender's email
  userName?: string;               // Sender's name (optional)
  subject: string;                 // Message subject
  message: string;                 // Message content
  source: 'contact_form';          // Always "contact_form" for this collection
  status: 'new' | 'read' | 'replied' | 'archived';
  priority: 'low' | 'medium' | 'high';
  ipAddress?: string;              // User's IP (for spam detection)
  userAgent?: string;              // Browser user agent
  createdAt: Timestamp;
  readAt?: Timestamp;              // When admin read it
  repliedAt?: Timestamp;           // When admin replied
  replyContent?: string;           // Admin's reply
  repliedBy?: string;              // Admin UID who replied
  tags?: string[];                 // Tags for categorization (e.g., ["billing", "bug"])
}
```

**Indexes**:
- `status` (for filtering by status)
- `createdAt` (for sorting by date)
- `priority` (for filtering by priority)

---

## 7. chat_messages

**Purpose**: Store messages from website chat widget.

**Document ID**: Auto-generated

**Fields**:
```typescript
{
  sessionId: string;               // Chat session ID
  userId?: string;                 // UID if user is logged in (optional)
  userEmail?: string;              // User's email (optional)
  userName?: string;               // User's name or "Guest"
  message: string;                 // Message content
  sender: 'user' | 'support';      // Who sent the message
  source: 'chat_widget';           // Always "chat_widget"
  status: 'new' | 'read' | 'replied';
  ipAddress?: string;
  createdAt: Timestamp;
  readAt?: Timestamp;
}
```

**Indexes**:
- `sessionId` (for querying all messages in a session)
- `status` (for filtering)
- `createdAt` (for sorting)

**Related Collection**: `chat_sessions`
```typescript
{
  sessionId: string;
  userId?: string;
  userEmail?: string;
  userName: string;
  isGuest: boolean;
  status: 'active' | 'closed';
  lastMessageAt: Timestamp;
  messageCount: number;
  createdAt: Timestamp;
  closedAt?: Timestamp;
}
```

---

## 8. audit_logs

**Purpose**: Track all admin actions for security and compliance.

**Document ID**: Auto-generated

**Fields**:
```typescript
{
  adminId: string;                 // Admin UID who performed action
  adminEmail: string;              // Admin email
  action: string;                  // Action type (e.g., "UPDATE_CREDIT_RULES", "SUSPEND_USER")
  targetType: 'user' | 'credit_rules' | 'engine' | 'plan' | 'system';
  targetId?: string;               // Target document ID (e.g., user UID)
  changes?: {                      // What changed
    before: any;
    after: any;
  };
  reason?: string;                 // Admin's reason for action
  ipAddress: string;               // Admin's IP
  userAgent: string;               // Admin's browser
  timestamp: Timestamp;
  success: boolean;                // Whether action succeeded
  errorMessage?: string;           // Error if action failed
}
```

**Indexes**:
- `adminId` (for filtering by admin)
- `action` (for filtering by action type)
- `timestamp` (for sorting)
- `targetType` (for filtering by target)

---

## 9. users (Enhanced)

**Purpose**: User profiles with enhanced admin-managed fields.

**Document ID**: User UID

**Fields** (additions to existing schema):
```typescript
{
  // ... existing fields ...
  
  // Admin management fields
  isSuspended: boolean;            // Whether user is suspended
  suspendedAt?: Timestamp;         // When user was suspended
  suspendedBy?: string;            // Admin UID who suspended
  suspendReason?: string;          // Reason for suspension
  
  // Credit tracking
  totalCreditsGranted: number;     // Lifetime credits granted
  totalCreditsConsumed: number;    // Lifetime credits consumed
  creditHistory: {                 // Recent credit changes
    timestamp: Timestamp;
    amount: number;                // Positive = granted, negative = consumed
    reason: string;                // e.g., "signup_bonus", "image_generation"
    adminId?: string;              // If manually granted by admin
  }[];
  
  // Activity tracking
  lastActiveAt: Timestamp;         // Last login/activity
  totalGenerations: number;        // Total AI generations
  generationsByType: {
    image: number;
    video: number;
    voice: number;
    chat: number;
  };
  
  // Admin notes
  adminNotes?: string;             // Private admin notes about user
  tags?: string[];                 // Tags for categorization
}
```

---

## 10. generation_logs (NEW)

**Purpose**: Track all AI generation requests for analytics and abuse detection.

**Document ID**: Auto-generated

**Fields**:
```typescript
{
  userId: string;
  userEmail: string;
  generationType: 'image' | 'video' | 'voice' | 'chat';
  engineId: string;                // Which engine was used
  engineName: string;
  prompt?: string;                 // Generation prompt (anonymized if needed)
  creditsCost: number;             // Credits consumed
  quality?: string;                // Quality level (HD, 4K, etc.)
  duration?: number;               // For video/voice (in seconds)
  status: 'success' | 'failed' | 'queued' | 'processing';
  errorMessage?: string;
  processingTime?: number;         // Time taken in milliseconds
  ipAddress?: string;
  createdAt: Timestamp;
  completedAt?: Timestamp;
}
```

**Indexes**:
- `userId` (for per-user analytics)
- `generationType` (for filtering)
- `status` (for monitoring failures)
- `createdAt` (for date ranges)

---

## 11. system_config (NEW)

**Purpose**: Store global system configuration that admin can modify.

**Document ID**: "default"

**Fields**:
```typescript
{
  maintenanceMode: boolean;        // Enable/disable maintenance mode
  maintenanceMessage?: string;     // Message to show during maintenance
  
  signupsEnabled: boolean;         // Allow new signups
  freeSignupsEnabled: boolean;     // Allow free tier signups
  
  maxConcurrentGenerations: number;// Max concurrent AI generations
  maxQueueSize: number;            // Max queue size
  
  rateLimits: {
    free: {
      maxPerHour: number;
      maxPerDay: number;
    };
    basic: {
      maxPerHour: number;
      maxPerDay: number;
    };
    premium: {
      maxPerHour: number;
      maxPerDay: number;
    };
  };
  
  updatedAt: Timestamp;
  updatedBy: string;
}
```

---

## Data Flow Examples

### 1. User Generates Image
```
1. Frontend calls API with prompt
2. API checks:
   - User is not suspended (users.isSuspended)
   - User has enough credits (users.credits)
   - Credit cost from engine_costs or plan_credit_overrides
3. Create document in generation_logs (status: 'queued')
4. Process generation
5. Update generation_logs (status: 'success')
6. Deduct credits from users.credits
7. Update users.totalCreditsConsumed
8. Add entry to users.creditHistory
```

### 2. Admin Updates Credit Rules
```
1. Admin edits credit_rules document
2. Create audit_logs entry with before/after values
3. Cloud Function validates changes
4. Update credit_rules.updatedAt and updatedBy
5. Changes apply immediately to new generations
```

### 3. Daily Analytics Aggregation (Cloud Function - Scheduled)
```
1. Run at midnight UTC
2. Query generation_logs for last 24h
3. Query users for active users
4. Calculate aggregates
5. Create/update analytics_daily document
6. Update analytics_monthly with new data
```

### 4. User Sends Contact Message
```
1. Frontend creates contact_messages document
2. Cloud Function sends notification to admin
3. Admin views in Admin Inbox
4. Admin marks as read (update status)
5. Optional: Admin replies via email
```

---

## Security Rules Summary

- **analytics_***: Read-only for super_admin
- **credit_rules**: Read for all, write for super_admin only
- **engine_costs**: Read for all, write for super_admin only
- **plan_credit_overrides**: Read for all, write for super_admin only
- **contact_messages**: Write for authenticated users, read for super_admin
- **chat_messages**: Read/write for authenticated users, read for super_admin
- **audit_logs**: Write by system, read for super_admin only
- **users**: Read own profile, super_admin can read/write all
- **generation_logs**: Write by system, read for super_admin only
- **system_config**: Read for all, write for super_admin only

---

## Indexes to Create

Create these composite indexes in Firestore:

```
Collection: generation_logs
- userId ASC, createdAt DESC
- generationType ASC, createdAt DESC
- status ASC, createdAt DESC

Collection: contact_messages
- status ASC, createdAt DESC
- priority DESC, createdAt DESC

Collection: chat_messages
- sessionId ASC, createdAt ASC
- status ASC, createdAt DESC

Collection: audit_logs
- adminId ASC, timestamp DESC
- action ASC, timestamp DESC
- targetType ASC, timestamp DESC
```

---

## Cost Optimization

1. **Use aggregate documents** (analytics_daily, analytics_monthly) instead of querying raw data
2. **Paginate user lists** (limit to 50-100 per page)
3. **Cache frequently accessed data** (credit_rules, engine_costs) in frontend
4. **Use Cloud Functions** for heavy computations
5. **Limit query ranges** (e.g., last 30 days only)
6. **Index strategically** to avoid collection scans

---

This schema supports a production-ready SaaS admin dashboard with real-time analytics, dynamic pricing, user management, and comprehensive audit logging.
