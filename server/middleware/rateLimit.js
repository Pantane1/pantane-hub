/**
 * Small in-memory fixed-window rate limiter.
 *
 * This is intentionally dependency-free. It is suitable for a single Render
 * instance; for multi-instance deployments, replace it with a shared store.
 */
function createRateLimiter({ windowMs, max }) {
  const hits = new Map();

  function middleware(req, res, next) {
    const key = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    const cutoff = now - windowMs;
    const recent = (hits.get(key) || []).filter((timestamp) => timestamp > cutoff);

    if (recent.length >= max) {
      res.status(429).json({ error: 'Too many requests. Please try again later.' });
      return;
    }

    recent.push(now);
    hits.set(key, recent);
    next();
  }

  function reset() {
    hits.clear();
  }

  return { middleware, reset };
}

module.exports = { createRateLimiter };