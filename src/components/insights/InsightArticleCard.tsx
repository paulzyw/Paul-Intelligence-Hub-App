import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, BookOpen, Sparkles } from 'lucide-react';
import type { ArticleWithChallengeMeta } from '../../types';

interface InsightArticleCardProps {
  article: ArticleWithChallengeMeta;
  showPrimaryBadge?: boolean;
  variant?: 'grid' | 'horizontal-compact';
}

export function InsightArticleCard({
  article,
  showPrimaryBadge = false,
  variant = 'grid'
}: InsightArticleCardProps) {
  const [imageError, setImageError] = useState(false);
  const formattedDate = new Date(article.published_at || article.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  // Compact horizontal row layout matching challenge group discovery design
  if (variant === 'horizontal-compact') {
    return (
      <article className="group relative w-full flex flex-col sm:flex-row items-stretch sm:items-center rounded-xl border border-border bg-bg-primary overflow-hidden hover:border-accent/50 hover:shadow-sm transition-all duration-200 p-2.5 sm:p-3 gap-3 sm:gap-4">
        {/* Left Thumbnail Slot - compact landscape height & clickable */}
        <Link
          to={`/insights/${article.slug}`}
          tabIndex={-1}
          aria-hidden="true"
          className="relative w-full sm:w-28 sm:h-20 md:w-32 md:h-20 shrink-0 overflow-hidden rounded-lg bg-bg-primary block focus:outline-hidden"
        >
          {!imageError && article.thumbnail_url ? (
            <img
              src={article.thumbnail_url}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gradient-to-br from-bg-surface to-bg-primary">
              <BookOpen className="w-5 h-5 text-accent/70 mb-0.5" />
              <span className="text-[10px] font-medium text-text-secondary line-clamp-1 max-w-[90%]">
                {article.category}
              </span>
            </div>
          )}

          {/* Primary Relevance Indicator (Compact Badge in thumbnail top-right) */}
          {showPrimaryBadge && article.isPrimary && (
            <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-bg-surface/95 backdrop-blur-xs border border-accent/40 text-[9px] font-semibold text-accent shadow-xs flex items-center gap-1">
              <Sparkles size={9} />
              <span>Primary</span>
            </div>
          )}
        </Link>

        {/* Right Content Body - streamlined vertical stack */}
        <div className="flex flex-1 flex-col justify-center min-w-0 py-0.5">
          {/* Eyebrow Metadata: Category · Date · Author · Clock Read Time */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs text-text-secondary mb-0.5">
            <span className="font-semibold text-accent">{article.category}</span>
            <span aria-hidden="true" className="text-border">·</span>
            <time dateTime={article.published_at || article.created_at}>{formattedDate}</time>
            <span aria-hidden="true" className="text-border">·</span>
            <span className="font-medium text-text-primary">
              {article.author || article.author_id || 'Paul Wang'}
            </span>
            <span aria-hidden="true" className="text-border">·</span>
            <span className="flex items-center gap-1">
              <Clock size={11} className="opacity-70" />
              <span>{article.read_time} min read</span>
            </span>
          </div>

          {/* Title */}
          <h4 className="text-base sm:text-lg md:text-xl font-bold text-text-primary group-hover:text-accent transition-colors tracking-tight line-clamp-1 sm:line-clamp-2 my-0.5 leading-snug">
            <Link to={`/insights/${article.slug}`}>
              {article.title}
            </Link>
          </h4>

          {/* Summary Excerpt */}
          <p className="text-xs sm:text-sm text-text-secondary font-normal line-clamp-2 leading-relaxed">
            {article.summary}
          </p>
        </div>
      </article>
    );
  }

  // Standard vertical grid card layout for latest insights & archives
  return (
    <article className="group relative flex flex-col rounded-xl border border-border bg-bg-surface overflow-hidden hover:border-accent/50 hover:shadow-md transition-all duration-300">
      {/* Thumbnail Slot with Resilient Fallback */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-bg-primary">
        {!imageError && article.thumbnail_url ? (
          <img
            src={article.thumbnail_url}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-bg-surface to-bg-primary">
            <BookOpen className="w-8 h-8 text-accent/70 mb-2" />
            <span className="text-xs font-medium text-text-secondary line-clamp-1 max-w-[80%]">
              {article.category}
            </span>
          </div>
        )}

        {/* Primary Relevance Indicator (Subtle, unboxed or clean flag) */}
        {showPrimaryBadge && article.isPrimary && (
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded bg-bg-surface/95 backdrop-blur-sm border border-accent/40 text-[11px] font-medium text-accent shadow-sm flex items-center gap-1">
            <Sparkles size={11} />
            <span>Primary Focus</span>
          </div>
        )}
      </div>

      {/* Card Content Body */}
      <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
        <div>
          {/* Metadata Discipline: Zero-Pill Unboxed Text with Separators */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary mb-3">
            <span className="font-medium text-accent">{article.category}</span>
            <span aria-hidden="true" className="text-border">·</span>
            <time dateTime={article.published_at || article.created_at}>{formattedDate}</time>
            <span aria-hidden="true" className="text-border">·</span>
            <span className="font-medium text-text-primary">
              {article.author || article.author_id || 'Paul Wang'}
            </span>
            <span aria-hidden="true" className="text-border">·</span>
            <span className="flex items-center gap-1">
              <Clock size={12} className="opacity-70" />
              <span>{article.read_time} min read</span>
            </span>
          </div>

          {/* Title */}
          <h3 className="text-base sm:text-lg font-bold text-text-primary group-hover:text-accent transition-colors line-clamp-2 leading-snug mb-2.5">
            <Link to={`/insights/${article.slug}`}>
              {article.title}
            </Link>
          </h3>

          {/* Summary Excerpt */}
          <p className="text-xs sm:text-sm text-text-secondary font-light line-clamp-3 leading-relaxed mb-4">
            {article.summary}
          </p>
        </div>

        {/* Read Action Footer */}
        <div className="pt-3 border-t border-border/40 mt-auto flex items-center justify-between">
          <Link
            to={`/insights/${article.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent group-hover:translate-x-0.5 transition-transform"
          >
            <span>Read Full Insight</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </article>
  );
}
