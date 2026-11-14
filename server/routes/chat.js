const express = require('express');
const axios = require('axios');
const { createRateLimiter } = require('../middleware/rateLimit');

const router = express.Router();

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_ITEMS = 50;
const MAX_HISTORY_TEXT_LENGTH = 4000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 20;

const limiter = createRateLimiter({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
});

const SYSTEM_PROMPT = `You are PH-Bot, the friendly AI assistant embedded in Pantane Hub — the professional portfolio of Pantane, a full-stack software developer based in Kenya (Kikuyu, Kiambu County).

Your job is to help visitors learn about Pantane, his work, and how to connect with him.

KEY FACTS ABOUT PANTANE:
- Name: Pantane (GitHub: Pantane1)
- Brand: Pantane Designs / Pantane Hub
- Location: Kenya (Kikuyu, Kiambu County)
- Education: BSc Mathematics & Computer Science, Meru University of Science and Technology
- Status: Available for new opportunities and freelance projects

TECH STACK:
- Frontend: React, Next.js, TypeScript, Vite, Tailwind CSS, Expo (React Native)
- Backend: Node.js, Express, Laravel, Python
- Databases: MySQL, MongoDB, Firebase Firestore, PostgreSQL, TiDB Serverless
- Payments: M-Pesa (Lipana STK Push), Paystack, Pesapal, PayPal
- Deployment: Vercel, Render
- Other: MediaPipe, Three.js, Africa's Talking, EmailJS, WhatsApp Cloud API, Gemini AI

NOTABLE PROJECTS:
- Pantane Hub — this portfolio site (React/TypeScript/Vite, live at pantane.is-a.dev)
- chakra-core — browser-based AI hand tracking + anime AR aura effects (MediaPipe + Three.js)
- Pewa — Swahili gig marketplace (Next.js, Firebase, Lipana, Africa's Talking)
- WAS (Wireless Attendance System) — university BLE/WiFi Android attendance app
- Duka App — Kenyan e-commerce with M-Pesa payments
- SciCalc Pro — monetized scientific calculator with M-Pesa paywall
- ShauriBot — WhatsApp AI chatbot (Gemini + Firebase)
- Auto-Link v2 — community coordination platform (Next.js + Firebase)
- Expense Tracker — personal finance app (Next.js, MySQL/TiDB, Recharts)

CONTACT:
- Email: pantane254@gmail.com
- WhatsApp: +254 740 312 402
- GitHub: github.com/pantane1
- LinkedIn: linkedin.com/in/wn-martin
- Instagram: instagram.com/_pantane_
- Telegram: t.me/pantane
- Twitter: @pantane4
- Live site: pantane.is-a.dev

SITE PAGES:
- / -> Home
- /projects -> GitHub projects
- /journal -> Pantane Journal (updates on what I'm building/learning)
- /services -> What I offer (websites, web apps, payments, AI & automation, support)
- /start-project -> Project inquiry / request a quote form
- /sharp -> Sharp: deals, rewards, referrals and opportunities, with step-by-step explanations of how each one works
- /socials -> Social links
- /contact -> Contact form
- /support -> Support / payments

PERSONALITY:
- Friendly, concise, professional
- Speak naturally — not robotic
- Keep responses short (2-4 sentences max unless asked for detail)
- If asked something you don't know about Pantane, say you're not sure and suggest contacting him directly
- Never make up projects or skills that aren't listed above
- Always reply in the same language the user writes in`;

function validateBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Invalid request body.';
  }

  const { message, history } = body;

  if (typeof message !== 'string') {
    return 'Message is required.';
  }

  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    return 'Message is required.';
  }
  if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
    return 'Message is too long.';
  }

  let safeHistory = [];
  if (history !== undefined) {
    if (!Array.isArray(history)) {
      return 'History must be an array.';
    }
    if (history.length > MAX_HISTORY_ITEMS) {
      return 'Too many history items.';
    }

    for (const item of history) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return 'Invalid history item.';
      }
      if (item.role !== 'user' && item.role !== 'model') {
        return 'Invalid history role.';
      }
      if (typeof item.text !== 'string') {
        return 'Invalid history text.';
      }
      if (item.text.length > MAX_HISTORY_TEXT_LENGTH) {
        return 'History text is too long.';
      }
      safeHistory.push({
        role: item.role,
        parts: [{ text: item.text }],
      });
    }
  }

  return {
    message: trimmedMessage,
    history: safeHistory,
  };
}

router.post('/', limiter.middleware, async (req, res) => {
  const validated = validateBody(req.body);
  if (typeof validated === 'string') {
    return res.status(400).json({ error: validated });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not configured.');
    return res.status(503).json({ error: 'Chat service is not configured.' });
  }

  const contents = [
    ...validated.history,
    { role: 'user', parts: [{ text: validated.message }] },
  ];

  try {
    const { data } = await axios.post(
      `${GEMINI_ENDPOINT}?key=${apiKey}`,
      {
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
      },
      { timeout: 30000 }
    );

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I'm not sure about that. Try contacting Pantane directly at pantane254@gmail.com!";

    return res.json({ reply });
  } catch (error) {
    console.error('Gemini proxy request failed:', error?.response?.status || error?.message);
    if (error?.response?.status === 429) {
      return res.status(429).json({ error: 'Chat service is busy. Please try again later.' });
    }
    return res.status(502).json({ error: 'Chat service is temporarily unavailable.' });
  }
});

function resetRateLimit() {
  limiter.reset();
}

module.exports = router;
module.exports.resetRateLimit = resetRateLimit;