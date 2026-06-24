import { and, asc, eq, gt, lt, or, sql as dsql } from 'drizzle-orm';
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
  dayCountFromRange,
  endDateFromDayCount,
  parseInput,
  timeSchema,
  uuidSchema,
} from '../utils/validation.js';

const itineraryCreateSchema = z.object({
  title: z.string().trim().min(2).max(140),
  destination: z.string().trim().max(140).default(''),
  description: z.string().trim().max(5_000).default(''),
  timezone: z.string().trim().min(1).max(80).default('Europe/Madrid'),
  startDate: dateSchema,
  dayCount: z.number().int().min(1).max(10).optional(),
  // Compatibilidad temporal con clientes anteriores a v2.4.0.
  endDate: dateSchema.optional(),
}).superRefine((value, context) => {
  if (value.dayCount === undefined && value.endDate === undefined) {
    context.addIssue({ code: 'custom', message: 'Indica el número de días' });
  }
});

const itineraryUpdateSchema = z.object({
  title: z.string().trim().min(2).max(140).optional(),
  destination: z.string().trim().max(140).optional(),
  description: z.string().trim().max(5_000).optional(),
  timezone: z.string().trim().min(1).max(80).optional(),
  startDate: dateSchema.optional(),
  dayCount: z.number().int().min(1).max(10).optional(),
  // Compatibilidad temporal con clientes anteriores a v2.4.0.
  endDate: dateSchema.optional(),
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
  color: z.enum(['sage', 'sky', 'lavender', 'sand', 'coral', 'mint', 'blue', 'rose', 'amber', 'olive', 'slate', 'teal']).default('sage'),
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
  if (!itinerary) notFound('Itinerario no encontrado');

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

  if (!collaborator) forbidden('No tienes acceso a este itinerario');
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
    throw new AppError(422, 'INVALID_TIME_RANGE', 'La hora de finalización debe ser posterior a la hora de inicio');
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
    const {
      dayCount,
      endDate: requestedEndDate,
      startDate,
      ...metadata
    } = input;
    const endDate = dayCount !== undefined
      ? endDateFromDayCount(startDate, dayCount)
      : requestedEndDate!;
    assertDateRange(startDate, endDate);

    const shareToken = createOpaqueToken(36);
    const [itinerary] = await db
      .insert(itineraries)
      .values({
        ownerId: auth.id,
        ...metadata,
        startDate,
        endDate,
        shareTokenHash: hashToken(shareToken),
        shareTokenHint: shareToken.slice(-8),
      })
      .returning();

    if (!itinerary) throw new AppError(500, 'CREATE_FAILED', 'No se pudo crear el itinerario');
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

    if (!itinerary) notFound('Itinerario compartido no encontrado');
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
    if (!canManage(access)) forbidden('Solo el propietario o un administrador pueden editar la configuración del itinerario');

    const {
      dayCount,
      endDate: requestedEndDate,
      ...changes
    } = input;
    const startDate = changes.startDate ?? itinerary.startDate;
    const currentDayCount = dayCountFromRange(itinerary.startDate, itinerary.endDate);
    const endDate = dayCount !== undefined
      ? endDateFromDayCount(startDate, dayCount)
      : requestedEndDate !== undefined
        ? requestedEndDate
        : changes.startDate !== undefined
          ? endDateFromDayCount(startDate, currentDayCount)
          : itinerary.endDate;
    assertDateRange(startDate, endDate);

    const [outsideRange] = await db
      .select({ count: dsql<number>`count(*)` })
      .from(itineraryEntries)
      .where(
        and(
          eq(itineraryEntries.itineraryId, id),
          or(
            lt(itineraryEntries.entryDate, startDate),
            gt(itineraryEntries.entryDate, endDate),
          ),
        ),
      );
    if (Number(outsideRange?.count ?? 0) > 0) {
      throw new AppError(
        409,
        'ITINERARY_HAS_ENTRIES_OUTSIDE_RANGE',
        'Mueve o elimina los planes que quedarían fuera de la nueva duración',
      );
    }

    const [updated] = await db
      .update(itineraries)
      .set({ ...changes, endDate })
      .where(eq(itineraries.id, id))
      .returning();
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
    if (!canManage(access)) forbidden('Solo el propietario o un administrador pueden eliminar este itinerario');

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
    if (!canManage(access)) forbidden('Solo el propietario o un administrador pueden renovar el enlace compartido');

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
    if (!canManage(access)) forbidden('Solo el propietario o un administrador pueden gestionar colaboradores');

    const email = normalizeEmail(input.email);
    const [collaboratorUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!collaboratorUser || !collaboratorUser.isActive) {
      notFound('El colaborador debe tener una cuenta activa de Itinera');
    }
    if (collaboratorUser.id === itinerary.ownerId) {
      throw new AppError(409, 'OWNER_IS_NOT_COLLABORATOR', 'El propietario ya dispone de acceso completo');
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
    return reply.status(201).send({ message: 'Colaborador guardado' });
  });

  app.patch('/api/v1/itineraries/:id/collaborators/:userId', async (request) => {
    const auth = await requireUser(request);
    const { id, userId } = parseInput(collaboratorParamsSchema, request.params);
    const input = parseInput(collaboratorUpdateSchema, request.body);
    const { access } = await getAccess(auth, id);
    if (!canManage(access)) forbidden('Solo el propietario o un administrador pueden gestionar colaboradores');

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
    if (!updated) notFound('Colaborador no encontrado');
    return { collaborator: updated };
  });

  app.delete('/api/v1/itineraries/:id/collaborators/:userId', async (request, reply) => {
    const auth = await requireUser(request);
    const { id, userId } = parseInput(collaboratorParamsSchema, request.params);
    const { access } = await getAccess(auth, id);
    if (!canManage(access)) forbidden('Solo el propietario o un administrador pueden gestionar colaboradores');

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
    if (!canWrite(access)) forbidden('Este itinerario es de solo lectura para tu cuenta');

    assertEntryDate(input.entryDate, itinerary.startDate, itinerary.endDate);
    validateTimes(input.startTime, input.endTime);

    const [entry] = await db
      .insert(itineraryEntries)
      .values({ itineraryId: id, ...input, endTime: input.endTime ?? null })
      .returning();
    if (!entry) throw new AppError(500, 'CREATE_FAILED', 'No se pudo crear la actividad');
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
    if (!canWrite(access)) forbidden('Este itinerario es de solo lectura para tu cuenta');

    const [current] = await db
      .select()
      .from(itineraryEntries)
      .where(and(eq(itineraryEntries.id, entryId), eq(itineraryEntries.itineraryId, id)))
      .limit(1);
    if (!current) notFound('Actividad no encontrada');
    if (current.version !== input.version) {
      throw new AppError(409, 'STALE_ENTRY', 'Otra persona ha modificado esta actividad. Recarga la página e inténtalo de nuevo.');
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
    if (!updated) throw new AppError(409, 'STALE_ENTRY', 'Otra persona ha modificado esta actividad');
    return { entry: updated };
  });

  app.delete('/api/v1/itineraries/:id/entries/:entryId', async (request, reply) => {
    const auth = await requireUser(request);
    const { id, entryId } = parseInput(entryParamsSchema, request.params);
    const { access } = await getAccess(auth, id);
    if (!canWrite(access)) forbidden('Este itinerario es de solo lectura para tu cuenta');

    await db
      .delete(itineraryEntries)
      .where(and(eq(itineraryEntries.id, entryId), eq(itineraryEntries.itineraryId, id)));
    return reply.status(204).send();
  });
}
