import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import postgres from 'postgres';
import { config } from '../config.js';

const client = postgres(config.DATABASE_URL, { max: 1 });

async function migrate(): Promise<void> {
  await client`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  const directory = resolve(process.cwd(), 'migrations');
  const files = (await readdir(directory)).filter((file) => file.endsWith('.sql')).sort();

  for (const filename of files) {
    const [existing] = await client<{ filename: string }[]>`
      SELECT filename FROM schema_migrations WHERE filename = ${filename}
    `;

    if (existing) continue;

    const source = await readFile(resolve(directory, filename), 'utf8');
    await client.begin(async (transaction) => {
      await transaction.unsafe(source);
      await transaction`
        INSERT INTO schema_migrations (filename) VALUES (${filename})
      `;
    });

    console.log(`Applied migration: ${filename}`);
  }
}

migrate()
  .then(async () => client.end())
  .catch(async (error: unknown) => {
    console.error('Migration failed', error);
    await client.end();
    process.exit(1);
  });
