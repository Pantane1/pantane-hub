import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GithubIcon } from './Icons';
import {
  openingAdContent as c,
  openingAdVideo,
} from '../data/openingAd';

/* ─── Fake code editor mock ──────────────────────────────────────────────── */
const CODE_LINES: { indent?: number; parts: { text: string; c: string }[] }[] = [
  { parts: [{ text: 'export', c: 'text-blue-400' }, { text: ' const ', c: 'text-slate-300' }, { text: 'Pantane', c: 'text-cyan-300' }, { text: ' = () => {', c: 'text-slate-400' }] },
  { indent: 1, parts: [{ text: 'return', c: 'text-blue-400' }, { text: ' {', c: 'text-slate-400' }] },
  { indent: 2, parts: [{ text: 'builds:', c: 'text-cyan-300' }, { text: " 'projects, apis, ai',", c: 'text-emerald-300' }] },
  { indent: 2, parts: [{ text: 'ships:', c: 'text-cyan-300' }, { text: ' true,', c: 'text-amber-300' }] },
  { indent: 2, parts: [{ text: 'journal:', c: 'text-cyan-300' }, { text: " '/journal',", c: 'text-emerald-300' }] },
  { indent: 1, parts: [{ text: '};', c: 'text-slate-400' }] },
  { parts: [{ text: '};', c: 'text-slate-400' }] },
];

const CodeEditorMock: React.FC<{ compact?: boolean }> = ({ compact }) => (
  <div className="rounded-2xl bg-black/50 border border-white/10 overflow-hidden backdrop-blur-sm">
    <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/10 bg-white/5">
      <span className="w-2.5 h-2.5 rounded-full bg-rose-400/70" />
      <span className="w-2.5 h-2.5 rounded-full bg-amber-300/70" />
      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
      <span className="ml-3 text-[10px] text-slate-400 font-mono">pantane-hub.tsx</span>
    </div>
    <pre className={`font-mono leading-relaxed p-4 overflow-hidden ${compact ? 'text-[10px]' : 'text-xs'}`}>
      {CODE_LINES.map((line, i) => (
        <div key={i} style={{ paddingLeft: `${(line.indent || 0) * 1.1}em` }}>
          {line.parts.map((p, j) => <span key={j} className={p.c}>{p.text}</span>)}
        </div>
      ))}
    </pre>
  </div>
);

const TerminalMock: React.FC = () => (
  <div className="rounded-2xl bg-black/50 border border-white/10 overflow-hidden backdrop-blur-sm">
    <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/10 bg-white/5">
      <span className="w-2.5 h-2.5 rounded-full bg-rose-400/70" />
      <span className="w-2.5 h-2.5 rounded-full bg-amber-300/70" />
      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
      <span className="ml-3 text-[10px] text-slate-400 font-mono">terminal</span>
    </div>
    <div className="p-4 font-mono text-[11px] space-y-1.5">
      {c.terminalLines.map((line, i) => (
        <div key={i} className={line.type === 'command' ? 'text-cyan-300' : 'text-emerald-400'}>
          {line.type === 'command' ? '$ ' : '✓ '}{line.text}
        </div>
      ))}
      <div className="text-slate-400 flex items-center gap-1">$ <span className="ad-blink">▍</span></div>
    </div>
  </div>
);

const FloatingCard: React.FC<{ label: string; sub: string; className?: string; delay?: string }> = ({ label, sub, className = '', delay = '0s' }) => (
  <div
    className={`ad-float absolute bg-white/[0.07] backdrop-blur-md border border-white/10 rounded-xl px-3.5 py-2.5 shadow-xl ${className}`}
    style={{ animationDelay: delay }}
  >
    <p className="text-white text-[11px] font-bold whitespace-nowrap">{label}</p>
    <p className="text-cyan-300/80 text-[9px] font-medium whitespace-nowrap">{sub}</p>
  </div>
);

const TechRow: React.FC = () => (
  <div className="flex items-center gap-4 pt-1">
    {c.techSlugs.map(slug => (
      <img
        key={slug}
        src={`https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/${slug}.svg`}
        alt=""
        loading="lazy"
        className="w-4 h-4 opacity-40 invert"
      />
    ))}
  </div>
);

