/**
 * Profit & Cost Intelligence System - Cloud Functions
 * 
 * Enterprise-grade financial tracking for AI SaaS platform
 * NO CLIENT-SIDE CALCULATIONS - All financial logic server-side
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {
  AIEngineCost,
  UsageLog,
  CostCalculationInput,
  CostCalculationResult,
  RevenueAllocationInput,
  RevenueAllocationResult,
  SubscriptionPlan,
  ProfitAuditLog
} from '../types/profit-intelligence.types';

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ============================================
// IN-MEMORY COST CACHE
// ============================================

interface CostCacheEntry {
  cost: AIEngineCost;
  cached_at: number;
}

const costCache = new Map<string, CostCacheEntry>();
const COST_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get engine cost from cache or Firestore
 * Performance optimization: Reduces Firestore reads
 */
async function getEngineCost(engineId: string): Promise<AIEngineCost | null> {
  // Check cache first
  const cached = costCache.get(engineId);
  if (cached && (Date.now() - cached.cached_at < COST_CACHE_TTL_MS)) {
    console.log(`[CACHE HIT] Engine cost for ${engineId}`);
    return cached.cost;
  }

  // Fetch from Firestore
  try {
    const doc = await db.collection('ai_engine_costs').doc(engineId).get();
    
    if (!doc.exists || !doc.data()?.is_active) {
      console.error(`[ERROR] Engine cost not found or inactive: ${engineId}`);
      return null;
    }

    const cost = doc.data() as AIEngineCost;
    
    // Update cache
    costCache.set(engineId, {
      cost,
      cached_at: Date.now()
    });

    console.log(`[CACHE MISS] Fetched engine cost for ${engineId}: $${cost.cost_per_unit}`);
    return cost;
  } catch (error) {
    console.error(`[ERROR] Failed to fetch engine cost for ${engineId}:`, error);
    return null;
  }
}

// ============================================
// SUBSCRIPTION PLAN PRICING
// ============================================

const PLAN_PRICING: Record<string, number> = {
  'free': 0,
  'pro': 29.99,
  'ultra': 99.99,
  'enterprise': 299.99
};

/**
 * Get monthly revenue for a subscription plan
 */
function getPlanMonthlyPrice(planName: string): number {
  return PLAN_PRICING[planName.toLowerCase()] || 0;
}

// ============================================
// CORE CALCULATION: COST
// ============================================

/**
 * Calculate real AI cost for a generation request
 * 
 * Formula: cost_per_unit * usage_units
 * 
 * @returns Cost in USD
 */
export async function calculateUsageCost(
  input: CostCalculationInput
): Promise<number> {
  const { engine_id, usage_units } = input;

  // Fetch engine cost configuration
  const engineCost = await getEngineCost(engine_id);
  
  if (!engineCost) {
    console.error(`[COST ERROR] Cannot calculate cost - engine ${engine_id} not found`);
    return 0; // Failsafe: Don't block user generation
  }

  // Calculate real cost
  const realCost = engineCost.cost_per_unit * usage_units;

  console.log(`[COST CALC] Engine: ${engine_id}, Units: ${usage_units}, Cost: $${realCost.toFixed(4)}`);
  
  return Number(realCost.toFixed(6)); // Round to 6 decimals
}

// ============================================
// CORE CALCULATION: REVENUE
// ============================================

/**
 * Calculate allocated revenue for this generation
 * 
 * Revenue Attribution Logic:
 * 1. Get user's monthly plan price
 * 2. Get user's total usage this month
 * 3. Allocate revenue proportionally to this request
 * 
 * Formula: (plan_price / total_monthly_usage) * current_usage_units
 * 
 * @returns Revenue in USD
 */
