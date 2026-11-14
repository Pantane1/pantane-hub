const express = require('express');
const cors = require('cors');

const stkRoute = require('./routes/stk');
const webhookRoute = require('./routes/webhook');
const journalRoute = require('./routes/journal');
const sharpRoute = require('./routes/sharp');
const reposRoute = require('./routes/repos');
const chatRoute = require('./routes/chat');

function createApp() {
  const app = express();

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const allowed = [
        process.env.FRONTEND_URL,
        process.env.FRONTEND_URL?.replace('https://www.', 'https://'),
        process.env.FRONTEND_URL?.replace('https://', 'https://www.'),
        'http://localhost:3000',
        'http://localhost:5173',
      ].filter(Boolean);

      if (allowed.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
  }));

  app.use('/lipana-webhook', express.raw({ type: 'application/json' }), webhookRoute);
  app.use(express.json());

  app.use('/stk-push', stkRoute);
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