import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, type Post } from '../lib/supabase';
import { safeSupabaseQuery } from '../lib/fetchData';
import { Clock, ArrowLeft, Calendar, Lightbulb, ChevronRight, Share2, Check, User } from 'lucide-react';
import { motion } from 'motion/react';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';

export function InsightDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [relatedInsights, setRelatedInsights] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchInsight() {
      if (!slug) return;
      setLoading(true);
      try {
        const { data, error } = await safeSupabaseQuery<Post>(() =>
          (supabase
            .from('posts')
            .select('*')
            .eq('slug', slug)
            .single()) as any
        );
        
        if (error) {
          console.error('Error fetching insight:', error);
        } else {
          setPost(data);

          // Fetch related insights
          if (data) {
            const { data: related } = await supabase
              .from('posts')
              .select('*')
              .eq('content_type', 'insight')
              .neq('id', data.id)
              .order('created_at', { ascending: false })
              .limit(3);
            setRelatedInsights(related || []);
          }
        }
      } catch (err) {
        console.error('Error fetching insight:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchInsight();
  }, [slug]);

  useEffect(() => {
    if (!loading && post) {
      const timer = setTimeout(() => {
        const blocks = document.querySelectorAll('pre');
        blocks.forEach((block) => {
          const codeEl = block.querySelector('code');
          if (codeEl) {
            hljs.highlightElement(codeEl);
          } else {
            hljs.highlightElement(block);
          }

          if (block.parentElement?.classList.contains('code-block-wrapper')) return;
          
          const wrapper = document.createElement('div');
          wrapper.className = 'code-block-wrapper';
          block.parentNode?.insertBefore(wrapper, block);
          
          const header = document.createElement('div');
          header.className = 'code-block-header';
          
          const button = document.createElement('button');
          button.className = 'copy-code-btn';
          button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg> <span>Copy</span>';
          
          button.addEventListener('click', () => {
            const code = block.querySelector('code')?.innerText || block.innerText;
            navigator.clipboard.writeText(code).then(() => {
              button.classList.add('copied');
              button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check text-green-500"><path d="M20 6 9 17l-5-5"/></svg> <span>Copied!</span>';
              setTimeout(() => {
                button.classList.remove('copied');
                button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg> <span>Copy</span>';
              }, 2000);
            });
          });
          
          header.appendChild(button);
          wrapper.appendChild(header);
          wrapper.appendChild(block);
          
          block.style.margin = '0';
          block.style.paddingTop = '0';
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, post]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        text: post?.summary,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-postdetail-primary pt-24 pb-24">
        <div className="mx-auto max-w-[900px] px-4 sm:px-6">
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
      <div className="min-h-screen bg-bg-postdetail-primary pt-32 pb-24 text-center px-4">
        <h1 className="text-4xl font-bold text-text-primary mb-4">Insight Not Found</h1>
        <p className="text-text-secondary mb-6 max-w-md mx-auto">
          The requested Revenue Insight could not be found or may have been updated.
        </p>
        <Link to="/insights" className="text-accent hover:underline inline-flex items-center justify-center gap-2 font-medium">
          <ArrowLeft size={16} /> Back to Revenue Insights
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-postdetail-primary pt-12 pb-24">
      <article className="mx-auto max-w-[900px] px-4 sm:px-6">
        
        {/* BREADCRUMB & BACK LINK */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <nav className="flex items-center gap-2 text-xs text-text-secondary" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-accent transition-colors">Home</Link>
            <ChevronRight size={12} />
            <Link to="/insights" className="hover:text-accent transition-colors">Revenue Insights</Link>
            <ChevronRight size={12} />
            <span className="text-text-primary truncate max-w-[200px] sm:max-w-[300px]">{post.title}</span>
          </nav>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent transition-colors px-2.5 py-1 rounded border border-border bg-bg-surface cursor-pointer"
            title="Share this insight"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
            <span>{copied ? 'Link Copied!' : 'Share'}</span>
          </button>
        </div>

        {/* HEADER */}
        <header className="mb-12">
          <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
            <span className="text-accent font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
              <Lightbulb size={14} />
              {post.category || 'Strategic Perspective'}
            </span>
            <span className="text-text-primary font-semibold flex items-center gap-1.5">
              <User size={14} className="text-accent" /> {post.author || post.author_id || 'Paul Wang'}
            </span>
            <span className="text-text-secondary flex items-center gap-1">
              <Calendar size={14} /> {new Date(post.created_at).toLocaleDateString()}
            </span>
            <span className="text-text-secondary flex items-center gap-1">
              <Clock size={14} /> {post.read_time} Min Read
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-8 leading-tight">
            {post.title}
          </h1>
        </header>

        {/* FEATURE IMAGE */}
        {post.thumbnail_url && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full h-64 md:h-96 rounded-xl overflow-hidden mb-12 border border-border"
          >
            <img 
              src={post.thumbnail_url} 
              alt={post.title} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}

        {/* KEY TAKEAWAYS */}
        {post.summary && (
          <div className="bg-bg-postdetail-surface border border-accent/30 rounded-xl p-8 mb-12 shadow-[0_0_15px_rgba(237,137,54,0.05)]">
            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-accent rounded-full inline-block"></span>
              Executive Takeaways
            </h3>
            <p className="text-text-secondary text-lg leading-relaxed font-light">
              {post.summary}
            </p>
          </div>
        )}

        {/* CONTENT */}
        <div className="prose-content">
          <div 
            className="prose dark:prose-invert max-w-none mb-24 text-text-primary prose-p:mt-0 prose-p:mb-3 prose-p:text-lg prose-headings:text-text-primary prose-a:text-accent hover:prose-a:text-accent/80 prose-strong:text-text-primary prose-li:mt-0 prose-li:mb-1 transition-colors duration-400"
            dangerouslySetInnerHTML={{ 
              __html: DOMPurify.sanitize(post.content).replace(/<table/g, '<div class="overflow-x-auto w-full"><table').replace(/<\/table>/g, '</table></div>') 
            }}
          />
        </div>

        {/* FOOTER / RELATED INSIGHTS */}
        {relatedInsights.length > 0 && (
          <footer className="border-t border-border pt-12">
            <h3 className="text-2xl font-bold text-text-primary mb-8">Related Revenue Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedInsights.map((item) => (
                <Link
                  key={item.id}
                  to={`/insights/${item.slug}`}
                  className="group bg-bg-surface border border-border rounded-xl p-5 hover:border-accent/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="text-xs text-accent font-semibold mb-2 block">{item.category}</span>
                    <h4 className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors line-clamp-2 mb-2">
                      {item.title}
                    </h4>
                    <p className="text-xs text-text-secondary line-clamp-2 font-light">
                      {item.summary}
                    </p>
                  </div>
                  <div className="text-[11px] text-text-secondary mt-4 flex items-center justify-between gap-1 font-mono">
                    <span className="text-text-primary font-medium">{item.author || item.author_id || 'Paul Wang'}</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> {item.read_time} min read</span>
                  </div>
                </Link>
              ))}
            </div>
          </footer>
        )}

      </article>
    </div>
  );
}
