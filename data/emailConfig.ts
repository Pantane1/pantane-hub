// Single source for the EmailJS IDs already used by pages/Contact.tsx.
// Extracted here so components/SharpRequestForm.tsx genuinely reuses the
// same service/templates (same inbox, same autoreply) instead of
// duplicating the configuration. These are EmailJS "public key" style
// values — safe for client-side code by EmailJS's own design, same as
// they already were inline in Contact.tsx.

export const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_65nlo8m';
export const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '6B39GrANe3KTTGYGH';
export const EMAILJS_NOTIFY_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_b1391e3';
export const EMAILJS_AUTOREPLY_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_AUTOREPLY_TEMPLATE_ID || 'template_y88lggc';
