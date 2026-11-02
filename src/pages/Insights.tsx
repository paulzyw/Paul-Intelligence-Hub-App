import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Clock, Award, Lightbulb, Compass, TrendingUp, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { supabase, type Post, type Category } from '../lib/supabase';
import { safeSupabaseQuery } from '../lib/fetchData';

export function Insights() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [subscribeMessage, setSubscribeMessage] = useState('');
  const postsPerPage = 7;

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
      if (!baseUrl || baseUrl.includes('placeholder')) {
        throw new Error('Supabase URL is not configured. Please check your environment variables.');
      }

      const functionUrl = `${baseUrl.replace(/\/$/, '')}/functions/v1/subscribe-mailerlite`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ email: subscribeEmail })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Subscription failed');
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategory]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [postsResponse, categoriesResponse] = await Promise.all([
          safeSupabaseQuery<Post[]>(() =>
            supabase
              .from('posts')
              .select('*')
              .order('created_at', { ascending: false })
          ),
          safeSupabaseQuery<Category[]>(() =>
            supabase
              .from('categories')
              .select('*')
              .order('name')
          )
        ]);
        
        if (postsResponse.error) {
          console.error('Supabase error fetching insights:', postsResponse.error);
          setError(postsResponse.error.message || 'Failed to fetch insights');
        } else {
          // Filter strictly for insight content_type (or if not specified, posts default to blog)
          const allPosts = postsResponse.data || [];
          const insightPosts = allPosts.filter(p => p.content_type === 'insight');
          setPosts(insightPosts);
        }

        if (categoriesResponse.error) {
          console.error('Supabase error fetching categories:', categoriesResponse.error);
        } else {
          setCategories(categoriesResponse.data || []);
        }
      } catch (err) {
        console.error('Catch error fetching insights:', err);
        setError('An unexpected error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredPosts = posts.filter(post => {
    const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
    const matchesSearch = 
      (post.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (post.summary || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);

  const featuredPost = currentPage === 1 ? (currentPosts.find(p => p.is_featured || p.featured) || currentPosts[0]) : null;
  const regularPosts = featuredPost ? currentPosts.filter(p => p.id !== featuredPost.id) : currentPosts;

  return (
    <div className="min-h-screen bg-bg-primary pt-12 pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* HEADER */}
        <div className="mb-16">
          <div className="flex items-center gap-2 text-accent font-bold tracking-widest uppercase text-sm mb-4">
            <Lightbulb size={16} />
            <span>Revenue Insights</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6">
            Strategic Perspectives for Growth.
          </h1>
          <p className="text-xl text-text-secondary max-w-3xl leading-relaxed">
            Data-driven methodologies, pipeline governance frameworks, and executive playbooks designed to turn complex commercial challenges into systematic revenue growth.
          </p>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="mb-12 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search revenue insights..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-border rounded-md leading-5 bg-bg-surface text-text-primary placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent sm:text-sm transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button
              onClick={() => setActiveCategory('All')}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer",
                activeCategory === 'All'
                  ? "bg-accent text-white"
                  : "bg-bg-surface text-text-secondary hover:text-text-primary border border-border"
              )}
            >
              All Topics
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.name)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer",
                  activeCategory === category.name
                    ? "bg-accent text-white"
                    : "bg-bg-surface text-text-secondary hover:text-text-primary border border-border"
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT SECTION */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-bg-surface border border-border rounded-xl h-96"></div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-bg-surface border border-border rounded-xl">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-accent text-white rounded-md text-sm font-medium"
            >
              Retry
            </button>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16 bg-bg-surface border border-border rounded-xl px-6">
            <div className="inline-flex p-3 rounded-full bg-accent/10 text-accent mb-4">
              <Sparkles size={28} />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">Revenue Insights Coming Soon</h3>
            <p className="text-text-secondary max-w-md mx-auto mb-6 text-sm">
              We are currently preparing deep-dive analytical insights on Go-To-Market governance, opportunity scoring, and revenue predictability.
            </p>
            <Link 
              to="/about/founderInsights" 
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              Explore Founder Insights <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {/* FEATURED POST */}
            {featuredPost && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-bg-surface border border-border rounded-xl overflow-hidden hover:border-accent/40 transition-all duration-300"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                  <div className="lg:col-span-7 h-64 sm:h-80 lg:h-full min-h-[300px] overflow-hidden">
                    <img 
                      src={featuredPost.thumbnail_url} 
                      alt={featuredPost.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
                          {featuredPost.category}
                        </span>
                        <span className="text-xs text-text-secondary flex items-center gap-1">
                          <Clock size={12} /> {featuredPost.read_time} Min Read
                        </span>
                      </div>
                      <Link to={`/insights/${featuredPost.slug}`}>
                        <h2 className="text-2xl sm:text-3xl font-bold text-text-primary hover:text-accent transition-colors mb-4 line-clamp-3">
                          {featuredPost.title}
                        </h2>
                      </Link>
                      <p className="text-text-secondary text-sm sm:text-base mb-6 line-clamp-3 font-light leading-relaxed">
                        {featuredPost.summary}
                      </p>
                    </div>
                    <Link 
                      to={`/insights/${featuredPost.slug}`}
                      className="inline-flex items-center gap-2 text-accent font-semibold text-sm hover:underline"
                    >
                      Read Full Insight <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}

            {/* REGULAR POSTS GRID */}
            {regularPosts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {regularPosts.map((post, idx) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    className="bg-bg-surface border border-border rounded-xl overflow-hidden hover:border-accent/40 transition-all duration-300 flex flex-col"
                  >
                    <div className="h-48 overflow-hidden relative">
                      <img 
                        src={post.thumbnail_url} 
                        alt={post.title} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full bg-bg-surface/90 backdrop-blur-sm text-accent border border-border">
                        {post.category}
                      </span>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-text-secondary mb-3">
                          <span>{new Date(post.created_at).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {post.read_time} Min Read
                          </span>
                        </div>
                        <Link to={`/insights/${post.slug}`}>
                          <h3 className="text-lg font-bold text-text-primary hover:text-accent transition-colors mb-3 line-clamp-2">
                            {post.title}
                          </h3>
                        </Link>
                        <p className="text-text-secondary text-sm mb-6 line-clamp-3 font-light leading-relaxed">
                          {post.summary}
                        </p>
                      </div>
                      <Link 
                        to={`/insights/${post.slug}`}
                        className="inline-flex items-center gap-1.5 text-accent font-semibold text-xs hover:underline mt-auto"
                      >
                        Read Insight <ArrowRight size={14} />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 pt-8">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={cn(
                      "w-10 h-10 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                      currentPage === i + 1
                        ? "bg-accent text-white"
                        : "bg-bg-surface text-text-secondary hover:text-text-primary border border-border"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* NEWSLETTER SUBSCRIPTION */}
        <div className="mt-24 border border-border rounded-2xl bg-bg-surface p-8 sm:p-12 text-center max-w-3xl mx-auto">
          <div className="inline-flex p-3 rounded-full bg-accent/10 text-accent mb-4">
            <Award size={24} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-3">
            Subscribe to Revenue Insights
          </h2>
          <p className="text-text-secondary text-sm sm:text-base max-w-xl mx-auto mb-8 font-light">
            Receive monthly executive analyses on enterprise sales methodologies, GTM operations, and AI-powered pipeline predictability directly in your inbox.
          </p>

          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input 
              type="email"
              placeholder="Enter your executive email..."
              value={subscribeEmail}
              onChange={(e) => setSubscribeEmail(e.target.value)}
              required
              className="flex-1 px-4 py-3 rounded-lg border border-border bg-bg-primary text-text-primary placeholder-gray-400 focus:outline-none focus:border-accent text-sm"
            />
            <button
              type="submit"
              disabled={subscribeStatus === 'loading'}
              className="px-6 py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors text-sm disabled:opacity-50 cursor-pointer"
            >
              {subscribeStatus === 'loading' ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>

          {subscribeMessage && (
            <p className={cn(
              "text-xs mt-4",
              subscribeStatus === 'success' ? "text-green-500" : "text-red-500"
            )}>
              {subscribeMessage}
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
