import { serviceCategories } from './services';

/**
 * Project-inquiry configuration. BUDGET_OPTIONS are the brackets a CLIENT can pick to
 * describe what they have in mind — they are NOT PantaneHub prices or quotations.
 * Edit freely; nothing else depends on the exact wording.
 */
export const BUDGET_OPTIONS = [
  'Not sure yet',
  'Under KSh 20,000',
  'KSh 20,000 – 50,000',
  'KSh 50,000 – 100,000',
  'KSh 100,000 – 250,000',
  'KSh 250,000+',
];

export const TIMELINE_OPTIONS = ['As soon as possible', 'Within 2–4 weeks', 'Within 1–2 months', 'Flexible / no fixed date'];

export const OTHER_SERVICE = 'Not sure / something else';
export const SERVICE_OPTIONS = [...serviceCategories.map(c => c.name), OTHER_SERVICE];

export const STEP_LABELS = ['Project', 'Budget & timeline', 'Your details'];

export interface InquiryValues {
  service: string;
  description: string;
  budget: string;
  timeline: string;
  requirements: string;
  name: string;
  email: string;
  phone: string;
  business: string;
}

export const emptyInquiry = (): InquiryValues => ({
  service: '', description: '', budget: '', timeline: '', requirements: '', name: '', email: '', phone: '', business: '',
});

export type InquiryErrors = Partial<Record<keyof InquiryValues, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validates one step. Pure (no DOM/React) so it can be unit-tested. */
export function validateStep(step: number, v: InquiryValues): InquiryErrors {
  const e: InquiryErrors = {};
  if (step === 0) {
    if (!SERVICE_OPTIONS.includes(v.service)) e.service = 'Please choose a service.';
    const d = v.description.trim();
    if (d.length < 20) e.description = 'Please describe your project in at least 20 characters.';
    else if (d.length > 2000) e.description = 'Please keep this under 2,000 characters.';
  } else if (step === 1) {
    if (!BUDGET_OPTIONS.includes(v.budget)) e.budget = 'Please choose a budget range.';
    if (!TIMELINE_OPTIONS.includes(v.timeline)) e.timeline = 'Please choose a timeline.';
    if (v.requirements.length > 1500) e.requirements = 'Please keep this under 1,500 characters.';
  } else if (step === 2) {
    if (v.name.trim().length < 2) e.name = 'Please enter your full name.';
    if (!EMAIL_RE.test(v.email.trim())) e.email = 'Please enter a valid email address.';
    if (v.phone.trim()) {
      const digits = v.phone.replace(/\D/g, '');
      if (digits.length < 9 || digits.length > 15 || !/^[\d\s+()-]+$/.test(v.phone.trim())) e.phone = 'Please enter a valid phone or WhatsApp number, or leave it blank.';
    }
    if (v.business.length > 100) e.business = 'Please keep this under 100 characters.';
  }
  return e;
}

export function validateAll(v: InquiryValues): { step: number; errors: InquiryErrors } | null {
  for (let s = 0; s < STEP_LABELS.length; s++) {
    const errors = validateStep(s, v);
    if (Object.keys(errors).length) return { step: s, errors };
  }
  return null;
}

/** The body of the email Pantane receives. */
export function buildInquiryMessage(v: InquiryValues): string {
  return [
    'NEW PROJECT INQUIRY (pantane.is-a.dev/start-project)',
    '',
    `Service: ${v.service}`,
    `Client budget range (their own estimate, not a quote): ${v.budget}`,
    `Timeline: ${v.timeline}`,
    `Business / organization: ${v.business.trim() || '—'}`,
    `Phone / WhatsApp: ${v.phone.trim() || '—'}`,
    '',
    'Project description:',
    v.description.trim(),
    '',
    'Additional requirements:',
    v.requirements.trim() || '—',
  ].join('\n');
}
