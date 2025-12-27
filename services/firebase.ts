import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile, sendEmailVerification, applyActionCode, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { getAnalytics, logEvent as gaLogEvent, setUserId as gaSetUserId, setUserProperties as gaSetUserProperties } from 'firebase/analytics';
import { GeneratedAudio, GeneratedImage, GeneratedVideo } from '../types';

const measurementId = (import.meta as any)?.env?.VITE_FIREBASE_MEASUREMENT_ID;
const firebaseConfig = {
  apiKey: (import.meta as any)?.env?.VITE_FIREBASE_API_KEY || 'AIzaSyAn0LrM0rtXoXvOA8m4JqkGQ8KJR_NKgYA',
  authDomain: (import.meta as any)?.env?.VITE_FIREBASE_AUTH_DOMAIN || 'image-ai-generator-adf8c.firebaseapp.com',
  projectId: (import.meta as any)?.env?.VITE_FIREBASE_PROJECT_ID || 'image-ai-generator-adf8c',
  ...(measurementId ? { measurementId } : {}),
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const analytics = typeof window !== 'undefined'
  ? (() => {
      try { return getAnalytics(app); } catch { return undefined; }
    })()
  : undefined;

export function logAnalyticsEvent(name: string, params?: Record<string, any>) {
  try {
    if (!analytics) return;
    gaLogEvent(analytics, name, params);
  } catch {}
}

export function trackPageView(path?: string) {
  try {
    if (!analytics) return;
    const p = path || (typeof window !== 'undefined' ? window.location.pathname : undefined);
    gaLogEvent(analytics, 'page_view', {
      page_path: p,
      page_location: typeof window !== 'undefined' ? window.location.href : undefined,
    });
  } catch {}
}

export function setAnalyticsUserId(uid?: string) {
  try {
    if (!analytics || !uid) return;
    gaSetUserId(analytics, uid);
  } catch {}
}

export function setAnalyticsUserProperties(props: Record<string, any>) {
  try {
    if (!analytics) return;
    gaSetUserProperties(analytics, props);
  } catch {}
}

export async function signUpWithFirebase(email: string, password: string, displayName?: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(userCredential.user, { displayName });
  }

  // Send email verification to the newly created user with an action URL
  let emailSent = false;
  let sendError: string | undefined;
  try {
    const actionCodeSettings = {
      // After email verification, Firebase will redirect the user back to this URL
      url: `${window.location.origin}/auth/post-verify`,
      handleCodeInApp: true,
    };
    await sendEmailVerification(userCredential.user, actionCodeSettings);
    emailSent = true;
  } catch (err: any) {
    console.warn('Failed to send verification email:', err);
    sendError = err?.message || String(err);
    // don't throw here — return info so the UI can surface a clear message and allow retry
  }

  return { userCredential, emailSent, sendError };
}

// Sign in or sign up using Google OAuth provider (popup)
export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const isNew = (result as any)?.additionalUserInfo?.isNewUser ?? false;

    // If this is a newly created user via Google, grant default entitlements and mark verified
    if (isNew && user?.uid) {
      try {
        await grantDefaultEntitlements(user.uid);
      } catch (err) {
        console.warn('Failed to grant entitlements to new Google user:', err);
      }
    }

    return { user, isNew, result };
  } catch (err: any) {
    console.warn('Google sign-in failed:', err);
    return { error: err?.message || String(err) };
  }
}

// Apply a verification action code (used by the post-verify route)
export async function applyVerificationCode(oobCode: string) {
  return applyActionCode(auth, oobCode);
}

