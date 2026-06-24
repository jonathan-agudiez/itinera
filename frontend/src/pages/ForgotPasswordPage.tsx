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
    if (!z.email().safeParse(email).success) return setError('Introduce un correo electrónico válido.');
    try {
      await apiRequest<{ message: string }>('/auth/forgot-password', { method: 'POST', ...jsonBody({ email }) });
      setMessage('Si la cuenta existe, hemos enviado un enlace de recuperación.');
    } catch (value) {
      setError(value instanceof Error ? value.message : 'No se pudo enviar la solicitud.');
    }
  }
  return (
    <AuthCard title="Recupera tu contraseña" subtitle="Te enviaremos un enlace seguro válido durante una hora.">
      <form className="form-stack" onSubmit={submit}>
        <label>Correo electrónico<input name="email" type="email" autoComplete="email" required /></label>
        {message && <p className="success-message">{message}</p>}
        {error && <p className="form-error">{error}</p>}
        <button className="button primary full">Enviar enlace de recuperación</button>
      </form>
      <div className="auth-links"><Link to="/login">Volver al inicio de sesión</Link></div>
    </AuthCard>
  );
}
