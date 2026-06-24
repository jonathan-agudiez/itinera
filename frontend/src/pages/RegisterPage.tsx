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
    if (!parsed.success) return setError('Usa un correo válido y una contraseña de 12 caracteres con mayúsculas, minúsculas y números.');
    setBusy(true);
    try {
      await apiRequest('/auth/register', { method: 'POST', ...jsonBody(parsed.data) });
      await refresh();
      navigate('/dashboard', { replace: true });
    } catch (value) {
      setError(value instanceof Error ? value.message : 'No se pudo crear la cuenta.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Crea tu cuenta" subtitle="Planifica en privado, comparte con seguridad y colabora cuando lo necesites.">
      <form className="form-stack" onSubmit={submit} noValidate>
        <label>Nombre<input name="displayName" autoComplete="name" required /></label>
        <label>Correo electrónico<input name="email" type="email" autoComplete="email" required /></label>
        <label>Contraseña<input name="password" type="password" autoComplete="new-password" minLength={12} required /></label>
        <p className="form-hint">Al menos 12 caracteres, con una mayúscula, una minúscula y un número.</p>
        {error && <p className="form-error">{error}</p>}
        <button className="button primary full" disabled={busy}>{busy ? 'Creando cuenta…' : 'Crear cuenta'}</button>
      </form>
      <div className="auth-links"><span>¿Ya tienes una cuenta?</span><Link to="/login">Iniciar sesión</Link></div>
    </AuthCard>
  );
}
