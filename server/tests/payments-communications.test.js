const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const axios = require('axios');
const bcrypt = require('bcryptjs');

Object.defineProperty(require('@lipana/sdk'), 'Lipana', {
  value: class {
    constructor() {}
    webhooks = {
      verify: (payload, signature, secret) => {
        console.log('MOCK_VERIFY', { signature, secret });
        return signature === 'valid-signature' && Boolean(secret);
      },
    };
  },
  writable: true,
  configurable: true,
});

const { createApp } = require('../app');
const db = require('../db');
const authRoute = require('../routes/auth');

let server;
let baseUrl;
let state;

function createFakePool() {
  state = {
    transactions: [],
    webhookEvents: [],
    contacts: [],
    attempts: [],
    audit: [],
    outbox: [],
  };
  let idCounter = 1;
  function makeId() { return `00000000-0000-4000-9000-${String(idCounter++).padStart(12, '0')}`; }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  const pool = {
    async query(sql, params = []) {
      const normalized = sql.replace(/\s+/g, ' ').trim();

      if (/^INSERT INTO payment_webhook_events/i.test(normalized)) {
        if (state.webhookEvents.some((event) => event.dedupe_key === params[3])) {
          const error = new Error('duplicate key');
          error.code = '23505';
          throw error;
        }
        state.webhookEvents.push({
          id: makeId(),
          received_at: new Date().toISOString(),
          processed_at: null,
          provider: params[0],
          event_type: params[1],
          provider_reference: params[2],
          dedupe_key: params[3],
          signature_valid: params[4],
          processing_status: params[5],
          payload: JSON.parse(params[6]),
          error: null,
        });
        return { rows: [] };
      }

      if (/^SELECT processing_status FROM payment_webhook_events WHERE dedupe_key/i.test(normalized)) {
        const event = state.webhookEvents.find((item) => item.dedupe_key === params[0]);
        return { rows: event ? [{ processing_status: event.processing_status }] : [] };
      }

      if (/^UPDATE payment_webhook_events SET processing_status = 'failed'/i.test(normalized)) {
        const event = state.webhookEvents.find((item) => item.dedupe_key === params[0]);
        if (event) {
          event.processing_status = 'failed';
          event.processed_at = new Date().toISOString();
          event.error = params[1];
        }
        return { rows: [] };
      }

      if (/^UPDATE payment_webhook_events SET processing_status = 'processed'/i.test(normalized)) {
        const event = state.webhookEvents.find((item) => item.dedupe_key === params[0]);
        if (event) {
          event.processing_status = 'processed';
          event.processed_at = new Date().toISOString();
        }
        return { rows: [] };
      }

      if (/^INSERT INTO payment_transactions/i.test(normalized)) {
        const existing = state.transactions.find((item) => item.provider === params[0] && item.provider_reference === params[1]);
        if (existing) {
          existing.status = params[4];
          existing.amount = params[2] === null ? existing.amount : params[2];
          existing.updated_at = new Date().toISOString();
          return { rows: [] };
        }
        state.transactions.push({
          id: makeId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          provider: params[0],
          provider_reference: params[1],
          amount: params[2],
          currency: params[3],
          status: params[4],
          payer_phone: params[5],
          metadata: JSON.parse(params[6]),
        });
        return { rows: [] };
      }

      if (/^SELECT id, created_at, updated_at, provider, provider_reference, amount, currency, status FROM payment_transactions/i.test(normalized)) {
        let rows = [...state.transactions];
        if (/status = \$1/i.test(normalized)) rows = rows.filter((item) => item.status === params[0]);
        if (/provider = \$1/i.test(normalized) || /provider = \$\d/i.test(normalized)) {
          const providerIndex = normalized.includes('status = $1') ? 1 : 0;
          rows = rows.filter((item) => item.provider === params[providerIndex]);
        }
        if (/provider ILIKE/i.test(normalized)) {
          const term = String(params.find((value) => typeof value === 'string' && value.includes('%')) || '').replace(/%/g, '').toLowerCase();
          rows = rows.filter((item) => item.provider.toLowerCase().includes(term) || item.provider_reference.toLowerCase().includes(term) || item.status.toLowerCase().includes(term));
        }
        rows.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
        const limit = params[params.length - 2] || rows.length;
        const offset = params[params.length - 1] || 0;
        return { rows: rows.slice(offset, offset + limit).map((item) => ({ ...item })) };
      }

      if (/^SELECT COUNT\(\*\)::int AS count FROM payment_transactions/i.test(normalized)) {
        let rows = [...state.transactions];
        if (/status = \$1/i.test(normalized)) rows = rows.filter((item) => item.status === params[0]);
        if (/provider = \$\d/i.test(normalized)) {
          const providerIndex = /status = \$1/i.test(normalized) ? 1 : 0;
          rows = rows.filter((item) => item.provider === params[providerIndex]);
        }
        return { rows: [{ count: rows.length }] };
      }

      if (/^SELECT id, created_at, updated_at, provider, provider_reference, amount, currency, status FROM payment_transactions WHERE id/i.test(normalized)) {
        const transaction = state.transactions.find((item) => item.id === params[0]);
        return { rows: transaction ? [{ ...transaction }] : [] };
      }

      if (/^SELECT id, received_at, processed_at, provider, event_type, provider_reference, signature_valid, processing_status, error FROM payment_webhook_events WHERE provider_reference/i.test(normalized)) {
        const rows = state.webhookEvents.filter((item) => item.provider_reference === params[0]).map((item) => ({ ...item }));
        return { rows };
      }

      if (/^INSERT INTO contact_messages/i.test(normalized)) {
        const message = {
          id: makeId(),
          created_at: new Date().toISOString(),
          name: params[0],
          email: params[1],
          message: params[2],
          notification_status: 'pending',
          notification_error: null,
          last_notified_at: null,
        };
        state.contacts.push(message);
        return { rows: [{ ...message }] };
      }

      if (/^SELECT \* FROM contact_messages WHERE id/i.test(normalized)) {
        const message = state.contacts.find((item) => item.id === params[0]);
        return { rows: message ? [{ ...message }] : [] };
      }

      if (/^SELECT \* FROM contact_messages/i.test(normalized)) {
        let rows = [...state.contacts];
        if (params.some((value) => typeof value === 'string' && value.includes('%'))) {
          const term = params.find((value) => typeof value === 'string' && value.includes('%')).replace(/%/g, '').toLowerCase();
          rows = rows.filter((item) => [item.name, item.email, item.message].some((value) => String(value).toLowerCase().includes(term)));
        }
        rows.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
        const limit = params[params.length - 2] || rows.length;
        const offset = params[params.length - 1] || 0;
        return { rows: rows.slice(offset, offset + limit).map((item) => ({ ...item })) };
      }

      if (/^SELECT COUNT\(\*\)::int AS count FROM contact_messages/i.test(normalized)) {
        return { rows: [{ count: state.contacts.length }] };
      }

      if (/^UPDATE contact_messages SET notification_status/i.test(normalized)) {
        const message = state.contacts.find((item) => item.id === params[0]);
        if (message) {
          message.notification_status = params[1];
          message.notification_error = params[2];
          if (params[1] === 'sent') message.last_notified_at = new Date().toISOString();
        }
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
        };
        state.outbox.push(row);
        return { rows: [clone(row)] };
      }

      if (/^INSERT INTO notification_attempts/i.test(normalized)) {
        state.attempts.push({ id: makeId(), created_at: new Date().toISOString(), params: [...params] });
        return { rows: [] };
      }

      if (/^SELECT \* FROM notification_attempts WHERE target_type = 'contact_message'/i.test(normalized)) {
        const rows = state.attempts
          .filter((attempt) => attempt.params[0] === params[0])
          .map((attempt) => ({ id: attempt.id, created_at: attempt.created_at, channel: attempt.params[2], status: attempt.params[3], error: attempt.params[4] || null }));
        return { rows };
      }

      if (/^INSERT INTO admin_audit_log/i.test(normalized)) {
        state.audit.push({ params: [...params] });
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
  process.env.LIPANA_WEBHOOK_SECRET = 'test-webhook-secret';
  process.env.LIPANA_SECRET_KEY = 'test-lipana-secret';
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
  delete process.env.LIPANA_WEBHOOK_SECRET;
  delete process.env.LIPANA_SECRET_KEY;
  delete process.env.DATABASE_URL;
});

test('invalid webhook signature is rejected', async () => {
  const res = await request('/lipana-webhook', {
    method: 'POST',
    headers: { 'Origin': 'http://me.localhost:5173',  'Content-Type': 'application/json', 'x-lipana-signature': 'invalid-signature' },
    body: JSON.stringify({ event: 'transaction.success', data: { transactionId: 'txn-1', amount: 500 } }),
  });

  assert.equal(res.status, 401);
  assert.equal(state.webhookEvents[0].signature_valid, false);
});

test('verified webhook persists a transaction and is idempotent', async () => {
  const payload = { event: 'transaction.success', data: { transactionId: 'txn-1', amount: 500 } };
  const first = await request('/lipana-webhook', {
    method: 'POST',
    headers: { 'Origin': 'http://me.localhost:5173',  'Content-Type': 'application/json', 'x-lipana-signature': 'valid-signature' },
    body: JSON.stringify(payload),
  });
  const second = await request('/lipana-webhook', {
    method: 'POST',
    headers: { 'Origin': 'http://me.localhost:5173',  'Content-Type': 'application/json', 'x-lipana-signature': 'valid-signature' },
    body: JSON.stringify(payload),
  });

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  const secondBody = await second.json();
  assert.equal(secondBody.duplicate, true);
  assert.equal(state.transactions.length, 1);
  assert.equal(state.transactions[0].status, 'successful');
  assert.equal(state.webhookEvents.length, 1);
});

test('contact message is persisted and notification failure does not remove it', async () => {
  axios.post = async () => {
    throw new Error('EmailJS unavailable');
  };

  const res = await request('/contact', {
    method: 'POST',
    headers: { 'Origin': 'http://me.localhost:5173',  'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test User', email: 'test@example.com', message: 'Hello' }),
  });

  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.notification.owner.status, 'failed');
  assert.equal(state.contacts.length, 1);
  assert.equal(state.contacts[0].notification_status, 'failed');
});

