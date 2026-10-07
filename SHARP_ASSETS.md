# Sharp deal thumbnails

Drop thumbnail images into `public/assets/sharp-deals/`, named to match each
deal's `slug` (see `data/sharp.json`), then set that path as the deal's
`thumbnail` field.

Current deals:

| Deal slug | Expected file |
|---|---|
| `heist-attack` | `public/assets/sharp-deals/heist-attack.jpg` |
| `loop-kyc` | `public/assets/sharp-deals/loop-kyc.jpg` |
| `buy-social-accounts` | `public/assets/sharp-deals/buy-social-accounts.jpg` |
| `international-numbers` | `public/assets/sharp-deals/international-numbers.jpg` |
| `uber-eats-promo` | `public/assets/sharp-deals/uber-eats-promo.jpg` |

Note: the task brief for the account-buying and international-number deals
suggested `/sharp/social-accounts.jpg` and `/sharp/international-numbers.jpg`
as the asset paths. Used the existing `/assets/sharp-deals/<slug>.jpg`
convention instead, to stay consistent with Absa/Loop and this doc rather
than introduce a second, differently-located asset folder for the same kind
of thing.

**Specs:**
- Aspect ratio: 16:9 — matches the card/detail thumbnail container exactly
- `.webp` works too — just update the extension in `data/sharp.json`'s
  `thumbnail` field for that deal
- Keep it reasonably optimized/compressed

**Until a real file is placed here:** every deal card and detail page shows
a themed gradient placeholder (⚡ icon on a navy/blue/emerald gradient)
instead of a broken image — this is the current state, since no image
files exist yet. Add the file at the path above and it takes over
automatically, no code changes needed. This is the same fallback pattern
used by the homepage hero carousel (see `CAROUSEL_ASSETS.md`).

**Adding a new Sharp deal later:** add one object to `data/sharp.json`
(see the existing `heist-attack` entry for the shape) and, if you want a
real thumbnail, drop the matching image in here. No component needs to
change — the feed, filters, featured card, sitemap, prerendering, and
detail page all read directly from that JSON file.
