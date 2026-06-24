import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import type { Category, ItineraryEntry } from '../types';

const schema = z.object({
  entryDate: z.iso.date(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.union([z.literal(''), z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)]),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(10_000),
  location: z.string().trim().max(180),
  category: z.enum(['transport', 'stay', 'food', 'visit', 'activity', 'note']),
});

export type EntryInput = Omit<z.infer<typeof schema>, 'endTime'> & { endTime: string | null; version?: number };

export function EntryForm({
  date,
  entry,
  busy,
  onSave,
  onDelete,
  onCancel,
}: {
  date: string;
  entry?: ItineraryEntry;
  busy: boolean;
  onSave: (input: EntryInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel: () => void;
}) {
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const parsed = schema.safeParse({
      entryDate: form.get('entryDate'),
      startTime: form.get('startTime'),
      endTime: form.get('endTime') || '',
      title: form.get('title'),
      description: form.get('description') || '',
      location: form.get('location') || '',
      category: form.get('category'),
    });
    if (!parsed.success) return setError('Check the date, time and title.');
    if (parsed.data.endTime && parsed.data.endTime <= parsed.data.startTime) {
      return setError('End time must be later than start time.');
    }
    try {
      await onSave({
        ...parsed.data,
        endTime: parsed.data.endTime || null,
        ...(entry ? { version: entry.version } : {}),
      });
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Could not save the activity.');
    }
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      <div className="form-grid three">
        <label>Date<input name="entryDate" type="date" defaultValue={entry?.entryDate || date} required /></label>
        <label>Starts<input name="startTime" type="time" defaultValue={entry?.startTime.slice(0, 5) || '09:00'} required /></label>
        <label>Ends<input name="endTime" type="time" defaultValue={entry?.endTime?.slice(0, 5) || ''} /></label>
      </div>
      <label>Title<input name="title" defaultValue={entry?.title || ''} placeholder="Ferry to Bellagio" autoFocus required /></label>
      <label>Location<input name="location" defaultValue={entry?.location || ''} placeholder="Varenna pier" /></label>
      <label>Category<select name="category" defaultValue={entry?.category || 'activity'}>{(['activity', 'visit', 'transport', 'stay', 'food', 'note'] as Category[]).map((category) => <option key={category} value={category}>{category[0].toUpperCase() + category.slice(1)}</option>)}</select></label>
      <label>Description<textarea name="description" rows={4} defaultValue={entry?.description || ''} placeholder="Tickets, reminders, route details…" /></label>
      {error && <p className="form-error">{error}</p>}
      <div className="modal-actions spread">
        <div>{entry && onDelete && <button type="button" className="button danger-ghost" onClick={() => void onDelete()} disabled={busy}>Delete</button>}</div>
        <div className="inline-actions"><button type="button" className="button ghost" onClick={onCancel}>Cancel</button><button className="button primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></div>
      </div>
    </form>
  );
}
