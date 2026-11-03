// Contact details that are ALREADY public on the site (Contact page, Socials page).
// Centralised here so the new Services / inquiry flow reuse them instead of re-typing.
export const WHATSAPP_NUMBER = '254740312402';
export const CONTACT_EMAIL = 'pantane254@gmail.com';

export const whatsappLink = (text?: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

export const WHATSAPP_CONSULT_TEXT = "Hi Pantane, I found you through your website and I'd like to discuss a project.";
