import { JournalPost, JournalCategory } from '../types';
import journalPostsData from './journal.json';

/**
 * Journal content lives in ./journal.json — plain data, no UI logic here.
 *
 * The admin panel at /admin/journal edits this same JSON file (via the backend,
 * which commits straight to this repo), so posts made there show up here too
 * once Vercel redeploys. Every component that consumes `getAllPosts()` etc.
 * stays the same either way.
 */
export const journalPosts: JournalPost[] = journalPostsData as JournalPost[];

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
