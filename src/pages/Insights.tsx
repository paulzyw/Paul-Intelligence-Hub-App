import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Clock, Award } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { supabase, type Post, type Category } from '../lib/supabase';

export function Insights() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
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
      // 1. Save to Supabase table
      const { error: dbError } = await supabase
        .from('subscribers')
        .insert([{ email: subscribeEmail }]);

      if (dbError && dbError.code !== '23505') {
        throw new Error(`Database Error: ${dbError.message}`);
      }

      // 2. Call Edge Function for MailerLite
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
      setSubscribeMessage('Thank you for subscribing!');
      setSubscribeEmail('');
    } catch (err: any) {
      console.error('Subscription error:', err);
      setSubscribeStatus('error');
      setSubscribeMessage(err.message || 'Something went wrong. Please try again.');
    }
  };

  // Reset to page 1 when search or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategory]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [postsResponse, categoriesResponse] = await Promise.all([
          supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false }),
          supabase
            .from('categories')
            .select('*')
            .order('name')
        ]);
        
        if (!postsResponse.error && postsResponse.data) {
          setPosts(postsResponse.data);
        }
        if (!categoriesResponse.error && categoriesResponse.data) {
          setCategories(categoriesResponse.data);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredPosts = posts.filter(post => {
    const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);

  const featuredPost = currentPage === 1 ? (currentPosts.find(p => p.is_featured) || currentPosts[0]) : null;
  const regularPosts = featuredPost ? currentPosts.filter(p => p.id !== featuredPost.id) : currentPosts;

  return (
    <div className="min-h-screen bg-bg-primary pt-12 pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* HEADER */}
        <div className="mb-16">
          <p className="text-accent font-bold tracking-widest uppercase text-sm mb-4">Insights</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6">The Commercial Edge.</h1>
          <p className="text-xl text-text-secondary max-w-3xl">
            Data-driven perspectives on scaling software solutions and leading industrial change.
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
              placeholder="Search insights..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-border rounded-md leading-5 bg-bg-surface text-text-primary placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent sm:text-sm transition-colors"
            />
          </div>
          
          <div className="flex overflow-x-auto pb-2 w-full md:w-auto hide-scrollbar gap-2">
            <button
              onClick={() => setActiveCategory('All')}
              className={cn(
                "whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                activeCategory === 'All'
                  ? "bg-obsidian text-ivory border-amber dark:bg-ivory dark:text-obsidian dark:border-amber"
                  : "bg-bg-surface text-text-secondary border-border hover:border-accent/50"
              )}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.name)}
                className={cn(
                  "whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                  activeCategory === category.name
                    ? "bg-obsidian text-ivory border-amber dark:bg-ivory dark:text-obsidian dark:border-amber"
                    : "bg-bg-surface text-text-secondary border-border hover:border-accent/50"
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* MAIN FEED */}
          <div className="w-full lg:w-2/3 xl:w-3/4 flex flex-col gap-12">
            
            {loading ? (
              <div className="space-y-12 w-full">
                {/* Featured Skeleton */}
                <div className="bg-bg-surface border border-border rounded-xl overflow-hidden animate-pulse">
                  <div className="h-64 md:h-96 bg-border/50"></div>
                  <div className="p-8 md:p-10">
                    <div className="h-4 bg-border/50 rounded w-1/4 mb-4"></div>
                    <div className="h-8 bg-border/50 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-border/50 rounded w-full mb-2"></div>
                    <div className="h-4 bg-border/50 rounded w-5/6 mb-8"></div>
                    <div className="h-6 bg-border/50 rounded w-1/3"></div>
                  </div>
                </div>
                {/* List Skeleton */}
                <div className="flex flex-col gap-8">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col md:flex-row bg-bg-surface border border-border rounded-xl overflow-hidden animate-pulse">
                      <div className="w-full md:w-1/3 h-48 md:h-auto bg-border/50"></div>
                      <div className="w-full md:w-2/3 p-6 md:p-8 flex flex-col justify-center">
                        <div className="h-4 bg-border/50 rounded w-1/4 mb-3"></div>
                        <div className="h-6 bg-border/50 rounded w-3/4 mb-3"></div>
                        <div className="h-4 bg-border/50 rounded w-full mb-2"></div>
                        <div className="h-4 bg-border/50 rounded w-5/6 mb-6"></div>
                        <div className="h-4 bg-border/50 rounded w-1/3 mt-auto"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : filteredPosts.length > 0 ? (
              <>
                {/* FEATURED INSIGHT */}
                {featuredPost && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="group cursor-pointer flex flex-col bg-bg-surface border border-border rounded-xl overflow-hidden hover:border-amber hover:shadow-[0_0_30px_rgba(237,137,54,0.15)] transition-all duration-500"
                  >
                    <Link to={`/post/${featuredPost.slug}`} className="flex flex-col h-full">
                      <div className="relative h-64 md:h-96 overflow-hidden">
                        <img 
                          src={featuredPost.thumbnail_url} 
                          alt={featuredPost.title} 
                          className="w-full h-full object-cover scale-100 group-hover:scale-110 transition-transform duration-700 ease-out will-change-transform"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-4 left-4 bg-obsidian/90 border border-amber text-ivory text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                          <Award size={12} className="text-amber" />
                          Featured
                        </div>
                      </div>
                      <div className="p-8 md:p-10 flex flex-col flex-grow">
                        <div className="flex items-center gap-4 mb-4">
                          <span className="text-accent font-bold text-sm uppercase tracking-wider">{featuredPost.category || 'Uncategorized'}</span>
                          <span className="text-text-secondary text-sm">{new Date(featuredPost.created_at).toLocaleDateString()}</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4 group-hover:text-accent transition-colors">
                          {featuredPost.title}
                        </h2>
                        <p className="text-text-secondary text-lg mb-8 line-clamp-3">
                          {featuredPost.summary}
                        </p>
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-4 text-sm text-text-secondary">
                            <span className="flex items-center gap-1"><Clock size={16} /> {featuredPost.read_time} Min Read</span>
                            <span className="flex items-center gap-1"><Award size={16} /> Strategic</span>
                          </div>
                          <span className="text-accent font-medium flex items-center gap-2 group/link">
                            Read Article <ArrowRight size={16} className="transition-transform group-hover/link:translate-x-1" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )}

                <div className="w-full h-px bg-border my-4"></div>

                {/* FEED LIST */}
                <div className="flex flex-col gap-8">
                  {regularPosts.map((post, index) => (
                    <motion.div 
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="group cursor-pointer flex flex-col md:flex-row bg-bg-surface border border-border rounded-xl overflow-hidden hover:border-amber hover:shadow-[0_0_25px_rgba(237,137,54,0.15)] transition-all duration-500 hover:-translate-y-1"
                    >
                      <Link to={`/post/${post.slug}`} className="flex flex-col md:flex-row w-full h-full">
                        <div className="w-full md:w-1/3 h-48 md:h-auto relative overflow-hidden">
                          <img 
                            src={post.thumbnail_url} 
                            alt={post.title} 
                            className="w-full h-full object-cover scale-100 group-hover:scale-110 transition-transform duration-700 ease-out will-change-transform"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="w-full md:w-2/3 p-6 md:p-8 flex flex-col justify-center">
                          <div className="flex items-center gap-4 mb-3">
                            <span className="text-accent font-bold text-xs uppercase tracking-wider">{post.category || 'Uncategorized'}</span>
                            <span className="text-text-secondary text-xs">{new Date(post.created_at).toLocaleDateString()}</span>
                          </div>
                          <h3 className="text-2xl font-bold text-text-primary mb-3 line-clamp-2 group-hover:text-accent transition-colors">
                            {post.title}
                          </h3>
                          <p className="text-text-secondary text-base mb-6 line-clamp-2">
                            {post.summary}
                          </p>
                          <div className="flex items-center justify-between mt-auto">
                            <div className="flex items-center gap-4 text-xs text-text-secondary">
                              <span className="flex items-center gap-1"><Clock size={14} /> {post.read_time} Min Read</span>
                              <span className="flex items-center gap-1"><Award size={14} /> Strategic</span>
                            </div>
                            <span className="text-accent font-medium text-sm flex items-center gap-1 group/link">
                              Read Article <ArrowRight size={14} className="transition-transform group-hover/link:translate-x-1" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-24 bg-bg-surface border border-border rounded-xl">
                <h3 className="text-2xl font-bold text-text-primary mb-2">No insights found</h3>
                <p className="text-text-secondary">Try adjusting your search or category filter.</p>
                <button 
                  onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                  className="mt-6 text-accent hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button 
                  onClick={() => {
                    setCurrentPage(prev => Math.max(prev - 1, 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-full text-sm font-medium text-text-secondary hover:text-accent disabled:opacity-50 disabled:hover:text-text-secondary transition-colors"
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => {
                      setCurrentPage(page);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors",
                      currentPage === page
                        ? "bg-accent text-white"
                        : "text-text-secondary hover:text-accent hover:bg-border"
                    )}
                  >
                    {page}
                  </button>
                ))}

                <button 
                  onClick={() => {
                    setCurrentPage(prev => Math.min(prev + 1, totalPages));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-full text-sm font-medium text-text-secondary hover:text-accent disabled:opacity-50 disabled:hover:text-text-secondary transition-colors"
                >
                  Next
                </button>
              </div>
            )}

          </div>

          {/* SIDEBAR */}
          <div className="w-full lg:w-1/3 xl:w-1/4">
            <div className="sticky top-24">
              <div className="bg-bg-surface border border-border rounded-xl p-6 mb-8">
                <h3 className="text-lg font-bold text-text-primary mb-6 border-b border-border pb-4">By the Numbers</h3>
                <ul className="space-y-6">
                  <li className="flex flex-col">
                    <span className="text-3xl font-bold text-accent mb-1">50+</span>
                    <span className="text-sm text-text-secondary">Strategic Frameworks Shared</span>
                  </li>
                  <li className="flex flex-col">
                    <span className="text-3xl font-bold text-accent mb-1">Top 5%</span>
                    <span className="text-sm text-text-secondary">Contributor in Digital Transformation</span>
                  </li>
                  <li className="flex flex-col">
                    <span className="text-3xl font-bold text-accent mb-1">20+</span>
                    <span className="text-sm text-text-secondary">Countries Read In</span>
                  </li>
                </ul>
              </div>

              <div className="bg-bg-surface rounded-xl p-6 text-text-primary border border-border transition-colors duration-400">
                <h3 className="text-lg font-bold mb-2">Subscribe to Insights</h3>
                <p className="text-sm text-text-secondary mb-4">Get the latest strategies on SaaS growth and digital transformation delivered to your inbox.</p>
                <form className="flex flex-col gap-3" onSubmit={handleSubscribe}>
                  <input 
                    type="email" 
                    placeholder="Corporate Email" 
                    required
                    value={subscribeEmail}
                    onChange={(e) => setSubscribeEmail(e.target.value)}
                    disabled={subscribeStatus === 'loading'}
                    className="w-full px-3 py-2 bg-bg-primary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent text-text-primary disabled:opacity-50 transition-all"
                  />
                  <button 
                    type="submit"
                    disabled={subscribeStatus === 'loading'}
                    className="w-full py-2 bg-accent text-white font-bold rounded hover:opacity-90 transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-accent/20 active:scale-[0.98]"
                  >
                    {subscribeStatus === 'loading' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : 'Subscribe'}
                  </button>
                </form>
                {subscribeMessage && (
                  <p className={cn(
                    "mt-4 text-xs text-center font-medium",
                    subscribeStatus === 'success' ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"
                  )}>
                    {subscribeMessage}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
