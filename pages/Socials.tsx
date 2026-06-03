import React from 'react';
import { GithubIcon, LinkedInIcon, TwitterIcon, InstagramIcon, FacebookIcon, WhatsAppIcon } from '../components/Icons';

const SocialCard = ({ name, handle, icon, url, color, desc }: {
  name: string; handle: string; icon: React.ReactNode; url: string; color: string; desc: string;
}) => (
  <a
    href={url} target="_blank" rel="noopener noreferrer"
    className="group bg-white p-7 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center gap-5"
  >
    <div
      className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-110 flex-shrink-0"
      style={{ backgroundColor: color }}
    >
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors" style={{ fontFamily: 'Syne, sans-serif' }}>{name}</h3>
      <p className="text-slate-400 text-sm font-medium truncate">{handle}</p>
      <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{desc}</p>
    </div>
    <svg className="w-5 h-5 text-slate-200 group-hover:text-slate-400 group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
    </svg>
  </a>
);

const Socials: React.FC = () => {
  const msg = encodeURIComponent('hi, got your number from your website.');
  return (
    <div className="fade-in max-w-3xl mx-auto space-y-12">
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Connect</p>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>Let's Connect.</h1>
        <p className="text-slate-500 leading-relaxed">
          Platforms where I share ideas, projects, and updates. Reach out or follow the journey.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SocialCard name="WhatsApp" handle="+254 740 312 402" desc="Quickest way to reach me" url={`https://wa.me/254740312402?text=${msg}`} icon={<WhatsAppIcon className="w-7 h-7"/>} color="#25D366"/>
        <SocialCard name="GitHub"   handle="Pantane1"          desc="Code, projects & contributions" url="https://github.com/pantane1" icon={<GithubIcon className="w-7 h-7"/>} color="#181717"/>
        <SocialCard name="LinkedIn" handle="Pantane_Hub"       desc="Professional network"           url="https://www.linkedin.com/in/pantane/" icon={<LinkedInIcon className="w-7 h-7"/>} color="#0A66C2"/>
        <SocialCard name="Twitter / X" handle="@Pantane4"      desc="Thoughts and updates"           url="https://twitter.com/pantane4" icon={<TwitterIcon className="w-7 h-7"/>} color="#000000"/>
        <SocialCard name="Instagram" handle="@_pantane_"       desc="Behind the scenes"              url="https://instagram.com/_pantane_" icon={<InstagramIcon className="w-7 h-7"/>} color="#E4405F"/>
        <SocialCard name="Facebook"  handle="Pantane"          desc="Community & updates"            url="https://web.facebook.com/profile.php?id=100095346974516" icon={<FacebookIcon className="w-7 h-7"/>} color="#1877F2"/>
      </div>
    </div>
  );
};

export default Socials;
