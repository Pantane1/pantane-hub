// Generates an RSS 2.0 feed from data/journal.json, written to public/rss.xml
// so Vite copies it into the build output as a static file. Runs as a
// prebuild step (see package.json) so it always reflects the current
// journal.json — including posts added via the admin panel — on every deploy.

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_URL = 'https://pantane.is-a.dev';

const posts = JSON.parse(
  readFileSync(path.join(__dirname, '..', 'data', 'journal.json'), 'utf8')
);

const escapeXml = (str) =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const sorted = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));
const buildDate = new Date().toUTCString();

const items = sorted
  .map((post) => {
    const url = `${SITE_URL}/journal/${post.slug}`;
    const pubDate = new Date(post.date).toUTCString();
    const contentHtml = post.content.map((p) => `<p>${escapeXml(p)}</p>`).join('');
    return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(post.category)}</category>
      <description>${escapeXml(post.excerpt)}</description>
      <content:encoded><![CDATA[${contentHtml}]]></content:encoded>
    </item>`;
  })
  .join('\n');

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Pantane Journal</title>
    <link>${SITE_URL}/journal</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Building. Learning. Creating. Sharing. — updates from Pantane on projects, learning, services, and what's shipping.</description>
    <language>en</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
${items}
  </channel>
</rss>
`;

const outPath = path.join(__dirname, '..', 'public', 'rss.xml');
writeFileSync(outPath, rss, 'utf8');
console.log(`RSS feed generated: ${sorted.length} posts -> public/rss.xml`);
