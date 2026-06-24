import { and, eq, gt, isNull } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { config } from '../config.js';
import { db } from '../db/client.js';
import { passwordResetTokens, sessions, users } from '../db/schema.js';
import {
  clearSessionCookie,
  createSession,
  requireUser,
  setSessionCookie,
} from '../services/auth.js';
import { writeAudit } from '../services/audit.js';
import { sendMail } from '../services/mail.js';
import {
  createOpaqueToken,
  hashPassword,
  hashToken,
  normalizeEmail,
  verifyPassword,
} from '../utils/crypto.js';
import { AppError } from '../utils/errors.js';
import { emailSchema, parseInput, passwordSchema } from '../utils/validation.js';

const registerSchema = z.object({
  email: emailSchema,
  displayName: z.string().trim().min(2).max(100),
  password: passwordSchema,
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

const forgotSchema = z.object({ email: emailSchema });
const resetSchema = z.object({ token: z.string().min(30).max(200), password: passwordSchema });

function publicUser(user: typeof users.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/api/v1/auth/register',
    { config: { rateLimit: { max: 8, timeWindow: '15 minutes' } } },
    async (request, reply) => {
      const input = parseInput(registerSchema, request.body);
      const email = normalizeEmail(input.email);

      const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
      if (existing) throw new AppError(409, 'EMAIL_EXISTS', 'Ya existe una cuenta con este correo electrónico');

      const passwordHash = await hashPassword(input.password);
      const [user] = await db
        .insert(users)
        .values({ email, displayName: input.displayName, passwordHash })
        .returning();

      if (!user) throw new AppError(500, 'CREATE_FAILED', 'No se pudo crear el usuario');

      const session = await createSession(user.id, request);
      setSessionCookie(reply, session.token, session.expiresAt);
      await writeAudit({
        actorUserId: user.id,
        action: 'USER_REGISTERED',
        entityType: 'user',
        entityId: user.id,
        ipAddress: request.ip,
      });

      return reply.status(201).send({ user: publicUser(user) });
    },
  );

  app.post(
    '/api/v1/auth/login',
    { config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } },
    async (request, reply) => {
      const input = parseInput(loginSchema, request.body);
      const email = normalizeEmail(input.email);
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

      if (!user || !user.isActive || !(await verifyPassword(user.passwordHash, input.password))) {
        throw new AppError(401, 'INVALID_CREDENTIALS', 'El correo electrónico o la contraseña no son correctos');
      }

      const session = await createSession(user.id, request);
      setSessionCookie(reply, session.token, session.expiresAt);
      await writeAudit({
        actorUserId: user.id,
        action: 'USER_LOGGED_IN',
        entityType: 'session',
        ipAddress: request.ip,
      });

      return { user: publicUser(user) };
    },
  );

  app.post('/api/v1/auth/logout', async (request, reply) => {
    if (request.authUser) {
      await db.delete(sessions).where(eq(sessions.tokenHash, request.authUser.sessionTokenHash));
    }
    clearSessionCookie(reply);
    return reply.status(204).send();
  });

  app.get('/api/v1/auth/me', async (request) => {
    const auth = await requireUser(request);
    return {
      user: {
        id: auth.id,
        email: auth.email,
        displayName: auth.displayName,
        role: auth.role,
      },
    };
  });

  app.post(
    '/api/v1/auth/forgot-password',
    { config: { rateLimit: { max: 5, timeWindow: '30 minutes' } } },
    async (request, reply) => {
      const input = parseInput(forgotSchema, request.body);
      const email = normalizeEmail(input.email);
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

      if (user?.isActive) {
        const token = createOpaqueToken(36);
        const tokenHash = hashToken(token);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await db.transaction(async (transaction) => {
          await transaction.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));
          await transaction.insert(passwordResetTokens).values({ userId: user.id, tokenHash, expiresAt });
        });

        const resetUrl = `${config.PUBLIC_APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
        await sendMail({
          to: user.email,
          subject: 'Restablece tu contraseña de Itinera',
          html: `<p>Hola ${user.displayName},</p><p>Utiliza este enlace seguro durante la próxima hora:</p><p><a href="${resetUrl}">Restablecer contraseña</a></p>`,
        });
      }

      return reply.status(202).send({ message: 'Si la cuenta existe, se ha enviado un mensaje de recuperación' });
    },
  );

  app.post(
    '/api/v1/auth/reset-password',
    { config: { rateLimit: { max: 8, timeWindow: '30 minutes' } } },
    async (request) => {
      const input = parseInput(resetSchema, request.body);
      const tokenHash = hashToken(input.token);
      const [record] = await db
        .select({ token: passwordResetTokens, user: users })
        .from(passwordResetTokens)
        .innerJoin(users, eq(passwordResetTokens.userId, users.id))
        .where(
          and(
            eq(passwordResetTokens.tokenHash, tokenHash),
            isNull(passwordResetTokens.usedAt),
            gt(passwordResetTokens.expiresAt, new Date()),
            eq(users.isActive, true),
          ),
        )
        .limit(1);

      if (!record) throw new AppError(400, 'INVALID_RESET_TOKEN', 'El enlace de recuperación no es válido o ha caducado');

      const passwordHash = await hashPassword(input.password);
      await db.transaction(async (transaction) => {
        await transaction.update(users).set({ passwordHash }).where(eq(users.id, record.user.id));
        await transaction
          .update(passwordResetTokens)
          .set({ usedAt: new Date() })
          .where(eq(passwordResetTokens.id, record.token.id));
        await transaction.delete(sessions).where(eq(sessions.userId, record.user.id));
      });

      await writeAudit({
        actorUserId: record.user.id,
        action: 'PASSWORD_RESET',
        entityType: 'user',
        entityId: record.user.id,
        ipAddress: request.ip,
      });

      return { message: 'La contraseña se ha actualizado correctamente' };
    },
  );
}
