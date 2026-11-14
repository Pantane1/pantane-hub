require('dotenv').config();
const { runMigrations, closeDatabase, isDatabaseConfigured } = require('../db');

async function main() {
  const result = await runMigrations();
  if (result.skipped) {
    console.log('Database migrations skipped because DATABASE_URL is not configured.');
  } else if (result.applied.length === 0) {
    console.log('Database is already up to date.');
  } else {
    console.log(`Applied ${result.applied.length} migration(s): ${result.applied.join(', ')}`);
  }
  await closeDatabase();
}

main().catch((error) => {
  console.error('Database migration failed:', error.message);
  process.exit(1);
});