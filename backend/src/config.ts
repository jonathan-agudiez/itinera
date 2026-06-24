import { z } from 'zod';

const booleanFromString = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  APP_NAME: z.string().min(1).default('Itinera'),
  PUBLIC_APP_URL: z.url(),
  CORS_ORIGINS: z.string().min(1),
  COOKIE_SECURE: booleanFromString.default(false),
  COOKIE_DOMAIN: z.string().optional().default(''),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),
  DATABASE_URL: z.string().min(1),
  ADMIN_EMAIL: z.email().optional(),
  ADMIN_PASSWORD: z.string().min(12).optional(),
  ADMIN_DISPLAY_NAME: z.string().min(1).max(100).default('Administrator'),
  RESEND_API_KEY: z.string().optional().default(''),
  MAIL_FROM: z.string().min(3).default('Itinera <no-reply@example.com>'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  ...parsed.data,
  corsOrigins: parsed.data.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  cookieDomain: parsed.data.COOKIE_DOMAIN || undefined,
} as const;
