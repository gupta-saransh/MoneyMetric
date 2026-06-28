import postgres from 'postgres';

// Create the client lazily on first use (not at import time) so a missing
// DATABASE_URL or a connection problem surfaces as a handled JSON error
// instead of crashing the whole function. Reused across warm invocations.
const g = globalThis as unknown as { _sql?: ReturnType<typeof postgres> };

export function getSql() {
  if (g._sql) return g._sql;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set in the environment');
  }

  g._sql = postgres(url, {
    ssl: 'require',
    prepare: false, // safer through CockroachDB Serverless' connection proxy
    max: 1, // serverless: keep the pool tiny
    idle_timeout: 20,
  });
  return g._sql;
}
