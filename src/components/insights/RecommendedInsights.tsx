import { Link } from 'react-router-dom';
import { Bookmark, ArrowRight, Clock } from 'lucide-react';
import type { Post } from '../../lib/supabase';

interface RecommendedInsightsProps {
  recommendedPosts: Post[];
}

export function RecommendedInsights({ recommendedPosts }: RecommendedInsightsProps) {
  if (recommendedPosts.length === 0) return null;

  return (
    <section className="py-16 border-b border-border/60 bg-bg-surface/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-accent mb-2">
              <Bookmark size={14} />
              <span>Executive Briefings</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">
              Recommended & Strategic Readings
            </h2>
          </div>
          <span className="text-xs text-text-secondary hidden md:inline-block font-light">
            Foundational frameworks for revenue leaders
          </span>
        </div>

        {/* Compact 3-Column Editorial Briefing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendedPosts.slice(0, 3).map((post, idx) => (
            <div
              key={post.id}
              className="p-6 rounded-xl border border-border bg-bg-surface hover:border-accent/40 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-text-secondary mb-3">
                  <span className="font-semibold text-accent">{post.category}</span>
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Clock size={11} className="opacity-70" />
                    <span>{post.read_time} min</span>
                  </span>
                </div>

                <h3 className="text-base font-bold text-text-primary hover:text-accent transition-colors line-clamp-2 mb-2.5">
                  <Link to={`/insights/${post.slug}`}>
                    {post.title}
                  </Link>
                </h3>

                <p className="text-xs sm:text-sm text-text-secondary font-light line-clamp-3 leading-relaxed mb-4">
                  {post.summary}
                </p>
              </div>

              <div className="pt-4 border-t border-border/40 mt-auto">
                <Link
                  to={`/insights/${post.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
                >
                  <span>Explore Framework</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
