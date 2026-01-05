# Firestore Profit & Cost Intelligence Schema

> **Enterprise-Grade Financial Data Model**  
> Built for subscription-based AI SaaS platforms

---

## 📊 Collection Structure

### 1. `ai_engine_costs`

**Purpose**: Master cost configuration for all AI engines  
**Access**: Super Admin only  
**Updates**: Manual or scheduled API sync

```
ai_engine_costs/{engine_id}
```

**Document IDs**:
- `dalle_3_standard`
- `dalle_3_hd`
- `gemini_pro_vision`
- `openai_video`
- `seddream_video`
- `openai_tts`
- `openai_chat_gpt4`

**Fields**:
```typescript
{
  engine_id: string;              // Primary key
  provider_name: string;          // "OpenAI", "Google", "SEDDREAM"
  ai_type: string;                // "image" | "video" | "voice" | "chat"
  cost_per_unit: number;          // USD per unit (e.g., 0.04 for DALL·E)
  unit_type: string;              // "image" | "second" | "minute" | "1k_tokens"
  quality_tier?: string;          // "standard" | "hd" | "4k" 
  resolution?: string;            // "1024x1024" | "1920x1080"
  updated_at: Timestamp;
  updated_by: string;             // Admin UID
  is_active: boolean;             // Enable/disable engine
  notes?: string;                 // Cost justification
}
```

**Indexes**:
- `ai_type` (ASC) + `is_active` (ASC)
- `provider_name` (ASC) + `updated_at` (DESC)

**Example Documents**:
```javascript
// dalle_3_standard
{
  engine_id: "dalle_3_standard",
  provider_name: "OpenAI",
  ai_type: "image",
  cost_per_unit: 0.04,
  unit_type: "image",
  quality_tier: "standard",
  resolution: "1024x1024",
  updated_at: Timestamp,
  updated_by: "admin_uid",
  is_active: true
}

// seddream_video
{
  engine_id: "seddream_video",
  provider_name: "SEDDREAM",
  ai_type: "video",
  cost_per_unit: 0.12,
  unit_type: "second",
  resolution: "1920x1080",
  updated_at: Timestamp,
  updated_by: "admin_uid",
  is_active: true
}

// openai_chat_gpt4
{
  engine_id: "openai_chat_gpt4",
  provider_name: "OpenAI",
  ai_type: "chat",
  cost_per_unit: 0.03,
  unit_type: "1k_tokens",
  updated_at: Timestamp,
  updated_by: "admin_uid",
  is_active: true
}
```

---

### 2. `usage_logs` (EXTENDED)

**Purpose**: Real-time usage tracking with financial metrics  
**TTL**: 90 days (configurable)  
**Access**: System writes, Admin reads

```
usage_logs/{auto_generated_id}
```

**Fields** (Extended):
```typescript
{
  // Existing fields
  user_id: string;
  subscription_plan: string;      // "free" | "pro" | "ultra"
  ai_type: string;                // "image" | "video" | "voice" | "chat"
  engine_id: string;              // Reference to ai_engine_costs
  usage_units: number;            // Quantity used
  credits_used: number;           // Internal credit system
  created_at: Timestamp;
  
  // NEW FINANCIAL FIELDS
  real_cost_usd: number;          // Actual AI cost (from ai_engine_costs)
  revenue_estimated_usd: number;  // Allocated revenue for this request
  profit_usd: number;             // revenue - cost
  profit_margin_percent: number;  // (profit / revenue) * 100
  pricing_source: string;         // "plan_override" | "engine_default"
  
  // Metadata
  request_id?: string;            // Link to generation request
  country_code?: string;          // User location
  device_type?: string;           // "web" | "mobile" | "api"
  generation_time_ms?: number;    // Performance tracking
}
```

**Indexes**:
- `user_id` (ASC) + `created_at` (DESC)
- `subscription_plan` (ASC) + `created_at` (DESC)
- `engine_id` (ASC) + `created_at` (DESC)
- `profit_usd` (ASC) + `created_at` (DESC) // Find loss-making requests

**TTL Policy**:
```javascript
// Firestore TTL on created_at field
// Auto-delete after 90 days
```

---

### 3. `profit_aggregates`

**Purpose**: Pre-computed financial summaries (NO client-side aggregation)  
**Access**: Super Admin read-only  
**Updates**: Cloud Functions only

```
profit_aggregates/{period_id}
```

**Document IDs**:
- `daily_2026_01_04`
- `monthly_2026_01`
- `yearly_2026`
- `all_time`

**Fields**:
```typescript
{
  period_id: string;              // Primary key
  period_type: string;            // "daily" | "monthly" | "yearly" | "all_time"
  period_start: Timestamp;
  period_end: Timestamp;
  
  // AGGREGATE METRICS
  total_cost_usd: number;
  total_revenue_usd: number;
  total_profit_usd: number;
  profit_margin_percent: number;
  
  // COST BREAKDOWN BY ENGINE
  cost_by_engine: {
    [engine_id: string]: {
      cost_usd: number;
      usage_count: number;
      avg_cost_per_use: number;
    }
  };
  
  // REVENUE BREAKDOWN BY PLAN
  revenue_by_plan: {
    [plan_name: string]: {
      revenue_usd: number;
      user_count: number;
      generation_count: number;
    }
  };
  
  // PROFIT BREAKDOWN BY PLAN
  profit_by_plan: {
    [plan_name: string]: {
      profit_usd: number;
      profit_margin_percent: number;
      cost_usd: number;
      revenue_usd: number;
    }
  };
  
  // LOSS METRICS
  loss_users_count: number;
  loss_plans: string[];           // Plans with negative margins
  worst_performing_engine?: string;
  
  // USAGE STATS
  total_generations: number;
  total_users: number;
  avg_cost_per_user: number;
  avg_revenue_per_user: number;
  
  // Metadata
  updated_at: Timestamp;
  calculation_duration_ms: number;
  data_completeness_percent: number; // Data quality score
}
```

