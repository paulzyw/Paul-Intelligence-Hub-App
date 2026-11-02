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
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

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
    console.error('[SSG] Critical Error fetching posts from Supabase:', error);
    process.exit(1);
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
  // 3. Generate Revenue Insights Listing (/insights/index.html)
  // ----------------------------------------------------
  console.log('[SSG] Generating Revenue Insights Listing: /insights/index.html');
  const insightsListingMeta = buildMetaTags({
    title: 'Strategic Perspectives for Growth | Revenue Insights | RevOS',
    description: 'Data-driven methodologies, pipeline governance frameworks, and executive playbooks designed to turn complex commercial challenges into systematic revenue growth.',
    canonicalUrl: `${CANONICAL_DOMAIN}/insights/`,
    type: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      headline: 'RevOS Revenue Insights',
      description: 'Strategic Perspectives for B2B Revenue Optimization and Sales Acceleration',
      url: `${CANONICAL_DOMAIN}/insights/`,
      publisher: {
        '@type': 'Organization',
        name: 'RevOS',
        url: CANONICAL_DOMAIN,
      },
    },
  });

  const insightsListingHtmlBody = `
    <header class="py-12 bg-bg-primary text-center px-4">
      <h1 class="text-4xl md:text-5xl font-bold text-text-primary mb-4">Strategic Perspectives for Growth</h1>
      <p class="text-xl text-text-secondary max-w-3xl mx-auto">
        Data-driven methodologies, pipeline governance frameworks, and executive playbooks designed to turn complex commercial challenges into systematic revenue growth.
      </p>
    </header>
    <main class="max-w-7xl mx-auto px-4 py-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        ${insightPosts.map(post => `
          <article class="border border-border rounded-xl p-6 bg-bg-surface">
            <span class="text-xs text-accent font-semibold uppercase tracking-wider">${escapeHtml(post.category)}</span>
            <h2 class="text-xl font-bold text-text-primary mt-2 mb-3">
              <a href="/insights/${escapeHtml(post.slug)}/">${escapeHtml(post.title)}</a>
            </h2>
            <p class="text-sm text-text-secondary mb-4">${escapeHtml(post.summary)}</p>
            <div class="text-xs text-text-secondary flex items-center justify-between">
              <time datetime="${post.created_at}">${new Date(post.created_at).toLocaleDateString()}</time>
              <span>${post.read_time} min read</span>
            </div>
          </article>
        `).join('')}
      </div>
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
