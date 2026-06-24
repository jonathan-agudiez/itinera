import { and, asc, eq, gt, lte, or, sql as dsql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { config } from '../config.js';
import { db } from '../db/client.js';
import {
  itineraries,
  itineraryCollaborators,
  itineraryEntries,
  users,
  type Itinerary,
} from '../db/schema.js';
import { requireUser, type AuthUser } from '../services/auth.js';
import { writeAudit } from '../services/audit.js';
import { createOpaqueToken, hashToken, normalizeEmail } from '../utils/crypto.js';
import { AppError, forbidden, notFound } from '../utils/errors.js';
import {
  assertDateRange,
  assertEntryDate,
  dateSchema,
  parseInput,
  timeSchema,
  uuidSchema,
} from '../utils/validation.js';

const itineraryCreateSchema = z.object({
  title: z.string().trim().min(2).max(140),
  destination: z.string().trim().max(140).default(''),
  description: z.string().trim().max(5_000).default(''),
  startDate: dateSchema,
  endDate: dateSchema,
  timezone: z.string().trim().min(1).max(80).default('Europe/Madrid'),
});

const itineraryUpdateSchema = itineraryCreateSchema.partial().extend({
  publicShareEnabled: z.boolean().optional(),
});

const collaboratorCreateSchema = z.object({
  email: z.email().max(320),
  permission: z.enum(['READ', 'WRITE']),
});
const collaboratorUpdateSchema = z.object({ permission: z.enum(['READ', 'WRITE']) });

const entryCreateSchema = z.object({
  entryDate: dateSchema,
  startTime: timeSchema,
  endTime: timeSchema.nullable().optional(),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(10_000).default(''),
  location: z.string().trim().max(180).default(''),
  category: z.enum(['transport', 'stay', 'food', 'visit', 'activity', 'note']).default('activity'),
  sortOrder: z.number().int().min(-10_000).max(10_000).default(0),
});

const entryUpdateSchema = entryCreateSchema.partial().extend({
  version: z.number().int().positive(),
});

const idParamsSchema = z.object({ id: uuidSchema });
const entryParamsSchema = z.object({ id: uuidSchema, entryId: uuidSchema });
const collaboratorParamsSchema = z.object({ id: uuidSchema, userId: uuidSchema });
const sharedParamsSchema = z.object({ token: z.string().min(30).max(200) });

type Access = 'OWNER' | 'WRITE' | 'READ' | 'ADMIN';

async function getAccess(auth: AuthUser, itineraryId: string): Promise<{ itinerary: Itinerary; access: Access }> {
  const [itinerary] = await db.select().from(itineraries).where(eq(itineraries.id, itineraryId)).limit(1);
  if (!itinerary) notFound('Itinerary not found');

  if (auth.role === 'ADMIN') return { itinerary, access: 'ADMIN' };
  if (itinerary.ownerId === auth.id) return { itinerary, access: 'OWNER' };

  const [collaborator] = await db
    .select({ permission: itineraryCollaborators.permission })
    .from(itineraryCollaborators)
    .where(
      and(
        eq(itineraryCollaborators.itineraryId, itineraryId),
        eq(itineraryCollaborators.userId, auth.id),
      ),
    )
    .limit(1);

  if (!collaborator) forbidden('You do not have access to this itinerary');
  return { itinerary, access: collaborator.permission };
}

function canWrite(access: Access): boolean {
  return access === 'OWNER' || access === 'WRITE' || access === 'ADMIN';
}

function canManage(access: Access): boolean {
  return access === 'OWNER' || access === 'ADMIN';
}

async function bundle(itinerary: Itinerary, access: Access | 'PUBLIC') {
  const entries = await db
    .select()
    .from(itineraryEntries)
    .where(eq(itineraryEntries.itineraryId, itinerary.id))
    .orderBy(
      asc(itineraryEntries.entryDate),
      asc(itineraryEntries.startTime),
      asc(itineraryEntries.sortOrder),
    );

  const collaborators =
    access === 'PUBLIC'
      ? []
      : await db
          .select({
            userId: users.id,
            email: users.email,
            displayName: users.displayName,
            permission: itineraryCollaborators.permission,
          })
          .from(itineraryCollaborators)
          .innerJoin(users, eq(itineraryCollaborators.userId, users.id))
          .where(eq(itineraryCollaborators.itineraryId, itinerary.id))
          .orderBy(asc(users.displayName));

  return { itinerary, entries, collaborators, access };
}

function validateTimes(startTime: string, endTime?: string | null): void {
  if (endTime && endTime <= startTime) {
    throw new AppError(422, 'INVALID_TIME_RANGE', 'End time must be later than start time');
  }
}

export async function registerItineraryRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/itineraries', async (request) => {
    const auth = await requireUser(request);

    const owned = await db
      .select({ itinerary: itineraries })
      .from(itineraries)
      .where(eq(itineraries.ownerId, auth.id));

    const shared = await db
      .select({ itinerary: itineraries, permission: itineraryCollaborators.permission })
      .from(itineraryCollaborators)
      .innerJoin(itineraries, eq(itineraryCollaborators.itineraryId, itineraries.id))
      .where(eq(itineraryCollaborators.userId, auth.id));

    const items = [
      ...owned.map(({ itinerary }) => ({ ...itinerary, access: auth.role === 'ADMIN' ? 'ADMIN' : 'OWNER' })),
      ...shared.map(({ itinerary, permission }) => ({ ...itinerary, access: permission })),
    ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return { itineraries: items };
  });

  app.post('/api/v1/itineraries', async (request, reply) => {
    const auth = await requireUser(request);
    const input = parseInput(itineraryCreateSchema, request.body);
    assertDateRange(input.startDate, input.endDate);

    const shareToken = createOpaqueToken(36);
    const [itinerary] = await db
      .insert(itineraries)
      .values({
        ownerId: auth.id,
        ...input,
        shareTokenHash: hashToken(shareToken),
        shareTokenHint: shareToken.slice(-8),
      })
      .returning();

    if (!itinerary) throw new AppError(500, 'CREATE_FAILED', 'Could not create itinerary');
    await writeAudit({
      actorUserId: auth.id,
      action: 'ITINERARY_CREATED',
      entityType: 'itinerary',
      entityId: itinerary.id,
      ipAddress: request.ip,
    });

    return reply.status(201).send({
      ...(await bundle(itinerary, auth.role === 'ADMIN' ? 'ADMIN' : 'OWNER')),
      shareUrl: `${config.PUBLIC_APP_URL}/shared/${shareToken}`,
    });
  });

  app.get('/api/v1/itineraries/shared/:token', async (request) => {
    const params = parseInput(sharedParamsSchema, request.params);
    const [itinerary] = await db
      .select()
      .from(itineraries)
      .where(
        and(
          eq(itineraries.shareTokenHash, hashToken(params.token)),
          eq(itineraries.publicShareEnabled, true),
        ),
      )
      .limit(1);

    if (!itinerary) notFound('Shared itinerary not found');
    return bundle(itinerary, 'PUBLIC');
  });

  app.get('/api/v1/itineraries/:id', async (request) => {
    const auth = await requireUser(request);
    const { id } = parseInput(idParamsSchema, request.params);
    const result = await getAccess(auth, id);
    return bundle(result.itinerary, result.access);
  });

  app.patch('/api/v1/itineraries/:id', async (request) => {
    const auth = await requireUser(request);
    const { id } = parseInput(idParamsSchema, request.params);
    const input = parseInput(itineraryUpdateSchema, request.body);
    const { itinerary, access } = await getAccess(auth, id);
    if (!canManage(access)) forbidden('Only the owner or an administrator can edit itinerary settings');

    const startDate = input.startDate ?? itinerary.startDate;
    const endDate = input.endDate ?? itinerary.endDate;
    assertDateRange(startDate, endDate);

    const [updated] = await db.update(itineraries).set(input).where(eq(itineraries.id, id)).returning();
    if (!updated) notFound();

    await writeAudit({
      actorUserId: auth.id,
      action: 'ITINERARY_UPDATED',
      entityType: 'itinerary',
      entityId: id,
      metadata: { fields: Object.keys(input) },
      ipAddress: request.ip,
    });
    return bundle(updated, access);
  });

  app.delete('/api/v1/itineraries/:id', async (request, reply) => {
    const auth = await requireUser(request);
    const { id } = parseInput(idParamsSchema, request.params);
    const { access } = await getAccess(auth, id);
    if (!canManage(access)) forbidden('Only the owner or an administrator can delete this itinerary');

    await writeAudit({
      actorUserId: auth.id,
      action: 'ITINERARY_DELETED',
      entityType: 'itinerary',
      entityId: id,
      ipAddress: request.ip,
    });
    await db.delete(itineraries).where(eq(itineraries.id, id));
    return reply.status(204).send();
  });

  app.post('/api/v1/itineraries/:id/share/rotate', async (request) => {
    const auth = await requireUser(request);
    const { id } = parseInput(idParamsSchema, request.params);
    const { access } = await getAccess(auth, id);
    if (!canManage(access)) forbidden('Only the owner or an administrator can rotate the share link');

    const token = createOpaqueToken(36);
    await db
      .update(itineraries)
      .set({
        shareTokenHash: hashToken(token),
        shareTokenHint: token.slice(-8),
        publicShareEnabled: true,
      })
      .where(eq(itineraries.id, id));

    await writeAudit({
      actorUserId: auth.id,
      action: 'SHARE_LINK_ROTATED',
      entityType: 'itinerary',
      entityId: id,
      ipAddress: request.ip,
    });

    return { shareUrl: `${config.PUBLIC_APP_URL}/shared/${token}` };
  });

  app.post('/api/v1/itineraries/:id/collaborators', async (request, reply) => {
    const auth = await requireUser(request);
    const { id } = parseInput(idParamsSchema, request.params);
    const input = parseInput(collaboratorCreateSchema, request.body);
    const { itinerary, access } = await getAccess(auth, id);
    if (!canManage(access)) forbidden('Only the owner or an administrator can manage collaborators');

    const email = normalizeEmail(input.email);
    const [collaboratorUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!collaboratorUser || !collaboratorUser.isActive) {
      notFound('The collaborator must have an active Itinera account');
    }
    if (collaboratorUser.id === itinerary.ownerId) {
      throw new AppError(409, 'OWNER_IS_NOT_COLLABORATOR', 'The owner already has full access');
    }

    await db
      .insert(itineraryCollaborators)
      .values({ itineraryId: id, userId: collaboratorUser.id, permission: input.permission })
      .onConflictDoUpdate({
        target: [itineraryCollaborators.itineraryId, itineraryCollaborators.userId],
        set: { permission: input.permission },
      });

    await writeAudit({
      actorUserId: auth.id,
      action: 'COLLABORATOR_ADDED',
      entityType: 'itinerary',
      entityId: id,
      metadata: { collaboratorUserId: collaboratorUser.id, permission: input.permission },
      ipAddress: request.ip,
    });
    return reply.status(201).send({ message: 'Collaborator saved' });
  });

  app.patch('/api/v1/itineraries/:id/collaborators/:userId', async (request) => {
    const auth = await requireUser(request);
    const { id, userId } = parseInput(collaboratorParamsSchema, request.params);
    const input = parseInput(collaboratorUpdateSchema, request.body);
    const { access } = await getAccess(auth, id);
    if (!canManage(access)) forbidden('Only the owner or an administrator can manage collaborators');

    const [updated] = await db
      .update(itineraryCollaborators)
      .set({ permission: input.permission })
      .where(
        and(
          eq(itineraryCollaborators.itineraryId, id),
          eq(itineraryCollaborators.userId, userId),
        ),
      )
      .returning();
    if (!updated) notFound('Collaborator not found');
    return { collaborator: updated };
  });

  app.delete('/api/v1/itineraries/:id/collaborators/:userId', async (request, reply) => {
    const auth = await requireUser(request);
    const { id, userId } = parseInput(collaboratorParamsSchema, request.params);
    const { access } = await getAccess(auth, id);
    if (!canManage(access)) forbidden('Only the owner or an administrator can manage collaborators');

    await db
      .delete(itineraryCollaborators)
      .where(
        and(
          eq(itineraryCollaborators.itineraryId, id),
          eq(itineraryCollaborators.userId, userId),
        ),
      );
    return reply.status(204).send();
  });

  app.post('/api/v1/itineraries/:id/entries', async (request, reply) => {
    const auth = await requireUser(request);
    const { id } = parseInput(idParamsSchema, request.params);
    const input = parseInput(entryCreateSchema, request.body);
    const { itinerary, access } = await getAccess(auth, id);
    if (!canWrite(access)) forbidden('This itinerary is read-only for your account');

    assertEntryDate(input.entryDate, itinerary.startDate, itinerary.endDate);
    validateTimes(input.startTime, input.endTime);

    const [entry] = await db
      .insert(itineraryEntries)
      .values({ itineraryId: id, ...input, endTime: input.endTime ?? null })
      .returning();
    if (!entry) throw new AppError(500, 'CREATE_FAILED', 'Could not create entry');
    await writeAudit({
      actorUserId: auth.id,
      action: 'ENTRY_CREATED',
      entityType: 'itinerary_entry',
      entityId: entry.id,
      metadata: { itineraryId: id },
      ipAddress: request.ip,
    });
    return reply.status(201).send({ entry });
  });

  app.patch('/api/v1/itineraries/:id/entries/:entryId', async (request) => {
    const auth = await requireUser(request);
    const { id, entryId } = parseInput(entryParamsSchema, request.params);
    const input = parseInput(entryUpdateSchema, request.body);
    const { itinerary, access } = await getAccess(auth, id);
    if (!canWrite(access)) forbidden('This itinerary is read-only for your account');

    const [current] = await db
      .select()
      .from(itineraryEntries)
      .where(and(eq(itineraryEntries.id, entryId), eq(itineraryEntries.itineraryId, id)))
      .limit(1);
    if (!current) notFound('Entry not found');
    if (current.version !== input.version) {
      throw new AppError(409, 'STALE_ENTRY', 'This entry was changed by someone else. Reload and try again.');
    }

    const entryDate = input.entryDate ?? current.entryDate;
    const startTime = input.startTime ?? current.startTime.slice(0, 5);
    const endTime = input.endTime === undefined ? current.endTime?.slice(0, 5) ?? null : input.endTime;
    assertEntryDate(entryDate, itinerary.startDate, itinerary.endDate);
    validateTimes(startTime, endTime);

    const { version: _version, ...changes } = input;
    const [updated] = await db
      .update(itineraryEntries)
      .set({ ...changes, endTime, version: current.version + 1 })
      .where(and(eq(itineraryEntries.id, entryId), eq(itineraryEntries.version, current.version)))
      .returning();
    if (!updated) throw new AppError(409, 'STALE_ENTRY', 'This entry was changed by someone else');
    return { entry: updated };
  });

  app.delete('/api/v1/itineraries/:id/entries/:entryId', async (request, reply) => {
    const auth = await requireUser(request);
    const { id, entryId } = parseInput(entryParamsSchema, request.params);
    const { access } = await getAccess(auth, id);
    if (!canWrite(access)) forbidden('This itinerary is read-only for your account');

    await db
      .delete(itineraryEntries)
      .where(and(eq(itineraryEntries.id, entryId), eq(itineraryEntries.itineraryId, id)));
    return reply.status(204).send();
  });
}
