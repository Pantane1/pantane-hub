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
  const [phone, setPhone] = useState<string>('2547');
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
          if (paypalContainerRef.current) {
            paypalContainerRef.current.innerHTML = '';
          }
          
          // Pulls the Client ID directly from your secure .env file
          const paypalClientId = import.meta.env.VITE_PAYPAL_LIVE_CLIENT_ID || 'live';
          await loadScript(`https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD&components=buttons`, 'paypal-sdk');
          
          if (!isMounted) return;

          if (typeof paypal !== 'undefined') {
            setScriptLoaded(true);
            paypal.Buttons({
              style: {
                layout: 'vertical',
                color: 'blue',
                shape: 'rect',
                label: 'paypal'
              },
              createOrder: (_data: any, actions: any) => {
                return actions.order.create({
                  purchase_units: [{
                    amount: {
                      value: amount
                    },
                    description: message || "Support donation for Pantane Hub"
                  }]
                });
              },
              onApprove: async (_data: any, actions: any) => {
                const details = await actions.order.capture();
                alert(`Thank you for your support, ${details.payer.name.given_name}!`);
                onClose();
              },
              onError: (err: any) => {
                console.error("PayPal Error:", err);
                setError("Transaction could not be completed.");
              }
            }).render(paypalContainerRef.current);
          } else {
            throw new Error("PayPal SDK failed to map to global namespace.");
          }
        } else if (provider === SupportProvider.Paystack) {
          await loadScript('https://js.paystack.co/v2/inline.js', 'paystack-sdk');
          if (isMounted) setScriptLoaded(true);
        } else if (provider === SupportProvider.MPESA) {
          if (isMounted) setScriptLoaded(true);
        }
      } catch (err: any) {
        console.error(err);
        if (isMounted) {
          setError(err.message || "Failed to initialize payment interface.");
        }
      }
    };

    initializeProvider();

    return () => {
      isMounted = false;
    };
  }, [isOpen, provider, amount, message]);

  if (!isOpen || !provider) return null;

  const handleDirectPay = async () => {
    if (provider === SupportProvider.BUymeACoffee) {
      window.open(`buymeacoffee.com/Pantane4`, '_blank');
      onClose();
    } else if (provider === SupportProvider.Paystack) {
      if (typeof PaystackPop !== 'undefined') {
        const paystack = new PaystackPop();
        paystack.newTransaction({
          // Pulls your live Paystack public key dynamically from .env
          key: import.meta.env.VITE_PAYSTACK_LIVE_PUBLIC_KEY,
          email: 'pantane254@gmail.com',
          amount: Math.round(parseFloat(amount) * 100), // Converts KSh to subunits (cents) safely
          currency: 'KES',
          metadata: {
            custom_fields: [
              {
                display_name: "Message",
                variable_name: "message",
                value: message || "No message provided"
              }
            ]
          },
          onSuccess: (transaction: any) => {
            alert('Thank you for your support! Transaction Ref: ' + transaction.reference);
            onClose();
          },
          onCancel: () => {
            console.log("Paystack interface dismissed.");
          }
        });
      } else {
        alert("Paystack engine is initializing. Please try again.");
      }
    } else if (provider === SupportProvider.MPESA) {
      try {
        // Pulls your Express server URL dynamically from .env
        const backendEndpoint = import.meta.env.VITE_MPESA_BACKEND_URL;
        
        if (!backendEndpoint) {
          alert("M-Pesa backend URL gateway context is unconfigured.");
          return;
        }

        const response = await fetch(backendEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: amount,
            phone: phone,
            message: message
          })
        });
        const result = await response.json();
        if (result.success || result.ResponseCode === "0") {
          alert("STK Push triggered successfully! Check your phone for the PIN prompt.");
          onClose();
        } else {
          alert(result.message || "Failed to process STK Push request.");
        }
      } catch (err) {
        console.error("M-Pesa execution error:", err);
        alert("Could not reach your automated billing server execution layer.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-extrabold text-slate-900">Support via {provider}</h2>
            <p className="text-sm text-slate-500 mt-1">Your contribution fuels engineering and open source work.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Amount ({provider === SupportProvider.Paystack || provider === SupportProvider.MPESA ? 'KES' : 'USD'})
              </label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-xl">
                  {provider === SupportProvider.Paystack || provider === SupportProvider.MPESA ? 'KSh' : '$'}
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-200 focus:bg-white rounded-2xl py-4 pl-14 pr-6 text-xl font-bold text-slate-800 outline-none transition-all"
                  placeholder="0.00"
                  min="1"
                />
              </div>
            </div>

            {provider === SupportProvider.MPESA && (
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">M-Pesa Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-200 focus:bg-white rounded-2xl py-4 px-6 text-lg font-medium text-slate-800 outline-none transition-all"
                  placeholder="254712345678"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Message (Optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-200 focus:bg-white rounded-2xl py-4 px-6 text-slate-700 outline-none transition-all resize-none h-24"
                placeholder="Say cheers or suggest something cool..."
              />
            </div>
          </div>

          {provider === SupportProvider.PayPal && scriptLoaded && (
            <div className="space-y-4">
              <div ref={paypalContainerRef} className="w-full min-h-[150px] z-10" />
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink mx-4 text-slate-300 text-[10px] font-bold uppercase tracking-widest">or</span>
                <div className="flex-grow border-t border-slate-100"></div>
              </div>
            </div>
          )}

          {provider !== SupportProvider.PayPal && (
            <button
              onClick={handleDirectPay}
              className="w-full py-5 bg-[#1e293b] text-white rounded-2xl font-bold text-lg hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center justify-center space-x-3"
            >
              <span>Proceed to {provider}</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          )}

          {error && (
            <p className="mt-4 text-[11px] text-amber-600 bg-amber-50 p-3 rounded-xl text-center font-bold">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportModal;