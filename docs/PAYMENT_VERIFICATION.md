# PantaneHub Payment Integration Readiness

## Status summary

| Provider | Implementation status | Backend verification | Production verified |
| --- | --- | --- | --- |
| Lipana M-Pesa | Implemented | Yes | No |
| PayPal | Frontend support flow only | No | No |
| Paystack | Frontend support flow only | No | No |

## Lipana M-Pesa
- STK push is initiated through the backend.
- Webhook signatures are verified using the Lipana SDK.
- Transaction records are persisted after verified provider events.
- Duplicate webhook events are handled idempotently.
- Transaction statuses are updated from provider events.
- Pending, successful and failed states are supported.

### Required production verification
1. Configure `LIPANA_SECRET_KEY` and `LIPANA_WEBHOOK_SECRET`.
2. Configure the Lipana webhook URL to the production backend.
3. Perform a real staging M-Pesa payment.
4. Confirm the webhook is received and verified.
5. Confirm the transaction status transitions to `successful`.
6. Confirm duplicate webhook delivery does not create duplicate records.

No real charges should be made during automated tests.

## PayPal
- Existing frontend support flow only.
- No backend order creation, capture or verification.
- No transaction persistence.
- Not backend-verified.

## Paystack
- Existing frontend inline support flow only.
- Uses test public key in the current implementation.
- No backend verification or transaction persistence.
- Not backend-verified.

## Security rules
- Never mark a payment successful without verified provider evidence.
- Never fabricate historical transactions.
- Do not expose payment secrets or sensitive customer information.