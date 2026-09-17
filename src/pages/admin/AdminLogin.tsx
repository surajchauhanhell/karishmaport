import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { SEO, State } from '../../components/common';
import { requireSupabase, supabase } from '../../services/supabase';
import { adminReturnPath } from '../../utils/adminRedirect';

export default function AdminLogin() {
  const auth = useAdminAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function login(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      const { error } = await requireSupabase().auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      setPassword('');
    } catch {
      setMessage('Sign-in failed. Check your email and password, then try again.');
    } finally {
      setBusy(false);
    }
  }
  if (auth.status === 'allowed')
    return <Navigate replace to={adminReturnPath(location.state?.from)} />;
  return (
    <div className="login">
      <SEO title="Creator Login" noindex />
      <Link className="wordmark" to="/">
        Karishma Chauhan
      </Link>
      <p className="eyebrow" style={{ marginTop: 40 }}>
        THE CREATOR STUDIO
      </p>
      <h1>Welcome back.</h1>
      <p>Sign in to manage your content and collaborations.</p>
      {!supabase && (
        <p role="status">
          Admin sign-in becomes available after Supabase is configured. See the included setup
          guide.
        </p>
      )}
      {auth.status === 'loading' ? (
        <State loading />
      ) : (
        <>
          {(auth.error || message) && (
            <p role="alert" className="form-error">
              {message || auth.error}
            </p>
          )}
          {auth.status === 'error' && (
            <button className="button secondary" onClick={auth.retry}>
              Retry verification
            </button>
          )}
          {auth.signedIn ? (
            <button
              className="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setMessage('');
                try {
                  await auth.signOut();
                } catch {
                  setMessage('Sign-out failed. Please try again.');
                } finally {
                  setBusy(false);
                }
              }}
            >
              Sign out of this account
            </button>
          ) : (
            <form onSubmit={login}>
              <label className="field">
                Email
                <input
                  required
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label className="field">
                Password
                <input
                  required
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <button className="button" disabled={busy || !supabase}>
                {busy ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
