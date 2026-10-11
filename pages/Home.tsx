import React from 'react';
import { Link } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';
import { pageSeo } from '../data/pageSeo';
import { useGithubRepos } from '../hooks/useGithubRepos';
import HeroCarousel from '../components/HeroCarousel';
import { ProjectCard, ProjectSkeletonCard } from '../components/ProjectCard';
import { CategoryBadge, formatJournalDate } from '../components/JournalCard';
import { getAllPosts } from '../data/journal';
import { DealThumbnail, SharpCategoryBadge, dealHeadline } from '../components/SharpDealCard';
import { getAllDeals, getFeaturedDeal } from '../data/sharp';

const DEVTOOLS_URL = 'https://pantane-devtools-web.onrender.com/tools';
const DEVTOOLS_TOOL_COUNT = 26;

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

const SectionHeading: React.FC<{ eyebrow: string; title: string; linkTo?: string; linkLabel?: string }> = ({ eyebrow, title, linkTo, linkLabel }) => (
  <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{eyebrow}</p>
      <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900" style={{ fontFamily: 'Syne, sans-serif' }}>{title}</h2>
    </div>
    {linkTo && (
      <Link to={linkTo} className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors whitespace-nowrap flex items-center gap-1">
        {linkLabel || 'See all'} <span>→</span>
      </Link>
    )}
  </div>
);

