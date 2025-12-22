import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile, sendEmailVerification, applyActionCode } from 'firebase/auth';
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
  try {
    const actionCodeSettings = {
      // After email verification, Firebase will redirect the user back to this URL
      url: `${window.location.origin}/auth/post-verify`,
      handleCodeInApp: true,
    };
    await sendEmailVerification(userCredential.user, actionCodeSettings);
  } catch (err) {
    console.warn('Failed to send verification email:', err);
    // don't block signup on email failures — return credential anyway
  }

  return userCredential;
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
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

