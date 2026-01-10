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
    // Set scopes for Google Sign-In
    provider.addScope('profile');
    provider.addScope('email');
    
    // Set custom parameters to force account selection
    provider.setCustomParameters({
      'prompt': 'select_account'
    });

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
    console.warn('Google sign-in error:', err);
    // Return more helpful error messages
    let errorMessage = err?.message || String(err);
    
    if (err?.code === 'auth/popup-blocked') {
      errorMessage = 'Sign-in popup was blocked. Please allow popups for this site.';
    } else if (err?.code === 'auth/popup-closed-by-user') {
      errorMessage = 'Sign-in popup was closed. Please try again.';
    } else if (err?.code === 'auth/internal-error') {
      errorMessage = 'Authentication service error. Please ensure Google Sign-In is properly configured in Firebase Console.';
    } else if (err?.code === 'auth/operation-not-supported-in-this-environment') {
      errorMessage = 'Sign-in is not supported in this environment.';
    }
    
    return { error: errorMessage };
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

// ============================================
// CREDIT SYSTEM - AI COST CONTROL
// ============================================

/**
 * Get credit configuration
 */
export async function getCreditConfig() {
  try {
    const { doc: firestoreDoc, getDoc } = await import('firebase/firestore');
    const configRef = firestoreDoc(db, 'system_config', 'credit_config');
    const configDoc = await getDoc(configRef);
    
    if (configDoc.exists()) {
      return configDoc.data();
    }
    
    // Return default config if not set
    return {
      imageCost: 1,
      videoCostPerSecond: 5,
      voiceCostPerMinute: 2,
      chatCostPerToken: 0.001,
      imageHDCost: 2,
      video4KCost: 10,
      freeSignupCredits: 10,
      basicPlanCredits: 100,
      premiumPlanCredits: 500,
      updatedAt: Date.now()
    };
  } catch (err: any) {
    console.error('❌ Failed to get credit config:', err.message || err);
    throw err;
  }
}

/**
 * Update credit configuration (admin only)
 */
export async function updateCreditConfig(config: any, adminId: string, adminEmail: string) {
  try {
    const { doc: firestoreDoc, setDoc, serverTimestamp: firestoreServerTimestamp } = await import('firebase/firestore');
    const configRef = firestoreDoc(db, 'system_config', 'credit_config');
    
    await setDoc(configRef, {
      ...config,
      updatedAt: Date.now(),
      updatedBy: adminEmail
    });
    
    // Log admin action
    await logAdminAudit(adminId, adminEmail, 'edit_config', 'config', 'credit_config', 
      'Updated credit configuration', config);
    
    console.log('✅ Credit config updated successfully');
  } catch (err: any) {
    console.error('❌ Failed to update credit config:', err.message || err);
    throw err;
  }
}

/**
 * Check if user has enough credits for an action
 */
export async function checkUserCredits(userId: string, requiredCredits: number): Promise<{
  hasEnough: boolean;
  currentBalance: number;
  status: string;
}> {
  try {
    const { doc: firestoreDoc, getDoc } = await import('firebase/firestore');
    const userRef = firestoreDoc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { hasEnough: false, currentBalance: 0, status: 'User not found' };
    }
    
    const userData = userDoc.data();
    const currentBalance = userData.credits || 0;
    const accountStatus = userData.status || 'active';
    
    if (accountStatus === 'suspended') {
      return { hasEnough: false, currentBalance, status: 'Account suspended' };
    }
    
    if (currentBalance < requiredCredits) {
      return { hasEnough: false, currentBalance, status: 'Insufficient credits' };
    }
    
    return { hasEnough: true, currentBalance, status: 'OK' };
  } catch (err: any) {
    console.error('❌ Failed to check user credits:', err.message || err);
    throw err;
  }
}

/**
 * Deduct credits from user and log the transaction
 */
export async function deductUserCredits(
  userId: string,
  amount: number,
  aiType: 'image' | 'video' | 'voice' | 'chat',
  reason: string,
  metadata?: any
): Promise<{ success: boolean; newBalance: number }> {
  try {
    const { doc: firestoreDoc, getDoc, updateDoc, collection: firestoreCollection, addDoc, serverTimestamp: firestoreServerTimestamp } = await import('firebase/firestore');
    
    const userRef = firestoreDoc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const currentBalance = userData.credits || 0;
    
    if (currentBalance < amount) {
      throw new Error('Insufficient credits');
    }
    
    const newBalance = currentBalance - amount;
    
    // Update user credits
    await updateDoc(userRef, {
      credits: newBalance,
      lastCreditUpdate: Date.now()
    });
    
    // Log credit transaction
    const creditLogsRef = firestoreCollection(db, 'credit_logs');
    await addDoc(creditLogsRef, {
      userId,
      userEmail: userData.email || 'unknown',
      type: 'deduction',
      amount,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      reason,
      aiType,
      metadata: metadata || {},
      timestamp: Date.now(),
      ipAddress: metadata?.ipAddress || null
    });
    
    console.log(`✅ Deducted ${amount} credits from user ${userId}. New balance: ${newBalance}`);
    
    return { success: true, newBalance };
  } catch (err: any) {
    console.error('❌ Failed to deduct credits:', err.message || err);
    throw err;
  }
}

/**
 * Grant credits to user (admin action)
 */
