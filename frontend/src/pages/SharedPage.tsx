import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ItineraryCalendar } from '../components/ItineraryCalendar';
import { apiRequest } from '../lib/api';
import type { ItineraryBundle } from '../types';

export function SharedPage() {
  const { token = '' } = useParams();
  const query = useQuery({
    queryKey: ['shared-itinerary', token],
    queryFn: () => apiRequest<ItineraryBundle>(`/itineraries/shared/${encodeURIComponent(token)}`),
    enabled: Boolean(token),
    retry: false,
  });

  if (query.isLoading) return <div className="center-state">Opening shared itinerary…</div>;
  if (query.isError || !query.data) {
    return (
      <main className="shared-page">
        <div className="empty-state">
          <h1>This shared link is unavailable</h1>
          <p>It may have been disabled or replaced by the owner.</p>
          <Link className="button primary" to="/">Go to Itinera</Link>
        </div>
      </main>
    );
  }

  const data = query.data;
  return (
    <main className="shared-page">
      <header className="shared-header">
        <Link to="/" className="brand"><span className="brand-mark">I</span><span>Itinera</span></Link>
        <Link className="button ghost" to="/register">Create your own</Link>
      </header>
      <section className="shared-title">
        <span className="eyebrow">Shared read-only journey</span>
        <h1>{data.itinerary.title}</h1>
        <p>{data.itinerary.destination} · {data.itinerary.startDate} — {data.itinerary.endDate}</p>
      </section>
      <ItineraryCalendar itinerary={data.itinerary} entries={data.entries} canWrite={false} onCreate={() => undefined} onEdit={() => undefined} />
    </main>
  );
}
