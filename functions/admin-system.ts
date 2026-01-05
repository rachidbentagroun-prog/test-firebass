/**
 * Super Admin Dashboard - Cloud Functions
 * 
 * Enterprise-grade Cloud Functions for:
 * - Analytics aggregation (scheduled)
 * - User suspension checks
 * - Audit logging
 * - Rate limiting
 * - Abuse detection
 * - Email notifications
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();

// ======================
// HELPER FUNCTIONS
// ======================

/**
 * Create audit log entry
 */
async function createAuditLog(
  adminId: string,
  adminEmail: string,
  action: string,
  targetType: string,
  targetId: string | null,
  changes: any,
  reason: string | null,
  success: boolean,
  errorMessage: string | null = null
) {
  try {
    await db.collection('audit_logs').add({
      adminId,
      adminEmail,
      action,
      targetType,
      targetId,
      changes,
      reason,
      ipAddress: 'cloud-function',
      userAgent: 'cloud-function',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      success,
      errorMessage,
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Check if user is super admin
 */
async function isSuperAdmin(uid: string): Promise<boolean> {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    return userDoc.exists && userDoc.data()?.role === 'super_admin';
  } catch {
    return false;
  }
}

/**
 * Get or create date-based document
 */
async function getOrCreateDateDoc(collection: string, docId: string, initialData: any) {
  const docRef = db.collection(collection).doc(docId);
  const doc = await docRef.get();
  
  if (!doc.exists) {
    await docRef.set({
      ...initialData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return initialData;
  }
  
  return doc.data();
}

// ======================
// SCHEDULED FUNCTIONS
// ======================

/**
 * Aggregate daily analytics
 * Runs every day at 00:05 UTC
 */
export const aggregateDailyAnalytics = functions.pubsub
  .schedule('5 0 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('Starting daily analytics aggregation...');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD
    
    try {
      // Get all users count
      const usersSnapshot = await db.collection('users').get();
      const totalUsers = usersSnapshot.size;
      
      // Calculate active users
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      
      let activeUsers24h = 0;
      let activeUsers7d = 0;
      let newSignups = 0;
      
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        const lastActive = data.lastActiveAt?.toMillis() || 0;
        const createdAt = data.createdAt?.toMillis() || 0;
        
        if (lastActive >= oneDayAgo) activeUsers24h++;
        if (lastActive >= sevenDaysAgo) activeUsers7d++;
        
        // Check if user signed up yesterday
        const userDateStr = new Date(createdAt).toISOString().split('T')[0];
        if (userDateStr === dateStr) newSignups++;
      });
      
      // Get generation stats
      const startOfDay = new Date(yesterday);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(yesterday);
      endOfDay.setHours(23, 59, 59, 999);
      
      const generationsSnapshot = await db.collection('generation_logs')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(startOfDay))
        .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(endOfDay))
        .get();
      
      let imageGenerations = 0;
      let videoGenerations = 0;
      let voiceGenerations = 0;
      let chatGenerations = 0;
      let creditsConsumed = 0;
      const trafficByCountry: { [key: string]: number } = {};
      
      generationsSnapshot.forEach(doc => {
        const data = doc.data();
        
        switch (data.generationType) {
          case 'image':
            imageGenerations++;
            break;
          case 'video':
            videoGenerations++;
            break;
          case 'voice':
            voiceGenerations++;
            break;
          case 'chat':
            chatGenerations++;
            break;
        }
        
        creditsConsumed += data.creditsCost || 0;
        
        // Track country if available
        if (data.country) {
          trafficByCountry[data.country] = (trafficByCountry[data.country] || 0) + 1;
        }
      });
      
      const totalGenerations = imageGenerations + videoGenerations + voiceGenerations + chatGenerations;
      
      // Calculate credits granted (from user credit history)
      let creditsGranted = 0;
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        const history = data.creditHistory || [];
        
        history.forEach((entry: any) => {
          const entryDate = new Date(entry.timestamp?.toMillis() || 0).toISOString().split('T')[0];
          if (entryDate === dateStr && entry.amount > 0) {
            creditsGranted += entry.amount;
          }
        });
      });
      
      // Get page views (if you have analytics events)
      let pageViews = 0;
      let uniqueVisitors = 0;
      // TODO: Integrate with Firebase Analytics or your traffic tracking
      
      // Create/update daily analytics document
      await db.collection('analytics_daily').doc(dateStr).set({
        date: dateStr,
        totalUsers,
        activeUsers24h,
        activeUsers7d,
        newSignups,
        totalGenerations,
        imageGenerations,
        videoGenerations,
        voiceGenerations,
        chatGenerations,
        creditsConsumed,
        creditsGranted,
        revenue: 0, // TODO: Calculate from subscriptions
        pageViews,
        uniqueVisitors,
        trafficByCountry,
        topReferrers: {},
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      console.log(`Daily analytics aggregated for ${dateStr}`);
      
      // Update monthly analytics
      const monthStr = dateStr.substring(0, 7); // YYYY-MM
      await updateMonthlyAnalytics(monthStr);
      
      return { success: true, date: dateStr };
    } catch (error) {
      console.error('Failed to aggregate daily analytics:', error);
      throw error;
    }
  });

