const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const db = require('../db');
const { recordAdminAction } = require('../lib/auditLog');

const router = express.Router();
const { createRateLimiter } = require('../middleware/rateLimit');

const initializeRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_CURRENCIES = new Set(['KES', 'USD']);
const ALLOWED_MODES = new Set(['support', 'invoice']);

function dbUnavailable(res) {
  return res.status(503).json({ error: 'Payment storage is not configured.' });
}

function dbUnavailable(res) {
  return res.status(503).json({ error: 'Payment storage is not configured.' });
}

function siteUrl() {
  return (process.env.SITE_URL || 'https://www.pantane.is-a.dev').replace(/\/$/, '');
}

function paystackSecret() {
  return process.env.PAYSTACK_SECRET_KEY;
}

function validateInitialize(body) {
  const errors = {};
  const mode = typeof body?.mode === 'string' ? body.mode.trim() : '';
  const currency = typeof body?.currency === 'string' ? body.currency.trim().toUpperCase() : '';
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const amount = Number(body?.amount);

  if (!ALLOWED_MODES.has(mode)) errors.mode = 'Invalid payment mode.';
  if (!ALLOWED_CURRENCIES.has(currency)) errors.currency = 'Invalid currency.';
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000) errors.amount = 'Amount must be between 1 and 1,000,000.';
  if (!EMAIL_RE.test(email)) errors.email = 'A valid receipt email is required.';

  const payload = { mode, currency, email, amount };

  if (mode === 'support') {
    payload.name = typeof body?.name === 'string' ? body.name.trim().slice(0, 120) : '';
    payload.note = typeof body?.note === 'string' ? body.note.trim().slice(0, 1000) : '';
  }

  if (mode === 'invoice') {
    const clientName = typeof body?.clientName === 'string' ? body.clientName.trim() : '';
    const invoiceNumber = typeof body?.invoiceNumber === 'string' ? body.invoiceNumber.trim() : '';
    if (clientName.length < 2) errors.clientName = 'Client or company name is required.';
    if (invoiceNumber.length < 2) errors.invoiceNumber = 'Invoice number or project scope is required.';
    payload.clientName = clientName.slice(0, 120);
    payload.invoiceNumber = invoiceNumber.slice(0, 200);
    payload.note = typeof body?.note === 'string' ? body.note.trim().slice(0, 1000) : '';
  }

  return { errors, payload };
}

function maskEmail(email) {
  const [local, domain] = String(email).split('@');
  if (!local || !domain) return 'masked';
  return `${local.slice(0, 2)}***@${domain}`;
}

function mapPaystackStatus(status) {
  if (status === 'success') return 'successful';
  if (status === 'abandoned') return 'cancelled';
  if (status === 'failed') return 'failed';
  return 'pending';
}

router.post('/initialize', initializeRateLimiter.middleware, async (req, res) => {
  const secret = paystackSecret();
  if (!secret) {
    return res.status(503).json({ error: 'Paystack is not configured.' });
  }

  const { errors, payload } = validateInitialize(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: 'Invalid payment request.', errors });
  }

  const reference = `PS_${Date.now()}_${crypto.randomUUID()}`;
  const pool = db.getPool();
  if (!pool) return dbUnavailable(res);

  const metadata = {
    source: 'pantane-hub',
    mode: payload.mode,
    currency: payload.currency,
    name: payload.name || payload.clientName || null,
    note: payload.note || null,
    clientName: payload.clientName || null,
    invoiceNumber: payload.invoiceNumber || null,
  };

  try {
    await pool.query(
      `INSERT INTO payment_transactions
        (provider, provider_reference, amount, currency, status, metadata)
       VALUES ('paystack', $1, $2, $3, 'pending', $4::jsonb)`,
      [reference, payload.amount, payload.currency, JSON.stringify(metadata)]
    );
  } catch (error) {
    console.error('Paystack transaction persistence failed:', error.message);
    return res.status(500).json({ error: 'Failed to create payment record.' });
  }

  const callbackUrl = `${siteUrl()}/support?verify=${encodeURIComponent(reference)}`;

  try {
    const { data } = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: payload.email,
        amount: Math.round(payload.amount * 100),
        currency: payload.currency,
        reference,
        callback_url: callbackUrl,
        metadata,
      },
      {
        headers: {
          Authorization: `Bearer ${secret}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    if (!data?.status || !data?.data?.authorization_url) {
      throw new Error('Paystack did not return an authorization URL.');
    }

    return res.status(200).json({
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference || reference,
      accessCode: data.data.access_code || null,
    });
  } catch (error) {
    await pool.query(
      `UPDATE payment_transactions
       SET status = 'failed', updated_at = NOW()
       WHERE provider = 'paystack' AND provider_reference = $1`,
      [reference]
    ).catch(() => {});

    console.error('Paystack initialization failed:', error?.response?.status || error?.message);
    return res.status(502).json({ error: 'Failed to initialize Paystack payment.' });
  }
});

router.get('/verify/:reference', async (req, res) => {
  const secret = paystackSecret();
  if (!secret) {
    return res.status(503).json({ error: 'Paystack is not configured.' });
  }

  const reference = String(req.params.reference || '').trim();
  if (!reference || reference.length > 100 || !/^[A-Za-z0-9_-]+$/.test(reference)) {
    return res.status(400).json({ error: 'Invalid payment reference.' });
  }

  const pool = db.getPool();
  if (!pool) return dbUnavailable(res);

  try {
    const { data } = await axios.get(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
      timeout: 15000,
    });

    if (!data?.status) {
      return res.status(502).json({ error: 'Paystack verification failed.' });
    }

    const payment = data.data || {};
    const providerStatus = payment.status || 'failed';
    const status = mapPaystackStatus(providerStatus);
    const amount = typeof payment.amount === 'number' ? payment.amount / 100 : null;
    const currency = payment.currency || null;
    const paidAt = payment.paid_at || null;
    const channel = payment.channel || null;
    const customerEmail = payment.customer?.email || null;
    const customerName = payment.customer?.first_name
      ? `${payment.customer.first_name} ${payment.customer.last_name || ''}`.trim()
      : null;

    await pool.query(
      `INSERT INTO payment_transactions
        (provider, provider_reference, amount, currency, status, metadata)
       VALUES ('paystack', $1, $2, $3, $4, $5::jsonb)
       ON CONFLICT (provider, provider_reference) DO UPDATE SET
         status = EXCLUDED.status,
         amount = COALESCE(EXCLUDED.amount, payment_transactions.amount),
         currency = COALESCE(EXCLUDED.currency, payment_transactions.currency),
         metadata = payment_transactions.metadata || EXCLUDED.metadata,
         updated_at = NOW()`,
      [
        reference,
        amount,
        currency,
        status,
        JSON.stringify({
          verifiedBy: 'paystack',
          providerStatus,
          channel,
          customerEmail: customerEmail ? maskEmail(customerEmail) : null,
          customerName,
          paidAt,
        }),
      ]
    );

    return res.status(200).json({
      status,
      reference: payment.reference || reference,
      amount,
      currency,
      paidAt,
      channel,
      customerEmail: customerEmail ? maskEmail(customerEmail) : null,
      customerName,
    });
  } catch (error) {
    console.error('Paystack verification failed:', error?.response?.status || error?.message);
    return res.status(502).json({ error: 'Failed to verify Paystack payment.' });
  }
});

module.exports = router;