export async function grantUserCredits(
  userId: string,
  amount: number,
  reason: string,
  adminId: string,
  adminEmail: string,
  type: 'grant' | 'bonus' | 'refund' = 'grant'
): Promise<{ success: boolean; newBalance: number }> {
  try {
    const { doc: firestoreDoc, getDoc, updateDoc, collection: firestoreCollection, addDoc } = await import('firebase/firestore');
    
    const userRef = firestoreDoc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const currentBalance = userData.credits || 0;
    const newBalance = currentBalance + amount;
    
    // Update user credits
    await updateDoc(userRef, {
      credits: newBalance,
      lastCreditUpdate: Date.now()
    });
    
    // Log credit transaction
    const creditLogsRef = firestoreCollection(db, 'credit_logs');
    await addDoc(creditLogsRef, {
      userId,
      userEmail: userData.email || 'unknown',
      type,
      amount,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      reason,
      metadata: {
        adminId,
        adminEmail
      },
      timestamp: Date.now()
    });
    
    // Log admin action
    await logAdminAudit(adminId, adminEmail, 'grant_credits', 'user', userId,
      `Granted ${amount} credits to ${userData.email}`, { amount, reason });
    
    console.log(`✅ Granted ${amount} credits to user ${userId}. New balance: ${newBalance}`);
    
    return { success: true, newBalance };
  } catch (err: any) {
    console.error('❌ Failed to grant credits:', err.message || err);
    throw err;
  }
}

/**
 * Log AI usage
 */
export async function logAIUsage(
  userId: string,
  aiType: 'image' | 'video' | 'voice' | 'chat',
  service: string,
  creditsUsed: number,
  status: 'success' | 'failed' | 'pending',
  metadata?: {
    prompt?: string;
    duration?: number;
    tokens?: number;
    outputUrl?: string;
    errorMessage?: string;
    ipAddress?: string;
    deviceInfo?: string;
  }
) {
  try {
    const { collection: firestoreCollection, addDoc, doc: firestoreDoc, getDoc } = await import('firebase/firestore');
    const crypto = await import('crypto');
    
    // Get user email
    const userRef = firestoreDoc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const userEmail = userDoc.exists() ? userDoc.data().email : 'unknown';
    
    // Hash prompt for privacy
    const promptHash = metadata?.prompt 
      ? crypto.createHash('sha256').update(metadata.prompt).digest('hex').substring(0, 16)
      : null;
    
    const usageLogsRef = firestoreCollection(db, 'usage_logs');
    await addDoc(usageLogsRef, {
      userId,
      userEmail,
      aiType,
      service,
      creditsUsed,
      status,
      prompt: metadata?.prompt?.substring(0, 200) || null,
      promptHash,
      duration: metadata?.duration || null,
      tokens: metadata?.tokens || null,
      outputUrl: metadata?.outputUrl || null,
      errorMessage: metadata?.errorMessage || null,
      metadata: metadata || {},
      timestamp: Date.now(),
      ipAddress: metadata?.ipAddress || null,
      deviceInfo: metadata?.deviceInfo || null
    });
    
    console.log(`✅ Logged AI usage for user ${userId}`);
  } catch (err: any) {
    console.error('❌ Failed to log AI usage:', err.message || err);
    // Don't throw - logging failure shouldn't break the main flow
  }
}

/**
 * Get credit logs for a user
 */
