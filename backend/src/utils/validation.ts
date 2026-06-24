import { z } from 'zod';
import { AppError } from './errors.js';

export const uuidSchema = z.uuid();
export const emailSchema = z.email().max(320).transform((value) => value.trim().toLowerCase());
export const passwordSchema = z
  .string()
  .min(12, 'La contraseña debe tener al menos 12 caracteres')
  .max(128)
  .regex(/[a-z]/, 'La contraseña debe contener una letra minúscula')
  .regex(/[A-Z]/, 'La contraseña debe contener una letra mayúscula')
  .regex(/[0-9]/, 'La contraseña debe contener un número');

export const dateSchema = z.iso.date();
export const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export function parseInput<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AppError(422, 'VALIDATION_ERROR', 'Los datos enviados no son válidos', result.error.flatten());
  }
  return result.data;
}

export function assertDateRange(startDate: string, endDate: string): void {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000);

  if (days < 0 || days > 90) {
    throw new AppError(422, 'INVALID_DATE_RANGE', 'El itinerario debe tener una duración de entre 1 y 91 días');
  }
}

export function assertEntryDate(entryDate: string, startDate: string, endDate: string): void {
  if (entryDate < startDate || entryDate > endDate) {
    throw new AppError(422, 'ENTRY_OUTSIDE_ITINERARY', 'La fecha de la actividad debe estar dentro del intervalo del itinerario');
  }
}
