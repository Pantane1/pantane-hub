# Admin Authentication Verification

## Automated tests already present
- Successful login.
- Invalid credentials.
- Missing credentials.
- Invalid request body.
- Session creation.
- Valid session verification.
- Invalid session rejection.
- Logout and session invalidation.
- Unauthenticated admin endpoint rejection.
- Legacy Bearer-password rejection.
- CSRF protection.
- Login rate limiting.

## Staging verification procedure
1. Open the admin login page.
2. Submit invalid credentials and confirm a generic `Invalid credentials.` response.
3. Submit valid credentials and confirm login succeeds.
4. Inspect the session cookie:
   - `HttpOnly`
   - `Secure` in production
   - `SameSite=None` in production
   - appropriate `Max-Age`
5. Refresh the admin page and confirm the session remains valid.
6. Call `/admin/session` and confirm it returns `authenticated: true`.
7. Perform a privileged write without a CSRF token and confirm `403`.
8. Perform the same write with the CSRF token and confirm success.
9. Log out and confirm `/admin/session` returns `401`.
10. Repeat invalid logins until rate limiting returns `429`.
11. Restart the backend and document whether sessions are lost.

## Known limitation
Sessions and rate-limit counters are in-memory. Multi-instance deployment requires persistent sessions and distributed rate limiting.