import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { EntryForm, type EntryInput } from '../components/EntryForm';
import { ItineraryCalendar } from '../components/ItineraryCalendar';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { apiRequest, jsonBody } from '../lib/api';
import { formatDateRange } from '../lib/dates';
import { accessLabels, permissionLabels } from '../lib/labels';
import type { ItineraryBundle, ItineraryEntry, Permission } from '../types';

const settingsSchema = z.object({
  title: z.string().trim().min(2).max(140),
  destination: z.string().trim().max(140),
  description: z.string().trim().max(5000),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  timezone: z.string().min(1).max(80),
  publicShareEnabled: z.boolean(),
});

export function ItineraryPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editor, setEditor] = useState<{ date: string; startTime?: string; entry?: ItineraryEntry } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [collaborationOpen, setCollaborationOpen] = useState(false);
  const [dangerOpen, setDangerOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const query = useQuery({
    queryKey: ['itinerary', id],
    queryFn: () => apiRequest<ItineraryBundle>(`/itineraries/${id}`),
    enabled: Boolean(id),
  });

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['itinerary', id] }),
      queryClient.invalidateQueries({ queryKey: ['itineraries'] }),
    ]);
  }

  const saveEntry = useMutation({
    mutationFn: ({ input, entry }: { input: EntryInput; entry?: ItineraryEntry }) =>
      apiRequest(entry ? `/itineraries/${id}/entries/${entry.id}` : `/itineraries/${id}/entries`, {
        method: entry ? 'PATCH' : 'POST',
        ...jsonBody(input),
      }),
    onSuccess: async () => { setEditor(null); await refresh(); },
  });

  const deleteEntry = useMutation({
    mutationFn: (entryId: string) => apiRequest<void>(`/itineraries/${id}/entries/${entryId}`, { method: 'DELETE' }),
    onSuccess: async () => { setEditor(null); await refresh(); },
  });

  if (query.isLoading) return <div className="center-state">Abriendo itinerario…</div>;
  if (query.isError || !query.data) return <div className="empty-state"><h2>No se pudo abrir este itinerario</h2><button className="button ghost" onClick={() => navigate('/dashboard')}>Volver a los viajes</button></div>;

  const data = query.data;
  const canWrite = ['OWNER', 'WRITE', 'ADMIN'].includes(data.access);
  const canManage = ['OWNER', 'ADMIN'].includes(data.access);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const parsed = settingsSchema.safeParse({
      title: form.get('title'),
      destination: form.get('destination') || '',
      description: form.get('description') || '',
      startDate: form.get('startDate'),
      endDate: form.get('endDate'),
      timezone: form.get('timezone'),
      publicShareEnabled: form.get('publicShareEnabled') === 'on',
    });
    if (!parsed.success || parsed.data.endDate < parsed.data.startDate) return setError('Revisa los datos y las fechas del itinerario.');
    try {
      await apiRequest(`/itineraries/${id}`, { method: 'PATCH', ...jsonBody(parsed.data) });
      setSettingsOpen(false);
      await refresh();
    } catch (value) { setError(value instanceof Error ? value.message : 'No se pudo actualizar el itinerario.'); }
  }

  async function rotateShare() {
    setMessage('');
    try {
      const result = await apiRequest<{ shareUrl: string }>(`/itineraries/${id}/share/rotate`, { method: 'POST' });
      setShareUrl(result.shareUrl);
      await navigator.clipboard?.writeText(result.shareUrl);
      setMessage('Se ha creado y copiado un nuevo enlace de solo lectura.');
      await refresh();
    } catch (value) {
      setError(value instanceof Error ? value.message : 'No se pudo crear el enlace compartido.');
    }
  }

  async function addCollaborator(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      await apiRequest(`/itineraries/${id}/collaborators`, {
        method: 'POST',
        ...jsonBody({ email: String(form.get('email') || ''), permission: form.get('permission') }),
      });
      event.currentTarget.reset();
      await refresh();
    } catch (value) { setError(value instanceof Error ? value.message : 'No se pudo añadir al colaborador.'); }
  }

  async function updateCollaborator(userId: string, permission: Permission) {
    await apiRequest(`/itineraries/${id}/collaborators/${userId}`, { method: 'PATCH', ...jsonBody({ permission }) });
    await refresh();
  }

  async function removeCollaborator(userId: string) {
    if (!window.confirm('¿Eliminar a este colaborador?')) return;
    await apiRequest<void>(`/itineraries/${id}/collaborators/${userId}`, { method: 'DELETE' });
    await refresh();
  }

  async function deleteItinerary() {
    if (!window.confirm(`¿Eliminar permanentemente “${data.itinerary.title}”?`)) return;
    await apiRequest<void>(`/itineraries/${id}`, { method: 'DELETE' });
    await queryClient.invalidateQueries({ queryKey: ['itineraries'] });
    navigate('/dashboard');
  }

  return (
    <div className="itinerary-page">
      <header className="itinerary-heading">
        <div>
          <button className="back-link icon-label-button" onClick={() => navigate('/dashboard')}><Icon name="arrow-left" size={16} /><span>Viajes</span></button>
          <span className="eyebrow">{data.itinerary.destination || 'Itinerario'}</span>
          <h1>{data.itinerary.title}</h1>
          <p className="muted">{formatDateRange(data.itinerary.startDate, data.itinerary.endDate)} · {accessLabels[data.access]}</p>
        </div>
        <div className="inline-actions itinerary-actions" aria-label="Acciones del itinerario">
          <button className="action-icon print-action" onClick={() => window.print()} aria-label="Imprimir itinerario" title="Imprimir"><Icon name="printer" /></button>
          {canManage && <button className="action-icon" onClick={() => setCollaborationOpen(true)} aria-label="Gestionar colaboradores" title="Colaboradores"><Icon name="users" /></button>}
          {canManage && <button className="action-icon" onClick={() => setSettingsOpen(true)} aria-label="Configurar itinerario" title="Configuración"><Icon name="settings" /></button>}
          {canManage && <button className="action-icon accent" onClick={() => void rotateShare()} aria-label="Crear nuevo enlace compartido" title="Nuevo enlace compartido"><Icon name="share-2" /></button>}
          {canManage && <button className="action-icon danger-icon" onClick={() => setDangerOpen(true)} aria-label="Abrir zona de peligro" title="Eliminar itinerario"><Icon name="trash-2" /></button>}
        </div>
      </header>

      {message && <div className="notice success">{message}{shareUrl && <button className="action-icon compact" onClick={() => void navigator.clipboard?.writeText(shareUrl)} aria-label="Copiar enlace de nuevo" title="Copiar"><Icon name="copy" size={16} /></button>}</div>}
      {error && <div className="notice error">{error}</div>}

      <ItineraryCalendar itinerary={data.itinerary} entries={data.entries} canWrite={canWrite} onCreate={(date, startTime) => setEditor({ date, startTime })} onEdit={(entry) => setEditor({ date: entry.entryDate, startTime: entry.startTime.slice(0, 5), entry })} />

      {editor && (
        <Modal title={editor.entry ? 'Editar plan' : 'Añadir plan'} onClose={() => setEditor(null)}>
          <EntryForm
            date={editor.date}
            initialStartTime={editor.startTime}
            entry={editor.entry}
            busy={saveEntry.isPending || deleteEntry.isPending}
            onCancel={() => setEditor(null)}
            onSave={(input) => saveEntry.mutateAsync({ input, entry: editor.entry }).then(() => undefined)}
            onDelete={editor.entry ? () => deleteEntry.mutateAsync(editor.entry!.id).then(() => undefined) : undefined}
          />
        </Modal>
      )}


      {collaborationOpen && (
        <Modal title="Colaboradores" onClose={() => setCollaborationOpen(false)}>
          <p className="muted modal-intro">Invita a tus colegas y decide si pueden consultar o editar el viaje.</p>
          <form className="collaborator-form" onSubmit={addCollaborator}>
            <input name="email" type="email" placeholder="persona@ejemplo.com" aria-label="Correo del colaborador" required />
            <select name="permission" defaultValue="READ" aria-label="Permiso"><option value="READ">{permissionLabels.READ}</option><option value="WRITE">{permissionLabels.WRITE}</option></select>
            <button className="button primary icon-label-button"><Icon name="plus" /><span>Añadir</span></button>
          </form>
          <div className="collaborator-list">
            {data.collaborators.length === 0 && <div className="overlay-empty"><Icon name="users" size={24} /><p>Todavía no hay colaboradores.</p></div>}
            {data.collaborators.map((person) => (
              <div className="collaborator-row" key={person.userId}>
                <div><strong>{person.displayName}</strong><small>{person.email}</small></div>
                <select value={person.permission} onChange={(event) => void updateCollaborator(person.userId, event.target.value as Permission)} aria-label={`Permiso de ${person.displayName}`}><option value="READ">{permissionLabels.READ}</option><option value="WRITE">{permissionLabels.WRITE}</option></select>
                <button className="icon-button danger-icon" onClick={() => void removeCollaborator(person.userId)} aria-label={`Eliminar a ${person.displayName}`} title="Eliminar colaborador"><Icon name="trash-2" size={16} /></button>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {dangerOpen && (
        <Modal title="Eliminar itinerario" onClose={() => setDangerOpen(false)}>
          <div className="danger-overlay">
            <span className="danger-overlay-icon"><Icon name="trash-2" size={26} /></span>
            <div><h3>Esta acción es permanente</h3><p>Se eliminarán el itinerario, todos sus planes y las colaboraciones asociadas.</p></div>
          </div>
          <div className="modal-actions">
            <button type="button" className="button ghost icon-label-button" onClick={() => setDangerOpen(false)}><Icon name="x" /><span>Cancelar</span></button>
            <button type="button" className="button danger icon-label-button" onClick={() => void deleteItinerary()}><Icon name="trash-2" /><span>Eliminar definitivamente</span></button>
          </div>
        </Modal>
      )}

      {settingsOpen && (
        <Modal title="Configuración del itinerario" onClose={() => setSettingsOpen(false)}>
          <form className="form-stack" onSubmit={saveSettings}>
            <label>Nombre del viaje<input name="title" defaultValue={data.itinerary.title} required /></label>
            <label>Destino<input name="destination" defaultValue={data.itinerary.destination} /></label>
            <div className="form-grid two"><label>Fecha de inicio<input name="startDate" type="date" defaultValue={data.itinerary.startDate} required /></label><label>Fecha de finalización<input name="endDate" type="date" defaultValue={data.itinerary.endDate} required /></label></div>
            <label>Zona horaria<input name="timezone" defaultValue={data.itinerary.timezone} required /></label>
            <label>Descripción<textarea name="description" rows={4} defaultValue={data.itinerary.description} /></label>
            <label className="checkbox-row"><input name="publicShareEnabled" type="checkbox" defaultChecked={data.itinerary.publicShareEnabled} /><span>Activar enlace público de solo lectura</span></label>
            {error && <p className="form-error">{error}</p>}
            <div className="modal-actions"><button type="button" className="button ghost" onClick={() => setSettingsOpen(false)}>Cancelar</button><button className="button primary">Guardar configuración</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
