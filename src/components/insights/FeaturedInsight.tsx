import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Star, BookOpen } from 'lucide-react';
import type { Post } from '../../lib/supabase';

interface FeaturedInsightProps {
  post: Post | null;
}

export function FeaturedInsight({ post }: FeaturedInsightProps) {
  const [imageError, setImageError] = useState(false);

  if (!post) return null;

  const formattedDate = new Date(post.published_at || post.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <section className="py-12 border-b border-border/60 bg-bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Lead */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-accent">
            <Star size={14} className="fill-accent text-accent" />
            <span>Featured Perspective</span>
          </div>
          <span className="text-xs text-text-secondary hidden sm:inline-block font-light">
            Curated Executive Reading
          </span>
        </div>

        {/* Editorial Feature Split Card */}
        <div className="group relative rounded-2xl border border-border bg-bg-primary overflow-hidden shadow-sm hover:shadow-xl hover:border-accent/50 transition-all duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            
            {/* Left/Top Media Slot (7 cols on desktop) - Zoom & Lighting on Hover */}
            <Link
              to={`/resources/insights/${post.slug}`}
              className="lg:col-span-7 relative block min-h-[300px] sm:min-h-[380px] lg:min-h-[440px] bg-bg-primary overflow-hidden focus:outline-hidden"
            >
              {!imageError && post.thumbnail_url ? (
                <>
                  <img
                    src={post.thumbnail_url}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108 will-change-transform brightness-[0.97] group-hover:brightness-105"
                    loading="eager"
                    referrerPolicy="no-referrer"
                    onError={() => setImageError(true)}
                  />

                  {/* Ambient Vignette & Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-black/5 lg:to-black/30 pointer-events-none transition-opacity duration-500 opacity-70 group-hover:opacity-40" />
                  
                  {/* Subtle Accent Sheen Glow on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-accent/0 via-accent/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                  {/* Top-Left Featured Tag */}
                  <div className="absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bg-surface/90 backdrop-blur-md border border-accent/30 text-accent text-xs font-semibold shadow-md tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    <span>Featured Perspective</span>
                  </div>

                  {/* Floating Action Badge revealed on Hover (desktop) */}
                  <div className="absolute bottom-4 right-4 z-10 hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-medium opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-xl pointer-events-none">
                    <span>Explore Perspective</span>
                    <ArrowRight size={13} className="text-accent" />
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-bg-surface to-bg-primary transition-transform duration-500 group-hover:scale-105">
                  <BookOpen className="w-12 h-12 text-accent/60 mb-3" />
                  <span className="text-sm font-semibold text-text-primary">
                    {post.category}
                  </span>
                  <p className="text-xs text-text-secondary mt-1 max-w-sm">
                    {post.title}
                  </p>
                </div>
              )}
            </Link>

            {/* Right/Bottom Content Column (5 cols on desktop) */}
            <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
              <div>
                {/* Clean unboxed metadata with separators */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary mb-4">
                  <span className="font-semibold text-accent">{post.category}</span>
                  <span aria-hidden="true" className="text-border">·</span>
                  <time dateTime={post.published_at || post.created_at}>{formattedDate}</time>
                  <span aria-hidden="true" className="text-border">·</span>
                  <span className="font-medium text-text-primary">
                    {post.author || post.author_id || 'Paul Wang'}
                  </span>
                  <span aria-hidden="true" className="text-border">·</span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} className="opacity-70" />
                    <span>{post.read_time} min read</span>
                  </span>
                </div>

                {/* Headline */}
                <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary group-hover:text-accent transition-colors duration-300 leading-tight mb-4">
                  <Link to={`/resources/insights/${post.slug}`}>
                    {post.title}
                  </Link>
                </h2>

                {/* Excerpt */}
                <p className="text-sm sm:text-base text-text-secondary font-light leading-relaxed mb-6">
                  {post.summary}
                </p>
              </div>

              {/* Action */}
              <div className="pt-6 border-t border-border/50">
                <Link
                  to={`/resources/insights/${post.slug}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
                >
                  <span>Read Full Insight</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform duration-300" />
                </Link>
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
