require('dotenv').config();
const { createApp } = require('./app');
const { runMigrations, isDatabaseConfigured, closeDatabase } = require('./db');
const { startNotificationWorker, stopNotificationWorker } = require('./services/notificationOutbox');

const app = createApp();

const PORT = process.env.PORT || 3000;

async function shutdown(signal, server) {
  console.log(`${signal} received; shutting down gracefully.`);
  stopNotificationWorker();
  server.close(async () => {
    try {
      await closeDatabase();
    } catch (error) {
      console.error('Database shutdown failed:', error.message);
    }
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

async function start() {
  try {
    const result = await runMigrations();
    if (result.skipped) {
      console.warn('DATABASE_URL is not configured; database-backed features are disabled.');
    } else if (result.applied.length > 0) {
      console.log(`Applied ${result.applied.length} database migration(s): ${result.applied.join(', ')}`);
    } else {
      console.log('Database migrations are up to date.');
    }
  } catch (error) {
    console.error('Database migration failed:', error.message);
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startNotificationWorker();
  });

  process.on('SIGTERM', () => shutdown('SIGTERM', server));
  process.on('SIGINT', () => shutdown('SIGINT', server));
}

start();