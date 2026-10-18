# Sharp deal thumbnails

Each deal in `data/sharp.json` has a `thumbnail` path. The current files in
`public/assets/sharp-deals/` are **original SVG illustrations** (16:9,
1280×720), one per deal slug:

| Deal slug | File |
|---|---|
| `heist-attack` | `heist-attack.svg` |
| `loop-kyc` | `loop-kyc.svg` |
| `buy-social-accounts` | `buy-social-accounts.svg` |
| `international-numbers` | `international-numbers.svg` |
| `uber-eats-promo` | `uber-eats-promo.svg` |

They use provider colors and plain-text names only, with no logo artwork and
no invented figures (the Uber Eats one deliberately shows no amount).

**Swapping in a real image:** drop a 16:9 `.jpg`/`.webp` here and change the
deal's `thumbnail` extension in `data/sharp.json` (or edit it in `/admin/sharp`).
If a thumbnail ever fails to load, the card falls back to a themed gradient.

**Link previews:** social platforms don't render SVG, so a deal's `og:image`
uses the site default until its `thumbnail` is a raster image (`.jpg`, `.png`
or `.webp`), at which point it is emitted as an absolute URL automatically.

**Adding a new deal:** add one object to `data/sharp.json` (or use `/admin/sharp`).
