import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { serviceCategories, processSteps } from '../data/services';
import { QuoteButton, WhatsAppButton } from '../components/CtaButtons';
import { useSeo } from '../hooks/useSeo';
import { pageSeo } from '../data/pageSeo';
import { SITE_URL } from '../data/pageSeo';

const Services: React.FC = () => {
  useSeo(pageSeo.services);

  // Structured data generated from the same catalogue the page renders, so the two can't drift.
  useEffect(() => {
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = 'services-jsonld';
    el.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': serviceCategories.map(c => ({
        '@type': 'Service',
        name: c.name,
        description: c.description,
        serviceType: c.services,
        url: `${SITE_URL}/services#${c.id}`,
        provider: { '@id': `${SITE_URL}/#person` },
        areaServed: { '@type': 'Country', name: 'Kenya' },
      })),
    });
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  return (
    <div className="fade-in mx-auto max-w-5xl space-y-16">
      {/* Hero */}
      <header className="max-w-3xl">
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-brand-primary">Services</p>
        <h1 className="mb-5 text-4xl font-extrabold leading-tight text-brand-navy md:text-5xl" style={{ fontFamily: 'Syne, sans-serif' }}>
          What I can build for you.
        </h1>
        <p className="mb-7 text-lg leading-relaxed text-slate-600">
          Websites, custom applications, payment integrations and AI automation — for businesses and individuals across Kenya.
          Every project is scoped and quoted individually.
        </p>
        <div className="flex flex-wrap gap-3">
          <QuoteButton />
          <WhatsAppButton />
        </div>
        <nav aria-label="Service categories" className="mt-8 flex flex-wrap gap-2">
          {serviceCategories.map(c => (
            <a key={c.id} href={`#${c.id}`} className="rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-brand-primary hover:text-white">
              {c.icon} {c.name}
            </a>
          ))}
        </nav>
      </header>

      {/* Categories */}
      <div className="space-y-8">
        {serviceCategories.map(c => (
          <section key={c.id} id={c.id} aria-labelledby={`${c.id}-title`} className="scroll-mt-28 rounded-[2rem] border border-brand-navy/10 bg-white p-7 shadow-sm md:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-rose/20 text-2xl" aria-hidden="true">{c.icon}</div>
                <h2 id={`${c.id}-title`} className="text-2xl font-extrabold text-brand-navy md:text-3xl" style={{ fontFamily: 'Syne, sans-serif' }}>{c.name}</h2>
                <p className="text-sm font-bold leading-relaxed text-brand-primary">{c.problem}</p>
                <p className="leading-relaxed text-slate-600">{c.description}</p>
                <ul className="flex flex-wrap gap-2 pt-1" aria-label="Technologies">
                  {c.technologies.map(t => (
                    <li key={t} className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">{t}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">What I offer</h3>
                  <ul className="space-y-2 text-sm text-slate-700">
                    {c.services.map(s => <li key={s} className="flex gap-2"><span className="text-brand-primary" aria-hidden="true">▸</span>{s}</li>)}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Typical deliverables</h3>
                  <ul className="space-y-2 text-sm text-slate-700">
                    {c.deliverables.map(d => <li key={d} className="flex gap-2"><span className="text-brand-rose" aria-hidden="true">✓</span>{d}</li>)}
                  </ul>
                </div>
                {c.relatedProjects.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Related work</h3>
                    <ul className="space-y-1.5 text-sm">
                      {c.relatedProjects.map(p => (
                        <li key={p.url}><a href={p.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-primary hover:underline">{p.name} ↗</a></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-100 pt-6">
              <QuoteButton serviceId={c.id} label={`Request a quote`} />
              <WhatsAppButton message={`Hi Pantane, I'm interested in "${c.name}" and I'd like to discuss a project.`} label="Ask on WhatsApp" />
            </div>
          </section>
        ))}
      </div>

      {/* Process */}
      <section aria-labelledby="process-title">
        <h2 id="process-title" className="mb-6 text-xs font-bold uppercase tracking-widest text-slate-500">How we'd work together</h2>
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {processSteps.map(s => (
            <li key={s.n} className="rounded-3xl border border-brand-navy/10 bg-white p-6">
              <p className="mb-3 text-xs font-extrabold tracking-widest text-brand-rose">{s.n}</p>
              <h3 className="mb-2 text-lg font-bold text-brand-navy" style={{ fontFamily: 'Syne, sans-serif' }}>{s.title}</h3>
              <p className="text-sm leading-relaxed text-slate-600">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Pricing guidance — honest: no list prices */}
      <section aria-labelledby="pricing-title" className="rounded-[2rem] bg-brand-navy p-8 text-white md:p-12" data-surface="dark">
        <h2 id="pricing-title" className="mb-3 text-2xl font-extrabold md:text-3xl" style={{ fontFamily: 'Syne, sans-serif' }}>How pricing works</h2>
        <p className="mb-6 max-w-2xl leading-relaxed text-slate-300">
          There's no fixed price list, because no two projects are the same. Tell me what you need and your rough budget, and I'll send a quote based on the actual scope.
          The budget ranges on the inquiry form are just to help me understand what you have in mind — they aren't prices.
        </p>
        <div className="flex flex-wrap gap-3">
          <QuoteButton label="Start a Project" className="!bg-brand-rose !text-brand-navy hover:!bg-white" />
          <Link to="/projects" className="inline-flex items-center rounded-2xl border border-white/30 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10">View My Work</Link>
        </div>
      </section>
    </div>
  );
};

export default Services;
