/**
 * Profit Aggregation Cloud Functions
 * 
 * Enterprise-grade scheduled aggregations for financial data
 * Runs on cron schedule - NEVER calculate on frontend
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {
  ProfitAggregate,
  CostByEngine,
  RevenueByPlan,
  ProfitByPlan,
  UsageLog
} from '../types/profit-intelligence.types';

const db = admin.firestore();

// ============================================
// CONFIGURATION
// ============================================

const BATCH_SIZE = 500; // Firestore batch write limit
const CALCULATION_TIMEOUT_MS = 540000; // 9 minutes (Cloud Functions limit: 9min)

// ============================================
// HELPER: DATE FORMATTING
// ============================================

function formatDateForPeriod(date: Date, type: 'daily' | 'monthly' | 'yearly'): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  switch (type) {
    case 'daily':
      return `daily_${year}_${month}_${day}`;
    case 'monthly':
      return `monthly_${year}_${month}`;
    case 'yearly':
      return `yearly_${year}`;
    default:
      return `period_${year}_${month}_${day}`;
  }
}

// ============================================
// CORE AGGREGATION LOGIC
// ============================================

/**
 * Aggregate financial data for a given time period
 * 
 * This function:
 * 1. Queries all usage_logs in period
 * 2. Aggregates cost, revenue, profit by engine/plan
 * 3. Calculates margins and identifies losses
 * 4. Writes to profit_aggregates collection
 * 
 * @param periodStart - Start of period (inclusive)
 * @param periodEnd - End of period (inclusive)
 * @param periodType - 'daily' | 'monthly' | 'yearly'
 */
