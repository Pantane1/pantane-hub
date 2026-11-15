const { getPool } = require('../db');
const { attemptInquiryNotifications } = require('./inquiryNotifications');
const { attemptContactNotifications } = require('./contactNotifications');

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

async function enqueueNotification(client, { targetType, targetId, channel, payload }) {
  const result = await client.query(
    `INSERT INTO notification_outbox (target_type, target_id, channel, payload, status, next_attempt_at)
     VALUES ($1, $2, $3, $4::jsonb, 'pending', NOW())
     ON CONFLICT (target_type, target_id, channel) DO UPDATE SET
       status = 'pending',
       attempts = 0,
       next_attempt_at = NOW(),
       last_error = NULL,
       updated_at = NOW()
     RETURNING *`,
    [targetType, String(targetId), channel, JSON.stringify(payload || {})]
  );
  return result.rows[0];
}

async function claimNextOutboxItem(pool) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `SELECT *
       FROM notification_outbox
       WHERE status IN ('pending', 'failed')
         AND attempts < max_attempts
         AND next_attempt_at <= NOW()
       ORDER BY created_at ASC
       LIMIT 1
       FOR UPDATE SKIP LOCKED`
    );
    if (result.rows.length === 0) {
      await client.query('COMMIT');
      return null;
    }
    const item = result.rows[0];
    await client.query(
      `UPDATE notification_outbox
       SET status = 'processing', locked_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [item.id]
    );
    await client.query('COMMIT');
    return item;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function markOutboxResult(pool, itemId, resultStatus, attempts, error, nextAttemptAt) {
  await pool.query(
    `UPDATE notification_outbox
     SET status = $2,
         attempts = $3,
         last_error = $4,
         next_attempt_at = $5,
         processed_at = CASE WHEN $2 = 'sent' THEN NOW() ELSE processed_at END,
         updated_at = NOW()
     WHERE id = $1`,
    [itemId, resultStatus, attempts, error || null, nextAttemptAt]
  );
}

async function processOutboxItem(pool, item) {
  const attempts = item.attempts + 1;
  try {
    if (item.target_type === 'inquiry') {
      const inquiryResult = await pool.query('SELECT * FROM inquiries WHERE id = $1', [item.target_id]);
      if (inquiryResult.rows.length === 0) {
        throw new Error('Inquiry not found.');
      }
      const inquiry = toInquiry(inquiryResult.rows[0]);
      const notifications = await attemptInquiryNotifications(inquiry);
      const notificationStatus = notifications.owner.status === 'sent' ? 'sent' : 'failed';
      const notificationError = notifications.owner.status === 'sent' ? null : notifications.owner.error || 'Owner notification failed.';

      await pool.query(
        `UPDATE inquiries
         SET notification_status = $2,
             notification_error = $3,
             last_notified_at = CASE WHEN $2 = 'sent' THEN NOW() ELSE last_notified_at END,
             updated_at = NOW()
         WHERE id = $1`,
        [inquiry.id, notificationStatus, notificationError]
      );
      await pool.query(
        `INSERT INTO notification_attempts (target_type, target_id, channel, status, error, attempted_at)
         VALUES ('inquiry', $1, 'emailjs-owner', $2, $3, NOW())`,
        [inquiry.id, notifications.owner.status, notifications.owner.error || null]
      );
      if (notifications.client.status !== 'skipped') {
        await pool.query(
          `INSERT INTO notification_attempts (target_type, target_id, channel, status, error, attempted_at)
           VALUES ('inquiry', $1, 'emailjs-autoreply', $2, $3, NOW())`,
          [inquiry.id, notifications.client.status, notifications.client.error || null]
        );
      }
      await pool.query(
        `INSERT INTO inquiry_events (inquiry_id, event_type, new_status, metadata)
         VALUES ($1, 'notification_processed', $2, $3::jsonb)`,
        [inquiry.id, inquiry.status, JSON.stringify({ owner: notifications.owner.status, client: notifications.client.status })]
      );

      if (notifications.owner.status === 'sent') {
        await markOutboxResult(pool, item.id, 'sent', attempts, null, new Date().toISOString());
      } else {
        const nextAttemptAt = new Date(Date.now() + attempts * 60 * 1000).toISOString();
        await markOutboxResult(pool, item.id, 'failed', attempts, notifications.owner.error || 'Owner notification failed.', nextAttemptAt);
      }
      return;
    }

    if (item.target_type === 'contact_message') {
      const messageResult = await pool.query('SELECT * FROM contact_messages WHERE id = $1', [item.target_id]);
      if (messageResult.rows.length === 0) {
        throw new Error('Contact message not found.');
      }
      const message = messageResult.rows[0];
      const { attemptContactNotifications } = require('./contactNotifications');
      const notifications = await attemptContactNotifications(message);

      const notificationStatus = notifications.owner.status === 'sent' ? 'sent' : 'failed';
      const notificationError = notifications.owner.status === 'sent' ? null : notifications.owner.error || 'Owner notification failed.';

      await pool.query(
        `UPDATE contact_messages
         SET notification_status = $2,
             notification_error = $3,
             last_notified_at = CASE WHEN $2 = 'sent' THEN NOW() ELSE last_notified_at END
         WHERE id = $1`,
        [message.id, notificationStatus, notificationError]
      );
      await pool.query(
        `INSERT INTO notification_attempts (target_type, target_id, channel, status, error, attempted_at)
         VALUES ('contact_message', $1, 'emailjs-owner', $2, $3, NOW())`,
        [message.id, notifications.owner.status, notifications.owner.error || null]
      );
      if (notifications.client.status !== 'skipped') {
        await pool.query(
          `INSERT INTO notification_attempts (target_type, target_id, channel, status, error, attempted_at)
           VALUES ('contact_message', $1, 'emailjs-autoreply', $2, $3, NOW())`,
          [message.id, notifications.client.status, notifications.client.error || null]
        );
      }

      if (notifications.owner.status === 'sent') {
        await markOutboxResult(pool, item.id, 'sent', attempts, null, new Date().toISOString());
      } else {
        const nextAttemptAt = new Date(Date.now() + attempts * 60 * 1000).toISOString();
        await markOutboxResult(pool, item.id, 'failed', attempts, notifications.owner.error || 'Owner notification failed.', nextAttemptAt);
      }
      return;
    }

    throw new Error(`Unsupported outbox target type: ${item.target_type}`);
  } catch (error) {
    const nextAttemptAt = new Date(Date.now() + attempts * 60 * 1000).toISOString();
    await markOutboxResult(pool, item.id, 'failed', attempts, String(error.message).slice(0, 500), nextAttemptAt).catch(() => {});
    throw error;
  }
}

async function processPendingNotifications(pool = getPool(), limit = 10) {
  if (!pool) return [];
  const processed = [];
  for (let i = 0; i < limit; i += 1) {
    const item = await claimNextOutboxItem(pool);
    if (!item) break;
    try {
      await processOutboxItem(pool, item);
      processed.push(item.id);
    } catch (error) {
      console.error('Notification outbox processing failed:', error.message);
    }
  }
  return processed;
}

let workerTimer = null;

function startNotificationWorker() {
  const pool = getPool();
  if (!pool || workerTimer) return;
  processPendingNotifications(pool).catch((error) => console.error('Notification worker startup failed:', error.message));
  workerTimer = setInterval(() => {
    processPendingNotifications(pool).catch((error) => console.error('Notification worker failed:', error.message));
  }, 30000);
  if (typeof workerTimer.unref === 'function') workerTimer.unref();
}

function stopNotificationWorker() {
  if (workerTimer) {
    clearInterval(workerTimer);
    workerTimer = null;
  }
}

async function enqueueNotification(pool, options) {
  return enqueueNotificationInternal(pool, options);
}

async function enqueueNotificationInternal(pool, { targetType, targetId, channel, payload }) {
  const result = await pool.query(
    `INSERT INTO notification_outbox (target_type, target_id, channel, payload, status, next_attempt_at)
     VALUES ($1, $2, $3, $4::jsonb, 'pending', NOW())
     ON CONFLICT (target_type, target_id, channel) DO UPDATE SET
       status = 'pending',
       attempts = 0,
       next_attempt_at = NOW(),
       last_error = NULL,
       updated_at = NOW()
     RETURNING *`,
    [targetType, String(targetId), channel, JSON.stringify(payload || {})]
  );
  return result.rows[0];
}

async function retryNotification(pool, targetType, targetId, channel) {
  const item = await enqueueNotification(pool, { targetType, targetId, channel, payload: {} });
  await processOutboxItem(pool, item);
  return item;
}

module.exports = {
  enqueueNotification,
  processOutboxItem,
  processPendingNotifications,
  startNotificationWorker,
  stopNotificationWorker,
  retryNotification,
};