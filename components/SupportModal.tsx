
import React, { useState, useEffect, useRef } from 'react';
import { SupportProvider } from '../types';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: SupportProvider | null;
}

declare const PaystackPop: any;
declare const paypal: any;

const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose, provider }) => {
  const [amount, setAmount] = useState<string>('5');
  const [message, setMessage] = useState<string>('');
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paypalContainerRef = useRef<HTMLDivElement>(null);

  const loadScript = (src: string, id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.getElementById(id)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.id = id;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    if (!isOpen || !provider) return;

    let isMounted = true;
    setError(null);
    setScriptLoaded(false);

    const initializeProvider = async () => {
      try {
        if (provider === SupportProvider.PayPal) {
          try {
            await loadScript('https://www.paypal.com/sdk/js?client-id=test&currency=USD&components=buttons', 'paypal-sdk');
            if (isMounted && typeof paypal !== 'undefined' && paypal.Buttons) {
              setScriptLoaded(true);
              setTimeout(() => {
                if (isMounted && paypalContainerRef.current) renderPaypalButtons();
              }, 100);
            } else {
              throw new Error('PayPal SDK loaded but unusable');
            }
          } catch (e) {
            console.warn("PayPal SDK load restricted.", e);
            if (isMounted) setError("Direct Pay is recommended for this environment.");
          }
        } else if (provider === SupportProvider.Paystack) {
          try {
            await loadScript('https://js.paystack.co/v1/inline.js', 'paystack-sdk');
            if (isMounted) setScriptLoaded(true);
          } catch (e) {
            if (isMounted) setError("Secure checkout restricted. Please try another method.");
          }
        } else {
          setScriptLoaded(true);
        }
      } catch (err) {
        if (isMounted) setError("Checkout initialization failed.");
      }
    };

    const renderPaypalButtons = () => {
      if (!paypalContainerRef.current || typeof paypal === 'undefined' || !paypal.Buttons) return;
      paypalContainerRef.current.innerHTML = '';
      
      try {
        paypal.Buttons({
          style: { layout: 'vertical', color: 'blue', shape: 'rect', label: 'paypal' },
          createOrder: (data: any, actions: any) => {
            return actions.order.create({
              purchase_units: [{
                amount: { currency_code: 'USD', value: amount },
                description: `Support for Pantane: ${message}`
              }]
            });
          },
          onApprove: async (data: any, actions: any) => {
            const details = await actions.order.capture();
            alert(`Thank you ${details.payer.name.given_name}!`);
            onClose();
          },
          onError: (err: any) => {
            console.error("PayPal UI Error:", err);
            if (isMounted) setError("Interactive buttons restricted. Using Direct Pay fallback.");
          }
        }).render(paypalContainerRef.current).catch((err: any) => {
          console.error("PayPal Render Error:", err);
          if (isMounted) setError("Using Direct Pay fallback.");
        });
      } catch (e) {
        console.error("PayPal Error:", e);
        if (isMounted) setError("Using Direct Pay fallback.");
      }
    };

    initializeProvider();

    return () => { isMounted = false; };
  }, [isOpen, provider]);

  if (!isOpen || !provider) return null;

  const handleDirectPay = () => {
    if (provider === SupportProvider.PayPal) {
      const url = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=mapantane1@gmail.com&item_name=Support+Pantane+Hub&amount=${amount}&currency_code=USD&note=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
      onClose();
    } else if (provider === SupportProvider.Paystack) {
      if (typeof PaystackPop !== 'undefined') {
        const handler = PaystackPop.setup({
          key: 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxx',
          email: 'pantane254@gmail.com',
          amount: Math.round(parseFloat(amount) * 100),
          currency: 'KES',
          callback: (response: any) => {
            alert('Payment complete! Ref: ' + response.reference);
            onClose();
          },
          onClose: () => {}
        });
        handler.openIframe();
      } else {
        alert("Paystack could not be initialized.");
      }
    } else if (provider === SupportProvider.BUymeACoffee) {
      window.open(`https://buymeacoffee.com/Pantane4?amount=${amount}&message=${encodeURIComponent(message)}`, '_blank');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl fade-in overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Support via {provider}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Amount</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">
                {provider === SupportProvider.Paystack ? 'KSh' : '$'}
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-xl font-bold text-slate-800"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Message</label>
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none text-slate-600 font-medium"
              placeholder="Cheers!"
            />
          </div>

          <div className="pt-2">
            {provider === SupportProvider.PayPal && scriptLoaded && !error ? (
              <div className="space-y-4">
                <div ref={paypalContainerRef} className="min-h-[50px]"></div>
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-100"></div>
                  <span className="flex-shrink mx-4 text-slate-300 text-[10px] font-bold uppercase tracking-widest">or</span>
                  <div className="flex-grow border-t border-slate-100"></div>
                </div>
              </div>
            ) : null}

            <button
              onClick={handleDirectPay}
              className="w-full py-5 bg-[#1e293b] text-white rounded-2xl font-bold text-lg hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center justify-center space-x-3"
            >
              <span>Proceed to {provider}</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>

            {error && (
              <p className="mt-4 text-[11px] text-amber-600 bg-amber-50 p-3 rounded-xl text-center font-bold">
                NOTE: Interactive buttons are disabled due to environment restrictions. Direct checkout is available above.
              </p>
            )}
          </div>
          
          <p className="text-center text-[10px] text-slate-300 uppercase font-black tracking-[0.3em] pt-2">Secure Connection</p>
        </div>
      </div>
    </div>
  );
};

export default SupportModal;
