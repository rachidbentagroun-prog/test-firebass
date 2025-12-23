import React, { useEffect, useState } from 'react';
import { auth, applyVerificationCode, grantDefaultEntitlements } from '../services/firebase';
import { checkActionCode } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

export default function PostVerify() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'needs-login'>('loading');
  const [message, setMessage] = useState<string>('Verifying your email...');

  useEffect(() => {
    (async () => {
      const mode = (new URLSearchParams(window.location.search)).get('mode');
      const oobCode = (new URLSearchParams(window.location.search)).get('oobCode');

      if (mode !== 'verifyEmail' || !oobCode) {
        setStatus('error');
        setMessage('Invalid verification link.');
        return;
      }

      try {
        await applyVerificationCode(oobCode);

        // If the user is signed in on the same device, auth.currentUser will be available
        if (auth.currentUser) {
          // Try a quick reload but don't block too long; proceed even if reload is slow
          try {
            await Promise.race([
              auth.currentUser.reload(),
              new Promise((res) => setTimeout(res, 1000)) // 1s timeout
            ]);
          } catch (err) {
            console.warn('auth.reload slow or failed', err);
          }

          if (auth.currentUser.emailVerified) {
            // Grant entitlements but do it in the background so we don't block the user
            grantDefaultEntitlements(auth.currentUser.uid).catch((err) => {
              console.warn('grantDefaultEntitlements failed', err);
            });

            setStatus('success');
            setMessage('Email verified! Redirecting to your dashboard...');
            // Redirect immediately — app will pick up auth state and show dashboard
            window.location.href = `${window.location.origin}/?goto=dashboard`;
            return;
          }
        }

        // Try to read the verified email from the action code info so we can prefill the auth modal
        let verifiedEmail: string | null = null;
        try {
          const info = await checkActionCode(auth, oobCode);
          verifiedEmail = (info?.data as any)?.email || null;
        } catch (err) {
          console.warn('checkActionCode failed', err);
        }

        // Not signed in on this device — redirect to home and open the login modal so user can sign in quickly
        setStatus('needs-login');
        setMessage('Email verified. Redirecting to login so you can access your dashboard...');
        // Redirect immediately and include email param if available to prefill the auth modal
        const params = new URLSearchParams({ goto: 'dashboard', openAuth: '1' });
        if (verifiedEmail) params.set('email', verifiedEmail);
        window.location.href = `${window.location.origin}/?${params.toString()}`;
      } catch (err: any) {
        console.error(err);
        setStatus('error');
        setMessage(err?.message || 'Failed to verify email.');
      }
    })();
  }, []);

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
                <button onClick={() => navigate('/?goto=dashboard&openAuth=1')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Login</button>
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
