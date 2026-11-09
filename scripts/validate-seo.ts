/**
 * RevOS SEO & Static Site Validation Script
 * Verifies that pre-rendered HTML contains:
 * 1. Semantic H1 tag
 * 2. Title and Meta Description
 * 3. Canonical link tag
 * 4. Open Graph and Twitter card tags
 * 5. Valid Schema.org JSON-LD
 * 6. Valid XML sitemap and robots.txt
 */

import fs from 'fs';
import path from 'path';

async function validate() {
  console.log('====================================================');
  console.log('🔍 Running RevOS SEO & SSG Output Validation');
  console.log('====================================================');

  const distPath = path.resolve(process.cwd(), 'dist');
  let errorsCount = 0;
  let warningsCount = 0;

  // 1. Check sitemap.xml
  const sitemapPath = path.join(distPath, 'sitemap.xml');
  if (!fs.existsSync(sitemapPath)) {
    console.error('❌ Missing dist/sitemap.xml');
    errorsCount++;
  } else {
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf-8');
    if (!sitemapContent.includes('<urlset') || !sitemapContent.includes('<loc>')) {
      console.error('❌ dist/sitemap.xml is malformed');
      errorsCount++;
    } else {
      const urlCount = (sitemapContent.match(/<loc>/g) || []).length;
      console.log(`✅ sitemap.xml verified (${urlCount} URLs indexed)`);
    }
  }

  // 2. Check robots.txt
  const robotsPath = path.join(distPath, 'robots.txt');
  if (!fs.existsSync(robotsPath)) {
    console.error('❌ Missing dist/robots.txt');
    errorsCount++;
  } else {
    const robotsContent = fs.readFileSync(robotsPath, 'utf-8');
    if (!robotsContent.includes('Sitemap:')) {
      console.warn('⚠️ dist/robots.txt missing Sitemap directive');
      warningsCount++;
    } else {
      console.log('✅ robots.txt verified with Sitemap directive');
    }
  }

  // 3. Check Homepage (/dist/index.html)
  const homeIndexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(homeIndexPath)) {
    const homeHtml = fs.readFileSync(homeIndexPath, 'utf-8');
    const hasH1 = homeHtml.includes('<h1') && homeHtml.includes('RevOS Turns Revenue Challenges Into Clearer Paths to Growth');
    const hasTitle = homeHtml.includes('<title>RevOS | AI-Native Revenue Operating System</title>');
    const hasDesc = homeHtml.includes('name="description"') && homeHtml.includes('AI-native Revenue Operating System');
    const hasCanonical = homeHtml.includes('rel="canonical"') && homeHtml.includes('https://www.apprevos.ai/');
    const hasOg = homeHtml.includes('property="og:title"') && homeHtml.includes('property="og:image"');
    const hasTwitter = homeHtml.includes('name="twitter:card"');
    const hasJsonLd = homeHtml.includes('application/ld+json') && homeHtml.includes('FAQPage') && homeHtml.includes('SoftwareApplication');
    const hasPreRenderedBody = homeHtml.includes('revos-homepage-pre-rendered') || homeHtml.includes('<main');

    if (hasH1 && hasTitle && hasDesc && hasCanonical && hasOg && hasTwitter && hasJsonLd) {
      console.log('✅ Homepage (/index.html) passed all SEO criteria (Pre-rendered H1, Title, Description, Canonical, OG, Twitter, Schema.org @graph with FAQPage & SoftwareApplication)');
    } else {
      console.error(`❌ Homepage (/index.html) verification failed: H1=${hasH1}, Title=${hasTitle}, Desc=${hasDesc}, Canonical=${hasCanonical}, OG=${hasOg}, Twitter=${hasTwitter}, JSON-LD=${hasJsonLd}`);
      errorsCount++;
    }
  } else {
    console.error('❌ dist/index.html is missing');
    errorsCount++;
  }

  // 4. Check /insights/index.html
  const insightsIndexPath = path.join(distPath, 'insights', 'index.html');
  if (fs.existsSync(insightsIndexPath)) {
    const content = fs.readFileSync(insightsIndexPath, 'utf-8');
    if (!content.includes('<h1') || !content.includes('Revenue Insights')) {
      console.warn('⚠️ /insights/index.html missing H1 headline');
      warningsCount++;
    } else {
      console.log('✅ /insights/index.html verified with pre-rendered H1');
    }
  } else {
    console.warn('⚠️ /insights/index.html not generated yet');
  }

  // 4. Sample check an article under /post/
  const postDir = path.join(distPath, 'post');
  if (fs.existsSync(postDir)) {
    const slugs = fs.readdirSync(postDir);
    if (slugs.length > 0) {
      const sampleSlug = slugs[0];
      const sampleFile = path.join(postDir, sampleSlug, 'index.html');
      if (fs.existsSync(sampleFile)) {
        const articleHtml = fs.readFileSync(sampleFile, 'utf-8');
        const hasH1 = articleHtml.includes('<h1');
        const hasCanonical = articleHtml.includes('rel="canonical"');
        const hasJsonLd = articleHtml.includes('application/ld+json');
        const hasArticle = articleHtml.includes('<article');

        if (hasH1 && hasCanonical && hasJsonLd && hasArticle) {
          console.log(`✅ Sample article (/post/${sampleSlug}/) passed all SEO & SSG criteria (H1, Canonical, JSON-LD, Article body in initial HTML)`);
        } else {
          console.error(`❌ Sample article (/post/${sampleSlug}/) failed verification: H1=${hasH1}, Canonical=${hasCanonical}, JSON-LD=${hasJsonLd}`);
          errorsCount++;
        }
      }
    }
  }

  console.log('====================================================');
  if (errorsCount === 0) {
    console.log(`🎉 Validation Passed with 0 Errors (${warningsCount} warnings)`);
  } else {
    console.error(`❌ Validation Failed with ${errorsCount} Errors`);
    process.exit(1);
  }
}

validate().catch(err => {
  console.error('Validation failure:', err);
  process.exit(1);
});
