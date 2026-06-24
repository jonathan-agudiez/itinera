import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { EntryForm, type EntryInput } from '../components/EntryForm';
import { ItineraryCalendar } from '../components/ItineraryCalendar';
import { Modal } from '../components/Modal';
import { apiRequest, jsonBody } from '../lib/api';
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
  const [editor, setEditor] = useState<{ date: string; entry?: ItineraryEntry } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
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

  if (query.isLoading) return <div className="center-state">Opening itinerary…</div>;
  if (query.isError || !query.data) return <div className="empty-state"><h2>Could not open this itinerary</h2><button className="button ghost" onClick={() => navigate('/dashboard')}>Back to trips</button></div>;

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
    if (!parsed.success || parsed.data.endDate < parsed.data.startDate) return setError('Check the itinerary details and dates.');
    try {
      await apiRequest(`/itineraries/${id}`, { method: 'PATCH', ...jsonBody(parsed.data) });
      setSettingsOpen(false);
      await refresh();
    } catch (value) { setError(value instanceof Error ? value.message : 'Could not update itinerary.'); }
  }

  async function rotateShare() {
    setMessage('');
    const result = await apiRequest<{ shareUrl: string }>(`/itineraries/${id}/share/rotate`, { method: 'POST' });
    setShareUrl(result.shareUrl);
    await navigator.clipboard?.writeText(result.shareUrl);
    setMessage('A new read-only link was created and copied.');
    await refresh();
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
    } catch (value) { setError(value instanceof Error ? value.message : 'Could not add collaborator.'); }
  }

  async function updateCollaborator(userId: string, permission: Permission) {
    await apiRequest(`/itineraries/${id}/collaborators/${userId}`, { method: 'PATCH', ...jsonBody({ permission }) });
    await refresh();
  }

  async function removeCollaborator(userId: string) {
    if (!window.confirm('Remove this collaborator?')) return;
    await apiRequest<void>(`/itineraries/${id}/collaborators/${userId}`, { method: 'DELETE' });
    await refresh();
  }

  async function deleteItinerary() {
    if (!window.confirm(`Delete “${data.itinerary.title}” permanently?`)) return;
    await apiRequest<void>(`/itineraries/${id}`, { method: 'DELETE' });
    await queryClient.invalidateQueries({ queryKey: ['itineraries'] });
    navigate('/dashboard');
  }

  return (
    <div className="itinerary-page">
      <header className="itinerary-heading">
        <div>
          <button className="back-link" onClick={() => navigate('/dashboard')}>← All trips</button>
          <span className="eyebrow">{data.itinerary.destination || 'Itinerary'}</span>
          <h1>{data.itinerary.title}</h1>
          <p className="muted">{data.itinerary.startDate} — {data.itinerary.endDate} · {data.access}</p>
        </div>
        <div className="inline-actions">
          {canManage && <button className="button ghost" onClick={() => setSettingsOpen(true)}>Settings</button>}
          {canManage && <button className="button primary" onClick={() => void rotateShare()}>New share link</button>}
        </div>
      </header>

      {message && <div className="notice success">{message}{shareUrl && <button className="text-button" onClick={() => void navigator.clipboard?.writeText(shareUrl)}>Copy again</button>}</div>}

      <ItineraryCalendar itinerary={data.itinerary} entries={data.entries} canWrite={canWrite} onCreate={(date) => setEditor({ date })} onEdit={(entry) => setEditor({ date: entry.entryDate, entry })} />

      {canManage && (
        <section className="management-grid">
          <div className="panel-card">
            <span className="eyebrow">Collaboration</span>
            <h2>People with access</h2>
            <form className="collaborator-form" onSubmit={addCollaborator}>
              <input name="email" type="email" placeholder="person@example.com" required />
              <select name="permission" defaultValue="READ"><option value="READ">Read</option><option value="WRITE">Write</option></select>
              <button className="button primary">Add</button>
            </form>
            {error && <p className="form-error">{error}</p>}
            <div className="collaborator-list">
              {data.collaborators.length === 0 && <p className="muted">No collaborators yet.</p>}
              {data.collaborators.map((person) => (
                <div className="collaborator-row" key={person.userId}>
                  <div><strong>{person.displayName}</strong><small>{person.email}</small></div>
                  <select value={person.permission} onChange={(event) => void updateCollaborator(person.userId, event.target.value as Permission)}><option value="READ">Read</option><option value="WRITE">Write</option></select>
                  <button className="icon-button" onClick={() => void removeCollaborator(person.userId)} aria-label="Remove collaborator">×</button>
                </div>
              ))}
            </div>
          </div>
          <div className="panel-card danger-panel">
            <span className="eyebrow">Danger zone</span>
            <h2>Delete itinerary</h2>
            <p className="muted">This permanently removes every activity and collaboration record.</p>
            <button className="button danger" onClick={() => void deleteItinerary()}>Delete itinerary</button>
          </div>
        </section>
      )}

      {editor && (
        <Modal title={editor.entry ? 'Edit plan' : 'Add plan'} onClose={() => setEditor(null)}>
          <EntryForm
            date={editor.date}
            entry={editor.entry}
            busy={saveEntry.isPending || deleteEntry.isPending}
            onCancel={() => setEditor(null)}
            onSave={(input) => saveEntry.mutateAsync({ input, entry: editor.entry }).then(() => undefined)}
            onDelete={editor.entry ? () => deleteEntry.mutateAsync(editor.entry!.id).then(() => undefined) : undefined}
          />
        </Modal>
      )}

      {settingsOpen && (
        <Modal title="Itinerary settings" onClose={() => setSettingsOpen(false)}>
          <form className="form-stack" onSubmit={saveSettings}>
            <label>Trip name<input name="title" defaultValue={data.itinerary.title} required /></label>
            <label>Destination<input name="destination" defaultValue={data.itinerary.destination} /></label>
            <div className="form-grid two"><label>Start date<input name="startDate" type="date" defaultValue={data.itinerary.startDate} required /></label><label>End date<input name="endDate" type="date" defaultValue={data.itinerary.endDate} required /></label></div>
            <label>Timezone<input name="timezone" defaultValue={data.itinerary.timezone} required /></label>
            <label>Description<textarea name="description" rows={4} defaultValue={data.itinerary.description} /></label>
            <label className="checkbox-row"><input name="publicShareEnabled" type="checkbox" defaultChecked={data.itinerary.publicShareEnabled} /><span>Enable read-only public link</span></label>
            {error && <p className="form-error">{error}</p>}
            <div className="modal-actions"><button type="button" className="button ghost" onClick={() => setSettingsOpen(false)}>Cancel</button><button className="button primary">Save settings</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
