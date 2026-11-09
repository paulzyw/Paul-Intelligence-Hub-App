import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const DEFAULT_SITE_TITLE = 'RevOS | AI-Native Revenue Operating System';

/**
 * Maps application paths to dynamic browser tab titles following the convention:
 * - Homepage: exact title from index.html ("RevOS | AI-Native Revenue Operating System")
 * - Other pages: "previous level section name + page name" (e.g. "Platform Overview | RevOS")
 */
export function getPageTitle(pathname: string): string {
  // Clean path (strip trailing slashes, fallback to '/')
  const path = pathname.replace(/\/+$/, '') || '/';

  // 1. Homepage
  if (path === '/') {
    return DEFAULT_SITE_TITLE;
  }

  // 2. Product & RevOS Suite
  if (path === '/product/overview/revos') {
    return 'Platform Overview | RevOS';
  }
  if (path === '/product/revos') {
    return 'Open RevOS | RevOS Dashboard';
  }
  if (path === '/product/revos/pipeline') {
    return 'Open RevOS | Pipeline Assessment';
  }
  if (path === '/product/revos/gtmos') {
    return 'Open RevOS | GTMOS';
  }
  if (path === '/product/revos/leads') {
    return 'Open RevOS | Lead Qualification';
  }
  if (path === '/product/revos/settings') {
    return 'Open RevOS | Settings';
  }
  if (path.startsWith('/product/revos/')) {
    return 'Open RevOS | RevOS App';
  }

  // 3. About & Founder
  if (path === '/about/aboutRevos') {
    return 'About | About RevOS';
  }
  if (path === '/about/aboutFounder') {
    return 'About the Founder | About Founder';
  }
  if (path === '/about/founderProfile') {
    return 'About the Founder | Founder Profile';
  }
  if (path === '/about/founderImpact') {
    return 'About the Founder | Business Impact';
  }
  if (path === '/about/founderInsights') {
    return 'About the Founder | Insights';
  }
  if (path === '/about/founderResearch') {
    return 'About the Founder | Research';
  }
  if (path === '/about/contact') {
    return 'About | Contact';
  }

  // 4. Resources & Insights
  if (path === '/resources/insights') {
    return 'Resources | Revenue Insights';
  }
  if (path.startsWith('/resources/insights/')) {
    return 'Revenue Insights | Article';
  }

  // 5. Dynamic Content Fallbacks (updated with dynamic title once fetched)
  if (path.startsWith('/research/')) {
    return 'Research | Report';
  }
  if (path.startsWith('/post/') || path.startsWith('/blog/')) {
    return 'Insights | Article';
  }

  // 6. Legal & Policy Pages
  if (path === '/privacy-policy') {
    return 'Legal | Privacy Policy';
  }
  if (path === '/terms-of-service') {
    return 'Legal | Terms of Service';
  }
  if (path === '/cookie-policy') {
    return 'Legal | Cookie Policy';
  }
  if (path === '/ai-disclaimer') {
    return 'Legal | AI Disclaimer';
  }

  // 7. Authentication & Administration
  if (path === '/auth') {
    return 'Account | Sign In';
  }
  if (path === '/admin') {
    return 'Admin | Dashboard';
  }

  // 8. General fallback for unlisted nested routes
  const segments = path.split('/').filter(Boolean);
  if (segments.length >= 2) {
    const format = (s: string) =>
      s
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
    return `${format(segments[segments.length - 2])} | ${format(segments[segments.length - 1])}`;
  } else if (segments.length === 1) {
    const format = (s: string) =>
      s
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
    return `RevOS | ${format(segments[0])}`;
  }

  return DEFAULT_SITE_TITLE;
}

export function DynamicTitle() {
  const location = useLocation();

  useEffect(() => {
    document.title = getPageTitle(location.pathname);
  }, [location.pathname]);

  return null;
}
