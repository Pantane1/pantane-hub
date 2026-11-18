require('dotenv').config();
const db = require('../db');

const REQUIRED_TABLES = [
  'schema_migrations',
  'inquiries',
  'inquiry_events',
  'contact_messages',
  'payment_transactions',
  'payment_webhook_events',
  'notification_attempts',
  'notification_outbox',
  'admin_audit_log',
  'projects',
];

async function main() {
  if (!db.isDatabaseConfigured()) {
    console.error('DATABASE_URL is not configured.');
    process.exit(1);
  }

  const pool = db.getPool();
  const tablesResult = await pool.query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name = ANY($1::text[])`,
    [REQUIRED_TABLES]
  );
  const foundTables = new Set(tablesResult.rows.map((row) => row.table_name));
  const missingTables = REQUIRED_TABLES.filter((table) => !foundTables.has(table));

  const migrationResult = await pool.query('SELECT COUNT(*)::int AS count FROM schema_migrations');
  const migrationCount = migrationResult.rows[0]?.count || 0;

  const indexResult = await pool.query(
    `SELECT tablename, indexname
     FROM pg_indexes
     WHERE schemaname = 'public'
       AND tablename = ANY($1::text[])`,
    [REQUIRED_TABLES]
  );

  const summary = {
    databaseConfigured: true,
    connected: true,
    migrationCount,
    requiredTables: REQUIRED_TABLES.length,
    foundTables: foundTables.size,
    missingTables,
    indexCount: indexResult.rows.length,
  };

  console.log(JSON.stringify(summary, null, 2));

  if (missingTables.length > 0) {
    process.exitCode = 1;
  }

  await db.closeDatabase();
}

main().catch((error) => {
  console.error('Database verification failed:', error.message);
  process.exit(1);
});