**Example Document**:
```javascript
// daily_2026_01_04
{
  period_id: "daily_2026_01_04",
  period_type: "daily",
  period_start: Timestamp("2026-01-04 00:00:00"),
  period_end: Timestamp("2026-01-04 23:59:59"),
  
  total_cost_usd: 1250.45,
  total_revenue_usd: 3500.00,
  total_profit_usd: 2249.55,
  profit_margin_percent: 64.27,
  
  cost_by_engine: {
    dalle_3_standard: {
      cost_usd: 450.00,
      usage_count: 11250,
      avg_cost_per_use: 0.04
    },
    seddream_video: {
      cost_usd: 680.45,
      usage_count: 5670,
      avg_cost_per_use: 0.12
    },
    openai_chat_gpt4: {
      cost_usd: 120.00,
      usage_count: 4000,
      avg_cost_per_use: 0.03
    }
  },
  
  revenue_by_plan: {
    pro: {
      revenue_usd: 2000.00,
      user_count: 100,
      generation_count: 8500
    },
    ultra: {
      revenue_usd: 1500.00,
      user_count: 30,
      generation_count: 8420
    }
  },
  
  profit_by_plan: {
    pro: {
      profit_usd: 1350.00,
      profit_margin_percent: 67.5,
      cost_usd: 650.00,
      revenue_usd: 2000.00
    },
    ultra: {
      profit_usd: 899.55,
      profit_margin_percent: 59.97,
      cost_usd: 600.45,
      revenue_usd: 1500.00
    }
  },
  
  loss_users_count: 3,
  loss_plans: [],
  worst_performing_engine: "seddream_video",
  
  total_generations: 16920,
  total_users: 130,
  avg_cost_per_user: 9.62,
  avg_revenue_per_user: 26.92,
  
  updated_at: Timestamp,
  calculation_duration_ms: 1245,
  data_completeness_percent: 100
}
```

**Indexes**:
- `period_type` (ASC) + `period_start` (DESC)
- `profit_margin_percent` (ASC)

---

### 4. `loss_users`

**Purpose**: Track users with negative profit margins  
**Access**: Super Admin only  
**Updates**: Hourly Cloud Function scan

```
loss_users/{user_id}
```

**Fields**:
```typescript
{
  user_id: string;
  email: string;
  subscription_plan: string;
  
  // FINANCIAL METRICS (Last 30 days)
  total_cost_usd: number;
  total_revenue_usd: number;
  total_profit_usd: number;        // Negative value
  profit_margin_percent: number;   // Negative value
  
  // USAGE PATTERNS
  total_generations: number;
  most_used_engine: string;
  most_expensive_engine: string;
  
  // DETECTION
  detected_at: Timestamp;
  last_checked_at: Timestamp;
  days_in_loss: number;
  
  // ACTION TRACKING
  alert_sent: boolean;
  alert_sent_at?: Timestamp;
  action_taken?: string;           // "rate_limited" | "plan_upgraded" | "monitored"
  notes?: string;
}
```

**Indexes**:
- `subscription_plan` (ASC) + `profit_margin_percent` (ASC)
- `detected_at` (DESC)

---

### 5. `profit_audit_log`

**Purpose**: Audit trail for all pricing & cost changes  
**Access**: Super Admin only  
**Retention**: 2 years

```
profit_audit_log/{auto_generated_id}
```

**Fields**:
```typescript
{
  action_type: string;            // "cost_updated" | "pricing_changed" | "loss_detected"
  entity_type: string;            // "engine" | "plan" | "user"
  entity_id: string;
  
  before_value?: any;
  after_value?: any;
  
  changed_by: string;             // Admin UID
  changed_at: Timestamp;
  ip_address?: string;
  reason?: string;
}
```

---

## 🔐 Security Rules

```javascript
// firestore.rules

// ai_engine_costs - Super Admin only
match /ai_engine_costs/{engineId} {
  allow read: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin';
  allow write: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin';
}

// usage_logs - System writes, Admin reads
match /usage_logs/{logId} {
  allow read: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin';
  allow write: if false; // Only Cloud Functions can write
}

// profit_aggregates - Admin read-only
match /profit_aggregates/{periodId} {
  allow read: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin';
  allow write: if false; // Only Cloud Functions can write
}

// loss_users - Admin read-only
match /loss_users/{userId} {
  allow read: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin';
  allow write: if false; // Only Cloud Functions can write
}

// profit_audit_log - Admin read-only
match /profit_audit_log/{logId} {
  allow read: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin';
  allow write: if false; // Only Cloud Functions can write
}
```

---

## 📈 Data Lifecycle

1. **Real-time**: `usage_logs` written on every AI generation
2. **Hourly**: Loss detection scans
3. **Daily**: Daily aggregation runs at 00:01 UTC
4. **Monthly**: Monthly aggregation runs on 1st of month
5. **TTL**: `usage_logs` auto-deleted after 90 days

---

## 🚀 Migration Plan

```javascript
// 1. Create collections
// 2. Seed ai_engine_costs with initial data
// 3. Backfill usage_logs with financial fields
// 4. Run initial aggregations
// 5. Enable scheduled functions
// 6. Deploy security rules
```

---

**Schema Version**: 1.0.0  
**Last Updated**: 2026-01-04  
**Maintained by**: Profit Intelligence System
