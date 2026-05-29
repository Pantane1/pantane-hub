
import React, { useState } from 'react';
import { CoffeeIcon, WalletIcon, MpesaIcon } from '../components/Icons';
import SupportModal from '../components/SupportModal';
import { SupportProvider } from '../types';

const Support: React.FC = () => {
  const [selectedProvider, setSelectedProvider] = useState<SupportProvider | null>(null);

  const handleMpesaClick = () => {
    window.open('https://lipana.dev/pay/pantane', '_blank');
  };

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
          <div className="w-20 h-20 bg-yellow-400 rounded-3xl flex items-center justify-center text-white shadow-xl group-hover:rotate-6 transition-transform">
            <CoffeeIcon className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Coffee</h3>
            <p className="text-slate-500 mt-2">Fuel the late night coding sessions with a coffee.</p>
          </div>
          <div className="px-6 py-2 bg-yellow-50 text-yellow-700 rounded-full font-bold text-sm">
            Support Now
          </div>
        </button>

        {/* Lipa na M-Pesa - Direct Redirect */}
        <button
          onClick={handleMpesaClick}
          className="group bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all flex flex-col items-center text-center space-y-6"
        >
          <div className="w-20 h-20 bg-[#28a745] rounded-3xl flex items-center justify-center text-white shadow-xl group-hover:rotate-6 transition-transform">
            <MpesaIcon className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">M-Pesa</h3>
            <p className="text-slate-500 mt-2">Support directly via Lipa na M-Pesa (Kenya only).</p>
          </div>
          <div className="px-6 py-2 bg-green-50 text-green-700 rounded-full font-bold text-sm">
            Support Now
          </div>
        </button>

        {/* PayPal */}
        <button
          onClick={() => setSelectedProvider(SupportProvider.PayPal)}
          className="group bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all flex flex-col items-center text-center space-y-6"
        >
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl group-hover:rotate-6 transition-transform">
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74 Bach-4.944 3.723a1.603 1.603 0 0 1 1.582-1.337h7c3.754 0 6.41 1.533 5.405 5.896-.65 3.123-3.085 4.71-5.744 4.71H10.19l-1.34 5.61a.641.641 0 0 0 .626.735zM12.912 2.386H5.912a.641.641 0 0 0-.633.535l-3.107 16.87a.641.641 0 0 0 .633.74h4.606a.641.641 0 0 0 .626-.535l1.34-5.61h3.003c2.659 0 5.094-1.587 5.744-4.71 1.005-4.363-1.65-5.896-5.405-5.896z" /></svg>
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
        isOpen={!!selectedProvider}
        onClose={() => setSelectedProvider(null)}
        provider={selectedProvider}
      />
    </div>
  );
};

export default Support;
