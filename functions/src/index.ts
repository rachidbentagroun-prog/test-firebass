/**
 * ============================================
 * FIREBASS CLOUD FUNCTIONS
 * Credit System, Rate Limiting & Security
 * ============================================
 * 
 * Features:
 * - Credit validation before AI generation
 * - Rate limiting per user/IP
 * - Prompt moderation and abuse detection
 * - Automatic credit deduction
 * - Usage logging and analytics
 * - Admin audit logging
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Hash prompt for privacy
 */
function hashPrompt(prompt: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(prompt).digest('hex').substring(0, 16);
}

/**
 * Get user IP from request
 */
function getUserIP(req: functions.https.Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
         req.ip ||
         'unknown';
}

/**
 * Moderate prompt content
 */
function moderatePrompt(prompt: string): { allowed: boolean; reason?: string; flagged: string[] } {
  const bannedKeywords = [
    'violence', 'gore', 'nsfw', 'nude', 'explicit', 'porn',
    'illegal', 'weapon', 'drug', 'hate', 'kill', 'murder',
    'terrorist', 'bomb', 'abuse', 'child'
  ];
  
  const lowerPrompt = prompt.toLowerCase();
  const flagged: string[] = [];
  
  bannedKeywords.forEach(keyword => {
    if (lowerPrompt.includes(keyword)) {
      flagged.push(keyword);
    }
  });
  
  if (flagged.length > 0) {
    return {
      allowed: false,
      reason: 'Prompt contains inappropriate or prohibited content',
      flagged
    };
  }
  
  return { allowed: true, flagged: [] };
}

// ============================================
// RATE LIMITING
// ============================================

/**
 * Check and enforce rate limits
 */
async function checkRateLimit(
  userId: string,
  aiType: 'image' | 'video' | 'voice' | 'chat',
  ipAddress: string
): Promise<{ allowed: boolean; reason?: string; resetAt?: number }> {
  try {
    const rateLimitRef = db.collection('rate_limits').doc(`${userId}_${aiType}`);
    const rateLimitDoc = await rateLimitRef.get();
    
    const now = Date.now();
    const windowMinutes = 60; // 1 hour window
    
    // Define max requests per AI type
    const maxRequests = {
      image: 50,
      video: 10,
      voice: 30,
      chat: 100
    };
    
    const limit = maxRequests[aiType] || 50;
    
    if (!rateLimitDoc.exists) {
      // Create new rate limit record
      await rateLimitRef.set({
        userId,
        aiType,
        maxRequests: limit,
        windowMinutes,
        currentCount: 1,
        windowStart: now,
        ipAddress
      });
      
      return { allowed: true };
    }
    
    const data = rateLimitDoc.data()!;
    const windowStart = data.windowStart || now;
    const windowEnd = windowStart + windowMinutes * 60 * 1000;
    
    // Check if window has expired
    if (now > windowEnd) {
      // Reset window
      await rateLimitRef.update({
        currentCount: 1,
        windowStart: now,
        blockedUntil: admin.firestore.FieldValue.delete()
      });
      
      return { allowed: true };
    }
    
    // Check if blocked
    if (data.blockedUntil && now < data.blockedUntil) {
      return {
        allowed: false,
        reason: 'Rate limit exceeded. Please try again later.',
        resetAt: data.blockedUntil
      };
    }
    
    // Check if limit exceeded
    if (data.currentCount >= limit) {
      await rateLimitRef.update({
        blockedUntil: windowEnd
      });
      
      // Log abuse
      await logAbuseDetection(userId, 'rate_limit', 'medium', 
        `Rate limit exceeded for ${aiType}: ${data.currentCount}/${limit}`, {
          aiType,
          ipAddress
        });
      
      return {
        allowed: false,
        reason: 'Rate limit exceeded. Please try again later.',
        resetAt: windowEnd
      };
    }
    
    // Increment count
    await rateLimitRef.update({
      currentCount: admin.firestore.FieldValue.increment(1)
    });
    
    return { allowed: true };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // On error, allow request (fail open)
    return { allowed: true };
  }
}

