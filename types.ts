export interface GithubRepo {
  id: number;
  name: string;
  description: string;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  language: string;
  topics: string[];
  updated_at: string;
}

export interface SocialLink {
  platform: string;
  username: string;
  url: string;
  color: string;
}

export enum SupportProvider {
  BUymeACoffee = 'Buy Me a Coffee',
  PayPal       = 'PayPal',
  Paystack     = 'Paystack',
  MPesa        = 'Lipa na M-Pesa',
}

/* ─── Journal ───────────────────────────────────────────────────────────────── */
export type JournalCategory =
  | 'Work'
  | 'Projects'
  | 'Learning'
  | 'Blog'
  | 'Services'
  | 'Achievements'
  | 'Announcements'
  | 'Behind the Scenes';

export interface JournalLink {
  label: string;
  url: string;
}

export type SocialPlatform = 'github' | 'linkedin' | 'twitter' | 'instagram' | 'facebook' | 'whatsapp' | 'telegram';

export interface JournalPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  /** Body content as an array of paragraphs. */
  content: string[];
  /** ISO date string, e.g. 2026-09-17 */
  date: string;
  category: JournalCategory;
  tags: string[];
  image?: string;
  featured?: boolean;
  links?: JournalLink[];
  sharedOn?: SocialPlatform[];
  service?: {
    cta: string;
  };
}

/* ─── Sharp ─────────────────────────────────────────────────────────────────── */
export type SharpCategory = 'Deals' | 'Rewards' | 'Referrals' | 'Opportunities' | 'Services';
export type SharpStatus = 'active' | 'expired';
/** 'reward' (default when omitted) is the Absa/Loop style: reward + referral +
 *  external CTA. 'buying' and 'service-request' are marketplace/service
 *  listings that collect a request via SharpRequestForm instead. */
export type SharpDealType = 'reward' | 'buying' | 'service-request';

export interface SharpRequestField {
  name: string;
  label: string;
  type: 'text' | 'select' | 'textarea';
  placeholder?: string;
  required?: boolean;
  /** For type: 'select'. */
  options?: string[];
}

export interface SharpDeal {
  id: string;
  slug: string;
  title: string;
  category: SharpCategory;
  /** Short line for the card grid. */
  description: string;
  /** Longer "what you get" copy for the deal detail page. */
  whatYouGet: string;
  thumbnail?: string;
  dealType?: SharpDealType;
  /** Display value, e.g. "KSh 50". Only meaningful for dealType 'reward'. */
  reward?: string;
  referralReward?: string;
  status: SharpStatus;
  /** Overrides the status badge's displayed text (e.g. "Buying",
   *  "Available on Request") while `status` still governs active/expired logic. */
  statusLabel?: string;
  /** Overrides the card/detail "Get {reward}" headline for non-reward deal types. */
  cardHeadline?: string;
  /** ISO date string. */
  datePosted: string;
  /** ISO date string — past this, the deal is treated as expired even if status is still 'active'. */
  deadline?: string;
  steps: string[];
  referralCode?: string;
  externalUrl?: string;
  externalLabel?: string;
  importantNotes?: string;
  /** dealType 'buying': platforms accepted, e.g. ["X (Twitter)", "Instagram"]. */
  platforms?: string[];
  /** dealType 'buying' | 'service-request': short informational note about pricing/availability. */
  pricingNote?: string;
  /** dealType 'buying': ownership/authorization requirement. */
  safetyNote?: string;
  /** dealType 'buying' | 'service-request': renders a SharpRequestForm with these fields. */
  requestFields?: SharpRequestField[];
  /** Subject line used in the email sent via SharpRequestForm. */
  requestSubject?: string;
  /** Themed placeholder shown while `thumbnail` is unset or 404s — lets a
   *  deal's provider "energy" come through (brand color, an icon, the
   *  provider's name as plain text) without using any trademarked logo
   *  artwork. `preset` keys into THUMBNAIL_PRESETS in SharpDealCard.tsx
   *  (add new presets there, not raw Tailwind classes here — see that
   *  file's comment for why). Falls back to a generic look if omitted. */
  thumbnailTheme?: {
    preset?: string;
    icon: string;
    wordmark?: string;
  };
}
