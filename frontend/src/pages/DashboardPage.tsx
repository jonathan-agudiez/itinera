import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { apiRequest, jsonBody } from '../lib/api';
import { formatDateRange } from '../lib/dates';
import { useAuth } from '../lib/auth';
import { accessLabels } from '../lib/labels';
import type { Itinerary, ItineraryBundle } from '../types';

const schema = z.object({
  title: z.string().trim().min(2).max(140),
  destination: z.string().trim().max(140),
  description: z.string().trim().max(5000),
  startDate: z.iso.date(),
  dayCount: z.coerce.number().int().min(1).max(10),
  timezone: z.string().min(1).max(80),
});

export function DashboardPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');

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
    const parsed = schema.safeParse({
      title: form.get('title'),
      destination: form.get('destination') || '',
      description: form.get('description') || '',
      startDate: form.get('startDate'),
      dayCount: form.get('dayCount'),
      timezone: form.get('timezone') || 'Europe/Madrid',
    });
    if (!parsed.success) return setError('Revisa el nombre, la fecha y el número de días.');
    try {
      await create.mutateAsync(parsed.data);
    } catch (value) {
      setError(value instanceof Error ? value.message : 'No se pudo crear el itinerario.');
    }
  }

  async function hideItinerary(itinerary: Itinerary) {
    const confirmed = window.confirm(
      `¿Quitar “${itinerary.title}” de tus itinerarios? No se borrará y el propietario conservará el original.`,
    );
    if (!confirmed) return;

    setListError('');
    try {
      await apiRequest<void>(`/itineraries/${itinerary.id}/hide`, { method: 'POST' });
      await queryClient.invalidateQueries({ queryKey: ['itineraries'] });
    } catch (value) {
      setListError(value instanceof Error ? value.message : 'No se pudo quitar el itinerario de tu vista.');
    }
  }

  return (
    <div className="page-container">
      <header className="page-heading split">
        <div>
          <span className="eyebrow">Tus viajes</span>
          <h1>Itinerarios</h1>
        </div>
        <button className="button primary" onClick={() => setOpen(true)}><Icon name="plus" size={17} />Nuevo itinerario</button>
      </header>

      {listError && <div className="notice error">{listError}</div>}
      {query.isLoading && <div className="center-state">Cargando…</div>}
      {query.isError && <div className="empty-state"><h2>No se pudieron cargar tus viajes</h2></div>}
      {query.data?.length === 0 && (
        <div className="empty-state">
          <h2>Aún no tienes itinerarios</h2>
          <button className="button primary" onClick={() => setOpen(true)}><Icon name="plus" size={17} />Crear itinerario</button>
        </div>
      )}
      <div className="trip-grid">
        {query.data?.map((trip) => {
          const canHide = Boolean(user && trip.ownerId !== user.id);
          return (
            <article className={`trip-card${canHide ? ' has-actions' : ''}`} key={trip.id}>
              <Link className="trip-card-link" to={`/itineraries/${trip.id}`}>
                <div className="trip-card-top"><span className="pill">{accessLabels[trip.access || 'OWNER']}</span></div>
                <h2>{trip.title}</h2>
                <p>{trip.destination || 'Destino por decidir'}</p>
                <div className="trip-dates"><span>{formatDateRange(trip.startDate, trip.endDate)}</span></div>
              </Link>
              {canHide && (
                <button
                  type="button"
                  className="trip-hide-button"
                  onClick={() => void hideItinerary(trip)}
                  aria-label={`Quitar ${trip.title} de mis itinerarios`}
                  title="Quitar de mis itinerarios"
                >
                  <Icon name="eye-off" size={16} />
                  <span>Quitar de mis itinerarios</span>
                </button>
              )}
            </article>
          );
        })}
      </div>

      {open && (
        <Modal title="Crear itinerario" onClose={() => setOpen(false)}>
          <form className="form-stack" onSubmit={submit}>
            <label>Nombre<input name="title" placeholder="Dolomitas" required /></label>
            <label>Destino<input name="destination" placeholder="Norte de Italia" /></label>
            <div className="form-grid two">
              <label>Fecha de inicio<input name="startDate" type="date" required /></label>
              <label>Número de días<input name="dayCount" type="number" min="1" max="10" defaultValue="5" required /></label>
            </div>
            <label>Zona horaria<select name="timezone" defaultValue="Europe/Madrid"><option>Europe/Madrid</option><option>Europe/Rome</option><option>Europe/London</option><option>America/New_York</option><option>Asia/Tokyo</option></select></label>
            <label>Descripción<textarea name="description" rows={3} /></label>
            {error && <p className="form-error">{error}</p>}
            <div className="modal-actions"><button type="button" className="button ghost" onClick={() => setOpen(false)}>Cancelar</button><button className="button primary" disabled={create.isPending}>{create.isPending ? 'Creando…' : 'Crear'}</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
