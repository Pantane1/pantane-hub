# SEO — Pantane Hub

Documentation for the SEO work done on this repo. Read this before changing
any metadata, structured data, or the build scripts under `scripts/` —
several pieces depend on each other (see "Architecture" below).

## Primary objective

Make `pantane.is-a.dev` the clear, consistent, legitimate entity signal for
the search term **"Pantane"** — someone searching "Pantane", "Pantane
Kenya", "Pantane developer", "PantaneHub" etc. should find this site, and
search engines should have consistent signals that Pantane = the person
behind it. This is a foundation, not a ranking guarantee — see
"What's outside the codebase" at the bottom.

## Architecture

This is a client-rendered SPA (Vite + React Router, no SSR). That has one
consequence that shapes everything else here: **most link-preview and some
search bots don't execute JavaScript**, so anything set only via
`document.title` / `useEffect` is invisible to them. The fix used
throughout: a **static prerender step** that writes real
`dist/<route>/index.html` files with correct tags baked in, generated from
the exact same content the React app uses client-side, so the two can never
drift apart.

```
data/pageSeo.js          <- single source of truth for static-page SEO copy
                             (title/description/path per route)
hooks/useSeo.ts           <- client-side: sets document.title, meta tags,
                              canonical on mount, restores previous values
                              on unmount. Used by every page component.
scripts/prerender-meta.js <- build-time: clones dist/index.html (the built
                              app shell) once per route, swaps only the
                              <head> tags, writes dist/<route>/index.html
scripts/generate-sitemap.js -> public/sitemap.xml (prebuild)
scripts/generate-rss.js     -> public/rss.xml (prebuild)
```

Build order (`package.json`):
`generate-rss.js` → `generate-sitemap.js` → `vite build` → `prerender-meta.js`

`data/journal.json` (edited via `/admin/journal`) is the source for
Journal post SEO — RSS, sitemap, and per-post prerendering all read it
directly, so publishing a post through the admin panel keeps all three in
sync automatically on the next deploy.

### Why static files, not a `vercel.json` change

Two confirmed Vercel behaviors made this possible without touching routing
config: static files take precedence over the catch-all SPA rewrite, and a
directory's `index.html` is served for a no-trailing-slash request to that
directory by default. So `dist/projects/index.html` is served directly for
a request to `/projects`, and only genuinely unmatched paths fall through
to the rewrite → `index.html` → client-side router → `NotFound`.

### The app shell is untouched

Every generated file is a copy of the *exact same* built `dist/index.html`
— same hashed script/style tags, same `#root` div — with only the `<head>`
meta tags swapped. Verified byte-identical across all generated pages.
Real visitors always get the same interactive SPA; only what a
non-JS crawler sees in the raw HTML differs by route.

## Canonical strategy

- Homepage canonical: `https://pantane.is-a.dev/` (no trailing-slash
  variants, no `www.`, no query strings indexed)
- Every other page's canonical is its own clean path
  (`https://pantane.is-a.dev/projects`, etc.) — set both in the prerendered
  static HTML and reinforced client-side by `useSeo` during SPA navigation
- `/admin/journal` is excluded from the sitemap and disallowed in
  `robots.txt` — it's functional, not content
- Unmatched URLs render a dedicated `NotFound` page (`pages/NotFound.tsx`)
  with `robots: noindex, follow`, instead of the previous behavior of
  silently rendering Home content under an arbitrary URL (a real duplicate-
  content risk this replaces)

## Page titles & descriptions

All in `data/pageSeo.js`. Deliberately unique per page, no keyword
stuffing:

| Route | Title |
|---|---|
| `/` | Pantane — Software Developer \| Full-Stack, Cloud & Automation |
| `/projects` | Projects — Pantane \| Full-Stack & Automation Work |
| `/journal` | Pantane Journal \| Building. Learning. Creating. Sharing. |
| `/socials` | Connect with Pantane \| Socials & Contact Channels |
| `/contact` | Contact Pantane \| Software Developer, Kenya |
| `/support` | Support Pantane \| Back the Work |
| `/journal/:slug` | `<post title>` — Pantane Journal |

**Note on `jobTitle`:** the task brief suggested "Software Engineer" as an
example. The site's existing copy consistently says "Software Developer"
(index.html's original title, Home.tsx's hero copy, etc.), so I kept that
term everywhere new for entity consistency — introducing a second,
unverified job-title variant would work against the primary objective
(consistent signals) rather than for it. Easy to change globally in
`data/pageSeo.js` + the JSON-LD block in `index.html` if you'd rather use
"Engineer."

## Structured data (JSON-LD)

In `index.html`, inherited automatically by every prerendered page since
they're all copies of that file:

- **Person** (`Pantane`) — `jobTitle`, `knowsAbout` (exactly the list given
  in the task brief — nothing invented), `address.addressCountry: "KE"`
  (country-level only, not a fabricated street address), `sameAs`
- **WebSite** (`Pantane Hub`) — linked to the Person as author

