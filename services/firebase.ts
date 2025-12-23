import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile, sendEmailVerification, applyActionCode, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAn0LrM0rtXoXvOA8m4JqkGQ8KJR_NKgYA',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'image-ai-generator-adf8c.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'image-ai-generator-adf8c',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

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
    const isNew = result?.additionalUserInfo?.isNewUser ?? false;

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
  const snap = await userRef.get?.() || null;
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

