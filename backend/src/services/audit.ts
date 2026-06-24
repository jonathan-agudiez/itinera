import { db } from '../db/client.js';
import { auditLogs } from '../db/schema.js';

interface AuditEvent {
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export async function writeAudit(event: AuditEvent): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      actorUserId: event.actorUserId,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      metadata: event.metadata ?? {},
      ipAddress: event.ipAddress,
    });
  } catch (error) {
    console.error('Audit write failed', error);
  }
}
