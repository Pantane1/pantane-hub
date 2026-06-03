<h1>
  <img src="https://raw.githubusercontent.com/Pantane1/wamuhu-martin/main/favcon.png" width="32" style="vertical-align: middle;" />
  Pantane Hub
</h1>

[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vitejs.dev/)
[![Status](https://img.shields.io/badge/Status-Live-success)](#)

> **Built different. Built in Kenya.**

**Pantane Hub** is a high-performance professional portfolio built by **[Pantane](https://www.pantane.is-a.dev)**. A central showcase for software projects, professional connections, and technical explorations — with deep integrations for the East African market.

[**Explore the Live Site ↗**](https://www.pantane.is-a.dev)

---

## ✨ Key Features

- **⚡ Real-Time GitHub Sync** — Automatically fetches and displays repositories using the GitHub REST API, with dynamic topic chips, language detection, and branded fallback cards.
- **💳 Multi-Channel Payment Ecosystem** — Support system featuring direct M-Pesa STK Push, PayPal, Paystack, and Buy Me a Coffee.
- **🛣️ Clean URL Routing** — Powered by React Router v6 with proper browser history (`/projects`, `/contact`, `/support`) — no hash URLs.
- **📱 Mobile-First Design** — Fully responsive with a hamburger menu, fluid animations, and a clean bright aesthetic.
- **🎨 Custom Branding** — Unique SVG iconography, consistent design language, and branded project card fallbacks.
- **🛡️ Production-Ready** — CORS-secured backend, webhook signature verification, environment-based config, and Vercel SPA rewrites.

---

## 💰 Payment Integrations

| Method | Provider | Market |
| :--- | :--- | :--- |
| **Lipa na M-Pesa** | [Lipana](https://lipana.dev) — STK Push | Kenya 🇰🇪 |
| **PayPal** | PayPal SDK | Global 🌍 |
| **Paystack** | Paystack Inline | Africa 🌍 |
| **Buy Me a Coffee** | URI redirect | Global 🌍 |

---

## 🛠 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 6 |
| **Styling** | Tailwind CSS 3 (PostCSS — no CDN) |
| **Routing** | React Router v6 (BrowserRouter) |
| **Backend** | Node.js, Express — deployed on Render |
| **Payments** | M-Pesa via Lipana, PayPal, Paystack |
| **Email** | EmailJS |
| **Data** | GitHub REST API |
| **Deployment** | Vercel (frontend) + Render (backend) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Local Development

1. **Clone the repo:**
   ```bash
   git clone https://github.com/pantane1/pantane-hub.git
   cd pantane-hub
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Fill in your values
   ```

4. **Start the dev server:**
   ```bash
   npm run dev
   ```
   Site runs at `http://localhost:3000`

### Backend (separate)

```bash
cd server
npm install
cp .env.example .env
# Fill in Lipana keys and FRONTEND_URL
node index.js
```

### Production Build

```bash
npm run build
```

---

## 🔑 Environment Variables

### Frontend (`.env`)

| Variable | Description |
| :--- | :--- |
| `VITE_API_URL` | Your Render backend URL |
| `VITE_EMAILJS_SERVICE_ID` | EmailJS service ID |
| `VITE_EMAILJS_TEMPLATE_ID` | EmailJS template ID |
| `VITE_EMAILJS_PUBLIC_KEY` | EmailJS public key |
| `VITE_GITHUB_TOKEN` | GitHub fine-grained token (optional, prevents rate limiting) |

### Backend (`server/.env`)

| Variable | Description |
| :--- | :--- |
| `LIPANA_SECRET_KEY` | Lipana API secret key |
| `LIPANA_WEBHOOK_SECRET` | Lipana webhook signing secret |
| `FRONTEND_URL` | Your Vercel frontend URL (no trailing slash) |
| `PORT` | Server port (default: 3000) |
| `NODE_ENV` | `production` or `development` |

---

## 📂 Structure

```text
pantane-hub/
├── components/
│   ├── Layout.tsx        # Header, Footer, TechMarquee
│   ├── Icons.tsx         # Custom SVG icon components
│   ├── MpesaModal.tsx    # STK Push modal
│   ├── SupportModal.tsx  # PayPal / Paystack / Coffee modal
│   └── MouseEffect.tsx   # Cursor effect
├── pages/
│   ├── Home.tsx          # Landing page
│   ├── Projects.tsx      # GitHub repos grid
│   ├── Socials.tsx       # Social links
│   ├── Contact.tsx       # EmailJS contact form
│   └── Support.tsx       # Payment methods
├── server/
│   ├── index.js          # Express server + CORS
│   └── routes/
│       ├── stk.js        # M-Pesa STK Push route
│       └── webhook.js    # Lipana webhook handler
├── types.ts              # TypeScript interfaces & enums
├── App.tsx               # React Router routes
├── index.tsx             # React entry point
├── index.css             # Tailwind directives + global styles
├── tailwind.config.js    # Tailwind content paths
├── vite.config.ts        # Vite config
└── vercel.json           # SPA rewrite rules
```

---

## 🤝 Connect

- 🌐 [pantane.is-a.dev](https://www.pantane.is-a.dev)
- 💼 [LinkedIn](https://www.linkedin.com/in/pantane/)
- 🐙 [GitHub](https://github.com/pantane1)
- 🐦 [Twitter / X](https://twitter.com/pantane4)

---

## 📜 License

© 2026 **Pantane**. All rights reserved. Built with precision in Kenya 🇰🇪

<p align="center">
  <a href="https://www.pantane.is-a.dev"><img src="http://readme-typing-svg.herokuapp.com?color=ACAF50&center=true&vCenter=true&multiline=false&lines=Built+Different" alt="pantane"></a>
</p>
