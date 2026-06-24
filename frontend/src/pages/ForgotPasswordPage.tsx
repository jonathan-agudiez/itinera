import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { AuthCard } from '../components/AuthCard';
import { apiRequest, jsonBody } from '../lib/api';

export function ForgotPasswordPage() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const email = String(new FormData(event.currentTarget).get('email') || '');
    if (!z.email().safeParse(email).success) return setError('Enter a valid email address.');
    try {
      const response = await apiRequest<{ message: string }>('/auth/forgot-password', { method: 'POST', ...jsonBody({ email }) });
      setMessage(response.message);
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Could not submit the request.');
    }
  }
  return (
    <AuthCard title="Recover your password" subtitle="We will send a secure one-hour reset link.">
      <form className="form-stack" onSubmit={submit}>
        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
        {message && <p className="success-message">{message}</p>}
        {error && <p className="form-error">{error}</p>}
        <button className="button primary full">Send reset link</button>
      </form>
      <div className="auth-links"><Link to="/login">Back to sign in</Link></div>
    </AuthCard>
  );
}
