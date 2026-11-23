const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const axios = require('axios');
const bcrypt = require('bcryptjs');

const { createApp } = require('../app');
const db = require('../db');
const authRoute = require('../routes/auth');

let server;
let baseUrl;
let state;

function createFakePool() {
  state = { inquiries: [], events: [], attempts: [], audit: [], outbox: [] };
  let idCounter = 1;

  function makeId() {
    return `00000000-0000-4000-8000-${String(idCounter++).padStart(12, '0')}`;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  const pool = {
    async query(sql, params = []) {
      const normalized = sql.replace(/\s+/g, ' ').trim();

      if (/^CREATE TABLE/i.test(normalized)) return { rows: [] };
      if (/^BEGIN$/i.test(normalized) || /^COMMIT$/i.test(normalized) || /^ROLLBACK$/i.test(normalized)) return { rows: [] };

      if (/^INSERT INTO inquiries/i.test(normalized)) {
        if (state.inquiries.some((item) => item.submission_id === params[9] && params[9])) {
          const error = new Error('duplicate key value violates unique constraint');
          error.code = '23505';
          throw error;
        }

        const inquiry = {
          id: makeId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          service: params[0],
          description: params[1],
          budget: params[2],
          timeline: params[3],
          requirements: params[4],
          name: params[5],
          email: params[6],
          phone: params[7],
          business: params[8],
          submission_id: params[9],
          status: 'new',
          internal_notes: '',
          notification_status: 'pending',
          notification_error: null,
          last_notified_at: null,
        };
        state.inquiries.push(inquiry);
        return { rows: [clone(inquiry)] };
      }

      if (/^SELECT \* FROM inquiries WHERE submission_id/i.test(normalized)) {
        const inquiry = state.inquiries.find((item) => item.submission_id === params[0]);
        return { rows: inquiry ? [clone(inquiry)] : [] };
      }

      if (/^SELECT \* FROM inquiries WHERE id =/i.test(normalized)) {
        const inquiry = state.inquiries.find((item) => item.id === params[0]);
        return { rows: inquiry ? [clone(inquiry)] : [] };
      }

      if (/^SELECT \* FROM inquiries/i.test(normalized)) {
        let rows = [...state.inquiries];
        if (/status = \$1/i.test(normalized)) {
          rows = rows.filter((item) => item.status === params[0]);
        }
        const searchParam = params.find((value) => typeof value === 'string' && value.startsWith('%') && value.endsWith('%'));
        if (searchParam) {
          const term = searchParam.slice(1, -1).toLowerCase();
          rows = rows.filter((item) =>
            [item.name, item.email, item.service, item.description].some((value) => String(value).toLowerCase().includes(term))
          );
        }
        rows.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
        const limit = params[params.length - 2] || rows.length;
        const offset = params[params.length - 1] || 0;
        return { rows: rows.slice(offset, offset + limit).map(clone) };
      }

      if (/^SELECT COUNT\(\*\)::int AS count FROM inquiries/i.test(normalized)) {
        let rows = [...state.inquiries];
        if (/status = \$1/i.test(normalized)) {
          rows = rows.filter((item) => item.status === params[0]);
        }
        return { rows: [{ count: rows.length }] };
      }

      if (/^UPDATE inquiries SET/i.test(normalized)) {
        const inquiry = state.inquiries.find((item) => item.id === params[0]);
        if (!inquiry) return { rows: [] };

        const statusMatch = normalized.match(/\bstatus = \$(\d+)/i);
        if (statusMatch) {
          inquiry.status = params[Number(statusMatch[1]) - 1];
        }
        const notesMatch = normalized.match(/internal_notes = \$(\d+)/i);
        if (notesMatch) {
          inquiry.internal_notes = params[Number(notesMatch[1]) - 1];
        }
        if (/notification_status = \$2/i.test(normalized)) {
          inquiry.notification_status = params[1];
          inquiry.notification_error = params[2];
          if (params[1] === 'sent') {
            inquiry.last_notified_at = new Date().toISOString();
          }
        }
        inquiry.updated_at = new Date().toISOString();
        return { rows: [clone(inquiry)] };
      }

      if (/^INSERT INTO inquiry_events/i.test(normalized)) {
        state.events.push({ id: makeId(), created_at: new Date().toISOString(), sql: normalized, params: [...params] });
        return { rows: [] };
      }

      if (/^SELECT \* FROM inquiry_events/i.test(normalized)) {
        const rows = state.events
          .filter((event) => event.params[0] === params[0])
          .map((event, index) => ({
            id: event.id,
            created_at: event.created_at,
            event_type: event.sql.includes('status_changed') ? 'status_changed' : event.sql.includes('notification_retried') ? 'notification_retried' : 'created',
          }));
        return { rows };
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
        };
        state.outbox.push(row);
        return { rows: [clone(row)] };
      }

      if (/^INSERT INTO notification_attempts/i.test(normalized)) {
        state.attempts.push({ id: makeId(), created_at: new Date().toISOString(), params: [...params] });
        return { rows: [] };
      }

      if (/^SELECT \* FROM notification_attempts/i.test(normalized)) {
        const rows = state.attempts
          .filter((attempt) => attempt.params[0] === params[0])
          .map((attempt) => ({
            id: attempt.id,
            created_at: attempt.created_at,
            channel: attempt.params[2],
            status: attempt.params[3],
            error: attempt.params[4] || null,
          }));
        return { rows };
      }

      if (/^SELECT status, COUNT\(\*\)::int AS count FROM inquiries/i.test(normalized)) {
        const counts = {};
        for (const inquiry of state.inquiries) {
          counts[inquiry.status] = (counts[inquiry.status] || 0) + 1;
        }
        return { rows: Object.entries(counts).map(([status, count]) => ({ status, count })) };
      }

      if (/^SELECT COUNT\(\*\)::int AS count FROM contact_messages/i.test(normalized)) {
        return { rows: [{ count: 0 }] };
      }

      if (/^SELECT COUNT\(\*\)::int AS count FROM payment_transactions/i.test(normalized)) {
        return { rows: [{ count: 0 }] };
      }

      if (/^SELECT COUNT\(\*\)::int AS count FROM payment_webhook_events/i.test(normalized)) {
        return { rows: [{ count: 0 }] };
      }

      if (/^INSERT INTO admin_audit_log/i.test(normalized)) {
        state.audit.push({ params: [...params] });
        return { rows: [] };
      }

      if (/^SELECT id, created_at, action, target_type, target_id, metadata FROM admin_audit_log/i.test(normalized)) {
        return { rows: [] };
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
    headers: { 'Origin': 'http://me.localhost:5173',  'Content-Type': 'application/json' },
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
  const pool = createFakePool();
  db.getPool = () => pool;
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

test('successful inquiry is persisted', async () => {
  const res = await request('/inquiries', {
    method: 'POST',
    headers: { 'Origin': 'http://me.localhost:5173',  'Content-Type': 'application/json' },
    body: JSON.stringify({
      service: 'Websites & Landing Pages',
      description: 'A'.repeat(20),
      budget: 'Under KSh 20,000',
      timeline: 'As soon as possible',
      name: 'Test User',
      email: 'test@example.com',
      submissionId: 'submission-1',
    }),
  });

  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.inquiry.status, 'new');
  assert.equal(state.inquiries.length, 1);
});

test('invalid inquiry is rejected', async () => {
  const res = await request('/inquiries', {
    method: 'POST',
    headers: { 'Origin': 'http://me.localhost:5173',  'Content-Type': 'application/json' },
    body: JSON.stringify({ service: 'Websites & Landing Pages', description: 'short' }),
  });

  assert.equal(res.status, 400);
  assert.equal(state.inquiries.length, 0);
});

test('duplicate submission does not create a second inquiry', async () => {
  const payload = {
    service: 'Websites & Landing Pages',
    description: 'A'.repeat(20),
    budget: 'Under KSh 20,000',
    timeline: 'As soon as possible',
    name: 'Test User',
    email: 'test@example.com',
    submissionId: 'submission-duplicate',
  };

  const first = await request('/inquiries', {
    method: 'POST',
    headers: { 'Origin': 'http://me.localhost:5173',  'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const second = await request('/inquiries', {
    method: 'POST',
    headers: { 'Origin': 'http://me.localhost:5173',  'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  assert.equal(first.status, 201);
  assert.equal(second.status, 200);
  const body = await second.json();
  assert.equal(body.duplicate, true);
  assert.equal(state.inquiries.length, 1);
});

test('notification failure does not remove a persisted inquiry', async () => {
  axios.post = async () => {
    throw new Error('EmailJS unavailable');
  };

  const res = await request('/inquiries', {
    method: 'POST',
    headers: { 'Origin': 'http://me.localhost:5173',  'Content-Type': 'application/json' },
    body: JSON.stringify({
      service: 'Websites & Landing Pages',
      description: 'A'.repeat(20),
      budget: 'Under KSh 20,000',
      timeline: 'As soon as possible',
      name: 'Test User',
      email: 'test@example.com',
      submissionId: 'submission-notification-failure',
    }),
  });

  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.notification.owner.status, 'failed');
  assert.equal(state.inquiries.length, 1);
  assert.equal(state.inquiries[0].notification_status, 'failed');
});

test('unauthenticated inquiry administration is rejected', async () => {
  const res = await request('/admin/inquiries');
  assert.equal(res.status, 401);
});

test('authenticated administrator can list and update an inquiry', async () => {
  const create = await request('/inquiries', {
    method: 'POST',
    headers: { 'Origin': 'http://me.localhost:5173',  'Content-Type': 'application/json' },
    body: JSON.stringify({
      service: 'Websites & Landing Pages',
      description: 'A'.repeat(20),
      budget: 'Under KSh 20,000',
      timeline: 'As soon as possible',
      name: 'Test User',
      email: 'test@example.com',
      submissionId: 'submission-admin',
    }),
  });
  const created = await create.json();

  const { cookie, csrfToken } = await login();

  const list = await request('/admin/inquiries', {
    headers: { 'Origin': 'http://me.localhost:5173',  Cookie: cookie },
  });
  assert.equal(list.status, 200);
  const listBody = await list.json();
  assert.equal(listBody.total, 1);

  const detail = await request(`/admin/inquiries/${created.inquiry.id}`, {
    headers: { 'Origin': 'http://me.localhost:5173',  Cookie: cookie },
  });
  assert.equal(detail.status, 200);

  const update = await request(`/admin/inquiries/${created.inquiry.id}`, {
    method: 'PATCH',
    headers: { 'Origin': 'http://me.localhost:5173', 
      'Content-Type': 'application/json',
      Cookie: cookie,
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({ status: 'contacted', internalNotes: 'Called the client.' }),
  });
  assert.equal(update.status, 200);
  const updated = await update.json();
  assert.equal(updated.inquiry.status, 'contacted');
  assert.equal(updated.inquiry.internalNotes, 'Called the client.');
});

test('inquiry status update requires CSRF token', async () => {
  const create = await request('/inquiries', {
    method: 'POST',
    headers: { 'Origin': 'http://me.localhost:5173',  'Content-Type': 'application/json' },
    body: JSON.stringify({
      service: 'Websites & Landing Pages',
      description: 'A'.repeat(20),
      budget: 'Under KSh 20,000',
      timeline: 'As soon as possible',
      name: 'Test User',
      email: 'test@example.com',
      submissionId: 'submission-csrf',
    }),
  });
  const created = await create.json();

  const { cookie } = await login();

  const res = await request(`/admin/inquiries/${created.inquiry.id}`, {
    method: 'PATCH',
    headers: { 'Origin': 'http://me.localhost:5173', 
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({ status: 'contacted' }),
  });

  assert.equal(res.status, 403);
});

test('notification retry records an additional attempt', async () => {
  const create = await request('/inquiries', {
    method: 'POST',
    headers: { 'Origin': 'http://me.localhost:5173',  'Content-Type': 'application/json' },
    body: JSON.stringify({
      service: 'Websites & Landing Pages',
      description: 'A'.repeat(20),
      budget: 'Under KSh 20,000',
      timeline: 'As soon as possible',
      name: 'Test User',
      email: 'test@example.com',
      submissionId: 'submission-retry',
    }),
  });
  const created = await create.json();

  const { cookie, csrfToken } = await login();

  const retry = await request(`/admin/inquiries/${created.inquiry.id}/notify`, {
    method: 'POST',
    headers: { 'Origin': 'http://me.localhost:5173', 
      Cookie: cookie,
      'X-CSRF-Token': csrfToken,
    },
  });

  assert.equal(retry.status, 200);
  const body = await retry.json();
  assert.equal(body.notification.owner.status, 'sent');

  const detail = await request(`/admin/inquiries/${created.inquiry.id}`, {
    headers: { 'Origin': 'http://me.localhost:5173',  Cookie: cookie },
  });
  const detailBody = await detail.json();
  assert.ok(detailBody.notificationAttempts.length >= 2);
});

test('overview statistics reflect persisted inquiries', async () => {
  await request('/inquiries', {
    method: 'POST',
    headers: { 'Origin': 'http://me.localhost:5173',  'Content-Type': 'application/json' },
    body: JSON.stringify({
      service: 'Websites & Landing Pages',
      description: 'A'.repeat(20),
      budget: 'Under KSh 20,000',
      timeline: 'As soon as possible',
      name: 'Test User',
      email: 'test@example.com',
      submissionId: 'submission-overview',
    }),
  });

  const { cookie } = await login();
  const res = await request('/admin/overview', {
    headers: { 'Origin': 'http://me.localhost:5173',  Cookie: cookie },
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.inquiries.total, 1);
  assert.equal(body.inquiries.new, 1);
});