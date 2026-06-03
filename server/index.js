require('dotenv').config();
const express = require('express');
const cors = require('cors');

const stkRoute = require('./routes/stk');
const webhookRoute = require('./routes/webhook');

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    // Allow no-origin requests (Postman, curl)
    if (!origin) return callback(null, true);

    const allowed = [
      process.env.FRONTEND_URL,
      // Also allow www. and non-www. variants automatically
      process.env.FRONTEND_URL?.replace('https://www.', 'https://'),
      process.env.FRONTEND_URL?.replace('https://', 'https://www.'),
      'http://localhost:3000',
      'http://localhost:5173',
    ].filter(Boolean);
    console.log('Allowed origins:', allowed);
    console.log('Incoming origin:', origin); 

    if (allowed.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
}));

// IMPORTANT: Raw body for webhook signature verification must come BEFORE express.json()
app.use('/lipana-webhook', express.raw({ type: 'application/json' }), webhookRoute);

// JSON parser for all other routes
app.use(express.json());

// Routes
app.use('/stk-push', stkRoute);

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'Pantane Hub server running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});