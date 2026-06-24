import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { AuthCard } from '../components/AuthCard';
import { apiRequest, jsonBody } from '../lib/api';

const password = z.string().min(6).max(128);

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get('password') || '');
    const token = params.get('token') || '';
    if (!token || !password.safeParse(value).success) return setError('El enlace o el formato de la contraseña no son válidos.');
    try {
      await apiRequest<{ message: string }>('/auth/reset-password', { method: 'POST', ...jsonBody({ token, password: value }) });
      setMessage('La contraseña se ha actualizado correctamente.');
      setError('');
    } catch (value) {
      setError(value instanceof Error ? value.message : 'No se pudo restablecer la contraseña.');
    }
  }
  return (
    <AuthCard title="Elige una nueva contraseña" subtitle="Elige una clave sencilla de recordar, con un mínimo de 6 caracteres.">
      <form className="form-stack" onSubmit={submit}>
        <label>Nueva contraseña<input name="password" type="password" autoComplete="new-password" minLength={6} required /></label>
        {message && <p className="success-message">{message}</p>}
        {error && <p className="form-error">{error}</p>}
        <button className="button primary full">Actualizar contraseña</button>
      </form>
      <div className="auth-links"><Link to="/login">Volver al inicio de sesión</Link></div>
    </AuthCard>
  );
}
