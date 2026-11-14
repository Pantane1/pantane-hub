const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const db = require('../db');

test.beforeEach(() => {
  delete process.env.DATABASE_URL;
});

test('database is disabled when DATABASE_URL is not configured', () => {
  assert.equal(db.isDatabaseConfigured(), false);
  assert.equal(db.getPool(), null);
});

test('runMigrations skips safely when DATABASE_URL is not configured', async () => {
  const result = await db.runMigrations();
  assert.deepEqual(result, { applied: [], skipped: true });
});

test('initial migration file exists and defines operational tables', () => {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter((file) => file.endsWith('.sql')).sort();

  assert.ok(files.includes('001_initial_admin_operations.sql'));

  const sql = fs.readFileSync(path.join(migrationsDir, '001_initial_admin_operations.sql'), 'utf8');
  for (const table of [
    'inquiries',
    'contact_messages',
    'payment_transactions',
    'payment_webhook_events',
    'notification_attempts',
    'admin_audit_log',
  ]) {
    assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
  }
});

test('runMigrations applies and records a new migration', async () => {
  const queries = [];
  const client = {
    async query(sql) {
      queries.push(sql);
      if (sql.includes('SELECT version FROM schema_migrations')) {
        return { rows: [] };
      }
      return { rows: [] };
    },
    release() {},
  };
  const pool = {
    connect: async () => client,
  };

  const result = await db.runMigrations(pool);

  assert.deepEqual(result, {
    applied: ['001_initial_admin_operations.sql'],
    skipped: false,
  });
  assert.ok(queries.some((sql) => sql.includes('CREATE TABLE IF NOT EXISTS inquiries')));
  assert.ok(queries.some((sql) => sql.includes('INSERT INTO schema_migrations')));
});

test('runMigrations skips already applied migrations', async () => {
  const client = {
    async query(sql) {
      if (sql.includes('SELECT version FROM schema_migrations')) {
        return { rows: [{ version: '001_initial_admin_operations.sql' }] };
      }
      return { rows: [] };
    },
    release() {},
  };
  const pool = {
    connect: async () => client,
  };

  const result = await db.runMigrations(pool);

  assert.deepEqual(result, { applied: [], skipped: false });
});

test('migration script syntax is valid', () => {
  require('node:child_process').execFileSync(process.execPath, ['--check', path.join(__dirname, '..', 'scripts', 'migrate.js')]);
});