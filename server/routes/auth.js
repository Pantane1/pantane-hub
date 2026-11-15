const express = require('express');
const { createRateLimiter } = require('../middleware/rateLimit');
const { recordAdminAction } = require('../lib/auditLog');
const {
  requireAdmin,
  requireCsrf,
  getSession,
  createSession,
  destroySession,
  setSessionCookie,
  clearSessionCookie,
  verifyPassword,
  isAdminPasswordConfigured,
  getAdminPasswordHashDiagnostics,
} = require('../middleware/adminAuth');

const router = express.Router();

const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
});

router.post('/login', loginRateLimiter.middleware, async (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Invalid request body.' });
  }

  const { password } = req.body;
  if (typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'Password is required.' });
  }

  const hashConfigured = isAdminPasswordConfigured();
  const valid = hashConfigured ? await verifyPassword(password) : false;

  if (!valid) {
    console.warn('Admin login failed.', getAdminPasswordHashDiagnostics());
    await recordAdminAction({
      action: 'admin.login_failed',
      targetType: 'admin_session',
      targetId: null,
      metadata: getAdminPasswordHashDiagnostics(),
      ipAddress: req.ip,
    });
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const session = createSession();
  setSessionCookie(res, req, session.id);
  await recordAdminAction({
    action: 'admin.login',
    targetType: 'admin_session',
    targetId: session.id,
    metadata: { csrfIssued: true },
    ipAddress: req.ip,
  });
  return res.json({
    authenticated: true,
    csrfToken: session.csrfToken,
  });
});

router.get('/session', (req, res) => {
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ authenticated: false });
  }
  return res.json({
    authenticated: true,
    csrfToken: session.csrfToken,
  });
});

router.post('/logout', requireAdmin, requireCsrf, async (req, res) => {
  const sessionId = req.adminSession.id;
  destroySession(sessionId);
  await recordAdminAction({
    action: 'admin.logout',
    targetType: 'admin_session',
    targetId: sessionId,
    metadata: {},
    ipAddress: req.ip,
  });
  clearSessionCookie(res, req);
  return res.json({ authenticated: false });
});

router.get('/auth-diagnostics', (req, res) => {
  return res.json(getAdminPasswordHashDiagnostics());
});

router.resetLoginRateLimit = loginRateLimiter.reset;
module.exports = router;
module.exports.resetLoginRateLimit = loginRateLimiter.reset;