const Home: React.FC = () => {
  useSeo(pageSeo.home);
  const { repos, loading: reposLoading, error: reposError } = useGithubRepos();

  const latestPost = getAllPosts()[0];
  const featuredDeal = getFeaturedDeal();
  const pinnedRepos = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 3);

  return (
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

        <p className="slide-up stagger-3 text-base text-slate-500 leading-relaxed max-w-xl mx-auto lg:mx-0">
          My focus is full-stack web development, cloud deployment, and payment integrations for the Kenyan market — M-Pesa and Lipana STK push in particular — along with AI-powered tools and automation. I take on both personal builds and client/freelance work.
        </p>

        <div className="slide-up stagger-3 flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1">
          {['Full-Stack Development', 'Cloud & Deployment', 'M-Pesa & Payments', 'AI & Automation'].map(skill => (
            <span key={skill} className="px-3.5 py-1.5 bg-slate-50 text-slate-600 rounded-full text-xs font-bold">
              {skill}
            </span>
          ))}
        </div>

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

      {/* Profile image / hero carousel — same container, aspect ratio, and rounded styling as before */}
      <div className="flex-shrink-0 w-full max-w-xs lg:max-w-sm">
        <div className="relative group">
          <div className="absolute -inset-1.5 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-[2.5rem] blur opacity-20 group-hover:opacity-35 transition duration-700" />
          <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem] border-8 border-white shadow-2xl bg-slate-100">
            <HeroCarousel />
          </div>
        </div>
      </div>
    </section>

    {/* Stats strip — real, live-derived numbers, no invented figures */}
    <section className="grid grid-cols-2 md:grid-cols-4 gap-5">
      {[
        { label: 'GitHub Repos', value: reposLoading ? '—' : `${repos.length}+` },
        { label: 'Journal Entries', value: `${getAllPosts().length}` },
        { label: 'Sharp Deals Live', value: `${getAllDeals().length}` },
        { label: 'DevTools Shipped', value: `${DEVTOOLS_TOOL_COUNT}` },
      ].map(stat => (
        <div key={stat.label} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 text-center">
          <p className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>{stat.value}</p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
        </div>
      ))}
    </section>

    {/* Pinned projects */}
    {!reposError && (
      <section>
        <SectionHeading eyebrow="Portfolio" title="Pinned Projects" linkTo="/projects" linkLabel="All Projects" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {reposLoading
            ? [1, 2, 3].map(i => <ProjectSkeletonCard key={i} />)
            : pinnedRepos.map(r => <ProjectCard key={r.id} repo={r} />)}
        </div>
      </section>
    )}

    {/* Latest Journal entry */}
    {latestPost && (
      <section>
        <SectionHeading eyebrow="Journal" title="From the Journal" linkTo="/journal" linkLabel="Read More" />
        <Link
          to={`/journal/${latestPost.slug}`}
          className="group block bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-8 md:p-10"
        >
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <CategoryBadge category={latestPost.category} />
            <span className="text-xs text-slate-400 font-medium">{formatJournalDate(latestPost.date)}</span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors" style={{ fontFamily: 'Syne, sans-serif' }}>
            {latestPost.title}
          </h3>
          <p className="text-slate-500 leading-relaxed mb-5 max-w-2xl">{latestPost.excerpt}</p>
          <span className="inline-flex items-center text-sm font-bold text-slate-900 group-hover:translate-x-1 transition-transform">
            Read more <span className="ml-1.5">→</span>
          </span>
        </Link>
      </section>
    )}

    {/* Featured Sharp deal */}
    {featuredDeal && (
      <section>
        <SectionHeading eyebrow="Sharp" title="Featured Deal" linkTo="/sharp" linkLabel="See All Deals" />
        <Link
          to={`/sharp/${featuredDeal.slug}`}
          className="group grid md:grid-cols-[1fr_1.4fr] bg-slate-900 rounded-[2rem] overflow-hidden"
        >
          <DealThumbnail deal={featuredDeal} badge="⚡ SHARP" />
          <div className="p-8 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <SharpCategoryBadge category={featuredDeal.category} className="!bg-white/10 !text-white" />
            </div>
            <h3 className="text-xl md:text-2xl font-extrabold text-white mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
              {featuredDeal.title}
            </h3>
            <p className="text-amber-300 font-bold mb-3">{dealHeadline(featuredDeal)}</p>
            <p className="text-slate-300 text-sm leading-relaxed mb-5">{featuredDeal.description}</p>
            <span className="inline-flex items-center text-sm font-bold text-white group-hover:text-amber-400 transition-colors w-fit">
              View Deal <span className="ml-1.5">→</span>
            </span>
          </div>
        </Link>
      </section>
    )}

    {/* DevTools callout */}
    <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-10 md:p-14 text-center text-white relative overflow-hidden">
      <div className="absolute -top-16 -right-16 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 max-w-xl mx-auto space-y-5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest">
          🛠️ Pantane DevTools
        </span>
        <h2 className="text-2xl md:text-3xl font-extrabold" style={{ fontFamily: 'Syne, sans-serif' }}>
          {DEVTOOLS_TOOL_COUNT} developer utilities, live and free to use.
        </h2>
        <p className="text-slate-300 leading-relaxed">
          A separate platform I built and ship independently — JSON formatting, JWT decoding, hash and password generation, DNS/SSL checks, an API tester, and more.
        </p>
        <a
          href={DEVTOOLS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-7 py-3.5 bg-white text-slate-900 rounded-2xl font-bold text-sm hover:shadow-2xl hover:-translate-y-0.5 transition-all gap-2"
        >
          Open Pantane DevTools <span>→</span>
        </a>
      </div>
    </section>

    {/* Navigation cards */}
    <section>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Explore</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-5">
        <NavCard title="Projects"  description="Full-stack systems, fintech integrations, and experiments."  icon="🚀" to="/projects" />
        <NavCard title="Journal"   description="What I'm building, learning, and sharing — documented."      icon="📓" to="/journal" />
        <NavCard title="Sharp"     description="Deals, rewards, referrals and opportunities, explained."      icon="⚡" to="/sharp" />
        <NavCard title="Socials"   description="Connect with me across platforms and follow the journey."   icon="🌐" to="/socials" />
        <NavCard title="Contact"   description="Have a project in mind? Always open to collaborate."         icon="✉️" to="/contact" />
        <NavCard title="Support"   description="If you like what I build, you can support the journey."      icon="☕" to="/support" />
      </div>
    </section>
  </div>
  );
};

export default Home;
