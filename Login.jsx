import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../components/common/Toast';
import authService from '../services/authService';
import { DEMO_FLOW } from '../data/demoData';
import { defaultRouteFor } from '../utils/permissions';

export function Login({ onSignedIn }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const signIn = async (nextEmail, nextPassword) => {
    setBusy(true);
    setError('');
    try {
      const user = await authService.login(nextEmail, nextPassword);
      onSignedIn(user);
      toast.success(`Signed in as ${user.full_name}`, 'Welcome back');
      navigate(defaultRouteFor(user.role), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <aside className="auth-aside">
        <div>
          <h1>A health memory that follows the patient, not the clinic.</h1>
          <p>
            Fragmented notes, prescriptions, voice diaries and caregiver
            observations become one longitudinal record — consent-aware,
            provenance-preserving, and safe to reason over.
          </p>
        </div>
        <div className="auth-pipeline">
          {DEMO_FLOW.map((step, index) => (
            <div className="pl-step" key={step}>
              <span className="pl-num">{index + 1}</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-form">
          <Link to="/" className="small muted" style={{ display: 'inline-block' }}>
            ← Back to home
          </Link>
          <h1 className="mb-1 mt-2">Sign in</h1>
          <p className="muted mb-2">
            Four dashboards, one shared health memory: patient, doctor,
            caregiver and pharmacist.
          </p>

          {error && (
            <div className="alert alert-danger mb-2">
              <span className="alert-icon" aria-hidden="true">
                ⚠️
              </span>
              <div className="alert-body">{error}</div>
            </div>
          )}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              signIn(email, password);
            }}
          >
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="username"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block"
              disabled={busy}
            >
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="small muted mt-2 center">
            New here? <Link to="/register">Create an account</Link>
          </p>

          <p className="tiny faint mt-3 center">
            Access is granted per account. Doctors, caregivers and pharmacists see
            a patient&rsquo;s health memory only where the patient has granted
            consent.
          </p>
        </div>
      </main>
    </div>
  );
}

export default Login;
