import { Clock, BookOpen } from 'lucide-react';
import type { Post } from '../../lib/supabase';
import { InsightArticleCard } from './InsightArticleCard';
import type { ArticleWithChallengeMeta } from '../../types';

interface LatestInsightsProps {
  posts: Post[];
}

export function LatestInsights({ posts }: LatestInsightsProps) {
  // Always display the latest three articles
  const latestThree = posts.slice(0, 3);

  return (
    <section id="latest-insights" className="py-16 border-b border-border/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-accent mb-2">
            <Clock size={14} />
            <span>Recent Publications</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            Latest Insights
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-1 font-light">
            The latest strategic frameworks, methodologies, and executive analyses.
          </p>
        </div>

        {/* Empty State */}
        {latestThree.length === 0 ? (
          <div className="rounded-xl border border-border bg-bg-surface p-12 text-center max-w-lg mx-auto">
            <BookOpen className="w-10 h-10 text-accent/60 mx-auto mb-3" />
            <h3 className="text-base font-bold text-text-primary mb-1">
              No recent insights available
            </h3>
            <p className="text-xs text-text-secondary font-light">
              Check back soon for upcoming revenue intelligence research.
            </p>
          </div>
        ) : (
          /* Grid of the 3 Latest Insight Article Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {latestThree.map((post) => {
              const articleMeta: ArticleWithChallengeMeta = {
                id: post.id,
                title: post.title,
                slug: post.slug,
                summary: post.summary || '',
                category: post.category || 'General',
                read_time: post.read_time || 5,
                thumbnail_url: post.thumbnail_url || '',
                is_featured: Boolean(post.is_featured),
                published_at: post.published_at,
                created_at: post.created_at,
                isPrimary: false,
                content_type: post.content_type,
                author_id: post.author_id || post.author || 'Paul Wang',
                author: post.author || post.author_id || 'Paul Wang'
              };

              return (
                <InsightArticleCard
                  key={post.id}
                  article={articleMeta}
                  showPrimaryBadge={false}
                />
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}
