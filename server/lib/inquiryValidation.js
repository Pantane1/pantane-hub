const BUDGET_OPTIONS = [
  'Not sure yet',
  'Under KSh 20,000',
  'KSh 20,000 – 50,000',
  'KSh 50,000 – 100,000',
  'KSh 100,000 – 250,000',
  'KSh 250,000+',
];

const TIMELINE_OPTIONS = [
  'As soon as possible',
  'Within 2–4 weeks',
  'Within 1–2 months',
  'Flexible / no fixed date',
];

const SERVICE_OPTIONS = [
  'Websites & Landing Pages',
  'Web Applications & Business Systems',
  'Payments & API Integrations',
  'AI & Automation',
  'Maintenance & Technical Support',
  'Not sure / something else',
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateInquiry(values) {
  const errors = {};

  if (!SERVICE_OPTIONS.includes(values.service)) {
    errors.service = 'Please choose a service.';
  }

  const description = String(values.description || '').trim();
  if (description.length < 20) {
    errors.description = 'Please describe your project in at least 20 characters.';
  } else if (description.length > 2000) {
    errors.description = 'Please keep this under 2,000 characters.';
  }

  if (!BUDGET_OPTIONS.includes(values.budget)) {
    errors.budget = 'Please choose a budget range.';
  }

  if (!TIMELINE_OPTIONS.includes(values.timeline)) {
    errors.timeline = 'Please choose a timeline.';
  }

  const requirements = String(values.requirements || '').trim();
  if (requirements.length > 1500) {
    errors.requirements = 'Please keep this under 1,500 characters.';
  }

  const name = String(values.name || '').trim();
  if (name.length < 2) {
    errors.name = 'Please enter your full name.';
  }

  const email = String(values.email || '').trim();
  if (!EMAIL_RE.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  const phone = String(values.phone || '').trim();
  if (phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9 || digits.length > 15 || !/^[\d\s+()-]+$/.test(phone)) {
      errors.phone = 'Please enter a valid phone or WhatsApp number, or leave it blank.';
    }
  }

  const business = String(values.business || '').trim();
  if (business.length > 100) {
    errors.business = 'Please keep this under 100 characters.';
  }

  return errors;
}

function buildInquiryMessage(values) {
  return [
    'NEW PROJECT INQUIRY (pantane.is-a.dev/start-project)',
    '',
    `Service: ${values.service}`,
    `Client budget range (their own estimate, not a quote): ${values.budget}`,
    `Timeline: ${values.timeline}`,
    `Business / organization: ${values.business?.trim() || '—'}`,
    `Phone / WhatsApp: ${values.phone?.trim() || '—'}`,
    '',
    'Project description:',
    values.description.trim(),
    '',
    'Additional requirements:',
    values.requirements?.trim() || '—',
  ].join('\n');
}

module.exports = {
  BUDGET_OPTIONS,
  TIMELINE_OPTIONS,
  SERVICE_OPTIONS,
  validateInquiry,
  buildInquiryMessage,
};