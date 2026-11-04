import React, { Suspense } from 'react';
import { serviceArea } from '../data/serviceArea';

// Leaflet is ~40 KB gzipped; load it only when the Contact page is visited.
const KenyaServiceMap = React.lazy(() => import('./KenyaServiceMap'));

/** Same dimensions as the live map, so nothing shifts while it loads. */
const MAP_FRAME = 'relative h-[320px] sm:h-[380px] lg:h-[460px] w-full';

const jumpToForm = (e: React.MouseEvent<HTMLAnchorElement>) => {
  const form = document.getElementById('contact-form');
  if (!form) return; // fall back to the plain #contact-form anchor
  e.preventDefault();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  form.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  window.setTimeout(() => form.querySelector<HTMLElement>('input, textarea')?.focus({ preventScroll: true }), reduced ? 0 : 450);
};

const ServiceAreaSection: React.FC = () => (
  <section
    aria-labelledby="service-area-heading"
    className="grid lg:grid-cols-[1fr_1.25fr] gap-8 lg:gap-10 items-center bg-white rounded-[2rem] border border-brand-navy/10 shadow-xl p-6 md:p-10"
  >
    <div className="space-y-5">
      <span className="inline-flex items-center gap-2 rounded-full bg-brand-rose/20 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-brand-burgundy">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" aria-hidden="true" />
        {serviceArea.label}
      </span>

      <h2 id="service-area-heading" className="text-3xl md:text-4xl font-extrabold text-brand-navy leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
        {serviceArea.heading}
      </h2>

      <p className="text-slate-600 leading-relaxed">{serviceArea.description}</p>

      <div className="flex flex-wrap gap-3 pt-1">
        <a
          href="#contact-form"
          onClick={jumpToForm}
          className="inline-flex items-center rounded-2xl bg-brand-primary px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-burgundy"
        >
          Get in Touch
        </a>
        <a
          href={serviceArea.googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-2xl border border-brand-navy/20 px-6 py-3 text-sm font-bold text-brand-navy transition-colors hover:border-brand-primary hover:text-brand-primary"
        >
          View Kenya on Google Maps <span className="ml-1.5" aria-hidden="true">↗</span>
        </a>
      </div>

      <p className="text-xs leading-relaxed text-slate-500">{serviceArea.disclaimer}</p>
    </div>

    <div className={`${MAP_FRAME} overflow-hidden rounded-2xl border border-brand-navy/10 bg-slate-100`}>
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center text-sm font-medium text-slate-500" role="status">
            Loading map…
          </div>
        }
      >
        <KenyaServiceMap />
      </Suspense>
    </div>
  </section>
);

export default ServiceAreaSection;
