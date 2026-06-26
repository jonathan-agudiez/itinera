import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { ItineraryCalendar } from '../components/ItineraryCalendar';
import { apiRequest } from '../lib/api';
import { useAuth } from '../lib/auth';
import { formatDateRange } from '../lib/dates';
import type { ItineraryBundle } from '../types';

export function SharedPage() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const [copying, setCopying] = useState(false);
  const [copyError, setCopyError] = useState('');
  const query = useQuery({
    queryKey: ['shared-itinerary', token],
    queryFn: () => apiRequest<ItineraryBundle>(`/itineraries/shared/${encodeURIComponent(token)}`),
    enabled: Boolean(token),
    retry: false,
  });

  async function copyToPortfolio() {
    if (!user) {
      navigate('/login', { state: { from: `/shared/${token}` } });
      return;
    }

    setCopyError('');
    setCopying(true);
    try {
      const result = await apiRequest<ItineraryBundle>(
        `/itineraries/shared/${encodeURIComponent(token)}/copy`,
        { method: 'POST' },
      );
      await queryClient.invalidateQueries({ queryKey: ['itineraries'] });
      navigate(`/itineraries/${result.itinerary.id}`);
    } catch (value) {
      setCopyError(value instanceof Error ? value.message : 'No se pudo copiar el itinerario.');
    } finally {
      setCopying(false);
    }
  }

  if (query.isLoading) return <div className="center-state">Abriendo itinerario compartido…</div>;
  if (query.isError || !query.data) {
    return (
      <main className="shared-page">
        <div className="empty-state">
          <h1>Este enlace compartido no está disponible</h1>
          <p>Puede que el propietario lo haya desactivado o sustituido.</p>
          <Link className="button primary" to="/">Ir a Itinera</Link>
        </div>
      </main>
    );
  }

  const data = query.data;
  return (
    <main className="shared-page">
      <header className="shared-header">
        <Link to="/" className="brand"><span className="brand-mark">I</span><span>Itinera</span></Link>
        <div className="inline-actions shared-actions">
          <button className="action-icon print-action" onClick={() => window.print()} aria-label="Imprimir itinerario" title="Imprimir"><Icon name="printer" /></button>
          <button
            className="action-icon accent"
            type="button"
            onClick={() => void copyToPortfolio()}
            disabled={copying || authLoading}
            aria-label={authLoading ? 'Comprobando sesión' : user ? 'Copiar itinerario a mis viajes' : 'Iniciar sesión para copiar el itinerario'}
            title={authLoading ? 'Comprobando sesión' : user ? 'Copiar a mis viajes' : 'Inicia sesión para copiarlo'}
          >
            <Icon name="copy" />
          </button>
        </div>
      </header>
      {copyError && <div className="notice error shared-copy-error">{copyError}</div>}
      <section className="shared-title">
        <span className="eyebrow">Viaje compartido de solo lectura</span>
        <h1>{data.itinerary.title}</h1>
        <p>{data.itinerary.destination} · {formatDateRange(data.itinerary.startDate, data.itinerary.endDate)}</p>
      </section>
      <ItineraryCalendar itinerary={data.itinerary} entries={data.entries} canWrite={false} onCreate={() => undefined} onEdit={() => undefined} />
    </main>
  );
}
