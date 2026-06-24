import { describe, expect, it } from 'vitest';
import {
  assertDateRange,
  dayCountFromRange,
  endDateFromDayCount,
  passwordSchema,
} from '../src/utils/validation.js';

describe('passwordSchema', () => {
  it('acepta un PIN numérico de seis cifras', () => {
    expect(passwordSchema.safeParse('123456').success).toBe(true);
  });

  it('rechaza claves de menos de seis caracteres', () => {
    expect(passwordSchema.safeParse('12345').success).toBe(false);
  });
});

describe('duración del itinerario', () => {
  it('calcula fechas inclusivas y admite hasta diez días', () => {
    expect(endDateFromDayCount('2026-07-21', 10)).toBe('2026-07-30');
    expect(dayCountFromRange('2026-07-21', '2026-07-30')).toBe(10);
    expect(() => assertDateRange('2026-07-21', '2026-07-30')).not.toThrow();
  });

  it('rechaza itinerarios de más de diez días', () => {
    expect(() => assertDateRange('2026-07-21', '2026-07-31')).toThrow();
  });
});
