# Notification Recovery Tests

## Automated coverage
- Successful inquiry persistence.
- Notification failure without inquiry loss.
- Notification retry behaviour.
- Duplicate submission protection.
- Outbox job processing.
- Contact message persistence and retry.

## Recovery procedure
1. Submit an inquiry while notification delivery is unavailable.
2. Confirm the inquiry is persisted.
3. Confirm the notification status is `failed`.
4. Confirm a notification attempt is recorded.
5. Restart the backend.
6. Confirm the outbox worker retries pending or failed jobs.
7. Confirm the notification status updates after a successful retry.
8. Confirm retries do not create duplicate inquiries.
9. Confirm duplicate outbox jobs are handled safely.

## Backoff and retry limits
- Failed jobs remain in the outbox.
- Retry attempts are tracked.
- Backoff increases with attempts.
- Jobs stop retrying after the configured maximum.

## Limitation
The worker is in-process. It is suitable for a single backend instance but is not a distributed queue. Multi-instance deployment requires a shared worker or leasing mechanism.