export async function calculateUsageRevenue(
  input: RevenueAllocationInput
): Promise<RevenueAllocationResult> {
  const { user_id, subscription_plan, usage_units } = input;

  const planPrice = getPlanMonthlyPrice(subscription_plan);
  
  if (planPrice === 0) {
    // Free plan users generate no revenue
    return {
      allocated_revenue_usd: 0,
      plan_monthly_price: 0,
      user_usage_percentage: 0
    };
  }

  // Get user's total usage this month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const usageSnapshot = await db.collection('usage_logs')
    .where('user_id', '==', user_id)
    .where('created_at', '>=', monthStart)
    .get();

  const totalMonthlyUsage = usageSnapshot.docs.reduce(
    (sum, doc) => sum + (doc.data().usage_units || 0),
    0
  );

  // Prevent division by zero
  const safeTotalUsage = Math.max(totalMonthlyUsage, usage_units);

  // Allocate revenue proportionally
  const allocatedRevenue = (planPrice / safeTotalUsage) * usage_units;
  const usagePercentage = (usage_units / safeTotalUsage) * 100;

  console.log(`[REVENUE CALC] User: ${user_id}, Plan: ${subscription_plan} ($${planPrice}), Allocated: $${allocatedRevenue.toFixed(4)}`);

  return {
    allocated_revenue_usd: Number(allocatedRevenue.toFixed(6)),
    plan_monthly_price: planPrice,
    user_usage_percentage: Number(usagePercentage.toFixed(2))
  };
}

// ============================================
// CORE CALCULATION: PROFIT
// ============================================

/**
 * Calculate profit for a generation request
 * 
 * Formula: profit = revenue - cost
 * Margin: (profit / revenue) * 100
 * 
 * @returns Complete financial calculation
 */
export async function calculateProfit(
  input: CostCalculationInput
): Promise<CostCalculationResult> {
  // Calculate cost
  const realCost = await calculateUsageCost(input);

  // Calculate revenue
  const revenueResult = await calculateUsageRevenue({
    user_id: input.user_id,
    subscription_plan: input.subscription_plan,
    usage_units: input.usage_units,
    ai_type: 'image' // Will be passed from input in production
  });

  // Calculate profit
  const profit = revenueResult.allocated_revenue_usd - realCost;
  const profitMargin = revenueResult.allocated_revenue_usd > 0
    ? (profit / revenueResult.allocated_revenue_usd) * 100
    : 0;

  // Get engine cost for metadata
  const engineCost = await getEngineCost(input.engine_id);

  console.log(`[PROFIT CALC] Revenue: $${revenueResult.allocated_revenue_usd}, Cost: $${realCost}, Profit: $${profit} (${profitMargin.toFixed(2)}%)`);

  return {
    real_cost_usd: realCost,
    revenue_estimated_usd: revenueResult.allocated_revenue_usd,
    profit_usd: Number(profit.toFixed(6)),
    profit_margin_percent: Number(profitMargin.toFixed(2)),
    pricing_source: 'plan_override', // or 'engine_default'
    engine_cost_per_unit: engineCost?.cost_per_unit || 0
  };
}

// ============================================
// FIRESTORE TRIGGER: LOG USAGE WITH FINANCIALS
// ============================================

/**
 * Firestore Trigger: When a generation is created, calculate and log financials
 * 
 * Triggered on: /generations/{generationId} creation
 * 
 * This function:
 * 1. Fetches engine cost
 * 2. Calculates cost, revenue, profit
 * 3. Writes to usage_logs with financial data
 */
