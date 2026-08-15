import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Mail, LogIn, KeyRound } from 'lucide-react';
import { authClient } from '../auth-client.js';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await authClient.signIn.email({ email, password });
      // useSession() in AdminApp picks up the new session automatically.
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
      setBusy(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__mark">
          <Lock size={26} />
        </div>
        <h1>Admin Console</h1>
        <p>Sign in to manage TPC Logistics operations.</p>

        <form onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="admin-email">Email</label>
            <div className="admin-input">
              <Mail size={17} />
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@tpclogistics.com"
                autoComplete="username"
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="admin-pass">Password</label>
            <div className="admin-input">
              <KeyRound size={17} />
              <input
                id="admin-pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          </div>
          {error && <p className="admin-error">{error}</p>}
          <button className="btn btn--primary btn--block" disabled={busy}>
            <LogIn size={17} /> {busy ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <Link to="/" className="admin-login__back">← Back to website</Link>
      </div>
    </div>
  );
}
