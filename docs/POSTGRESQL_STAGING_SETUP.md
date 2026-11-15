# PostgreSQL Staging Setup

## Purpose
Configure an isolated PostgreSQL database for PantaneHub staging verification.

## Requirements
- PostgreSQL 14 or newer.
- A dedicated staging database.
- A non-production `DATABASE_URL`.
- Network access from the staging backend.

## Environment variable
```text
DATABASE_URL=postgresql://staging_user:password@staging-host:5432/pantanehub_staging
```

## Setup steps
1. Create a dedicated staging database and user.
2. Restrict the user to the staging database.
3. Set `NODE_ENV=staging` or `production` as appropriate for the staging backend.
4. Configure `DATABASE_URL` in the staging backend environment.
5. Run migrations:
   ```bash
   cd server
   npm run migrate
   ```
6. Verify the database:
   ```bash
   cd server
   npm run verify-database
   ```
7. Start the backend and confirm the health endpoint.

## Safety rules
- Never use the production database for staging tests.
- Never run destructive restore commands against production.
- Back up the database before migration testing.
- Use disposable test data only.

## Expected verification
- All required tables exist.
- `schema_migrations` contains all migration versions.
- Indexes and constraints are present.
- Re-running migrations reports that the database is up to date.
- Concurrent migration execution does not corrupt schema state.