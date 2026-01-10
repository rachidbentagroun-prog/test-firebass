import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, AlertCircle, RefreshCw, Sparkles, ArrowLeft, Loader2, SendHorizontal, Inbox } from 'lucide-react';
import { auth, signUpWithFirebase, grantDefaultEntitlements, signInWithGoogle } from '../services/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification, signOut } from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  initialStep?: 'auth' | 'check-email' | 'update-password';
  // Optional initial email to prefill the login form (e.g., after verification)
  initialEmail?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess, initialStep = 'auth', initialEmail }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<'auth' | 'check-email' | 'update-password'>(initialStep);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Prefill email if we receive an initialEmail and the modal was just opened
  useEffect(() => {
    if (isOpen && initialEmail && !email) {
      setEmail(initialEmail);
    }
  }, [isOpen, initialEmail]);
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      const res = await signInWithGoogle();
      if (res?.error) {
        console.error('GOOGLE SIGN-IN FAILED:', res.error);
        setError(res.error);
        return;
      }
      // Successful sign-in
      onLoginSuccess();
      onClose();
    } catch (err: any) {
      console.error('Google sign-in exception:', err);
      const errorMsg = err?.message || String(err);
      setError(errorMsg);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (initialStep) setStep(initialStep);
    }
  }, [isOpen, initialStep]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        // Use Firebase sign-in and enforce email verification
        const userCredential = await signInWithEmailAndPassword(auth, email.toLowerCase().trim(), password);

        if (!userCredential.user.emailVerified) {
          alert('Please verify your email first');
          return;
        }

        onLoginSuccess();
        onClose();
      } else {
        // Sign Up process (Firebase)
        const res = await signUpWithFirebase(email.toLowerCase().trim(), password, name.trim());
        const cred = res?.userCredential;
        if (cred?.user) {
          // Store pending verification info in localStorage for UX persistence (no password stored)
          try {
            localStorage.setItem('pending_verification', JSON.stringify({ uid: cred.user.uid, email: cred.user.email, name: name.trim() }));
          } catch (err) { console.warn('Could not store pending verification info', err); }

          // Sign out the newly created user to prevent immediate access until they verify email
          try { await signOut(auth); } catch (err) { console.warn('Failed to sign out after signup', err); }

          if (res?.emailSent) {
            alert('Verification email sent! Please check your inbox.');
            setStep('check-email');
          } else {
            // Email delivery failed — surface helpful guidance and let the user trigger a resend
            console.warn('Verification email failed to send:', res?.sendError);
            alert('Account created but we could not send the verification email. Please try resending the verification email using the button below.');
            // Still move to the verification step so user can use the "Resend verification email" action
            setStep('check-email');
          }
        } else {
          setError('Firebase signup failed.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failure.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // For non-authenticated users, send a password reset email
      await sendPasswordResetEmail(auth, email.toLowerCase().trim());
      alert('Password reset email sent. Check your inbox.');
      setStep('auth');
    } catch (err: any) {
      setError(err.message || 'Password reset failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check whether the user has completed email verification and sign them in
  const handleCheckVerification = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Try to sign in to obtain the latest user state
      const userCredential = await signInWithEmailAndPassword(auth, email.toLowerCase().trim(), password);
      if (!userCredential.user.emailVerified) {
        setError('Email not verified yet. Please check your inbox or spam folder.');
        await signOut(auth); // keep user signed out until verified
        setIsLoading(false);
        return;
      }

      // Verified: proceed to login success
      onLoginSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Verification check failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend verification email by signing in temporarily then sending verification and signing out
  const handleResendVerification = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.toLowerCase().trim(), password);
      await sendEmailVerification(userCredential.user);
      alert('Verification email resent. Check your inbox.');
      await signOut(auth);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-dark-950/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-dark-900 border border-white/10 rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-fade-in-up overflow-hidden">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>

        {step === 'auth' ? (
          <div className="animate-fade-in">
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-indigo-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-indigo-600/20 shadow-inner">
                {isLoading ? <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /> : <Sparkles className="w-8 h-8 text-indigo-500" />}
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="flex-1 bg-white/6 hover:bg-white/10 text-white py-2 rounded-lg flex items-center justify-center gap-2 border border-white/6"
                >
                  <svg className="w-4 h-4" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg"><path fill="#4285F4" d="M533.5 278.4c0-17.9-1.6-35-4.6-51.4H272v97.3h146.9c-6.3 34-25.8 62.8-54.7 82v68.1h88.4c51.6-47.5 81.9-117.6 81.9-196z"/><path fill="#34A853" d="M272 544.3c73.8 0 135.8-24.5 181.1-66.5l-88.4-68.1c-24.6 16.6-55.9 26.5-92.7 26.5-71 0-131.1-47.8-152.6-112.1H30.6v70.9C75.9 486 168 544.3 272 544.3z"/><path fill="#FBBC05" d="M119.4 324.1c-8.6-25.8-8.6-53.4 0-79.2V174.1H30.6c-36.6 72.8-36.6 158.1 0 230.9l88.8-80.9z"/><path fill="#EA4335" d="M272 108.9c38 0 72.2 13.4 99.2 39.6l74.4-74.4C407.7 24.4 345.7 0 272 0 168 0 75.9 58.3 30.6 153.3l88.8 70.9C140.9 156.7 201 108.9 272 108.9z"/></svg>
                  <span className="text-sm font-medium">{isGoogleLoading ? 'Signing in…' : 'Continue with Google'}</span>
                </button>
              </div>

              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                {isLogin ? 'LOGIN' : 'SIGNUP'}
              </h2>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                {isLogin ? 'ACCESS THE NEURAL NETWORK' : 'INITIALIZE YOUR CREATOR NODE'}
              </p>
            </div>
            
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {error && (
                <div className="p-4 bg-red-600/10 border border-red-600/20 rounded-2xl flex items-center gap-3 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-[10px] text-red-200 font-bold uppercase">{error}</p>
                </div>
              )}

              {!isLogin && (
                <div className="relative group animate-scale-in">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input 
                    type="text" required value={name} onChange={e => setName(e.target.value)} 
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-medium placeholder:text-gray-600" 
                    placeholder="Enter your name" 
                  />
                </div>
              )}
              
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                <input 
                  type="email" required value={email} onChange={e => setEmail(e.target.value)} 
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-medium placeholder:text-gray-600" 
                  placeholder="Enter your email" 
                />
              </div>
              
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                <input 
                  type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} 
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-medium placeholder:text-gray-600" 
                  placeholder="Enter your password" 
                />
              </div>
              
              <button 
                type="submit" disabled={isLoading} 
                className={`w-full py-5 rounded-2xl text-white font-black uppercase tracking-widest transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 mt-4 ${isLogin ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20' : 'bg-pink-600 hover:bg-pink-500 shadow-pink-600/20'}`}
              >
                {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : (isLogin ? 'AUTHORIZE ACCESS' : 'CREATE NODE')}
              </button>
            </form>
            
            <p className="mt-8 text-center text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">
              {isLogin ? "NEW CREATOR? " : "HAVE AN ACCOUNT? "}
              <button 
                onClick={() => { setIsLogin(!isLogin); setError(null); }} 
                className="text-indigo-400 hover:text-indigo-300 ml-1 transition-colors underline underline-offset-4"
              >
                {isLogin ? 'SIGNUP' : 'LOGIN'}
              </button>
            </p>
          </div>
        ) : step === 'update-password' ? (
          <div className="animate-fade-in text-center">
             <div className="w-16 h-16 bg-indigo-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-indigo-600/20 shadow-inner">
                <Lock className="w-8 h-8 text-indigo-500" />
              </div>
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2">UPDATE KEY</h2>
              <p className="text-gray-400 text-xs font-black uppercase tracking-[0.2em] mb-10">Set a new account password</p>
              
              <form onSubmit={handleUpdatePassword} className="space-y-4 text-left">
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input 
                    type="password" required minLength={6} value={newPassword} onChange={e => setNewPassword(e.target.value)} 
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-medium" 
                    placeholder="New Password" 
                  />
                </div>
                <button 
                  type="submit" disabled={isLoading} 
                  className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all disabled:opacity-50 mt-4"
                >
                  {isLoading ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : 'CONFIRM PASSWORD'}
                </button>
              </form>
          </div>
        ) : (
          <div className="animate-fade-in text-center py-4">
            <div className="w-20 h-20 bg-indigo-600/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-indigo-600/20 shadow-inner relative">
               <Mail className="w-10 h-10 text-indigo-500" />
               <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-dark-900">
                  <SendHorizontal className="w-3 h-3 text-white" />
               </div>
            </div>
            
            <h2 className="text-3xl font-black text-white mb-3 uppercase italic tracking-tighter leading-none text-center">VERIFICATION <br /> REQUIRED</h2>
            <p className="text-gray-400 text-sm font-medium leading-relaxed mb-10 px-4 text-center">
              A neural activation link has been sent to your email address.<br />
              <strong className="text-indigo-400">Click the link in the email</strong> to verify your account and unlock dashboard access.
            </p>
            
            <div className="space-y-4 px-4">
              <div className="space-y-3">
                <button
                  onClick={handleCheckVerification}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 border border-indigo-600/20 rounded-2xl text-[12px] font-black text-white uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'I\'ve verified — Continue'}
                </button>

                <button
                  onClick={handleResendVerification}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[12px] font-black text-gray-400 hover:text-white uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                >
                  Resend verification email
                </button>

                <button 
                  onClick={() => setStep('auth')} 
                  className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black text-gray-400 hover:text-white uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> RETURN TO LOGIN
                </button>

                <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                  <p className="text-[9px] text-indigo-400/60 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                    <Inbox className="w-3 h-3" /> Check your spam folder if the email is not in your inbox.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />
      </div>
    </div>
  );
};