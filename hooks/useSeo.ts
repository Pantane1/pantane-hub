import { useEffect } from 'react';
import { SITE_URL, DEFAULT_OG_IMAGE } from '../data/pageSeo';

interface SeoOptions {
  title: string;
  description: string;
  /** Route path, e.g. '/', '/projects', '/journal/some-slug'. */
  path: string;
  image?: string;
  type?: 'website' | 'article';
  /** Set true for pages that shouldn't be indexed (e.g. a 404). */
  noindex?: boolean;
}

/** Get-or-create a <meta> tag by name/property, set its content, and return
 *  a restore function that puts the previous value (or removes the tag)
 *  back — same pattern used for the static <head> tags in index.html. */
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

/**
 * Sets per-page title, meta description, robots, OG/Twitter tags, and
 * canonical link on mount; restores the previous (site-default) values on
 * unmount. Complements — doesn't replace — the static per-route tags
 * scripts/prerender-meta.js bakes into dist/ for crawlers that don't run
 * JS: this hook is what keeps tags correct during client-side SPA
 * navigation (a real visitor clicking between pages without a full reload).
 */
export const useSeo = ({ title, description, path, image = DEFAULT_OG_IMAGE, type = 'website', noindex = false }: SeoOptions) => {
  useEffect(() => {
    const prevTitle = document.title;
    const url = `${SITE_URL}${path}`;
    document.title = title;

    const restoreFns = [
      setMetaTag('name', 'description', description),
      setMetaTag('name', 'robots', noindex ? 'noindex, follow' : 'index, follow'),
      setMetaTag('property', 'og:type', type),
      setMetaTag('property', 'og:url', url),
      setMetaTag('property', 'og:title', title),
      setMetaTag('property', 'og:description', description),
      setMetaTag('property', 'og:image', image),
      setMetaTag('name', 'twitter:url', url),
      setMetaTag('name', 'twitter:title', title),
      setMetaTag('name', 'twitter:description', description),
      setMetaTag('name', 'twitter:image', image),
      setLinkTag('canonical', url),
    ];

    return () => {
      document.title = prevTitle;
      restoreFns.forEach(fn => fn());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, path, image, type, noindex]);
};
