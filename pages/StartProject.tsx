import React from 'react';
import { useSearchParams } from 'react-router-dom';
import ProjectInquiryForm from '../components/ProjectInquiryForm';
import { WhatsAppButton } from '../components/CtaButtons';
import { serviceCategories } from '../data/services';
import { useSeo } from '../hooks/useSeo';
import { pageSeo } from '../data/pageSeo';

const StartProject: React.FC = () => {
  useSeo(pageSeo.startProject);
  const [params] = useSearchParams();
  const wanted = params.get('service');
  const preselect = serviceCategories.find(c => c.id === wanted)?.name || '';

  return (
    <div className="fade-in mx-auto max-w-5xl space-y-12">
      <div className="max-w-2xl">
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-brand-primary">Start a Project</p>
        <h1 className="mb-5 text-4xl font-extrabold leading-tight text-brand-navy md:text-5xl" style={{ fontFamily: 'Syne, sans-serif' }}>
          Tell me what you need.
        </h1>
        <p className="text-lg leading-relaxed text-slate-600">
          Share a few details about your project and I'll review them and get back to you with the next steps and a quote based on the scope.
        </p>
      </div>

      <div className="grid items-start gap-10 lg:grid-cols-[1.5fr_1fr]">
        <ProjectInquiryForm key={preselect} initialService={preselect} />

        <aside className="space-y-6 lg:sticky lg:top-28" aria-label="What happens next">
          <div className="space-y-4 rounded-3xl bg-brand-navy p-7 text-white" data-surface="dark">
            <h2 className="text-sm font-bold uppercase tracking-widest text-brand-rose">What happens next</h2>
            <ol className="space-y-4 text-sm leading-relaxed text-slate-200">
              <li><span className="font-bold text-white">1. I review it.</span> I read your inquiry and check it against what I can deliver.</li>
              <li><span className="font-bold text-white">2. We clarify.</span> I contact you by email or WhatsApp with any questions.</li>
              <li><span className="font-bold text-white">3. You get a quote.</span> Priced on the actual scope — not a fixed price list.</li>
            </ol>
          </div>
          <div className="space-y-3 rounded-3xl border border-brand-navy/10 bg-white p-7">
            <p className="text-sm font-bold text-brand-navy">Prefer to chat first?</p>
            <p className="text-sm text-slate-600">You can message me directly instead of filling in the form.</p>
            <WhatsAppButton />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default StartProject;
