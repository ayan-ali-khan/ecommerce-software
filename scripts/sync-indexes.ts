/**
 * Creates/updates every index defined by the models (text search, unique slug,
 * TTL on visitor sessions, ...). Production runs with autoIndex off, so this is
 * how indexes get created — run it after deploying or after schema changes:
 *   bun run seed:indexes
 */
import { connectDB, disconnectDB } from '@/lib/db';
import { Admin, Order, Product, Settings, VisitorSession } from '@/models';

async function main(): Promise<void> {
  await connectDB();

  const models = [Product, Order, Admin, Settings, VisitorSession];
  for (const model of models) {
    await model.syncIndexes();
    console.log(`[seed:indexes] synced indexes for ${model.modelName}`);
  }
  console.log('[seed:indexes] Done.');
}

main()
  .then(() => disconnectDB())
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    console.error('[seed:indexes] Failed:', err);
    process.exit(1);
  });
