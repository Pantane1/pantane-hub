# Hero carousel images

Drop the 7 real image files into `public/assets/pantane-carousel/` with
these exact names (referenced directly by `components/HeroCarousel.tsx`):

| File | Slide |
|---|---|
| `01-pantane.jpg` | Pantane — Software Engineer |
| `02-building.jpg` | Building • Shipping • Learning |
| `03-ai.jpg` | AI • Automation • ML |
| `04-kenya-tech.jpg` | Kenya • Africa • Tech |
| `05-projects.jpg` | Projects I've Built |
| `06-cloud.jpg` | Full-Stack • Cloud |
| `07-personal.jpg` | Just a Guy |

**Specs:**
- Aspect ratio: 3:4 (portrait) — matches the existing hero image container
  exactly, so nothing shifts
- Recommended size: at least 900×1200px so it stays sharp at the container's
  max width
- `.webp` works too — if you use it, just update the extension in
  `SLIDES[].src` in `components/HeroCarousel.tsx`
- Keep individual files reasonably optimized (compress before adding) so the
  homepage doesn't take on a heavy image payload — 7 slides load together

**Until real files are placed here:** the carousel is fully functional right
now — it rotates, the dots work, hover-to-pause works — but each slide shows
a themed placeholder (a gradient + icon) instead of a photo, since no
individual image files existed yet at the time this was built (only a
7-panel composite reference was provided, and the brief was explicit that it
should not be auto-cropped into runtime images or replaced with stock
photos). Add the files above and the real images take over automatically —
no code changes needed.