test('admin can list payments and communications', async () => {
  state.transactions.push({
    id: '11111111-1111-4111-8111-111111111111',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    provider: 'mpesa-lipana',
    provider_reference: 'txn-list',
    amount: 500,
    currency: 'KES',
    status: 'successful',
  });
  state.contacts.push({
    id: '22222222-2222-4222-8222-222222222222',
    created_at: new Date().toISOString(),
    name: 'Test User',
    email: 'test@example.com',
    message: 'Hello',
    notification_status: 'sent',
    notification_error: null,
    last_notified_at: new Date().toISOString(),
  });

  const { cookie } = await login();

  const payments = await request('/admin/payments', { headers: { 'Origin': 'http://me.localhost:5173',  Cookie: cookie } });
  assert.equal(payments.status, 200);
  const paymentsBody = await payments.json();
  assert.equal(paymentsBody.total, 1);

  const communications = await request('/admin/communications', { headers: { 'Origin': 'http://me.localhost:5173',  Cookie: cookie } });
  assert.equal(communications.status, 200);
  const communicationsBody = await communications.json();
  assert.equal(communicationsBody.total, 1);
});

test('communication notification retry records an additional attempt', async () => {
  state.contacts.push({
    id: '33333333-3333-4333-8333-333333333333',
    created_at: new Date().toISOString(),
    name: 'Test User',
    email: 'test@example.com',
    message: 'Hello',
    notification_status: 'failed',
    notification_error: 'previous failure',
    last_notified_at: null,
  });

  const { cookie, csrfToken } = await login();

  const retry = await request('/admin/communications/33333333-3333-4333-8333-333333333333/notify', {
    method: 'POST',
    headers: { 'Origin': 'http://me.localhost:5173',  Cookie: cookie, 'X-CSRF-Token': csrfToken },
  });

  assert.equal(retry.status, 200);
  const body = await retry.json();
  assert.equal(body.notification.owner.status, 'sent');

  const detail = await request('/admin/communications/33333333-3333-4333-8333-333333333333', {
    headers: { 'Origin': 'http://me.localhost:5173',  Cookie: cookie },
  });
  const detailBody = await detail.json();
  assert.ok(detailBody.notificationAttempts.length >= 1);
});