/**
 * Update monthly analytics from daily data
 */
async function updateMonthlyAnalytics(monthStr: string) {
  try {
    // Get all daily analytics for this month
    const dailyDocsSnapshot = await db.collection('analytics_daily')
      .where('date', '>=', `${monthStr}-01`)
      .where('date', '<', getNextMonth(monthStr))
      .get();
    
    let totalUsers = 0;
    let newSignups = 0;
    let totalGenerations = 0;
    let imageGenerations = 0;
    let videoGenerations = 0;
    let voiceGenerations = 0;
    let chatGenerations = 0;
    let creditsConsumed = 0;
    let creditsGranted = 0;
    let revenue = 0;
    let totalActiveUsers = 0;
    const countryCounts: { [key: string]: number } = {};
    
    dailyDocsSnapshot.forEach(doc => {
      const data = doc.data();
      totalUsers = Math.max(totalUsers, data.totalUsers || 0);
      newSignups += data.newSignups || 0;
      totalGenerations += data.totalGenerations || 0;
      imageGenerations += data.imageGenerations || 0;
      videoGenerations += data.videoGenerations || 0;
      voiceGenerations += data.voiceGenerations || 0;
      chatGenerations += data.chatGenerations || 0;
      creditsConsumed += data.creditsConsumed || 0;
      creditsGranted += data.creditsGranted || 0;
      revenue += data.revenue || 0;
      totalActiveUsers += data.activeUsers24h || 0;
      
      // Aggregate country data
      const countries = data.trafficByCountry || {};
      Object.entries(countries).forEach(([country, count]) => {
        countryCounts[country] = (countryCounts[country] || 0) + (count as number);
      });
    });
    
    const daysCount = dailyDocsSnapshot.size || 1;
    const avgDailyActiveUsers = Math.round(totalActiveUsers / daysCount);
    
    // Get top 5 countries
    const topCountries = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([country]) => country);
    
    // Calculate churn rate (simplified)
    const churnRate = 0; // TODO: Calculate based on cancelled subscriptions
    
    await db.collection('analytics_monthly').doc(monthStr).set({
      month: monthStr,
      totalUsers,
      newSignups,
      totalGenerations,
      imageGenerations,
      videoGenerations,
      voiceGenerations,
      chatGenerations,
      creditsConsumed,
      creditsGranted,
      revenue,
      avgDailyActiveUsers,
      churnRate,
      topCountries,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log(`Monthly analytics updated for ${monthStr}`);
  } catch (error) {
    console.error('Failed to update monthly analytics:', error);
  }
}

function getNextMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
}

// ======================
// USER MANAGEMENT
// ======================

/**
 * Trigger when user document is created
 * Grant default entitlements and track signup
 */
