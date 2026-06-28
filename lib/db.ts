import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    'DATABASE_URL is not set. Copy .env.example to .env and paste your CockroachDB connection string.',
  );
}

// Reuse one client across warm serverless invocations (avoids exhausting connections).
const globalForDb = globalThis as unknown as { _sql?: ReturnType<typeof postgres> };

export const sql =
  globalForDb._sql ??
  postgres(url, {
    ssl: 'require',
    prepare: false, // safer through CockroachDB Serverless' connection proxy
    max: 1, // serverless: keep the pool tiny
    idle_timeout: 20,
  });

globalForDb._sql = sql;
