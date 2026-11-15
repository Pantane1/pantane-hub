const express = require('express');
const { requireAdmin } = require('../middleware/adminAuth');
const db = require('../db');

const router = express.Router();

function dbUnavailable(res) {
  return res.status(503).json({ error: 'Payment storage is not configured.' });
}

router.get('/payments', requireAdmin, async (req, res) => {
  const pool = db.getPool();
  if (!pool) return dbUnavailable(res);

  const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
  const provider = typeof req.query.provider === 'string' ? req.query.provider.trim() : '';
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

  const params = [];
  const conditions = [];

  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }
  if (provider) {
    params.push(provider);
    conditions.push(`provider = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    const index = params.length;
    conditions.push(`(provider ILIKE $${index} OR provider_reference ILIKE $${index} OR status ILIKE $${index})`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const countResult = await pool.query(`SELECT COUNT(*)::int AS count FROM payment_transactions ${where}`, params);
    const rowsResult = await pool.query(
      `SELECT id, created_at, updated_at, provider, provider_reference, amount, currency, status
       FROM payment_transactions ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return res.json({
      transactions: rowsResult.rows,
      total: countResult.rows[0].count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Payment transaction list failed:', error.message);
    return res.status(500).json({ error: 'Failed to load payment transactions.' });
  }
});

router.get('/payments/:id', requireAdmin, async (req, res) => {
  const pool = db.getPool();
  if (!pool) return dbUnavailable(res);

  try {
    const transactionResult = await pool.query(
      `SELECT id, created_at, updated_at, provider, provider_reference, amount, currency, status
       FROM payment_transactions WHERE id = $1`,
      [req.params.id]
    );
    if (transactionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    const eventsResult = await pool.query(
      `SELECT id, received_at, processed_at, provider, event_type, provider_reference,
              signature_valid, processing_status, error
       FROM payment_webhook_events
       WHERE provider_reference = $1
       ORDER BY received_at ASC`,
      [transactionResult.rows[0].provider_reference]
    );

    return res.json({
      transaction: transactionResult.rows[0],
      webhookEvents: eventsResult.rows,
    });
  } catch (error) {
    console.error('Payment transaction detail failed:', error.message);
    return res.status(500).json({ error: 'Failed to load payment transaction.' });
  }
});

module.exports = router;