/**
 * RevOS Unified Content SSG Engine V1.0
 * Generates static HTML, SEO metadata, Schema.org JSON-LD, sitemap.xml, and robots.txt
 * for both Founder Blog Posts and Revenue Insights.
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const CANONICAL_DOMAIN = 'https://www.apprevos.ai';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://yfonihlpdvelssfmzokp.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

interface PostRecord {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  read_time: number;
  thumbnail_url: string;
  is_featured: boolean;
  content_type?: 'post' | 'insight';
  status?: string;
  published_at?: string;
  created_at: string;
  updated_at?: string;
  seo_title?: string;
  seo_description?: string;
  canonical_url?: string;
  target_keyword?: string;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

function cleanContentDirectories(distPath: string) {
  const dirsToClean = [
    path.join(distPath, 'insights'),
    path.join(distPath, 'blog'),
    path.join(distPath, 'post'),
  ];

  for (const dir of dirsToClean) {
    if (fs.existsSync(dir)) {
      console.log(`[SSG] Cleaning previous build directory: ${dir}`);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
}

function buildMetaTags({
  title,
  description,
  canonicalUrl,
  imageUrl,
  type = 'article',
  publishedTime,
  modifiedTime,
  jsonLd,
}: {
  title: string;
  description: string;
  canonicalUrl: string;
  imageUrl?: string;
  type?: string;
  publishedTime?: string;
  modifiedTime?: string;
  jsonLd?: object;
}): string {
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const safeUrl = escapeHtml(canonicalUrl);
  const safeImg = imageUrl ? escapeHtml(imageUrl) : 'https://yfonihlpdvelssfmzokp.supabase.co/storage/v1/object/public/my-logo/Prevos_site_icon_amber.png';

  let tags = `
    <!-- Primary Meta Tags -->
    <title>${safeTitle}</title>
    <meta name="title" content="${safeTitle}" />
    <meta name="description" content="${safeDesc}" />
    <link rel="canonical" href="${safeUrl}" />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="${type}" />
    <meta property="og:url" content="${safeUrl}" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDesc}" />
    <meta property="og:image" content="${safeImg}" />
    <meta property="og:site_name" content="RevOS - Revenue Growth Accelerator" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${safeUrl}" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDesc}" />
    <meta name="twitter:image" content="${safeImg}" />
  `;

  if (publishedTime) {
    tags += `\n    <meta property="article:published_time" content="${escapeHtml(publishedTime)}" />`;
  }
  if (modifiedTime) {
    tags += `\n    <meta property="article:modified_time" content="${escapeHtml(modifiedTime)}" />`;
  }

  if (jsonLd) {
    tags += `\n    <script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n    </script>`;
  }

  return tags;
}

function injectIntoHtml(templateHtml: string, metaTags: string, bodyContent: string): string {
  // Replace <title>...</title> if exists
  let result = templateHtml.replace(/<title>[\s\S]*?<\/title>/i, '');
  
  // Inject into <head>
  result = result.replace('</head>', `${metaTags}\n  </head>`);

  // Inject initial pre-rendered HTML into <div id="root"></div> for zero-JS crawlers
  result = result.replace('<div id="root"></div>', `<div id="root">${bodyContent}</div>`);

  return result;
}

async function main() {
  console.log('====================================================');
  console.log('🚀 Starting RevOS Unified Content SSG Engine V1.0');
  console.log('====================================================');

  const distPath = path.resolve(process.cwd(), 'dist');
  const indexHtmlPath = path.join(distPath, 'index.html');
  const fallbackIndexHtmlPath = path.resolve(process.cwd(), 'index.html');

  let templateHtml = '';
  if (fs.existsSync(indexHtmlPath)) {
    templateHtml = fs.readFileSync(indexHtmlPath, 'utf-8');
  } else if (fs.existsSync(fallbackIndexHtmlPath)) {
    templateHtml = fs.readFileSync(fallbackIndexHtmlPath, 'utf-8');
  } else {
    throw new Error('Could not find index.html template for SSG generation');
  }

  if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath, { recursive: true });
  }

  // 1. Clean previous content output
  cleanContentDirectories(distPath);

  // 2. Fetch all published content from Supabase
  console.log('[SSG] Connecting to Supabase at:', SUPABASE_URL);
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[SSG] Notice: Supabase posts fetch returned an error (likely placeholder credentials in local dev):', error.message);
    if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes('placeholder')) {
      console.warn('[SSG] Proceeding with static shell generation and base sitemap.');
    } else {
      process.exit(1);
    }
  }

  const allPosts: PostRecord[] = posts || [];
  console.log(`[SSG] Retrieved ${allPosts.length} total content items from database.`);

  // Separate blog posts and insights
  const blogPosts = allPosts.filter(p => (p.content_type || 'post') === 'post');
  const insightPosts = allPosts.filter(p => p.content_type === 'insight');

  console.log(`[SSG] Classified: ${blogPosts.length} Founder Blog Posts, ${insightPosts.length} Revenue Insights.`);

  const sitemapUrls: Array<{ loc: string; lastmod: string; changefreq: string; priority: string }> = [
    { loc: `${CANONICAL_DOMAIN}/`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: '1.0' },
    { loc: `${CANONICAL_DOMAIN}/about/aboutFounder`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.8' },
    { loc: `${CANONICAL_DOMAIN}/about/founderProfile`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.8' },
    { loc: `${CANONICAL_DOMAIN}/about/founderImpact`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.8' },
    { loc: `${CANONICAL_DOMAIN}/about/founderInsights`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.9' },
    { loc: `${CANONICAL_DOMAIN}/insights`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.9' },
    { loc: `${CANONICAL_DOMAIN}/product/overview/revos`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.9' },
    { loc: `${CANONICAL_DOMAIN}/privacy-policy`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'yearly', priority: '0.3' },
    { loc: `${CANONICAL_DOMAIN}/terms-of-service`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'yearly', priority: '0.3' },
    { loc: `${CANONICAL_DOMAIN}/cookie-policy`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'yearly', priority: '0.3' },
    { loc: `${CANONICAL_DOMAIN}/ai-disclaimer`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'yearly', priority: '0.3' },
  ];

  // ----------------------------------------------------
  // ----------------------------------------------------
  // 3. Generate Revenue Insights Listing (/insights/index.html)
  // ----------------------------------------------------
  console.log('[SSG] Generating Revenue Insights Listing: /insights/index.html');

  // Query active business challenges and junction mappings for pre-rendering
  let ssgChallengeGroups: Array<{
    challenge: { id: string; name: string; slug: string; description: string | null; display_order: number };
    articles: PostRecord[];
  }> = [];

  try {
    const { data: challenges } = await supabase
      .from('business_challenges')
      .select('*')
      .eq('status', 'active')
      .order('display_order', { ascending: true });

    if (challenges && challenges.length > 0) {
      const { data: junctions } = await supabase
        .from('content_business_challenges')
        .select('content_id, challenge_id, is_primary');

      const junctionMap = new Map<string, Array<{ content_id: string; is_primary: boolean }>>();
      (junctions || []).forEach(j => {
        if (!junctionMap.has(j.challenge_id)) {
          junctionMap.set(j.challenge_id, []);
        }
        junctionMap.get(j.challenge_id)!.push({ content_id: j.content_id, is_primary: Boolean(j.is_primary) });
      });

      const insightMap = new Map<string, PostRecord>();
      insightPosts.forEach(p => insightMap.set(p.id, p));

      challenges.forEach(ch => {
        const linked = junctionMap.get(ch.id) || [];
        const articles: PostRecord[] = [];
        linked.forEach(item => {
          const art = insightMap.get(item.content_id);
          if (art && (!art.status || art.status === 'published')) {
            articles.push(art);
          }
        });

        // Dynamic visibility rule: Only include active challenges with at least 1 published article
        if (articles.length > 0) {
          ssgChallengeGroups.push({
            challenge: ch,
            articles
          });
        }
      });
    }
  } catch (err) {
    console.warn('[SSG] Notice: Business challenges query for pre-rendering completed with fallback:', err);
  }

  const ssgFeaturedPost = insightPosts.find(p => p.is_featured) || insightPosts[0] || null;
  const ssgRecommendedPosts = insightPosts.filter(p => !ssgFeaturedPost || p.id !== ssgFeaturedPost.id).slice(0, 3);

  const insightsListingMeta = buildMetaTags({
    title: 'Revenue Operations Insights & Business Growth Strategies | RevOS',
    description: 'Explore evidence-driven insights on revenue operations, sales performance, lead qualification, pipeline management, forecasting, and business growth.',
    canonicalUrl: `${CANONICAL_DOMAIN}/insights/`,
    type: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'RevOS Revenue Insights',
      headline: 'Make Better Revenue Decisions.',
      description: 'Explore evidence-driven insights on revenue operations, sales performance, lead qualification, pipeline management, forecasting, and business growth.',
      url: `${CANONICAL_DOMAIN}/insights/`,
      publisher: {
        '@type': 'Organization',
        name: 'RevOS',
        url: CANONICAL_DOMAIN,
      },
    },
  });

  const knowledgeCategories = [
    'Go-to-Market Strategy',
    'Revenue Operations',
    'Sales Performance',
    'Lead Qualification',
    'Pipeline Management',
    'Sales Forecasting',
    'Customer Growth',
    'AI & Revenue Intelligence'
  ];

  const insightsListingHtmlBody = `
    <!-- SECTION 1: EDITORIAL HERO -->
    <header class="py-16 bg-bg-primary border-b border-border text-center px-4">
      <div class="max-w-4xl mx-auto">
        <div class="text-xs font-semibold tracking-widest uppercase text-accent mb-3">
          RevOS Revenue Insights
        </div>
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-text-primary tracking-tight mb-6">
          Make Better Revenue Decisions.
        </h1>
        <p class="text-lg sm:text-xl text-text-secondary max-w-3xl mx-auto font-light leading-relaxed mb-8">
          Explore practical insights, analytical perspectives, and evidence-driven approaches to the challenges shaping modern revenue performance, sales execution, and business growth.
        </p>
        <div class="flex flex-wrap items-center justify-center gap-4 text-xs font-medium">
          <a href="#business-challenges" class="px-5 py-2.5 rounded-lg bg-accent text-white hover:opacity-90">Explore by Business Challenge</a>
          <a href="#knowledge-categories" class="px-5 py-2.5 rounded-lg border border-border bg-bg-surface text-text-primary">Browse Knowledge Areas</a>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-12 space-y-16">
      
      <!-- SECTION 2: FEATURED INSIGHT -->
      ${ssgFeaturedPost ? `
        <section class="border border-border rounded-2xl p-8 bg-bg-surface">
          <div class="text-xs uppercase font-semibold text-accent mb-2">Featured Perspective</div>
          <h2 class="text-2xl sm:text-3xl font-bold text-text-primary mb-3">
            <a href="/insights/${escapeHtml(ssgFeaturedPost.slug)}/">${escapeHtml(ssgFeaturedPost.title)}</a>
          </h2>
          <p class="text-text-secondary text-sm sm:text-base mb-4 leading-relaxed">${escapeHtml(ssgFeaturedPost.summary)}</p>
          <div class="text-xs text-text-secondary flex items-center gap-3">
            <span>${escapeHtml(ssgFeaturedPost.category)}</span>
            <span>·</span>
            <time datetime="${ssgFeaturedPost.created_at}">${new Date(ssgFeaturedPost.created_at).toLocaleDateString()}</time>
            <span>·</span>
            <span>${ssgFeaturedPost.read_time} min read</span>
          </div>
        </section>
      ` : ''}

      <!-- SECTION 3: KNOWLEDGE CATEGORIES -->
      <section id="knowledge-categories" class="space-y-4">
        <h2 class="text-2xl font-bold text-text-primary">Explore by Knowledge Category</h2>
        <div class="flex flex-wrap gap-2 text-xs">
          ${knowledgeCategories.map(cat => `
            <a href="/insights/#latest-insights" class="px-3.5 py-2 rounded-lg border border-border bg-bg-surface text-text-secondary hover:text-text-primary">
              ${escapeHtml(cat)}
            </a>
          `).join('')}
        </div>
      </section>

      <!-- SECTION 4: EXPLORE BY BUSINESS CHALLENGE -->
      <section id="business-challenges" class="space-y-10">
        <div>
          <div class="text-xs font-semibold uppercase text-accent mb-1">Problem-Centric Discovery</div>
          <h2 class="text-3xl font-extrabold text-text-primary">Explore by Business Challenge</h2>
          <p class="text-sm text-text-secondary mt-1">Every revenue organization faces different challenges. Explore practical insights and evidence-driven perspectives based on the problems you are working to solve.</p>
        </div>

        ${ssgChallengeGroups.length > 0 ? ssgChallengeGroups.map(group => `
          <div class="border-t border-border pt-8 space-y-6">
            <div>
              <h3 class="text-xl font-bold text-text-primary">${escapeHtml(group.challenge.name)}</h3>
              ${group.challenge.description ? `<p class="text-xs text-text-secondary mt-1 font-light">${escapeHtml(group.challenge.description)}</p>` : ''}
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              ${group.articles.map(art => `
                <article class="border border-border rounded-xl p-6 bg-bg-surface flex flex-col justify-between">
                  <div>
                    <span class="text-xs text-accent font-semibold">${escapeHtml(art.category)}</span>
                    <h4 class="text-lg font-bold text-text-primary mt-1 mb-2">
                      <a href="/insights/${escapeHtml(art.slug)}/">${escapeHtml(art.title)}</a>
                    </h4>
                    <p class="text-xs text-text-secondary line-clamp-3 mb-4 font-light">${escapeHtml(art.summary)}</p>
                  </div>
                  <div class="text-xs text-text-secondary flex items-center justify-between border-t border-border pt-3 mt-auto">
                    <span>${art.read_time} min read</span>
                    <a href="/insights/${escapeHtml(art.slug)}/" class="text-accent font-semibold">Read Insight →</a>
                  </div>
                </article>
              `).join('')}
            </div>
          </div>
        `).join('') : `
          <div class="text-xs text-text-secondary">Explore all revenue insights across strategic operations below.</div>
        `}
      </section>

      <!-- SECTION 5: LATEST INSIGHTS -->
      <section id="latest-insights" class="space-y-6">
        <div>
          <h2 class="text-2xl font-bold text-text-primary">Latest Insights</h2>
          <p class="text-xs text-text-secondary">Chronological research publications and executive analyses.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${insightPosts.map(post => `
            <article class="border border-border rounded-xl p-6 bg-bg-surface flex flex-col justify-between">
              <div>
                <span class="text-xs text-accent font-semibold">${escapeHtml(post.category)}</span>
                <h3 class="text-lg font-bold text-text-primary mt-1 mb-2">
                  <a href="/insights/${escapeHtml(post.slug)}/">${escapeHtml(post.title)}</a>
                </h3>
                <p class="text-xs text-text-secondary mb-4 font-light line-clamp-3">${escapeHtml(post.summary)}</p>
              </div>
              <div class="text-xs text-text-secondary flex items-center justify-between border-t border-border pt-3 mt-auto">
                <time datetime="${post.created_at}">${new Date(post.created_at).toLocaleDateString()}</time>
                <span>${post.read_time} min read</span>
              </div>
            </article>
          `).join('')}
        </div>
      </section>

      <!-- SECTION 6: RECOMMENDED INSIGHTS -->
      ${ssgRecommendedPosts.length > 0 ? `
        <section class="space-y-6">
          <h2 class="text-2xl font-bold text-text-primary">Recommended & Strategic Readings</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            ${ssgRecommendedPosts.map(post => `
              <div class="border border-border rounded-xl p-6 bg-bg-surface">
                <span class="text-xs text-accent font-semibold">${escapeHtml(post.category)}</span>
                <h3 class="text-base font-bold text-text-primary mt-1 mb-2">
                  <a href="/insights/${escapeHtml(post.slug)}/">${escapeHtml(post.title)}</a>
                </h3>
                <p class="text-xs text-text-secondary font-light">${escapeHtml(post.summary)}</p>
              </div>
            `).join('')}
          </div>
        </section>
      ` : ''}

      <!-- SECTION 7: CALL TO ACTION -->
      <section class="border border-border rounded-2xl p-10 bg-bg-surface text-center space-y-4">
        <h2 class="text-3xl font-extrabold text-text-primary">From Revenue Insights to Revenue Impact.</h2>
        <p class="text-sm text-text-secondary max-w-2xl mx-auto font-light">
          Understanding revenue challenges is the first step. RevOS helps revenue teams turn evidence into clearer assessments, better strategies, and more actionable decisions.
        </p>
        <div>
          <a href="/product/overview/revos" class="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-white text-sm font-semibold hover:opacity-90">
            Explore RevOS →
          </a>
        </div>
      </section>

    </main>
  `;

  const insightsListingFullHtml = injectIntoHtml(templateHtml, insightsListingMeta, insightsListingHtmlBody);
  const insightsListingFile = path.join(distPath, 'insights', 'index.html');
  ensureDirectoryExistence(insightsListingFile);
  fs.writeFileSync(insightsListingFile, insightsListingFullHtml);


  // ----------------------------------------------------
  // 4. Generate Revenue Insight Detail Pages (/insights/<slug>/index.html)
  // ----------------------------------------------------
  for (const post of insightPosts) {
    const postSlug = post.slug;
    const postUrl = `${CANONICAL_DOMAIN}/insights/${postSlug}/`;
    const postTitle = post.seo_title || `${post.title} | RevOS`;
    const postDesc = post.seo_description || post.summary;
    const postDate = post.published_at || post.created_at;
    const postModified = post.updated_at || post.created_at;

    console.log(`[SSG] Generating Insight: /insights/${postSlug}/index.html`);

    const metaTags = buildMetaTags({
      title: postTitle,
      description: postDesc,
      canonicalUrl: post.canonical_url || postUrl,
      imageUrl: post.thumbnail_url,
      type: 'article',
      publishedTime: postDate,
      modifiedTime: postModified,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: postDesc,
        image: post.thumbnail_url ? [post.thumbnail_url] : undefined,
        datePublished: postDate,
        dateModified: postModified,
        author: {
          '@type': 'Organization',
          name: 'Apprevos Technology',
          url: CANONICAL_DOMAIN,
        },
        publisher: {
          '@type': 'Organization',
          name: 'RevOS',
          url: CANONICAL_DOMAIN,
          logo: {
            '@type': 'ImageObject',
            url: 'https://yfonihlpdvelssfmzokp.supabase.co/storage/v1/object/public/my-logo/Prevos_site_icon_amber.png',
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': postUrl,
        },
      },
    });

    const bodyHtml = `
      <article class="max-w-[900px] mx-auto px-4 py-12">
        <nav class="text-xs text-text-secondary mb-6" aria-label="Breadcrumb">
          <a href="/">Home</a> &gt; <a href="/insights/">Revenue Insights</a> &gt; <span>${escapeHtml(post.title)}</span>
        </nav>
        <header class="mb-8">
          <div class="flex items-center gap-3 text-sm text-text-secondary mb-3">
            <span class="text-accent font-bold uppercase tracking-wider">${escapeHtml(post.category)}</span>
            <span>•</span>
            <time datetime="${postDate}">${new Date(postDate).toLocaleDateString()}</time>
            <span>•</span>
            <span>${post.read_time} Min Read</span>
          </div>
          <h1 class="text-4xl md:text-5xl font-bold text-text-primary leading-tight">${escapeHtml(post.title)}</h1>
        </header>

        ${post.thumbnail_url ? `
          <div class="w-full h-64 md:h-96 rounded-xl overflow-hidden mb-8 border border-border">
            <img src="${escapeHtml(post.thumbnail_url)}" alt="${escapeHtml(post.title)}" class="w-full h-full object-cover" />
          </div>
        ` : ''}

        ${post.summary ? `
          <div class="bg-bg-surface border border-accent/30 rounded-xl p-6 mb-8">
            <h2 class="text-lg font-bold text-text-primary mb-2">Executive Takeaways</h2>
            <p class="text-text-secondary text-base">${escapeHtml(post.summary)}</p>
          </div>
        ` : ''}

        <div class="prose max-w-none text-text-primary">
          ${post.content || ''}
        </div>
      </article>
    `;

    const fullHtml = injectIntoHtml(templateHtml, metaTags, bodyHtml);
    const targetFile = path.join(distPath, 'insights', postSlug, 'index.html');
    ensureDirectoryExistence(targetFile);
    fs.writeFileSync(targetFile, fullHtml);

    sitemapUrls.push({
      loc: postUrl,
      lastmod: (postModified || postDate).split('T')[0],
      changefreq: 'weekly',
      priority: '0.8',
    });
  }

  // ----------------------------------------------------
  // 5. Generate Founder Blog Posts (/post/<slug>/index.html & /blog/<slug>/index.html)
  // ----------------------------------------------------
  for (const post of blogPosts) {
    const postSlug = post.slug;
    const postUrl = `${CANONICAL_DOMAIN}/post/${postSlug}/`;
    const postTitle = post.seo_title || `${post.title} | RevOS`;
    const postDesc = post.seo_description || post.summary;
    const postDate = post.published_at || post.created_at;
    const postModified = post.updated_at || post.created_at;

    console.log(`[SSG] Generating Blog Post: /post/${postSlug}/index.html`);

    const metaTags = buildMetaTags({
      title: postTitle,
      description: postDesc,
      canonicalUrl: post.canonical_url || postUrl,
      imageUrl: post.thumbnail_url,
      type: 'article',
      publishedTime: postDate,
      modifiedTime: postModified,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: postDesc,
        image: post.thumbnail_url ? [post.thumbnail_url] : undefined,
        datePublished: postDate,
        dateModified: postModified,
        author: {
          '@type': 'Person',
          name: 'Founder, Apprevos Technology',
        },
        publisher: {
          '@type': 'Organization',
          name: 'RevOS',
          url: CANONICAL_DOMAIN,
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': postUrl,
        },
      },
    });

    const bodyHtml = `
      <article class="max-w-[900px] mx-auto px-4 py-12">
        <nav class="text-xs text-text-secondary mb-6" aria-label="Breadcrumb">
          <a href="/">Home</a> &gt; <a href="/about/founderInsights">Founder Insights</a> &gt; <span>${escapeHtml(post.title)}</span>
        </nav>
        <header class="mb-8">
          <div class="flex items-center gap-3 text-sm text-text-secondary mb-3">
            <span class="text-accent font-bold uppercase tracking-wider">${escapeHtml(post.category)}</span>
            <span>•</span>
            <time datetime="${postDate}">${new Date(postDate).toLocaleDateString()}</time>
            <span>•</span>
            <span>${post.read_time} Min Read</span>
          </div>
          <h1 class="text-4xl md:text-5xl font-bold text-text-primary leading-tight">${escapeHtml(post.title)}</h1>
        </header>

        ${post.thumbnail_url ? `
          <div class="w-full h-64 md:h-96 rounded-xl overflow-hidden mb-8 border border-border">
            <img src="${escapeHtml(post.thumbnail_url)}" alt="${escapeHtml(post.title)}" class="w-full h-full object-cover" />
          </div>
        ` : ''}

        ${post.summary ? `
          <div class="bg-bg-surface border border-accent/30 rounded-xl p-6 mb-8">
            <h2 class="text-lg font-bold text-text-primary mb-2">Key Takeaways</h2>
            <p class="text-text-secondary text-base">${escapeHtml(post.summary)}</p>
          </div>
        ` : ''}

        <div class="prose max-w-none text-text-primary">
          ${post.content || ''}
        </div>
      </article>
    `;

    const fullHtml = injectIntoHtml(templateHtml, metaTags, bodyHtml);
    
    // Write primary route /post/<slug>/index.html
    const primaryFile = path.join(distPath, 'post', postSlug, 'index.html');
    ensureDirectoryExistence(primaryFile);
    fs.writeFileSync(primaryFile, fullHtml);

    // Also write alias /blog/<slug>/index.html for universal SSG compliance
    const blogAliasFile = path.join(distPath, 'blog', postSlug, 'index.html');
    ensureDirectoryExistence(blogAliasFile);
    fs.writeFileSync(blogAliasFile, fullHtml);

    sitemapUrls.push({
      loc: postUrl,
      lastmod: (postModified || postDate).split('T')[0],
      changefreq: 'weekly',
      priority: '0.7',
    });
  }

  // ----------------------------------------------------
  // 6. Generate XML Sitemap (dist/sitemap.xml)
  // ----------------------------------------------------
  console.log(`[SSG] Generating sitemap.xml with ${sitemapUrls.length} verified URLs`);
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(u => `  <url>
    <loc>${escapeHtml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(distPath, 'sitemap.xml'), sitemapXml);

  // ----------------------------------------------------
  // 7. Generate robots.txt (dist/robots.txt)
  // ----------------------------------------------------
  console.log('[SSG] Generating robots.txt');
  const robotsTxt = `# RevOS Production Robots Directive
User-agent: *
Allow: /

# Admin and protected application routes
Disallow: /admin
Disallow: /admin/
Disallow: /product/revos/
Disallow: /api/

Sitemap: ${CANONICAL_DOMAIN}/sitemap.xml
`;

  fs.writeFileSync(path.join(distPath, 'robots.txt'), robotsTxt);

  // ----------------------------------------------------
  // 8. Mirror public directory into dist/public for /public/* asset path compatibility
  // ----------------------------------------------------
  const distPublicPath = path.join(distPath, 'public');
  const sourcePublicPath = path.join(process.cwd(), 'public');
  if (fs.existsSync(sourcePublicPath)) {
    fs.cpSync(sourcePublicPath, distPublicPath, { recursive: true });
    console.log('[SSG] Mirrored /public assets into dist/public for deployment path compatibility.');
  }

  console.log('====================================================');
  console.log('✅ SSG Generation Complete!');
  console.log(`   • Total Pages Pre-rendered: ${insightPosts.length + blogPosts.length * 2 + 1}`);
  console.log(`   • Sitemap URLs: ${sitemapUrls.length}`);
  console.log(`   • Output Directory: ${distPath}`);
  console.log('====================================================');
}

main().catch(err => {
  console.error('[SSG] Unhandled Generation Error:', err);
  process.exit(1);
});
