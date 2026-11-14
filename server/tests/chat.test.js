const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const axios = require('axios');

const { createApp } = require('../app');
const chatRoute = require('../routes/chat');

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

function geminiResponse(text) {
  return {
    data: {
      candidates: [{ content: { parts: [{ text }] } }],
    },
  };
}

function postChat(payload) {
  return fetch(`${baseUrl}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

test.beforeEach(async () => {
  process.env.GEMINI_API_KEY = 'test-gemini-key';
  process.env.SESSION_SECRET = 'test-session-secret';
  chatRoute.resetRateLimit();
  axios.post = async () => geminiResponse('Hello from Gemini');
  await startServer();
});

test.afterEach(async () => {
  await stopServer();
  delete process.env.GEMINI_API_KEY;
  delete process.env.SESSION_SECRET;
});

test('successful chat request returns the Gemini reply', async () => {
  const res = await postChat({ message: 'Hello', history: [{ role: 'user', text: 'Hi' }] });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.reply, 'Hello from Gemini');
  assert.ok(!JSON.stringify(body).includes('test-gemini-key'));
});

test('missing message returns 400', async () => {
  const res = await postChat({});
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.match(body.error, /Message is required/);
});

test('empty message returns 400', async () => {
  const res = await postChat({ message: '   ' });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.match(body.error, /Message is required/);
});

test('oversized message returns 400', async () => {
  const res = await postChat({ message: 'a'.repeat(2001) });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.match(body.error, /too long/);
});

test('invalid conversation history returns 400', async () => {
  const res = await postChat({ message: 'Hello', history: [{ role: 'admin', text: 'Hi' }] });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.match(body.error, /Invalid history role/);
});

test('Gemini provider failure returns 502 without leaking the key', async () => {
  axios.post = async () => {
    const error = new Error('provider down');
    error.response = { status: 500 };
    throw error;
  };

  const res = await postChat({ message: 'Hello' });
  assert.equal(res.status, 502);
  const body = await res.json();
  assert.match(body.error, /temporarily unavailable/);
  assert.ok(!JSON.stringify(body).includes('test-gemini-key'));
});

test('missing GEMINI_API_KEY returns 503', async () => {
  delete process.env.GEMINI_API_KEY;
  const res = await postChat({ message: 'Hello' });
  assert.equal(res.status, 503);
  const body = await res.json();
  assert.match(body.error, /not configured/);
});

test('rate limiting returns 429 after the configured threshold', async () => {
  let lastStatus = 0;
  for (let i = 0; i < 21; i += 1) {
    const res = await postChat({ message: `message ${i}` });
    lastStatus = res.status;
    await res.text();
  }
  assert.equal(lastStatus, 429);
});

test('API key is never included in the response body', async () => {
  const res = await postChat({ message: 'Hello' });
  const body = await res.json();
  assert.ok(!JSON.stringify(body).includes('test-gemini-key'));
});