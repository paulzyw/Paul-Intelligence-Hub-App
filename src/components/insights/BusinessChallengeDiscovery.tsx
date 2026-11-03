import { useState } from 'react';
import { Target, ArrowRight, Layers, ChevronRight, Hash } from 'lucide-react';
import type { ChallengeWithArticles } from '../../types';
import { InsightArticleCard } from './InsightArticleCard';

interface BusinessChallengeDiscoveryProps {
  challengeGroups: ChallengeWithArticles[];
  onFilterByChallenge?: (challengeName: string) => void;
}

export function BusinessChallengeDiscovery({
  challengeGroups,
  onFilterByChallenge
}: BusinessChallengeDiscoveryProps) {
  const [selectedChallengeSlug, setSelectedChallengeSlug] = useState<string | 'all'>('all');

  // Filter groups if user selects a specific challenge from the fast jump selector
  const visibleGroups = selectedChallengeSlug === 'all'
    ? challengeGroups
    : challengeGroups.filter(g => g.challenge.slug === selectedChallengeSlug);

  return (
    <section id="business-challenges" className="py-16 md:py-20 border-b border-border/60 bg-bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading & Introduction */}
        <div className="max-w-3xl mb-10">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-accent mb-3">
            <Target size={14} />
            <span>Problem-Centric Discovery</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight mb-4 text-balance">
            Explore by Business Challenge
          </h2>

          <p className="text-base sm:text-lg text-text-secondary font-light leading-relaxed">
            Every revenue organization faces different challenges. Explore practical insights and evidence-driven perspectives based on the problems you are working to solve.
          </p>
        </div>

        {/* Dynamic Condition Check */}
        {challengeGroups.length === 0 ? (
          <div className="rounded-2xl border border-border bg-bg-primary p-8 sm:p-12 text-center max-w-2xl mx-auto">
            <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto mb-4">
              <Layers size={22} />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">
              Business Challenge Mappings Updating
            </h3>
            <p className="text-sm text-text-secondary font-light mb-6">
              Published articles are being indexed to revenue challenge taxonomies. In the meantime, browse our full analytical library below.
            </p>
            <a
              href="#latest-insights"
              className="inline-flex items-center gap-2 text-xs font-semibold text-accent hover:underline"
            >
              <span>Jump to Latest Insights</span>
              <ArrowRight size={13} />
            </a>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Quick Jump Challenge Navigator (horizontal bar for rapid scanning) */}
            {challengeGroups.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none border-b border-border/40">
                <span className="text-xs text-text-secondary font-medium shrink-0 flex items-center gap-1 mr-2">
                  <Hash size={13} className="text-accent" />
                  <span>Active Challenges:</span>
                </span>

                <button
                  onClick={() => setSelectedChallengeSlug('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer border ${
                    selectedChallengeSlug === 'all'
                      ? 'bg-accent text-white border-accent'
                      : 'bg-bg-surface text-text-secondary hover:text-text-primary border-border'
                  }`}
                >
                  View All ({challengeGroups.length})
                </button>

                {challengeGroups.map((group) => (
                  <button
                    key={group.challenge.id}
                    onClick={() => setSelectedChallengeSlug(group.challenge.slug)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer border ${
                      selectedChallengeSlug === group.challenge.slug
                        ? 'bg-accent text-white border-accent'
                        : 'bg-bg-surface text-text-secondary hover:text-text-primary border-border'
                    }`}
                  >
                    <span>{group.challenge.name}</span>
                    <span className="ml-1.5 opacity-70 font-mono text-[11px]">
                      ({group.articles.length})
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Render Dynamic Challenge Groups */}
            <div className="space-y-16">
              {visibleGroups.map((group) => (
                <div
                  key={group.challenge.id}
                  id={`challenge-${group.challenge.slug}`}
                  className="scroll-mt-24 space-y-6"
                >
                  {/* Group Header */}
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-border/60">
                    <div className="max-w-2xl">
                      <div className="flex items-center gap-2 text-[11px] font-mono uppercase text-accent tracking-wider mb-1">
                        <span>Challenge Group</span>
                        <span aria-hidden="true" className="text-border">·</span>
                        <span>{group.articles.length} {group.articles.length === 1 ? 'Article' : 'Articles'}</span>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-bold text-text-primary">
                        {group.challenge.name}
                      </h3>

                      {group.challenge.description && (
                        <p className="text-xs sm:text-sm text-text-secondary mt-1 font-light leading-relaxed">
                          "{group.challenge.description}"
                        </p>
                      )}
                    </div>

                    {/* Explore All In This Challenge */}
                    {onFilterByChallenge && (
                      <button
                        onClick={() => onFilterByChallenge(group.challenge.name)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline cursor-pointer whitespace-nowrap self-start md:self-end"
                      >
                        <span>Explore All {group.challenge.name} Insights</span>
                        <ChevronRight size={14} />
                      </button>
                    )}
                  </div>

                  {/* Article Cards Full-Width List for this Challenge */}
                  <div className="flex flex-col space-y-3 sm:space-y-4 w-full">
                    {group.articles.map((article) => (
                      <InsightArticleCard
                        key={`${group.challenge.id}-${article.id}`}
                        article={article}
                        showPrimaryBadge={true}
                        variant="horizontal-compact"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>
    </section>
  );
}
