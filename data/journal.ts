import { JournalPost, JournalCategory } from '../types';

/**
 * Static Journal content.
 *
 * This is intentionally plain data — no UI logic lives here. Swapping this
 * for a CMS or database later just means replacing the export below with a
 * fetch call; every component that consumes `getAllPosts()` etc. stays the same.
 */
export const journalPosts: JournalPost[] = [
  {
    id: '10',
    slug: 'contactgate-automated-workflow',
    title: 'Building a new automated contact workflow',
    excerpt: "Today I'm working on improving ContactGate's automated communication flow — cutting down the manual steps between a contact unlock and the follow-up message.",
    content: [
      "Today I'm working on improving ContactGate's automated communication flow — cutting down the manual steps between a contact unlock and the follow-up message.",
      "The goal is simple: once a payment clears, the whole handoff — unlocking the contact, notifying both sides, and logging the transaction — should happen without anyone needing to check a dashboard.",
      "Most of the day went into mapping the event flow and deciding where automation should live versus where a human check still makes sense. Small, unglamorous work, but it's the kind that makes a product feel reliable.",
    ],
    date: '2026-09-17',
    category: 'Projects',
    tags: ['ContactGate', 'Automation', 'WebDevelopment'],
    featured: true,
    links: [
      { label: 'GitHub', url: 'https://github.com/pantane1' },
    ],
    sharedOn: ['instagram', 'linkedin'],
  },
  {
    id: '9',
    slug: 'pcea-kandengwa-production-migration',
    title: 'Migrating a church management system to production',
    excerpt: 'Moving the PCEA Kandengwa church management system from a working prototype to a stable, production-ready full-stack build.',
    content: [
      'Moving the PCEA Kandengwa church management system from a working prototype to a stable, production-ready full-stack build.',
      "This stage of a project is less exciting than the first build but just as important — hardening the auth flow, tightening database constraints, and making sure the app behaves predictably when real people are using it daily rather than just during testing.",
      "It's a good reminder that 'done' and 'production-ready' are two different milestones.",
    ],
    date: '2026-09-15',
    category: 'Work',
    tags: ['PCEA Kandengwa', 'FullStack', 'ProductionReady'],
  },
  {
    id: '8',
    slug: 'ble-peripheral-mode-attendbt',
    title: 'Digging into BLE peripheral mode for AttendBT',
    excerpt: 'Spent the day deep in Bluetooth Low Energy peripheral mode behavior on mobile — the kind of platform-level detail that only shows up once you actually ship.',
    content: [
      'Spent the day deep in Bluetooth Low Energy peripheral mode behavior on mobile — the kind of platform-level detail that only shows up once you actually ship.',
      'AttendBT relies on nearby-device detection to mark attendance automatically, which sounds straightforward until you hit the real-world inconsistencies between how different devices advertise and scan for BLE signals.',
      "Today's win: a clearer mental model of how to keep detection reliable without draining battery life. Writing it down now so future-me doesn't have to relearn it.",
    ],
    date: '2026-09-12',
    category: 'Learning',
    tags: ['AttendBT', 'Bluetooth', 'ExpoReactNative'],
    links: [
      { label: 'GitHub', url: 'https://github.com/pantane1' },
    ],
  },
  {
    id: '7',
    slug: 'why-postgres-by-default',
    title: 'Why I default to Postgres for every new SaaS build',
    excerpt: "A short breakdown of why Postgres has become my default choice for new projects — even the ones that start out simple.",
    content: [
      "A short breakdown of why Postgres has become my default choice for new projects — even the ones that start out simple.",
      "It's rarely about needing every advanced feature on day one. It's about not having to migrate later when a project that started as 'just an MVP' turns into something a client depends on.",
      "Relational integrity, solid JSON support when I need flexibility, and the ecosystem around tools like Supabase make it an easy default rather than a decision I have to keep re-making per project.",
    ],
    date: '2026-09-09',
    category: 'Blog',
    tags: ['Postgres', 'BackendDevelopment', 'SoftwareArchitecture'],
  },
  {
    id: '6',
    slug: 'mpesa-payment-integration-service',
    title: 'Now offering M-Pesa & Lipana payment integration',
    excerpt: 'Formalizing something I already do a lot of: wiring M-Pesa and other payment flows directly into web and mobile apps.',
    content: [
      'Formalizing something I already do a lot of: wiring M-Pesa and other payment flows directly into web and mobile apps.',
      "If you're building for the Kenyan market and need STK push, payment confirmation handling, or a paywall-style unlock flow done properly — webhook verification, retries, and all — this is a service I offer directly.",
      "No invented pricing here — every engagement starts with understanding what you're building and scoping it from there.",
    ],
    date: '2026-09-05',
    category: 'Services',
    tags: ['MPesa', 'Lipana', 'PaymentIntegration'],
    service: { cta: 'Request this service' },
  },
  {
    id: '5',
    slug: 'devtools-26-tools-milestone',
    title: 'Pantane DevTools crossed 26 shipped tools',
    excerpt: "A small milestone worth noting: Pantane DevTools now has 26 live utilities, each one built to solve a problem I kept running into myself.",
    content: [
      "A small milestone worth noting: Pantane DevTools now has 26 live utilities, each one built to solve a problem I kept running into myself.",
      "The platform started as a handful of quick converters and has grown into something I reach for regularly in my own workflow — which is the best sign that it's worth continuing to build on.",
    ],
    date: '2026-09-02',
    category: 'Achievements',
    tags: ['PantaneDevTools', 'Milestone', 'NextJS'],
    links: [
      { label: 'GitHub', url: 'https://github.com/pantane1' },
    ],
  },
  {
    id: '4',
    slug: 'pantane-journal-is-live',
    title: 'Pantane Journal is live',
    excerpt: "Social media is where I distribute what I'm building. This Journal is where I permanently document and archive it.",
    content: [
      "Social media is where I distribute what I'm building. This Journal is where I permanently document and archive it.",
      "Going forward, this is where you'll find real updates on projects I'm shipping, things I'm learning, services I offer, and the occasional longer write-up — without it disappearing into a feed after 24 hours.",
      "Thanks for following along.",
    ],
    date: '2026-08-28',
    category: 'Announcements',
    tags: ['PantaneHub', 'Journal', 'Announcement'],
    sharedOn: ['instagram', 'linkedin', 'twitter'],
  },
  {
    id: '3',
    slug: 'how-i-structure-a-new-client-build',
    title: 'A look at how I structure a new client build',
    excerpt: 'A behind-the-scenes walk-through of the first few steps I take on every new project, before a single line of feature code gets written.',
    content: [
      'A behind-the-scenes walk-through of the first few steps I take on every new project, before a single line of feature code gets written.',
      'It usually starts with mapping the data model, deciding on auth and access boundaries early, and setting up a deployment pipeline before the UI exists — it saves a lot of rework later.',
      "It's not the most visible part of the work, but it's the part that determines how smoothly everything after it goes.",
    ],
    date: '2026-08-24',
    category: 'Behind the Scenes',
    tags: ['ProcessNotes', 'ClientWork', 'SoftwareEngineering'],
  },
  {
    id: '2',
    slug: 'web-development-for-kenyan-businesses',
    title: 'Web development for Kenyan businesses',
    excerpt: 'Modern, fast websites and web applications for businesses, organizations, and personal brands — built with the Kenyan market in mind.',
    content: [
      'Modern, fast websites and web applications for businesses, organizations, and personal brands — built with the Kenyan market in mind.',
      'That includes thinking about local payment methods, slower network conditions, and mobile-first usage from the start rather than as an afterthought.',
      "If you have an idea for a site or web app and want it built properly, this is one of the core services I offer.",
    ],
    date: '2026-08-20',
    category: 'Services',
    tags: ['WebDevelopment', 'KenyanMarket', 'Services'],
    service: { cta: 'Request this service' },
  },
  {
    id: '1',
    slug: 'kijani-ai-research-assistant',
    title: 'Kijani AI: a research assistant for forestry researchers',
    excerpt: 'An early look at Kijani AI — a prototype built to help forestry researchers at KEFRI work through research material faster with an AI assistant.',
    content: [
      'An early look at Kijani AI — a prototype built to help forestry researchers at KEFRI work through research material faster with an AI assistant.',
      "The frontend is a React/Vite/TypeScript app talking to an Express backend — kept intentionally simple so the focus stays on getting the assistant experience right before adding more surface area.",
      "Still early days, but it's a good example of the kind of AI-and-automation work I enjoy building.",
    ],
    date: '2026-08-15',
    category: 'Projects',
    tags: ['KijaniAI', 'AI', 'Automation'],
  },
];

