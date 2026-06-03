
import React from 'react';

const NavCard = ({ title, description, icon, hash }: { title: string, description: string, icon: string, hash: string }) => (
  <button
    onClick={() => window.location.hash = hash}
    className="group bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-50/50 hover:-translate-y-2 transition-all duration-300 text-left flex flex-col justify-between min-h-[220px]"
  >
    <div>
      <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 text-2xl">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-500 leading-relaxed">{description}</p>
    </div>
    <div className="mt-6 flex items-center text-blue-600 font-bold group-hover:translate-x-2 transition-transform duration-300">
      Explore <span className="ml-2">→</span>
    </div>
  </button>
);

const Home: React.FC = () => {
  const profileImg = "https://github.com/pantane1.png";

  return (
    <div className="fade-in space-y-24">
      {/* Hero Section */}
      <section className="flex flex-col lg:flex-row items-center gap-12 py-12">
        <div className="flex-1 space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-bold tracking-wide uppercase">
            Available for new opportunities
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-[1.1]">
            Welcome to <span className="text-blue-600">Pantane Hub.</span>
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed max-w-2xl">
            I'm Pantane — driven by curiosity, clean systems, and building things that actually work.
            This space is where I share what I’m building, what I’m learning, and what I’m exploring next.
            Feel free to look around, check out my projects, connect with me, or reach out if you'd like us to build something together.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4 flex-wrap">
            <button
              onClick={() => window.open('https://m1wamuhu.vercel.app/', '_blank')}
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 hover:shadow-2xl transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              My Resume
            </button>
            <button
              onClick={() => window.location.hash = '#contact'}
              className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all"
            >
              Get in Touch
            </button>
          </div>
        </div>
        <div className="flex-1 w-full max-w-md lg:max-w-none">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem] border-8 border-white shadow-2xl bg-slate-50">
              <img
                src={profileImg}
                alt="Wamuhu Martin"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-700"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://picsum.photos/600/800';
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Body Navigation */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <NavCard
          title="Projects"
          description="A showcase of full-stack systems and creative experiments."
          icon="🚀"
          hash="#projects"
        />
        <NavCard
          title="Socials"
          description="Let's connect across platforms and share ideas."
          icon="🌐"
          hash="#socials"
        />
        <NavCard
          title="Contact"
          description="Have a collaboration in mind? I'm always open to talk."
          icon="✉️"
          hash="#contact"
        />
      </section>
    </div>
  );
};

export default Home;
