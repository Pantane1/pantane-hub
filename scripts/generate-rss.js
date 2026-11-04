// Generates an RSS 2.0 feed from data/journal.json + data/sharp.json,
// written to public/rss.xml so Vite copies it into the build output. Runs
// as a prebuild step (see package.json) so it always reflects current
// content — including posts/deals added via the admin panels — on every
// deploy. Journal posts and Sharp deals are merged into one feed, sorted
// by date, each tagged with its own <category> so feed readers can filter
// (Journal entries keep their own category e.g. "Blog"; Sharp deals are
// tagged "Sharp" plus their own category, and their titles are prefixed
// "[Sharp]" for readers that don't surface <category> prominently).

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

const escapeXml = (str) =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

// Mirrors the dealHeadline() fallback used client-side and in prerender-meta.js.
const dealHeadline = (deal) => deal.cardHeadline || (deal.reward ? `Get ${deal.reward}` : deal.title);

const journalItems = posts.map((post) => {
  const url = `${SITE_URL}/journal/${post.slug}`;
  const contentHtml = post.content.map((p) => `<p>${escapeXml(p)}</p>`).join('');
  return {
    date: post.date,
    xml: `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <category>${escapeXml(post.category)}</category>
      <description>${escapeXml(post.excerpt)}</description>
      <content:encoded><![CDATA[${contentHtml}]]></content:encoded>
    </item>`,
  };
});

const sharpItems = deals.map((deal) => {
  const url = `${SITE_URL}/sharp/${deal.slug}`;
  const stepsHtml = deal.steps?.length
    ? `<ol>${deal.steps.map((s) => `<li>${escapeXml(s)}</li>`).join('')}</ol>`
    : '';
  const contentHtml = `<p>${escapeXml(deal.whatYouGet)}</p>${stepsHtml}`;
  return {
    date: deal.datePosted,
    xml: `    <item>
      <title>${escapeXml(`[Sharp] ${deal.title} — ${dealHeadline(deal)}`)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(deal.datePosted).toUTCString()}</pubDate>
      <category>Sharp</category>
      <category>${escapeXml(deal.category)}</category>
      <description>${escapeXml(deal.description)}</description>
      <content:encoded><![CDATA[${contentHtml}]]></content:encoded>
    </item>`,
  };
});

const allItems = [...journalItems, ...sharpItems].sort((a, b) => new Date(b.date) - new Date(a.date));
const buildDate = new Date().toUTCString();
const items = allItems.map((i) => i.xml).join('\n');

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Pantane Journal &amp; Sharp</title>
    <link>${SITE_URL}/journal</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Building. Learning. Creating. Sharing. — updates from Pantane on projects, learning, services, and what's shipping, plus new Sharp deals and opportunities.</description>
    <language>en</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
${items}
  </channel>
</rss>
`;

const outPath = path.join(__dirname, '..', 'public', 'rss.xml');
writeFileSync(outPath, rss, 'utf8');
console.log(`RSS feed generated: ${posts.length} journal post(s) + ${deals.length} Sharp deal(s) -> public/rss.xml`);
