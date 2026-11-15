const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const axios = require('axios');
const bcrypt = require('bcryptjs');

const { createApp } = require('../app');
const db = require('../db');
const authRoute = require('../routes/auth');
const { enqueueNotification, processPendingNotifications } = require('../services/notificationOutbox');

let server;
let baseUrl;
let state;

function createFakePool() {
  state = {
    inquiries: [{
      id: '11111111-1111-4111-8111-111111111111',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      service: 'Websites & Landing Pages',
      description: 'A'.repeat(20),
      budget: 'Under KSh 20,000',
      timeline: 'As soon as possible',
      requirements: '',
      name: 'Test User',
      email: 'test@example.com',
      phone: null,
      business: null,
      status: 'new',
      internal_notes: '',
      notification_status: 'pending',
      notification_error: null,
      last_notified_at: null,
      submission_id: 'submission-ops',
    }],
    contacts: [],
    attempts: [],
    audit: [],
    outbox: [],
  };
  let idCounter = 1;
  function makeId() { return `00000000-0000-4000-7000-${String(idCounter++).padStart(12, '0')}`; }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  const client = {
    async query(sql, params = []) {
      return pool.query(sql, params);
    },
    release() {},
  };
  const pool = {
    connect: async () => client,
    async query(sql, params = []) {
      const normalized = sql.replace(/\s+/g, ' ').trim();

      if (/^SELECT 1$/i.test(normalized)) return { rows: [{ '?column?': 1 }] };
      if (/^SELECT COUNT\(\*\)::int AS count FROM schema_migrations/i.test(normalized)) return { rows: [{ count: 3 }] };
      if (/^SELECT \* FROM inquiries WHERE id =/i.test(normalized)) {
        const inquiry = state.inquiries.find((item) => item.id === params[0]);
        return { rows: inquiry ? [clone(inquiry)] : [] };
      }
      if (/^UPDATE inquiries SET/i.test(normalized)) {
        const inquiry = state.inquiries.find((item) => item.id === params[0]);
        if (inquiry) {
          inquiry.notification_status = params[1];
          inquiry.notification_error = params[2];
          if (params[1] === 'sent') inquiry.last_notified_at = new Date().toISOString();
          inquiry.updated_at = new Date().toISOString();
        }
        return { rows: inquiry ? [clone(inquiry)] : [] };
      }
      if (/^INSERT INTO inquiry_events/i.test(normalized)) {
        return { rows: [] };
      }
      if (/^INSERT INTO notification_attempts/i.test(normalized)) {
        state.attempts.push({ id: makeId(), created_at: new Date().toISOString(), params: [...params] });
        return { rows: [] };
      }
      if (/^INSERT INTO admin_audit_log/i.test(normalized)) {
        state.audit.push({ params: [...params] });
        return { rows: [] };
      }
      if (/^INSERT INTO notification_outbox/i.test(normalized)) {
        const row = {
          id: makeId(),
          created_at: new Date().toISOString(),
          target_type: params[0],
          target_id: params[1],
          channel: params[2],
          payload: JSON.parse(params[3]),
          status: 'pending',
          attempts: 0,
          max_attempts: 5,
        };
        state.outbox.push(row);
        return { rows: [clone(row)] };
      }
      if (/^SELECT \* FROM notification_outbox/i.test(normalized)) {
        const rows = state.outbox
          .filter((item) => item.status === 'pending' || item.status === 'failed')
          .filter((item) => item.attempts < item.max_attempts)
          .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
        return { rows: rows.map(clone) };
      }
      if (/^UPDATE notification_outbox SET status = 'processing'/i.test(normalized)) {
        const item = state.outbox.find((entry) => entry.id === params[0]);
        if (item) item.status = 'processing';
        return { rows: [] };
      }
      if (/^UPDATE notification_outbox SET status = \$2/i.test(normalized)) {
        const item = state.outbox.find((entry) => entry.id === params[0]);
        if (item) {
          item.status = params[1];
          item.attempts = params[2];
          item.last_error = params[3];
          item.next_attempt_at = params[4];
          if (params[1] === 'sent') item.processed_at = new Date().toISOString();
        }
        return { rows: [] };
      }
      if (/^SELECT id, created_at, actor, action, target_type, target_id, metadata FROM admin_audit_log/i.test(normalized)) {
        return { rows: [] };
      }
      if (/^SELECT COUNT\(\*\)::int AS count FROM admin_audit_log/i.test(normalized)) {
        return { rows: [{ count: 0 }] };
      }
      return { rows: [] };
    },
  };

  return pool;
}

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

function request(path, options = {}) {
  return fetch(`${baseUrl}${path}`, options);
}

async function login() {
  const res = await request('/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'test-password' }),
  });
  const body = await res.json();
  const cookie = res.headers.get('set-cookie').split(';')[0];
  return { cookie, csrfToken: body.csrfToken };
}

test.beforeEach(async () => {
  process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('test-password', 10);
  process.env.SESSION_SECRET = 'test-session-secret';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  db.getPool = () => createFakePool();
  axios.post = async () => ({ data: { status: 200, text: 'OK' } });
  authRoute.resetLoginRateLimit();
  await startServer();
});

test.afterEach(async () => {
  await stopServer();
  delete process.env.ADMIN_PASSWORD_HASH;
  delete process.env.SESSION_SECRET;
  delete process.env.DATABASE_URL;
});

test('admin activity endpoint requires authentication', async () => {
  const res = await request('/admin/activity');
  assert.equal(res.status, 401);
});

test('authenticated admin can load activity and settings', async () => {
  const { cookie } = await login();

  const activity = await request('/admin/activity', { headers: { Cookie: cookie } });
  assert.equal(activity.status, 200);

  const settings = await request('/admin/settings', { headers: { Cookie: cookie } });
  assert.equal(settings.status, 200);
  const body = await settings.json();
  assert.equal(body.database.configured, true);
  assert.equal(body.integrations.adminAuth, true);
});

test('notification outbox processes a queued inquiry notification', async () => {
  const pool = db.getPool();
  const item = await (require('../services/notificationOutbox').enqueueNotification)(pool, {
    targetType: 'inquiry',
    targetId: '11111111-1111-4111-8111-111111111111',
    channel: 'email',
    payload: { inquiryId: '11111111-1111-4111-8111-111111111111' },
  });

  const processed = await require('../services/notificationOutbox').processPendingNotifications(pool, 1);
  assert.deepEqual(processed, [item.id]);

  const outboxItem = state.outbox.find((entry) => entry.id === item.id);
  assert.equal(outboxItem.status, 'sent');
});