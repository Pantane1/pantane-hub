/**
 * What PantaneHub offers. This is the single source for the Services page, the
 * homepage teaser, the inquiry form's service dropdown, and the page's structured
 * data — edit here and all of them update.
 *
 * Deliberately NO prices and NO result claims. `relatedProjects` is empty until you
 * decide which real projects to link to (add { name, url } entries).
 */
export interface ServiceCategory {
  id: string;            // URL anchor (/services#id) and ?service= preselect for /start-project
  icon: string;
  name: string;
  problem: string;       // the business problem this solves
  description: string;
  services: string[];    // specific offerings
  deliverables: string[];
  technologies: string[];
  relatedProjects: { name: string; url: string }[];
}

export const serviceCategories: ServiceCategory[] = [
  {
    id: 'websites',
    icon: '🌐',
    name: 'Websites & Landing Pages',
    problem: 'You need a fast, credible online presence that turns visitors into customers.',
    description:
      'Modern, mobile-first websites for businesses, brands and individuals — built to load quickly, look professional and make it easy for people to contact you.',
    services: ['Business websites', 'Portfolio websites', 'Landing pages', 'E-commerce and online stores'],
    deliverables: ['Responsive design for phones, tablets and desktops', 'SEO-ready page structure', 'Contact, WhatsApp and payment hooks', 'Domain, hosting and deployment setup'],
    technologies: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Vercel'],
    relatedProjects: [],
  },
  {
    id: 'web-apps',
    icon: '🧩',
    name: 'Web Applications & Business Systems',
    problem: 'Spreadsheets and manual processes are slowing your business down.',
    description:
      'Custom full-stack applications that replace manual work — with secure logins, a proper database and dashboards your team can actually use.',
    services: ['Full-stack web applications', 'Authentication and user dashboards', 'Database-driven systems', 'Business management systems'],
    deliverables: ['Custom interface and user flows', 'Secure sign-in and user roles', 'Database design and API', 'Admin dashboard', 'Deployment and handover'],
    technologies: ['React', 'Next.js', 'Node.js', 'Express', 'PostgreSQL', 'MongoDB', 'Supabase'],
    relatedProjects: [],
  },
  {
    id: 'payments-apis',
    icon: '💳',
    name: 'Payments & API Integrations',
    problem: "Collecting money and connecting your systems shouldn't be a manual job.",
    description:
      'M-Pesa and payment-gateway integrations, plus REST APIs that connect your software to the other tools your business relies on.',
    services: ['M-Pesa integrations (STK Push)', 'Payment gateway integrations', 'REST API development', 'Third-party integrations'],
    deliverables: ['Payment flow from checkout to confirmation', 'Callback / webhook handling', 'Documented REST endpoints', 'Error handling and retries'],
    technologies: ['M-Pesa (Daraja / Lipana)', 'Node.js', 'Express', 'REST', 'Webhooks'],
    relatedProjects: [],
  },
  {
    id: 'ai-automation',
    icon: '🤖',
    name: 'AI & Automation',
    problem: 'Repetitive tasks and repeat customer questions eat your team’s time.',
    description:
      'AI-powered chatbots and automations that answer common questions, move data between your tools and handle routine work in the background.',
    services: ['AI chatbots (including WhatsApp)', 'Business process automation', 'Intelligent assistants', 'AI integrations'],
    deliverables: ['Chatbot design and knowledge setup', 'Workflow automation', 'Integration with your existing tools', 'Deployment and basic monitoring'],
    technologies: ['Gemini API', 'Node.js', 'Python', 'Firebase', 'WhatsApp integrations'],
    relatedProjects: [],
  },
  {
    id: 'maintenance',
    icon: '🛠️',
    name: 'Maintenance & Technical Support',
    problem: 'Your site or app needs reliable care after launch.',
    description:
      'Ongoing help to keep what you have running well — fixing bugs, speeding things up and sorting out hosting, domains and deployment.',
    services: ['Website maintenance', 'Bug fixes', 'Performance improvements', 'Deployment and hosting assistance'],
    deliverables: ['Issue diagnosis and fixes', 'Speed and reliability review', 'Hosting, domain and DNS setup', 'Handover notes'],
    technologies: ['Vercel', 'Render', 'GitHub', 'DNS & domains'],
    relatedProjects: [],
  },
];

export const processSteps = [
  { n: '01', title: 'Discover', text: 'You tell me what you need and what success looks like.' },
  { n: '02', title: 'Plan', text: 'We agree the scope, timeline and a quote that fits it.' },
  { n: '03', title: 'Build', text: 'I develop and test, sharing progress along the way.' },
  { n: '04', title: 'Deploy & support', text: 'Launch, handover, and help afterwards.' },
];