export const onGenerationCreated = functions.firestore
  .document('generations/{generationId}')
  .onCreate(async (snap, context) => {
    const generation = snap.data();
    const generationId = context.params.generationId;

    console.log(`[GENERATION CREATED] ID: ${generationId}`);

    try {
      // Extract generation data
      const userId = generation.user_id;
      const engineId = generation.engine_id || generation.model || 'unknown';
      const usageUnits = generation.usage_units || 1; // Images, seconds, tokens
      const subscriptionPlan = generation.subscription_plan || 'free';
      const creditsUsed = generation.credits_used || 0;
      const aiType = generation.ai_type || 'image';

      // Calculate complete financials
      const financials = await calculateProfit({
        engine_id: engineId,
        usage_units: usageUnits,
        user_id: userId,
        subscription_plan: subscriptionPlan
      });

      // Create usage log with financial data
      const usageLog: UsageLog = {
        user_id: userId,
        subscription_plan: subscriptionPlan,
        ai_type: aiType,
        engine_id: engineId,
        usage_units: usageUnits,
        credits_used: creditsUsed,
        created_at: admin.firestore.FieldValue.serverTimestamp() as any,

        // Financial metrics
        real_cost_usd: financials.real_cost_usd,
        revenue_estimated_usd: financials.revenue_estimated_usd,
        profit_usd: financials.profit_usd,
        profit_margin_percent: financials.profit_margin_percent,
        pricing_source: financials.pricing_source,

        // Metadata
        request_id: generationId,
        country_code: generation.country_code,
        device_type: generation.device_type || 'web',
        generation_time_ms: generation.generation_time_ms
      };

      // Write to usage_logs
      await db.collection('usage_logs').add(usageLog);

      console.log(`[USAGE LOGGED] User: ${userId}, Cost: $${financials.real_cost_usd}, Profit: $${financials.profit_usd}`);

      // Check for loss user (immediate detection)
      if (financials.profit_usd < 0) {
        console.warn(`[LOSS DETECTED] User ${userId} generated negative profit: $${financials.profit_usd}`);
        // Trigger loss detection (separate function handles this)
      }

    } catch (error) {
      console.error(`[ERROR] Failed to log usage for generation ${generationId}:`, error);
      // Don't throw - generation should still succeed
    }
  });

// ============================================
// HTTP CALLABLE: GET REAL-TIME COST ESTIMATE
// ============================================

/**
 * HTTP Callable Function: Get cost estimate before generation
 * 
 * Allows frontend to show users estimated cost
 * (Display only - actual cost calculated server-side)
 */
export const getCostEstimate = functions.https.onCall(async (data, context) => {
  // Authentication check
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { engine_id, usage_units } = data;

  if (!engine_id || !usage_units) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing engine_id or usage_units');
  }

  try {
    const engineCost = await getEngineCost(engine_id);
    
    if (!engineCost) {
      throw new functions.https.HttpsError('not-found', `Engine ${engine_id} not found`);
    }

    const estimatedCost = engineCost.cost_per_unit * usage_units;

    return {
      success: true,
      data: {
        engine_id,
        usage_units,
        cost_per_unit: engineCost.cost_per_unit,
        estimated_cost_usd: Number(estimatedCost.toFixed(4)),
        unit_type: engineCost.unit_type
      }
    };
  } catch (error: any) {
    console.error('[ERROR] Cost estimate failed:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================
// ADMIN: UPDATE ENGINE COST
// ============================================

/**
 * Admin Function: Update engine cost with audit logging
 * 
 * Security: Super Admin only
 */
export const updateEngineCost = functions.https.onCall(async (data, context) => {
  // Authentication & authorization
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  // Check super_admin role
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  const userRole = userDoc.data()?.role;

  if (userRole !== 'super_admin') {
    throw new functions.https.HttpsError('permission-denied', 'Super Admin only');
  }

  const { engine_id, cost_per_unit, reason } = data;

  if (!engine_id || cost_per_unit === undefined) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  try {
    const engineRef = db.collection('ai_engine_costs').doc(engine_id);
    const engineDoc = await engineRef.get();

    const oldValue = engineDoc.exists ? engineDoc.data() : null;

    // Update cost
    await engineRef.set({
      ...oldValue,
      cost_per_unit,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_by: context.auth.uid
    }, { merge: true });

    // Clear cache
    costCache.delete(engine_id);

    // Audit log
    const auditLog: ProfitAuditLog = {
      action_type: 'cost_updated',
      entity_type: 'engine',
      entity_id: engine_id,
      before_value: oldValue?.cost_per_unit,
      after_value: cost_per_unit,
      changed_by: context.auth.uid,
      changed_at: admin.firestore.FieldValue.serverTimestamp() as any,
      reason
    };

    await db.collection('profit_audit_log').add(auditLog);

    console.log(`[ADMIN] Engine cost updated: ${engine_id} -> $${cost_per_unit}`);

    return {
      success: true,
      message: `Engine ${engine_id} cost updated to $${cost_per_unit}`
    };
  } catch (error: any) {
    console.error('[ERROR] Failed to update engine cost:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================
// EXPORTS
// ============================================

export {
  getEngineCost,
  calculateUsageCost,
  calculateUsageRevenue,
  calculateProfit
};