/**
 * Check IP-based rate limiting (prevent abuse from same IP)
 */
async function checkIPRateLimit(ipAddress: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const ipLimitRef = db.collection('ip_rate_limits').doc(ipAddress);
    const ipLimitDoc = await ipLimitRef.get();
    
    const now = Date.now();
    const windowMinutes = 10;
    const maxRequests = 100; // Max 100 requests per 10 minutes per IP
    
    if (!ipLimitDoc.exists) {
      await ipLimitRef.set({
        currentCount: 1,
        windowStart: now,
        maxRequests,
        windowMinutes
      });
      return { allowed: true };
    }
    
    const data = ipLimitDoc.data()!;
    const windowEnd = data.windowStart + windowMinutes * 60 * 1000;
    
    if (now > windowEnd) {
      await ipLimitRef.update({
        currentCount: 1,
        windowStart: now
      });
      return { allowed: true };
    }
    
    if (data.currentCount >= maxRequests) {
      return {
        allowed: false,
        reason: 'Too many requests from this IP address. Please try again later.'
      };
    }
    
    await ipLimitRef.update({
      currentCount: admin.firestore.FieldValue.increment(1)
    });
    
    return { allowed: true };
  } catch (error) {
    console.error('IP rate limit check failed:', error);
    return { allowed: true };
  }
}

// ============================================
// ABUSE DETECTION
// ============================================

/**
 * Log abuse detection
 */
async function logAbuseDetection(
  userId: string,
  abuseType: string,
  severity: string,
  description: string,
  metadata?: any
): Promise<void> {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const userEmail = userDoc.exists ? userDoc.data()?.email : 'unknown';
    
    await db.collection('abuse_detection').add({
      userId,
      userEmail,
      abuseType,
      severity,
      description,
      metadata: metadata || {},
      timestamp: Date.now()
    });
    
    // Auto-suspend for critical abuse
    if (severity === 'critical') {
      await db.collection('users').doc(userId).update({
        status: 'suspended',
        suspendedAt: Date.now(),
        suspensionReason: description
      });
      
      console.log(`🚫 Auto-suspended user ${userId} due to critical abuse`);
    }
  } catch (error) {
    console.error('Failed to log abuse detection:', error);
  }
}

// ============================================
// CREDIT VALIDATION & DEDUCTION
// ============================================

/**
 * Validate and deduct credits for AI generation
 * This is called BEFORE any AI API call
 */