export async function getCreditLogs(userId: string, limit: number = 50) {
  try {
    const { collection, getDocs, query, where, orderBy: firestoreOrderBy, limit: firestoreLimit } = await import('firebase/firestore');
    
    const logsRef = collection(db, 'credit_logs');
    const logsQuery = query(
      logsRef,
      where('userId', '==', userId),
      firestoreOrderBy('timestamp', 'desc'),
      firestoreLimit(limit)
    );
    
    const snapshot = await getDocs(logsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (err: any) {
    console.error('❌ Failed to get credit logs:', err.message || err);
    return [];
  }
}

/**
 * Get usage logs for a user
 */
export async function getUsageLogs(userId: string, limit: number = 50) {
  try {
    const { collection, getDocs, query, where, orderBy: firestoreOrderBy, limit: firestoreLimit } = await import('firebase/firestore');
    
    const logsRef = collection(db, 'usage_logs');
    const logsQuery = query(
      logsRef,
      where('userId', '==', userId),
      firestoreOrderBy('timestamp', 'desc'),
      firestoreLimit(limit)
    );
    
    const snapshot = await getDocs(logsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (err: any) {
    console.error('❌ Failed to get usage logs:', err.message || err);
    return [];
  }
}

/**
 * Get global credit usage statistics
 */
export async function getGlobalCreditStats(days: number = 30) {
  try {
    const { collection, getDocs, query, where, orderBy: firestoreOrderBy, Timestamp } = await import('firebase/firestore');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    // Get usage logs
    const logsRef = collection(db, 'usage_logs');
    const logsQuery = query(
      logsRef,
      where('timestamp', '>=', cutoffDate.getTime()),
      firestoreOrderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(logsQuery);
    const logs = snapshot.docs.map(doc => doc.data());
    
    // Calculate stats
    const totalCreditsUsed = logs.reduce((sum, log) => sum + (log.creditsUsed || 0), 0);
    const totalGenerations = logs.length;
    
    const byType = {
      image: { count: 0, credits: 0 },
      video: { count: 0, credits: 0 },
      voice: { count: 0, credits: 0 },
      chat: { count: 0, credits: 0 }
    };
    
    logs.forEach(log => {
      if (log.aiType && byType[log.aiType as keyof typeof byType]) {
        byType[log.aiType as keyof typeof byType].count++;
        byType[log.aiType as keyof typeof byType].credits += log.creditsUsed || 0;
      }
    });
    
    // Top users by credits
    const userCredits: Record<string, { email: string; credits: number; count: number }> = {};
    logs.forEach(log => {
      if (!userCredits[log.userId]) {
        userCredits[log.userId] = {
          email: log.userEmail || 'unknown',
          credits: 0,
          count: 0
        };
      }
      userCredits[log.userId].credits += log.creditsUsed || 0;
      userCredits[log.userId].count++;
    });
    
    const byUser = Object.entries(userCredits)
      .map(([userId, data]) => ({
        userId,
        userEmail: data.email,
        totalCredits: data.credits,
        generationCount: data.count
      }))
      .sort((a, b) => b.totalCredits - a.totalCredits)
      .slice(0, 10);
    
    return {
      totalCreditsUsed,
      totalGenerations,
      byType,
      byUser,
      timeRange: {
        start: cutoffDate.getTime(),
        end: Date.now()
      }
    };
  } catch (err: any) {
    console.error('❌ Failed to get global credit stats:', err.message || err);
    
    // Calculate fallback timeRange
    const fallbackDays = 30;
    
    return {
      totalCreditsUsed: 0,
      totalGenerations: 0,
      byType: {
        image: { count: 0, credits: 0 },
        video: { count: 0, credits: 0 },
        voice: { count: 0, credits: 0 },
        chat: { count: 0, credits: 0 }
      },
      byUser: [],
      timeRange: {
        start: Date.now() - (fallbackDays * 24 * 60 * 60 * 1000),
        end: Date.now()
      }
    };
  }
}

// ============================================
// REAL-TIME AI ACTIVITY MONITORING
// ============================================

/**
 * Create or update live AI activity
 */
export async function createAIActivity(
  userId: string,
  aiType: 'image' | 'video' | 'voice' | 'chat',
  service: string,
  prompt: string,
  creditsUsed: number,
  metadata?: {
    ipAddress?: string;
    country?: string;
    deviceInfo?: string;
  }
): Promise<string> {
  try {
    const { collection: firestoreCollection, addDoc, doc: firestoreDoc, getDoc } = await import('firebase/firestore');
    const crypto = await import('crypto');
    
    // Get user info
    const userRef = firestoreDoc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.exists() ? userDoc.data() : {};
    
    // Hash full prompt, truncate for display
    const promptHash = crypto.createHash('sha256').update(prompt).digest('hex').substring(0, 16);
    const truncatedPrompt = prompt.substring(0, 100) + (prompt.length > 100 ? '...' : '');
    
    const activityRef = firestoreCollection(db, 'ai_activity');
    const docRef = await addDoc(activityRef, {
      userId,
      userEmail: userData.email || 'unknown',
      userName: userData.name || 'Unknown User',
      aiType,
      service,
      prompt: truncatedPrompt,
      promptHash,
      creditsUsed,
      status: 'pending',
      progress: 0,
      timestamp: Date.now(),
      ipAddress: metadata?.ipAddress || null,
      country: metadata?.country || userData.country || null,
      deviceInfo: metadata?.deviceInfo || null
    });
    
    console.log(`✅ Created AI activity ${docRef.id}`);
    return docRef.id;
  } catch (err: any) {
    console.error('❌ Failed to create AI activity:', err.message || err);
    throw err;
  }
}

/**
 * Update AI activity status
 */
export async function updateAIActivity(
  activityId: string,
  updates: {
    status?: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    resultUrl?: string;
    errorMessage?: string;
  }
) {
  try {
    const { doc: firestoreDoc, updateDoc } = await import('firebase/firestore');
    
    const activityRef = firestoreDoc(db, 'ai_activity', activityId);
    const updateData: any = { ...updates };
    
    if (updates.status === 'completed' || updates.status === 'failed') {
      updateData.completedAt = Date.now();
    }
    
    await updateDoc(activityRef, updateData);
    console.log(`✅ Updated AI activity ${activityId}`);
  } catch (err: any) {
    console.error('❌ Failed to update AI activity:', err.message || err);
    // Don't throw - update failure shouldn't break main flow
  }
}

/**
 * Subscribe to real-time AI activity (Firestore onSnapshot)
 */
export function subscribeToAIActivity(
  callback: (activities: any[]) => void,
  limit: number = 50
): () => void {
  try {
    const { collection, query, orderBy: firestoreOrderBy, limit: firestoreLimit, onSnapshot } = require('firebase/firestore');
    
    const activityRef = collection(db, 'ai_activity');
    const activityQuery = query(
      activityRef,
      firestoreOrderBy('timestamp', 'desc'),
      firestoreLimit(limit)
    );
    
    const unsubscribe = onSnapshot(activityQuery, (snapshot: any) => {
      const activities = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(activities);
    });
    
    return unsubscribe;
  } catch (err: any) {
    console.error('❌ Failed to subscribe to AI activity:', err.message || err);
    return () => {};
  }
}

/**
 * Get AI activity history
 */
export async function getAIActivity(limit: number = 100) {
  try {
    const { collection, getDocs, query, orderBy: firestoreOrderBy, limit: firestoreLimit } = await import('firebase/firestore');
    
    const activityRef = collection(db, 'ai_activity');
    const activityQuery = query(
      activityRef,
      firestoreOrderBy('timestamp', 'desc'),
      firestoreLimit(limit)
    );
    
    const snapshot = await getDocs(activityQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (err: any) {
    console.error('❌ Failed to get AI activity:', err.message || err);
    return [];
  }
}

// ============================================
// SECURITY & ABUSE PREVENTION
// ============================================

/**
 * Check rate limit for user
 */
export async function checkRateLimit(
  userId: string,
  aiType: 'image' | 'video' | 'voice' | 'chat' | 'all'
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  try {
    const { doc: firestoreDoc, getDoc, setDoc, updateDoc } = await import('firebase/firestore');
    
    const rateLimitRef = firestoreDoc(db, 'rate_limits', `${userId}_${aiType}`);
    const rateLimitDoc = await getDoc(rateLimitRef);
    
    const now = Date.now();
    const windowMinutes = 60; // 1 hour window
    const maxRequests = aiType === 'image' ? 50 : aiType === 'video' ? 10 : 100;
    
    if (!rateLimitDoc.exists()) {
      // Create new rate limit record
      await setDoc(rateLimitRef, {
        userId,
        aiType,
        maxRequests,
        windowMinutes,
        currentCount: 1,
        windowStart: now
      });
      
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt: now + windowMinutes * 60 * 1000
      };
    }
    
    const data = rateLimitDoc.data();
    const windowStart = data.windowStart || now;
    const windowEnd = windowStart + windowMinutes * 60 * 1000;
    
    // Check if window has expired
    if (now > windowEnd) {
      // Reset window
      await updateDoc(rateLimitRef, {
        currentCount: 1,
        windowStart: now,
        blockedUntil: null
      });
      
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt: now + windowMinutes * 60 * 1000
      };
    }
    
    // Check if blocked
    if (data.blockedUntil && now < data.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: data.blockedUntil
      };
    }
    
    // Check if limit exceeded
    if (data.currentCount >= maxRequests) {
      await updateDoc(rateLimitRef, {
        blockedUntil: windowEnd
      });
      
      // Log abuse detection
      await logAbuseDetection(userId, 'rate_limit', 'medium', 
        `Rate limit exceeded for ${aiType}: ${data.currentCount}/${maxRequests}`);
      
      return {
        allowed: false,
        remaining: 0,
        resetAt: windowEnd
      };
    }
    
    // Increment count
    await updateDoc(rateLimitRef, {
      currentCount: data.currentCount + 1
    });
    
    return {
      allowed: true,
      remaining: maxRequests - data.currentCount - 1,
      resetAt: windowEnd
    };
  } catch (err: any) {
    console.error('❌ Failed to check rate limit:', err.message || err);
    // In case of error, allow request
    return { allowed: true, remaining: 0, resetAt: Date.now() };
  }
}

/**
 * Log abuse detection
 */
export async function logAbuseDetection(
  userId: string,
  abuseType: 'rate_limit' | 'inappropriate_prompt' | 'suspicious_activity' | 'credit_fraud',
  severity: 'low' | 'medium' | 'high' | 'critical',
  description: string,
  metadata?: any
) {
  try {
    const { collection: firestoreCollection, addDoc, doc: firestoreDoc, getDoc } = await import('firebase/firestore');
    
    const userRef = firestoreDoc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const userEmail = userDoc.exists() ? userDoc.data().email : 'unknown';
    
    const abuseRef = firestoreCollection(db, 'abuse_detection');
    await addDoc(abuseRef, {
      userId,
      userEmail,
      abuseType,
      severity,
      description,
      metadata: metadata || {},
      timestamp: Date.now()
    });
    
    console.log(`⚠️ Logged abuse detection for user ${userId}: ${abuseType}`);
    
    // Auto-suspend for critical abuse
    if (severity === 'critical') {
      await updateUserStatus(userId, 'suspended');
      console.log(`🚫 Auto-suspended user ${userId} due to critical abuse`);
    }
  } catch (err: any) {
    console.error('❌ Failed to log abuse detection:', err.message || err);
  }
}

/**
 * Moderate prompt (basic content filtering)
 */
export async function moderatePrompt(prompt: string): Promise<{
  allowed: boolean;
  reason?: string;
  flagged: string[];
}> {
  try {
    // Basic keyword filtering (expand as needed)
    const bannedKeywords = [
      'violence', 'gore', 'nsfw', 'nude', 'explicit',
      'illegal', 'weapon', 'drug', 'hate speech'
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
        reason: 'Prompt contains inappropriate content',
        flagged
      };
    }
    
    return {
      allowed: true,
      flagged: []
    };
  } catch (err: any) {
    console.error('❌ Failed to moderate prompt:', err.message || err);
    // In case of error, allow prompt
    return { allowed: true, flagged: [] };
  }
}

/**
 * Log admin audit action
 */
export async function logAdminAudit(
  adminId: string,
  adminEmail: string,
  action: string,
  targetType: string,
  targetId: string,
  details: string,
  changesMade?: any
) {
  try {
    const { collection: firestoreCollection, addDoc } = await import('firebase/firestore');
    
    const auditRef = firestoreCollection(db, 'admin_audit_logs');
    await addDoc(auditRef, {
      adminId,
      adminEmail,
      action,
      targetType,
      targetId,
      details,
      changesMade: changesMade || {},
      ipAddress: null, // Can be populated from Cloud Functions
      timestamp: Date.now()
    });
    
    console.log(`📝 Logged admin audit: ${action} by ${adminEmail}`);
  } catch (err: any) {
    console.error('❌ Failed to log admin audit:', err.message || err);
  }
}

/**
 * Get admin audit logs
 */
export async function getAdminAuditLogs(limit: number = 100) {
  try {
    const { collection, getDocs, query, orderBy: firestoreOrderBy, limit: firestoreLimit } = await import('firebase/firestore');
    
    const auditRef = collection(db, 'admin_audit_logs');
    const auditQuery = query(
      auditRef,
      firestoreOrderBy('timestamp', 'desc'),
      firestoreLimit(limit)
    );
    
    const snapshot = await getDocs(auditQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (err: any) {
    console.error('❌ Failed to get admin audit logs:', err.message || err);
    return [];
  }
}

/**
 * Get abuse detection logs
 */
export async function getAbuseDetectionLogs(limit: number = 100) {
  try {
    const { collection, getDocs, query, orderBy: firestoreOrderBy, limit: firestoreLimit } = await import('firebase/firestore');
    
    const abuseRef = collection(db, 'abuse_detection');
    const abuseQuery = query(
      abuseRef,
      firestoreOrderBy('timestamp', 'desc'),
      firestoreLimit(limit)
    );
    
    const snapshot = await getDocs(abuseQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (err: any) {
    console.error('❌ Failed to get abuse detection logs:', err.message || err);
    return [];
  }
}

// ============================================
// AI ENGINE & DYNAMIC PRICING FUNCTIONS
// ============================================

/**
 * Get all AI engines
 * @returns Array of all AI engines
 */
export async function getAllEngines() {
  try {
    const { collection, getDocs } = await import('firebase/firestore');
    
    const enginesRef = collection(db, 'ai_engines');
    const snapshot = await getDocs(enginesRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (err: any) {
    console.error('❌ Failed to get engines:', err.message || err);
    return [];
  }
}

/**
 * Get engines by AI type
 * @param aiType - The AI type to filter by
 * @returns Array of engines for the specified type
 */
export async function getEnginesByType(aiType: string) {
  try {
    const { collection, getDocs, query, where } = await import('firebase/firestore');
    
    const enginesRef = collection(db, 'ai_engines');
    const engineQuery = query(enginesRef, where('ai_type', '==', aiType));
    const snapshot = await getDocs(engineQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (err: any) {
    console.error('❌ Failed to get engines by type:', err.message || err);
    return [];
  }
}

/**
 * Get active engines only
 * @returns Array of active engines
 */
export async function getActiveEngines() {
  try {
    const { collection, getDocs, query, where } = await import('firebase/firestore');
    
    const enginesRef = collection(db, 'ai_engines');
    const engineQuery = query(enginesRef, where('is_active', '==', true));
    const snapshot = await getDocs(engineQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (err: any) {
    console.error('❌ Failed to get active engines:', err.message || err);
    return [];
  }
}

/**
 * Get a specific engine by ID
 * @param engineId - The engine ID
 * @returns The engine data or null
 */
export async function getEngine(engineId: string) {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    
    const engineRef = doc(db, 'ai_engines', engineId);
    const snapshot = await getDoc(engineRef);
    
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() };
    }
    return null;
  } catch (err: any) {
    console.error('❌ Failed to get engine:', err.message || err);
    return null;
  }
}

/**
 * Create or update an AI engine
 * @param engineId - The engine ID
 * @param engineData - The engine data
 */
export async function setEngine(engineId: string, engineData: any) {
  try {
    const { doc, setDoc } = await import('firebase/firestore');
    
    const engineRef = doc(db, 'ai_engines', engineId);
    await setDoc(engineRef, {
      ...engineData,
      updated_at: Date.now()
    }, { merge: true });
    
    console.log(`✅ Engine ${engineId} updated successfully`);
    return true;
  } catch (err: any) {
    console.error('❌ Failed to set engine:', err.message || err);
    throw err;
  }
}

/**
 * Update engine active status
 * @param engineId - The engine ID
 * @param isActive - Active status
 */
export async function updateEngineStatus(engineId: string, isActive: boolean) {
  try {
    const { doc, updateDoc } = await import('firebase/firestore');
    
    const engineRef = doc(db, 'ai_engines', engineId);
    await updateDoc(engineRef, {
      is_active: isActive,
      updated_at: Date.now()
    });
    
    console.log(`✅ Engine ${engineId} status updated to ${isActive ? 'active' : 'inactive'}`);
    return true;
  } catch (err: any) {
    console.error('❌ Failed to update engine status:', err.message || err);
    throw err;
  }
}

/**
 * Update engine cost
 * @param engineId - The engine ID
 * @param newCost - The new cost
 */
export async function updateEngineCost(engineId: string, newCost: number) {
  try {
    const { doc, updateDoc } = await import('firebase/firestore');
    
    const engineRef = doc(db, 'ai_engines', engineId);
    await updateDoc(engineRef, {
      base_cost: newCost,
      updated_at: Date.now()
    });
    
    console.log(`✅ Engine ${engineId} cost updated to ${newCost}`);
    return true;
  } catch (err: any) {
    console.error('❌ Failed to update engine cost:', err.message || err);
    throw err;
  }
}

/**
 * Delete an engine (soft delete by setting is_active to false)
 * @param engineId - The engine ID
 */
export async function deleteEngine(engineId: string) {
  try {
    const { doc, updateDoc } = await import('firebase/firestore');
    
    const engineRef = doc(db, 'ai_engines', engineId);
    await updateDoc(engineRef, {
      is_active: false,
      updated_at: Date.now()
    });
    
    console.log(`✅ Engine ${engineId} deleted (deactivated)`);
    return true;
  } catch (err: any) {
    console.error('❌ Failed to delete engine:', err.message || err);
    throw err;
  }
}

/**
 * Get credit pricing for an AI type
 * @param aiType - The AI type
 * @returns The pricing configuration
 */
export async function getCreditPricing(aiType: string) {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    
    const pricingRef = doc(db, 'credit_pricing', aiType);
    const snapshot = await getDoc(pricingRef);
    
    if (snapshot.exists()) {
      return { ai_type: aiType, ...snapshot.data() };
    }
    return null;
  } catch (err: any) {
    console.error('❌ Failed to get credit pricing:', err.message || err);
    return null;
  }
}

/**
 * Get all credit pricing configurations
 * @returns Array of all pricing configurations
 */
export async function getAllCreditPricing() {
  try {
    const { collection, getDocs } = await import('firebase/firestore');
    
    const pricingRef = collection(db, 'credit_pricing');
    const snapshot = await getDocs(pricingRef);
    
    return snapshot.docs.map(doc => ({
      ai_type: doc.id,
      ...doc.data()
    }));
  } catch (err: any) {
    console.error('❌ Failed to get all credit pricing:', err.message || err);
    return [];
  }
}

/**
 * Set credit pricing for an AI type
 * @param aiType - The AI type
 * @param pricingData - The pricing configuration
 */
export async function setCreditPricing(aiType: string, pricingData: any) {
  try {
    const { doc, setDoc } = await import('firebase/firestore');
    
    const pricingRef = doc(db, 'credit_pricing', aiType);
    await setDoc(pricingRef, {
      ...pricingData,
      ai_type: aiType,
      updated_at: Date.now()
    }, { merge: true });
    
    console.log(`✅ Credit pricing for ${aiType} updated successfully`);
    return true;
  } catch (err: any) {
    console.error('❌ Failed to set credit pricing:', err.message || err);
    throw err;
  }
}

/**
 * Update default engine for an AI type
 * @param aiType - The AI type
 * @param defaultEngine - The default engine ID
 */
export async function updateDefaultEngine(aiType: string, defaultEngine: string) {
  try {
    const { doc, updateDoc } = await import('firebase/firestore');
    
    const pricingRef = doc(db, 'credit_pricing', aiType);
    await updateDoc(pricingRef, {
      default_engine: defaultEngine,
      updated_at: Date.now()
    });
    
    console.log(`✅ Default engine for ${aiType} set to ${defaultEngine}`);
    return true;
  } catch (err: any) {
    console.error('❌ Failed to update default engine:', err.message || err);
    throw err;
  }
}

/**
 * Calculate credit cost for a specific engine and input
 * @param engineId - The engine ID
 * @param inputSize - The input size (tokens, seconds, images, etc.)
 * @returns The calculated cost
 */
export async function calculateEngineCost(engineId: string, inputSize: number) {
  try {
    const engine: any = await getEngine(engineId);
    if (!engine) {
      throw new Error(`Engine ${engineId} not found`);
    }
    
    if (!engine.is_active) {
      throw new Error(`Engine ${engineId} is not active`);
    }
    
    const cost = engine.base_cost * inputSize;
    return {
      engineId,
      engineName: engine.engine_name,
      baseCost: engine.base_cost,
      inputSize,
      totalCost: cost,
      costUnit: engine.cost_unit
    };
  } catch (err: any) {
    console.error('❌ Failed to calculate engine cost:', err.message || err);
    throw err;
  }
}

/**
 * Log engine usage to usage_logs collection
 * @param usageData - The usage log data
 */
export async function logEngineUsage(usageData: any) {
  try {
    const { collection: firestoreCollection, addDoc } = await import('firebase/firestore');
    
    const logsRef = firestoreCollection(db, 'usage_logs');
    await addDoc(logsRef, {
      ...usageData,
      timestamp: Date.now()
    });
    
    console.log(`📊 Logged engine usage: ${usageData.engine_id}`);
    return true;
  } catch (err: any) {
    console.error('❌ Failed to log engine usage:', err.message || err);
    return false;
  }
}

/**
 * Get engine usage statistics
 * @param engineId - Optional engine ID to filter by
 * @param days - Number of days to look back
 * @returns Engine statistics
 */
export async function getEngineStats(engineId?: string, days: number = 30) {
  try {
    const { collection, getDocs, query, where, orderBy: firestoreOrderBy } = await import('firebase/firestore');
    
    const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
    const logsRef = collection(db, 'usage_logs');
    
    let statsQuery;
    if (engineId) {
      statsQuery = query(
        logsRef,
        where('engine_id', '==', engineId),
        where('timestamp', '>=', cutoffDate),
        firestoreOrderBy('timestamp', 'desc')
      );
    } else {
      statsQuery = query(
        logsRef,
        where('timestamp', '>=', cutoffDate),
        firestoreOrderBy('timestamp', 'desc')
      );
    }
    
    const snapshot = await getDocs(statsQuery);
    const logs = snapshot.docs.map(doc => doc.data());
    
    // Calculate statistics
    const totalUsage = logs.length;
    const totalCredits = logs.reduce((sum, log) => sum + (log.creditsUsed || 0), 0);
    const successCount = logs.filter(log => log.status === 'success').length;
    const successRate = totalUsage > 0 ? (successCount / totalUsage) * 100 : 0;
    
    // Group by engine
    const byEngine: any = {};
    logs.forEach(log => {
      const engId = log.engine_id || 'unknown';
      if (!byEngine[engId]) {
        byEngine[engId] = {
          engine_id: engId,
          engine_name: log.engine_name || engId,
          ai_type: log.aiType,
          total_usage_count: 0,
          total_credits_used: 0,
          success_count: 0
        };
      }
      byEngine[engId].total_usage_count++;
      byEngine[engId].total_credits_used += log.creditsUsed || 0;
      if (log.status === 'success') {
        byEngine[engId].success_count++;
      }
    });
    
    // Calculate averages and success rates
    Object.keys(byEngine).forEach(engId => {
      const stats = byEngine[engId];
      stats.average_credits_per_use = stats.total_usage_count > 0 
        ? stats.total_credits_used / stats.total_usage_count 
        : 0;
      stats.success_rate = stats.total_usage_count > 0
        ? (stats.success_count / stats.total_usage_count) * 100
        : 0;
    });
    
    return {
      totalUsage,
      totalCredits,
      successRate,
      byEngine: Object.values(byEngine),
      timeRange: { start: cutoffDate, end: Date.now() }
    };
  } catch (err: any) {
    console.error('❌ Failed to get engine stats:', err.message || err);
    return {
      totalUsage: 0,
      totalCredits: 0,
      successRate: 0,
      byEngine: [],
      timeRange: { start: Date.now() - (days * 24 * 60 * 60 * 1000), end: Date.now() }
    };
  }
}

/**
 * Subscribe to real-time engine pricing updates
 * @param aiType - The AI type to subscribe to
 * @param callback - Callback function for updates
 * @returns Unsubscribe function
 */
export function subscribeToEnginePricing(aiType: string, callback: (pricing: any) => void) {
  const { doc, onSnapshot } = require('firebase/firestore');
  
  const pricingRef = doc(db, 'credit_pricing', aiType);
  return onSnapshot(pricingRef, (snapshot: any) => {
    if (snapshot.exists()) {
      callback({ ai_type: aiType, ...snapshot.data() });
    }
  });
}

/**
 * Subscribe to all engines real-time updates
 * @param callback - Callback function for updates
 * @returns Unsubscribe function
 */
export function subscribeToAllEngines(callback: (engines: any[]) => void) {
  const { collection, onSnapshot } = require('firebase/firestore');
  
  const enginesRef = collection(db, 'ai_engines');
  return onSnapshot(enginesRef, (snapshot: any) => {
    const engines = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(engines);
  });
}

// ============================================
// SUBSCRIPTION PLAN & PRICING OVERRIDE FUNCTIONS
// ============================================

/**
 * Get all subscription plans
 * @returns Array of all subscription plans
 */
export async function getAllSubscriptionPlans() {
  try {
    const { collection, getDocs } = await import('firebase/firestore');
    
    const plansRef = collection(db, 'subscription_plans');
    const snapshot = await getDocs(plansRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (err: any) {
    console.error('❌ Failed to get subscription plans:', err.message || err);
    return [];
  }
}

/**
 * Get a specific subscription plan
 * @param planId - The plan ID
 * @returns The plan data or null
 */
export async function getSubscriptionPlan(planId: string) {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    
    const planRef = doc(db, 'subscription_plans', planId);
    const snapshot = await getDoc(planRef);
    
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() };
    }
    return null;
  } catch (err: any) {
    console.error('❌ Failed to get subscription plan:', err.message || err);
    return null;
  }
}

/**
 * Create or update a subscription plan
 * @param planId - The plan ID
 * @param planData - The plan data
 */
export async function setSubscriptionPlan(planId: string, planData: any) {
  try {
    const { doc, setDoc } = await import('firebase/firestore');
    
    const planRef = doc(db, 'subscription_plans', planId);
    await setDoc(planRef, {
      ...planData,
      id: planId,
      updated_at: Date.now()
    }, { merge: true });
    
    console.log(`✅ Subscription plan ${planId} updated successfully`);
    return true;
  } catch (err: any) {
    console.error('❌ Failed to set subscription plan:', err.message || err);
    throw err;
  }
}

/**
 * Get plan pricing overrides for a specific plan
 * @param planId - The plan ID
 * @returns The pricing overrides or null
 */
export async function getPlanPricingOverrides(planId: string) {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    
    const overridesRef = doc(db, 'plan_pricing_overrides', planId);
    const snapshot = await getDoc(overridesRef);
    
    if (snapshot.exists()) {
      return { plan_id: planId, ...snapshot.data() };
    }
    return null;
  } catch (err: any) {
    console.error('❌ Failed to get plan pricing overrides:', err.message || err);
    return null;
  }
}

/**
 * Get all plan pricing overrides
 * @returns Array of all pricing overrides
 */
export async function getAllPlanPricingOverrides() {
  try {
    const { collection, getDocs } = await import('firebase/firestore');
    
    const overridesRef = collection(db, 'plan_pricing_overrides');
    const snapshot = await getDocs(overridesRef);
    
    return snapshot.docs.map(doc => ({
      plan_id: doc.id,
      ...doc.data()
    }));
  } catch (err: any) {
    console.error('❌ Failed to get all plan pricing overrides:', err.message || err);
    return [];
  }
}

/**
 * Set plan pricing overrides
 * @param planId - The plan ID
 * @param overrides - The pricing overrides
 */
export async function setPlanPricingOverrides(planId: string, overrides: any) {
  try {
    const { doc, setDoc } = await import('firebase/firestore');
    
    const overridesRef = doc(db, 'plan_pricing_overrides', planId);
    await setDoc(overridesRef, {
      ...overrides,
      plan_id: planId,
      updated_at: Date.now()
    }, { merge: true });
    
    console.log(`✅ Plan pricing overrides for ${planId} updated successfully`);
    return true;
  } catch (err: any) {
    console.error('❌ Failed to set plan pricing overrides:', err.message || err);
    throw err;
  }
}

/**
 * Update specific engine override for a plan
 * @param planId - The plan ID
 * @param aiType - The AI type
 * @param engineId - The engine ID
 * @param cost - The override cost
 * @param enabled - Whether engine is enabled for this plan
 */
export async function updatePlanEngineOverride(
  planId: string,
  aiType: string,
  engineId: string,
  cost: number,
  enabled: boolean = true
) {
  try {
    const { doc, getDoc, updateDoc, setDoc } = await import('firebase/firestore');
    
    const overridesRef = doc(db, 'plan_pricing_overrides', planId);
    const snapshot = await getDoc(overridesRef);
    
    let overrides: any = { plan_id: planId, ai_types: {} };
    if (snapshot.exists()) {
      overrides = snapshot.data();
    }
    
    // Initialize ai_types if it doesn't exist
    if (!overrides.ai_types) {
      overrides.ai_types = {};
    }
    
    // Initialize AI type if it doesn't exist
    if (!overrides.ai_types[aiType]) {
      overrides.ai_types[aiType] = {};
    }
    
    // Set engine override
    overrides.ai_types[aiType][engineId] = { cost, enabled };
    overrides.updated_at = Date.now();
    
    await setDoc(overridesRef, overrides, { merge: true });
    
    console.log(`✅ Updated ${aiType}/${engineId} override for plan ${planId}`);
    return true;
  } catch (err: any) {
    console.error('❌ Failed to update plan engine override:', err.message || err);
    throw err;
  }
}

/**
 * Remove engine override for a plan (revert to default)
 * @param planId - The plan ID
 * @param aiType - The AI type
 * @param engineId - The engine ID
 */
export async function removePlanEngineOverride(
  planId: string,
  aiType: string,
  engineId: string
) {
  try {
    const { doc, getDoc, setDoc } = await import('firebase/firestore');
    
    const overridesRef = doc(db, 'plan_pricing_overrides', planId);
    const snapshot = await getDoc(overridesRef);
    
    if (!snapshot.exists()) {
      return true; // Nothing to remove
    }
    
    const overrides: any = snapshot.data();
    
    if (overrides.ai_types?.[aiType]?.[engineId]) {
      delete overrides.ai_types[aiType][engineId];
      overrides.updated_at = Date.now();
      
      await setDoc(overridesRef, overrides);
      console.log(`✅ Removed ${aiType}/${engineId} override for plan ${planId}`);
    }
    
    return true;
  } catch (err: any) {
    console.error('❌ Failed to remove plan engine override:', err.message || err);
    throw err;
  }
}

/**
 * Calculate credit cost for a user with plan-based pricing
 * 
 * 3-tier pricing resolution:
 * 1. Plan-specific engine override
 * 2. Engine default cost
 * 3. Global AI type default cost
 * 
 * @param userPlan - User's subscription plan
 * @param aiType - AI type
 * @param engineId - Engine ID
 * @param inputSize - Input size (tokens, seconds, images, etc.)
 * @returns Credit cost result with pricing source
 */
export async function calculatePlanCreditCost(
  userPlan: string,
  aiType: string,
  engineId: string,
  inputSize: number
) {
  try {
    let costPerUnit = 0;
    let pricingSource: 'plan_override' | 'engine_default' | 'global_default' = 'global_default';
    let engineName = engineId;
    let costUnit: string = 'unit';
    
    // 1. Check for plan-specific override
    const planOverrides: any = await getPlanPricingOverrides(userPlan);
    if (planOverrides?.ai_types?.[aiType]?.[engineId]) {
      const override = planOverrides.ai_types[aiType][engineId];
      if (override.enabled !== false) {
        costPerUnit = override.cost;
        pricingSource = 'plan_override';
        console.log(`💰 Using plan override: ${userPlan}/${aiType}/${engineId} = ${costPerUnit}`);
      }
    }
    
    // 2. If no plan override, check engine default cost
    if (pricingSource !== 'plan_override') {
      const engine: any = await getEngine(engineId);
      if (engine && engine.is_active) {
        costPerUnit = engine.base_cost;
        engineName = engine.engine_name || engineId;
        costUnit = engine.cost_unit || 'unit';
        pricingSource = 'engine_default';
        console.log(`💰 Using engine default: ${engineId} = ${costPerUnit}`);
      }
    }
    
    // 3. If no engine cost, check global AI type default
    if (pricingSource === 'global_default') {
      const pricing: any = await getCreditPricing(aiType);
      if (pricing?.engines?.[engineId]) {
        costPerUnit = pricing.engines[engineId].cost;
        pricingSource = 'global_default';
        console.log(`💰 Using global default: ${aiType}/${engineId} = ${costPerUnit}`);
      }
    }
    
    // If still no cost found, throw error
    if (costPerUnit === 0) {
      throw new Error(`No pricing found for ${userPlan}/${aiType}/${engineId}`);
    }
    
    const totalCost = Math.ceil(costPerUnit * inputSize);
    
    return {
      cost: costPerUnit,
      cost_per_unit: costPerUnit,
      total_cost: totalCost,
      input_size: inputSize,
      pricing_source: pricingSource,
      engine_id: engineId,
      engine_name: engineName,
      ai_type: aiType as any,
      user_plan: userPlan as any,
      cost_unit: costUnit as any
    };
  } catch (err: any) {
    console.error('❌ Failed to calculate plan credit cost:', err.message || err);
    throw err;
  }
}

/**
 * Get plan usage statistics
 * @param planId - Optional plan ID to filter by
 * @param days - Number of days to look back
 * @returns Plan usage statistics
 */
export async function getPlanUsageStats(planId?: string, days: number = 30) {
  try {
    const { collection, getDocs, query, where } = await import('firebase/firestore');
    
    const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
    const logsRef = collection(db, 'usage_logs');
    
    let statsQuery;
    if (planId) {
      statsQuery = query(
        logsRef,
        where('subscription_plan', '==', planId),
        where('timestamp', '>=', cutoffDate)
      );
    } else {
      statsQuery = query(
        logsRef,
        where('timestamp', '>=', cutoffDate)
      );
    }
    
    const snapshot = await getDocs(statsQuery);
    const logs = snapshot.docs.map(doc => doc.data());
    
    // Aggregate statistics by plan
    const planStats: any = {};
    
    logs.forEach((log: any) => {
      const plan = log.subscription_plan || 'free';
      if (!planStats[plan]) {
        planStats[plan] = {
          plan_id: plan,
          total_generations: 0,
          total_credits_used: 0,
          users: new Set(),
          by_ai_type: {}
        };
      }
      
      planStats[plan].total_generations++;
      planStats[plan].total_credits_used += log.creditsUsed || 0;
      planStats[plan].users.add(log.userId);
      
      // By AI type
      const aiType = log.aiType || 'unknown';
      if (!planStats[plan].by_ai_type[aiType]) {
        planStats[plan].by_ai_type[aiType] = {
          count: 0,
          credits: 0,
          engines: {}
        };
      }
      planStats[plan].by_ai_type[aiType].count++;
      planStats[plan].by_ai_type[aiType].credits += log.creditsUsed || 0;
      
      // By engine
      const engineId = log.engine_id || 'unknown';
      if (!planStats[plan].by_ai_type[aiType].engines[engineId]) {
        planStats[plan].by_ai_type[aiType].engines[engineId] = {
          count: 0,
          credits: 0
        };
      }
      planStats[plan].by_ai_type[aiType].engines[engineId].count++;
      planStats[plan].by_ai_type[aiType].engines[engineId].credits += log.creditsUsed || 0;
    });
    
    // Convert to array and calculate averages
    const result = Object.values(planStats).map((stats: any) => ({
      ...stats,
      total_users: stats.users.size,
      average_credits_per_user: stats.total_credits_used / stats.users.size,
      timeRange: { start: cutoffDate, end: Date.now() }
    }));
    
    return planId ? result[0] || null : result;
  } catch (err: any) {
    console.error('❌ Failed to get plan usage stats:', err.message || err);
    return planId ? null : [];
  }
}

/**
 * Subscribe to plan pricing overrides updates
 * @param planId - The plan ID to subscribe to
 * @param callback - Callback function for updates
 * @returns Unsubscribe function
 */
export function subscribeToPlanPricingOverrides(planId: string, callback: (overrides: any) => void) {
  const { doc, onSnapshot } = require('firebase/firestore');
  
  const overridesRef = doc(db, 'plan_pricing_overrides', planId);
  return onSnapshot(overridesRef, (snapshot: any) => {
    if (snapshot.exists()) {
      callback({ plan_id: planId, ...snapshot.data() });
    } else {
      callback({ plan_id: planId, ai_types: {} });
    }
  });
}

