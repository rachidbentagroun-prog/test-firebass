import React, { useState } from 'react';
import { signUpWithFirebase, signInWithGoogle } from '../services/firebase';
import { trackSignup } from '../services/posthog';
import { Sparkles, User, Mail, Lock } from 'lucide-react';
import { useLanguage } from '../utils/i18n';


export default function SignUp() {
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await signUpWithFirebase(email, password, name);
      const cred = res?.userCredential;
      if (cred?.user) {
        // Track signup in PostHog
        trackSignup(cred.user.uid, {
          email: email,
          name: name,
          plan: 'free',
          signup_method: 'email',
        });
        
        if (res?.emailSent) {
          setSuccess('Account created — check your email for a verification link.');
        } else {
          setSuccess('Account created — verification email failed to send. Please try resending from the login flow.');
        }
        setName('');
        setEmail('');
        setPassword('');
      } else {
        setError('Firebase signup failed');
      }
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-dark-950">
      <div className="w-full max-w-md bg-dark-900/60 backdrop-blur-lg border border-white/6 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">{t('signUp.title')}</h2>
          <p className="text-sm text-gray-400 mt-1">{t('signUp.subtitle')}</p>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={async () => {
              setLoading(true);
              setError(null);
              try {
                const res = await signInWithGoogle();
                if (res?.error) {
                  setError('Google sign-in failed: ' + res.error);
                } else if (res?.user) {
                  // Track Google signup/signin in PostHog
                  trackSignup(res.user.uid, {
                    email: res.user.email || 'unknown',
                    name: res.user.displayName || 'unknown',
                    plan: 'free',
                    signup_method: 'google',
                    is_new_user: res.isNew,
                  });
                  
                  setSuccess('Signed in with Google — redirecting...');
                  // Redirect to dashboard or home where the app will handle auth state
                  window.location.href = '/?goto=dashboard';
                }
              } catch (err: any) {
                setError(err?.message || String(err));
              } finally {
                setLoading(false);
              }
            }}
            className="flex-1 bg-white/6 hover:bg-white/10 text-white py-2 rounded-lg flex items-center justify-center gap-2 border border-white/6"
          >
            <svg className="w-4 h-4" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg"><path fill="#4285F4" d="M533.5 278.4c0-17.9-1.6-35-4.6-51.4H272v97.3h146.9c-6.3 34-25.8 62.8-54.7 82v68.1h88.4c51.6-47.5 81.9-117.6 81.9-196z"/><path fill="#34A853" d="M272 544.3c73.8 0 135.8-24.5 181.1-66.5l-88.4-68.1c-24.6 16.6-55.9 26.5-92.7 26.5-71 0-131.1-47.8-152.6-112.1H30.6v70.9C75.9 486 168 544.3 272 544.3z"/><path fill="#FBBC05" d="M119.4 324.1c-8.6-25.8-8.6-53.4 0-79.2V174.1H30.6c-36.6 72.8-36.6 158.1 0 230.9l88.8-80.9z"/><path fill="#EA4335" d="M272 108.9c38 0 72.2 13.4 99.2 39.6l74.4-74.4C407.7 24.4 345.7 0 272 0 168 0 75.9 58.3 30.6 153.3l88.8 70.9C140.9 156.7 201 108.9 272 108.9z"/></svg>
            <span className="text-sm font-medium">{loading ? t('signUp.signingIn') : t('signUp.googleButton')}</span>
          </button>
        </div>



        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="sr-only">{t('signUp.fullName')}</span>
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <input
                className="flex-1 bg-dark-900/40 border border-white/6 rounded-lg px-3 py-2 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={t('signUp.fullName')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </label>

          <label className="block">
            <span className="sr-only">{t('signUp.email')}</span>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <input
                type="email"
                className="flex-1 bg-dark-900/40 border border-white/6 rounded-lg px-3 py-2 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={t('signUp.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </label>

          <label className="block">
            <span className="sr-only">{t('signUp.password')}</span>
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-gray-400" />
              <input
                type="password"
                className="flex-1 bg-dark-900/40 border border-white/6 rounded-lg px-3 py-2 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={t('signUp.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-semibold disabled:opacity-60"
          >
            {loading ? t('signUp.signingUp') : t('signUp.createButton')}
          </button>
        </form>

        {error && <div className="mt-4 text-sm text-red-400">{error}</div>}
        {success && <div className="mt-4 text-sm text-green-400">{success}</div>}

        <div className="mt-6 text-center text-sm text-gray-400">
          {t('signUp.haveAccount')} <button onClick={() => window.location.href = '/?login=true'} className="text-indigo-400 font-medium">{t('signUp.login')}</button>
        </div>
      </div>
    </div>
  );
}