// Grant default entitlements (image, video, audio) to a user by creating/updating
// a Firestore document under `users/{uid}`. In production, prefer using Admin SDK
// or a cloud function to set secure custom claims instead of client-side writes.
export async function grantDefaultEntitlements(uid: string) {
  if (!uid) throw new Error('uid is required');
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    entitlements: {
      image: true,
      video: true,
      audio: true,
    },
    verified: true,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

// Read or create a simple profile in Firestore for the given uid
export async function getUserProfile(uid: string) {
  if (!uid) return null;
  const userRef = doc(db, 'users', uid);
  // Firestore v9 modular: use getDoc
  try {
    const { getDoc } = await import('firebase/firestore');
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    // create default profile
    const defaultProfile = {
      name: 'Creator',
      email: null,
      plan: 'free',
      credits: 3,
      role: 'user',
      entitlements: { image: false, video: false, audio: false },
      verified: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(userRef, defaultProfile, { merge: true });
    return defaultProfile;
  } catch (err) {
    console.warn('getUserProfile error', err);
    return null;
  }
}

// Update user credits in Firestore
export async function updateUserCreditsInFirebase(uid: string, newCredits: number) {
  if (!uid) throw new Error('uid is required');
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    credits: Math.max(0, newCredits), // Ensure credits never go below 0
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

// Deduct 1 credit from user (for generation operations)
export async function deductCreditInFirebase(uid: string) {
  if (!uid) throw new Error('uid is required');
  const userRef = doc(db, 'users', uid);
  const { getDoc } = await import('firebase/firestore');
  
  const docSnap = await getDoc(userRef);
  if (docSnap.exists()) {
    const currentCredits = docSnap.data().credits ?? 3;
    const newCredits = Math.max(0, currentCredits - 1);
    await setDoc(userRef, {
      credits: newCredits,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return newCredits;
  }
  return 0;
}

// Get all users from Firestore (admin only - should be protected by security rules)
export async function getAllUsersFromFirestore() {
  try {
    const { collection, getDocs } = await import('firebase/firestore');
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);
    
    const users: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        id: doc.id,
        name: data.name || data.displayName || 'Creator',
        email: data.email || '',
        role: data.role || 'user',
        plan: data.plan || 'free',
        credits: data.credits ?? 3,
        isRegistered: true,
        isVerified: !!data.verified,
        gallery: [],
        joinedAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now(),
      });
    });
    
    return users;
  } catch (err) {
    console.error('getAllUsersFromFirestore error', err);
    return [];
  }
}

/**
 * Read all Firestore `users` documents and return a flattened array.
 * Note: This uses client SDK reads; ensure your Firestore rules permit this.
 */
export async function getAllFirebaseUsers() {
  try {
    const { collection, getDocs } = await import('firebase/firestore');
    const colRef = collection(db, 'users');
    const snap = await getDocs(colRef);
    return snap.docs.map(d => {
      const data = d.data() as any;
      return {
        id: d.id,
        name: data.name || data.full_name || 'Creator',
        email: data.email || null,
        role: data.role || 'user',
        plan: data.plan || 'free',
        credits: data.credits ?? 0,
        status: data.status || 'active',
        entitlements: data.entitlements || {},
        verified: !!data.verified,
        avatarUrl: data.avatarUrl || data.avatar_url || null,
        raw: data
      };
    });
  } catch (err: any) {
    console.warn('getAllFirebaseUsers error', err?.message || err);
    return [];
  }
}

/**
 * Save generated audio to Firestore
 */
export async function saveAudioToFirebase(audio: GeneratedAudio, userId: string): Promise<void> {
  try {
    const audioDocRef = doc(db, 'users', userId, 'audio', audio.id);

    // Prefer a persisted data URL over transient blob URLs so audio survives reloads/logouts
    const persistedUrl = audio.base64Audio || audio.url;
    const payload: Record<string, any> = {
      id: audio.id,
      url: persistedUrl,
      text: audio.text,
      voice: audio.voice,
      createdAt: serverTimestamp(),
      isCloned: audio.isCloned || false,
      type: 'audio'
    };

    if (audio.base64Audio) payload.base64Audio = audio.base64Audio;
    if ((audio as any)?.engine) payload.engine = (audio as any).engine;
    if ((audio as any)?.mimeType) payload.mimeType = (audio as any).mimeType;

    await setDoc(audioDocRef, payload);

    console.log('✅ Audio saved to Firebase:', audio.id);
  } catch (err: any) {
    console.error('❌ Failed to save audio to Firebase:', err.message || err);
    throw err;
  }
}

/**
 * Retrieve all generated audio files for a user from Firestore
 */
export async function getAudioFromFirebase(userId: string): Promise<GeneratedAudio[]> {
  try {
    const audioCollectionRef = collection(db, 'users', userId, 'audio');
    const audioQuery = query(audioCollectionRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(audioQuery);
    
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const resolvedUrl = data.base64Audio || data.url;
      return {
        id: data.id,
        url: resolvedUrl,
        text: data.text,
        voice: data.voice,
        createdAt: data.createdAt?.toMillis?.() || Date.now(),
        isCloned: data.isCloned || false,
        engine: data.engine || 'gemini',
        base64Audio: data.base64Audio,
        mimeType: data.mimeType,
      } as GeneratedAudio;
    });
  } catch (err: any) {
    console.error('❌ Failed to retrieve audio from Firebase:', err.message || err);
    return [];
  }
}

