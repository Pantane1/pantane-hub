require('dotenv').config();
const express = require('express');
const cors = require('cors');

const stkRoute = require('./routes/stk');
const webhookRoute = require('./routes/webhook');

const app = express();

// Allow requests from your Vercel frontend
const allowedOrigins = [
  process.env.FRONTEND_URL, // e.g. https://pantane-hub.vercel.app
  'http://localhost:5173',   // local dev
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
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