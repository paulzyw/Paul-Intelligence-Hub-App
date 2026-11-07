import { useState, useEffect } from 'react';
import { supabase, type Post, type Category } from '../lib/supabase';
import { safeSupabaseQuery } from '../lib/fetchData';
import { fetchActiveChallengesWithArticles, type ChallengeWithArticles } from '../lib/businessChallenges';
import { InsightsHero } from '../components/insights/InsightsHero';
import { FeaturedInsight } from '../components/insights/FeaturedInsight';
import { KnowledgeCategoryNavigation } from '../components/insights/KnowledgeCategoryNavigation';
import { BusinessChallengeDiscovery } from '../components/insights/BusinessChallengeDiscovery';
import { LatestInsights } from '../components/insights/LatestInsights';
import { AllInsightsTable } from '../components/insights/AllInsightsTable';
import { RecommendedInsights } from '../components/insights/RecommendedInsights';
import { InsightsCTA } from '../components/insights/InsightsCTA';
import { Award } from 'lucide-react';
import { cn } from '../lib/utils';

export function Insights() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [challengeGroups, setChallengeGroups] = useState<ChallengeWithArticles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State for Latest Insights
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Newsletter Subscription State
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [subscribeMessage, setSubscribeMessage] = useState('');

  // 1. Dynamic Head Metadata for SEO
  useEffect(() => {
    // Meta description update
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', 'Explore evidence-driven insights on revenue operations, sales performance, lead qualification, pipeline management, forecasting, and business growth.');

    // Schema.org CollectionPage structured data
    const schemaScriptId = 'insights-collection-schema';
    let scriptTag = document.getElementById(schemaScriptId) as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = schemaScriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'RevOS Revenue Insights',
      headline: 'Make Better Revenue Decisions.',
      description: 'Explore evidence-driven insights on revenue operations, sales performance, lead qualification, pipeline management, forecasting, and business growth.',
      url: window.location.href,
      publisher: {
        '@type': 'Organization',
        name: 'RevOS',
        url: window.location.origin
      }
    });

    return () => {
      const el = document.getElementById(schemaScriptId);
      if (el) el.remove();
    };
  }, []);

  // 2. Fetch Data (Posts, Categories, and Dynamic Business Challenges)
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [postsResponse, categoriesResponse, challengesResponse] = await Promise.all([
          safeSupabaseQuery<Post[]>(() =>
            supabase
              .from('posts')
              .select('*')
              .eq('content_type', 'insight')
              .order('created_at', { ascending: false })
          ),
          safeSupabaseQuery<Category[]>(() =>
            supabase
              .from('categories')
              .select('*')
              .order('name')
          ),
          fetchActiveChallengesWithArticles()
        ]);

        if (postsResponse.error) {
          console.error('Error fetching insight posts:', postsResponse.error);
          setError(postsResponse.error.message || 'Failed to fetch insights');
        } else {
          // Filter strictly for published items and ensure strictly sorted by latest date descending
          const allInsights = (postsResponse.data || [])
            .filter(p => !p.status || p.status === 'published')
            .sort((a, b) => {
              const timeA = new Date(a.published_at || a.created_at).getTime();
              const timeB = new Date(b.published_at || b.created_at).getTime();
              return timeB - timeA;
            });
          setPosts(allInsights);
        }

        if (categoriesResponse.error) {
          console.error('Error fetching categories:', categoriesResponse.error);
        } else {
          setCategories(categoriesResponse.data || []);
        }

        if (challengesResponse.error) {
          console.error('Error fetching challenge groups:', challengesResponse.error);
        } else {
          setChallengeGroups(challengesResponse.data || []);
        }
      } catch (err: any) {
        console.error('Unexpected error loading Insights page:', err);
        setError('An unexpected error occurred while loading content.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Category counts computation
  const categoryCounts: Record<string, number> = {};
  posts.forEach(p => {
    const cat = p.category || 'General';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  // Filter posts for Latest Insights section
  const filteredPosts = posts.filter(post => {
    const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
    const matchesSearch =
      (post.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.summary || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Section 2: Identify Featured Insight
  const featuredPost = posts.find(p => p.is_featured || p.featured) || (posts.length > 0 ? posts[0] : null);

  // Section 6: Identify Recommended / Popular Insights (excluding featured if multiple exist)
  const recommendedPosts = posts.filter(p => !featuredPost || p.id !== featuredPost.id).slice(0, 3);

  // Smooth scroll helpers
  const handleScrollToChallenges = () => {
    const el = document.getElementById('business-challenges');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScrollToCategories = () => {
    const el = document.getElementById('knowledge-categories');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectCategory = (categoryName: string) => {
    setActiveCategory(categoryName);
    const el = document.getElementById('all-insights-table') || document.getElementById('latest-insights');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFilterByChallenge = (_challengeName: string) => {
    const el = document.getElementById('all-insights-table') || document.getElementById('latest-insights');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Newsletter Subscription
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscribeEmail) return;

    setSubscribeStatus('loading');
    setSubscribeMessage('');

    try {
      const { error: dbError } = await supabase
        .from('subscribers')
        .insert([{ email: subscribeEmail }]);

      if (dbError && dbError.code !== '23505') {
        throw new Error(`Database Error: ${dbError.message}`);
      }

      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (baseUrl && !baseUrl.includes('placeholder')) {
        const functionUrl = `${baseUrl.replace(/\/$/, '')}/functions/v1/subscribe-mailerlite`;
        await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({ email: subscribeEmail })
        });
      }

      setSubscribeStatus('success');
      setSubscribeMessage('Thank you for subscribing to Revenue Insights!');
      setSubscribeEmail('');
    } catch (err: any) {
      console.error('Subscription error:', err);
      setSubscribeStatus('error');
      setSubscribeMessage(err.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* SECTION 1 — EDITORIAL HERO */}
      <InsightsHero
        onScrollToChallenges={handleScrollToChallenges}
        onScrollToCategories={handleScrollToCategories}
      />

      {/* Loading & Error States */}
      {loading ? (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="space-y-8 animate-pulse">
            <div className="h-96 rounded-2xl bg-bg-surface border border-border" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-64 rounded-xl bg-bg-surface border border-border" />
              ))}
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="rounded-xl border border-border bg-bg-surface p-8">
            <p className="text-red-500 mb-4 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-accent text-white rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              Retry Loading Content
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* SECTION 2 — FEATURED INSIGHT */}
          <FeaturedInsight post={featuredPost} />

          {/* SECTION 3 — EXPLORE BY KNOWLEDGE CATEGORY */}
          <KnowledgeCategoryNavigation
            categories={categories}
            activeCategory={activeCategory}
            onSelectCategory={handleSelectCategory}
            categoryCounts={categoryCounts}
            totalCount={posts.length}
          />

          {/* SECTION 4 — EXPLORE BY BUSINESS CHALLENGE (Core new feature) */}
          <BusinessChallengeDiscovery
            challengeGroups={challengeGroups}
            onFilterByChallenge={handleFilterByChallenge}
          />

          {/* SECTION 5 — LATEST INSIGHTS (Always displays the latest three article cards) */}
          <LatestInsights posts={posts} />

          {/* SECTION 5.5 — ALL INSIGHT ARTICLES (Full list in table format with SN, Knowledge category, published date, title, keyword search on top-right, and 10 items/page pagination) */}
          <AllInsightsTable
            posts={posts}
            activeCategory={activeCategory}
            onClearCategory={() => setActiveCategory('All')}
          />

          {/* SECTION 6 — RECOMMENDED / POPULAR INSIGHTS */}
          <RecommendedInsights recommendedPosts={recommendedPosts} />

          {/* NEWSLETTER SUBSCRIPTION (Executive Briefings) */}
          {/*<section className="py-16 border-b border-border/60">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
              <div className="rounded-2xl border border-border bg-bg-surface p-8 sm:p-12 text-center shadow-sm">
                <div className="inline-flex p-3 rounded-full bg-accent/10 text-accent mb-4">
                  <Award size={22} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
                  Subscribe to Revenue Insights
                </h2>
                <p className="text-xs sm:text-sm text-text-secondary max-w-md mx-auto mb-6 font-light">
                  Receive monthly executive analyses on enterprise sales methodologies, GTM operations, and AI-powered pipeline predictability.
                </p>

                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your executive email..."
                    value={subscribeEmail}
                    onChange={(e) => setSubscribeEmail(e.target.value)}
                    required
                    className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-bg-primary text-text-primary placeholder-text-secondary/50 text-xs sm:text-sm focus:outline-none focus:border-accent"
                  />
                  <button
                    type="submit"
                    disabled={subscribeStatus === 'loading'}
                    className="px-5 py-2.5 bg-accent text-white font-medium rounded-lg hover:opacity-90 transition-opacity text-xs sm:text-sm disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    {subscribeStatus === 'loading' ? 'Subscribing...' : 'Subscribe'}
                  </button>
                </form>

                {subscribeMessage && (
                  <p className={cn(
                    "text-xs mt-3",
                    subscribeStatus === 'success' ? "text-green-500" : "text-red-500"
                  )}>
                    {subscribeMessage}
                  </p>
                )}
              </div>
            </div>
          </section>*/}

          {/* SECTION 7 — REVOS CALL TO ACTION */}
          <InsightsCTA />
        </>
      )}
    </div>
  );
}
