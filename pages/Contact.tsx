import React, { useState } from 'react';
import emailjs from '@emailjs/browser';

const Contact: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = e.currentTarget;
    try {
      await emailjs.sendForm(
        import.meta.env.VITE_EMAILJS_SERVICE_ID  || 'service_65nlo8m',
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_b1391e3',
        form,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY  || '6B39GrANe3KTTGYGH'
      );
      setSubmitted(true);
      form.reset();
      setTimeout(() => setSubmitted(false), 6000);
    } catch (err) {
      console.error('Email send failed:', err);
      setError('Failed to send message. Please try again or email me directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in max-w-5xl mx-auto space-y-14">
      <div className="grid lg:grid-cols-2 gap-14 items-start">
        {/* Left */}
        <div className="space-y-8 lg:sticky lg:top-28">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Get in touch</p>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
              Have a project in mind?{' '}
              <span className="text-blue-600">Let's build it.</span>
            </h1>
          </div>
          <p className="text-slate-500 leading-relaxed">
            Have an idea, a project, or a collaboration in mind? I'm always open — especially for fintech, mobile, or East African market projects.
          </p>

          <div className="space-y-4">
            {/* Email */}
            <a href="mailto:pantane254@gmail.com" className="flex items-center gap-5 group">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-slate-900 transition-colors">
                <svg className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</p>
                <p className="text-sm font-bold text-slate-800">pantane254@gmail.com</p>
              </div>
            </a>

            {/* WhatsApp */}
            <a href="https://wa.me/254740312402" target="_blank" rel="noopener noreferrer" className="flex items-center gap-5 group">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-[#25D366] transition-colors">
                <svg className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">WhatsApp</p>
                <p className="text-sm font-bold text-slate-800">+254 740 312 402</p>
              </div>
            </a>
          </div>
        </div>

        {/* Right — form */}
        <div className="bg-white p-9 rounded-[2rem] border border-slate-100 shadow-xl">
          {submitted ? (
            <div className="flex flex-col items-center justify-center text-center space-y-5 py-8">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Syne, sans-serif' }}>Message Received!</h3>
              <p className="text-slate-500 text-sm">Thanks for reaching out. I'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Your Name</label>
                  <input required type="text" name="from_name" placeholder="John Doe"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                  <input required type="email" name="from_email" placeholder="john@example.com"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Message</label>
                <textarea required rows={5} name="message" placeholder="Tell me about your project..."
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none" />
              </div>
              {error && <p className="text-red-500 text-xs bg-red-50 px-4 py-3 rounded-xl font-semibold">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-700 transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? 'Sending…' : 'Send Message →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contact;
