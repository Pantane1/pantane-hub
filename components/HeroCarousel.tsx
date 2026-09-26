import React, { useEffect, useRef, useState } from 'react';

interface CarouselSlide {
  id: string;
  src: string;
  alt: string;
  label: string;
  index: string;
  /** Tailwind gradient classes used only if the real image at `src` fails to load. */
  gradient: string;
  icon: string;
}

const SLIDES: CarouselSlide[] = [
  {
    id: 'pantane',
    src: '/assets/pantane-carousel/01-pantane.jpg',
    alt: 'Pantane, software developer',
    label: 'PANTANE — SOFTWARE ENGINEER',
    index: '01 / 07',
    gradient: 'from-slate-900 to-slate-700',
    icon: '👨\u200d💻',
  },
  {
    id: 'building',
    src: '/assets/pantane-carousel/02-building.jpg',
    alt: 'Developer workspace with a laptop and code editor',
    label: 'BUILDING • SHIPPING • LEARNING',
    index: '02 / 07',
    gradient: 'from-slate-900 to-blue-900',
    icon: '💻',
  },
  {
    id: 'ai',
    src: '/assets/pantane-carousel/03-ai.jpg',
    alt: 'AI and machine learning visualization',
    label: 'AI • AUTOMATION • ML',
    index: '03 / 07',
    gradient: 'from-blue-950 to-indigo-800',
    icon: '🧠',
  },
  {
    id: 'kenya',
    src: '/assets/pantane-carousel/04-kenya-tech.jpg',
    alt: 'Kenyan skyline representing technology in Africa',
    label: 'KENYA • AFRICA • TECH',
    index: '04 / 07',
    gradient: 'from-emerald-900 to-slate-900',
    icon: '🌍',
  },
  {
    id: 'projects',
    src: '/assets/pantane-carousel/05-projects.jpg',
    alt: "Showcase of Pantane's software projects",
    label: "PROJECTS I'VE BUILT",
    index: '05 / 07',
    gradient: 'from-zinc-900 to-amber-900',
    icon: '🚀',
  },
  {
    id: 'cloud',
    src: '/assets/pantane-carousel/06-cloud.jpg',
    alt: 'Cloud infrastructure and deployment pipeline',
    label: 'FULL-STACK • CLOUD',
    index: '06 / 07',
    gradient: 'from-slate-900 to-cyan-900',
    icon: '☁️',
  },
  {
    id: 'personal',
    src: '/assets/pantane-carousel/07-personal.jpg',
    alt: 'Pantane outside of work — a personal moment',
    label: 'JUST A GUY',
    index: '07 / 07',
    gradient: 'from-indigo-950 to-slate-900',
    icon: '✨',
  },
];

const ROTATE_MS = 4500;

/**
 * Occupies the same image container the hero previously used for a single
 * static <img> — this component fills that container (w-full h-full),
 * the outer aspect-ratio/rounded/border/shadow wrapper in Home.tsx is
 * untouched, so the hero layout doesn't shift.
 */
const HeroCarousel: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [erroredSlides, setErroredSlides] = useState<Record<number, boolean>>({});
  const [reducedMotion, setReducedMotion] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Auto-advance. Depends on [paused, resetKey] so hovering pauses/resumes
  // it, and clicking a dot restarts the countdown from that point rather
  // than firing early or having two timers stack up.
  useEffect(() => {
    if (paused) return;
    intervalRef.current = setInterval(() => {
      setActiveIndex(i => (i + 1) % SLIDES.length);
    }, ROTATE_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, resetKey]);

  const goTo = (i: number) => {
    setActiveIndex(i);
    setResetKey(k => k + 1);
  };

  const handleImageError = (i: number) => {
    setErroredSlides(prev => (prev[i] ? prev : { ...prev, [i]: true }));
  };

  return (
    <div
      className="relative w-full h-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Pantane — a visual introduction"
    >
      {SLIDES.map((slide, i) => {
        const isActive = i === activeIndex;
        const errored = erroredSlides[i];
        const style: React.CSSProperties = reducedMotion
          ? { opacity: isActive ? 1 : 0, transition: 'opacity 200ms linear' }
          : {
              opacity: isActive ? 1 : 0,
              transform: isActive ? 'scale(1.03)' : 'scale(1)',
              transitionProperty: 'opacity, transform',
              transitionDuration: '800ms, 4500ms',
              transitionTimingFunction: 'ease-out, ease-out',
            };

        return (
          <div key={slide.id} className="absolute inset-0" style={style} aria-hidden={!isActive}>
            {!errored ? (
              <img
                src={slide.src}
                alt={slide.alt}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                onError={() => handleImageError(i)}
                className="w-full h-full object-cover"
              />
            ) : (
              // Real asset not present yet — see public/assets/pantane-carousel/README.md
              <div className={`w-full h-full bg-gradient-to-br ${slide.gradient} flex items-center justify-center`}>
                <span className="text-5xl opacity-90" aria-hidden="true">{slide.icon}</span>
              </div>
            )}
          </div>
        );
      })}

      {/* Bottom scrim so the label overlay stays legible over any image */}
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

      {/* Slide label overlay — subtle, bottom-left, contained to this image only */}
      <div className="absolute bottom-9 left-4 right-4 text-white pointer-events-none">
        <p className="text-[10px] font-bold tracking-widest text-amber-300/90">{SLIDES[activeIndex].index}</p>
        <p className="text-xs font-bold tracking-wide mt-0.5 truncate">{SLIDES[activeIndex].label}</p>
      </div>

      {/* Indicators */}
      <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2" role="tablist" aria-label="Choose a slide">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            role="tab"
            aria-selected={i === activeIndex}
            aria-label={`Slide ${i + 1} of ${SLIDES.length}: ${slide.label}`}
            onClick={() => goTo(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              i === activeIndex ? 'bg-amber-400 scale-125' : 'bg-white/40 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
