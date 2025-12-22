import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { signUpWithFirebase } from '../services/firebase';

type Provider = 'supabase' | 'firebase';

export default function SignUp() {
  const [provider, setProvider] = useState<Provider>('supabase');
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
      if (provider === 'supabase') {
        const { data, error: signUpError } = await supabase.auth.signUp(
          { email, password },
          { data: { full_name: name } }
        );

        if (signUpError) {
          setError(signUpError.message || 'Signup failed');
        } else {
          setSuccess('Check your email for a confirmation link (if required).');
          setName('');
          setEmail('');
          setPassword('');
        }
      } else {
        // Firebase flow
        const cred = await signUpWithFirebase(email, password, name);
        if (cred?.user) {
          setSuccess('Account created with Firebase.');
          setName('');
          setEmail('');
          setPassword('');
        } else {
          setError('Firebase signup failed');
        }
      }
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: 20 }}>
      <h2>Sign up</h2>

      <div style={{ marginBottom: 12 }}>
        <label style={{ marginRight: 12 }}>
          <input
            type="radio"
            checked={provider === 'supabase'}
            onChange={() => setProvider('supabase')}
          />{' '}
          Supabase
        </label>
        <label>
          <input
            type="radio"
            checked={provider === 'firebase'}
            onChange={() => setProvider('firebase')}
          />{' '}
          Firebase
        </label>
      </div>

      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            required
            style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: 8 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: 8 }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            required
            minLength={6}
            style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{ padding: '10px 16px', marginTop: 8 }}
        >
          {loading ? 'Signing up…' : `Sign up with ${provider}`}
        </button>
      </form>

      {error && (
        <div style={{ color: 'red', marginTop: 12 }}>{error}</div>
      )}

      {success && (
        <div style={{ color: 'green', marginTop: 12 }}>{success}</div>
      )}
    </div>
  );
}
