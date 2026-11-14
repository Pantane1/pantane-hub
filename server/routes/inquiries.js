const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { validateInquiry, buildInquiryMessage } = require('../lib/inquiryValidation');
const { recordAdminAction } = require('../lib/auditLog');
const { attemptInquiryNotifications } = require('../services/inquiryNotifications');
const { requireAdmin, requireCsrf } = require('../middleware/adminAuth');

const publicRouter = express.Router();
const adminRouter = express.Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function dbUnavailable(res) {
  return res.status(503).json({ error: 'Inquiry storage is not configured.' });
}

function toInquiry(row) {
  if (!row) return null;
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    service: row.service,
    description: row.description,
    budget: row.budget,
    timeline: row.timeline,
    requirements: row.requirements,
    name: row.name,
    email: row.email,
    phone: row.phone,
    business: row.business,
    status: row.status,
    internalNotes: row.internal_notes,
    notificationStatus: row.notification_status,
    notificationError: row.notification_error,
    lastNotifiedAt: row.last_notified_at,
    submissionId: row.submission_id,
  };
}

async function insertNotificationAttempt(pool, inquiryId, channel, result) {
  await pool.query(
    `INSERT INTO notification_attempts (target_type, target_id, channel, status, error, attempted_at)
     VALUES ('inquiry', $1, $2, $3, $4, NOW())`,
    [inquiryId, channel, result.status, result.error || null]
  );
}

async function recordInquiryCreated(pool, inquiryId) {
  await pool.query(
    `INSERT INTO inquiry_events (inquiry_id, event_type, new_status, metadata)
     VALUES ($1, 'created', 'new', '{}'::jsonb)`,
    [inquiryId]
  );
}

publicRouter.post('/', async (req, res) => {
  const pool = db.getPool();
  if (!pool) return dbUnavailable(res);

  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Invalid request body.' });
  }

  const values = {
    service: String(req.body.service || '').trim(),
    description: String(req.body.description || '').trim(),
    budget: String(req.body.budget || '').trim(),
    timeline: String(req.body.timeline || '').trim(),
    requirements: String(req.body.requirements || '').trim(),
    name: String(req.body.name || '').trim(),
    email: String(req.body.email || '').trim(),
    phone: String(req.body.phone || '').trim(),
    business: String(req.body.business || '').trim(),
  };

  const errors = validateInquiry(values);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: 'Invalid inquiry.', errors });
  }

  const submissionId = typeof req.body.submissionId === 'string' && req.body.submissionId.trim()
    ? req.body.submissionId.trim().slice(0, 128)
    : crypto.randomUUID();

  let inquiry;
  let duplicate = false;

  try {
    const result = await pool.query(
      `INSERT INTO inquiries
        (service, description, budget, timeline, requirements, name, email, phone, business, submission_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        values.service,
        values.description,
        values.budget,
        values.timeline,
        values.requirements,
        values.name,
        values.email,
        values.phone || null,
        values.business || null,
        submissionId,
      ]
    );
    inquiry = result.rows[0];
    await recordInquiryCreated(pool, inquiry.id);
  } catch (error) {
    if (error.code === '23505') {
      const existing = await pool.query('SELECT * FROM inquiries WHERE submission_id = $1', [submissionId]);
      if (existing.rows[0]) {
        inquiry = existing.rows[0];
        duplicate = true;
      } else {
        return res.status(409).json({ error: 'Duplicate inquiry submission.' });
      }
    } else {
      console.error('Inquiry persistence failed:', error.message);
      return res.status(500).json({ error: 'Failed to save inquiry.' });
    }
  }

  const notifications = await attemptInquiryNotifications(inquiry);
  const notificationStatus = notifications.owner.status === 'sent' ? 'sent' : 'failed';
  const notificationError = notifications.owner.status === 'sent'
    ? null
    : notifications.owner.error || 'Owner notification failed.';

  await pool.query(
    `UPDATE inquiries
     SET notification_status = $2,
         notification_error = $3,
         last_notified_at = CASE WHEN $2 = 'sent' THEN NOW() ELSE last_notified_at END,
         updated_at = NOW()
     WHERE id = $1`,
    [inquiry.id, notificationStatus, notificationError]
  );

  await insertNotificationAttempt(pool, inquiry.id, 'emailjs-owner', notifications.owner);
  if (notifications.client.status !== 'skipped') {
    await insertNotificationAttempt(pool, inquiry.id, 'emailjs-autoreply', notifications.client);
  }

  await pool.query(
    `INSERT INTO inquiry_events (inquiry_id, event_type, new_status, metadata)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [
      inquiry.id,
      notifications.owner.status === 'sent' ? 'notification_sent' : 'notification_failed',
      inquiry.status,
      JSON.stringify({ owner: notifications.owner.status, client: notifications.client.status }),
    ]
  );

  const updated = await pool.query('SELECT * FROM inquiries WHERE id = $1', [inquiry.id]);

  return res.status(duplicate ? 200 : 201).json({
    inquiry: toInquiry(updated.rows[0]),
    duplicate,
    notification: notifications,
  });
});

