import { describe, expect, it } from 'vitest';
import { createOpaqueToken, hashPassword, hashToken, normalizeEmail, verifyPassword } from '../src/utils/crypto.js';

describe('security utilities', () => {
  it('normalizes email addresses', () => {
    expect(normalizeEmail('  USER@Example.COM ')).toBe('user@example.com');
  });

  it('creates opaque tokens and stable hashes', () => {
    const token = createOpaqueToken();
    expect(token.length).toBeGreaterThan(30);
    expect(hashToken(token)).toHaveLength(64);
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it('hashes and verifies passwords with Argon2id', async () => {
    const hash = await hashPassword('ExampleSecure123');
    await expect(verifyPassword(hash, 'ExampleSecure123')).resolves.toBe(true);
    await expect(verifyPassword(hash, 'WrongPassword123')).resolves.toBe(false);
  });
});
