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

export type SocialPlatform = 'github' | 'linkedin' | 'twitter' | 'instagram' | 'facebook' | 'whatsapp';

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
