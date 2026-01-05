/**
 * Admin Dashboard Services
 * 
 * Client-side services for Super Admin Dashboard
 * All these functions require super_admin role
 */

import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

// ======================
// ANALYTICS
// ======================

/**
 * Get daily analytics for a date range
 */
export async function getDailyAnalytics(startDate: string, endDate: string) {
  try {
    const analyticsRef = collection(db, 'analytics_daily');
    const q = query(
      analyticsRef,
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Failed to fetch daily analytics:', error);
    throw error;
  }
}

/**
 * Get monthly analytics
 */
export async function getMonthlyAnalytics(months: number = 6) {
  try {
    const analyticsRef = collection(db, 'analytics_monthly');
    const q = query(analyticsRef, orderBy('month', 'desc'), limit(months));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Failed to fetch monthly analytics:', error);
    throw error;
  }
}

/**
 * Get real-time analytics summary
 */
export async function getRealtimeAnalyticsSummary() {
  try {
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's analytics
    const todayRef = doc(db, 'analytics_daily', today);
    const todaySnap = await getDoc(todayRef);
    const todayData = todaySnap.exists() ? todaySnap.data() : null;
    
    // Get yesterday's analytics for comparison
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];
    const yesterdayRef = doc(db, 'analytics_daily', yesterdayDate);
    const yesterdaySnap = await getDoc(yesterdayRef);
    const yesterdayData = yesterdaySnap.exists() ? yesterdaySnap.data() : null;
    
    return {
      today: todayData,
      yesterday: yesterdayData,
      comparison: todayData && yesterdayData ? {
        usersGrowth: ((todayData.totalUsers - yesterdayData.totalUsers) / yesterdayData.totalUsers * 100).toFixed(2),
        generationsGrowth: ((todayData.totalGenerations - yesterdayData.totalGenerations) / yesterdayData.totalGenerations * 100).toFixed(2),
        creditsGrowth: ((todayData.creditsConsumed - yesterdayData.creditsConsumed) / yesterdayData.creditsConsumed * 100).toFixed(2),
      } : null,
    };
  } catch (error) {
    console.error('Failed to fetch realtime analytics:', error);
    throw error;
  }
}

// ======================
// CREDIT MANAGEMENT
// ======================

/**
 * Get credit rules
 */
export async function getCreditRules() {
  try {
    const rulesRef = doc(db, 'credit_rules', 'default_rules');
    const rulesSnap = await getDoc(rulesRef);
    
    if (rulesSnap.exists()) {
      return { id: rulesSnap.id, ...rulesSnap.data() };
    }
    
    // Return default if not exists
    return {
      imageCost: 1,
      imageHDCost: 2,
      image4KCost: 5,
      videoCostPerSecond: 5,
      video720pMultiplier: 1.0,
      video1080pMultiplier: 1.5,
      video4KMultiplier: 3.0,
      voiceCostPerMinute: 2,
      voiceCloneCostMultiplier: 2.0,
      chatCostPerToken: 0.001,
      chatGPT4Multiplier: 5.0,
      freeSignupCredits: 10,
      basicPlanCredits: 100,
      premiumPlanCredits: 500,
    };
  } catch (error) {
    console.error('Failed to fetch credit rules:', error);
    throw error;
  }
}

/**
 * Update credit rules
 */
