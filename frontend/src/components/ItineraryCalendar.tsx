import type { CSSProperties } from 'react';
import { enumerateDates, formatDateRange, formatDay, shortTime } from '../lib/dates';
import { categoryLabels } from '../lib/labels';
import type { Itinerary, ItineraryEntry } from '../types';

export function ItineraryCalendar({
  itinerary,
  entries,
  canWrite,
  onCreate,
  onEdit,
}: {
  itinerary: Itinerary;
  entries: ItineraryEntry[];
  canWrite: boolean;
  onCreate: (date: string) => void;
  onEdit: (entry: ItineraryEntry) => void;
}) {
  const dates = enumerateDates(itinerary.startDate, itinerary.endDate);
  const grouped = new Map<string, ItineraryEntry[]>();
  for (const entry of entries) {
    const list = grouped.get(entry.entryDate) ?? [];
    list.push(entry);
    grouped.set(entry.entryDate, list);
  }

  const gridStyle = {
    '--calendar-columns': String(Math.min(dates.length, 10)),
    '--calendar-columns-tablet': String(Math.min(dates.length, 5)),
    '--calendar-columns-mobile': String(Math.min(dates.length, 2)),
  } as CSSProperties;

  return (
    <section className="calendar-shell" aria-label="Calendario del itinerario">
      <header className="print-itinerary-header">
        <div className="print-brand"><span className="brand-mark">I</span><span>Itinera</span></div>
        <div className="print-itinerary-copy">
          <span className="eyebrow">Itinerario de viaje</span>
          <h1>{itinerary.title}</h1>
          <p>{itinerary.destination || 'Destino por decidir'} · {formatDateRange(itinerary.startDate, itinerary.endDate)}</p>
          {itinerary.description && <small>{itinerary.description}</small>}
        </div>
      </header>
      <div className="calendar-hint">{canWrite ? 'Haz doble clic sobre un día o una actividad para editar.' : 'Itinerario de solo lectura.'}</div>
      <div className="calendar-grid" data-density={dates.length >= 8 ? 'compact' : 'comfortable'} style={gridStyle}>
        {dates.map((date) => {
          const day = formatDay(date);
          const dayEntries = grouped.get(date) ?? [];
          return (
            <article
              className="day-column"
              key={date}
              onDoubleClick={(event) => {
                if (canWrite && event.target === event.currentTarget) onCreate(date);
              }}
            >
              <header className="day-header">
                <div><span>{day.weekday}</span><strong>{day.day}</strong></div>
                <small>{day.month}</small>
              </header>
              <div className="day-content" onDoubleClick={() => canWrite && onCreate(date)}>
                {dayEntries.map((entry) => (
                  <button
                    type="button"
                    className="entry-card"
                    data-category={entry.category}
                    key={entry.id}
                    onDoubleClick={(event) => {
                      event.stopPropagation();
                      if (canWrite) onEdit(entry);
                    }}
                    onClick={(event) => event.stopPropagation()}
                    title={canWrite ? 'Haz doble clic para editar' : entry.title}
                  >
                    <span className="entry-meta"><span className="entry-time">{shortTime(entry.startTime)}{entry.endTime ? `–${shortTime(entry.endTime)}` : ''}</span><span className="entry-category">{categoryLabels[entry.category]}</span></span>
                    <strong>{entry.title}</strong>
                    {entry.location && <small>{entry.location}</small>}
                    {entry.description && <p>{entry.description}</p>}
                  </button>
                ))}
                {canWrite && <button type="button" className="add-entry" onClick={(event) => { event.stopPropagation(); onCreate(date); }}>＋ Añadir plan</button>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
