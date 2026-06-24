import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { AuthCard } from '../components/AuthCard';
import { apiRequest, jsonBody } from '../lib/api';

const password = z.string().min(12).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/);

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get('password') || '');
    const token = params.get('token') || '';
    if (!token || !password.safeParse(value).success) return setError('The link or password format is invalid.');
    try {
      const response = await apiRequest<{ message: string }>('/auth/reset-password', { method: 'POST', ...jsonBody({ token, password: value }) });
      setMessage(response.message);
      setError('');
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Could not reset password.');
    }
  }
  return (
    <AuthCard title="Choose a new password" subtitle="Use a strong password you do not reuse elsewhere.">
      <form className="form-stack" onSubmit={submit}>
        <label>New password<input name="password" type="password" autoComplete="new-password" minLength={12} required /></label>
        {message && <p className="success-message">{message}</p>}
        {error && <p className="form-error">{error}</p>}
        <button className="button primary full">Update password</button>
      </form>
      <div className="auth-links"><Link to="/login">Return to sign in</Link></div>
    </AuthCard>
  );
}
