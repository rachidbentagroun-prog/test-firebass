import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { auth, applyVerificationCode, grantDefaultEntitlements } from '../services/firebase';
import { Loader2 } from 'lucide-react';

export default function PostVerify() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'needs-login'>('loading');
  const [message, setMessage] = useState<string>('Verifying your email...');

  useEffect(() => {
    (async () => {
      const mode = params.get('mode');
      const oobCode = params.get('oobCode');

      if (mode !== 'verifyEmail' || !oobCode) {
        setStatus('error');
        setMessage('Invalid verification link.');
        return;
      }

      try {
        await applyVerificationCode(oobCode);

        // If the user is signed in on the same device, auth.currentUser will be available
        if (auth.currentUser) {
          await auth.currentUser.reload();
          if (auth.currentUser.emailVerified) {
            // grant entitlements and send them to dashboard
            try {
              await grantDefaultEntitlements(auth.currentUser.uid);
            } catch (err) {
              // non-fatal: continue to dashboard even if grant fails
              console.warn('grantDefaultEntitlements failed', err);
            }

            setStatus('success');
            setMessage('Email verified! Redirecting to your dashboard...');
            setTimeout(() => navigate('/dashboard'), 1500);
            return;
          }
        }

        // Not signed in on this device — ask user to login to continue
        setStatus('needs-login');
        setMessage('Email verified. Please log in to access your dashboard.');
      } catch (err: any) {
        console.error(err);
        setStatus('error');
        setMessage(err?.message || 'Failed to verify email.');
      }
    })();
  }, [params, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-dark-950">
      <div className="w-full max-w-lg bg-dark-900/60 backdrop-blur-lg border border-white/6 rounded-3xl p-8 shadow-2xl text-center">
        <div className="mb-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-gray-300">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div>
              <h2 className="text-2xl font-bold text-white">Verified!</h2>
              <p className="text-gray-300 mt-2">{message}</p>
            </div>
          )}

          {status === 'needs-login' && (
            <div>
              <h2 className="text-2xl font-bold text-white">Verified</h2>
              <p className="text-gray-300 mt-2">{message}</p>
              <div className="mt-6 flex justify-center gap-4">
                <button onClick={() => navigate('/')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Login</button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div>
              <h2 className="text-2xl font-bold text-red-400">Verification failed</h2>
              <p className="text-gray-300 mt-2">{message}</p>
              <div className="mt-6">
                <button onClick={() => navigate('/')} className="px-4 py-2 bg-white/5 text-gray-200 rounded-lg">Return</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
