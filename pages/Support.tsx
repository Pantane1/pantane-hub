import React, { useState } from 'react';
import { CoffeeIcon, WalletIcon, MpesaIcon } from '../components/Icons';
import SupportModal from '../components/SupportModal';
import { SupportProvider } from '../types';

const Support: React.FC = () => {
  const [selectedProvider, setSelectedProvider] = useState<SupportProvider | null>(null);

  return (
    <div className="fade-in max-w-6xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900">Support the Work.</h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          If you like what I build and want to support the journey, you can do so through the options below. Every contribution helps me keep building and learning.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {/* Buy Me a Coffee */}
        <button
          onClick={() => setSelectedProvider(SupportProvider.BUymeACoffee)}
          className="group bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all flex flex-col items-center text-center space-y-6"
        >
          <div className="w-20 h-20 bg-amber-500 rounded-3xl flex items-center justify-center text-white shadow-xl group-hover:rotate-6 transition-transform">
            <CoffeeIcon className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Coffee</h3>
            <p className="text-slate-500 mt-2">Fuel the late night coding sessions with a coffee.</p>
          </div>
          <div className="px-6 py-2 bg-amber-50 text-amber-700 rounded-full font-bold text-sm">
            Support Now
          </div>
        </button>

        {/* M-Pesa Hooked to Native Modal Component Flow */}
        <button
          onClick={() => setSelectedProvider(SupportProvider.MPESA)}
          className="group bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all flex flex-col items-center text-center space-y-6"
        >
          <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center text-white shadow-xl group-hover:rotate-6 transition-transform">
            <MpesaIcon className="w-12 h-12" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">M-Pesa</h3>
            <p className="text-slate-500 mt-2">Support directly via Lipa na M-Pesa (Kenya only).</p>
          </div>
          <div className="px-6 py-2 bg-emerald-50 text-emerald-700 rounded-full font-bold text-sm">
            Support Now
          </div>
        </button>

        {/* PayPal */}
        <button
          onClick={() => setSelectedProvider(SupportProvider.PayPal)}
          className="group bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all flex flex-col items-center text-center space-y-6"
        >
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl group-hover:rotate-6 transition-transform">
            <svg className="w-10 h-10 fill-current" viewBox="0 0 24 24"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.736a1.028 1.028 0 0 1 1.013-.862h7.614c2.443 0 4.254.514 5.432 1.543 1.154 1.008 1.682 2.458 1.57 4.31-.178 2.94-1.933 5.06-5.217 6.302-1.393.528-3.045.753-4.912.753H8.568L7.076 21.337zm10.05-13.438c.062-1.026-.242-1.802-.903-2.305-.69-.525-1.785-.79-3.256-.79H6.845l-2.22 14.15h2.645l1.285-8.2h2.247c1.472 0 2.76-.18 3.83-.537 2.215-.736 3.42-2.148 3.494-4.318zM10.85 13.914l-.16.994h3.585c2.144 0 3.83-.545 5.01-1.62.912-.832 1.395-1.95 1.436-3.325a6.49 6.49 0 0 0-.05-.885c-.347 2.47-2.022 4.195-5.02 5.024-1.144.315-2.522.467-4.103.467H10.85z" /></svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">PayPal</h3>
            <p className="text-slate-500 mt-2">Fast and secure transfers for international supporters.</p>
          </div>
          <div className="px-6 py-2 bg-blue-50 text-blue-700 rounded-full font-bold text-sm">
            Support Now
          </div>
        </button>

        {/* Paystack */}
        <button
          onClick={() => setSelectedProvider(SupportProvider.Paystack)}
          className="group bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all flex flex-col items-center text-center space-y-6"
        >
          <div className="w-20 h-20 bg-cyan-500 rounded-3xl flex items-center justify-center text-white shadow-xl group-hover:rotate-6 transition-transform">
            <WalletIcon className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Paystack</h3>
            <p className="text-slate-500 mt-2">Preferred option for supporters in Africa.</p>
          </div>
          <div className="px-6 py-2 bg-cyan-50 text-cyan-700 rounded-full font-bold text-sm">
            Support Now
          </div>
        </button>
      </div>

      <SupportModal
        isOpen={selectedProvider !== null}
        onClose={() => setSelectedProvider(null)}
        provider={selectedProvider}
      />
    </div>
  );
};

export default Support;