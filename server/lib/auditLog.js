const db = require('../db');

async function recordAdminAction({ action, targetType, targetId, metadata, ipAddress }) {
  const pool = db.getPool();
  if (!pool) return;

  try {
    await pool.query(
      `INSERT INTO admin_audit_log (action, target_type, target_id, metadata, ip_address)
       VALUES ($1, $2, $3, $4::jsonb, $5)`,
      [action, targetType || null, targetId ? String(targetId) : null, JSON.stringify(metadata || {}), ipAddress || null]
    );
  } catch (error) {
    console.error('Failed to record admin audit event:', error.message);
  }
}

module.exports = { recordAdminAction };