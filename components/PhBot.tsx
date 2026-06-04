import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/* ─── Types ─────────────────────────────────────────────────────────────────── */
interface Message {
  id: string;
  role: 'bot' | 'user';
  text: string;
  time: string;
}

interface QuickReply {
  label: string;
  action: 'navigate' | 'message';
  value: string;
}

/* ─── Constants ─────────────────────────────────────────────────────────────── */
const SYSTEM_PROMPT = `You are PH-Bot, the friendly AI assistant embedded in Pantane Hub — the professional portfolio of Pantane, a full-stack software developer based in Kenya (Kikuyu, Kiambu County).

Your job is to help visitors learn about Pantane, his work, and how to connect with him.

KEY FACTS ABOUT PANTANE:
- Name: Pantane (GitHub: Pantane1)
- Brand: Pantane Designs / Pantane Hub
- Location: Kenya (Kikuyu, Kiambu County)
- Education: BSc Mathematics & Computer Science, Meru University of Science and Technology
- Status: Available for new opportunities and freelance projects

TECH STACK:
- Frontend: React, Next.js, TypeScript, Vite, Tailwind CSS, Expo (React Native)
- Backend: Node.js, Express, Laravel, Python
- Databases: MySQL, MongoDB, Firebase Firestore, PostgreSQL, TiDB Serverless
- Payments: M-Pesa (Lipana STK Push), Paystack, Pesapal, PayPal
- Deployment: Vercel, Render
- Other: MediaPipe, Three.js, Africa's Talking, EmailJS, WhatsApp Cloud API, Gemini AI

NOTABLE PROJECTS:
- Pantane Hub — this portfolio site (React/TypeScript/Vite, live at pantane.is-a.dev)
- chakra-core — browser-based AI hand tracking + anime AR aura effects (MediaPipe + Three.js)
- Pewa — Swahili gig marketplace (Next.js, Firebase, Lipana, Africa's Talking)
- WAS (Wireless Attendance System) — university BLE/WiFi Android attendance app
- Duka App — Kenyan e-commerce with M-Pesa payments
- SciCalc Pro — monetized scientific calculator with M-Pesa paywall
- ShauriBot — WhatsApp AI chatbot (Gemini + Firebase)
- Auto-Link v2 — community coordination platform (Next.js + Firebase)
- Expense Tracker — personal finance app (Next.js, MySQL/TiDB, Recharts)

CONTACT:
- Email: pantane254@gmail.com
- WhatsApp: +254 740 312 402
- GitHub: github.com/pantane1
- LinkedIn: linkedin.com/in/pantane
- Twitter: @pantane4
- Live site: pantane.is-a.dev

SITE PAGES:
- / → Home
- /projects → GitHub projects
- /socials → Social links
- /contact → Contact form
- /support → Support / payments

PERSONALITY:
- Friendly, concise, professional
- Speak naturally — not robotic
- Keep responses short (2-4 sentences max unless asked for detail)
- If asked something you don't know about Pantane, say you're not sure and suggest contacting him directly
- Never make up projects or skills that aren't listed above
- Always reply in the same language the user writes in`;

const QUICK_REPLIES: QuickReply[] = [
  { label: '🚀 View Projects',   action: 'navigate', value: '/projects' },
  { label: '💼 Hire Pantane',    action: 'navigate', value: '/contact'  },
  { label: '☕ Support',         action: 'navigate', value: '/support'  },
  { label: '🛠 Tech Stack',      action: 'message',  value: "What's Pantane's tech stack?" },
  { label: '📍 Location',        action: 'message',  value: 'Where is Pantane based?'      },
  { label: '📬 Contact Info',    action: 'message',  value: "What's the best way to contact Pantane?" },
];

const GREETING: Message = {
  id: 'greeting',
  role: 'bot',
  text: "Hey there! 👋 I'm **PH-Bot**, Pantane's AI assistant. I can tell you about his work, tech stack, projects, or help you get in touch. What would you like to know?",
  time: new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }),
};

