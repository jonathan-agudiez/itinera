import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { AuthCard } from '../components/AuthCard';
import { apiRequest, jsonBody } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { User } from '../types';

const schema = z.object({ email: z.email(), password: z.string().min(1) });

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refresh } = useAuth();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const parsed = schema.safeParse({ email: form.get('email'), password: form.get('password') });
    if (!parsed.success) return setError('Enter a valid email and password.');
    setBusy(true);
    try {
      await apiRequest<{ user: User }>('/auth/login', { method: 'POST', ...jsonBody(parsed.data) });
      await refresh();
      const state = location.state as { from?: string } | null;
      navigate(state?.from || '/dashboard', { replace: true });
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to continue planning your journeys.">
      <form className="form-stack" onSubmit={submit} noValidate>
        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
        <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
        {error && <p className="form-error">{error}</p>}
        <button className="button primary full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <div className="auth-links"><Link to="/forgot-password">Forgot password?</Link><Link to="/register">Create account</Link></div>
    </AuthCard>
  );
}
