import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { apiRequest, jsonBody } from '../lib/api';
import { useAuth } from '../lib/auth';

const passwordSchema = z.string().min(12).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/);

export function AccountPage() {
  const { user, refresh, logout } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(''); setMessage('');
    const displayName = String(new FormData(event.currentTarget).get('displayName') || '').trim();
    if (displayName.length < 2) return setError('Name must contain at least two characters.');
    try {
      await apiRequest('/users/me', { method: 'PATCH', ...jsonBody({ displayName }) });
      await refresh(); setMessage('Profile updated.');
    } catch (value) { setError(value instanceof Error ? value.message : 'Could not update profile.'); }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(''); setMessage('');
    const form = new FormData(event.currentTarget);
    const currentPassword = String(form.get('currentPassword') || '');
    const newPassword = String(form.get('newPassword') || '');
    if (!passwordSchema.safeParse(newPassword).success) return setError('New password must be at least 12 characters with upper, lower and numeric characters.');
    try {
      await apiRequest('/users/me/change-password', { method: 'POST', ...jsonBody({ currentPassword, newPassword }) });
      await logout(); navigate('/login');
    } catch (value) { setError(value instanceof Error ? value.message : 'Could not change password.'); }
  }

  async function deleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get('password') || '');
    if (!window.confirm('Delete your account, itineraries and collaboration data permanently?')) return;
    try {
      await apiRequest<void>('/users/me', { method: 'DELETE', ...jsonBody({ password }) });
      navigate('/', { replace: true });
    } catch (value) { setError(value instanceof Error ? value.message : 'Could not delete account.'); }
  }

  return (
    <div className="page-container narrow">
      <header className="page-heading"><span className="eyebrow">Account</span><h1>Your profile</h1><p className="muted">Manage your identity and security.</p></header>
      {message && <div className="notice success">{message}</div>}
      {error && <div className="notice error">{error}</div>}
      <section className="panel-card">
        <h2>Profile</h2>
        <form className="form-stack" onSubmit={updateProfile}>
          <label>Name<input name="displayName" defaultValue={user?.displayName} required /></label>
          <label>Email<input value={user?.email || ''} disabled /></label>
          <button className="button primary align-start">Save profile</button>
        </form>
      </section>
      <section className="panel-card">
        <h2>Change password</h2>
        <form className="form-stack" onSubmit={changePassword}>
          <label>Current password<input name="currentPassword" type="password" autoComplete="current-password" required /></label>
          <label>New password<input name="newPassword" type="password" autoComplete="new-password" minLength={12} required /></label>
          <button className="button primary align-start">Change password</button>
        </form>
      </section>
      <section className="panel-card danger-panel">
        <h2>Delete account</h2>
        <p className="muted">This action cannot be undone.</p>
        <form className="form-stack" onSubmit={deleteAccount}>
          <label>Confirm password<input name="password" type="password" required /></label>
          <button className="button danger align-start">Delete account</button>
        </form>
      </section>
    </div>
  );
}
