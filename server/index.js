require('dotenv').config();
const { createApp } = require('./app');
const { runMigrations, isDatabaseConfigured } = require('./db');

const app = createApp();

const PORT = process.env.PORT || 3000;

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

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();