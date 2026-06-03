import React, { useState } from 'react';
import { CoffeeIcon, WalletIcon, MpesaIcon } from '../components/Icons';
import SupportModal from '../components/SupportModal';
import MpesaModal from '../components/MpesaModal';
import { SupportProvider } from '../types';

const Support: React.FC = () => {
  const [selectedProvider, setSelectedProvider] = useState<SupportProvider | null>(null);
  const [mpesaOpen, setMpesaOpen] = useState(false);

  const cards = [
    {
      id: SupportProvider.BUymeACoffee,
      icon: <CoffeeIcon className="w-9 h-9" />,
      bg: 'bg-amber-400',
      badge: 'bg-amber-50 text-amber-700',
      title: 'Buy Me a Coffee',
      desc: 'Fuel the late-night coding sessions.',
      onClick: () => setSelectedProvider(SupportProvider.BUymeACoffee),
    },
    {
      id: 'mpesa',
      icon: <MpesaIcon className="w-9 h-9" />,
      bg: 'bg-[#28a745]',
      badge: 'bg-green-50 text-green-700',
      title: 'Lipa na M-Pesa',
      desc: 'Direct STK Push — Kenya only.',
      onClick: () => setMpesaOpen(true),
    },
    {
      id: SupportProvider.PayPal,
      icon: (
        <svg className="w-9 h-9" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944 3.72A1.603 1.603 0 016.525 2.38h7c3.754 0 6.41 1.533 5.405 5.896-.65 3.123-3.085 4.71-5.744 4.71H10.19l-1.34 5.61a.641.641 0 01-.625.535H7.077z"/>
          <path d="M19.498 7.89c-.7 3.37-2.99 5.5-6.525 5.5H11l-1.528 6.4h2.15a.641.641 0 00.626-.535l1.34-5.61h2.996c2.66 0 5.095-1.587 5.744-4.71.38-1.83.07-3.26-.83-4.045z" opacity=".6"/>
        </svg>
      ),
      bg: 'bg-blue-600',
      badge: 'bg-blue-50 text-blue-700',
      title: 'PayPal',
      desc: 'Fast and secure for international supporters.',
      onClick: () => setSelectedProvider(SupportProvider.PayPal),
    },
    {
      id: SupportProvider.Paystack,
      icon: <WalletIcon className="w-9 h-9" />,
      bg: 'bg-cyan-500',
      badge: 'bg-cyan-50 text-cyan-700',
      title: 'Paystack',
      desc: 'Preferred payment option for Africa.',
      onClick: () => setSelectedProvider(SupportProvider.Paystack),
    },
  ];

  return (
    <div className="fade-in max-w-5xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Support the work</p>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900" style={{ fontFamily: 'Syne, sans-serif' }}>
          Support the Journey.
        </h1>
        <p className="text-slate-500 max-w-xl mx-auto leading-relaxed">
          If you like what I build, any contribution helps me keep building and learning. Pick whichever method works best for you.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c) => (
          <button
            key={String(c.id)}
            onClick={c.onClick}
            className="group bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center gap-5"
          >
            <div className={`w-18 w-16 h-16 ${c.bg} rounded-3xl flex items-center justify-center text-white shadow-lg group-hover:rotate-6 group-hover:scale-110 transition-transform duration-300`}>
              {c.icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>{c.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{c.desc}</p>
            </div>
            <span className={`px-4 py-1.5 ${c.badge} rounded-full text-xs font-bold`}>Support Now</span>
          </button>
        ))}
      </div>

      <SupportModal isOpen={!!selectedProvider} onClose={() => setSelectedProvider(null)} provider={selectedProvider} />
      <MpesaModal   isOpen={mpesaOpen}           onClose={() => setMpesaOpen(false)} />
    </div>
  );
};

export default Support;