async function aggregateFinancialData(
  periodStart: Date,
  periodEnd: Date,
  periodType: 'daily' | 'monthly' | 'yearly'
): Promise<ProfitAggregate> {
  const startTime = Date.now();
  console.log(`[AGGREGATION START] Type: ${periodType}, Period: ${periodStart.toISOString()} to ${periodEnd.toISOString()}`);

  // Query usage logs for period
  const usageLogsQuery = await db.collection('usage_logs')
    .where('created_at', '>=', periodStart)
    .where('created_at', '<=', periodEnd)
    .get();

  console.log(`[AGGREGATION] Found ${usageLogsQuery.size} usage logs`);

  // Initialize aggregate data structures
  let totalCost = 0;
  let totalRevenue = 0;
  let totalProfit = 0;
  
  const costByEngine: CostByEngine = {};
  const revenueByPlan: RevenueByPlan = {};
  const profitByPlan: ProfitByPlan = {};
  
  const uniqueUsers = new Set<string>();
  const lossUsers = new Set<string>();

  // Process each usage log
  for (const doc of usageLogsQuery.docs) {
    const log = doc.data() as UsageLog;

    // Aggregate totals
    totalCost += log.real_cost_usd || 0;
    totalRevenue += log.revenue_estimated_usd || 0;
    totalProfit += log.profit_usd || 0;

    // Track users
    uniqueUsers.add(log.user_id);
    if ((log.profit_usd || 0) < 0) {
      lossUsers.add(log.user_id);
    }

    // Aggregate by engine
    if (!costByEngine[log.engine_id]) {
      costByEngine[log.engine_id] = {
        cost_usd: 0,
        usage_count: 0,
        avg_cost_per_use: 0
      };
    }
    costByEngine[log.engine_id].cost_usd += log.real_cost_usd || 0;
    costByEngine[log.engine_id].usage_count += 1;

    // Aggregate by plan (revenue)
    if (!revenueByPlan[log.subscription_plan]) {
      revenueByPlan[log.subscription_plan] = {
        revenue_usd: 0,
        user_count: 0,
        generation_count: 0
      };
    }
    revenueByPlan[log.subscription_plan].revenue_usd += log.revenue_estimated_usd || 0;
    revenueByPlan[log.subscription_plan].generation_count += 1;

    // Aggregate by plan (profit)
    if (!profitByPlan[log.subscription_plan]) {
      profitByPlan[log.subscription_plan] = {
        profit_usd: 0,
        profit_margin_percent: 0,
        cost_usd: 0,
        revenue_usd: 0
      };
    }
    profitByPlan[log.subscription_plan].profit_usd += log.profit_usd || 0;
    profitByPlan[log.subscription_plan].cost_usd += log.real_cost_usd || 0;
    profitByPlan[log.subscription_plan].revenue_usd += log.revenue_estimated_usd || 0;
  }

  // Calculate average cost per use for each engine
  Object.keys(costByEngine).forEach(engineId => {
    const engine = costByEngine[engineId];
    engine.avg_cost_per_use = engine.usage_count > 0
      ? engine.cost_usd / engine.usage_count
      : 0;
    engine.avg_cost_per_use = Number(engine.avg_cost_per_use.toFixed(6));
  });

  // Calculate profit margin for each plan
  Object.keys(profitByPlan).forEach(planName => {
    const plan = profitByPlan[planName];
    plan.profit_margin_percent = plan.revenue_usd > 0
      ? (plan.profit_usd / plan.revenue_usd) * 100
      : 0;
    plan.profit_margin_percent = Number(plan.profit_margin_percent.toFixed(2));
  });

  // Count unique users per plan
  const usersByPlan = await db.collection('usage_logs')
    .where('created_at', '>=', periodStart)
    .where('created_at', '<=', periodEnd)
    .get();

  const planUserCounts: Record<string, Set<string>> = {};
  usersByPlan.docs.forEach(doc => {
    const log = doc.data() as UsageLog;
    if (!planUserCounts[log.subscription_plan]) {
      planUserCounts[log.subscription_plan] = new Set();
    }
    planUserCounts[log.subscription_plan].add(log.user_id);
  });

  Object.keys(planUserCounts).forEach(planName => {
    if (revenueByPlan[planName]) {
      revenueByPlan[planName].user_count = planUserCounts[planName].size;
    }
  });

  // Identify loss-making plans
  const lossPlans = Object.keys(profitByPlan)
    .filter(planName => profitByPlan[planName].profit_margin_percent < 0);

  // Find worst performing engine (highest cost)
  const worstEngine = Object.entries(costByEngine)
    .sort((a, b) => b[1].cost_usd - a[1].cost_usd)[0]?.[0];

  // Calculate overall profit margin
  const profitMargin = totalRevenue > 0
    ? (totalProfit / totalRevenue) * 100
    : 0;

  // Calculate per-user averages
  const userCount = uniqueUsers.size;
  const avgCostPerUser = userCount > 0 ? totalCost / userCount : 0;
  const avgRevenuePerUser = userCount > 0 ? totalRevenue / userCount : 0;

  // Calculate data completeness
  const logsWithFinancials = usageLogsQuery.docs.filter(doc => {
    const log = doc.data() as UsageLog;
    return log.real_cost_usd !== undefined && log.revenue_estimated_usd !== undefined;
  }).length;
  const dataCompleteness = usageLogsQuery.size > 0
    ? (logsWithFinancials / usageLogsQuery.size) * 100
    : 100;

  // Calculate execution time
  const calculationDuration = Date.now() - startTime;

  // Create profit aggregate document
  const periodId = formatDateForPeriod(periodStart, periodType);
  const aggregate: ProfitAggregate = {
    period_id: periodId,
    period_type: periodType,
    period_start: admin.firestore.Timestamp.fromDate(periodStart) as any,
    period_end: admin.firestore.Timestamp.fromDate(periodEnd) as any,

    total_cost_usd: Number(totalCost.toFixed(2)),
    total_revenue_usd: Number(totalRevenue.toFixed(2)),
    total_profit_usd: Number(totalProfit.toFixed(2)),
    profit_margin_percent: Number(profitMargin.toFixed(2)),

    cost_by_engine: costByEngine,
    revenue_by_plan: revenueByPlan,
    profit_by_plan: profitByPlan,

    loss_users_count: lossUsers.size,
    loss_plans: lossPlans,
    worst_performing_engine: worstEngine,

    total_generations: usageLogsQuery.size,
    total_users: userCount,
    avg_cost_per_user: Number(avgCostPerUser.toFixed(2)),
    avg_revenue_per_user: Number(avgRevenuePerUser.toFixed(2)),

    updated_at: admin.firestore.FieldValue.serverTimestamp() as any,
    calculation_duration_ms: calculationDuration,
    data_completeness_percent: Number(dataCompleteness.toFixed(2))
  };

  console.log(`[AGGREGATION COMPLETE] Period: ${periodId}`);
  console.log(`  - Total Cost: $${aggregate.total_cost_usd}`);
  console.log(`  - Total Revenue: $${aggregate.total_revenue_usd}`);
  console.log(`  - Total Profit: $${aggregate.total_profit_usd} (${aggregate.profit_margin_percent}%)`);
  console.log(`  - Generations: ${aggregate.total_generations}`);
  console.log(`  - Users: ${aggregate.total_users}`);
  console.log(`  - Loss Users: ${aggregate.loss_users_count}`);
  console.log(`  - Duration: ${calculationDuration}ms`);

  return aggregate;
}

