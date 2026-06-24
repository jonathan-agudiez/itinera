import { describe, expect, it } from 'vitest';
import { passwordSchema } from '../src/utils/validation.js';

describe('passwordSchema', () => {
  it('acepta un PIN numérico de seis cifras', () => {
    expect(passwordSchema.safeParse('123456').success).toBe(true);
  });

  it('rechaza claves de menos de seis caracteres', () => {
    expect(passwordSchema.safeParse('12345').success).toBe(false);
  });
});
