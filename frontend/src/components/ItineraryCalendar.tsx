import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { enumerateDates, formatDateRange, formatDay, shortTime } from '../lib/dates';
import { categoryLabels } from '../lib/labels';
import type { Category, Itinerary, ItineraryEntry } from '../types';
import { Icon, type IconName } from './Icon';

const hours = [
  '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00',
] as const;

const categoryIcons: Record<Category, IconName> = {
  transport: 'car',
  stay: 'bed-double',
  food: 'utensils',
  visit: 'landmark',
  activity: 'sparkles',
  note: 'notebook-pen',
};

function hourBucket(time: string): string {
  const hour = Number.parseInt(time.slice(0, 2), 10);
  if (hour >= 1 && hour <= 4) return '00:00';
  return `${String(hour).padStart(2, '0')}:00`;
}

function entriesForSlot(entries: ItineraryEntry[], date: string, hour: string): ItineraryEntry[] {
  return entries
    .filter((entry) => entry.entryDate === date && hourBucket(entry.startTime) === hour)
    .sort((a, b) => a.startTime.localeCompare(b.startTime) || a.sortOrder - b.sortOrder);
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
  onCreate: (date: string, startTime?: string) => void;
  onEdit: (entry: ItineraryEntry) => void;
}) {
  const dates = enumerateDates(itinerary.startDate, itinerary.endDate);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const grouped = useMemo(() => {
    const map = new Map<string, ItineraryEntry[]>();
    for (const entry of entries) {
      const list = map.get(entry.entryDate) ?? [];
      list.push(entry);
      map.set(entry.entryDate, list);
    }
    return map;
  }, [entries]);

  useEffect(() => {
    setSelectedIndex((current) => Math.min(current, Math.max(dates.length - 1, 0)));
  }, [dates.length]);

  const gridStyle = {
    '--calendar-columns': String(Math.max(dates.length, 1)),
  } as CSSProperties;

  const selectedDate = dates[selectedIndex] ?? itinerary.startDate;
  const selectedDay = formatDay(selectedDate);
  const selectedEntries = grouped.get(selectedDate) ?? [];

  function renderEntry(entry: ItineraryEntry, mobile = false) {
    return (
      <button
        type="button"
        className={`entry-card${mobile ? ' mobile-entry-card' : ''}`}
        data-category={entry.category}
        data-color={entry.color || 'sage'}
        key={entry.id}
        onClick={(event) => {
          event.stopPropagation();
          if (canWrite) onEdit(entry);
        }}
        title={canWrite ? `Editar: ${entry.title}` : entry.title}
        aria-label={`${entry.title}${canWrite ? '. Selecciona para editar' : ''}`}
      >
        <span className="entry-meta">
          <span className="entry-time"><Icon name="clock" size={13} />{shortTime(entry.startTime)}{entry.endTime ? `–${shortTime(entry.endTime)}` : ''}</span>
          <span className="entry-category" title={categoryLabels[entry.category]}><Icon name={categoryIcons[entry.category]} size={13} /><span>{categoryLabels[entry.category]}</span></span>
        </span>
        <strong>{entry.title}</strong>
        {entry.location && <small className="entry-location"><Icon name="map-pin" size={12} />{entry.location}</small>}
        {entry.description && <p>{entry.description}</p>}
        {canWrite && <span className="entry-edit-cue"><Icon name="edit-3" size={12} /></span>}
      </button>
    );
  }

  return (
    <section className="calendar-shell" aria-label="Horario del itinerario">
      <header className="print-itinerary-header">
        <div className="print-brand"><span className="brand-mark">I</span><span>Itinera</span></div>
        <div className="print-itinerary-copy">
          <span className="eyebrow">Itinerario de viaje</span>
          <h1>{itinerary.title}</h1>
          <p>{itinerary.destination || 'Destino por decidir'} · {formatDateRange(itinerary.startDate, itinerary.endDate)}</p>
        </div>
      </header>

      <div className="calendar-hint">
        <Icon name="clock" size={15} />
        <span>{canWrite ? 'Pulsa una celda para añadir un plan o una tarjeta para editarla.' : 'Horario de solo lectura.'}</span>
      </div>

      <div className="schedule-grid calendar-desktop" style={gridStyle} data-days={dates.length} data-density={dates.length >= 11 ? 'ultra' : dates.length >= 8 ? 'compact' : 'normal'}>
        <div className="schedule-corner"><Icon name="clock" size={15} /><span>Hora</span></div>
        {dates.map((date, index) => {
          const day = formatDay(date);
          return (
            <header className="schedule-day-header" key={`header-${date}`}>
              <span>Día {index + 1}</span>
              <strong>{day.weekday} {day.day}</strong>
              <small>{day.month}</small>
            </header>
          );
        })}

        {hours.map((hour) => (
          <div className="schedule-row" key={hour} style={{ display: 'contents' }}>
            <div className="schedule-time"><span>{hour}</span></div>
            {dates.map((date) => {
              const slotEntries = entriesForSlot(entries, date, hour);
              return (
                <div
                  className="schedule-slot"
                  key={`${date}-${hour}`}
                  onDoubleClick={() => canWrite && onCreate(date, hour)}
                >
                  <div className="schedule-slot-entries" data-count={slotEntries.length > 4 ? 'many' : String(slotEntries.length)}>{slotEntries.map((entry) => renderEntry(entry))}</div>
                  {canWrite && (
                    <button
                      type="button"
                      className="slot-add-button"
                      onClick={() => onCreate(date, hour)}
                      aria-label={`Añadir plan el ${date} a las ${hour}`}
                      title={`Añadir plan a las ${hour}`}
                    >
                      <Icon name="plus" size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="calendar-mobile">
        <div className="mobile-day-toolbar">
          <button
            type="button"
            className="mobile-day-arrow"
            disabled={selectedIndex === 0}
            onClick={() => setSelectedIndex((index) => Math.max(0, index - 1))}
            aria-label="Día anterior"
          >
            <Icon name="chevron-left" />
          </button>
          <label className="mobile-day-picker">
            <span>Día {selectedIndex + 1} de {dates.length}</span>
            <select value={selectedDate} onChange={(event) => setSelectedIndex(Math.max(0, dates.indexOf(event.target.value)))}>
              {dates.map((date, index) => {
                const day = formatDay(date);
                return <option value={date} key={date}>Día {index + 1}: {day.weekday} {day.day} de {day.month}</option>;
              })}
            </select>
          </label>
          <button
            type="button"
            className="mobile-day-arrow"
            disabled={selectedIndex === dates.length - 1}
            onClick={() => setSelectedIndex((index) => Math.min(dates.length - 1, index + 1))}
            aria-label="Día siguiente"
          >
            <Icon name="chevron-right" />
          </button>
        </div>

        <article className="mobile-day-card" key={selectedDate}>
          <header className="mobile-day-header">
            <div>
              <span>{selectedDay.weekday}</span>
              <strong>{selectedDay.day}</strong>
              <small>{selectedDay.month}</small>
            </div>
            <span className="mobile-entry-count">{selectedEntries.length} {selectedEntries.length === 1 ? 'plan' : 'planes'}</span>
          </header>
          <div className="mobile-timeline">
            {hours.map((hour) => {
              const slotEntries = entriesForSlot(entries, selectedDate, hour);
              return (
                <div className="mobile-time-row" key={hour}>
                  <div className="mobile-time-label">{hour}</div>
                  <div className="mobile-time-slot">
                    {slotEntries.map((entry) => renderEntry(entry, true))}
                    {slotEntries.length === 0 && <span className="mobile-empty-slot" aria-hidden="true" />}
                    {canWrite && (
                      <button
                        type="button"
                        className="mobile-slot-add"
                        onClick={() => onCreate(selectedDate, hour)}
                        aria-label={`Añadir plan a las ${hour}`}
                        title={`Añadir plan a las ${hour}`}
                      >
                        <Icon name="plus" size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </div>
    </section>
  );
}
