const express = require('express');
const { createRateLimiter } = require('../middleware/rateLimit');
const {
  requireAdmin,
  requireCsrf,
  getSession,
  createSession,
  destroySession,
  setSessionCookie,
  clearSessionCookie,
  verifyPassword,
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

  const hashConfigured = Boolean(process.env.ADMIN_PASSWORD_HASH);
  const valid = hashConfigured ? await verifyPassword(password) : false;

  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const session = createSession();
  setSessionCookie(res, req, session.id);
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

router.post('/logout', requireAdmin, requireCsrf, (req, res) => {
  destroySession(req.adminSession.id);
  clearSessionCookie(res, req);
  return res.json({ authenticated: false });
});

router.resetLoginRateLimit = loginRateLimiter.reset;
module.exports = router;
module.exports.resetLoginRateLimit = loginRateLimiter.reset;