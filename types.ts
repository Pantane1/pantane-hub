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
export type SharpCategory = 'Deals' | 'Rewards' | 'Referrals' | 'Opportunities';
export type SharpStatus = 'active' | 'expired';

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
  /** Display value, e.g. "KSh 50". */
  reward: string;
  referralReward?: string;
  status: SharpStatus;
  /** ISO date string. */
  datePosted: string;
  /** ISO date string — past this, the deal is treated as expired even if status is still 'active'. */
  deadline?: string;
  steps: string[];
  referralCode?: string;
  externalUrl?: string;
  externalLabel?: string;
  importantNotes?: string;
}
