# PantaneHub Security Operations

## Authentication
- Admin authentication uses an HttpOnly session cookie.
- Production cookies use `Secure`, `SameSite=None`, `HttpOnly`, and an 8-hour expiry.
- Passwords are verified against `ADMIN_PASSWORD_HASH` using bcrypt.
- Failed login attempts are rate limited.
- Legacy Bearer-password authentication is not supported.

## CSRF
- State-changing admin endpoints require an `X-CSRF-Token` header.
- The token is issued by the backend and kept in frontend memory only.

## CORS
- Only explicitly allowlisted origins may use credentials.
- Wildcard origins are not permitted with credentials.
- Production frontend origins are allowlisted.

## Secrets
- Secrets are stored only in environment variables.
- Secrets are never committed, logged or returned in API responses.
- `GEMINI_API_KEY` is backend-only.

## Audit logging
- `admin_audit_log` is append-only from the application perspective.
- A database trigger blocks updates and deletes.
- Logs exclude passwords, hashes, tokens, API keys and session identifiers.
- Proposed retention: 24 months.

## Session and rate-limit limitations
- Sessions and rate-limit counters are stored in memory.
- They are not shared across backend instances.
- They are lost on process restart.
- For multi-instance deployment, migrate to a shared store such as Redis or PostgreSQL-backed sessions and distributed rate limiting.

## Notification reliability
- The notification outbox is durable within a single backend instance.
- A worker retries pending and failed jobs with backoff.
- The worker is in-process and is not suitable for horizontal scaling without a shared locking or leasing mechanism.

## Webhook security
- Lipana webhooks require signature verification.
- Invalid signatures are rejected.
- Duplicate events are handled idempotently.
- Payment status changes originate from verified provider events.