import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPostBySlug, getRelatedPosts } from '../data/journal';
import { CategoryBadge, formatJournalDate } from '../components/JournalCard';
import JournalCard from '../components/JournalCard';
import { SocialPlatform } from '../types';
import { GithubIcon, LinkedInIcon, TwitterIcon, InstagramIcon, FacebookIcon, WhatsAppIcon } from '../components/Icons';

/* Reuses the same accounts already listed on the Socials page — nothing new invented here. */
const SOCIAL_META: Record<SocialPlatform, { name: string; url: string; icon: React.ReactNode; color: string }> = {
  github:    { name: 'GitHub',    url: 'https://github.com/pantane1',                                   icon: <GithubIcon className="w-4 h-4" />,    color: '#181717' },
  linkedin:  { name: 'LinkedIn',  url: 'https://www.linkedin.com/in/pantane/',                           icon: <LinkedInIcon className="w-4 h-4" />,  color: '#0A66C2' },
  twitter:   { name: 'Twitter / X', url: 'https://twitter.com/pantane4',                                 icon: <TwitterIcon className="w-4 h-4" />,   color: '#000000' },
  instagram: { name: 'Instagram', url: 'https://instagram.com/_pan.tane',                                icon: <InstagramIcon className="w-4 h-4" />, color: '#E4405F' },
  facebook:  { name: 'Facebook',  url: 'https://web.facebook.com/profile.php?id=100095346974516',        icon: <FacebookIcon className="w-4 h-4" />,  color: '#1877F2' },
  whatsapp:  { name: 'WhatsApp',  url: 'https://wa.me/254740312402',                                      icon: <WhatsAppIcon className="w-4 h-4" />,  color: '#25D366' },
};

const ShareButton: React.FC<{ title: string }> = ({ title }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title, url }); return; } catch { /* user cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 hover:border-slate-400 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342a3 3 0 100-2.684m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
      {copied ? 'Link copied!' : 'Share'}
    </button>
  );
};

const NotFound: React.FC = () => (
  <div className="fade-in max-w-lg mx-auto text-center py-20 space-y-5">
    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl mx-auto">🔍</div>
    <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Syne, sans-serif' }}>Entry not found</h1>
    <p className="text-slate-500 text-sm">This Journal entry doesn't exist or may have been moved.</p>
    <Link to="/journal" className="inline-flex items-center px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-700 transition-colors">
      ← Back to Journal
    </Link>
  </div>
);

const SITE_URL = 'https://pantane.is-a.dev';
const DEFAULT_OG_IMAGE = 'https://raw.githubusercontent.com/Pantane1/wamuhu-martin/main/favcon.png';

/** Get-or-create a <meta> tag by name/property, set its content, and return a
 *  restore function that puts the previous value (or removes the tag) back. */
const setMetaTag = (attr: 'name' | 'property', key: string, content: string) => {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.querySelector(selector) as HTMLMetaElement | null;
  const existed = !!el;
  const prevContent = el?.getAttribute('content') ?? null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
  return () => {
    if (!el) return;
    if (existed && prevContent !== null) el.setAttribute('content', prevContent);
    else el.remove();
  };
};

const setLinkTag = (rel: string, href: string) => {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  const existed = !!el;
  const prevHref = el?.getAttribute('href') ?? null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
  return () => {
    if (!el) return;
    if (existed && prevHref !== null) el.setAttribute('href', prevHref);
    else el.remove();
  };
};

const JournalPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPostBySlug(slug) : undefined;

  useEffect(() => {
    if (!post) return;
    const prevTitle = document.title;
    const fullTitle = `${post.title} — Pantane Journal`;
    const url = `${SITE_URL}/journal/${post.slug}`;
    const image = post.image || DEFAULT_OG_IMAGE;

    document.title = fullTitle;

    const restoreFns = [
      setMetaTag('name', 'description', post.excerpt),
      setMetaTag('property', 'og:type', 'article'),
      setMetaTag('property', 'og:url', url),
      setMetaTag('property', 'og:title', fullTitle),
      setMetaTag('property', 'og:description', post.excerpt),
      setMetaTag('property', 'og:image', image),
      setMetaTag('name', 'twitter:url', url),
      setMetaTag('name', 'twitter:title', fullTitle),
      setMetaTag('name', 'twitter:description', post.excerpt),
      setMetaTag('name', 'twitter:image', image),
      setLinkTag('canonical', url),
    ];

    return () => {
      document.title = prevTitle;
      restoreFns.forEach(fn => fn());
    };
  }, [post]);

  if (!post) return <NotFound />;

  const related = getRelatedPosts(post);

  return (
    <div className="fade-in max-w-3xl mx-auto space-y-12">
      <Link to="/journal" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Journal
      </Link>

      <article className="space-y-8">
        <header className="space-y-5">
          <div className="flex items-center gap-3 flex-wrap">
            <CategoryBadge category={post.category} />
            <span className="text-sm text-slate-400 font-medium">{formatJournalDate(post.date)}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
            {post.title}
          </h1>
        </header>

        {post.image && (
          <div className="aspect-video w-full rounded-3xl overflow-hidden bg-slate-100">
            <img src={post.image} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
          </div>
        )}

        <div className="prose-content space-y-5">
          {post.content.map((paragraph, i) => (
            <p key={i} className="text-slate-600 leading-relaxed text-lg">{paragraph}</p>
          ))}
        </div>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {post.tags.map(t => (
              <span key={t} className="px-3 py-1.5 bg-slate-50 text-slate-500 rounded-full text-xs font-semibold">
                #{t}
              </span>
            ))}
          </div>
        )}

        {(post.links?.length || post.sharedOn?.length) && (
          <div className="pt-8 border-t border-slate-100 space-y-6">
            {post.links && post.links.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {post.links.map(link => (
                  <a
                    key={link.url + link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition-colors"
                  >
                    {link.label} <span aria-hidden="true">↗</span>
                  </a>
                ))}
              </div>
            )}

            {post.sharedOn && post.sharedOn.length > 0 && (
              <div className="flex items-center flex-wrap gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Also posted on</span>
                {post.sharedOn.map(platform => {
                  const s = SOCIAL_META[platform];
                  return (
                    <a
                      key={platform}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.name}
                      title={s.name}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-transform hover:scale-110"
                      style={{ backgroundColor: s.color }}
                    >
                      {s.icon}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-4 pt-4">
          <ShareButton title={post.title} />
          {post.service && (
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 text-slate-900 rounded-2xl font-bold text-sm hover:bg-amber-300 hover:shadow-lg transition-all"
            >
              {post.service.cta} <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>
      </article>

      {related.length > 0 && (
        <section className="pt-12 border-t border-slate-100 space-y-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Related entries</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {related.map(p => <JournalCard key={p.id} post={p} />)}
          </div>
        </section>
      )}
    </div>
  );
};

export default JournalPost;
