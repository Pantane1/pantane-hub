const express = require('express');
const router = express.Router();
const { Lipana } = require('@lipana/sdk');

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

// POST /lipana-webhook
// Note: express.raw() is applied in index.js before this route
// so req.body here is a raw Buffer — needed for accurate signature verification
router.post('/', (req, res) => {
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
  const isValid = sdk.webhooks.verify(
    payload,
    signature,
    process.env.LIPANA_WEBHOOK_SECRET
  );

  if (!isValid) {
    console.warn('Webhook signature verification failed.');
    return res.status(401).json({ error: 'Invalid signature.' });
  }

  // Handle events
  // Lipana sends transaction.success / transaction.failed
  // Webhook payload has snake_case (transaction_id) or camelCase (transactionId)
  const event = payload.event;
  const data = payload.data;
  const transactionId = data?.transactionId || data?.transaction_id;

  console.log(`Webhook event received: ${event} | Transaction: ${transactionId}`);

  switch (event) {
    case 'transaction.success':
      console.log(`✅ Payment successful — Transaction ID: ${transactionId}, Amount: ${data?.amount} KES`);
      // TODO: update your DB, send confirmation SMS, etc.
      break;

    case 'transaction.failed':
      console.log(`❌ Payment failed — Transaction ID: ${transactionId}`);
      // TODO: handle failure, notify user, etc.
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