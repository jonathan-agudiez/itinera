import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import { categoryLabels } from '../lib/labels';
import type { Category, ItineraryEntry, PlanColor } from '../types';

export const planColors: Array<{ value: PlanColor; label: string }> = [
  { value: 'sage', label: 'Salvia' },
  { value: 'sky', label: 'Cielo' },
  { value: 'lavender', label: 'Lavanda' },
  { value: 'sand', label: 'Arena' },
  { value: 'coral', label: 'Coral' },
  { value: 'mint', label: 'Menta' },
  { value: 'blue', label: 'Azul' },
  { value: 'rose', label: 'Rosa' },
  { value: 'amber', label: 'Ámbar' },
  { value: 'olive', label: 'Oliva' },
  { value: 'slate', label: 'Pizarra' },
  { value: 'teal', label: 'Turquesa' },
];

const schema = z.object({
  entryDate: z.iso.date(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.union([z.literal(''), z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)]),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(10_000),
  location: z.string().trim().max(180),
  category: z.enum(['transport', 'stay', 'food', 'visit', 'activity', 'note']),
  color: z.enum(['sage', 'sky', 'lavender', 'sand', 'coral', 'mint', 'blue', 'rose', 'amber', 'olive', 'slate', 'teal']),
});

export type EntryInput = Omit<z.infer<typeof schema>, 'endTime'> & { endTime: string | null; version?: number };

export function EntryForm({
  date,
  initialStartTime,
  entry,
  busy,
  onSave,
  onDelete,
  onCancel,
}: {
  date: string;
  initialStartTime?: string;
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
      description: form.get('description'),
      location: form.get('location') || '',
      category: form.get('category'),
      color: form.get('color'),
    });
    if (!parsed.success) return setError('Revisa la fecha, la hora, el título, la descripción y el color.');
    if (parsed.data.endTime && parsed.data.endTime <= parsed.data.startTime) {
      return setError('La hora de finalización debe ser posterior a la hora de inicio.');
    }
    try {
      await onSave({
        ...parsed.data,
        endTime: parsed.data.endTime || null,
        ...(entry ? { version: entry.version } : {}),
      });
    } catch (value) {
      setError(value instanceof Error ? value.message : 'No se pudo guardar la actividad.');
    }
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      <div className="form-grid three">
        <label>Fecha<input name="entryDate" type="date" defaultValue={entry?.entryDate || date} required /></label>
        <label>Empieza<input name="startTime" type="time" defaultValue={entry?.startTime.slice(0, 5) || initialStartTime || '09:00'} required /></label>
        <label>Termina<input name="endTime" type="time" defaultValue={entry?.endTime?.slice(0, 5) || ''} /></label>
      </div>
      <label>Título<input name="title" defaultValue={entry?.title || ''} placeholder="Ferry a Bellagio" autoFocus required /></label>
      <label>Ubicación<input name="location" defaultValue={entry?.location || ''} placeholder="Embarcadero de Varenna" /></label>
      <label>Categoría<select name="category" defaultValue={entry?.category || 'activity'}>{(['activity', 'visit', 'transport', 'stay', 'food', 'note'] as Category[]).map((category) => <option key={category} value={category}>{categoryLabels[category]}</option>)}</select></label>
      <fieldset className="color-fieldset">
        <legend>Color</legend>
        <div className="color-palette" role="radiogroup" aria-label="Color del plan">
          {planColors.map((color) => (
            <label className="color-option" data-color={color.value} key={color.value} title={color.label}>
              <input type="radio" name="color" value={color.value} defaultChecked={(entry?.color || 'sage') === color.value} />
              <span className="color-swatch" />
              <span className="sr-only">{color.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label>Descripción<textarea name="description" rows={4} defaultValue={entry?.description || ''} placeholder="Entradas, recordatorios, detalles de la ruta…" required /></label>
      {error && <p className="form-error">{error}</p>}
      <div className="modal-actions spread">
        <div>{entry && onDelete && <button type="button" className="button danger-ghost" onClick={() => void onDelete()} disabled={busy}>Eliminar</button>}</div>
        <div className="inline-actions"><button type="button" className="button ghost" onClick={onCancel}>Cancelar</button><button className="button primary" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button></div>
      </div>
    </form>
  );
}