/* ─── Main visual composition (desktop) ──────────────────────────────────── */
const VisualComposition: React.FC = () => (
  <div className="relative hidden lg:flex flex-col gap-4 items-center justify-center h-full min-h-[420px] px-6">
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="ad-glow w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
    </div>

    <div className="relative z-10 w-full max-w-sm space-y-4">
      <CodeEditorMock />
      <TerminalMock />
      <TechRow />
    </div>

    <FloatingCard label={c.floatingCards[0].label} sub={c.floatingCards[0].sub} className="top-2 -left-2" delay="0s" />
    <FloatingCard label={c.floatingCards[1].label} sub={c.floatingCards[1].sub} className="top-10 -right-4" delay="0.6s" />
    <FloatingCard label={c.floatingCards[2].label} sub={c.floatingCards[2].sub} className="bottom-24 -left-6" delay="1.2s" />
    <FloatingCard label={c.floatingCards[3].label} sub={c.floatingCards[3].sub} className="bottom-6 -right-2" delay="1.8s" />
  </div>
);

/* ─── Compact visual (mobile) ────────────────────────────────────────────── */
const VisualCompact: React.FC = () => (
  <div className="lg:hidden space-y-3 relative">
    <div className="ad-glow absolute -top-6 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl -z-10" />
    <TerminalMock />
    <TechRow />
  </div>
);

/* ─── Main component ─────────────────────────────────────────────────────── */
const OpeningAd: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Shows on every fresh page load/refresh. Layout mounts once at the app
  // root, so this doesn't re-fire on client-side route navigation — only
  // on an actual reload, which is the intended behavior.
  useEffect(() => {
    if (location.pathname.startsWith('/admin')) return;
    const t = setTimeout(() => setVisible(true), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    setVisible(false);
  };

  useEffect(() => {
    if (!visible) return;
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const goTo = (to: string) => {
    close();
    navigate(to);
  };

  if (!visible) return null;

  const showVideo = openingAdVideo.enabled && !!openingAdVideo.src && !videoFailed;

  return (
    <div
      className="ad-backdrop-in fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="opening-ad-heading"
        onClick={e => e.stopPropagation()}
        className="ad-scale-in relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-[1.75rem] sm:rounded-[2rem] border border-white/10 shadow-2xl"
        style={{ background: 'radial-gradient(circle at 20% 0%, #0f1c3d 0%, #05070f 55%, #020308 100%)' }}
      >
        <button
          ref={closeBtnRef}
          onClick={close}
          aria-label="Close"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {showVideo ? (
          <div className="relative">
            <video
              className="w-full max-h-[92vh] object-cover"
              src={openingAdVideo.src}
              poster={openingAdVideo.poster || undefined}
              autoPlay
              muted
              loop
              playsInline
              onError={() => setVideoFailed(true)}
            />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h2 id="opening-ad-heading" className="text-2xl sm:text-3xl font-extrabold text-white leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
                  {c.headline[0]}<br />{c.headline[1]}
                </h2>
              </div>
              <div className="flex gap-3">
                <button onClick={() => goTo(c.primaryCta.to)} className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-bold transition-colors whitespace-nowrap">
                  {c.primaryCta.label} →
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-4 p-6 sm:p-10 lg:p-12">
            {/* Left: brand, headline, copy, CTAs */}
            <div className="flex flex-col justify-center space-y-6 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-black tracking-tighter" style={{ fontFamily: 'Syne, sans-serif' }}>
                  <span className="text-white">{c.brand.first}</span>
                  <span className="text-cyan-400 ml-0.5">{c.brand.second}</span>
                </span>
                <span className="hidden sm:inline text-[10px] font-semibold text-slate-500 tracking-[0.2em] uppercase">
                  {c.eyebrow.join(' / ')}
                </span>
              </div>

              <h2 id="opening-ad-heading" className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-white leading-[1.08]" style={{ fontFamily: 'Syne, sans-serif' }}>
                {c.headline[0]}<br />
                <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">{c.headline[1]}</span>
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-md">
                {c.copy}
              </p>

              <VisualCompact />

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button
                  onClick={() => goTo(c.primaryCta.to)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-sm shadow-[0_0_30px_-5px_rgba(59,130,246,0.6)] hover:shadow-[0_0_40px_-5px_rgba(59,130,246,0.8)] transition-all"
                >
                  {c.primaryCta.label} <span aria-hidden="true">→</span>
                </button>
                <button
                  onClick={() => goTo(c.secondaryCta.to)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white font-bold text-sm backdrop-blur-sm transition-colors"
                >
                  {c.secondaryCta.label}
                </button>
              </div>

              <a
                href="https://github.com/pantane1"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-2 text-slate-500 hover:text-slate-300 text-xs font-semibold transition-colors w-fit"
              >
                <GithubIcon className="w-4 h-4" /> github.com/pantane1
              </a>
            </div>

            {/* Right: visual composition, desktop only */}
            <VisualComposition />
          </div>
        )}
      </div>
    </div>
  );
};

export default OpeningAd;
