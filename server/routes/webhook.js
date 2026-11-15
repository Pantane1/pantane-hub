const express = require('express');
const router = express.Router();
const { Lipana } = require('@lipana/sdk');
const db = require('../db');

let lipana;
const getLipana = () => {
  if (!lipana) {
    lipana = new Lipana({
      apiKey: process.env.LIPANA_SECRET_KEY,
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
    });
  }
  return lipana;
};

function maskPhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length < 8) return 'masked';
  return `${digits.slice(0, 4)}****${digits.slice(-2)}`;
}

function mapTransactionStatus(event) {
  if (event === 'transaction.success') return 'successful';
  if (event === 'transaction.failed') return 'failed';
  if (event === 'transaction.pending') return 'pending';
  return 'pending';
}

// POST /lipana-webhook
// Note: express.raw() is applied in index.js before this route
// so req.body here is a raw Buffer — needed for accurate signature verification
router.post('/', async (req, res) => {
  const signature = req.headers['x-lipana-signature'];

  if (!signature) {
    console.warn('Webhook received with no signature — rejected.');
    return res.status(401).json({ error: 'Missing signature.' });
  }

  // Parse raw buffer to JSON for SDK verification
  let payload;
  try {
    payload = JSON.parse(req.body.toString());
  } catch (e) {
    console.error('Webhook body parse error:', e);
    return res.status(400).json({ error: 'Invalid JSON body.' });
  }

  // Verify signature using Lipana SDK
  const sdk = getLipana();
  let isValid = false;
  try {
    isValid = sdk.webhooks.verify(payload, signature, process.env.LIPANA_WEBHOOK_SECRET);
  } catch (error) {
    console.error('Webhook signature verification error:', error?.message);
    isValid = false;
  }

  const event = payload.event;
  const data = payload.data || {};
  const provider = 'mpesa-lipana';
  const transactionId = data?.transactionId || data?.transaction_id || data?.checkoutRequestID || data?.checkout_request_id;
  const dedupeKey = `${event || 'unknown'}:${transactionId || 'unknown'}:${signature}`;

  const pool = db.getPool();
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO payment_webhook_events
          (provider, event_type, provider_reference, dedupe_key, signature_valid, processing_status, payload)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
        [provider, event || 'unknown', transactionId || null, dedupeKey, isValid, isValid ? 'received' : 'failed', JSON.stringify(payload)]
      );
    } catch (error) {
      if (error.code !== '23505') {
        console.error('Webhook event persistence failed:', error.message);
      }
    }
  }

  if (!isValid) {
    console.warn('Webhook signature verification failed.');
    return res.status(401).json({ error: 'Invalid signature.' });
  }

  if (!transactionId) {
    if (pool) {
      await pool.query(
        `UPDATE payment_webhook_events
         SET processing_status = 'failed', processed_at = NOW(), error = $2
         WHERE dedupe_key = $1`,
        [dedupeKey, 'Missing transaction reference.']
      ).catch(() => {});
    }
    return res.status(400).json({ error: 'Missing transaction reference.' });
  }

  // Duplicate event: acknowledge without reprocessing.
  const duplicateResult = pool ? await pool.query('SELECT processing_status FROM payment_webhook_events WHERE dedupe_key = $1', [dedupeKey]) : { rows: [] };
  if (duplicateResult.rows[0]?.processing_status === 'duplicate') {
    return res.status(200).json({ received: true, duplicate: true });
  }

  // Handle events
  const amount = data?.amount;
  const status = mapTransactionStatus(event);

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO payment_transactions
          (provider, provider_reference, amount, currency, status, payer_phone, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
         ON CONFLICT (provider, provider_reference) DO UPDATE SET
           status = EXCLUDED.status,
           amount = COALESCE(EXCLUDED.amount, payment_transactions.amount),
           updated_at = NOW()`,
        [provider, transactionId, amount || null, 'KES', status, maskPhone(data?.phone || data?.phoneNumber), JSON.stringify(data)]
      );

      await pool.query(
        `UPDATE payment_webhook_events
         SET processing_status = 'processed', processed_at = NOW()
         WHERE dedupe_key = $1`,
        [dedupeKey]
      );
    } catch (error) {
      console.error('Webhook transaction persistence failed:', error.message);
      await pool.query(
        `UPDATE payment_webhook_events
         SET processing_status = 'failed', processed_at = NOW(), error = $2
         WHERE dedupe_key = $1`,
        [dedupeKey, String(error.message).slice(0, 500)]
      ).catch(() => {});
      return res.status(500).json({ error: 'Failed to process webhook.' });
    }
  }

  switch (event) {
    case 'transaction.success':
      console.log(`✅ Payment successful — Transaction ID: ${transactionId}, Amount: ${data?.amount} KES`);
      break;
    case 'transaction.failed':
      console.log(`❌ Payment failed — Transaction ID: ${transactionId}`);
      break;
    case 'transaction.pending':
      console.log(`⏳ Payment pending — Transaction ID: ${transactionId}`);
      break;
    default:
      console.log(`Unhandled webhook event: ${event}`);
  }

  // Always respond 200 to Lipana so it doesn't retry
  return res.status(200).json({ received: true });
});

module.exports = router;