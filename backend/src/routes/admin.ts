import { count, desc, eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client.js';
import { itineraries, itineraryEntries, sessions, users } from '../db/schema.js';
import { requireAdmin } from '../services/auth.js';
import { writeAudit } from '../services/audit.js';
import { AppError, notFound } from '../utils/errors.js';
import { assertDateRange, dateSchema, parseInput, uuidSchema } from '../utils/validation.js';

const userParams = z.object({ userId: uuidSchema });
const itineraryParams = z.object({ id: uuidSchema });
const userUpdate = z.object({
  role: z.enum(['USER', 'ADMIN']).optional(),
  isActive: z.boolean().optional(),
  displayName: z.string().trim().min(2).max(100).optional(),
});
const itineraryUpdate = z.object({
  title: z.string().trim().min(2).max(140).optional(),
  destination: z.string().trim().max(140).optional(),
  description: z.string().trim().max(5_000).optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  publicShareEnabled: z.boolean().optional(),
});

export async function registerAdminRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/admin/stats', async (request) => {
    await requireAdmin(request);
    const [[userCount], [itineraryCount], [entryCount]] = await Promise.all([
      db.select({ value: count() }).from(users),
      db.select({ value: count() }).from(itineraries),
      db.select({ value: count() }).from(itineraryEntries),
    ]);
    return {
      users: userCount?.value ?? 0,
      itineraries: itineraryCount?.value ?? 0,
      entries: entryCount?.value ?? 0,
    };
  });

  app.get('/api/v1/admin/users', async (request) => {
    await requireAdmin(request);
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(250);
    return { users: result };
  });

  app.patch('/api/v1/admin/users/:userId', async (request) => {
    const admin = await requireAdmin(request);
    const { userId } = parseInput(userParams, request.params);
    const input = parseInput(userUpdate, request.body);
    if (userId === admin.id && input.isActive === false) {
      throw new AppError(422, 'CANNOT_DISABLE_SELF', 'No puedes desactivar tu propia cuenta de administrador');
    }
    const [updated] = await db.update(users).set(input).where(eq(users.id, userId)).returning({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
      isActive: users.isActive,
    });
    if (!updated) notFound('Usuario no encontrado');
    if (input.isActive === false) await db.delete(sessions).where(eq(sessions.userId, userId));
    await writeAudit({
      actorUserId: admin.id,
      action: 'ADMIN_USER_UPDATED',
      entityType: 'user',
      entityId: userId,
      metadata: { fields: Object.keys(input) },
      ipAddress: request.ip,
    });
    return { user: updated };
  });

  app.delete('/api/v1/admin/users/:userId', async (request, reply) => {
    const admin = await requireAdmin(request);
    const { userId } = parseInput(userParams, request.params);
    if (userId === admin.id) {
      throw new AppError(422, 'CANNOT_DELETE_SELF', 'No puedes eliminar tu propia cuenta de administrador');
    }
    const [deleted] = await db.delete(users).where(eq(users.id, userId)).returning({ id: users.id });
    if (!deleted) notFound('Usuario no encontrado');
    await writeAudit({
      actorUserId: admin.id,
      action: 'ADMIN_USER_DELETED',
      entityType: 'user',
      entityId: userId,
      ipAddress: request.ip,
    });
    return reply.status(204).send();
  });

  app.get('/api/v1/admin/itineraries', async (request) => {
    await requireAdmin(request);
    const result = await db
      .select({
        id: itineraries.id,
        title: itineraries.title,
        destination: itineraries.destination,
        startDate: itineraries.startDate,
        endDate: itineraries.endDate,
        publicShareEnabled: itineraries.publicShareEnabled,
        ownerId: users.id,
        ownerEmail: users.email,
        ownerName: users.displayName,
        updatedAt: itineraries.updatedAt,
      })
      .from(itineraries)
      .innerJoin(users, eq(itineraries.ownerId, users.id))
      .orderBy(desc(itineraries.updatedAt))
      .limit(500);
    return { itineraries: result };
  });

  app.patch('/api/v1/admin/itineraries/:id', async (request) => {
    const admin = await requireAdmin(request);
    const { id } = parseInput(itineraryParams, request.params);
    const input = parseInput(itineraryUpdate, request.body);
    const [current] = await db.select().from(itineraries).where(eq(itineraries.id, id)).limit(1);
    if (!current) notFound('Itinerario no encontrado');
    const startDate = input.startDate ?? current.startDate;
    const endDate = input.endDate ?? current.endDate;
    assertDateRange(startDate, endDate);
    const [updated] = await db.update(itineraries).set(input).where(eq(itineraries.id, id)).returning();
    await writeAudit({
      actorUserId: admin.id,
      action: 'ADMIN_ITINERARY_UPDATED',
      entityType: 'itinerary',
      entityId: id,
      metadata: { fields: Object.keys(input) },
      ipAddress: request.ip,
    });
    return { itinerary: updated };
  });

  app.delete('/api/v1/admin/itineraries/:id', async (request, reply) => {
    const admin = await requireAdmin(request);
    const { id } = parseInput(itineraryParams, request.params);
    const [deleted] = await db.delete(itineraries).where(eq(itineraries.id, id)).returning({ id: itineraries.id });
    if (!deleted) notFound('Itinerario no encontrado');
    await writeAudit({
      actorUserId: admin.id,
      action: 'ADMIN_ITINERARY_DELETED',
      entityType: 'itinerary',
      entityId: id,
      ipAddress: request.ip,
    });
    return reply.status(204).send();
  });
}
