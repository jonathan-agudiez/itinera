import { z } from 'zod';
import { AppError } from './errors.js';

export const uuidSchema = z.uuid();
export const emailSchema = z.email().max(320).transform((value) => value.trim().toLowerCase());
export const passwordSchema = z
  .string()
  .min(12, 'Password must contain at least 12 characters')
  .max(128)
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const dateSchema = z.iso.date();
export const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export function parseInput<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AppError(422, 'VALIDATION_ERROR', 'The submitted data is invalid', result.error.flatten());
  }
  return result.data;
}

export function assertDateRange(startDate: string, endDate: string): void {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000);

  if (days < 0 || days > 90) {
    throw new AppError(422, 'INVALID_DATE_RANGE', 'Itinerary dates must span between 1 and 91 days');
  }
}

export function assertEntryDate(entryDate: string, startDate: string, endDate: string): void {
  if (entryDate < startDate || entryDate > endDate) {
    throw new AppError(422, 'ENTRY_OUTSIDE_ITINERARY', 'Entry date must be inside the itinerary range');
  }
}
