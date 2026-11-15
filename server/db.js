const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

let pool = null;

function getDatabaseUrl() {
  return process.env.DATABASE_URL;
}

function isDatabaseConfigured() {
  return Boolean(getDatabaseUrl());
}

function getPool() {
  if (!isDatabaseConfigured()) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: getDatabaseUrl(),
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }

  return pool;
}

async function runMigrations(activePool = getPool()) {
  if (!activePool) {
    console.warn('DATABASE_URL is not configured; database migrations are skipped.');
    return { applied: [], skipped: true };
  }

  const client = await activePool.connect();
  const applied = [];

  try {
    await client.query("SELECT pg_advisory_lock(hashtext('pantanehub:migrations'))");

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const migrationResult = await client.query('SELECT version FROM schema_migrations');
    const appliedVersions = new Set(migrationResult.rows.map((row) => row.version));

    const migrationFiles = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      if (appliedVersions.has(file)) {
        continue;
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
        await client.query('COMMIT');
        applied.push(file);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    return { applied, skipped: false };
  } finally {
    await client.query('SELECT pg_advisory_unlock(hashtext(\'pantanehub:migrations\'))').catch(() => {});
    client.release();
  }
}

async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  getPool,
  runMigrations,
  closeDatabase,
  isDatabaseConfigured,
};