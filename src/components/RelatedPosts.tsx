import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, type Post } from '../lib/supabase';
import { motion } from 'motion/react';
import { ArrowRight, Clock } from 'lucide-react';

interface RelatedPostsProps {
  currentPostId: string;
  category: string;
}

export function RelatedPosts({ currentPostId, category }: RelatedPostsProps) {
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRelatedPosts() {
      setLoading(true);
      try {
        // 1. Try to fetch posts in the same category
        let { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('category', category)
          .neq('id', currentPostId)
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) throw error;

        let results = data || [];

        // 2. Fallback: If fewer than 3 posts, fetch most recent from any category
        if (results.length < 3) {
          const excludeIds = [currentPostId, ...results.map(p => p.id)];
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('posts')
            .select('*')
            .not('id', 'in', `(${excludeIds.join(',')})`)
            .order('created_at', { ascending: false })
            .limit(3 - results.length);

          if (!fallbackError && fallbackData) {
            results = [...results, ...fallbackData];
          }
        }

        setRelatedPosts(results);
      } catch (err) {
        console.error('Error fetching related posts:', err);
      } finally {
        setLoading(false);
      }
    }

    if (currentPostId && category) {
      fetchRelatedPosts();
    }
  }, [currentPostId, category]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse space-y-4">
            <div className="h-48 bg-border/50 rounded-xl w-full"></div>
            <div className="h-4 bg-border/50 rounded w-1/4"></div>
            <div className="h-6 bg-border/50 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (relatedPosts.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
      {relatedPosts.map((post, index) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          className="group"
        >
          <Link to={`/post/${post.slug}`} className="flex flex-col h-full">
            <div className="relative h-48 rounded-xl overflow-hidden mb-4 bg-bg-surface border border-border transition-transform duration-300 group-hover:-translate-y-2">
              <img
                src={post.thumbnail_url || 'https://picsum.photos/seed/consulting/800/600'}
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 left-3 bg-obsidian/80 backdrop-blur-sm border border-amber/30 text-amber text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                {post.category}
              </div>
            </div>
            
            <h4 className="text-lg font-bold text-text-primary mb-2 line-clamp-2 group-hover:text-accent transition-colors leading-snug">
              {post.title}
            </h4>
            
            <div className="mt-auto flex items-center justify-between text-xs text-text-secondary">
              <span className="flex items-center gap-1">
                <Clock size={14} /> {post.read_time} Min Read
              </span>
              <span className="text-accent font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Read <ArrowRight size={14} />
              </span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
