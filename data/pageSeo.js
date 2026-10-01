// Single source of truth for per-route SEO copy. Imported by both the React
// app (pages call useSeo(pageSeo.X)) and scripts/prerender-meta.js (Node),
// so client-side tags and statically prerendered tags can never drift apart.
// Plain .js (not .ts) so the Node build script can import it directly under
// ESM without a TypeScript loader; Vite/tsc are fine consuming a .js module
// (allowJs is enabled in tsconfig.json).

export const SITE_URL = 'https://pantane.is-a.dev';
export const DEFAULT_OG_IMAGE = 'https://raw.githubusercontent.com/Pantane1/wamuhu-martin/main/favcon.png';

export const pageSeo = {
  home: {
    path: '/',
    title: 'Pantane — Software Developer | Full-Stack, Cloud & Automation',
    description: 'Pantane is a software developer based in Kenya, building full-stack web applications, cloud-based systems, and AI-powered automation. Explore projects, services, and the Pantane Journal.',
  },
  projects: {
    path: '/projects',
    title: 'Projects — Pantane | Full-Stack & Automation Work',
    description: 'A selection of software projects by Pantane — full-stack web apps, M-Pesa payment integrations, and automation tools built for real use.',
  },
  journal: {
    path: '/journal',
    title: 'Pantane Journal | Building. Learning. Creating. Sharing.',
    description: "Follow what I'm building, learning, and offering — projects, services, and updates from Pantane, permanently archived.",
  },
  socials: {
    path: '/socials',
    title: 'Connect with Pantane | Socials & Contact Channels',
    description: 'Follow Pantane across GitHub, LinkedIn, Instagram and more — projects, updates, and behind-the-scenes from a Kenya-based software developer.',
  },
  contact: {
    path: '/contact',
    title: 'Contact Pantane | Software Developer, Kenya',
    description: 'Get in touch with Pantane for full-stack development, automation, or API integration work — based in Kenya, working with clients worldwide.',
  },
  support: {
    path: '/support',
    title: 'Support Pantane | Back the Work',
    description: "Support Pantane's independent software projects and open-source work via M-Pesa, PayPal, or Paystack.",
  },
  sharp: {
    path: '/sharp',
    title: 'Sharp — Deals, Rewards & Opportunities | PantaneHub',
    description: 'Discover new deals, rewards, referrals and opportunities on PantaneHub, with simple step-by-step explanations of how they work.',
  },
};
