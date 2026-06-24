import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="auth-page">
      <Link to="/" className="brand auth-brand">
        <span className="brand-mark">I</span>
        <span>Itinera</span>
      </Link>
      <section className="auth-card">
        <span className="eyebrow">Viajes organizados con elegancia</span>
        <h1>{title}</h1>
        <p className="muted">{subtitle}</p>
        {children}
      </section>
    </main>
  );
}
