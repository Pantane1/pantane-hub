const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const axios = require('axios');
const bcrypt = require('bcryptjs');

const { createApp } = require('../app');
const authRoute = require('../routes/auth');
const { resetSessions } = require('../middleware/adminAuth');

let server;
let baseUrl;

async function startServer() {
  const app = createApp();
  server = http.createServer(app);
  await new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
    server.on('error', reject);
  });
}

async function stopServer() {
  if (!server) return;
  await new Promise((resolve) => server.close(resolve));
  server = null;
}

function cookieFrom(response) {
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) return '';
  return setCookie.split(';')[0];
}

function request(path, options = {}) {
  return fetch(`${baseUrl}${path}`, options);
}

test.beforeEach(async () => {
  process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('test-password', 10);
  process.env.SESSION_SECRET = 'test-session-secret';
  process.env.GITHUB_TOKEN = 'test-github-token';
  resetSessions();
  authRoute.resetLoginRateLimit();
  axios.create = () => ({
    get: async () => ({
      data: {
        content: Buffer.from(JSON.stringify([])).toString('base64'),
        sha: 'test-sha',
      },
    }),
    put: async () => ({
      data: { commit: { sha: 'test-commit' } },
    }),
  });
  await startServer();
});

test.afterEach(async () => {
  await stopServer();
  delete process.env.ADMIN_PASSWORD_HASH;
  delete process.env.SESSION_SECRET;
  delete process.env.GITHUB_TOKEN;
});

test('successful login creates a secure session', async () => {
  const res = await request('/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'test-password' }),
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.authenticated, true);
  assert.equal(typeof body.csrfToken, 'string');

  const cookie = res.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=/i);
  assert.match(cookie, /Max-Age=/i);
});

test('incorrect password is rejected with a generic error', async () => {
  const res = await request('/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'wrong-password' }),
  });

  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.error, 'Invalid credentials.');
});

test('missing password is rejected', async () => {
  const res = await request('/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  assert.equal(res.status, 400);
});

test('invalid request body is rejected', async () => {
  const res = await fetch(`${baseUrl}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: 'not-json',
  });

  assert.equal(res.status, 400);
});

test('valid session can be verified', async () => {
  const login = await request('/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'test-password' }),
  });
  const cookie = cookieFrom(login);

  const res = await request('/admin/session', {
    headers: { Cookie: cookie },
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.authenticated, true);
  assert.equal(typeof body.csrfToken, 'string');
});

test('invalid session is rejected', async () => {
  const res = await request('/admin/session');
  assert.equal(res.status, 401);
});

test('logout invalidates the session', async () => {
  const login = await request('/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'test-password' }),
  });
  const cookie = cookieFrom(login);
  const csrfToken = (await login.json()).csrfToken;

  const logout = await request('/admin/logout', {
    method: 'POST',
    headers: { Cookie: cookie, 'X-CSRF-Token': csrfToken },
  });
  assert.equal(logout.status, 200);

  const session = await request('/admin/session', {
    headers: { Cookie: cookie },
  });
  assert.equal(session.status, 401);
});

test('unauthenticated Journal read is rejected', async () => {
  const res = await request('/admin/journal');
  assert.equal(res.status, 401);
});

test('unauthenticated Journal write is rejected', async () => {
  const res = await request('/admin/journal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ posts: [], sha: 'x' }),
  });
  assert.equal(res.status, 401);
});

test('unauthenticated Sharp write is rejected', async () => {
  const res = await request('/admin/sharp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deals: [], sha: 'x' }),
  });
  assert.equal(res.status, 401);
});

test('legacy bearer password authentication is rejected', async () => {
  const res = await request('/admin/journal', {
    headers: { Authorization: 'Bearer old-plaintext-password' },
  });
  assert.equal(res.status, 401);
});

test('authenticated administrator can read Journal content', async () => {
  const login = await request('/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'test-password' }),
  });
  const cookie = cookieFrom(login);

  const res = await request('/admin/journal', {
    headers: { Cookie: cookie },
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body.posts));
});

test('authenticated administrator can write Journal content with CSRF token', async () => {
  const login = await request('/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'test-password' }),
  });
  const cookie = cookieFrom(login);
  const csrfToken = (await login.clone().json()).csrfToken;

  const res = await request('/admin/journal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({ posts: [], sha: 'test-sha', message: 'test' }),
  });

  assert.equal(res.status, 200);
});

test('authenticated write without CSRF token is rejected', async () => {
  const login = await request('/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'test-password' }),
  });
  const cookie = cookieFrom(login);

  const res = await request('/admin/journal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({ posts: [], sha: 'test-sha' }),
  });

  assert.equal(res.status, 403);
});

test('login is rate limited after repeated failures', async () => {
  for (let i = 0; i < 5; i += 1) {
    const res = await request('/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'wrong-password' }),
    });
    assert.equal(res.status, 401);
  }

  const limited = await request('/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'wrong-password' }),
  });
  assert.equal(limited.status, 429);
});

test('public health endpoint remains accessible', async () => {
  const res = await request('/');
  assert.equal(res.status, 200);
});