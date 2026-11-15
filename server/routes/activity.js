const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdmin } = require('../middleware/adminAuth');

function dbUnavailable(res) {
  return res.status(503).json({ error: 'Audit storage is not configured.' });
}

router.get('/activity', requireAdmin, async (req, res) => {
  const pool = db.getPool();
  if (!pool) return dbUnavailable(res);

  const action = typeof req.query.action === 'string' ? req.query.action.trim() : '';
  const targetType = typeof req.query.targetType === 'string' ? req.query.targetType.trim() : '';
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

  const params = [];
  const conditions = [];

  if (action) {
    params.push(action);
    conditions.push(`action = $${params.length}`);
  }
  if (targetType) {
    params.push(targetType);
    conditions.push(`target_type = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    const index = params.length;
    conditions.push(`(action ILIKE $${index} OR target_type ILIKE $${index} OR target_id ILIKE $${index})`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const countResult = await pool.query(`SELECT COUNT(*)::int AS count FROM admin_audit_log ${where}`, params);
    const rowsResult = await pool.query(
      `SELECT id, created_at, actor, action, target_type, target_id, metadata
       FROM admin_audit_log ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return res.json({
      events: rowsResult.rows,
      total: countResult.rows[0].count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Admin activity query failed:', error.message);
    return res.status(500).json({ error: 'Failed to load activity.' });
  }
});

module.exports = router;