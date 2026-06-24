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
    if (!parsed.success) return setError('Introduce un correo electrónico y una contraseña válidos.');
    setBusy(true);
    try {
      await apiRequest<{ user: User }>('/auth/login', { method: 'POST', ...jsonBody(parsed.data) });
      await refresh();
      const state = location.state as { from?: string } | null;
      navigate(state?.from || '/dashboard', { replace: true });
    } catch (value) {
      setError(value instanceof Error ? value.message : 'No se pudo iniciar sesión.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Bienvenido de nuevo" subtitle="Inicia sesión para continuar planificando tus viajes.">
      <form className="form-stack" onSubmit={submit} noValidate>
        <label>Correo electrónico<input name="email" type="email" autoComplete="email" required /></label>
        <label>Contraseña<input name="password" type="password" autoComplete="current-password" required /></label>
        {error && <p className="form-error">{error}</p>}
        <button className="button primary full" disabled={busy}>{busy ? 'Iniciando sesión…' : 'Iniciar sesión'}</button>
      </form>
      <div className="auth-links"><Link to="/forgot-password">¿Has olvidado la contraseña?</Link><Link to="/register">Crear cuenta</Link></div>
    </AuthCard>
  );
}
