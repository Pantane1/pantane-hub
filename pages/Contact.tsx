import React, { useState } from "react";
import emailjs from "@emailjs/browser";

const Contact: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;

    try {
      await emailjs.sendForm(
        "service_65nlo8m",      
        "template_b1391e3",     
        form,
        "6B39GrANe3KTTGYGH"     
      );

      setSubmitted(true);
      form.reset();
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      console.error("Email send failed:", err);
      setError("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in max-w-5xl mx-auto space-y-16">
      <div className="grid lg:grid-cols-2 gap-16">
        {/* Left Section */}
        <div className="space-y-8">
          <h1 className="text-5xl font-extrabold text-slate-900 leading-tight">
            Have a project in mind?<br />
            <span className="text-blue-600">Let's build it.</span>
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed">
            Have an idea, a project, or a collaboration in mind? Reach out - I'm always open.
          </p>

          <div className="space-y-6 pt-4">
            <a href="mailto:pantane254@gmail.com" className="flex items-center space-x-6 group">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center">
                {/* Email Icon */}
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M4 4h16v16H4z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Email</p>
                <p className="text-lg font-bold text-slate-800">pantane254@gmail.com</p>
              </div>
            </a>

            <a href="https://wa.me/254740312402" className="flex items-center space-x-6 group">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center">
                {/* WhatsApp Icon */}
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M..." />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">WhatsApp</p>
                <p className="text-lg font-bold text-slate-800">+254 740 312 402</p>
              </div>
            </a>
          </div>
        </div>

        {/* Right Section */},
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl">
          {submitted ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Message Received!</h3>
              <p className="text-slate-500">Thanks for reaching out. I'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Your Name</label>
                  <input
                    required
                    type="text"
                    name="from_name"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                  <input
                    required
                    type="email"
                    name="from_email"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Message</label>
                <textarea
                  required
                  rows={5}
                  name="message"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl"
                  placeholder="Tell me about your project..."
                />
              </div>
              {error && <p className="text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-bold text-lg"
              >
                {loading ? "Sending..." : "Send Message"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contact;
