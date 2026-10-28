import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface SolutionsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

type SolutionsTabId = 'business-challenge' | 'revenue-lifecycle' | 'sales-decisions';

interface SolutionItem {
  title: string;
  description: string;
  link?: string;
}

interface TabContent {
  id: SolutionsTabId;
  label: string;
  columns: SolutionItem[][];
}

const SOLUTIONS_TABS: TabContent[] = [
  {
    id: 'business-challenge',
    label: 'Business Challenge',
    columns: [
      // Column 1
      [
        {
          title: 'Win More Deals',
          description: 'Qualification, deal risks, and winning actions',
          link: '#',
        },
        {
          title: 'Improve Forecast Confidence',
          description: 'Evidence-based opportunity review',
          link: '#',
        },
      ],
      // Column 2
      [
        {
          title: 'Accelerate Sales',
          description: 'Buying-process gaps and deal blockers',
          link: '#',
        },
        {
          title: 'Build Profitable Growth',
          description: 'GTM strategy, competitive positioning, and commercial value',
          link: '#',
        },
      ],
      // Column 3
      [
        {
          title: 'Prioritize Opportunities',
          description: 'Fit, readiness, and investment decisions',
          link: '#',
        },
      ],
    ],
  },
  {
    id: 'revenue-lifecycle',
    label: 'Revenue Lifecycle',
    columns: [
      // Column 1
      [
        {
          title: 'Go-to-Market Strategy',
          description: 'Value proposition, ICP, Messaging, Campaigns',
          link: '#',
        },
      ],
      // Column 2
      [
        {
          title: 'Lead Qualification',
          description: 'Lead-> MQL->SQL->Opportunity',
          link: '#',
        },
      ],
      // Column 3
      [
        {
          title: 'Opportunity Assessment',
          description: 'Assess risks, mitigation, actions to improve chance to win',
          link: '#',
        },
      ],
    ],
  },
  {
    id: 'sales-decisions',
    label: 'Sales Decisions',
    columns: [
      // Column 1
      [
        {
          title: 'Target Segments',
          description: 'Which markets and customer segments should we target?',
          link: '#',
        },
        {
          title: 'Drive Deal Progression',
          description: 'What is preventing this deal from progressing?',
          link: '#',
        },
      ],
      // Column 2
      [
        {
          title: 'Qualify Lead',
          description: 'Is this lead qualified for sales engagement?',
          link: '#',
        },
        {
          title: 'Improve Winning Possibility',
          description: 'What should we do next to improve our chances of winning?',
          link: '#',
        },
      ],
      // Column 3
      [
        {
          title: 'Invest Further',
          description: 'Does this opportunity warrant further investment?',
          link: '#',
        },
      ],
    ],
  },
];

