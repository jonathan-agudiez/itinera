import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { AuthCard } from '../components/AuthCard';
import { apiRequest, jsonBody } from '../lib/api';
import { useAuth } from '../lib/auth';

const schema = z.object({
  displayName: z.string().trim().min(2).max(100),
  email: z.email(),
  password: z.string().min(12).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/),
});

export function RegisterPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const parsed = schema.safeParse({ displayName: form.get('displayName'), email: form.get('email'), password: form.get('password') });
    if (!parsed.success) return setError('Use a valid email and a 12-character password with upper, lower and numeric characters.');
    setBusy(true);
    try {
      await apiRequest('/auth/register', { method: 'POST', ...jsonBody(parsed.data) });
      await refresh();
      navigate('/dashboard', { replace: true });
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Could not create account.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Create your account" subtitle="Plan privately, share safely, collaborate when it matters.">
      <form className="form-stack" onSubmit={submit} noValidate>
        <label>Name<input name="displayName" autoComplete="name" required /></label>
        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
        <label>Password<input name="password" type="password" autoComplete="new-password" minLength={12} required /></label>
        <p className="form-hint">At least 12 characters, including uppercase, lowercase and a number.</p>
        {error && <p className="form-error">{error}</p>}
        <button className="button primary full" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
      </form>
      <div className="auth-links"><span>Already registered?</span><Link to="/login">Sign in</Link></div>
    </AuthCard>
  );
}
