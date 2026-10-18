/**
 * Local development MongoDB — no Atlas account needed during development.
 * Usage: bun run db:temp   (then put the printed MONGODB_URI in .env.local)
 * Data is ephemeral: re-run `bun run seed` after restarting.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

const PORT = Number(process.env.DEV_MONGO_PORT ?? 27017);
const DB_NAME = 'supplement-store';

async function main(): Promise<void> {
  const mongod = await MongoMemoryServer.create({
    instance: { port: PORT, dbName: DB_NAME },
  });

  console.log(`[dev-mongo] MongoDB running at mongodb://127.0.0.1:${PORT}/${DB_NAME}`);
  console.log('[dev-mongo] Add to .env.local:');
  console.log(`[dev-mongo]   MONGODB_URI="mongodb://127.0.0.1:${PORT}/${DB_NAME}"`);
  console.log('[dev-mongo] Press Ctrl+C to stop (data is ephemeral).');

  const shutdown = (): void => {
    void mongod.stop().then(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err: unknown) => {
  console.error('[dev-mongo] Failed:', err);
  process.exit(1);
});
