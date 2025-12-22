import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAn0LrM0rtXoXvOA8m4JqkGQ8KJR_NKgYA',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'image-ai-generator-adf8c.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'image-ai-generator-adf8c',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export async function signUpWithFirebase(email: string, password: string, displayName?: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(userCredential.user, { displayName });
  }

  // Send email verification to the newly created user
  try {
    await sendEmailVerification(userCredential.user);
  } catch (err) {
    console.warn('Failed to send verification email:', err);
    // don't block signup on email failures — return credential anyway
  }

  return userCredential;
}
