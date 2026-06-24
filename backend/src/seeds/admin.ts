import { eq } from 'drizzle-orm';
import { config } from '../config.js';
import { closeDatabase, db } from '../db/client.js';
import { users } from '../db/schema.js';
import { hashPassword, normalizeEmail } from '../utils/crypto.js';

async function seedAdmin(): Promise<void> {
  if (!config.ADMIN_EMAIL || !config.ADMIN_PASSWORD) {
    console.info('Administrator seed skipped: ADMIN_EMAIL or ADMIN_PASSWORD is missing');
    return;
  }

  const email = normalizeEmail(config.ADMIN_EMAIL);
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (existing) {
    await db
      .update(users)
      .set({ role: 'ADMIN', isActive: true, displayName: config.ADMIN_DISPLAY_NAME })
      .where(eq(users.id, existing.id));
    console.info(`Administrator verified: ${email}`);
    return;
  }

  await db.insert(users).values({
    email,
    displayName: config.ADMIN_DISPLAY_NAME,
    passwordHash: await hashPassword(config.ADMIN_PASSWORD),
    role: 'ADMIN',
  });
  console.info(`Administrator created: ${email}`);
}

seedAdmin()
  .then(closeDatabase)
  .catch(async (error: unknown) => {
    console.error('Administrator seed failed', error);
    await closeDatabase();
    process.exit(1);
  });