// ============================================
// SCHEDULED FUNCTION: DAILY AGGREGATION
// ============================================

/**
 * Scheduled Cloud Function: Aggregate daily profit data
 * 
 * Schedule: Every day at 00:01 UTC
 * Cron: "1 0 * * *"
 * 
 * Aggregates previous day's financial data
 */
export const aggregateDailyProfit = functions
  .runWith({
    timeoutSeconds: 540, // 9 minutes
    memory: '2GB'
  })
  .pubsub
  .schedule('1 0 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('[DAILY AGGREGATION] Starting...');

    try {
      // Calculate yesterday's data
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const periodStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0);
      const periodEnd = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);

      // Run aggregation
      const aggregate = await aggregateFinancialData(periodStart, periodEnd, 'daily');

      // Write to Firestore
      await db.collection('profit_aggregates').doc(aggregate.period_id).set(aggregate);

      console.log(`[DAILY AGGREGATION] Success: ${aggregate.period_id}`);
      
      return { success: true, period: aggregate.period_id };
    } catch (error) {
      console.error('[DAILY AGGREGATION] Error:', error);
      throw error;
    }
  });

// ============================================
// SCHEDULED FUNCTION: MONTHLY AGGREGATION
// ============================================

/**
 * Scheduled Cloud Function: Aggregate monthly profit data
 * 
 * Schedule: 1st of every month at 01:00 UTC
 * Cron: "0 1 1 * *"
 * 
 * Aggregates previous month's financial data
 */
export const aggregateMonthlyProfit = functions
  .runWith({
    timeoutSeconds: 540, // 9 minutes
    memory: '4GB' // More memory for larger datasets
  })
  .pubsub
  .schedule('0 1 1 * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('[MONTHLY AGGREGATION] Starting...');

    try {
      // Calculate last month's data
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      
      const periodStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1, 0, 0, 0);
      const periodEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0, 23, 59, 59);

      // Run aggregation
      const aggregate = await aggregateFinancialData(periodStart, periodEnd, 'monthly');

      // Write to Firestore
      await db.collection('profit_aggregates').doc(aggregate.period_id).set(aggregate);

      console.log(`[MONTHLY AGGREGATION] Success: ${aggregate.period_id}`);
      
      return { success: true, period: aggregate.period_id };
    } catch (error) {
      console.error('[MONTHLY AGGREGATION] Error:', error);
      throw error;
    }
  });

// ============================================
// HTTP CALLABLE: MANUAL AGGREGATION
// ============================================

/**
 * Admin Function: Manually trigger aggregation for any period
 * 
 * Security: Super Admin only
 */
export const triggerManualAggregation = functions.https.onCall(async (data, context) => {
  // Authentication & authorization
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  const userRole = userDoc.data()?.role;

  if (userRole !== 'super_admin') {
    throw new functions.https.HttpsError('permission-denied', 'Super Admin only');
  }

  const { period_start, period_end, period_type } = data;

  if (!period_start || !period_end || !period_type) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  try {
    const startDate = new Date(period_start);
    const endDate = new Date(period_end);

    console.log(`[MANUAL AGGREGATION] Triggered by ${context.auth.uid}`);
    console.log(`  Period: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    const aggregate = await aggregateFinancialData(startDate, endDate, period_type);

    // Write to Firestore
    await db.collection('profit_aggregates').doc(aggregate.period_id).set(aggregate);

    return {
      success: true,
      data: aggregate
    };
  } catch (error: any) {
    console.error('[MANUAL AGGREGATION] Error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================
// HTTP CALLABLE: GET AGGREGATED DATA
// ============================================

/**
 * Admin Function: Fetch aggregated profit data
 * 
 * Security: Super Admin only
 */
export const getProfitAggregates = functions.https.onCall(async (data, context) => {
  // Authentication & authorization
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  const userRole = userDoc.data()?.role;

  if (userRole !== 'super_admin') {
    throw new functions.https.HttpsError('permission-denied', 'Super Admin only');
  }

  const { period_type, limit = 30 } = data;

  try {
    let query = db.collection('profit_aggregates')
      .orderBy('period_start', 'desc')
      .limit(limit);

    if (period_type) {
      query = query.where('period_type', '==', period_type);
    }

    const snapshot = await query.get();
    const aggregates = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      success: true,
      data: aggregates,
      count: aggregates.length
    };
  } catch (error: any) {
    console.error('[GET AGGREGATES] Error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================
// EXPORTS
// ============================================

export {
  aggregateFinancialData,
  formatDateForPeriod
};
