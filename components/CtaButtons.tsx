import React from 'react';
import { Link } from 'react-router-dom';
import { whatsappLink, WHATSAPP_CONSULT_TEXT } from '../data/contact';

const base = 'inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold transition-colors';

/** Primary action: goes to the structured inquiry form (optionally preselecting a service). */
export const QuoteButton: React.FC<{ serviceId?: string; label?: string; className?: string }> = ({ serviceId, label = 'Request a Quote', className = '' }) => (
  <Link
    to={serviceId ? `/start-project?service=${encodeURIComponent(serviceId)}` : '/start-project'}
    className={`${base} bg-brand-primary text-white hover:bg-brand-burgundy ${className}`}
  >
    {label} <span aria-hidden="true">→</span>
  </Link>
);

/** Secondary action: opens WhatsApp with a prefilled message, in a new tab. */
export const WhatsAppButton: React.FC<{ label?: string; message?: string; className?: string }> = ({ label = 'Chat on WhatsApp', message = WHATSAPP_CONSULT_TEXT, className = '' }) => (
  <a
    href={whatsappLink(message)}
    target="_blank"
    rel="noopener noreferrer"
    className={`${base} border border-brand-navy/20 text-brand-navy hover:border-brand-primary hover:text-brand-primary ${className}`}
  >
    {label} <span aria-hidden="true">↗</span>
  </a>
);
