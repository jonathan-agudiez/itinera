import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Modal } from '../components/Modal';
import { apiRequest, jsonBody } from '../lib/api';
import type { Itinerary, ItineraryBundle } from '../types';

const schema = z.object({
  title: z.string().trim().min(2).max(140),
  destination: z.string().trim().max(140),
  description: z.string().trim().max(5000),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  timezone: z.string().min(1).max(80),
});

export function DashboardPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const query = useQuery({
    queryKey: ['itineraries'],
    queryFn: async () => (await apiRequest<{ itineraries: Itinerary[] }>('/itineraries')).itineraries,
  });

  const create = useMutation({
    mutationFn: (input: z.infer<typeof schema>) =>
      apiRequest<ItineraryBundle>('/itineraries', { method: 'POST', ...jsonBody(input) }),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['itineraries'] });
      navigate(`/itineraries/${data.itinerary.id}`);
    },
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const input = {
      title: form.get('title'),
      destination: form.get('destination') || '',
      description: form.get('description') || '',
      startDate: form.get('startDate'),
      endDate: form.get('endDate'),
      timezone: form.get('timezone') || 'Europe/Madrid',
    };
    const parsed = schema.safeParse(input);
    if (!parsed.success) return setError('Check the title and travel dates. The end date cannot be before the start date.');
    if (parsed.data.endDate < parsed.data.startDate) return setError('The end date cannot be before the start date.');
    try {
      await create.mutateAsync(parsed.data);
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Could not create itinerary.');
    }
  }

  return (
    <div className="page-container">
      <header className="page-heading split">
        <div>
          <span className="eyebrow">Your journeys</span>
          <h1>Travel plans</h1>
          <p className="muted">A clear home for every day, time and idea.</p>
        </div>
        <button className="button primary" onClick={() => setOpen(true)}>New itinerary</button>
      </header>

      {query.isLoading && <div className="center-state">Loading trips…</div>}
      {query.isError && <div className="empty-state"><h2>Could not load your trips</h2><p>Try refreshing the page.</p></div>}
      {query.data?.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">✦</span>
          <h2>Your first itinerary starts here</h2>
          <p>Create a journey and double-click any day to add plans.</p>
          <button className="button primary" onClick={() => setOpen(true)}>Create itinerary</button>
        </div>
      )}
      <div className="trip-grid">
        {query.data?.map((trip) => (
          <Link className="trip-card" to={`/itineraries/${trip.id}`} key={trip.id}>
            <div className="trip-card-top"><span className="pill">{trip.access || 'OWNER'}</span><span>→</span></div>
            <h2>{trip.title}</h2>
            <p>{trip.destination || 'Destination to be decided'}</p>
            <div className="trip-dates"><span>{trip.startDate}</span><span>—</span><span>{trip.endDate}</span></div>
          </Link>
        ))}
      </div>

      {open && (
        <Modal title="Create itinerary" onClose={() => setOpen(false)}>
          <form className="form-stack" onSubmit={submit}>
            <label>Trip name<input name="title" placeholder="Dolomites summer journey" required /></label>
            <label>Destination<input name="destination" placeholder="Northern Italy" /></label>
            <div className="form-grid two">
              <label>Start date<input name="startDate" type="date" required /></label>
              <label>End date<input name="endDate" type="date" required /></label>
            </div>
            <label>Timezone<select name="timezone" defaultValue="Europe/Madrid"><option>Europe/Madrid</option><option>Europe/Rome</option><option>Europe/London</option><option>America/New_York</option><option>Asia/Tokyo</option></select></label>
            <label>Description<textarea name="description" rows={3} placeholder="Notes, goals or a short overview" /></label>
            {error && <p className="form-error">{error}</p>}
            <div className="modal-actions"><button type="button" className="button ghost" onClick={() => setOpen(false)}>Cancel</button><button className="button primary" disabled={create.isPending}>{create.isPending ? 'Creating…' : 'Create itinerary'}</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
