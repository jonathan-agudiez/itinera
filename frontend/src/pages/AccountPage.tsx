import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { apiRequest, jsonBody } from '../lib/api';
import { useAuth } from '../lib/auth';

const passwordSchema = z.string().min(6).max(128);

export function AccountPage() {
  const { user, refresh, logout } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(''); setMessage('');
    const displayName = String(new FormData(event.currentTarget).get('displayName') || '').trim();
    if (displayName.length < 2) return setError('El nombre debe tener al menos dos caracteres.');
    try {
      await apiRequest('/users/me', { method: 'PATCH', ...jsonBody({ displayName }) });
      await refresh(); setMessage('Perfil actualizado.');
    } catch (value) { setError(value instanceof Error ? value.message : 'No se pudo actualizar el perfil.'); }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(''); setMessage('');
    const form = new FormData(event.currentTarget);
    const currentPassword = String(form.get('currentPassword') || '');
    const newPassword = String(form.get('newPassword') || '');
    if (!passwordSchema.safeParse(newPassword).success) return setError('La nueva contraseña debe tener al menos 6 caracteres.');
    try {
      await apiRequest('/users/me/change-password', { method: 'POST', ...jsonBody({ currentPassword, newPassword }) });
      await logout(); navigate('/login');
    } catch (value) { setError(value instanceof Error ? value.message : 'No se pudo cambiar la contraseña.'); }
  }

  async function deleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get('password') || '');
    if (!window.confirm('¿Eliminar permanentemente tu cuenta, tus itinerarios y los datos de colaboración?')) return;
    try {
      await apiRequest<void>('/users/me', { method: 'DELETE', ...jsonBody({ password }) });
      navigate('/', { replace: true });
    } catch (value) { setError(value instanceof Error ? value.message : 'No se pudo eliminar la cuenta.'); }
  }

  return (
    <div className="page-container narrow">
      <header className="page-heading"><span className="eyebrow">Cuenta</span><h1>Tu perfil</h1><p className="muted">Gestiona tu identidad y seguridad.</p></header>
      {message && <div className="notice success">{message}</div>}
      {error && <div className="notice error">{error}</div>}
      <section className="panel-card">
        <h2>Perfil</h2>
        <form className="form-stack" onSubmit={updateProfile}>
          <label>Nombre<input name="displayName" defaultValue={user?.displayName} required /></label>
          <label>Correo electrónico<input value={user?.email || ''} disabled /></label>
          <button className="button primary align-start">Guardar perfil</button>
        </form>
      </section>
      <section className="panel-card">
        <h2>Cambiar contraseña</h2>
        <form className="form-stack" onSubmit={changePassword}>
          <label>Contraseña actual<input name="currentPassword" type="password" autoComplete="current-password" required /></label>
          <label>Nueva contraseña<input name="newPassword" type="password" autoComplete="new-password" minLength={6} required /></label>
          <button className="button primary align-start">Cambiar contraseña</button>
        </form>
      </section>
      <section className="panel-card danger-panel">
        <h2>Eliminar cuenta</h2>
        <p className="muted">Esta acción no se puede deshacer.</p>
        <form className="form-stack" onSubmit={deleteAccount}>
          <label>Confirma tu contraseña<input name="password" type="password" required /></label>
          <button className="button danger align-start">Eliminar cuenta</button>
        </form>
      </section>
    </div>
  );
}