export const onUserCreated = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const userId = context.params.userId;
    const userData = snap.data();
    
    console.log(`New user created: ${userId}`);
    
    try {
      // Get default credits from credit_rules
      const creditRulesDoc = await db.collection('credit_rules').doc('default_rules').get();
      const creditRules = creditRulesDoc.data() || {};
      const freeSignupCredits = creditRules.freeSignupCredits || 10;
      
      // Update user with default fields if missing
      const updates: any = {};
      
      if (userData.credits === undefined) {
        updates.credits = freeSignupCredits;
        updates.totalCreditsGranted = freeSignupCredits;
        updates.creditHistory = [{
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          amount: freeSignupCredits,
          reason: 'signup_bonus',
        }];
      }
      
      if (userData.isSuspended === undefined) {
        updates.isSuspended = false;
      }
      
      if (userData.createdAt === undefined) {
        updates.createdAt = admin.firestore.FieldValue.serverTimestamp();
      }
      
      if (userData.lastActiveAt === undefined) {
        updates.lastActiveAt = admin.firestore.FieldValue.serverTimestamp();
      }
      
      if (userData.totalCreditsConsumed === undefined) {
        updates.totalCreditsConsumed = 0;
      }
      
      if (userData.totalGenerations === undefined) {
        updates.totalGenerations = 0;
      }
      
      if (userData.generationsByType === undefined) {
        updates.generationsByType = {
          image: 0,
          video: 0,
          voice: 0,
          chat: 0,
        };
      }
      
      if (Object.keys(updates).length > 0) {
        await snap.ref.update(updates);
      }
      
      // Log analytics event
      console.log(`User initialized with ${freeSignupCredits} credits`);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize user:', error);
      throw error;
    }
  });

/**
 * Check if user is suspended before generation
 * This is called by generation Cloud Functions
 */
