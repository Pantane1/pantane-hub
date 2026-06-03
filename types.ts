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
