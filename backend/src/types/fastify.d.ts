import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: {
      id: string;
      email: string;
      displayName: string;
      role: 'USER' | 'ADMIN';
      sessionTokenHash: string;
    };
  }
}
