import { z } from 'zod';
import { AppError } from './errors.js';

export const uuidSchema = z.uuid();
export const emailSchema = z.email().max(320).transform((value) => value.trim().toLowerCase());
export const passwordSchema = z
  .string()
  .min(6, 'La contraseña debe tener al menos 6 caracteres')
  .max(128);

export const dateSchema = z.iso.date();
export const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export function parseInput<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AppError(422, 'VALIDATION_ERROR', 'Los datos enviados no son válidos', result.error.flatten());
  }
  return result.data;
}

export function dayCountFromRange(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

export function endDateFromDayCount(startDate: string, dayCount: number): string {
  const end = new Date(`${startDate}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + dayCount - 1);
  return end.toISOString().slice(0, 10);
}

export function assertDateRange(startDate: string, endDate: string): void {
  const days = dayCountFromRange(startDate, endDate);

  if (days < 1 || days > 10) {
    throw new AppError(422, 'INVALID_DATE_RANGE', 'El itinerario debe tener entre 1 y 10 días');
  }
}

export function assertEntryDate(entryDate: string, startDate: string, endDate: string): void {
  if (entryDate < startDate || entryDate > endDate) {
    throw new AppError(422, 'ENTRY_OUTSIDE_ITINERARY', 'La fecha de la actividad debe estar dentro del intervalo del itinerario');
  }
}
