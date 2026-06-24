import { and, eq, gt } from 'drizzle-orm';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { config } from '../config.js';
import { db } from '../db/client.js';
import { sessions, users } from '../db/schema.js';
import { createOpaqueToken, hashToken } from '../utils/crypto.js';
import { forbidden, unauthorized } from '../utils/errors.js';

export const SESSION_COOKIE = 'itinera_session';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: 'USER' | 'ADMIN';
  sessionTokenHash: string;
}

export async function createSession(
  userId: string,
  request: FastifyRequest,
): Promise<{ token: string; expiresAt: Date }> {
  const token = createOpaqueToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + config.SESSION_TTL_DAYS * 86_400_000);

  await db.insert(sessions).values({
    userId,
    tokenHash,
    expiresAt,
    userAgent: request.headers['user-agent']?.slice(0, 500) ?? null,
    ipAddress: request.ip,
  });

  return { token, expiresAt };
}

export function setSessionCookie(reply: FastifyReply, token: string, expiresAt: Date): void {
  reply.setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: config.COOKIE_SECURE,
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
    ...(config.cookieDomain ? { domain: config.cookieDomain } : {}),
  });
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(SESSION_COOKIE, {
    path: '/',
    ...(config.cookieDomain ? { domain: config.cookieDomain } : {}),
  });
}

export async function authenticateRequest(request: FastifyRequest): Promise<AuthUser | undefined> {
  const token = request.cookies[SESSION_COOKIE];
  if (!token) return undefined;

  const tokenHash = hashToken(token);
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        gt(sessions.expiresAt, new Date()),
        eq(users.isActive, true),
      ),
    )
    .limit(1);

  if (!row) return undefined;

  void db
    .update(sessions)
    .set({ lastUsedAt: new Date() })
    .where(eq(sessions.tokenHash, tokenHash))
    .catch((error: unknown) => console.error('Could not update session timestamp', error));

  return { ...row, sessionTokenHash: tokenHash };
}

export async function requireUser(request: FastifyRequest): Promise<AuthUser> {
  if (!request.authUser) unauthorized();
  return request.authUser;
}

export async function requireAdmin(request: FastifyRequest): Promise<AuthUser> {
  const user = await requireUser(request);
  if (user.role !== 'ADMIN') forbidden('Administrator access required');
  return user;
}
