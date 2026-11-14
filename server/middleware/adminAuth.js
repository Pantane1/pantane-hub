const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const SESSION_COOKIE = 'pantane_admin_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

const sessions = new Map();

function getSessionSecret() {
  if (process.env.SESSION_SECRET) {
    return process.env.SESSION_SECRET;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET is required in production.');
  }
  console.warn('SESSION_SECRET is not set; using an ephemeral development secret.');
  return crypto.randomBytes(32).toString('hex');
}

const SESSION_SECRET = getSessionSecret();

function signSessionId(sessionId) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(sessionId).digest('hex');
}

function createSignedSessionValue(sessionId) {
  return `${sessionId}.${signSessionId(sessionId)}`;
}

function verifySignedSessionValue(value) {
  if (typeof value !== 'string') return null;
  const parts = value.split('.');
  if (parts.length !== 2) return null;
  const [sessionId, signature] = parts;
  if (!sessionId || !signature) return null;

  const expected = signSessionId(sessionId);
  const signatureBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null;
  return sessionId;
}

function parseCookies(req) {
  const cookies = {};
  const header = req.headers.cookie;
  if (!header) return cookies;

  for (const part of header.split(';')) {
    const [rawName, ...rawValue] = part.trim().split('=');
    if (!rawName) continue;
    try {
      cookies[rawName] = decodeURIComponent(rawValue.join('='));
    } catch (error) {
      cookies[rawName] = rawValue.join('=');
    }
  }
  return cookies;
}

function getSession(req) {
  const cookies = parseCookies(req);
  const sessionId = verifySignedSessionValue(cookies[SESSION_COOKIE]);
  if (!sessionId) return null;

  const session = sessions.get(sessionId);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    sessions.delete(sessionId);
    return null;
  }

  session.expiresAt = Date.now() + SESSION_TTL_MS;
  return session;
}

function createSession() {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const csrfToken = crypto.randomBytes(32).toString('hex');
  const session = {
    id: sessionId,
    csrfToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  sessions.set(sessionId, session);
  return session;
}

function destroySession(sessionId) {
  if (sessionId) sessions.delete(sessionId);
}

function isSecureRequest(req) {
  return (
    process.env.NODE_ENV === 'production' ||
    req.secure === true ||
    req.headers['x-forwarded-proto'] === 'https'
  );
}

function cookieAttributes(req, maxAgeMs) {
  const attributes = [
    'Path=/',
    'HttpOnly',
    `SameSite=${isSecureRequest(req) ? 'None' : 'Lax'}`,
    `Max-Age=${Math.floor(maxAgeMs / 1000)}`,
  ];
  if (isSecureRequest(req)) attributes.push('Secure');
  return attributes.join('; ');
}

function setSessionCookie(res, req, sessionId) {
  const value = createSignedSessionValue(sessionId);
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${encodeURIComponent(value)}; ${cookieAttributes(req, SESSION_TTL_MS)}`
  );
}

function clearSessionCookie(res, req) {
  const attributes = [
    'Path=/',
    'HttpOnly',
    `SameSite=${isSecureRequest(req) ? 'None' : 'Lax'}`,
    'Max-Age=0',
  ];
  if (isSecureRequest(req)) attributes.push('Secure');
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; ${attributes.join('; ')}`);
}

function requireAdmin(req, res, next) {
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  req.adminSession = session;
  next();
}

function requireCsrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const session = req.adminSession || getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const suppliedToken = req.headers['x-csrf-token'];
  if (
    typeof suppliedToken !== 'string' ||
    suppliedToken.length !== session.csrfToken.length ||
    !crypto.timingSafeEqual(Buffer.from(suppliedToken), Buffer.from(session.csrfToken))
  ) {
    return res.status(403).json({ error: 'Invalid CSRF token.' });
  }

  req.adminSession = session;
  next();
}

function resetSessions() {
  sessions.clear();
}

async function verifyPassword(password) {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) return null;
  return bcrypt.compare(password, hash);
}

module.exports = {
  SESSION_COOKIE,
  SESSION_TTL_MS,
  requireAdmin,
  requireCsrf,
  getSession,
  createSession,
  destroySession,
  setSessionCookie,
  clearSessionCookie,
  resetSessions,
  verifyPassword,
};