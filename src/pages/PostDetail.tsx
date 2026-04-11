import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, type Post } from '../lib/supabase';
import { Clock, ArrowLeft, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import DOMPurify from 'dompurify';
import { RelatedPosts } from '../components/RelatedPosts';

export function PostDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPost() {
      if (!slug) return;
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('slug', slug)
          .single();
        
        if (error) {
          console.error('Error fetching post:', error);
        } else {
          setPost(data);
        }
      } catch (err) {
        console.error('Error fetching post:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary pt-24 pb-24">
        <div className="mx-auto max-w-[800px] px-4 sm:px-6">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-border/50 rounded w-1/4"></div>
            <div className="h-12 bg-border/50 rounded w-3/4"></div>
            <div className="h-64 bg-border/50 rounded w-full"></div>
            <div className="space-y-4">
              <div className="h-4 bg-border/50 rounded w-full"></div>
              <div className="h-4 bg-border/50 rounded w-full"></div>
              <div className="h-4 bg-border/50 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-bg-primary pt-32 pb-24 text-center">
        <h1 className="text-4xl font-bold text-text-primary mb-4">Post Not Found</h1>
        <Link to="/insights" className="text-accent hover:underline flex items-center justify-center gap-2">
          <ArrowLeft size={16} /> Back to Insights
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary pt-12 pb-24">
      <article className="mx-auto max-w-[800px] px-4 sm:px-6">
        
        {/* BACK LINK */}
        <Link to="/insights" className="inline-flex items-center gap-2 text-text-secondary hover:text-accent transition-colors mb-8">
          <ArrowLeft size={16} /> Back to Insights
        </Link>

        {/* HEADER */}
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-accent font-bold text-sm uppercase tracking-wider">{post.category || 'Uncategorized'}</span>
            <span className="text-text-secondary text-sm flex items-center gap-1">
              <Calendar size={14} /> {new Date(post.created_at).toLocaleDateString()}
            </span>
            <span className="text-text-secondary text-sm flex items-center gap-1">
              <Clock size={14} /> {post.read_time} Min Read
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-8 leading-tight">
            {post.title}
          </h1>
        </header>

        {/* FEATURE IMAGE */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full h-64 md:h-96 rounded-xl overflow-hidden mb-12"
        >
          <img 
            src={post.thumbnail_url} 
            alt={post.title} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        {/* KEY TAKEAWAYS */}
        <div className="bg-bg-surface border border-amber/30 rounded-xl p-8 mb-12 shadow-[0_0_15px_rgba(237,137,54,0.05)]">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-amber rounded-full inline-block"></span>
            Key Takeaways
          </h3>
          <p className="text-text-secondary text-lg leading-relaxed font-light">
            {post.summary}
          </p>
        </div>

        {/* CONTENT */}
        <div 
          className="prose dark:prose-invert max-w-none mb-24 text-text-primary prose-p:mt-0 prose-p:mb-2 prose-p:text-lg prose-p:font-light prose-headings:text-text-primary prose-a:text-accent hover:prose-a:text-accent/80 prose-strong:font-medium prose-strong:text-text-primary prose-li:mt-0 prose-li:mb-0 transition-colors duration-400"
          dangerouslySetInnerHTML={{ 
            __html: DOMPurify.sanitize(post.content).replace(/<table/g, '<div class="overflow-x-auto w-full"><table').replace(/<\/table>/g, '</table></div>') 
          }}
        />

        {/* FOOTER / YOU MIGHT ALSO LIKE */}
        <footer className="border-t border-border pt-12">
          <h3 className="text-2xl font-bold text-text-primary mb-8">You Might Also Like</h3>
          <RelatedPosts currentPostId={post.id} category={post.category} />
        </footer>

      </article>
    </div>
  );
}
