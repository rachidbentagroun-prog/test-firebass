/**
 * Firebase Cloud Functions - Main Index
 * 
 * Exports all Profit Intelligence System functions
 */

// Profit Intelligence - Real-time cost tracking
export {
  onGenerationCreated,
  getCostEstimate,
  updateEngineCost
} from './profit-intelligence';

// Profit Aggregation - Scheduled financial summaries
export {
  aggregateDailyProfit,
  aggregateMonthlyProfit,
  triggerManualAggregation,
  getProfitAggregates
} from './profit-aggregation';

// Loss Detection - Unprofitable user identification
export {
  detectLossUsers,
  onLossUserDetected,
  getLossUsers,
  takeLossUserAction
} from './loss-detection';

/**
 * DEPLOYMENT CHECKLIST:
 * 
 * 1. Install dependencies:
 *    cd functions && npm install
 * 
 * 2. Initialize system:
 *    node scripts/init-profit-system.js
 * 
 * 3. Create Firestore indexes:
 *    - usage_logs: user_id (ASC) + created_at (DESC)
 *    - usage_logs: subscription_plan (ASC) + created_at (DESC)
 *    - usage_logs: engine_id (ASC) + created_at (DESC)
 *    - profit_aggregates: period_type (ASC) + period_start (DESC)
 *    - loss_users: subscription_plan (ASC) + profit_margin_percent (ASC)
 * 
 * 4. Enable TTL:
 *    gcloud firestore fields ttls update created_at \
 *      --collection-group=usage_logs --enable-ttl
 * 
 * 5. Deploy functions:
 *    firebase deploy --only functions
 * 
 * 6. Deploy security rules:
 *    firebase deploy --only firestore:rules
 * 
 * 7. Grant super_admin role:
 *    firebase firestore:set users/ADMIN_UID --data '{"role":"super_admin"}'
 * 
 * 8. Test integration:
 *    - Generate AI content
 *    - Check usage_logs for financial data
 *    - Verify aggregations run
 *    - Access admin dashboard
 */

/**
 * SCHEDULED FUNCTION OVERVIEW:
 * 
 * aggregateDailyProfit:
 *   - Schedule: 1 0 * * * (00:01 UTC daily)
 *   - Purpose: Aggregate previous day's financials
 *   - Duration: ~30s - 2min (depending on volume)
 * 
 * aggregateMonthlyProfit:
 *   - Schedule: 0 1 1 * * (01:00 UTC on 1st of month)
 *   - Purpose: Aggregate previous month's financials
 *   - Duration: ~1min - 5min (depending on volume)
 * 
 * detectLossUsers:
 *   - Schedule: 0 * * * * (Every hour)
 *   - Purpose: Scan for unprofitable users
 *   - Duration: ~30s - 2min (depending on active users)
 */

/**
 * HTTP CALLABLE FUNCTIONS:
 * 
 * getCostEstimate(engine_id, usage_units):
 *   - Public (authenticated users)
 *   - Returns estimated cost before generation
 * 
 * updateEngineCost(engine_id, cost_per_unit, reason):
 *   - Super Admin only
 *   - Updates AI engine pricing
 *   - Audit logged
 * 
 * triggerManualAggregation(period_start, period_end, period_type):
 *   - Super Admin only
 *   - Manually trigger aggregation for any period
 * 
 * getProfitAggregates(period_type, limit):
 *   - Super Admin only
 *   - Fetch aggregated financial data
 * 
 * getLossUsers(limit, sort_by):
 *   - Super Admin only
 *   - Fetch unprofitable users
 * 
 * takeLossUserAction(user_id, action, notes):
 *   - Super Admin only
 *   - Apply action to loss user
 *   - Actions: rate_limited, plan_upgraded, monitored, account_suspended
 */

/**
 * FIRESTORE TRIGGERS:
 * 
 * onGenerationCreated:
 *   - Trigger: onCreate /generations/{generationId}
 *   - Purpose: Calculate & log financial data
 *   - Critical: Must have engine_id, usage_units, subscription_plan
 * 
 * onLossUserDetected:
 *   - Trigger: onWrite /loss_users/{userId}
 *   - Purpose: Send alerts when loss users detected
 *   - Creates admin_alerts entries
 */
