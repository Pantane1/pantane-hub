// Generates a sitemap.xml from the site's static routes + every post in
// data/journal.json + every deal in data/sharp.json, written to
// public/sitemap.xml so Vite copies it into the build output. Runs as a
// prebuild step (see package.json) so it stays in sync with those JSON
// files -- including posts added via the admin panel -- on every deploy.
// /admin/journal is intentionally excluded, matching robots.txt.

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_URL = 'https://pantane.is-a.dev';

const posts = JSON.parse(
  readFileSync(path.join(__dirname, '..', 'data', 'journal.json'), 'utf8')
);
const deals = JSON.parse(
  readFileSync(path.join(__dirname, '..', 'data', 'sharp.json'), 'utf8')
);

const today = new Date().toISOString().slice(0, 10);

const apiUrl = process.env.VITE_API_URL || process.env.API_URL;
let curatedProjects = [];
if (apiUrl) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${apiUrl}/projects`, { signal: controller.signal });
    clearTimeout(timeout);
    if (response.ok) {
      const data = await response.json();
      curatedProjects = Array.isArray(data.projects) ? data.projects : [];
    } else {
      console.warn(`Sitemap: project fetch returned ${response.status}; skipping project URLs.`);
    }
  } catch (error) {
    console.warn(`Sitemap: could not fetch published projects (${error.message}); skipping project URLs.`);
  }
}

/** Static routes, newest-content-first isn't relevant here -- priority just
 *  signals relative importance to crawlers, home highest. */
const staticRoutes = [
  { loc: '/',         priority: '1.0' },
  { loc: '/journal',  priority: '0.9' },
  { loc: '/services', priority: '0.9' },
  { loc: '/start-project', priority: '0.8' },
  { loc: '/sharp',    priority: '0.9' },
  { loc: '/projects', priority: '0.8' },
  { loc: '/contact',  priority: '0.6' },
  { loc: '/socials',  priority: '0.5' },
  { loc: '/support',  priority: '0.4' },
];

const urls = [
  ...staticRoutes.map(({ loc, priority }) => ({
    loc: `${SITE_URL}${loc}`,
    lastmod: today,
    priority,
  })),
  ...posts.map((post) => ({
    loc: `${SITE_URL}/journal/${post.slug}`,
    lastmod: post.date,
    priority: '0.7',
  })),
  ...deals.map((deal) => ({
    loc: `${SITE_URL}/sharp/${deal.slug}`,
    lastmod: deal.datePosted,
    priority: '0.7',
  })),
  ...curatedProjects
    .filter((project) => typeof project?.slug === 'string' && project.slug)
    .map((project) => ({
      loc: `${SITE_URL}/projects/${project.slug}`,
      lastmod: typeof project.updatedAt === 'string' ? project.updatedAt.slice(0, 10) : today,
      priority: '0.8',
    })),
];

const urlEntries = urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;

const outPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
writeFileSync(outPath, sitemap, 'utf8');
console.log(`Sitemap generated: ${staticRoutes.length} static route(s) + ${posts.length} post(s) + ${deals.length} deal(s) -> public/sitemap.xml`);
