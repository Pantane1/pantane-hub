const express = require('express');
const axios = require('axios');
const db = require('../db');
const { requireAdmin, requireCsrf } = require('../middleware/adminAuth');
const { recordAdminAction } = require('../lib/auditLog');
const { enqueueNotification, processOutboxItem } = require('../services/notificationOutbox');

const publicRouter = express.Router();
const adminRouter = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function dbUnavailable(res) {
  return res.status(503).json({ error: 'Contact message storage is not configured.' });
}

const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || process.env.VITE_EMAILJS_SERVICE_ID || 'service_65nlo8m';
const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || process.env.VITE_EMAILJS_PUBLIC_KEY || '6B39GrANe3KTTGYGH';
const EMAILJS_NOTIFY_TEMPLATE_ID = process.env.EMAILJS_NOTIFY_TEMPLATE_ID || process.env.VITE_EMAILJS_TEMPLATE_ID || 'template_b1391e3';
const EMAILJS_AUTOREPLY_TEMPLATE_ID = process.env.EMAILJS_AUTOREPLY_TEMPLATE_ID || process.env.VITE_EMAILJS_AUTOREPLY_TEMPLATE_ID || 'template_y88lggc';

function isEmailJsConfigured() {
  return Boolean(EMAILJS_SERVICE_ID && EMAILJS_PUBLIC_KEY && EMAILJS_NOTIFY_TEMPLATE_ID);
}

function safeError(error) {
  const message = error?.response?.data?.message || error?.response?.data || error?.message || 'Email delivery failed.';
  return String(message).slice(0, 500);
}

async function sendOwnerNotification(message) {
  if (!isEmailJsConfigured()) {
    return { status: 'failed', error: 'EmailJS is not configured.' };
  }
  try {
    await axios.post('https://api.emailjs.com/api/v1.0/email/send', {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_NOTIFY_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        from_name: message.name,
        from_email: message.email,
        message: message.message,
      },
    }, { timeout: 15000 });
    return { status: 'sent' };
  } catch (error) {
    return { status: 'failed', error: safeError(error) };
  }
}

async function sendClientAutoreply(message) {
  if (!isEmailJsConfigured() || !EMAILJS_AUTOREPLY_TEMPLATE_ID) {
    return { status: 'failed', error: 'EmailJS autoreply is not configured.' };
  }
  try {
    await axios.post('https://api.emailjs.com/api/v1.0/email/send', {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_AUTOREPLY_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        to_name: message.name,
        user_email: message.email,
        message: message.message,
      },
    }, { timeout: 15000 });
    return { status: 'sent' };
  } catch (error) {
    return { status: 'failed', error: safeError(error) };
  }
}

async function attemptContactNotifications(message) {
  const owner = await sendOwnerNotification(message);
  const client = owner.status === 'sent'
    ? await sendClientAutoreply(message)
    : { status: 'skipped', error: 'Owner notification failed.' };
  return { owner, client };
}

