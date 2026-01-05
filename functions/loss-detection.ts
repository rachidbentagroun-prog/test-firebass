/**
 * Loss Detection & Alert System
 * 
 * Enterprise-grade loss detection for unprofitable users & plans
 * Runs hourly to identify negative margins
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {
  LossUser,
  UsageLog,
  ProfitAuditLog
} from '../types/profit-intelligence.types';

const db = admin.firestore();

// ============================================
// CONFIGURATION
// ============================================

const LOSS_DETECTION_PERIOD_DAYS = 30; // Analyze last 30 days
const LOSS_THRESHOLD_PERCENT = -10; // Flag users with <-10% margin
const ALERT_COOLDOWN_HOURS = 24; // Don't spam alerts

// ============================================
// CORE LOSS DETECTION LOGIC
// ============================================

/**
 * Analyze user's financial performance over last N days
 * 
 * @param userId - User to analyze
 * @returns Loss user data if unprofitable, null otherwise
 */
async function analyzeUserProfitability(userId: string): Promise<LossUser | null> {
  // Calculate date range (last 30 days)
  const now = new Date();
  const periodStart = new Date(now);
  periodStart.setDate(periodStart.getDate() - LOSS_DETECTION_PERIOD_DAYS);

  // Query user's usage logs
  const usageSnapshot = await db.collection('usage_logs')
    .where('user_id', '==', userId)
    .where('created_at', '>=', periodStart)
    .get();

  if (usageSnapshot.empty) {
    return null; // No usage in period
  }

  // Aggregate financial metrics
  let totalCost = 0;
  let totalRevenue = 0;
  let totalProfit = 0;
  let totalGenerations = 0;

  const engineUsage: Record<string, { cost: number; count: number }> = {};
  let subscriptionPlan = 'unknown';
  let userEmail = '';

  for (const doc of usageSnapshot.docs) {
    const log = doc.data() as UsageLog;

    totalCost += log.real_cost_usd || 0;
    totalRevenue += log.revenue_estimated_usd || 0;
    totalProfit += log.profit_usd || 0;
    totalGenerations += 1;

    subscriptionPlan = log.subscription_plan;

    // Track engine usage
    if (!engineUsage[log.engine_id]) {
      engineUsage[log.engine_id] = { cost: 0, count: 0 };
    }
    engineUsage[log.engine_id].cost += log.real_cost_usd || 0;
    engineUsage[log.engine_id].count += 1;
  }

  // Calculate profit margin
  const profitMargin = totalRevenue > 0
    ? (totalProfit / totalRevenue) * 100
    : -100; // No revenue = 100% loss

  // Check if user is unprofitable
  if (profitMargin >= LOSS_THRESHOLD_PERCENT) {
    return null; // User is profitable or within acceptable margin
  }

  // Get user email
  const userDoc = await db.collection('users').doc(userId).get();
  if (userDoc.exists) {
    userEmail = userDoc.data()?.email || 'unknown@example.com';
  }

  // Find most used and most expensive engines
  const engineEntries = Object.entries(engineUsage);
  const mostUsedEngine = engineEntries
    .sort((a, b) => b[1].count - a[1].count)[0]?.[0] || 'unknown';
  const mostExpensiveEngine = engineEntries
    .sort((a, b) => b[1].cost - a[1].cost)[0]?.[0] || 'unknown';

  // Check if user already in loss_users collection
  const existingLossDoc = await db.collection('loss_users').doc(userId).get();
  const daysInLoss = existingLossDoc.exists
    ? (existingLossDoc.data()?.days_in_loss || 0) + 1
    : 1;

  // Create loss user object
  const lossUser: LossUser = {
    user_id: userId,
    email: userEmail,
    subscription_plan: subscriptionPlan,

    total_cost_usd: Number(totalCost.toFixed(2)),
    total_revenue_usd: Number(totalRevenue.toFixed(2)),
    total_profit_usd: Number(totalProfit.toFixed(2)),
    profit_margin_percent: Number(profitMargin.toFixed(2)),

    total_generations: totalGenerations,
    most_used_engine: mostUsedEngine,
    most_expensive_engine: mostExpensiveEngine,

    detected_at: existingLossDoc.exists
      ? existingLossDoc.data()!.detected_at
      : admin.firestore.FieldValue.serverTimestamp() as any,
    last_checked_at: admin.firestore.FieldValue.serverTimestamp() as any,
    days_in_loss: daysInLoss,

    alert_sent: false,
    notes: `Loss detected: ${profitMargin.toFixed(2)}% margin over ${LOSS_DETECTION_PERIOD_DAYS} days`
  };

  console.log(`[LOSS DETECTED] User ${userId} (${userEmail}): ${profitMargin.toFixed(2)}% margin, $${totalProfit.toFixed(2)} loss`);

  return lossUser;
}

// ============================================
// SCHEDULED FUNCTION: HOURLY LOSS DETECTION
// ============================================

/**
 * Scheduled Cloud Function: Detect loss-making users
 * 
 * Schedule: Every hour
 * Cron: "0 * * * *"
 * 
 * Scans active users and identifies unprofitable accounts
 */
