import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { ItineraryCalendar } from '../components/ItineraryCalendar';
import { apiRequest } from '../lib/api';
import { formatDateRange } from '../lib/dates';
import type { ItineraryBundle } from '../types';

export function SharedPage() {
  const { token = '' } = useParams();
  const query = useQuery({
    queryKey: ['shared-itinerary', token],
    queryFn: () => apiRequest<ItineraryBundle>(`/itineraries/shared/${encodeURIComponent(token)}`),
    enabled: Boolean(token),
    retry: false,
  });

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
          <Link className="action-icon" to="/register" aria-label="Crear mi itinerario" title="Crear el mío"><Icon name="plus" /></Link>
        </div>
      </header>
      <section className="shared-title">
        <span className="eyebrow">Viaje compartido de solo lectura</span>
        <h1>{data.itinerary.title}</h1>
        <p>{data.itinerary.destination} · {formatDateRange(data.itinerary.startDate, data.itinerary.endDate)}</p>
      </section>
      <ItineraryCalendar itinerary={data.itinerary} entries={data.entries} canWrite={false} onCreate={() => undefined} onEdit={() => undefined} />
    </main>
  );
}
