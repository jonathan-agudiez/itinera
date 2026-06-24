import { enumerateDates, formatDay, shortTime } from '../lib/dates';
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

  return (
    <section className="calendar-shell" aria-label="Itinerary calendar">
      <div className="calendar-hint">{canWrite ? 'Double-click a day or an activity to edit.' : 'Read-only itinerary.'}</div>
      <div className="calendar-grid" style={{ gridTemplateColumns: `repeat(${dates.length}, minmax(250px, 1fr))` }}>
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
                    title={canWrite ? 'Double-click to edit' : entry.title}
                  >
                    <span className="entry-time">{shortTime(entry.startTime)}{entry.endTime ? `–${shortTime(entry.endTime)}` : ''}</span>
                    <strong>{entry.title}</strong>
                    {entry.location && <small>{entry.location}</small>}
                    {entry.description && <p>{entry.description}</p>}
                  </button>
                ))}
                {canWrite && <button type="button" className="add-entry" onClick={(event) => { event.stopPropagation(); onCreate(date); }}>＋ Add plan</button>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