adminRouter.get('/inquiries', requireAdmin, async (req, res) => {
  const pool = db.getPool();
  if (!pool) return dbUnavailable(res);

  const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

  const conditions = [];
  const params = [];

  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    const index = params.length;
    conditions.push(`(name ILIKE $${index} OR email ILIKE $${index} OR service ILIKE $${index} OR description ILIKE $${index})`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const countResult = await pool.query(`SELECT COUNT(*)::int AS count FROM inquiries ${where}`, params);
    const rowsResult = await pool.query(
      `SELECT * FROM inquiries ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return res.json({
      inquiries: rowsResult.rows.map(toInquiry),
      total: countResult.rows[0].count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Inquiry list failed:', error.message);
    return res.status(500).json({ error: 'Failed to load inquiries.' });
  }
});

adminRouter.get('/inquiries/:id', requireAdmin, async (req, res) => {
  const pool = db.getPool();
  if (!pool) return dbUnavailable(res);

  if (!UUID_RE.test(req.params.id)) {
    return res.status(400).json({ error: 'Invalid inquiry ID.' });
  }

  try {
    const inquiryResult = await pool.query('SELECT * FROM inquiries WHERE id = $1', [req.params.id]);
    if (inquiryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Inquiry not found.' });
    }

    const eventsResult = await pool.query(
      'SELECT * FROM inquiry_events WHERE inquiry_id = $1 ORDER BY created_at ASC',
      [req.params.id]
    );
    const attemptsResult = await pool.query(
      `SELECT * FROM notification_attempts
       WHERE target_type = 'inquiry' AND target_id = $1
       ORDER BY created_at ASC`,
      [req.params.id]
    );

    return res.json({
      inquiry: toInquiry(inquiryResult.rows[0]),
      events: eventsResult.rows,
      notificationAttempts: attemptsResult.rows,
    });
  } catch (error) {
    console.error('Inquiry detail failed:', error.message);
    return res.status(500).json({ error: 'Failed to load inquiry.' });
  }
});

adminRouter.patch('/inquiries/:id', requireAdmin, requireCsrf, async (req, res) => {
  const pool = db.getPool();
  if (!pool) return dbUnavailable(res);

  if (!UUID_RE.test(req.params.id)) {
    return res.status(400).json({ error: 'Invalid inquiry ID.' });
  }

  const status = typeof req.body?.status === 'string' ? req.body.status.trim() : undefined;
  const internalNotes = typeof req.body?.internalNotes === 'string' ? req.body.internalNotes : undefined;

  if (status && !['new', 'contacted', 'in_progress', 'completed', 'archived'].includes(status)) {
    return res.status(400).json({ error: 'Invalid inquiry status.' });
  }

  if (status === undefined && internalNotes === undefined) {
    return res.status(400).json({ error: 'No inquiry updates provided.' });
  }

  try {
    const existingResult = await pool.query('SELECT * FROM inquiries WHERE id = $1', [req.params.id]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Inquiry not found.' });
    }
    const existing = existingResult.rows[0];

    const updates = [];
    const params = [req.params.id];

    if (status !== undefined) {
      params.push(status);
      updates.push(`status = $${params.length}`);
    }
    if (internalNotes !== undefined) {
      params.push(internalNotes);
      updates.push(`internal_notes = $${params.length}`);
    }
    updates.push('updated_at = NOW()');

    const result = await pool.query(
      `UPDATE inquiries SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
      params
    );
    const inquiry = result.rows[0];

    if (status !== undefined && status !== existing.status) {
      await pool.query(
        `INSERT INTO inquiry_events (inquiry_id, event_type, old_status, new_status, metadata)
         VALUES ($1, 'status_changed', $2, $3, '{}'::jsonb)`,
        [inquiry.id, existing.status, status]
      );
    }

    if (internalNotes !== undefined && internalNotes !== existing.internal_notes) {
      await pool.query(
        `INSERT INTO inquiry_events (inquiry_id, event_type, new_status, metadata)
         VALUES ($1, 'note_updated', $2, $3::jsonb)`,
        [inquiry.id, inquiry.status, JSON.stringify({ noteLength: internalNotes.length })]
      );
    }

    await recordAdminAction({
      action: 'inquiry.updated',
      targetType: 'inquiry',
      targetId: inquiry.id,
      metadata: { status: inquiry.status, notesChanged: internalNotes !== undefined },
      ipAddress: req.ip,
    });

    return res.json({ inquiry: toInquiry(inquiry) });
  } catch (error) {
    console.error('Inquiry update failed:', error.message);
    return res.status(500).json({ error: 'Failed to update inquiry.' });
  }
});

