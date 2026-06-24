import type { FastifyInstance } from 'fastify';
import { sql } from '../db/client.js';

export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/health/live', async () => ({
    status: 'ok',
    service: 'itinera-api',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  }));

  app.get('/api/v1/health/ready', async (_request, reply) => {
    try {
      await sql`SELECT 1`;
      return {
        status: 'ready',
        database: 'up',
        timestamp: new Date().toISOString(),
      };
    } catch {
      return reply.status(503).send({
        status: 'not_ready',
        database: 'down',
        timestamp: new Date().toISOString(),
      });
    }
  });
}
