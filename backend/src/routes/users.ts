import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client.js';
import { sessions, users } from '../db/schema.js';
import { clearSessionCookie, requireUser } from '../services/auth.js';
import { writeAudit } from '../services/audit.js';
import { hashPassword, verifyPassword } from '../utils/crypto.js';
import { AppError } from '../utils/errors.js';
import { parseInput, passwordSchema } from '../utils/validation.js';

const profileSchema = z.object({ displayName: z.string().trim().min(2).max(100) });
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: passwordSchema,
});
const deleteAccountSchema = z.object({ password: z.string().min(1).max(128) });

export async function registerUserRoutes(app: FastifyInstance): Promise<void> {
  app.patch('/api/v1/users/me', async (request) => {
    const auth = await requireUser(request);
    const input = parseInput(profileSchema, request.body);
    const [user] = await db
      .update(users)
      .set({ displayName: input.displayName })
      .where(eq(users.id, auth.id))
      .returning({ id: users.id, email: users.email, displayName: users.displayName, role: users.role });

    return { user };
  });

  app.post('/api/v1/users/me/change-password', async (request) => {
    const auth = await requireUser(request);
    const input = parseInput(changePasswordSchema, request.body);
    const [user] = await db.select().from(users).where(eq(users.id, auth.id)).limit(1);

    if (!user || !(await verifyPassword(user.passwordHash, input.currentPassword))) {
      throw new AppError(400, 'INVALID_CURRENT_PASSWORD', 'La contraseña actual no es correcta');
    }

    const passwordHash = await hashPassword(input.newPassword);
    await db.transaction(async (transaction) => {
      await transaction.update(users).set({ passwordHash }).where(eq(users.id, auth.id));
      await transaction.delete(sessions).where(eq(sessions.userId, auth.id));
    });

    await writeAudit({
      actorUserId: auth.id,
      action: 'PASSWORD_CHANGED',
      entityType: 'user',
      entityId: auth.id,
      ipAddress: request.ip,
    });

    return { message: 'Contraseña cambiada. Inicia sesión de nuevo.' };
  });

  app.delete('/api/v1/users/me', async (request, reply) => {
    const auth = await requireUser(request);
    const input = parseInput(deleteAccountSchema, request.body);
    const [user] = await db.select().from(users).where(eq(users.id, auth.id)).limit(1);

    if (!user || !(await verifyPassword(user.passwordHash, input.password))) {
      throw new AppError(400, 'INVALID_PASSWORD', 'La contraseña no es correcta');
    }

    await writeAudit({
      actorUserId: auth.id,
      action: 'ACCOUNT_DELETED',
      entityType: 'user',
      entityId: auth.id,
      ipAddress: request.ip,
    });
    await db.delete(users).where(eq(users.id, auth.id));
    clearSessionCookie(reply);
    return reply.status(204).send();
  });
}