/**
 * Delete an audio file from Firestore
 */
export async function deleteAudioFromFirebase(userId: string, audioId: string): Promise<void> {
  try {
    const { deleteDoc } = await import('firebase/firestore');
    const audioDocRef = doc(db, 'users', userId, 'audio', audioId);
    
    await deleteDoc(audioDocRef);
    console.log('✅ Audio deleted from Firebase:', audioId);
  } catch (err: any) {
    console.error('❌ Failed to delete audio from Firebase:', err.message || err);
    throw err;
  }
}

/**
 * Save generated image to Firestore
 */
export async function saveImageToFirebase(image: GeneratedImage, userId: string): Promise<void> {
  try {
    const imageDocRef = doc(db, 'users', userId, 'images', image.id);
    await setDoc(imageDocRef, {
      id: image.id,
      url: image.url,
      prompt: image.prompt,
      createdAt: serverTimestamp(),
      type: 'image'
    });
    console.log('✅ Image saved to Firebase:', image.id);
  } catch (err: any) {
    console.error('❌ Failed to save image to Firebase:', err.message || err);
    throw err;
  }
}

/**
 * Retrieve images from Firestore for a user
 */
export async function getImagesFromFirebase(userId: string): Promise<GeneratedImage[]> {
  try {
    const imagesCollectionRef = collection(db, 'users', userId, 'images');
    const imagesQuery = query(imagesCollectionRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(imagesQuery);
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: data.id,
        url: data.url,
        prompt: data.prompt,
        createdAt: data.createdAt?.toMillis?.() || Date.now(),
      } as GeneratedImage;
    });
  } catch (err: any) {
    console.error('❌ Failed to retrieve images from Firebase:', err.message || err);
    return [];
  }
}

/**
 * Delete an image from Firestore
 */
export async function deleteImageFromFirebase(userId: string, imageId: string): Promise<void> {
  try {
    const { deleteDoc } = await import('firebase/firestore');
    const imageDocRef = doc(db, 'users', userId, 'images', imageId);
    await deleteDoc(imageDocRef);
    console.log('✅ Image deleted from Firebase:', imageId);
  } catch (err: any) {
    console.error('❌ Failed to delete image from Firebase:', err.message || err);
    throw err;
  }
}

/**
 * Save generated video to Firestore
 */
export async function saveVideoToFirebase(video: GeneratedVideo, userId: string): Promise<void> {
  try {
    const videoDocRef = doc(db, 'users', userId, 'videos', video.id);
    await setDoc(videoDocRef, {
      id: video.id,
      url: video.url,
      uri: video.uri,
      prompt: video.prompt,
      createdAt: serverTimestamp(),
      aspectRatio: video.aspectRatio,
      resolution: video.resolution,
      type: 'video'
    });
    console.log('✅ Video saved to Firebase:', video.id);
  } catch (err: any) {
    console.error('❌ Failed to save video to Firebase:', err.message || err);
    throw err;
  }
}

/**
 * Retrieve videos from Firestore for a user
 */
export async function getVideosFromFirebase(userId: string): Promise<GeneratedVideo[]> {
  try {
    const videosCollectionRef = collection(db, 'users', userId, 'videos');
    const videosQuery = query(videosCollectionRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(videosQuery);
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: data.id,
        url: data.url,
        uri: data.uri,
        prompt: data.prompt,
        createdAt: data.createdAt?.toMillis?.() || Date.now(),
        aspectRatio: data.aspectRatio,
        resolution: data.resolution,
      } as GeneratedVideo;
    });
  } catch (err: any) {
    console.error('❌ Failed to retrieve videos from Firebase:', err.message || err);
    return [];
  }
}

/**
 * Delete a video from Firestore
 */
export async function deleteVideoFromFirebase(userId: string, videoId: string): Promise<void> {
  try {
    const { deleteDoc } = await import('firebase/firestore');
    const videoDocRef = doc(db, 'users', userId, 'videos', videoId);
    await deleteDoc(videoDocRef);
    console.log('✅ Video deleted from Firebase:', videoId);
  } catch (err: any) {
    console.error('❌ Failed to delete video from Firebase:', err.message || err);
    throw err;
  }
}

