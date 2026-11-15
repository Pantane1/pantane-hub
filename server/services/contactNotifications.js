const axios = require('axios');

const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || process.env.VITE_EMAILJS_SERVICE_ID || 'service_65nlo8m';
const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || process.env.VITE_EMAILJS_PUBLIC_KEY || '6B39GrANe3KTTGYGH';
const EMAILJS_NOTIFY_TEMPLATE_ID = process.env.EMAILJS_NOTIFY_TEMPLATE_ID || process.env.VITE_EMAILJS_TEMPLATE_ID || 'template_b1391e3';
const EMAILJS_AUTOREPLY_TEMPLATE_ID = process.env.EMAILJS_AUTOREPLY_TEMPLATE_ID || process.env.VITE_EMAILJS_AUTOREPLY_TEMPLATE_ID || 'template_y88lggc';

function isConfigured() {
  return Boolean(EMAILJS_SERVICE_ID && EMAILJS_PUBLIC_KEY && EMAILJS_NOTIFY_TEMPLATE_ID);
}

function safeError(error) {
  const message = error?.response?.data?.message || error?.response?.data || error?.message || 'Email delivery failed.';
  return String(message).slice(0, 500);
}

async function sendOwnerNotification(message) {
  if (!isConfigured()) return { status: 'failed', error: 'EmailJS is not configured.' };
  try {
    await axios.post('https://api.emailjs.com/api/v1.0/email/send', {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_NOTIFY_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        from_name: message.name,
        from_email: message.email,
        message: message.message,
      },
    }, { timeout: 15000 });
    return { status: 'sent' };
  } catch (error) {
    return { status: 'failed', error: safeError(error) };
  }
}

async function sendClientAutoreply(message) {
  if (!isConfigured() || !EMAILJS_AUTOREPLY_TEMPLATE_ID) {
    return { status: 'failed', error: 'EmailJS autoreply is not configured.' };
  }
  try {
    await axios.post('https://api.emailjs.com/api/v1.0/email/send', {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_AUTOREPLY_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        to_name: message.name,
        user_email: message.email,
        message: message.message,
      },
    }, { timeout: 15000 });
    return { status: 'sent' };
  } catch (error) {
    return { status: 'failed', error: safeError(error) };
  }
}

async function attemptContactNotifications(message) {
  const owner = await sendOwnerNotification(message);
  const client = owner.status === 'sent'
    ? await sendClientAutoreply(message)
    : { status: 'skipped', error: 'Owner notification failed.' };
  return { owner, client };
}

module.exports = {
  isConfigured,
  sendOwnerNotification,
  sendClientAutoreply,
  attemptContactNotifications,
};