/* ─── Markdown-lite renderer ────────────────────────────────────────────────── */
const renderText = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
};

/* ─── Component ─────────────────────────────────────────────────────────────── */
const PhBot: React.FC = () => {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const navigate  = useNavigate();

  /* Auto-scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  /* Focus input when opened */
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const timestamp = () =>
    new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });

  const addMessage = (role: 'bot' | 'user', text: string) => {
    const msg: Message = { id: Date.now().toString(), role, text, time: timestamp() };
    setMessages(prev => [...prev, msg]);
    return msg;
  };

  const sendToGemini = async (userText: string, history: Message[]) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error('Gemini API key not set');

    // Build conversation history for Gemini
    const contents = history
      .filter(m => m.id !== 'greeting')
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));

    // Add current message
    contents.push({ role: 'user', parts: [{ text: userText }] });

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
        }),
      }
    );

    if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm not sure about that. Try contacting Pantane directly at pantane254@gmail.com!";
  };

  const handleSend = async (text?: string) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput('');

    addMessage('user', userText);
    setLoading(true);

    try {
      const reply = await sendToGemini(userText, messages);
      addMessage('bot', reply);
    } catch (err) {
      console.error('PH-Bot error:', err);
      addMessage('bot', "Oops, something went wrong on my end. You can reach Pantane directly at **pantane254@gmail.com** or on WhatsApp **+254 740 312 402**.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickReply = (qr: QuickReply) => {
    if (qr.action === 'navigate') {
      addMessage('user', qr.label);
      setTimeout(() => {
        addMessage('bot', `Taking you to ${qr.label.replace(/^[^ ]+ /, '')}...`);
        setTimeout(() => { navigate(qr.value); setOpen(false); }, 800);
      }, 200);
    } else {
      handleSend(qr.value);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setHasOpened(true);
  };

  return (
    <>
      {/* ── Floating Button ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Tooltip — show before first open */}
        {!hasOpened && !open && (
          <div className="bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-2xl shadow-lg animate-bounce">
            Ask me anything 👋
          </div>
        )}

        <button
          onClick={() => open ? setOpen(false) : handleOpen()}
          className="w-14 h-14 bg-slate-900 hover:bg-slate-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 relative"
          aria-label="Open PH-Bot"
        >
          {open ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
            </svg>
          )}
          {/* Online dot */}
          <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
        </button>
      </div>

      {/* ── Chat Window ── */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[340px] sm:w-[380px] bg-white rounded-[1.75rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
          style={{ maxHeight: '520px', animation: 'slideUp 0.3s cubic-bezier(0.22,1,0.36,1) forwards' }}>

          {/* Header */}
          <div className="bg-slate-900 px-5 py-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-400 rounded-full flex items-center justify-center text-slate-900 font-black text-sm flex-shrink-0">
              PH
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm leading-none">PH-Bot</p>
              <p className="text-slate-400 text-[11px] mt-0.5">Pantane's AI Assistant · Online</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white transition-colors p-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50" style={{ minHeight: 0 }}>
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-slate-900 text-white rounded-br-md'
                      : 'bg-white text-slate-800 border border-slate-100 shadow-sm rounded-bl-md'
                  }`}>
                    {renderText(msg.text)}
                  </div>
                  <p className={`text-[10px] text-slate-400 mt-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-md flex gap-1.5 items-center">
                  {[0,1,2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Replies — only show after greeting with no user messages yet */}
          {messages.filter(m => m.role === 'user').length === 0 && (
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
              {QUICK_REPLIES.map(qr => (
                <button key={qr.label} onClick={() => handleQuickReply(qr)}
                  className="flex-shrink-0 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-full text-[11px] font-semibold hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all whitespace-nowrap">
                  {qr.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 bg-white border-t border-slate-100 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask me anything..."
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all disabled:opacity-50"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-slate-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            </button>
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-white border-t border-slate-50 text-center">
            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">Powered by Gemini · Pantane Hub</p>
          </div>
        </div>
      )}
    </>
  );
};

export default PhBot;