/**
 * Get analytics data from Firestore
 * Includes page views, user activity, and conversion metrics
 */
export async function getAnalyticsFromFirebase(days: number = 30) {
  try {
    const { collection, getDocs, query, where, orderBy: firestoreOrderBy, Timestamp } = await import('firebase/firestore');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

    // Get page views
    const pageViewsRef = collection(db, 'analytics', 'events', 'pageviews');
    const pageViewsQuery = query(
      pageViewsRef,
      where('timestamp', '>=', cutoffTimestamp),
      firestoreOrderBy('timestamp', 'desc')
    );
    const pageViewsSnapshot = await getDocs(pageViewsQuery);
    const pageViews = pageViewsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toMillis?.() || Date.now()
    }));

    // Get user registrations
    const usersRef = collection(db, 'users');
    const usersQuery = query(
      usersRef,
      where('createdAt', '>=', cutoffTimestamp),
      firestoreOrderBy('createdAt', 'desc')
    );
    const usersSnapshot = await getDocs(usersQuery);
    const newUsers = usersSnapshot.size;

    // Get conversions (purchases)
    const conversionsRef = collection(db, 'analytics', 'events', 'conversions');
    const conversionsQuery = query(
      conversionsRef,
      where('timestamp', '>=', cutoffTimestamp),
      firestoreOrderBy('timestamp', 'desc')
    );
    const conversionsSnapshot = await getDocs(conversionsQuery);
    const conversions = conversionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toMillis?.() || Date.now()
    }));

    return {
      pageViews,
      newUsers,
      conversions,
      totalPageViews: pageViews.length,
      totalConversions: conversions.length,
      conversionRate: pageViews.length > 0 ? (conversions.length / pageViews.length) * 100 : 0
    };
  } catch (err: any) {
    console.error('❌ Failed to get analytics from Firebase:', err.message || err);
    return {
      pageViews: [],
      newUsers: 0,
      conversions: [],
      totalPageViews: 0,
      totalConversions: 0,
      conversionRate: 0
    };
  }
}

/**
 * Track analytics event to Firestore
 */
export async function trackAnalyticsEvent(eventType: string, data: any) {
  try {
    const { collection, addDoc } = await import('firebase/firestore');
    const eventsRef = collection(db, 'analytics', 'events', eventType);
    
    await addDoc(eventsRef, {
      ...data,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
      referrer: document.referrer || 'direct',
    });
  } catch (err: any) {
    console.error('❌ Failed to track analytics event:', err.message || err);
  }
}

/**
 * Update user profile in Firestore (admin function)
 */
export async function updateUserProfile(userId: string, updates: any) {
  try {
    const { updateDoc } = await import('firebase/firestore');
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ User profile updated:', userId);
  } catch (err: any) {
    console.error('❌ Failed to update user profile:', err.message || err);
    throw err;
  }
}

/**
 * Suspend or activate a user account
 */
export async function updateUserStatus(userId: string, status: 'active' | 'suspended', reason?: string) {
  try {
    const { updateDoc } = await import('firebase/firestore');
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      status,
      statusReason: reason || null,
      statusUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Log the status change
    const { collection, addDoc } = await import('firebase/firestore');
    await addDoc(collection(db, 'admin_logs'), {
      action: 'user_status_change',
      userId,
      newStatus: status,
      reason: reason || null,
      timestamp: serverTimestamp()
    });
    
    console.log(`✅ User ${status}:`, userId);
  } catch (err: any) {
    console.error('❌ Failed to update user status:', err.message || err);
    throw err;
  }
}

/**
 * Add credits to a user account
 */
export async function addUserCredits(userId: string, amount: number, reason?: string) {
  try {
    const { updateDoc, increment } = await import('firebase/firestore');
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      credits: increment(amount),
      updatedAt: serverTimestamp()
    });
    
    // Log the credit transaction
    const { collection, addDoc } = await import('firebase/firestore');
    await addDoc(collection(db, 'credit_transactions'), {
      userId,
      amount,
      type: 'admin_grant',
      reason: reason || 'Admin credit grant',
      timestamp: serverTimestamp()
    });
    
    console.log(`✅ Added ${amount} credits to user:`, userId);
  } catch (err: any) {
    console.error('❌ Failed to add user credits:', err.message || err);
    throw err;
  }
}

