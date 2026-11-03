import { Compass } from 'lucide-react';
import type { Category } from '../../lib/supabase';

export const CANONICAL_KNOWLEDGE_CATEGORIES = [
  'Go-to-Market Strategy',
  'Revenue Operations',
  'Sales Performance',
  'Lead Qualification',
  'Pipeline Management',
  'Sales Forecasting',
  'Customer Growth',
  'AI & Revenue Intelligence'
];

interface KnowledgeCategoryNavigationProps {
  categories: Category[];
  activeCategory: string;
  onSelectCategory: (categoryName: string) => void;
  categoryCounts: Record<string, number>;
  totalCount: number;
}

export function KnowledgeCategoryNavigation({
  categories,
  activeCategory,
  onSelectCategory,
  categoryCounts,
  totalCount
}: KnowledgeCategoryNavigationProps) {
  // Merge database categories with canonical knowledge domains
  const categoryNamesSet = new Set<string>();
  categories.forEach(c => categoryNamesSet.add(c.name));
  CANONICAL_KNOWLEDGE_CATEGORIES.forEach(name => categoryNamesSet.add(name));
  const displayCategories = Array.from(categoryNamesSet);

  return (
    <section id="knowledge-categories" className="py-12 border-b border-border/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-accent mb-2">
              <Compass size={14} />
              <span>Taxonomy & Research Domains</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">
              Explore by Knowledge Category
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-text-secondary max-w-md font-light">
            Navigate insights by subject area and commercial discipline. Select a domain to filter published intelligence.
          </p>
        </div>

        {/* Interactive Segmented Filter Strip (Zero-Pill Discipline: Button-based functional controls) */}
        <div className="flex flex-wrap gap-2">
          {/* All Topics Tab */}
          <button
            onClick={() => onSelectCategory('All')}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 border ${
              activeCategory === 'All'
                ? 'bg-accent text-white border-accent shadow-sm'
                : 'bg-bg-surface text-text-secondary hover:text-text-primary hover:border-accent/40 border-border'
            }`}
          >
            <span>All Knowledge Areas</span>
            <span className={`text-[11px] font-mono ${activeCategory === 'All' ? 'text-white/80' : 'text-text-secondary/60'}`}>
              ({totalCount})
            </span>
          </button>

          {/* Individual Category Tabs */}
          {displayCategories.map((name) => {
            const count = categoryCounts[name] || 0;
            const isActive = activeCategory === name;

            return (
              <button
                key={name}
                onClick={() => onSelectCategory(name)}
                className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 border ${
                  isActive
                    ? 'bg-accent text-white border-accent shadow-sm'
                    : 'bg-bg-surface text-text-secondary hover:text-text-primary hover:border-accent/40 border-border'
                }`}
              >
                <span>{name}</span>
                {count > 0 && (
                  <span className={`text-[11px] font-mono ${isActive ? 'text-white/80' : 'text-text-secondary/60'}`}>
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>
    </section>
  );
}
