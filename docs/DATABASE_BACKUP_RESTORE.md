# PantaneHub Database Backup and Restore

## Backup
Create a logical backup before any migration or deployment:

```bash
pg_dump "$DATABASE_URL" --format=custom --file=pantanehub-$(date +%Y%m%d-%H%M%S).dump
```

Store backups outside the application server and protect them as production data.

## Restore
Restore into a staging database first:

```bash
pg_restore --clean --if-exists --dbname="$DATABASE_URL" pantanehub-backup.dump
```

Verify table counts, indexes and application behavior before restoring to production.

## Migration safety
- Migrations are additive and idempotent.
- Each migration runs inside a transaction.
- `schema_migrations` records applied versions.
- `pg_advisory_lock` prevents concurrent migration execution.
- If a migration fails, it rolls back and the backend does not start.

## Retention
Administrative audit records have a proposed 24-month retention period. Automated deletion is not enabled. Any purge must be reviewed against legal and business requirements and performed through a controlled, audited process.

## Rollback
Application rollback is preferred over database rollback. If a database rollback is required, restore from the pre-migration backup and redeploy the previous application version.