/**
 * Send email to user (stores in Firestore for email service to process)
 */
export async function sendEmailToUser(userId: string, subject: string, content: string, userEmail?: string) {
  try {
    const { collection, addDoc } = await import('firebase/firestore');
    const emailsRef = collection(db, 'mail');
    
    // Get user email if not provided
    let recipientEmail = userEmail;
    if (!recipientEmail) {
      const { getDoc } = await import('firebase/firestore');
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      recipientEmail = userDoc.data()?.email;
    }
    
    if (!recipientEmail) {
      throw new Error('User email not found');
    }
    
    await addDoc(emailsRef, {
      to: recipientEmail,
      message: {
        subject,
        text: content,
        html: `<p>${content.replace(/\n/g, '<br>')}</p>`
      },
      userId,
      timestamp: serverTimestamp(),
      status: 'pending'
    });
    
    console.log('✅ Email queued for user:', userId);
  } catch (err: any) {
    console.error('❌ Failed to send email to user:', err.message || err);
    throw err;
  }
}

/**
 * Track user IP address
 */
export async function trackUserIP(userId: string, ipAddress: string, location?: any) {
  try {
    const { collection, addDoc } = await import('firebase/firestore');
    const ipLogsRef = collection(db, 'users', userId, 'ip_logs');
    
    await addDoc(ipLogsRef, {
      ipAddress,
      location: location || null,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent
    });
    
    // Update user's last known IP
    const { updateDoc } = await import('firebase/firestore');
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      lastIP: ipAddress,
      lastIPTimestamp: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
  } catch (err: any) {
    console.error('❌ Failed to track user IP:', err.message || err);
  }
}

/**
 * Get user IP logs
 */
export async function getUserIPLogs(userId: string) {
  try {
    const { collection, getDocs, query, orderBy: firestoreOrderBy } = await import('firebase/firestore');
    const ipLogsRef = collection(db, 'users', userId, 'ip_logs');
    const ipLogsQuery = query(ipLogsRef, firestoreOrderBy('timestamp', 'desc'));
    const snapshot = await getDocs(ipLogsQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toMillis?.() || Date.now()
    }));
  } catch (err: any) {
    console.error('❌ Failed to get user IP logs:', err.message || err);
    return [];
  }
}

/**
 * Block an IP address
 */
export async function blockIPAddress(ipAddress: string, reason?: string) {
  try {
    const { collection, setDoc } = await import('firebase/firestore');
    const blockedIPRef = doc(db, 'blocked_ips', ipAddress.replace(/\./g, '_'));
    
    await setDoc(blockedIPRef, {
      ipAddress,
      reason: reason || 'Blocked by admin',
      blockedAt: serverTimestamp(),
      active: true
    });
    
    console.log('✅ IP address blocked:', ipAddress);
  } catch (err: any) {
    console.error('❌ Failed to block IP address:', err.message || err);
    throw err;
  }
}

/**
 * Unblock an IP address
 */
export async function unblockIPAddress(ipAddress: string) {
  try {
    const { updateDoc } = await import('firebase/firestore');
    const blockedIPRef = doc(db, 'blocked_ips', ipAddress.replace(/\./g, '_'));
    
    await updateDoc(blockedIPRef, {
      active: false,
      unblockedAt: serverTimestamp()
    });
    
    console.log('✅ IP address unblocked:', ipAddress);
  } catch (err: any) {
    console.error('❌ Failed to unblock IP address:', err.message || err);
    throw err;
  }
}

/**
 * Check if an IP address is blocked
 */
export async function isIPBlocked(ipAddress: string): Promise<boolean> {
  try {
    const { getDoc } = await import('firebase/firestore');
    const blockedIPRef = doc(db, 'blocked_ips', ipAddress.replace(/\./g, '_'));
    const blockedIPDoc = await getDoc(blockedIPRef);
    
    if (blockedIPDoc.exists()) {
      return blockedIPDoc.data().active === true;
    }
    return false;
  } catch (err: any) {
    console.error('❌ Failed to check if IP is blocked:', err.message || err);
    return false;
  }
}

/**
 * Get all blocked IPs
 */