publicRouter.post('/', async (req, res) => {
  const pool = db.getPool();
  if (!pool) return dbUnavailable(res);

  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Invalid request body.' });
  }

  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim();
  const messageText = String(req.body.message || '').trim();

  if (name.length < 2) {
    return res.status(400).json({ error: 'Please enter your name.' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (messageText.length < 1) {
    return res.status(400).json({ error: 'Please enter a message.' });
  }

  let message;
  try {
    const result = await pool.query(
      `INSERT INTO contact_messages (name, email, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, email, messageText]
    );
    message = result.rows[0];
  } catch (error) {
    console.error('Contact message persistence failed:', error.message);
    return res.status(500).json({ error: 'Failed to save message.' });
  }

  let notifications = { owner: { status: 'skipped' }, client: { status: 'skipped' } };
  try {
    const outboxItem = await enqueueNotification(pool, {
      targetType: 'contact_message',
      targetId: message.id,
      channel: 'email',
      payload: { contactMessageId: message.id },
    });
    await processOutboxItem(pool, outboxItem);
    const updatedMessage = await pool.query('SELECT notification_status, notification_error FROM contact_messages WHERE id = $1', [message.id]);
    notifications = {
      owner: {
        status: updatedMessage.rows[0]?.notification_status === 'sent' ? 'sent' : 'failed',
        error: updatedMessage.rows[0]?.notification_error || undefined,
      },
      client: { status: 'best-effort' },
    };
  } catch (error) {
    console.error('Contact notification processing failed:', error.message);
    notifications = {
      owner: { status: 'failed', error: 'Notification processing failed.' },
      client: { status: 'skipped' },
    };
  }

  const updated = await pool.query('SELECT * FROM contact_messages WHERE id = $1', [message.id]);

  return res.status(201).json({
    success: true,
    message: updated.rows[0],
    notification: notifications,
  });
});

adminRouter.get('/communications', requireAdmin, async (req, res) => {
  const pool = db.getPool();
  if (!pool) return dbUnavailable(res);

  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

  const params = [];
  const conditions = [];
  if (search) {
    params.push(`%${search}%`);
    const index = params.length;
    conditions.push(`(name ILIKE $${index} OR email ILIKE $${index} OR message ILIKE $${index})`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const countResult = await pool.query(`SELECT COUNT(*)::int AS count FROM contact_messages ${where}`, params);
    const rowsResult = await pool.query(
      `SELECT * FROM contact_messages ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return res.json({
      messages: rowsResult.rows,
      total: countResult.rows[0].count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Communications list failed:', error.message);
    return res.status(500).json({ error: 'Failed to load communications.' });
  }
});

adminRouter.get('/communications/:id', requireAdmin, async (req, res) => {
  const pool = db.getPool();
  if (!pool) return dbUnavailable(res);

  try {
    const messageResult = await pool.query('SELECT * FROM contact_messages WHERE id = $1', [req.params.id]);
    if (messageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found.' });
    }
    const attemptsResult = await pool.query(
      `SELECT * FROM notification_attempts
       WHERE target_type = 'contact_message' AND target_id = $1
       ORDER BY created_at ASC`,
      [req.params.id]
    );

    return res.json({
      message: messageResult.rows[0],
      notificationAttempts: attemptsResult.rows,
    });
  } catch (error) {
    console.error('Communication detail failed:', error.message);
    return res.status(500).json({ error: 'Failed to load communication.' });
  }
});

adminRouter.post('/communications/:id/notify', requireAdmin, requireCsrf, async (req, res) => {
  const pool = db.getPool();
  if (!pool) return dbUnavailable(res);

  try {
    const messageResult = await pool.query('SELECT * FROM contact_messages WHERE id = $1', [req.params.id]);
    if (messageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found.' });
    }
    const message = messageResult.rows[0];

    const outboxItem = await enqueueNotification(pool, {
      targetType: 'contact_message',
      targetId: message.id,
      channel: 'email',
      payload: { contactMessageId: message.id },
    });
    await processOutboxItem(pool, outboxItem);

    const updatedMessage = await pool.query('SELECT * FROM contact_messages WHERE id = $1', [message.id]);
    const notificationStatus = updatedMessage.rows[0].notification_status;
    const notifications = {
      owner: { status: notificationStatus === 'sent' ? 'sent' : 'failed' },
      client: { status: 'best-effort' },
    };

    await recordAdminAction({
      action: 'communication.notification_retried',
      targetType: 'contact_message',
      targetId: message.id,
      metadata: { owner: notifications.owner.status, client: notifications.client.status },
      ipAddress: req.ip,
    });

    return res.json({ message: updatedMessage.rows[0], notification: notifications });
  } catch (error) {
    console.error('Communication notification retry failed:', error.message);
    return res.status(500).json({ error: 'Failed to retry notification.' });
  }
});

module.exports = {
  publicRouter,
  adminRouter,
  attemptContactNotifications,
};