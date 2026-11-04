/**
 * Configuration + content for the OpeningAd splash. Kept separate from the
 * component so copy, timing and (optional) video can be tuned without
 * touching any rendering logic.
 *
 * Shows on every page load/refresh by design (no dismissal persistence).
 * One of `openingAdVariants` is picked at random on each fresh load, so the
 * ad itself interchanges between visits/refreshes.
 */

export interface OpeningAdVariant {
  id: string;
  headline: [string, string];
  copy: string;
  primaryCta: { label: string; to: string };
  secondaryCta: { label: string; to: string };
  floatingCards: [
    { label: string; sub: string },
    { label: string; sub: string },
    { label: string; sub: string },
    { label: string; sub: string },
  ];
}

/** Shared across every variant — brand identity, top nav strip, terminal
 *  output, and tech row are consistent "this is a real dev shop" signals
 *  regardless of which message/CTA is showing. */
export const openingAdBrand = { first: 'PANTANE', second: 'HUB' };
export const openingAdEyebrow = ['Portfolio', 'Projects', 'Services', 'Journal'];
export const openingAdTerminalLines = [
  { text: 'npm run build', type: 'command' as const },
  { text: 'Build completed', type: 'success' as const },
  { text: 'Lint passed', type: 'success' as const },
  { text: 'Type check passed', type: 'success' as const },
  { text: 'Ready for deployment', type: 'success' as const },
];
/** Reuses the same simple-icons CDN pattern already used in the site's tech marquee. */
export const openingAdTechSlugs = ['react', 'nodedotjs', 'python', 'postgresql', 'docker', 'github'];

export const openingAdVariants: OpeningAdVariant[] = [
  {
    id: 'portfolio',
    headline: ['Build. Learn.', 'Create. Grow.'],
    copy: "Follow what I'm building, learning, and offering. Explore my projects, services and latest updates in the Pantane Journal.",
    primaryCta: { label: 'Explore Journal', to: '/journal' },
    secondaryCta: { label: 'Get in Touch', to: '/contact' },
    floatingCards: [
      { label: 'ContactGate', sub: 'Automation' },
      { label: 'Web Development', sub: 'Frontend' },
      { label: 'API Development', sub: 'Backend' },
      { label: 'AI & Automation', sub: 'Intelligent workflows' },
    ],
  },
  {
    id: 'web-development',
    headline: ['Websites that', 'actually convert.'],
    copy: 'Modern, fast web experiences for businesses, brands, and products — designed, built, and shipped end-to-end.',
    primaryCta: { label: 'Start a Web Project', to: '/contact' },
    secondaryCta: { label: 'See Projects', to: '/projects' },
    floatingCards: [
      { label: 'Web Development', sub: 'Frontend' },
      { label: 'UI/UX', sub: 'Design systems' },
      { label: 'Responsive', sub: 'Every device' },
      { label: 'Deployment', sub: 'Vercel · Render' },
    ],
  },
  {
    id: 'ai-automation',
    headline: ['Automate the', 'boring parts.'],
    copy: 'AI-powered workflows and automation that take repetitive work off your plate — built into real products, not demos.',
    primaryCta: { label: 'Talk Automation', to: '/contact' },
    secondaryCta: { label: 'Read the Journal', to: '/journal' },
    floatingCards: [
      { label: 'AI & Automation', sub: 'Intelligent workflows' },
      { label: 'API Development', sub: 'Backend' },
      { label: 'ContactGate', sub: 'Automated unlock' },
      { label: 'Workflow Engine', sub: 'Event-driven' },
    ],
  },
  {
    id: 'payments',
    headline: ['Get paid,', 'automatically.'],
    copy: 'M-Pesa, Lipana, and payment workflows wired directly into your product — STK push, webhooks, and reconciliation done right.',
    primaryCta: { label: 'Request Integration', to: '/contact' },
    secondaryCta: { label: 'See Projects', to: '/projects' },
    floatingCards: [
      { label: 'Payment Integration', sub: 'M-Pesa · Lipana' },
      { label: 'STK Push', sub: 'Instant checkout' },
      { label: 'Webhooks', sub: 'Verified & retried' },
      { label: 'ContactGate', sub: 'Paywall example' },
    ],
  },
  {
    id: 'journal-social',
    headline: ['Follow what', "I'm building."],
    copy: "Projects, learning, services and updates — documented as they happen in the Pantane Journal. Not just a feed, an archive.",
    primaryCta: { label: 'Read the Journal', to: '/journal' },
    secondaryCta: { label: 'See Socials', to: '/socials' },
    floatingCards: [
      { label: 'Pantane Journal', sub: 'Latest updates' },
      { label: 'Projects', sub: 'In progress' },
      { label: 'Learning', sub: 'Notes & discoveries' },
      { label: 'Announcements', sub: "What's new" },
    ],
  },
];

/**
 * Optional video mode. Disabled by default since no promo video exists yet.
 * To enable: drop a short (6-10s) muted video into /public (e.g. /opening-ad.mp4)
 * and flip `enabled` to true. The component falls back to the static
 * composition automatically if the video is disabled or fails to load.
 * Shared across every variant (one video, if ever enabled, plays regardless
 * of which text/CTA variant was picked).
 */
export const openingAdVideo = {
  enabled: false,
  src: '',      // e.g. '/opening-ad.mp4'
  poster: '',   // e.g. '/opening-ad-poster.jpg'
};
