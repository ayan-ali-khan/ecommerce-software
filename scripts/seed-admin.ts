/**
 * Seeds (or updates) the single owner admin account from env vars.
 * Usage: bun run seed:admin   (requires ADMIN_EMAIL + ADMIN_PASSWORD, see .env.example)
 */
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '@/lib/db';
import { Admin } from '@/models';

async function main(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'ADMIN_EMAIL and ADMIN_PASSWORD must be set (copy .env.example to .env.local).',
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(`ADMIN_EMAIL is not a valid email: "${email}"`);
  }
  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters long.');
  }

  await connectDB();
  await Admin.syncIndexes();

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await Admin.findOne({ email });

  if (existing) {
    existing.passwordHash = passwordHash;
    await existing.save();
    console.log(`[seed-admin] Updated password for ${email}`);
  } else {
    await Admin.create({ email, passwordHash });
    console.log(`[seed-admin] Created admin ${email}`);
  }
}

main()
  .then(() => disconnectDB())
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    console.error('[seed-admin] Failed:', err);
    process.exit(1);
  });
