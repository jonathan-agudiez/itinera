import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyInstance } from 'fastify';
import { config } from './config.js';
import { authenticateRequest } from './services/auth.js';
import { AppError } from './utils/errors.js';
import { registerAdminRoutes } from './routes/admin.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerItineraryRoutes } from './routes/itineraries.js';
import { registerUserRoutes } from './routes/users.js';

const mutationMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.NODE_ENV === 'production' ? 'info' : 'debug',
      redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers.set-cookie'],
    },
    trustProxy: true,
    bodyLimit: 256 * 1024,
    requestTimeout: 15_000,
  });

  await app.register(cookie);
  await app.register(cors, {
    credentials: true,
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origen no permitido'), false);
    },
  });
  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-site' },
  });
  await app.register(rateLimit, {
    max: 240,
    timeWindow: '1 minute',
    keyGenerator: (request) => request.ip,
  });

  app.addHook('onRequest', async (request) => {
    if (mutationMethods.has(request.method)) {
      const origin = request.headers.origin;
      if (origin && !config.corsOrigins.includes(origin)) {
        throw new AppError(403, 'INVALID_ORIGIN', 'El origen de la solicitud no está permitido');
      }
    }

    const authUser = await authenticateRequest(request);
    if (authUser) request.authUser = authUser;
    else delete request.authUser;
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      });
    }

    const databaseError = error as { code?: string; constraint_name?: string };
    if (databaseError.code === '23505') {
      return reply.status(409).send({
        error: { code: 'CONFLICT', message: 'Ya existe un registro con esos datos' },
      });
    }

    request.log.error({ err: error }, 'Unhandled request error');
    return reply.status(500).send({
      error: { code: 'INTERNAL_ERROR', message: 'Se ha producido un error inesperado' },
    });
  });

  app.setNotFoundHandler((_request, reply) => {
    return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Ruta no encontrada' } });
  });

  await registerHealthRoutes(app);
  await registerAuthRoutes(app);
  await registerUserRoutes(app);
  await registerItineraryRoutes(app);
  await registerAdminRoutes(app);

  return app;
}
