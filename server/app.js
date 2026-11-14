const express = require('express');
const cors = require('cors');

const stkRoute = require('./routes/stk');
const webhookRoute = require('./routes/webhook');
const authRoute = require('./routes/auth');
const journalRoute = require('./routes/journal');
const sharpRoute = require('./routes/sharp');
const reposRoute = require('./routes/repos');
const chatRoute = require('./routes/chat');

function createApp() {
  const app = express();

  // Render terminates TLS and forwards requests; trust the first proxy hop so
  // req.ip reflects the visitor rather than the proxy.
  app.set('trust proxy', 1);

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const allowed = [
        process.env.FRONTEND_URL,
        process.env.FRONTEND_URL?.replace('https://www.', 'https://'),
        process.env.FRONTEND_URL?.replace('https://', 'https://www.'),
        'http://localhost:3000',
        'http://localhost:5173',
        'https://pantane.is-a.dev',
        'https://www.pantane.is-a.dev',
      ].filter(Boolean);

      if (allowed.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
  }));

  // Lightweight cookie parser for the HttpOnly admin session cookie.
  app.use((req, res, next) => {
    const cookies = {};
    if (req.headers.cookie) {
      for (const part of req.headers.cookie.split(';')) {
        const [rawName, ...rawValue] = part.trim().split('=');
        if (!rawName) continue;
        try {
          cookies[rawName] = decodeURIComponent(rawValue.join('='));
        } catch (error) {
          cookies[rawName] = rawValue.join('=');
        }
      }
    }
    req.cookies = cookies;
    next();
  });

  app.use('/lipana-webhook', express.raw({ type: 'application/json' }), webhookRoute);
  app.use(express.json());

  app.use('/stk-push', stkRoute);
  app.use('/admin', authRoute);
  app.use('/admin', journalRoute);
  app.use('/admin', sharpRoute);
  app.use('/repos', reposRoute);
  app.use('/chat', chatRoute);

  app.get('/', (req, res) => {
    res.json({ status: 'Pantane Hub server running' });
  });

  return app;
}

module.exports = { createApp };