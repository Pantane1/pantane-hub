const express = require('express');
const router = express.Router();
const { Lipana } = require('@lipana/sdk');

// Lazy-initialize Lipana to avoid startup crashes if env vars are missing
let lipana;
const getLipana = () => {
  if (!lipana) {
    lipana = new Lipana({
      apiKey: process.env.LIPANA_SECRET_KEY,
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
    });
  }
  return lipana;
};

// POST /stk-push
// Body: { phone: '+254712345678', amount: 500 }
router.post('/', async (req, res) => {
  const { phone, amount } = req.body;

  // Basic validation
  if (!phone || !amount) {
    return res.status(400).json({ error: 'Phone and amount are required.' });
  }

  const parsedAmount = parseInt(amount, 10);
  if (isNaN(parsedAmount) || parsedAmount < 1) {
    return res.status(400).json({ error: 'Amount must be a valid number greater than 0.' });
  }

  // Normalize phone: accept 07xx, 7xx, +2547xx → always send as +2547xx
  let normalizedPhone = phone.trim();
  if (normalizedPhone.startsWith('0')) {
    normalizedPhone = '+254' + normalizedPhone.slice(1);
  } else if (!normalizedPhone.startsWith('+')) {
    normalizedPhone = '+254' + normalizedPhone;
  }

  try {
    const sdk = getLipana();
    // transactionId is at ROOT level — not inside .data
    const response = await sdk.transactions.initiateStkPush({
      phone: normalizedPhone,
      amount: parsedAmount,
    });

    return res.status(200).json({
      success: true,
      message: 'STK Push sent. Please check your phone.',
      transactionId: response.transactionId,
      checkoutRequestID: response.checkoutRequestID || null,
    });
  } catch (error) {
    console.error('STK Push error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to initiate STK Push. Please try again.',
    });
  }
});

module.exports = router;