No employer, no awards, no clients, no qualifications were invented —
brief explicitly asked for that and I didn't add anything not verifiable
from the site or the brief itself.

### `sameAs` — verified and consistent

Confirmed by the site owner as the current, correct accounts:

- GitHub: `https://github.com/Pantane1`
- LinkedIn: `https://linkedin.com/in/wn-martin`
- Instagram: `https://instagram.com/_pantane_`
- Telegram: `https://t.me/pantane`

These now match everywhere they appear, so the structured data and the
visible site agree: the JSON-LD in `index.html`, the Socials page, the
header LinkedIn icon, the Journal post "Also posted on" icons, and PH-Bot's
built-in knowledge (so the chatbot gives visitors the right links). Telegram
was added as a new card on the Socials page and as a `telegram` option in
the Journal admin form.

If any of these handles change in future, update all of those places
together — a mismatch between schema and visible links weakens the
"consistent identity" signal this whole setup exists to send. A quick
repo-wide search for the old handle is the safest way to catch every spot.

## Image SEO

- Profile image alt text: `"Pantane, software developer"` (was bare
  `"Pantane"`) — descriptive, not stuffed
- Journal card/post images, project thumbnails: already had reasonable alt
  text and `loading="lazy"` / `decoding="async"`; left as-is
- OG/Twitter image: reuses the existing favicon asset
  (`raw.githubusercontent.com/.../favcon.png`) — it's a real, already-live
  asset, not fabricated. **It's a small square favicon, not an ideal
  1200×630 social card image.** For stronger link previews, create a
  proper 1200×630 OG image and swap the `og:image`/`twitter:image` values
  in `index.html` + `data/pageSeo.js` (used by `useSeo` as the default).

## robots.txt / sitemap.xml

Both already existed from earlier work and needed no structural changes:

- `public/robots.txt` — disallows only `/admin`, allows everything else,
  points to the sitemap
- `public/sitemap.xml` — generated at build time from static routes +
  `journal.json`, 16 URLs as of this pass, HTTPS canonical URLs only, no
  query strings, no `/admin`

## Google Search Console / Bing Webmaster Tools

**Google:** already partially done — `index.html` has had a
`google-site-verification` meta tag in place from before this pass
(`KbCXt0s5b_YILP91qNEwmKEDJgLu8k39fTx8zY-anNU`). If that's already
connected in Search Console, nothing more to do beyond submitting
`https://pantane.is-a.dev/sitemap.xml` under Sitemaps once this deploys.
If it's not yet connected, add the property in Search Console and it
should verify immediately against the existing tag.

**Bing:** no verification file/tag exists yet. After deploying:
1. Go to Bing Webmaster Tools → Add a site → `https://pantane.is-a.dev`
2. Bing supports importing directly from an already-verified Google Search
   Console property (fastest path, given Google's already set up) — or use
   the meta-tag method, which means adding a `bing-site-verification` meta
   tag I don't have a token for
3. Submit `https://pantane.is-a.dev/sitemap.xml`

I can't complete either of these myself — they require a token/action tied
to your accounts.

## Performance notes (light touch, no redesign)

Reviewed, not overhauled — the brief asked not to sacrifice the existing
UI:

- Fonts already load via a single Google Fonts `<link>` with
  `display=swap` (no FOIT)
- Images already use `loading="lazy"` / `decoding="async"` where
  appropriate (Journal cards, post images, project thumbnails)
- Production JS bundle: ~131 KB gzipped — reasonable for a SPA of this
  size, no new heavy dependencies added by this SEO pass
- No render-blocking third-party scripts added
- Didn't touch animations/transitions — they're CSS-based already, not a
  Core Web Vitals concern here

Nothing here needed a structural performance fix; the existing setup was
already reasonable.

## Ongoing content strategy

The Journal is the intended long-term organic channel:

- Every post gets its own canonical URL, unique title/description, static
  prerendered meta tags, `article` structured type in OG tags, and an RSS
  entry — automatically, the moment it's published via `/admin/journal`
- No fake posts were generated for this task — the existing 11 Journal
  posts are the real content driving this
- Recommendation: consistency matters more than volume for this kind of
  entity SEO — a steady cadence of real posts naturally mentioning
  "Pantane," the projects, and the work does more than any one-time
  technical pass

## What's outside the codebase

Being direct, as asked: nothing in this repo can guarantee rankings.
Outside my control from here:

- **Indexing time** — Google/Bing need to crawl and index the deploy;
  can take days to weeks
- **Backlinks** — external sites linking to `pantane.is-a.dev` matter a
  lot for entity authority; none of this technical work creates those
- **Search demand** — how many people actually search "Pantane" at all
- **Domain history/age** — a newer domain has less inherent trust
- **Algorithm behavior** — how any given engine weighs these signals
  changes over time and isn't something a codebase controls

This pass builds the strongest legitimate technical/semantic foundation
achievable in the codebase. The rest is time, content, and external
signals.