export const detectLossUsers = functions
  .runWith({
    timeoutSeconds: 540, // 9 minutes
    memory: '2GB'
  })
  .pubsub
  .schedule('0 * * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('[LOSS DETECTION] Starting hourly scan...');

    try {
      // Get list of active users (users with generations in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - LOSS_DETECTION_PERIOD_DAYS);

      const recentUsageSnapshot = await db.collection('usage_logs')
        .where('created_at', '>=', thirtyDaysAgo)
        .get();

      // Get unique user IDs
      const activeUserIds = new Set<string>();
      recentUsageSnapshot.docs.forEach(doc => {
        activeUserIds.add(doc.data().user_id);
      });

      console.log(`[LOSS DETECTION] Scanning ${activeUserIds.size} active users`);

      let lossUsersDetected = 0;
      let profitableUsers = 0;

      const batch = db.batch();
      let batchCount = 0;

      // Analyze each user
      for (const userId of activeUserIds) {
        const lossUser = await analyzeUserProfitability(userId);

        if (lossUser) {
          // Write to loss_users collection
          const lossUserRef = db.collection('loss_users').doc(userId);
          batch.set(lossUserRef, lossUser, { merge: true });
          batchCount++;
          lossUsersDetected++;

          // Commit batch if limit reached
          if (batchCount >= 500) {
            await batch.commit();
            batchCount = 0;
          }
        } else {
          profitableUsers++;

          // Remove from loss_users if they've recovered
          const existingLossDoc = await db.collection('loss_users').doc(userId).get();
          if (existingLossDoc.exists) {
            console.log(`[LOSS RECOVERED] User ${userId} is now profitable - removing from loss list`);
            batch.delete(existingLossDoc.ref);
            batchCount++;
          }
        }
      }

      // Commit remaining batch
      if (batchCount > 0) {
        await batch.commit();
      }

      console.log(`[LOSS DETECTION] Complete:`);
      console.log(`  - Loss users: ${lossUsersDetected}`);
      console.log(`  - Profitable users: ${profitableUsers}`);

      return {
        success: true,
        loss_users: lossUsersDetected,
        profitable_users: profitableUsers
      };

    } catch (error) {
      console.error('[LOSS DETECTION] Error:', error);
      throw error;
    }
  });

// ============================================
// LOSS ALERT SYSTEM
// ============================================

/**
 * Send alert when new loss user is detected
 * 
 * Triggered by: loss_users collection writes
 */
