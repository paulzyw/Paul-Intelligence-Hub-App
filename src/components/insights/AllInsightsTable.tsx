import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, ChevronLeft, ChevronRight, FileText, Calendar, Tag, Hash, User } from 'lucide-react';
import type { Post } from '../../lib/supabase';

interface AllInsightsTableProps {
  posts: Post[];
  activeCategory?: string;
  onClearCategory?: () => void;
}

export function AllInsightsTable({ posts, activeCategory = 'All', onClearCategory }: AllInsightsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter posts by keywords across title, summary, category, author, and active category
  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    
    return posts.filter((post) => {
      const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
      if (!matchesCategory) return false;

      if (!query) return true;
      const title = (post.title || '').toLowerCase();
      const summary = (post.summary || '').toLowerCase();
      const category = (post.category || '').toLowerCase();
      const author = (post.author || post.author_id || 'Paul Wang').toLowerCase();
      return title.includes(query) || summary.includes(query) || category.includes(query) || author.includes(query);
    });
  }, [posts, searchQuery, activeCategory]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredPosts.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedPosts = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    return filteredPosts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPosts, validCurrentPage, itemsPerPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const tableEl = document.getElementById('all-insights-table');
    if (tableEl) {
      tableEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <section id="all-insights-table" className="py-16 border-b border-border/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header with Title on Left and Search Filter on Top-Right */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-accent mb-1.5">
              <FileText size={14} />
              <span>Full Archive Directory</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              All Insight Articles
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary mt-1 font-light">
              Complete index of revenue operations research, frameworks, and strategic methodologies.
            </p>
          </div>

          {/* Search Filter on Top-Right */}
          <div className="relative w-full sm:w-80 shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-secondary/60">
              <Search size={15} />
            </div>
            <input
              type="text"
              placeholder="Search by keywords..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="block w-full pl-10 pr-9 py-2.5 border border-border rounded-lg bg-bg-surface text-text-primary placeholder-text-secondary/50 text-xs sm:text-sm focus:outline-none focus:border-accent transition-colors shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Indicator */}
        {(activeCategory !== 'All' || searchQuery) && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 mb-6 rounded-lg bg-bg-surface border border-border text-xs text-text-secondary">
            <div className="flex flex-wrap items-center gap-2">
              <span>Active filters:</span>
              {activeCategory !== 'All' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-accent/10 text-accent font-medium">
                  <span>Category: {activeCategory}</span>
                  {onClearCategory && (
                    <button
                      type="button"
                      onClick={onClearCategory}
                      className="hover:text-text-primary cursor-pointer"
                      title="Clear category filter"
                    >
                      <X size={12} />
                    </button>
                  )}
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-accent/10 text-accent font-medium">
                  <span>Search: "{searchQuery}"</span>
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="hover:text-text-primary cursor-pointer"
                    title="Clear search"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              <span className="text-text-secondary">
                ({filteredPosts.length} {filteredPosts.length === 1 ? 'match' : 'matches'})
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                clearSearch();
                if (onClearCategory) onClearCategory();
              }}
              className="text-xs text-text-primary hover:text-accent font-medium underline cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* Table Container */}
        <div className="rounded-xl border border-border bg-bg-surface overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              {/* Table Head: 1st SN, 2nd Knowledge category, 3rd published date, 4th Article Title */}
              <thead>
                <tr className="border-b border-border bg-bg-primary/60 text-text-secondary text-[11px] font-semibold uppercase tracking-wider">
                  <th scope="col" className="w-14 sm:w-16 px-4 py-3.5 text-center">
                    <span className="inline-flex items-center gap-1 justify-center">
                      <Hash size={12} className="opacity-70" />
                      <span>SN</span>
                    </span>
                  </th>
                  <th scope="col" className="w-48 sm:w-60 px-4 sm:px-6 py-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <Tag size={12} className="opacity-70" />
                      <span>Knowledge Category</span>
                    </span>
                  </th>
                  <th scope="col" className="w-36 sm:w-44 px-4 sm:px-6 py-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={12} className="opacity-70" />
                      <span>Published Date</span>
                    </span>
                  </th>
                  <th scope="col" className="w-32 sm:w-40 px-4 sm:px-6 py-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <User size={12} className="opacity-70" />
                      <span>Author</span>
                    </span>
                  </th>
                  <th scope="col" className="px-4 sm:px-6 py-3.5 min-w-[260px]">
                    <span className="inline-flex items-center gap-1.5">
                      <FileText size={12} className="opacity-70" />
                      <span>Article Title</span>
                    </span>
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-border/60">
                {paginatedPosts.length > 0 ? (
                  paginatedPosts.map((article, idx) => {
                    const serialNumber = (validCurrentPage - 1) * itemsPerPage + idx + 1;
                    return (
                      <tr
                        key={article.id}
                        className="group hover:bg-bg-primary/40 transition-colors"
                      >
                        {/* 1st column: SN (e.g. 1, 2, 3...) */}
                        <td className="px-4 py-3.5 text-center font-mono text-xs text-text-secondary group-hover:text-text-primary font-medium">
                          {serialNumber}
                        </td>

                        {/* 2nd column: Knowledge category */}
                        <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                          <span className="inline-block font-medium text-accent hover:underline">
                            {article.category || 'General'}
                          </span>
                        </td>

                        {/* 3rd column: Published date */}
                        <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap font-mono text-xs text-text-secondary">
                          {formatDate(article.published_at || article.created_at)}
                        </td>

                        {/* 4th column: Author */}
                        <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap text-text-primary font-medium text-xs">
                          {article.author || article.author_id || 'Paul Wang'}
                        </td>

                        {/* 5th column: Article Title (Clickable link to view article) */}
                        <td className="px-4 sm:px-6 py-3.5">
                          <div className="flex flex-col">
                            <Link
                              to={`/insights/${article.slug}`}
                              className="font-semibold text-text-primary group-hover:text-accent hover:underline transition-colors line-clamp-1 sm:line-clamp-2"
                            >
                              {article.title}
                            </Link>
                            {article.summary && (
                              <p className="text-[11px] sm:text-xs text-text-secondary line-clamp-1 mt-0.5 font-light">
                                {article.summary}
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-text-secondary">
                      <div className="max-w-sm mx-auto space-y-2">
                        <p className="font-semibold text-text-primary text-sm">No insight articles found</p>
                        <p className="text-xs font-light">
                          {searchQuery
                            ? `No results matched your search for "${searchQuery}".`
                            : 'There are currently no articles in this archive.'}
                        </p>
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={clearSearch}
                            className="mt-3 inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-accent text-white hover:opacity-90 transition-opacity cursor-pointer"
                          >
                            Clear Keyword Search
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer: Results count & 10-items-per-page Pagination */}
          <div className="px-4 sm:px-6 py-3.5 border-t border-border bg-bg-primary/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-secondary">
            <div>
              {filteredPosts.length > 0 ? (
                <span>
                  Showing{' '}
                  <span className="font-medium text-text-primary">
                    {(validCurrentPage - 1) * itemsPerPage + 1}
                  </span>
                  –
                  <span className="font-medium text-text-primary">
                    {Math.min(validCurrentPage * itemsPerPage, filteredPosts.length)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium text-text-primary">
                    {filteredPosts.length}
                  </span>{' '}
                  {filteredPosts.length === 1 ? 'article' : 'articles'}
                  {searchQuery && ' (filtered)'}
                </span>
              ) : (
                <span>0 articles</span>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePageChange(validCurrentPage - 1)}
                  disabled={validCurrentPage <= 1}
                  aria-label="Previous Page"
                  className="p-1.5 rounded-md border border-border bg-bg-surface text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    // Show compact window around current page if many pages exist
                    if (
                      totalPages > 7 &&
                      pageNum !== 1 &&
                      pageNum !== totalPages &&
                      Math.abs(pageNum - validCurrentPage) > 2
                    ) {
                      if (Math.abs(pageNum - validCurrentPage) === 3) {
                        return (
                          <span key={pageNum} className="px-1 text-text-secondary">
                            …
                          </span>
                        );
                      }
                      return null;
                    }

                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-7 h-7 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer border ${
                          validCurrentPage === pageNum
                            ? 'bg-accent text-white border-accent shadow-xs'
                            : 'bg-bg-surface text-text-secondary hover:text-text-primary border-border'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => handlePageChange(validCurrentPage + 1)}
                  disabled={validCurrentPage >= totalPages}
                  aria-label="Next Page"
                  className="p-1.5 rounded-md border border-border bg-bg-surface text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
