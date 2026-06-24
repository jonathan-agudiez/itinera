const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function enumerateDates(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(`${startDate}T12:00:00Z`);
  const end = new Date(`${endDate}T12:00:00Z`);
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

export function formatDay(date: string): { weekday: string; day: string; month: string } {
  const value = new Date(`${date}T12:00:00`);
  return {
    weekday: new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(value).replace('.', ''),
    day: new Intl.DateTimeFormat('es-ES', { day: '2-digit' }).format(value),
    month: new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(value).replace('.', ''),
  };
}

export function formatDate(date: string): string {
  return dateFormatter.format(new Date(`${date}T12:00:00`));
}

export function formatDateRange(startDate: string, endDate: string): string {
  return `${formatDate(startDate)} — ${formatDate(endDate)}`;
}

export function shortTime(value: string | null): string {
  return value ? value.slice(0, 5) : '';
}
