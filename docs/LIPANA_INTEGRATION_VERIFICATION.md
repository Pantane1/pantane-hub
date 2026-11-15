# Lipana M-Pesa Integration Verification

## Automated coverage
- Webhook signature verification.
- Invalid signature rejection.
- Duplicate webhook handling.
- Transaction persistence.
- Payment status transitions.
- Admin payment listing.

## Staging verification procedure
1. Configure `LIPANA_SECRET_KEY` and `LIPANA_WEBHOOK_SECRET`.
2. Configure the Lipana webhook URL to the staging backend.
3. Initiate an STK push from the staging frontend.
4. Confirm a pending transaction record is created.
5. Complete or fail the payment in the provider sandbox.
6. Confirm the webhook is received.
7. Confirm invalid signatures are rejected with `401`.
8. Confirm the transaction status transitions correctly.
9. Replay the same webhook and confirm it is reported as a duplicate.
10. Confirm no duplicate transaction records are created.
11. Confirm audit and transaction visibility in the admin dashboard.

## Safety rules
- Never mark a payment successful without a verified provider event.
- Never fabricate payment responses.
- Never use real customer payments for testing.
- Do not expose payment secrets or sensitive customer information.

## Status
- Backend implementation: complete
- Automated tests: passed
- Live provider verification: pending infrastructure and credentials