adminRouter.post('/inquiries/:id/notify', requireAdmin, requireCsrf, async (req, res) => {
  const pool = db.getPool();
  if (!pool) return dbUnavailable(res);

  if (!UUID_RE.test(req.params.id)) {
    return res.status(400).json({ error: 'Invalid inquiry ID.' });
  }

  try {
    const inquiryResult = await pool.query('SELECT * FROM inquiries WHERE id = $1', [req.params.id]);
    if (inquiryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Inquiry not found.' });
    }
    const inquiry = toInquiry(inquiryResult.rows[0]);

    const notifications = await attemptInquiryNotifications(inquiry);
    const notificationStatus = notifications.owner.status === 'sent' ? 'sent' : 'failed';
    const notificationError = notifications.owner.status === 'sent'
      ? null
      : notifications.owner.error || 'Owner notification failed.';

    await pool.query(
      `UPDATE inquiries
       SET notification_status = $2,
           notification_error = $3,
           last_notified_at = CASE WHEN $2 = 'sent' THEN NOW() ELSE last_notified_at END,
           updated_at = NOW()
       WHERE id = $1`,
      [inquiry.id, notificationStatus, notificationError]
    );

    await insertNotificationAttempt(pool, inquiry.id, 'emailjs-owner', notifications.owner);
    if (notifications.client.status !== 'skipped') {
      await insertNotificationAttempt(pool, inquiry.id, 'emailjs-autoreply', notifications.client);
    }

    await pool.query(
      `INSERT INTO inquiry_events (inquiry_id, event_type, new_status, metadata)
       VALUES ($1, 'notification_retried', $2, $3::jsonb)`,
      [inquiry.id, inquiry.status, JSON.stringify({ owner: notifications.owner.status, client: notifications.client.status })]
    );

    await recordAdminAction({
      action: 'inquiry.notification_retried',
      targetType: 'inquiry',
      targetId: inquiry.id,
      metadata: { owner: notifications.owner.status, client: notifications.client.status },
      ipAddress: req.ip,
    });

    const updated = await pool.query('SELECT * FROM inquiries WHERE id = $1', [inquiry.id]);
    return res.json({
      inquiry: toInquiry(updated.rows[0]),
      notification: notifications,
    });
  } catch (error) {
    console.error('Inquiry notification retry failed:', error.message);
    return res.status(500).json({ error: 'Failed to retry notification.' });
  }
});

adminRouter.get('/overview', requireAdmin, async (req, res) => {
  const pool = db.getPool();
  if (!pool) return dbUnavailable(res);

  try {
    const inquiryCounts = await pool.query(`
      SELECT status, COUNT(*)::int AS count
      FROM inquiries
      GROUP BY status
    `);
    const contactCount = await pool.query('SELECT COUNT(*)::int AS count FROM contact_messages');
    const paymentCount = await pool.query('SELECT COUNT(*)::int AS count FROM payment_transactions');
    const webhookCount = await pool.query('SELECT COUNT(*)::int AS count FROM payment_webhook_events');
    const recentActivity = await pool.query(`
      SELECT id, created_at, action, target_type, target_id, metadata
      FROM admin_audit_log
      ORDER BY created_at DESC
      LIMIT 10
    `);

    const counts = Object.fromEntries(inquiryCounts.rows.map((row) => [row.status, row.count]));
    const totalInquiries = inquiryCounts.rows.reduce((sum, row) => sum + row.count, 0);

    return res.json({
      inquiries: {
        total: totalInquiries,
        new: counts.new || 0,
        contacted: counts.contacted || 0,
        inProgress: counts.in_progress || 0,
        completed: counts.completed || 0,
        archived: counts.archived || 0,
      },
      contactMessages: contactCount.rows[0].count,
      payments: paymentCount.rows[0].count,
      webhookEvents: webhookCount.rows[0].count,
      recentActivity: recentActivity.rows,
    });
  } catch (error) {
    console.error('Admin overview failed:', error.message);
    return res.status(500).json({ error: 'Failed to load overview.' });
  }
});

module.exports = {
  publicRouter,
  adminRouter,
};