import { buildApp } from './app.js';
import { config } from './config.js';
import { closeDatabase } from './db/client.js';

const app = await buildApp();

async function shutdown(signal: string): Promise<void> {
  app.log.info({ signal }, 'Shutting down');
  await app.close();
  await closeDatabase();
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

try {
  await app.listen({ host: '0.0.0.0', port: config.PORT });
  app.log.info({ port: config.PORT }, 'Itinera API started');
} catch (error) {
  app.log.error(error);
  await closeDatabase();
  process.exit(1);
}