export const JOURNAL_CATEGORIES: (JournalCategory | 'All')[] = [
  'All',
  'Work',
  'Projects',
  'Learning',
  'Blog',
  'Services',
  'Achievements',
  'Announcements',
  'Behind the Scenes',
];

/** All posts, newest first. */
export const getAllPosts = (): JournalPost[] =>
  [...journalPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

/** The most recently published post — gets special "Today" treatment on the feed. */
export const getLatestPost = (): JournalPost | undefined => getAllPosts()[0];

export const getPostsByCategory = (category: JournalCategory | 'All'): JournalPost[] => {
  const all = getAllPosts();
  return category === 'All' ? all : all.filter(p => p.category === category);
};

export const getPostBySlug = (slug: string): JournalPost | undefined =>
  journalPosts.find(p => p.slug === slug);

export const getRelatedPosts = (post: JournalPost, limit = 3): JournalPost[] =>
  getAllPosts()
    .filter(p => p.id !== post.id && p.category === post.category)
    .slice(0, limit);

export const searchPosts = (posts: JournalPost[], query: string): JournalPost[] => {
  const q = query.trim().toLowerCase();
  if (!q) return posts;
  return posts.filter(p =>
    p.title.toLowerCase().includes(q) ||
    p.excerpt.toLowerCase().includes(q) ||
    p.content.some(c => c.toLowerCase().includes(q)) ||
    p.category.toLowerCase().includes(q) ||
    p.tags.some(t => t.toLowerCase().includes(q))
  );
};

/** True if a post was published on the current calendar day. */
export const isToday = (post: JournalPost): boolean => {
  const today = new Date();
  const postDate = new Date(post.date);
  return (
    today.getFullYear() === postDate.getFullYear() &&
    today.getMonth() === postDate.getMonth() &&
    today.getDate() === postDate.getDate()
  );
};