export async function getBlockedIPs() {
  try {
    const { collection, getDocs, query, where } = await import('firebase/firestore');
    const blockedIPsRef = collection(db, 'blocked_ips');
    const blockedIPsQuery = query(blockedIPsRef, where('active', '==', true));
    const snapshot = await getDocs(blockedIPsQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (err: any) {
    console.error('❌ Failed to get blocked IPs:', err.message || err);
    return [];
  }
}

/**
 * Track AI generation activity (Image, Video, Audio)
 */
export async function trackGeneration(userId: string, userName: string, userEmail: string, type: 'image' | 'video' | 'audio', prompt: string, engine?: string) {
  try {
    const { collection, addDoc } = await import('firebase/firestore');
    const generationsRef = collection(db, 'live_generations');
    
    await addDoc(generationsRef, {
      userId,
      userName,
      userEmail,
      type,
      prompt,
      engine: engine || 'gemini',
      timestamp: serverTimestamp(),
      status: 'processing',
      createdAt: serverTimestamp()
    });
    
    console.log(`✅ Generation tracked: ${type} by ${userName}`);
  } catch (err: any) {
    console.error('❌ Failed to track generation:', err.message || err);
  }
}

/**
 * Update generation status
 */
export async function updateGenerationStatus(generationId: string, status: 'processing' | 'completed' | 'failed') {
  try {
    const { updateDoc } = await import('firebase/firestore');
    const generationRef = doc(db, 'live_generations', generationId);
    
    await updateDoc(generationRef, {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (err: any) {
    console.error('❌ Failed to update generation status:', err.message || err);
  }
}

/**
 * Get live generations (last 50 active generations)
 */
export async function getLiveGenerations() {
  try {
    const { collection, getDocs, query, orderBy: firestoreOrderBy, limit } = await import('firebase/firestore');
    const generationsRef = collection(db, 'live_generations');
    const generationsQuery = query(
      generationsRef,
      firestoreOrderBy('timestamp', 'desc'),
      limit(50)
    );
    const snapshot = await getDocs(generationsQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toMillis?.() || Date.now()
    }));
  } catch (err: any) {
    console.error('❌ Failed to get live generations:', err.message || err);
    return [];
  }
}

/**
 * Get generation analytics (counts by type)
 */
export async function getGenerationAnalytics(days: number = 7) {
  try {
    const { collection, getDocs, query, where, orderBy: firestoreOrderBy, Timestamp } = await import('firebase/firestore');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

    const generationsRef = collection(db, 'live_generations');
    const generationsQuery = query(
      generationsRef,
      where('timestamp', '>=', cutoffTimestamp),
      firestoreOrderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(generationsQuery);
    
    const generations = snapshot.docs.map(doc => doc.data());
    
    // Calculate analytics
    const totalGenerations = generations.length;
    const imageCount = generations.filter(g => g.type === 'image').length;
    const videoCount = generations.filter(g => g.type === 'video').length;
    const audioCount = generations.filter(g => g.type === 'audio').length;
    
    const completedCount = generations.filter(g => g.status === 'completed').length;
    const processingCount = generations.filter(g => g.status === 'processing').length;
    const failedCount = generations.filter(g => g.status === 'failed').length;
    
    // Unique users
    const uniqueUsers = new Set(generations.map(g => g.userId)).size;
    
    // Most active users
    const userActivity: Record<string, number> = {};
    generations.forEach(g => {
      userActivity[g.userId] = (userActivity[g.userId] || 0) + 1;
    });
    const topUsers = Object.entries(userActivity)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([userId, count]) => {
        const userGen = generations.find(g => g.userId === userId);
        return {
          userId,
          userName: userGen?.userName || 'Unknown',
          count
        };
      });
    
    return {
      totalGenerations,
      imageCount,
      videoCount,
      audioCount,
      completedCount,
      processingCount,
      failedCount,
      uniqueUsers,
      topUsers,
      successRate: totalGenerations > 0 ? (completedCount / totalGenerations) * 100 : 0
    };
  } catch (err: any) {
    console.error('❌ Failed to get generation analytics:', err.message || err);
    return {
      totalGenerations: 0,
      imageCount: 0,
      videoCount: 0,
      audioCount: 0,
      completedCount: 0,
      processingCount: 0,
      failedCount: 0,
      uniqueUsers: 0,
      topUsers: [],
      successRate: 0
    };
  }
}

