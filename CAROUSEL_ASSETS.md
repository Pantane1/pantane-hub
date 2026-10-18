# Hero carousel images

The 7 slides in `public/assets/pantane-carousel/` are **original SVG
illustrations** (not photos), referenced by `components/HeroCarousel.tsx`:

`01-pantane.svg` · `02-building.svg` · `03-ai.svg` · `04-kenya-tech.svg` ·
`05-projects.svg` · `06-cloud.svg` · `07-personal.svg`

They are 3:4 portrait (900×1200) to match the hero container. The bottom
~28% is intentionally left quiet because the component overlays the slide
label and dots there.

**Swapping in real photos later:** put a `.jpg`/`.webp` (3:4, ideally
≥900×1200, compressed) in the same folder and change that slide's `src`
extension in `SLIDES` inside `HeroCarousel.tsx`. If a file fails to load the
slide falls back to a themed gradient + icon automatically, so nothing breaks.
