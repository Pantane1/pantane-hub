import { SharpDeal, SharpCategory } from '../types';
import sharpDealsData from './sharp.json';

/**
 * Sharp deal content lives in ./sharp.json — plain data, no UI logic here.
 * Adding a new deal later means adding one object to that JSON file; every
 * component that consumes the helpers below stays exactly the same.
 */
export const sharpDeals: SharpDeal[] = sharpDealsData as SharpDeal[];

export const SHARP_CATEGORIES: (SharpCategory | 'All')[] = ['All', 'Deals', 'Rewards', 'Referrals', 'Opportunities', 'Services'];

/** All deals, newest first. */
export const getAllDeals = (): SharpDeal[] =>
  [...sharpDeals].sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime());

/** True once a deal's deadline has passed, even if its stored status is still 'active'. */
export const isDealExpired = (deal: SharpDeal): boolean => {
  if (deal.status === 'expired') return true;
  if (deal.deadline) return new Date(deal.deadline).getTime() < Date.now();
  return false;
};

/** The featured deal shown at the top of the feed — newest active (non-expired)
 *  reward-type deal, if any. Marketplace/service listings (dealType 'buying'
 *  or 'service-request') use their own card framing and aren't eligible for
 *  the featured slot, which is built around the "Get {reward}" reward format. */
export const getFeaturedDeal = (): SharpDeal | undefined => {
  const rewardDeals = getAllDeals().filter(d => !d.dealType || d.dealType === 'reward');
  return rewardDeals.find(d => !isDealExpired(d)) || rewardDeals[0];
};

export const getDealsByCategory = (category: SharpCategory | 'All'): SharpDeal[] => {
  const all = getAllDeals();
  return category === 'All' ? all : all.filter(d => d.category === category);
};

export const getDealBySlug = (slug: string): SharpDeal | undefined =>
  sharpDeals.find(d => d.slug === slug);