export const checkUserSuspension = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const userId = context.auth.uid;
  
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }
    
    const userData = userDoc.data();
    const isSuspended = userData?.isSuspended || false;
    
    if (isSuspended) {
      return {
        allowed: false,
        reason: 'Account is suspended. Please contact support.',
        suspendedAt: userData.suspendedAt,
        suspendReason: userData.suspendReason,
      };
    }
    
    // Check if user has enough credits
    const credits = userData?.credits || 0;
    const requiredCredits = data.requiredCredits || 0;
    
    if (credits < requiredCredits) {
      return {
        allowed: false,
        reason: 'Insufficient credits',
        currentCredits: credits,
        requiredCredits,
      };
    }
    
    return {
      allowed: true,
      credits,
    };
  } catch (error: any) {
    console.error('Error checking user suspension:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ======================
// GENERATION LOGGING
// ======================

/**
 * Log AI generation request
 * Called by generation APIs
 */
export const logGeneration = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const userId = context.auth.uid;
  const {
    generationType,
    engineId,
    engineName,
    prompt,
    creditsCost,
    quality,
    duration,
    status,
    errorMessage,
    processingTime,
  } = data;
  
  try {
    // Create generation log
    const logRef = await db.collection('generation_logs').add({
      userId,
      userEmail: context.auth.token.email || 'unknown',
      generationType,
      engineId,
      engineName,
      prompt: prompt ? prompt.substring(0, 500) : null, // Limit prompt length
      creditsCost,
      quality: quality || null,
      duration: duration || null,
      status,
      errorMessage: errorMessage || null,
      processingTime: processingTime || null,
      ipAddress: context.rawRequest.ip || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      completedAt: status === 'success' || status === 'failed' 
        ? admin.firestore.FieldValue.serverTimestamp() 
        : null,
    });
    
    // Update user stats
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data() || {};
    
    const updates: any = {
      totalGenerations: admin.firestore.FieldValue.increment(1),
      lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    // Increment generation type counter
    updates[`generationsByType.${generationType}`] = admin.firestore.FieldValue.increment(1);
    
    // Deduct credits if successful
    if (status === 'success' && creditsCost > 0) {
      updates.credits = admin.firestore.FieldValue.increment(-creditsCost);
      updates.totalCreditsConsumed = admin.firestore.FieldValue.increment(creditsCost);
      
      // Add to credit history
      const creditHistory = userData.creditHistory || [];
      creditHistory.push({
        timestamp: admin.firestore.Timestamp.now(),
        amount: -creditsCost,
        reason: `${generationType}_generation`,
        generationLogId: logRef.id,
      });
      
      // Keep only last 100 entries
      if (creditHistory.length > 100) {
        creditHistory.shift();
      }
      
      updates.creditHistory = creditHistory;
    }
    
    await userRef.update(updates);
    
    return {
      success: true,
      logId: logRef.id,
    };
  } catch (error: any) {
    console.error('Failed to log generation:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ======================
// ADMIN ACTIONS
// ======================

/**
 * Suspend or unsuspend user
 */
export const suspendUser = functions.https.onCall(async (data, context) => {
  // Verify caller is super admin
  if (!context.auth || !(await isSuperAdmin(context.auth.uid))) {
    throw new functions.https.HttpsError('permission-denied', 'Only super admins can suspend users');
  }
  
  const { userId, suspend, reason } = data;
  const adminId = context.auth.uid;
  const adminEmail = context.auth.token.email || 'unknown';
  
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }
    
    const before = userDoc.data();
    
    const updates: any = {
      isSuspended: suspend,
    };
    
    if (suspend) {
      updates.suspendedAt = admin.firestore.FieldValue.serverTimestamp();
      updates.suspendedBy = adminId;
      updates.suspendReason = reason || 'No reason provided';
    } else {
      updates.suspendedAt = null;
      updates.suspendedBy = null;
      updates.suspendReason = null;
    }
    
    await userRef.update(updates);
    
    // Create audit log
    await createAuditLog(
      adminId,
      adminEmail,
      suspend ? 'SUSPEND_USER' : 'UNSUSPEND_USER',
      'user',
      userId,
      { before: { isSuspended: before?.isSuspended }, after: { isSuspended: suspend } },
      reason,
      true
    );
    
    return {
      success: true,
      message: `User ${suspend ? 'suspended' : 'unsuspended'} successfully`,
    };
  } catch (error: any) {
    console.error('Failed to suspend/unsuspend user:', error);
    
    // Log failed attempt
    await createAuditLog(
      adminId,
      adminEmail,
      suspend ? 'SUSPEND_USER' : 'UNSUSPEND_USER',
      'user',
      userId,
      null,
      reason,
      false,
      error.message
    );
    
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Grant credits to user
 */
export const grantCredits = functions.https.onCall(async (data, context) => {
  // Verify caller is super admin
  if (!context.auth || !(await isSuperAdmin(context.auth.uid))) {
    throw new functions.https.HttpsError('permission-denied', 'Only super admins can grant credits');
  }
  
  const { userId, amount, reason } = data;
  const adminId = context.auth.uid;
  const adminEmail = context.auth.token.email || 'unknown';
  
  if (!amount || amount <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Amount must be positive');
  }
  
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }
    
    const userData = userDoc.data();
    const before = { credits: userData?.credits || 0 };
    const after = { credits: before.credits + amount };
    
    // Update credits
    const creditHistory = userData?.creditHistory || [];
    creditHistory.push({
      timestamp: admin.firestore.Timestamp.now(),
      amount,
      reason: reason || 'manual_grant',
      adminId,
    });
    
    // Keep only last 100 entries
    if (creditHistory.length > 100) {
      creditHistory.shift();
    }
    
    await userRef.update({
      credits: admin.firestore.FieldValue.increment(amount),
      totalCreditsGranted: admin.firestore.FieldValue.increment(amount),
      creditHistory,
    });
    
    // Create audit log
    await createAuditLog(
      adminId,
      adminEmail,
      'GRANT_CREDITS',
      'user',
      userId,
      { before, after, amount },
      reason,
      true
    );
    
    return {
      success: true,
      message: `${amount} credits granted successfully`,
      newBalance: after.credits,
    };
  } catch (error: any) {
    console.error('Failed to grant credits:', error);
    
    await createAuditLog(
      adminId,
      adminEmail,
      'GRANT_CREDITS',
      'user',
      userId,
      { amount },
      reason,
      false,
      error.message
    );
    
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ======================
// RATE LIMITING
// ======================

/**
 * Check rate limit for user
 */
export const checkRateLimit = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const userId = context.auth.uid;
  const { action } = data; // e.g., 'image_generation'
  
  try {
    // Get user's plan
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const plan = userData?.plan || 'free';
    
    // Get system config for rate limits
    const configDoc = await db.collection('system_config').doc('default').get();
    const config = configDoc.data() || {};
    const rateLimits = config.rateLimits || {
      free: { maxPerHour: 5, maxPerDay: 20 },
      basic: { maxPerHour: 20, maxPerDay: 100 },
      premium: { maxPerHour: 100, maxPerDay: 500 },
    };
    
    const userLimits = rateLimits[plan];
    
    // Get or create rate limit document
    const rateLimitRef = db.collection('rate_limits').doc(userId);
    const rateLimitDoc = await rateLimitRef.get();
    
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    let requests = rateLimitDoc.exists ? rateLimitDoc.data()?.requests || [] : [];
    
    // Filter out old requests
    requests = requests.filter((timestamp: number) => timestamp > oneDayAgo);
    
    // Count recent requests
    const requestsLastHour = requests.filter((timestamp: number) => timestamp > oneHourAgo).length;
    const requestsLastDay = requests.length;
    
    // Check limits
    if (requestsLastHour >= userLimits.maxPerHour) {
      return {
        allowed: false,
        reason: 'Hourly rate limit exceeded',
        resetIn: Math.ceil((requests.find((t: number) => t > oneHourAgo) + 60 * 60 * 1000 - now) / 1000),
      };
    }
    
    if (requestsLastDay >= userLimits.maxPerDay) {
      return {
        allowed: false,
        reason: 'Daily rate limit exceeded',
        resetIn: Math.ceil((requests[0] + 24 * 60 * 60 * 1000 - now) / 1000),
      };
    }
    
    // Add current request
    requests.push(now);
    
    // Update rate limit document
    await rateLimitRef.set({
      userId,
      plan,
      requests,
      lastRequest: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    return {
      allowed: true,
      remaining: {
        hourly: userLimits.maxPerHour - requestsLastHour - 1,
        daily: userLimits.maxPerDay - requestsLastDay - 1,
      },
    };
  } catch (error: any) {
    console.error('Error checking rate limit:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ======================
// CONTACT FORM NOTIFICATIONS
// ======================

/**
 * Send notification when contact message is received
 */
export const onContactMessageCreated = functions.firestore
  .document('contact_messages/{messageId}')
  .onCreate(async (snap, context) => {
    const messageData = snap.data();
    
    console.log('New contact message received:', messageData.userEmail);
    
    // TODO: Send email notification to admin
    // You can use SendGrid, Firebase Email Extension, or other email service
    
    // For now, just log it
    console.log('Subject:', messageData.subject);
    console.log('From:', messageData.userEmail);
    
    return { success: true };
  });

// ======================
// ABUSE DETECTION
// ======================

/**
 * Detect potential abuse patterns
 * Runs every hour
 */
export const detectAbuse = functions.pubsub
  .schedule('0 * * * *')
  .onRun(async (context) => {
    console.log('Running abuse detection...');
    
    try {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      
      // Get recent generations
      const generationsSnapshot = await db.collection('generation_logs')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromMillis(oneHourAgo))
        .get();
      
      const userActivity: { [userId: string]: number } = {};
      const ipActivity: { [ip: string]: number } = {};
      
      generationsSnapshot.forEach(doc => {
        const data = doc.data();
        const userId = data.userId;
        const ip = data.ipAddress;
        
        userActivity[userId] = (userActivity[userId] || 0) + 1;
        if (ip) {
          ipActivity[ip] = (ipActivity[ip] || 0) + 1;
        }
      });
      
      // Detect users with excessive activity (> 50 generations per hour)
      const suspiciousUsers = Object.entries(userActivity)
        .filter(([_, count]) => count > 50)
        .map(([userId, count]) => ({ userId, count, type: 'excessive_usage' }));
      
      // Detect IPs with excessive activity (> 100 requests per hour)
      const suspiciousIPs = Object.entries(ipActivity)
        .filter(([_, count]) => count > 100)
        .map(([ip, count]) => ({ ip, count, type: 'excessive_requests' }));
      
      // Log detections
      for (const detection of suspiciousUsers) {
        await db.collection('abuse_detection').add({
          type: detection.type,
          userId: detection.userId,
          count: detection.count,
          timeWindow: '1_hour',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          status: 'flagged',
        });
        
        console.log(`Flagged user ${detection.userId} for excessive usage: ${detection.count} generations`);
      }
      
      for (const detection of suspiciousIPs) {
        await db.collection('abuse_detection').add({
          type: detection.type,
          ipAddress: detection.ip,
          count: detection.count,
          timeWindow: '1_hour',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          status: 'flagged',
        });
        
        console.log(`Flagged IP ${detection.ip} for excessive requests: ${detection.count} requests`);
      }
      
      console.log(`Abuse detection complete: ${suspiciousUsers.length} users, ${suspiciousIPs.length} IPs flagged`);
      
      return { success: true };
    } catch (error) {
      console.error('Abuse detection failed:', error);
      throw error;
    }
  });

// Export all functions
export default {
  aggregateDailyAnalytics,
  onUserCreated,
  checkUserSuspension,
  logGeneration,
  suspendUser,
  grantCredits,
  checkRateLimit,
  onContactMessageCreated,
  detectAbuse,
};
