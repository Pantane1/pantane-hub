# PantaneHub Production Deployment Guide

## Scope
This guide covers deploying the PantaneHub backend and frontend without exposing secrets or performing destructive data operations.

## Prerequisites
- PostgreSQL database provisioned.
- Render backend service configured.
- Vercel frontend project configured.
- GitHub repository access for deployment.
- Administrator password hash generated locally.

## Backend environment variables
Configure these in Render. Do not commit real values.

```text
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://www.pantane.is-a.dev
DATABASE_URL=postgresql://...
GITHUB_TOKEN=...
ADMIN_PASSWORD_HASH=...
SESSION_SECRET=...
LIPANA_SECRET_KEY=...
LIPANA_WEBHOOK_SECRET=...
GEMINI_API_KEY=...
EMAILJS_SERVICE_ID=...
EMAILJS_PUBLIC_KEY=...
EMAILJS_NOTIFY_TEMPLATE_ID=...
EMAILJS_AUTOREPLY_TEMPLATE_ID=...
```

## Frontend environment variables
Configure these in Vercel:

```text
VITE_API_URL=https://pantane-hub.onrender.com
VITE_EMAILJS_SERVICE_ID=...
VITE_EMAILJS_PUBLIC_KEY=...
VITE_EMAILJS_TEMPLATE_ID=...
VITE_EMAILJS_AUTOREPLY_TEMPLATE_ID=...
```

`GEMINI_API_KEY` must never be configured as a frontend variable.

## Deployment steps
1. Merge the approved mission branch through a pull request.
2. Deploy the backend to Render.
3. Deploy the frontend to Vercel.
4. Confirm the backend health endpoint returns `200`.
5. Run database migrations:
   ```bash
   cd server
   npm run migrate
   ```
6. Verify the database:
   ```bash
   cd server
   npm run verify-database
   ```
7. Verify admin authentication, inquiries, Journal, Sharp, payments and communications.

## Safety rules
- Do not modify production secrets through chat or source code.
- Do not reset production data.
- Do not deploy unverified authentication or payment changes.
- Back up the database before migration.

## Rollback
1. Revert the application deployment to the previous Render release.
2. Restore the database from backup if a migration caused an issue.
3. Revoke or rotate compromised credentials separately if required.

Migrations are additive and use `CREATE TABLE IF NOT EXISTS`, so rollback is primarily an application-level operation.