export const SolutionsDropdown: React.FC<SolutionsDropdownProps> = ({ isOpen, onClose }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<SolutionsTabId>('business-challenge');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.classList.add('solutions-dropdown-open');
    } else {
      document.body.classList.remove('solutions-dropdown-open');
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('solutions-dropdown-open');
    };
  }, [isOpen, onClose]);

  const lineStyle: React.CSSProperties = {
    borderColor: 'color-mix(in srgb, var(--text-hero-primary) 15%, transparent)',
  };

  const currentTabContent = SOLUTIONS_TABS.find(t => t.id === activeTab) || SOLUTIONS_TABS[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Background backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 top-16 bg-black/40 backdrop-blur-sm z-40 pointer-events-auto"
            aria-hidden="true"
          />

          <div className="absolute top-full left-0 right-0 w-full flex justify-center px-3 sm:px-6 lg:px-8 pt-2 pb-4 sm:pb-6 z-50 pointer-events-none">
            <style>{`
              .solutions-nav-item .solutions-nav-subtitle {
                color: color-mix(in srgb, var(--text-hero-primary) 70%, transparent);
                transition: color 0.15s ease-in-out;
              }
              .solutions-nav-item:hover .solutions-nav-subtitle,
              .solutions-nav-item:active .solutions-nav-subtitle {
                color: color-mix(in srgb, var(--text-hero-primary) 100%, transparent);
              }
              .solutions-nav-item .solutions-nav-desc {
                color: color-mix(in srgb, var(--text-hero-primary) 35%, transparent);
                transition: color 0.15s ease-in-out;
              }
              .solutions-nav-item:hover .solutions-nav-desc,
              .solutions-nav-item:active .solutions-nav-desc {
                color: color-mix(in srgb, var(--text-hero-primary) 65%, transparent);
              }
              .solutions-dropdown-scroll {
                scrollbar-width: thin;
                scrollbar-color: color-mix(in srgb, var(--accent) 30%, transparent) transparent;
              }
              .solutions-dropdown-scroll::-webkit-scrollbar {
                width: 4px;
              }
              .solutions-dropdown-scroll::-webkit-scrollbar-track {
                background: transparent;
              }
              .solutions-dropdown-scroll::-webkit-scrollbar-thumb {
                background: color-mix(in srgb, var(--accent) 30%, transparent);
                border-radius: 9999px;
              }
              .solutions-dropdown-scroll::-webkit-scrollbar-thumb:hover {
                background: var(--accent);
              }
              .no-scrollbar::-webkit-scrollbar {
                display: none;
              }
              .no-scrollbar {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
            `}</style>
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-5xl rounded-2xl sm:rounded-[24px] border-2 border-accent bg-bg-hero-surface p-4 sm:p-6 md:p-8 lg:px-10 lg:py-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-2xl pointer-events-auto max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain solutions-dropdown-scroll"
              style={{
                backgroundColor: 'var(--bg-hero-surface)',
                borderColor: 'var(--accent)',
              }}
            >
              {/* Mobile/Tablet Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="md:hidden absolute top-3 right-3 p-1.5 rounded-full text-text-hero-primary/50 hover:text-accent hover:bg-white/5 active:bg-white/10 transition-colors z-10 cursor-pointer"
                aria-label="Close Solutions menu"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Three Horizontal Category Tabs */}
              <div className="flex items-center gap-2.5 sm:gap-4 w-full mb-6 sm:mb-8 overflow-x-auto no-scrollbar py-1">
                {SOLUTIONS_TABS.map((tab) => {
                  const isActive = tab.id === activeTab;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={
                        isActive
                          ? "flex-1 min-w-fit px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-accent text-white font-medium text-xs sm:text-sm lg:text-base text-left transition-all duration-300 shadow-sm cursor-pointer whitespace-nowrap"
                          : "flex-shrink-0 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full border border-accent text-accent font-medium text-xs sm:text-sm lg:text-base text-center transition-all duration-300 hover:bg-accent/10 active:bg-accent/20 cursor-pointer whitespace-nowrap"
                      }
                      style={
                        isActive
                          ? { backgroundColor: 'var(--accent)', color: '#ffffff' }
                          : { borderColor: 'var(--accent)', color: 'var(--accent)' }
                      }
                      aria-selected={isActive}
                      role="tab"
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content: 3 Columns Layout */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 md:gap-7 lg:gap-10 min-h-[140px]"
                >
                  {currentTabContent.columns.map((columnItems, colIdx) => (
                    <div key={colIdx} className="flex flex-col space-y-4 sm:space-y-5">
                      {columnItems.map((item, itemIdx) => (
                        <div key={itemIdx} className="space-y-2">
                          <Link
                            to={item.link || '#'}
                            onClick={(e) => {
                              if (!item.link || item.link === '#') {
                                e.preventDefault();
                              } else {
                                onClose();
                              }
                            }}
                            className="solutions-nav-item group block p-1 -m-1 sm:p-0 sm:m-0 rounded-lg active:bg-white/5 transition-all cursor-pointer"
                          >
                            <h4 className="solutions-nav-subtitle text-sm sm:text-base lg:text-lg font-medium font-sans leading-tight">
                              {item.title}
                            </h4>
                            <p className="solutions-nav-desc text-xs sm:text-xs md:text-xs lg:text-sm font-sans mt-1 leading-normal">
                              {item.description}
                            </p>
                          </Link>
                          {/* Bottom line separator */}
                          <div className="pt-2 border-b" style={lineStyle} />
                        </div>
                      ))}
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