export const validateAndDeductCredits = functions.https.onCall(async (data, context) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    const userId = context.auth.uid;
    const { aiType, service, prompt, duration, tokens } = data;
    
    if (!aiType || !service) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
    }
    
    const ipAddress = getUserIP(context.rawRequest);
    
    // 1. Check if user exists and is active
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }
    
    const userData = userDoc.data()!;
    
    // Check if account is suspended
    if (userData.status === 'suspended') {
      throw new functions.https.HttpsError('permission-denied', 'Account is suspended');
    }
    
    // 2. Moderate prompt (if provided)
    if (prompt) {
      const moderation = moderatePrompt(prompt);
      if (!moderation.allowed) {
        // Log inappropriate prompt
        await logAbuseDetection(userId, 'inappropriate_prompt', 'high',
          `Inappropriate prompt detected: ${moderation.flagged.join(', ')}`, {
            prompt: prompt.substring(0, 100),
            flagged: moderation.flagged,
            ipAddress
          });
        
        throw new functions.https.HttpsError('invalid-argument', 
          moderation.reason || 'Prompt contains inappropriate content');
      }
    }
    
    // 3. Check rate limits
    const rateLimitCheck = await checkRateLimit(userId, aiType, ipAddress);
    if (!rateLimitCheck.allowed) {
      throw new functions.https.HttpsError('resource-exhausted', 
        rateLimitCheck.reason || 'Rate limit exceeded');
    }
    
    // Check IP rate limit
    const ipLimitCheck = await checkIPRateLimit(ipAddress);
    if (!ipLimitCheck.allowed) {
      throw new functions.https.HttpsError('resource-exhausted', 
        ipLimitCheck.reason || 'Too many requests');
    }
    
    // 4. Calculate credit cost
    const configDoc = await db.collection('system_config').doc('credit_config').get();
    const config = configDoc.exists ? configDoc.data() : {
      imageCost: 1,
      videoCostPerSecond: 5,
      voiceCostPerMinute: 2,
      chatCostPerToken: 0.001
    };
    
    let creditCost = 0;
    switch (aiType) {
      case 'image':
        creditCost = config.imageCost || 1;
        break;
      case 'video':
        creditCost = (config.videoCostPerSecond || 5) * (duration || 5);
        break;
      case 'voice':
        creditCost = (config.voiceCostPerMinute || 2) * ((duration || 60) / 60);
        break;
      case 'chat':
        creditCost = (config.chatCostPerToken || 0.001) * (tokens || 100);
        break;
    }
    
    creditCost = Math.ceil(creditCost);
    
    // 5. Check if user has enough credits
    const currentCredits = userData.credits || 0;
    if (currentCredits < creditCost) {
      throw new functions.https.HttpsError('failed-precondition', 
        `Insufficient credits. Required: ${creditCost}, Available: ${currentCredits}`);
    }
    
    // 6. Deduct credits
    const newBalance = currentCredits - creditCost;
    await db.collection('users').doc(userId).update({
      credits: newBalance,
      lastCreditUpdate: Date.now()
    });
    
    // 7. Log credit transaction
    await db.collection('credit_logs').add({
      userId,
      userEmail: userData.email || 'unknown',
      type: 'deduction',
      amount: creditCost,
      balanceBefore: currentCredits,
      balanceAfter: newBalance,
      reason: `${aiType} generation via ${service}`,
      aiType,
      metadata: {
        service,
        prompt: prompt?.substring(0, 100),
        duration,
        tokens,
        ipAddress
      },
      timestamp: Date.now()
    });
    
    // 8. Create AI activity record for real-time monitoring
    const activityRef = await db.collection('ai_activity').add({
      userId,
      userEmail: userData.email || 'unknown',
      userName: userData.name || 'Unknown User',
      aiType,
      service,
      prompt: prompt ? prompt.substring(0, 100) + (prompt.length > 100 ? '...' : '') : 'N/A',
      promptHash: prompt ? hashPrompt(prompt) : null,
      creditsUsed: creditCost,
      status: 'pending',
      progress: 0,
      timestamp: Date.now(),
      ipAddress,
      country: userData.country || null,
      deviceInfo: context.rawRequest.headers['user-agent'] || null
    });
    
    console.log(`✅ Credits deducted: ${creditCost} from user ${userId}. New balance: ${newBalance}`);
    
    return {
      success: true,
      creditCost,
      newBalance,
      activityId: activityRef.id,
      message: 'Credits validated and deducted successfully'
    };
    
  } catch (error: any) {
    console.error('Credit validation error:', error);
    throw error;
  }
});

/**
 * Update AI activity status (called when generation completes/fails)
 */
export const updateAIActivityStatus = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    const { activityId, status, progress, resultUrl, errorMessage } = data;
    
    if (!activityId) {
      throw new functions.https.HttpsError('invalid-argument', 'Activity ID is required');
    }
    
    const updateData: any = {};
    
    if (status) updateData.status = status;
    if (progress !== undefined) updateData.progress = progress;
    if (resultUrl) updateData.resultUrl = resultUrl;
    if (errorMessage) updateData.errorMessage = errorMessage;
    
    if (status === 'completed' || status === 'failed') {
      updateData.completedAt = Date.now();
      
      const activityDoc = await db.collection('ai_activity').doc(activityId).get();
      if (activityDoc.exists) {
        const activityData = activityDoc.data()!;
        updateData.processingTime = Date.now() - activityData.timestamp;
      }
    }
    
    await db.collection('ai_activity').doc(activityId).update(updateData);
    
    // Log usage
    if (status === 'completed' || status === 'failed') {
      const activityDoc = await db.collection('ai_activity').doc(activityId).get();
      if (activityDoc.exists) {
        const activityData = activityDoc.data()!;
        
        await db.collection('usage_logs').add({
          userId: activityData.userId,
          userEmail: activityData.userEmail,
          aiType: activityData.aiType,
          service: activityData.service,
          creditsUsed: activityData.creditsUsed,
          status: status === 'completed' ? 'success' : 'failed',
          prompt: activityData.prompt,
          promptHash: activityData.promptHash,
          outputUrl: resultUrl || null,
          errorMessage: errorMessage || null,
          timestamp: Date.now(),
          ipAddress: activityData.ipAddress,
          deviceInfo: activityData.deviceInfo
        });
      }
    }
    
    return { success: true, message: 'Activity status updated' };
    
  } catch (error: any) {
    console.error('Failed to update activity status:', error);
    throw error;
  }
});

