import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { GithubIcon, LinkedInIcon, TwitterIcon } from './Icons';
import MouseEffect from './MouseEffect';

interface LayoutProps { children: React.ReactNode; }

/* ─── Tech Marquee ─────────────────────────────────────────────────────────── */
const TechMarquee = () => {
  const techs = [
    { name: 'React',       slug: 'react' },
    { name: 'Next.js',     slug: 'nextdotjs' },
    { name: 'TypeScript',  slug: 'typescript' },
    { name: 'Node.js',     slug: 'nodedotjs' },
    { name: 'Python',      slug: 'python' },
    { name: 'Firebase',    slug: 'firebase' },
    { name: 'MongoDB',     slug: 'mongodb' },
    { name: 'PostgreSQL',  slug: 'postgresql' },
    { name: 'Docker',      slug: 'docker' },
    { name: 'Tailwind',    slug: 'tailwindcss' },
    { name: 'Vite',        slug: 'vite' },
    { name: 'Expo',        slug: 'expo' },
    { name: 'Express',     slug: 'express' },
    { name: 'Git',         slug: 'git' },
    { name: 'Vercel',      slug: 'vercel' },
    { name: 'MySQL',       slug: 'mysql' },
    { name: 'Laravel',     slug: 'laravel' },
    { name: 'Flutter',     slug: 'flutter' },
  ];
  return (
    <div className="w-full bg-white py-5 border-y border-slate-100 overflow-hidden relative">
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .marquee-track { display: flex; width: max-content; animation: marquee 50s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }
      `}</style>
      <div className="marquee-track">
        {[...techs, ...techs].map((t, i) => (
          <div key={i} className="flex items-center space-x-2.5 px-7 group">
            <img
              src={`https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/${t.slug}.svg`}
              alt={t.name} loading="lazy"
              className="w-4 h-4 grayscale opacity-25 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-400"
            />
            <span className="text-[10px] font-bold text-slate-300 group-hover:text-slate-700 uppercase tracking-[0.18em] whitespace-nowrap transition-colors duration-300">
              {t.name}
            </span>
          </div>
        ))}
      </div>
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
    </div>
  );
};

/* ─── Privacy & Terms Modals ────────────────────────────────────────────────── */
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4 text-slate-800" style={{ fontFamily: 'Syne, sans-serif' }}>{title}</h2>
        <div className="text-slate-600 space-y-4 max-h-80 overflow-y-auto pr-1 text-sm leading-relaxed">{children}</div>
        <button onClick={onClose} className="mt-6 w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors">
          Close
        </button>
      </div>
    </div>
  );
};

/* ─── Logo ──────────────────────────────────────────────────────────────────── */
const Logo = () => (
  <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shadow-md group-hover:rotate-12 transition-transform duration-300">
    <div className="w-4 h-4 rounded-full border-2 border-amber-400 relative flex items-center justify-center">
      <div className="w-1 h-1.5 bg-amber-400 rounded-full absolute top-0.5" />
    </div>
  </div>
);

/* ─── Header ────────────────────────────────────────────────────────────────── */
export const Header: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-xs font-bold uppercase tracking-widest transition-colors ${isActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-900'}`;

  return (
    <header className="py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-40 border-b border-slate-100 shadow-sm">
      {/* Logo */}
      <Link to="/" className="flex items-center space-x-3 group">
        <Logo />
        <span className="text-lg font-black tracking-tighter" style={{ fontFamily: 'Syne, sans-serif' }}>
          <span className="text-slate-900">PANTANE</span>
          <span className="text-amber-400 ml-0.5">HUB</span>
        </span>
      </Link>

      {/* Desktop nav */}
      <div className="hidden lg:flex items-center space-x-8">
        <nav className="flex items-center space-x-6 border-r border-slate-200 pr-8">
          <NavLink to="/projects" className={navLinkClass}>Projects</NavLink>
          <NavLink to="/socials"  className={navLinkClass}>Socials</NavLink>
          <NavLink to="/support"  className={navLinkClass}>Support</NavLink>
          <NavLink to="/contact"  className={navLinkClass}>Contact</NavLink>
        </nav>
        <div className="flex items-center space-x-4">
          <a href="https://github.com/pantane1" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors">
            <GithubIcon className="w-5 h-5" />
          </a>
          <a href="https://www.linkedin.com/in/pantane/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors">
            <LinkedInIcon className="w-5 h-5" />
          </a>
          <a href="https://twitter.com/pantane4" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors">
            <TwitterIcon className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Mobile hamburger */}
      <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors" onClick={() => setMobileOpen(!mobileOpen)}>
        <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {mobileOpen
            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />}
        </svg>
      </button>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-slate-100 shadow-lg lg:hidden z-50">
          <nav className="flex flex-col px-6 py-4 space-y-1">
            {[['/', 'Home'], ['/projects', 'Projects'], ['/socials', 'Socials'], ['/support', 'Support'], ['/contact', 'Contact']].map(([to, label]) => (
              <NavLink
                key={to} to={to}
                className={({ isActive }) => `px-4 py-3 rounded-xl font-bold text-sm transition-colors ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

/* ─── Footer ────────────────────────────────────────────────────────────────── */
export const Footer: React.FC = () => {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms]     = useState(false);

  return (
    <footer className="mt-0 py-10 border-t border-slate-100 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-12 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
        <div>
          <div className="flex items-center justify-center md:justify-start space-x-2 mb-1">
            <Logo />
            <span className="font-black tracking-tight text-slate-800" style={{ fontFamily: 'Syne, sans-serif' }}>PANTANE HUB</span>
          </div>
          <p className="text-slate-400 text-sm italic">Built different. Built in Kenya.</p>
        </div>

        <div className="flex flex-col items-center md:items-end gap-2">
          <div className="flex items-center space-x-3 text-sm">
            <Link to="/support" className="font-medium text-slate-500 hover:text-blue-600 transition-colors">Support</Link>
            <span className="text-slate-200">|</span>
            <button onClick={() => setShowPrivacy(true)} className="font-medium text-slate-500 hover:text-blue-600 transition-colors">Privacy</button>
            <span className="text-slate-200">|</span>
            <button onClick={() => setShowTerms(true)} className="font-medium text-slate-500 hover:text-blue-600 transition-colors">Terms</button>
          </div>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} Pantane. All rights reserved.</p>
        </div>
      </div>

      <Modal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} title="Privacy Policy">
        <p>Your privacy is important. Pantane Hub does not collect personal data unless you explicitly provide it via the contact form or support interactions.</p>
        <p><strong>Third-Party Services:</strong> GitHub API is used to display projects. PayPal, Paystack, and M-Pesa handle support contributions. EmailJS handles contact form delivery.</p>
        <p><strong>Cookies:</strong> Basic session cookies may be used to enhance site functionality. No tracking or advertising cookies are used.</p>
      </Modal>

      <Modal isOpen={showTerms} onClose={() => setShowTerms(false)} title="Terms of Use">
        <p>Welcome to Pantane Hub. By using this site, you agree to the following terms.</p>
        <p><strong>Intellectual Property:</strong> All content and designs are the property of Pantane unless otherwise stated.</p>
        <p><strong>Limitation of Liability:</strong> Pantane Hub is provided "as is" without any warranties.</p>
        <p><strong>Support:</strong> Contributions made through support channels are voluntary and non-refundable.</p>
      </Modal>
    </footer>
  );
};

/* ─── Root Layout ───────────────────────────────────────────────────────────── */
const Layout: React.FC<LayoutProps> = ({ children }) => (
  <div className="min-h-screen flex flex-col selection:bg-amber-100 selection:text-amber-900 relative">
    <MouseEffect />
    <Header />
    <main className="flex-grow max-w-7xl mx-auto w-full px-4 md:px-12 py-10 md:py-16 relative z-10">
      {children}
    </main>
    <div className="relative z-10 bg-white">
      <TechMarquee />
      <Footer />
    </div>
  </div>
);

export default Layout;
