import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Modal } from '../components/Modal';
import { apiRequest, jsonBody } from '../lib/api';
import { formatDateRange } from '../lib/dates';
import { accessLabels } from '../lib/labels';
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
    if (!parsed.success) return setError('Revisa el título y las fechas del viaje.');
    if (parsed.data.endDate < parsed.data.startDate) return setError('La fecha de finalización no puede ser anterior a la fecha de inicio.');
    try {
      await create.mutateAsync(parsed.data);
    } catch (value) {
      setError(value instanceof Error ? value.message : 'No se pudo crear el itinerario.');
    }
  }

  return (
    <div className="page-container">
      <header className="page-heading split">
        <div>
          <span className="eyebrow">Tus viajes</span>
          <h1>Planes de viaje</h1>
          <p className="muted">Un espacio claro para cada día, horario e idea.</p>
        </div>
        <button className="button primary" onClick={() => setOpen(true)}>Nuevo itinerario</button>
      </header>

      {query.isLoading && <div className="center-state">Cargando viajes…</div>}
      {query.isError && <div className="empty-state"><h2>No se pudieron cargar tus viajes</h2><p>Actualiza la página e inténtalo de nuevo.</p></div>}
      {query.data?.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">✦</span>
          <h2>Tu primer itinerario empieza aquí</h2>
          <p>Crea un viaje y haz doble clic en cualquier día para añadir planes.</p>
          <button className="button primary" onClick={() => setOpen(true)}>Crear itinerario</button>
        </div>
      )}
      <div className="trip-grid">
        {query.data?.map((trip) => (
          <Link className="trip-card" to={`/itineraries/${trip.id}`} key={trip.id}>
            <div className="trip-card-top"><span className="pill">{accessLabels[trip.access || 'OWNER']}</span><span>→</span></div>
            <h2>{trip.title}</h2>
            <p>{trip.destination || 'Destino por decidir'}</p>
            <div className="trip-dates"><span>{formatDateRange(trip.startDate, trip.endDate)}</span></div>
          </Link>
        ))}
      </div>

      {open && (
        <Modal title="Crear itinerario" onClose={() => setOpen(false)}>
          <form className="form-stack" onSubmit={submit}>
            <label>Nombre del viaje<input name="title" placeholder="Viaje de verano por Dolomitas" required /></label>
            <label>Destino<input name="destination" placeholder="Norte de Italia" /></label>
            <div className="form-grid two">
              <label>Fecha de inicio<input name="startDate" type="date" required /></label>
              <label>Fecha de finalización<input name="endDate" type="date" required /></label>
            </div>
            <label>Zona horaria<select name="timezone" defaultValue="Europe/Madrid"><option>Europe/Madrid</option><option>Europe/Rome</option><option>Europe/London</option><option>America/New_York</option><option>Asia/Tokyo</option></select></label>
            <label>Descripción<textarea name="description" rows={3} placeholder="Notas, objetivos o una breve descripción" /></label>
            {error && <p className="form-error">{error}</p>}
            <div className="modal-actions"><button type="button" className="button ghost" onClick={() => setOpen(false)}>Cancelar</button><button className="button primary" disabled={create.isPending}>{create.isPending ? 'Creando…' : 'Crear itinerario'}</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