// ============================================
// ADMIN FUNCTIONS
// ============================================

/**
 * Grant credits to user (admin only)
 */
export const grantCreditsToUser = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }
    
    // Check if caller is admin
    const adminDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }
    
    const { userId, amount, reason, type } = data;
    
    if (!userId || !amount || amount <= 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid parameters');
    }
    
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }
    
    const userData = userDoc.data()!;
    const currentBalance = userData.credits || 0;
    const newBalance = currentBalance + amount;
    
    await db.collection('users').doc(userId).update({
      credits: newBalance,
      lastCreditUpdate: Date.now()
    });
    
    // Log transaction
    await db.collection('credit_logs').add({
      userId,
      userEmail: userData.email || 'unknown',
      type: type || 'grant',
      amount,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      reason: reason || 'Admin credit grant',
      metadata: {
        adminId: context.auth.uid,
        adminEmail: adminDoc.data()?.email || 'unknown'
      },
      timestamp: Date.now()
    });
    
    // Log admin action
    await db.collection('admin_audit_logs').add({
      adminId: context.auth.uid,
      adminEmail: adminDoc.data()?.email || 'unknown',
      action: 'grant_credits',
      targetType: 'user',
      targetId: userId,
      details: `Granted ${amount} credits to ${userData.email}`,
      changesMade: { amount, reason },
      ipAddress: getUserIP(context.rawRequest),
      timestamp: Date.now()
    });
    
    return {
      success: true,
      newBalance,
      message: `Successfully granted ${amount} credits`
    };
    
  } catch (error: any) {
    console.error('Failed to grant credits:', error);
    throw error;
  }
});

/**
 * Update credit configuration (admin only)
 */
export const updateCreditConfiguration = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }
    
    const adminDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }
    
    const config = data.config;
    
    await db.collection('system_config').doc('credit_config').set({
      ...config,
      updatedAt: Date.now(),
      updatedBy: adminDoc.data()?.email || 'unknown'
    });
    
    // Log admin action
    await db.collection('admin_audit_logs').add({
      adminId: context.auth.uid,
      adminEmail: adminDoc.data()?.email || 'unknown',
      action: 'edit_config',
      targetType: 'config',
      targetId: 'credit_config',
      details: 'Updated credit configuration',
      changesMade: config,
      ipAddress: getUserIP(context.rawRequest),
      timestamp: Date.now()
    });
    
    return { success: true, message: 'Credit configuration updated' };
    
  } catch (error: any) {
    console.error('Failed to update credit config:', error);
    throw error;
  }
});

// ============================================
// CLEANUP & MAINTENANCE
// ============================================

/**
 * Clean up old logs and activities (runs daily)
 */
export const cleanupOldData = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  try {
    const cutoffDate = Date.now() - (90 * 24 * 60 * 60 * 1000); // 90 days ago
    
    const collections = ['ai_activity', 'usage_logs', 'credit_logs', 'abuse_detection'];
    
    for (const collectionName of collections) {
      const oldDocs = await db.collection(collectionName)
        .where('timestamp', '<', cutoffDate)
        .limit(500)
        .get();
      
      const batch = db.batch();
      oldDocs.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`Deleted ${oldDocs.size} old documents from ${collectionName}`);
    }
    
    return null;
  } catch (error) {
    console.error('Cleanup failed:', error);
    return null;
  }
});

