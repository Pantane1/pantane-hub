// Prerenders <head> meta tags (title, description, OG, Twitter, canonical)
// for the Journal feed and every individual post, as real static files in
// dist/. The app shell (scripts/styles) is identical to the built
// dist/index.html — only the <head> tags differ — so real browsers still
// boot the full SPA normally; only crawlers that read a page's raw HTML
// (link-preview bots, most of which don't execute JS) now see correct,
// route-specific tags instead of the site-wide defaults.
//
// This works because Vercel gives static files precedence over the
// catch-all rewrite in vercel.json, and serves a directory's index.html
// for a request to that directory's path with no trailing slash (e.g.
// /journal/some-slug -> dist/journal/some-slug/index.html) without any
// extra config. Runs as a postbuild step, after vite build.

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');
const SITE_URL = 'https://pantane.is-a.dev';
const DEFAULT_OG_IMAGE = 'https://raw.githubusercontent.com/Pantane1/wamuhu-martin/main/favcon.png';

const posts = JSON.parse(
  readFileSync(path.join(__dirname, '..', 'data', 'journal.json'), 'utf8')
);

const escapeAttr = (str) =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const baseHtml = readFileSync(path.join(distDir, 'index.html'), 'utf8');

/** Replace a <meta ATTR="KEY" content="..."> tag's content, regardless of
 *  attribute order within the tag. Throws if the tag isn't found, so a
 *  drifted index.html fails the build loudly instead of silently no-op-ing. */
const setMeta = (html, attr, key, newContent) => {
  const re1 = new RegExp(`(<meta[^>]*\\b${attr}="${key}"[^>]*\\bcontent=")[^"]*("[^>]*>)`, 'i');
  if (re1.test(html)) return html.replace(re1, `$1${escapeAttr(newContent)}$2`);
  const re2 = new RegExp(`(<meta[^>]*\\bcontent=")[^"]*("[^>]*\\b${attr}="${key}"[^>]*>)`, 'i');
  if (re2.test(html)) return html.replace(re2, `$1${escapeAttr(newContent)}$2`);
  throw new Error(`prerender-meta: could not find <meta ${attr}="${key}"> in dist/index.html — has the head markup changed?`);
};

const setTitle = (html, newTitle) => {
  if (!/<title>[^<]*<\/title>/.test(html)) throw new Error('prerender-meta: could not find <title> in dist/index.html');
  return html.replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(newTitle)}</title>`);
};

const setLink = (html, rel, newHref) => {
  const re = new RegExp(`(<link[^>]*\\brel="${rel}"[^>]*\\bhref=")[^"]*("[^>]*>)`, 'i');
  if (!re.test(html)) throw new Error(`prerender-meta: could not find <link rel="${rel}"> in dist/index.html`);
  return html.replace(re, `$1${escapeAttr(newHref)}$2`);
};

const renderPage = ({ title, description, url, image, ogType }) => {
  let html = baseHtml;
  html = setTitle(html, title);
  html = setMeta(html, 'name', 'description', description);
  html = setMeta(html, 'property', 'og:type', ogType);
  html = setMeta(html, 'property', 'og:url', url);
  html = setMeta(html, 'property', 'og:title', title);
  html = setMeta(html, 'property', 'og:description', description);
  html = setMeta(html, 'property', 'og:image', image);
  html = setMeta(html, 'name', 'twitter:url', url);
  html = setMeta(html, 'name', 'twitter:title', title);
  html = setMeta(html, 'name', 'twitter:description', description);
  html = setMeta(html, 'name', 'twitter:image', image);
  html = setLink(html, 'canonical', url);
  return html;
};

const writePage = (routeDir, html) => {
  const outDir = path.join(distDir, routeDir);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
};

// ── Journal feed ────────────────────────────────────────────────────────
writePage('journal', renderPage({
  title: 'Pantane Journal | Building. Learning. Creating. Sharing.',
  description: "Follow what I'm building, learning, and offering — projects, services, and updates from Pantane, permanently archived.",
  url: `${SITE_URL}/journal`,
  image: DEFAULT_OG_IMAGE,
  ogType: 'website',
}));

// ── Individual posts ────────────────────────────────────────────────────
for (const post of posts) {
  writePage(`journal/${post.slug}`, renderPage({
    title: `${post.title} — Pantane Journal`,
    description: post.excerpt,
    url: `${SITE_URL}/journal/${post.slug}`,
    image: post.image || DEFAULT_OG_IMAGE,
    ogType: 'article',
  }));
}

console.log(`Prerendered meta tags: journal feed + ${posts.length} post page(s)`);
