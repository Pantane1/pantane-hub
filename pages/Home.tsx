import React from 'react';
import { Link } from 'react-router-dom';

const NavCard = ({ title, description, icon, to }: { title: string; description: string; icon: string; to: string }) => (
  <Link
    to={to}
    className="group bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-50/60 hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between min-h-[210px]"
  >
    <div>
      <div className="w-13 h-13 w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xl mb-5 group-hover:bg-slate-900 group-hover:scale-110 transition-all duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
    </div>
    <div className="mt-5 flex items-center text-slate-400 text-sm font-bold group-hover:text-blue-600 group-hover:translate-x-1.5 transition-all duration-300">
      Explore <span className="ml-1.5">→</span>
    </div>
  </Link>
);

const Home: React.FC = () => (
  <div className="fade-in space-y-20">
    {/* Hero */}
    <section className="flex flex-col lg:flex-row items-center gap-12 pt-6 pb-4">
      <div className="flex-1 space-y-7 text-center lg:text-left">
        <div className="slide-up stagger-1 inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-xs font-bold tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
          Available for new opportunities
        </div>

        <h1 className="slide-up stagger-2 text-5xl md:text-6xl xl:text-7xl font-extrabold text-slate-900 leading-[1.08]" style={{ fontFamily: 'Syne, sans-serif' }}>
          Welcome to{' '}
          <span className="relative inline-block">
            <span className="relative z-10 text-blue-600">Pantane Hub.</span>
            <span className="absolute -bottom-1 left-0 right-0 h-3 bg-amber-100 -z-0 skew-x-1" />
          </span>
        </h1>

        <p className="slide-up stagger-3 text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
          I'm <strong className="text-slate-800 font-semibold">Pantane</strong> — a software developer based in Kenya, driven by curiosity, clean systems, and building things that actually work.
          This is where I share what I'm building, what I'm learning, and what's next.
        </p>

        <div className="slide-up stagger-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2 flex-wrap">
          <a
            href="https://m1wamuhu.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-7 py-3.5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-700 hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View Résumé
          </a>
          <Link
            to="/contact"
            className="w-full sm:w-auto px-7 py-3.5 bg-white text-slate-900 border border-slate-200 rounded-2xl font-bold hover:border-slate-400 hover:shadow-md transition-all text-sm text-center"
          >
            Get in Touch
          </Link>
        </div>
      </div>

      {/* Profile image */}
      <div className="flex-shrink-0 w-full max-w-xs lg:max-w-sm">
        <div className="relative group">
          <div className="absolute -inset-1.5 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-[2.5rem] blur opacity-20 group-hover:opacity-35 transition duration-700" />
          <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem] border-8 border-white shadow-2xl bg-slate-100">
            <img
              src="https://github.com/pantane1.png"
              alt="Pantane"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover grayscale-[15%] hover:grayscale-0 transition-all duration-700"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/600/800'; }}
            />
          </div>
        </div>
      </div>
    </section>

    {/* Navigation cards */}
    <section>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Explore</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <NavCard title="Projects"  description="Full-stack systems, fintech integrations, and experiments."  icon="🚀" to="/projects" />
        <NavCard title="Socials"   description="Connect with me across platforms and follow the journey."   icon="🌐" to="/socials" />
        <NavCard title="Contact"   description="Have a project in mind? Always open to collaborate."         icon="✉️" to="/contact" />
        <NavCard title="Support"   description="If you like what I build, you can support the journey."      icon="☕" to="/support" />
      </div>
    </section>
  </div>
);

export default Home;