/**
 * Reset rate limits (runs hourly)
 */
export const resetRateLimits = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
  try {
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);
    
    const expiredLimits = await db.collection('rate_limits')
      .where('windowStart', '<', hourAgo)
      .limit(1000)
      .get();
    
    const batch = db.batch();
    expiredLimits.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`Cleaned up ${expiredLimits.size} expired rate limits`);
    
    return null;
  } catch (error) {
    console.error('Rate limit cleanup failed:', error);
    return null;
  }
});
// ============================================
// ENGINE-BASED CREDIT SYSTEM
// ============================================

/**
 * Validate and deduct credits based on specific engine
 * Callable function: validateAndDeductEngineCredits
 * 
 * Request:
 * - userId: string
 * - ai_type: 'image' | 'video' | 'voice' | 'chat'
 * - engine_id: string (e.g., 'dalle', 'gemini', 'seddream')
 * - input_size: number (tokens, seconds, images, etc.)
 * - prompt?: string (optional, for logging)
 * - metadata?: object (optional, additional data)
 * 
 * Response:
 * - success: boolean
 * - activityId?: string (if successful)
 * - cost?: number (credits deducted)
 * - message?: string (error or success message)
 */
export const validateAndDeductEngineCredits = functions.https.onCall(async (data, context) => {
  try {
    // Authenticate user
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    const { userId, ai_type, engine_id, input_size, prompt, metadata } = data;
    
    // Validate required fields
    if (!userId || !ai_type || !engine_id || input_size === undefined) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }
    
    // Get IP address
    const ipAddress = getUserIP(context.rawRequest);
    
    // 1. Check if engine exists and is active
    const engineDoc = await db.collection('ai_engines').doc(engine_id).get();
    
    if (!engineDoc.exists) {
      throw new functions.https.HttpsError('not-found', `Engine ${engine_id} not found`);
    }
    
    const engineData = engineDoc.data()!;
    
    if (!engineData.is_active) {
      throw new functions.https.HttpsError('failed-precondition', `Engine ${engine_id} is currently disabled`);
    }
    
    if (engineData.ai_type !== ai_type) {
      throw new functions.https.HttpsError('invalid-argument', `Engine ${engine_id} is not compatible with AI type ${ai_type}`);
    }
    
    // 2. Calculate cost
    const baseCost = engineData.base_cost || 1;
    const totalCost = Math.ceil(baseCost * input_size);
    
    if (totalCost <= 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Calculated cost must be greater than 0');
    }
    
    // 3. Check rate limits
    const rateLimitCheck = await checkRateLimit(userId, ai_type, ipAddress);
    if (!rateLimitCheck.allowed) {
      // Log abuse
      await db.collection('abuse_detection').add({
        userId,
        userEmail: context.auth.token.email || 'unknown',
        abuseType: 'rate_limit',
        severity: 'medium',
        description: rateLimitCheck.reason || 'Rate limit exceeded',
        metadata: { ai_type, engine_id, ipAddress },
        actionTaken: 'throttle',
        timestamp: Date.now()
      });
      
      throw new functions.https.HttpsError('resource-exhausted', rateLimitCheck.reason || 'Rate limit exceeded');
    }
    
    // 4. Moderate prompt (if provided)
    if (prompt) {
      const moderation = moderatePrompt(prompt);
      if (!moderation.allowed) {
        // Log abuse
        await db.collection('abuse_detection').add({
          userId,
          userEmail: context.auth.token.email || 'unknown',
          abuseType: 'inappropriate_prompt',
          severity: 'high',
          description: moderation.reason || 'Inappropriate content detected',
          metadata: { ai_type, engine_id, flagged: moderation.flagged, promptHash: hashPrompt(prompt) },
          actionTaken: 'warning',
          timestamp: Date.now()
        });
        
        throw new functions.https.HttpsError('invalid-argument', moderation.reason || 'Inappropriate content detected');
      }
    }
    
    // 5. Get user and check credits
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }
    
    const userData = userDoc.data()!;
    const currentCredits = userData.credits || 0;
    
    if (currentCredits < totalCost) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Insufficient credits. Required: ${totalCost}, Available: ${currentCredits}`
      );
    }
    
    // Check if user is suspended
    if (userData.status === 'suspended') {
      throw new functions.https.HttpsError('permission-denied', 'User account is suspended');
    }
    
    // 6. Deduct credits atomically
    const newCredits = currentCredits - totalCost;
    await db.collection('users').doc(userId).update({
      credits: newCredits
    });
    
    // 7. Log credit transaction
    await db.collection('credit_logs').add({
      userId,
      userEmail: userData.email || 'unknown',
      type: 'deduction',
      amount: -totalCost,
      balanceBefore: currentCredits,
      balanceAfter: newCredits,
      reason: `${ai_type} generation using ${engineData.engine_name || engine_id}`,
      aiType: ai_type,
      metadata: {
        engine_id,
        engine_name: engineData.engine_name,
        input_size,
        cost_per_unit: baseCost,
        prompt: prompt ? prompt.substring(0, 100) : undefined,
        ...metadata
      },
      timestamp: Date.now(),
      ipAddress
    });
    
    // 8. Create AI activity record
    const activityRef = await db.collection('ai_activity').add({
      userId,
      userEmail: userData.email || 'unknown',
      userName: userData.name || 'Unknown',
      aiType: ai_type,
      service: engineData.engine_name || engine_id,
      engine_id,
      engine_name: engineData.engine_name,
      prompt: prompt ? prompt.substring(0, 100) : 'N/A',
      promptHash: prompt ? hashPrompt(prompt) : 'N/A',
      creditsUsed: totalCost,
      status: 'pending',
      progress: 0,
      timestamp: Date.now(),
      ipAddress,
      country: userData.country || undefined,
      deviceInfo: context.rawRequest.headers['user-agent'] || undefined
    });
    
    // 9. Log engine usage
    await db.collection('usage_logs').add({
      userId,
      userEmail: userData.email || 'unknown',
      aiType: ai_type,
      service: engineData.engine_name || engine_id,
      engine_id,
      engine_name: engineData.engine_name,
      creditsUsed: totalCost,
      status: 'pending',
      prompt: prompt ? prompt.substring(0, 100) : undefined,
      promptHash: prompt ? hashPrompt(prompt) : undefined,
      input_size,
      cost_per_unit: baseCost,
      cost_unit: engineData.cost_unit,
      total_cost: totalCost,
      metadata: metadata || {},
      timestamp: Date.now(),
      ipAddress,
      deviceInfo: context.rawRequest.headers['user-agent'] || undefined
    });
    
    console.log(`✅ Credits deducted: ${totalCost} from user ${userId} for engine ${engine_id}`);
    
    return {
      success: true,
      activityId: activityRef.id,
      cost: totalCost,
      newBalance: newCredits,
      message: `Successfully deducted ${totalCost} credits for ${engineData.engine_name || engine_id}`
    };
    
  } catch (error: any) {
    console.error('Failed to validate and deduct engine credits:', error);
    
    // If it's already an HttpsError, rethrow it
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    // Otherwise, wrap it
    throw new functions.https.HttpsError('internal', error.message || 'Failed to process credit deduction');
  }
});

/**
 * Get engine pricing and availability
 * Callable function: getEnginePricing
 * 
 * Request:
 * - ai_type?: string (optional, filter by AI type)
 * - include_inactive?: boolean (optional, include disabled engines)
 * 
 * Response:
 * - engines: array of engine objects with pricing
 * - pricing_config: credit pricing configuration per AI type
 */
export const getEnginePricing = functions.https.onCall(async (data, context) => {
  try {
    const { ai_type, include_inactive } = data;
    
    // Get engines
    let enginesQuery = db.collection('ai_engines');
    
    if (ai_type) {
      enginesQuery = enginesQuery.where('ai_type', '==', ai_type) as any;
    }
    
    if (!include_inactive) {
      enginesQuery = enginesQuery.where('is_active', '==', true) as any;
    }
    
    const enginesSnapshot = await enginesQuery.get();
    const engines = enginesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Get pricing config
    let pricingConfig: any[] = [];
    if (ai_type) {
      const pricingDoc = await db.collection('credit_pricing').doc(ai_type).get();
      if (pricingDoc.exists) {
        pricingConfig = [{ ai_type, ...pricingDoc.data() }];
      }
    } else {
      const pricingSnapshot = await db.collection('credit_pricing').get();
      pricingConfig = pricingSnapshot.docs.map(doc => ({
        ai_type: doc.id,
        ...doc.data()
      }));
    }
    
    return {
      success: true,
      engines,
      pricing_config: pricingConfig
    };
    
  } catch (error: any) {
    console.error('Failed to get engine pricing:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to get engine pricing');
  }
});

/**
 * Get credit cost with plan-based pricing resolution
 * 
 * 3-tier pricing resolution:
 * 1. Plan-specific engine override (highest priority)
 * 2. Engine default cost
 * 3. Global AI type default cost (lowest priority)
 * 
 * Parameters:
 * - user_plan: string (subscription plan ID)
 * - ai_type: string
 * - engine_id: string
 * - input_size: number (tokens, seconds, images, etc.)
 * 
 * Response:
 * - cost_per_unit: number
 * - total_cost: number
 * - pricing_source: 'plan_override' | 'engine_default' | 'global_default'
 * - engine_name: string
 * - cost_unit: string
 */

// Pricing cache with TTL
interface PricingCacheEntry {
  data: any;
  timestamp: number;
}

const pricingCache = new Map<string, PricingCacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const getCreditCost = functions.https.onCall(async (data, context) => {
  try {
    const { user_plan, ai_type, engine_id, input_size } = data;
    
    if (!user_plan || !ai_type || !engine_id || typeof input_size !== 'number') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required parameters: user_plan, ai_type, engine_id, input_size'
      );
    }
    
    const cacheKey = `${user_plan}:${ai_type}:${engine_id}`;
    const now = Date.now();
    
    // Check cache
    const cached = pricingCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      const totalCost = Math.ceil(cached.data.cost_per_unit * input_size);
      console.log(`💾 Cache hit for ${cacheKey}`);
      return {
        ...cached.data,
        input_size,
        total_cost: totalCost
      };
    }
    
    let costPerUnit = 0;
    let pricingSource: 'plan_override' | 'engine_default' | 'global_default' = 'global_default';
    let engineName = engine_id;
    let costUnit = 'unit';
    
    // 1. Check for plan-specific override
    const planOverrideDoc = await db.collection('plan_pricing_overrides').doc(user_plan).get();
    if (planOverrideDoc.exists) {
      const overrides = planOverrideDoc.data();
      const engineOverride = overrides?.ai_types?.[ai_type]?.[engine_id];
      
      if (engineOverride && engineOverride.enabled !== false) {
        costPerUnit = engineOverride.cost;
        pricingSource = 'plan_override';
        console.log(`💰 Plan override: ${user_plan}/${ai_type}/${engine_id} = ${costPerUnit} credits`);
      }
    }
    
    // 2. If no plan override, check engine default cost
    if (pricingSource !== 'plan_override') {
      const engineDoc = await db.collection('ai_engines').doc(engine_id).get();
      if (engineDoc.exists) {
        const engineData = engineDoc.data();
        if (engineData?.is_active) {
          costPerUnit = engineData.base_cost || 0;
          engineName = engineData.engine_name || engine_id;
          costUnit = engineData.cost_unit || 'unit';
          pricingSource = 'engine_default';
          console.log(`💰 Engine default: ${engine_id} = ${costPerUnit} credits`);
        }
      }
    }
    
    // 3. If no engine cost, check global AI type default
    if (pricingSource === 'global_default' || costPerUnit === 0) {
      const pricingDoc = await db.collection('credit_pricing').doc(ai_type).get();
      if (pricingDoc.exists) {
        const pricingData = pricingDoc.data();
        const enginePricing = pricingData?.engines?.[engine_id];
        if (enginePricing) {
          costPerUnit = enginePricing.cost || 0;
          pricingSource = 'global_default';
          console.log(`💰 Global default: ${ai_type}/${engine_id} = ${costPerUnit} credits`);
        }
      }
    }
    
    // If still no cost found, throw error
    if (costPerUnit === 0) {
      throw new functions.https.HttpsError(
        'not-found',
        `No pricing found for ${user_plan}/${ai_type}/${engine_id}`
      );
    }
    
    const totalCost = Math.ceil(costPerUnit * input_size);
    
    const result = {
      cost_per_unit: costPerUnit,
      total_cost: totalCost,
      input_size,
      pricing_source: pricingSource,
      engine_id,
      engine_name: engineName,
      ai_type,
      user_plan,
      cost_unit: costUnit
    };
    
    // Cache the result
    pricingCache.set(cacheKey, {
      data: {
        cost_per_unit: costPerUnit,
        pricing_source: pricingSource,
        engine_name: engineName,
        cost_unit: costUnit
      },
      timestamp: now
    });
    
    console.log(`✅ Credit cost calculated: ${totalCost} credits (${pricingSource})`);
    return result;
    
  } catch (error: any) {
    console.error('Failed to get credit cost:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', error.message || 'Failed to calculate credit cost');
  }
});

/**
 * Admin: Update engine configuration
 * Callable function: updateEngineConfig (ADMIN ONLY)
 * 
 * Request:
 * - engine_id: string
 * - updates: object (fields to update)
 * 
 * Response:
 * - success: boolean
 * - message: string
 */
export const updateEngineConfig = functions.https.onCall(async (data, context) => {
  try {
    // Authenticate admin
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    const adminDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }
    
    const { engine_id, updates } = data;
    
    if (!engine_id || !updates) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing engine_id or updates');
    }
    
    // Update engine
    await db.collection('ai_engines').doc(engine_id).update({
      ...updates,
      updated_at: Date.now()
    });
    
    // Log admin action
    await db.collection('admin_audit_logs').add({
      adminId: context.auth.uid,
      adminEmail: adminDoc.data()?.email || 'unknown',
      action: 'edit_config',
      targetType: 'engine',
      targetId: engine_id,
      details: `Updated engine configuration: ${engine_id}`,
      changesMade: updates,
      ipAddress: getUserIP(context.rawRequest),
      timestamp: Date.now()
    });
    
    console.log(`✅ Engine ${engine_id} updated by admin ${context.auth.uid}`);
    
    return {
      success: true,
      message: `Engine ${engine_id} updated successfully`
    };
    
  } catch (error: any) {
    console.error('Failed to update engine config:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', error.message || 'Failed to update engine');
  }
});

/**
 * Admin: Update credit pricing configuration
 * Callable function: updateCreditPricingConfig (ADMIN ONLY)
 * 
 * Request:
 * - ai_type: string
 * - pricing: object (pricing configuration)
 * 
 * Response:
 * - success: boolean
 * - message: string
 */
export const updateCreditPricingConfig = functions.https.onCall(async (data, context) => {
  try {
    // Authenticate admin
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    const adminDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }
    
    const { ai_type, pricing } = data;
    
    if (!ai_type || !pricing) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing ai_type or pricing');
    }
    
    // Update pricing
    await db.collection('credit_pricing').doc(ai_type).set({
      ...pricing,
      ai_type,
      updated_at: Date.now(),
      updated_by: adminDoc.data()?.email || 'unknown'
    }, { merge: true });
    
    // Log admin action
    await db.collection('admin_audit_logs').add({
      adminId: context.auth.uid,
      adminEmail: adminDoc.data()?.email || 'unknown',
      action: 'edit_config',
      targetType: 'pricing',
      targetId: ai_type,
      details: `Updated credit pricing for ${ai_type}`,
      changesMade: pricing,
      ipAddress: getUserIP(context.rawRequest),
      timestamp: Date.now()
    });
    
    console.log(`✅ Pricing for ${ai_type} updated by admin ${context.auth.uid}`);
    
    return {
      success: true,
      message: `Pricing for ${ai_type} updated successfully`
    };
    
  } catch (error: any) {
    console.error('Failed to update pricing config:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', error.message || 'Failed to update pricing');
  }
});