import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { enumerateDates, formatDateRange, formatDay, shortTime } from '../lib/dates';
import type { Itinerary, ItineraryEntry } from '../types';
import { Icon } from './Icon';

function sortEntries(entries: ItineraryEntry[]): ItineraryEntry[] {
  return [...entries].sort(
    (a, b) => a.startTime.localeCompare(b.startTime) || a.sortOrder - b.sortOrder,
  );
}

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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const grouped = useMemo(() => {
    const map = new Map<string, ItineraryEntry[]>();
    for (const date of dates) map.set(date, []);
    for (const entry of entries) {
      const current = map.get(entry.entryDate) ?? [];
      current.push(entry);
      map.set(entry.entryDate, current);
    }
    for (const [date, dateEntries] of map) map.set(date, sortEntries(dateEntries));
    return map;
  }, [dates, entries]);

  useEffect(() => {
    setSelectedIndex((current) => Math.min(current, Math.max(dates.length - 1, 0)));
  }, [dates.length]);

  const gridStyle = {
    '--calendar-columns': String(Math.max(dates.length, 1)),
  } as CSSProperties;

  const selectedDate = dates[selectedIndex] ?? itinerary.startDate;
  const selectedDay = formatDay(selectedDate);
  const selectedEntries = grouped.get(selectedDate) ?? [];
  const maxEntriesPerDay = Math.max(0, ...dates.map((date) => grouped.get(date)?.length ?? 0));
  const printDensity = maxEntriesPerDay >= 10 ? 'dense' : maxEntriesPerDay >= 6 ? 'medium' : 'relaxed';

  function renderEntry(entry: ItineraryEntry, mobile = false) {
    const time = `${shortTime(entry.startTime)}${entry.endTime ? `–${shortTime(entry.endTime)}` : ''}`;
    return (
      <button
        type="button"
        className={`entry-card${mobile ? ' mobile-entry-card' : ''}`}
        data-color={entry.color || 'sage'}
        key={entry.id}
        onClick={() => canWrite && onEdit(entry)}
        title={canWrite ? `Editar ${entry.title}` : entry.title}
        aria-label={`${time}. ${entry.title}${canWrite ? '. Abrir edición' : ''}`}
      >
        <span className="entry-time">{time}</span>
        <strong className="entry-title">{entry.title}</strong>
        {entry.location && <small className="entry-location">{entry.location}</small>}
        {entry.description && <p>{entry.description}</p>}
      </button>
    );
  }

  return (
    <section className="calendar-shell" aria-label="Itinerario">
      <header className="print-itinerary-header">
        <div className="print-brand"><span className="brand-mark">I</span><span>Itinera</span></div>
        <div className="print-itinerary-copy">
          <span className="eyebrow">Itinerario</span>
          <h1>{itinerary.title}</h1>
          <p>{itinerary.destination || 'Destino por decidir'} · {formatDateRange(itinerary.startDate, itinerary.endDate)}</p>
          {itinerary.description && <small>{itinerary.description}</small>}
        </div>
      </header>

      <div
        className="calendar-grid calendar-desktop"
        style={gridStyle}
        data-density={dates.length >= 8 ? 'compact' : 'normal'}
        data-print-density={printDensity}
      >
        {dates.map((date) => {
          const day = formatDay(date);
          const dateEntries = grouped.get(date) ?? [];
          return (
            <article className="day-column" key={date}>
              <header className="day-header">
                <div className="day-date">
                  <span>{day.weekday}</span>
                  <strong>{day.day}</strong>
                  <small>{day.month}</small>
                </div>
                {canWrite && (
                  <button
                    type="button"
                    className="day-add"
                    onClick={() => onCreate(date)}
                    aria-label={`Añadir plan el ${date}`}
                    title="Añadir plan"
                  >
                    <Icon name="plus" size={15} />
                  </button>
                )}
              </header>
              <div className="day-content">
                {dateEntries.map((entry) => renderEntry(entry))}
                {dateEntries.length === 0 && <div className="day-empty" aria-hidden="true" />}
              </div>
            </article>
          );
        })}
      </div>

      <div className="calendar-mobile">
        <div className="mobile-day-toolbar">
          <button
            type="button"
            className="mobile-day-arrow"
            disabled={selectedIndex === 0}
            onClick={() => setSelectedIndex((index) => Math.max(0, index - 1))}
            aria-label="Fecha anterior"
            title="Fecha anterior"
          >
            <Icon name="chevron-left" />
          </button>
          <label className="mobile-day-picker">
            <span className="sr-only">Seleccionar fecha</span>
            <select value={selectedDate} onChange={(event) => setSelectedIndex(Math.max(0, dates.indexOf(event.target.value)))}>
              {dates.map((date) => {
                const day = formatDay(date);
                return <option value={date} key={date}>{day.weekday} {day.day} {day.month}</option>;
              })}
            </select>
          </label>
          <button
            type="button"
            className="mobile-day-arrow"
            disabled={selectedIndex === dates.length - 1}
            onClick={() => setSelectedIndex((index) => Math.min(dates.length - 1, index + 1))}
            aria-label="Fecha siguiente"
            title="Fecha siguiente"
          >
            <Icon name="chevron-right" />
          </button>
        </div>

        <article className="mobile-day-card" key={selectedDate}>
          <header className="mobile-day-header">
            <div className="day-date">
              <span>{selectedDay.weekday}</span>
              <strong>{selectedDay.day}</strong>
              <small>{selectedDay.month}</small>
            </div>
            {canWrite && (
              <button
                type="button"
                className="day-add"
                onClick={() => onCreate(selectedDate)}
                aria-label={`Añadir plan el ${selectedDate}`}
                title="Añadir plan"
              >
                <Icon name="plus" size={16} />
              </button>
            )}
          </header>
          <div className="mobile-day-content">
            {selectedEntries.map((entry) => renderEntry(entry, true))}
            {selectedEntries.length === 0 && <div className="mobile-empty-day" aria-hidden="true" />}
          </div>
        </article>
      </div>
    </section>
  );
}