export const onLossUserDetected = functions.firestore
  .document('loss_users/{userId}')
  .onWrite(async (change, context) => {
    const userId = context.params.userId;

    // Only trigger on new loss users or significant changes
    if (!change.after.exists) {
      return; // User recovered (deleted from collection)
    }

    const lossUser = change.after.data() as LossUser;
    const wasAlreadyLoss = change.before.exists;

    // Check if alert already sent recently
    if (lossUser.alert_sent) {
      const alertSentAt = lossUser.alert_sent_at as any;
      if (alertSentAt) {
        const hoursSinceAlert = (Date.now() - alertSentAt.toMillis()) / (1000 * 60 * 60);
        if (hoursSinceAlert < ALERT_COOLDOWN_HOURS) {
          console.log(`[ALERT COOLDOWN] Skipping alert for ${userId} (sent ${hoursSinceAlert.toFixed(1)}h ago)`);
          return;
        }
      }
    }

    // Determine severity
    const severity = lossUser.profit_margin_percent < -50 ? 'CRITICAL' :
                    lossUser.profit_margin_percent < -25 ? 'HIGH' :
                    'MEDIUM';

    console.log(`[LOSS ALERT] ${severity} - User ${userId}: ${lossUser.profit_margin_percent}% margin`);

    // Create alert log
    const alertLog = {
      alert_type: 'loss_user_detected',
      severity,
      user_id: userId,
      email: lossUser.email,
      subscription_plan: lossUser.subscription_plan,
      profit_margin_percent: lossUser.profit_margin_percent,
      total_profit_usd: lossUser.total_profit_usd,
      days_in_loss: lossUser.days_in_loss,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      requires_action: severity === 'CRITICAL'
    };

    await db.collection('admin_alerts').add(alertLog);

    // Update loss_users document
    await change.after.ref.update({
      alert_sent: true,
      alert_sent_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // TODO: Send email/Slack notification to admins
    // await sendAdminNotification(alertLog);

    console.log(`[ALERT SENT] Loss alert created for user ${userId}`);
  });

// ============================================
// HTTP CALLABLE: GET LOSS USERS
// ============================================

/**
 * Admin Function: Fetch all loss-making users
 * 
 * Security: Super Admin only
 */
export const getLossUsers = functions.https.onCall(async (data, context) => {
  // Authentication & authorization
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  const userRole = userDoc.data()?.role;

  if (userRole !== 'super_admin') {
    throw new functions.https.HttpsError('permission-denied', 'Super Admin only');
  }

  const { limit = 100, sort_by = 'profit_margin_percent' } = data;

  try {
    const snapshot = await db.collection('loss_users')
      .orderBy(sort_by, 'asc')
      .limit(limit)
      .get();

    const lossUsers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate summary stats
    const totalLoss = lossUsers.reduce((sum, user: any) => sum + (user.total_profit_usd || 0), 0);
    const avgMargin = lossUsers.length > 0
      ? lossUsers.reduce((sum, user: any) => sum + (user.profit_margin_percent || 0), 0) / lossUsers.length
      : 0;

    return {
      success: true,
      data: lossUsers,
      count: lossUsers.length,
      summary: {
        total_loss_usd: Number(totalLoss.toFixed(2)),
        avg_margin_percent: Number(avgMargin.toFixed(2)),
        critical_users: lossUsers.filter((u: any) => u.profit_margin_percent < -50).length
      }
    };
  } catch (error: any) {
    console.error('[GET LOSS USERS] Error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================
// HTTP CALLABLE: TAKE ACTION ON LOSS USER
// ============================================

/**
 * Admin Function: Take action on loss-making user
 * 
 * Actions: rate_limited, plan_upgraded, monitored, account_suspended
 * Security: Super Admin only
 */
export const takeLossUserAction = functions.https.onCall(async (data, context) => {
  // Authentication & authorization
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  const userRole = userDoc.data()?.role;

  if (userRole !== 'super_admin') {
    throw new functions.https.HttpsError('permission-denied', 'Super Admin only');
  }

  const { user_id, action, notes } = data;

  if (!user_id || !action) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing user_id or action');
  }

  const validActions = ['rate_limited', 'plan_upgraded', 'monitored', 'account_suspended'];
  if (!validActions.includes(action)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid action');
  }

  try {
    const lossUserRef = db.collection('loss_users').doc(user_id);
    const lossUserDoc = await lossUserRef.get();

    if (!lossUserDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Loss user not found');
    }

    // Update loss_users document
    await lossUserRef.update({
      action_taken: action,
      notes: notes || `Action taken: ${action}`,
      last_checked_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create audit log
    const auditLog: ProfitAuditLog = {
      action_type: 'user_flagged',
      entity_type: 'user',
      entity_id: user_id,
      after_value: { action, notes },
      changed_by: context.auth.uid,
      changed_at: admin.firestore.FieldValue.serverTimestamp() as any,
      reason: `Loss user action: ${action}`
    };

    await db.collection('profit_audit_log').add(auditLog);

    console.log(`[LOSS ACTION] Admin ${context.auth.uid} took action "${action}" on user ${user_id}`);

    return {
      success: true,
      message: `Action "${action}" applied to user ${user_id}`
    };
  } catch (error: any) {
    console.error('[LOSS ACTION] Error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================
// DETECT LOSS-MAKING PLANS
// ============================================

/**
 * Analyze which subscription plans have negative margins
 * 
 * Runs as part of aggregation or on-demand
 */
export async function detectLossPlans(periodDays: number = 30): Promise<Array<{
  plan_name: string;
  profit_margin_percent: number;
  total_profit_usd: number;
  user_count: number;
}>> {
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - periodDays);

  // Aggregate by plan
  const usageSnapshot = await db.collection('usage_logs')
    .where('created_at', '>=', periodStart)
    .get();

  const planMetrics: Record<string, {
    cost: number;
    revenue: number;
    profit: number;
    users: Set<string>;
  }> = {};

  usageSnapshot.docs.forEach(doc => {
    const log = doc.data() as UsageLog;
    const plan = log.subscription_plan;

    if (!planMetrics[plan]) {
      planMetrics[plan] = {
        cost: 0,
        revenue: 0,
        profit: 0,
        users: new Set()
      };
    }

    planMetrics[plan].cost += log.real_cost_usd || 0;
    planMetrics[plan].revenue += log.revenue_estimated_usd || 0;
    planMetrics[plan].profit += log.profit_usd || 0;
    planMetrics[plan].users.add(log.user_id);
  });

  // Find loss-making plans
  const lossPlans = Object.entries(planMetrics)
    .map(([plan_name, metrics]) => ({
      plan_name,
      profit_margin_percent: metrics.revenue > 0
        ? (metrics.profit / metrics.revenue) * 100
        : -100,
      total_profit_usd: metrics.profit,
      user_count: metrics.users.size
    }))
    .filter(plan => plan.profit_margin_percent < 0)
    .sort((a, b) => a.profit_margin_percent - b.profit_margin_percent);

  console.log(`[LOSS PLANS] Detected ${lossPlans.length} loss-making plans:`);
  lossPlans.forEach(plan => {
    console.log(`  - ${plan.plan_name}: ${plan.profit_margin_percent.toFixed(2)}% margin, $${plan.total_profit_usd.toFixed(2)} loss`);
  });

  return lossPlans;
}

// ============================================
// EXPORTS
// ============================================

export {
  analyzeUserProfitability,
  LOSS_DETECTION_PERIOD_DAYS,
  LOSS_THRESHOLD_PERCENT
};
