/**
 * Configuration + content for the OpeningAd splash. Kept separate from the
 * component so copy, timing and (optional) video can be tuned without
 * touching any rendering logic.
 *
 * Shows on every page load/refresh by design (no dismissal persistence).
 */

export const openingAdContent = {
  brand: { first: 'PANTANE', second: 'HUB' },
  eyebrow: ['Portfolio', 'Projects', 'Services', 'Journal'],
  headline: ['Build. Learn.', 'Create. Grow.'],
  copy: "Follow what I'm building, learning, and offering. Explore my projects, services and latest updates in the Pantane Journal.",
  primaryCta: { label: 'Explore Journal', to: '/journal' },
  secondaryCta: { label: 'Get in Touch', to: '/contact' },
  floatingCards: [
    { label: 'ContactGate', sub: 'Automation' },
    { label: 'Web Development', sub: 'Frontend' },
    { label: 'API Development', sub: 'Backend' },
    { label: 'AI & Automation', sub: 'Intelligent workflows' },
    { label: 'Payment Integration', sub: 'M-Pesa · Lipana' },
    { label: 'Technical Support', sub: 'Deployment' },
  ],
  terminalLines: [
    { text: 'npm run build', type: 'command' as const },
    { text: 'Build completed', type: 'success' as const },
    { text: 'Lint passed', type: 'success' as const },
    { text: 'Type check passed', type: 'success' as const },
    { text: 'Ready for deployment', type: 'success' as const },
  ],
  /** Reuses the same simple-icons CDN pattern already used in the site's tech marquee. */
  techSlugs: ['react', 'nodedotjs', 'python', 'postgresql', 'docker', 'github'],
};

/**
 * Optional video mode. Disabled by default since no promo video exists yet.
 * To enable: drop a short (6-10s) muted video into /public (e.g. /opening-ad.mp4)
 * and flip `enabled` to true. The component falls back to the static
 * composition automatically if the video is disabled or fails to load.
 */
export const openingAdVideo = {
  enabled: false,
  src: '',      // e.g. '/opening-ad.mp4'
  poster: '',   // e.g. '/opening-ad-poster.jpg'
};