export async function updateCreditRules(rules: any, adminId: string, reason: string) {
  try {
    const rulesRef = doc(db, 'credit_rules', 'default_rules');
    
    await setDoc(rulesRef, {
      ...rules,
      updatedAt: serverTimestamp(),
      updatedBy: adminId,
      auditLog: reason,
    }, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to update credit rules:', error);
    throw error;
  }
}

/**
 * Get all engine costs
 */
export async function getEngineCosts() {
  try {
    const enginesRef = collection(db, 'engine_costs');
    const snapshot = await getDocs(enginesRef);
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Failed to fetch engine costs:', error);
    throw error;
  }
}

/**
 * Update engine cost
 */
export async function updateEngineCost(engineId: string, data: any, adminId: string) {
  try {
    const engineRef = doc(db, 'engine_costs', engineId);
    
    await setDoc(engineRef, {
      ...data,
      engineId,
      updatedAt: serverTimestamp(),
      updatedBy: adminId,
    }, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to update engine cost:', error);
    throw error;
  }
}

/**
 * Get plan credit overrides
 */
export async function getPlanCreditOverrides(planName?: string) {
  try {
    const overridesRef = collection(db, 'plan_credit_overrides');
    
    let q;
    if (planName) {
      q = query(overridesRef, where('planName', '==', planName));
    } else {
      q = overridesRef;
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Failed to fetch plan credit overrides:', error);
    throw error;
  }
}

/**
 * Update plan credit override
 */
export async function updatePlanCreditOverride(
  planName: string, 
  engineId: string, 
  data: any, 
  adminId: string
) {
  try {
    const overrideId = `${planName}_${engineId}`;
    const overrideRef = doc(db, 'plan_credit_overrides', overrideId);
    
    await setDoc(overrideRef, {
      planName,
      engineId,
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: adminId,
    }, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to update plan credit override:', error);
    throw error;
  }
}

/**
 * Get global credit statistics
 */
export async function getGlobalCreditStatistics() {
  try {
    // Get today's analytics
    const today = new Date().toISOString().split('T')[0];
    const todayRef = doc(db, 'analytics_daily', today);
    const todaySnap = await getDoc(todayRef);
    const todayData = todaySnap.exists() ? todaySnap.data() : { creditsConsumed: 0, creditsGranted: 0 };
    
    // Get last 7 days
    const last7Days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayRef = doc(db, 'analytics_daily', dateStr);
      const daySnap = await getDoc(dayRef);
      if (daySnap.exists()) {
        last7Days.push(daySnap.data());
      }
    }
    
    const totalConsumed7d = last7Days.reduce((sum, day) => sum + (day.creditsConsumed || 0), 0);
    const totalGranted7d = last7Days.reduce((sum, day) => sum + (day.creditsGranted || 0), 0);
    const avgConsumedPerDay = totalConsumed7d / 7;
    
    return {
      today: {
        consumed: todayData.creditsConsumed,
        granted: todayData.creditsGranted,
      },
      last7Days: {
        totalConsumed: totalConsumed7d,
        totalGranted: totalGranted7d,
        avgPerDay: avgConsumedPerDay,
      },
    };
  } catch (error) {
    console.error('Failed to fetch global credit statistics:', error);
    throw error;
  }
}

// ======================
// USER MANAGEMENT
// ======================

/**
 * Get all users with pagination
 */
export async function getAllUsersAdmin(
  pageSize: number = 50, 
  lastUserId?: string
) {
  try {
    const usersRef = collection(db, 'users');
    let q;
    
    if (lastUserId) {
      const lastUserDoc = await getDoc(doc(db, 'users', lastUserId));
      q = query(
        usersRef,
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );
    } else {
      q = query(usersRef, orderBy('createdAt', 'desc'), limit(pageSize));
    }
    
    const snapshot = await getDocs(q);
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      users,
      lastUserId: users.length > 0 ? users[users.length - 1].id : null,
      hasMore: users.length === pageSize,
    };
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
}

/**
 * Search users by email or name
 */
export async function searchUsers(searchQuery: string) {
  try {
    const usersRef = collection(db, 'users');
    
    // Firestore doesn't support full-text search, so we'll get all users and filter client-side
    // For production, consider using Algolia or Elasticsearch
    const snapshot = await getDocs(query(usersRef, limit(1000)));
    
    const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const searchLower = searchQuery.toLowerCase();
    return allUsers.filter((user: any) => 
      user.email?.toLowerCase().includes(searchLower) ||
      user.name?.toLowerCase().includes(searchLower) ||
      user.id?.toLowerCase().includes(searchLower)
    );
  } catch (error) {
    console.error('Failed to search users:', error);
    throw error;
  }
}

/**
 * Suspend user (Cloud Function)
 */
export async function suspendUserAdmin(userId: string, suspend: boolean, reason: string) {
  try {
    const suspendUserFn = httpsCallable(functions, 'suspendUser');
    const result = await suspendUserFn({ userId, suspend, reason });
    return result.data;
  } catch (error: any) {
    console.error('Failed to suspend user:', error);
    throw new Error(error.message || 'Failed to suspend user');
  }
}

/**
 * Grant credits to user (Cloud Function)
 */
export async function grantCreditsAdmin(userId: string, amount: number, reason: string) {
  try {
    const grantCreditsFn = httpsCallable(functions, 'grantCredits');
    const result = await grantCreditsFn({ userId, amount, reason });
    return result.data;
  } catch (error: any) {
    console.error('Failed to grant credits:', error);
    throw new Error(error.message || 'Failed to grant credits');
  }
}

/**
 * Update user profile (admin override)
 */
export async function updateUserProfileAdmin(userId: string, updates: any) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to update user profile:', error);
    throw error;
  }
}

/**
 * Get user activity details
 */
export async function getUserActivityDetails(userId: string, days: number = 30) {
  try {
    const cutoffDate = Timestamp.fromMillis(Date.now() - days * 24 * 60 * 60 * 1000);
    
    // Get generation logs
    const generationsRef = collection(db, 'generation_logs');
    const q = query(
      generationsRef,
      where('userId', '==', userId),
      where('createdAt', '>=', cutoffDate),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    
    const snapshot = await getDocs(q);
    const generations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Calculate stats
    const stats = {
      totalGenerations: generations.length,
      successfulGenerations: generations.filter((g: any) => g.status === 'success').length,
      failedGenerations: generations.filter((g: any) => g.status === 'failed').length,
      totalCreditsSpent: generations.reduce((sum: number, g: any) => sum + (g.creditsCost || 0), 0),
      byType: {
        image: generations.filter((g: any) => g.generationType === 'image').length,
        video: generations.filter((g: any) => g.generationType === 'video').length,
        voice: generations.filter((g: any) => g.generationType === 'voice').length,
        chat: generations.filter((g: any) => g.generationType === 'chat').length,
      },
    };
    
    return {
      generations,
      stats,
    };
  } catch (error) {
    console.error('Failed to fetch user activity:', error);
    throw error;
  }
}

// ======================
// ADMIN INBOX
// ======================

/**
 * Get contact messages
 */
export async function getContactMessages(
  status?: 'new' | 'read' | 'replied' | 'archived',
  limitCount: number = 50
) {
  try {
    const messagesRef = collection(db, 'contact_messages');
    
    let q;
    if (status) {
      q = query(
        messagesRef,
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    } else {
      q = query(messagesRef, orderBy('createdAt', 'desc'), limit(limitCount));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Failed to fetch contact messages:', error);
    throw error;
  }
}

/**
 * Update contact message status
 */
export async function updateContactMessageStatus(
  messageId: string, 
  status: 'new' | 'read' | 'replied' | 'archived',
  replyContent?: string,
  adminId?: string
) {
  try {
    const messageRef = doc(db, 'contact_messages', messageId);
    
    const updates: any = {
      status,
      updatedAt: serverTimestamp(),
    };
    
    if (status === 'read' && !replyContent) {
      updates.readAt = serverTimestamp();
    }
    
    if (replyContent && adminId) {
      updates.replyContent = replyContent;
      updates.repliedBy = adminId;
      updates.repliedAt = serverTimestamp();
    }
    
    await updateDoc(messageRef, updates);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to update contact message:', error);
    throw error;
  }
}

/**
 * Get chat sessions
 */
export async function getChatSessions(limitCount: number = 50) {
  try {
    const sessionsRef = collection(db, 'chat_sessions');
    const q = query(sessionsRef, orderBy('lastMessageAt', 'desc'), limit(limitCount));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Failed to fetch chat sessions:', error);
    throw error;
  }
}

/**
 * Get chat messages for a session
 */
export async function getChatMessages(sessionId: string) {
  try {
    const messagesRef = collection(db, 'chat_messages');
    const q = query(
      messagesRef,
      where('sessionId', '==', sessionId),
      orderBy('createdAt', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Failed to fetch chat messages:', error);
    throw error;
  }
}

/**
 * Send chat reply (admin)
 */
export async function sendChatReply(sessionId: string, message: string, adminId: string) {
  try {
    const messagesRef = collection(db, 'chat_messages');
    
    await setDoc(doc(messagesRef), {
      sessionId,
      message,
      sender: 'support',
      source: 'chat_widget',
      status: 'read',
      createdAt: serverTimestamp(),
    });
    
    // Update session's last message time
    const sessionRef = doc(db, 'chat_sessions', sessionId);
    await updateDoc(sessionRef, {
      lastMessageAt: serverTimestamp(),
      status: 'active',
    });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to send chat reply:', error);
    throw error;
  }
}

// ======================
// AUDIT LOGS
// ======================

/**
 * Get audit logs
 */
export async function getAuditLogsAdmin(
  adminId?: string,
  action?: string,
  limitCount: number = 100
) {
  try {
    const logsRef = collection(db, 'audit_logs');
    
    let q;
    if (adminId && action) {
      q = query(
        logsRef,
        where('adminId', '==', adminId),
        where('action', '==', action),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
    } else if (adminId) {
      q = query(
        logsRef,
        where('adminId', '==', adminId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
    } else if (action) {
      q = query(
        logsRef,
        where('action', '==', action),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
    } else {
      q = query(logsRef, orderBy('timestamp', 'desc'), limit(limitCount));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    throw error;
  }
}

// ======================
// ABUSE DETECTION
// ======================

/**
 * Get abuse detection logs
 */
export async function getAbuseDetectionLogsAdmin(limitCount: number = 50) {
  try {
    const logsRef = collection(db, 'abuse_detection');
    const q = query(
      logsRef,
      where('status', '==', 'flagged'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Failed to fetch abuse detection logs:', error);
    throw error;
  }
}

/**
 * Update abuse detection status
 */
export async function updateAbuseDetectionStatus(
  logId: string, 
  status: 'flagged' | 'reviewed' | 'actioned' | 'false_positive'
) {
  try {
    const logRef = doc(db, 'abuse_detection', logId);
    await updateDoc(logRef, {
      status,
      reviewedAt: serverTimestamp(),
    });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to update abuse detection status:', error);
    throw error;
  }
}

// ======================
// SYSTEM CONFIG
// ======================

/**
 * Get system configuration
 */
export async function getSystemConfig() {
  try {
    const configRef = doc(db, 'system_config', 'default');
    const configSnap = await getDoc(configRef);
    
    if (configSnap.exists()) {
      return { id: configSnap.id, ...configSnap.data() };
    }
    
    // Return defaults
    return {
      maintenanceMode: false,
      signupsEnabled: true,
      freeSignupsEnabled: true,
      maxConcurrentGenerations: 100,
      maxQueueSize: 500,
      rateLimits: {
        free: { maxPerHour: 5, maxPerDay: 20 },
        basic: { maxPerHour: 20, maxPerDay: 100 },
        premium: { maxPerHour: 100, maxPerDay: 500 },
      },
    };
  } catch (error) {
    console.error('Failed to fetch system config:', error);
    throw error;
  }
}

/**
 * Update system configuration
 */
export async function updateSystemConfig(config: any, adminId: string) {
  try {
    const configRef = doc(db, 'system_config', 'default');
    
    await setDoc(configRef, {
      ...config,
      updatedAt: serverTimestamp(),
      updatedBy: adminId,
    }, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to update system config:', error);
    throw error;
  }
}

export default {
  // Analytics
  getDailyAnalytics,
  getMonthlyAnalytics,
  getRealtimeAnalyticsSummary,
  
  // Credit Management
  getCreditRules,
  updateCreditRules,
  getEngineCosts,
  updateEngineCost,
  getPlanCreditOverrides,
  updatePlanCreditOverride,
  getGlobalCreditStatistics,
  
  // User Management
  getAllUsersAdmin,
  searchUsers,
  suspendUserAdmin,
  grantCreditsAdmin,
  updateUserProfileAdmin,
  getUserActivityDetails,
  
  // Admin Inbox
  getContactMessages,
  updateContactMessageStatus,
  getChatSessions,
  getChatMessages,
  sendChatReply,
  
  // Audit & Abuse
  getAuditLogsAdmin,
  getAbuseDetectionLogsAdmin,
  updateAbuseDetectionStatus,
  
  // System Config
  getSystemConfig,
  updateSystemConfig,
};
