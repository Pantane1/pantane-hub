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

function buildInquiryMessage(inquiry) {
  return [
    'NEW PROJECT INQUIRY (pantane.is-a.dev/start-project)',
    '',
    `Service: ${inquiry.service}`,
    `Client budget range (their own estimate, not a quote): ${inquiry.budget}`,
    `Timeline: ${inquiry.timeline}`,
    `Business / organization: ${inquiry.business || '—'}`,
    `Phone / WhatsApp: ${inquiry.phone || '—'}`,
    '',
    'Project description:',
    inquiry.description,
    '',
    'Additional requirements:',
    inquiry.requirements || '—',
  ].join('\n');
}

async function sendOwnerNotification(inquiry) {
  if (!isConfigured()) {
    return { status: 'failed', error: 'EmailJS is not configured.' };
  }

  try {
    await axios.post('https://api.emailjs.com/api/v1.0/email/send', {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_NOTIFY_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        from_name: inquiry.name,
        from_email: inquiry.email,
        message: buildInquiryMessage(inquiry),
      },
    }, { timeout: 15000 });

    return { status: 'sent' };
  } catch (error) {
    return { status: 'failed', error: safeError(error) };
  }
}

async function sendClientAutoreply(inquiry) {
  if (!isConfigured() || !EMAILJS_AUTOREPLY_TEMPLATE_ID) {
    return { status: 'failed', error: 'EmailJS autoreply is not configured.' };
  }

  try {
    await axios.post('https://api.emailjs.com/api/v1.0/email/send', {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_AUTOREPLY_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        to_name: inquiry.name,
        user_email: inquiry.email,
        message: `Thanks for your project inquiry about "${inquiry.service}". I've received it and will get back to you soon.`,
      },
    }, { timeout: 15000 });

    return { status: 'sent' };
  } catch (error) {
    return { status: 'failed', error: safeError(error) };
  }
}

async function attemptInquiryNotifications(inquiry) {
  const owner = await sendOwnerNotification(inquiry);
  const client = owner.status === 'sent'
    ? await sendClientAutoreply(inquiry)
    : { status: 'skipped', error: 'Owner notification failed.' };

  return { owner, client };
}

module.exports = {
  isConfigured,
  sendOwnerNotification,
  sendClientAutoreply,
  attemptInquiryNotifications,
  buildInquiryMessage,
};