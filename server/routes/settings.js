const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdmin } = require('../middleware/adminAuth');

router.get('/settings', requireAdmin, async (req, res) => {
  const pool = db.getPool();
  const databaseConfigured = db.isDatabaseConfigured();

  let databaseConnected = false;
  let migrationCount = 0;
  let databaseError = null;

  if (pool) {
    try {
      await pool.query('SELECT 1');
      databaseConnected = true;
      const result = await pool.query('SELECT COUNT(*)::int AS count FROM schema_migrations');
      migrationCount = result.rows[0]?.count || 0;
    } catch (error) {
      databaseError = 'Database connection or migration check failed.';
    }
  }

  return res.json({
    environment: process.env.NODE_ENV || 'development',
    database: {
      configured: databaseConfigured,
      connected: databaseConnected,
      migrationCount,
      error: databaseError,
    },
    integrations: {
      adminAuth: Boolean(process.env.ADMIN_PASSWORD_HASH && process.env.SESSION_SECRET),
      emailjs: Boolean(process.env.EMAILJS_SERVICE_ID || process.env.VITE_EMAILJS_SERVICE_ID),
      gemini: Boolean(process.env.GEMINI_API_KEY),
      lipana: Boolean(process.env.LIPANA_SECRET_KEY && process.env.LIPANA_WEBHOOK_SECRET),
      github: Boolean(process.env.GITHUB_TOKEN),
    },
    corsAllowedOrigins: [
      process.env.FRONTEND_URL,
      'https://pantane.is-a.dev',
      'https://www.pantane.is-a.dev',
      'http://localhost:3000',
      'http://localhost:5173',
    ].filter(Boolean),
  });
});

module.exports = router;