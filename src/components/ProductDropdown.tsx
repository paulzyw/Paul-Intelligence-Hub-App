import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ProductDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

type ProductTabId = 'platform-overview' | 'features' | 'open-revos' | 'how-revos-works';

interface ProductItem {
  title: string;
  description: string;
  link?: string;
}

interface TabContent {
  id: ProductTabId;
  label: string;
  columns: ProductItem[][];
}

const PRODUCT_TABS: TabContent[] = [
  {
    id: 'platform-overview',
    label: 'Platform Overview',
    columns: [
      // Column 1
      [
        {
          title: 'RevOS',
          description: 'What RevOS is, how the engines work together',
          link: '/product/overview/revos',
        },
        {
          title: 'Pipeline Assessment',
          description: 'Assess opportunity health, define winning strategy',
          link: '#',
        },
      ],
      // Column 2
      [
        {
          title: 'GTMOS',
          description: 'Build a more structured go-to-market strategy',
          link: '#',
        },
      ],
      // Column 3
      [
        {
          title: 'Lead Qualification',
          description: 'Qualify leads and opportunities for further sales investment',
          link: '#',
        },
      ],
    ],
  },
  {
    id: 'features',
    label: 'Features',
    columns: [
      // Column 1
      [
        {
          title: 'Structured Methodologies',
          description: 'Structure complex revenue challenges',
          link: '#',
        },
        {
          title: 'Multidimensional Assessment',
          description: 'Make assessment results easier to understand',
          link: '#',
        },
      ],
      // Column 2
      [
        {
          title: 'Evidence Management',
          description: 'Organize the information behind the decision',
          link: '#',
        },
        {
          title: 'Risk & Gap Identification',
          description: 'Surface potential blockers and unanswered questions',
          link: '#',
        },
      ],
      // Column 3
      [
        {
          title: 'AI Reasoning',
          description: 'Interpret context and evidence through structured workflows',
          link: '#',
        },
        {
          title: 'Actionable Recommendations',
          description: 'Translate findings into practical next steps',
          link: '#',
        },
      ],
    ],
  },
  {
    id: 'open-revos',
    label: 'Open RevOS',
    columns: [
      // Column 1
      [
        {
          title: 'RevOS Dashboard',
          description: 'Open the platform overview',
          link: '/product/revos',
        },
        {
          title: 'Pipeline Assessment',
          description: 'Open pipeline and deal assessment',
          link: '/product/revos/pipeline',
        },
      ],
      // Column 2
      [
        {
          title: 'GTMOS',
          description: 'Open go-to-market strategy',
          link: '/product/revos/gtmos',
        },
      ],
      // Column 3
      [
        {
          title: 'Lead Qualification',
          description: 'Open lead and opportunity qualification',
          link: '/product/revos/leads',
        },
      ],
    ],
  },
  {
    id: 'how-revos-works',
    label: 'How RevOS Works',
    columns: [
      // Column 1
      [
        {
          title: 'RevOS Workflow',
          description: 'Business context, Evidence, Assessment, Decide next',
          link: '#',
        },
      ],
      // Column 2
      [],
      // Column 3
      [],
    ],
  },
];

export const ProductDropdown: React.FC<ProductDropdownProps> = ({ isOpen, onClose }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<ProductTabId>('platform-overview');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.classList.add('product-dropdown-open');
    } else {
      document.body.classList.remove('product-dropdown-open');
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('product-dropdown-open');
    };
  }, [isOpen, onClose]);

  const lineStyle: React.CSSProperties = {
    borderColor: 'color-mix(in srgb, var(--text-hero-primary) 15%, transparent)',
  };

  const currentTabContent = PRODUCT_TABS.find(t => t.id === activeTab) || PRODUCT_TABS[0];

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
              .product-nav-item .product-nav-subtitle {
                color: color-mix(in srgb, var(--text-hero-primary) 70%, transparent);
                transition: color 0.15s ease-in-out;
              }
              .product-nav-item:hover .product-nav-subtitle,
              .product-nav-item:active .product-nav-subtitle {
                color: color-mix(in srgb, var(--text-hero-primary) 100%, transparent);
              }
              .product-nav-item .product-nav-desc {
                color: color-mix(in srgb, var(--text-hero-primary) 35%, transparent);
                transition: color 0.15s ease-in-out;
              }
              .product-nav-item:hover .product-nav-desc,
              .product-nav-item:active .product-nav-desc {
                color: color-mix(in srgb, var(--text-hero-primary) 65%, transparent);
              }
              .product-dropdown-scroll {
                scrollbar-width: thin;
                scrollbar-color: color-mix(in srgb, var(--accent) 30%, transparent) transparent;
              }
              .product-dropdown-scroll::-webkit-scrollbar {
                width: 4px;
              }
              .product-dropdown-scroll::-webkit-scrollbar-track {
                background: transparent;
              }
              .product-dropdown-scroll::-webkit-scrollbar-thumb {
                background: color-mix(in srgb, var(--accent) 30%, transparent);
                border-radius: 9999px;
              }
              .product-dropdown-scroll::-webkit-scrollbar-thumb:hover {
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
              className="relative w-full max-w-5xl rounded-2xl sm:rounded-[24px] border-2 border-accent bg-bg-hero-surface p-4 sm:p-6 md:p-8 lg:px-10 lg:py-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-2xl pointer-events-auto max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain product-dropdown-scroll"
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
                aria-label="Close Product menu"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Four Horizontal Category Tabs */}
              <div className="flex items-center gap-2.5 sm:gap-4 w-full mb-6 sm:mb-8 overflow-x-auto no-scrollbar py-1">
                {PRODUCT_TABS.map((tab) => {
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
                            className="product-nav-item group block p-1 -m-1 sm:p-0 sm:m-0 rounded-lg active:bg-white/5 transition-all cursor-pointer"
                          >
                            <h4 className="product-nav-subtitle text-sm sm:text-base lg:text-lg font-medium font-sans leading-tight">
                              {item.title}
                            </h4>
                            <p className="product-nav-desc text-xs sm:text-xs md:text-xs lg:text-sm font-sans mt-1 leading-normal">
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
