import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface AboutDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutDropdown: React.FC<AboutDropdownProps> = ({ isOpen, onClose }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.classList.add('about-dropdown-open');
    } else {
      document.body.classList.remove('about-dropdown-open');
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('about-dropdown-open');
    };
  }, [isOpen, onClose]);

  const titleStyle: React.CSSProperties = {
    color: 'var(--accent)',
  };

  const lineStyle: React.CSSProperties = {
    borderColor: 'color-mix(in srgb, var(--text-hero-primary) 15%, transparent)',
  };

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
              .about-nav-item .about-nav-subtitle {
                color: color-mix(in srgb, var(--text-hero-primary) 60%, transparent);
                transition: color 0.15s ease-in-out;
              }
              .about-nav-item:hover .about-nav-subtitle,
              .about-nav-item:active .about-nav-subtitle {
                color: color-mix(in srgb, var(--text-hero-primary) 100%, transparent);
              }
              .about-nav-item .about-nav-desc {
                color: color-mix(in srgb, var(--text-hero-primary) 15%, transparent);
                transition: color 0.15s ease-in-out;
              }
              .about-nav-item:hover .about-nav-desc,
              .about-nav-item:active .about-nav-desc {
                color: color-mix(in srgb, var(--text-hero-primary) 50%, transparent);
              }
              .about-dropdown-scroll {
                scrollbar-width: thin;
                scrollbar-color: color-mix(in srgb, var(--accent) 30%, transparent) transparent;
              }
              .about-dropdown-scroll::-webkit-scrollbar {
                width: 4px;
              }
              .about-dropdown-scroll::-webkit-scrollbar-track {
                background: transparent;
              }
              .about-dropdown-scroll::-webkit-scrollbar-thumb {
                background: color-mix(in srgb, var(--accent) 30%, transparent);
                border-radius: 9999px;
              }
              .about-dropdown-scroll::-webkit-scrollbar-thumb:hover {
                background: var(--accent);
              }
            `}</style>
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-5xl rounded-2xl sm:rounded-[24px] border-2 border-accent bg-bg-hero-surface p-4 sm:p-6 md:p-7 lg:px-10 lg:py-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-2xl pointer-events-auto max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain about-dropdown-scroll"
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
                aria-label="Close About menu"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 md:gap-7 lg:gap-10">
                
                {/* ========================================================= */}
                {/* COLUMN 1: About RevOS */}
                {/* ========================================================= */}
                <div className="flex flex-col space-y-2 sm:space-y-2.5">
                  <div className="pb-1.5 border-b pr-8 md:pr-0" style={lineStyle}>
                    <h3 className="text-lg sm:text-xl md:text-xl lg:text-2xl font-medium tracking-normal font-sans leading-tight" style={titleStyle}>
                      About RevOS
                    </h3>
                  </div>

                  <div className="space-y-2.5 sm:space-y-3 pt-0.5">
                    <Link
                      to="/product/feature"
                      onClick={onClose}
                      className="about-nav-item group block p-1 -m-1 sm:p-0 sm:m-0 rounded-lg active:bg-white/5 transition-all"
                    >
                      <h4 className="about-nav-subtitle text-sm sm:text-base lg:text-lg font-medium font-sans leading-tight">
                        About RevOS
                      </h4>
                      <p className="about-nav-desc text-xs sm:text-xs md:text-xs lg:text-sm font-sans mt-0.5 leading-snug">
                        Mission, vision, philosophy, platform, and principles.
                      </p>
                    </Link>
                  </div>
                </div>

                {/* ========================================================= */}
                {/* COLUMN 2: About the Founder */}
                {/* ========================================================= */}
                <div className="flex flex-col space-y-2 sm:space-y-2.5">
                  <div className="pb-1.5 border-b" style={lineStyle}>
                    <h3 className="text-lg sm:text-xl md:text-xl lg:text-2xl font-medium tracking-normal font-sans leading-tight" style={titleStyle}>
                      About the Founder
                    </h3>
                  </div>

                  <div className="space-y-2.5 sm:space-y-3 pt-0.5">
                    {/* Item 1: About Founder */}
                    <Link
                      to="/about"
                      onClick={onClose}
                      className="about-nav-item group block p-1 -m-1 sm:p-0 sm:m-0 rounded-lg active:bg-white/5 transition-all"
                    >
                      <h4 className="about-nav-subtitle text-sm sm:text-base lg:text-lg font-medium font-sans leading-tight">
                        About Founder
                      </h4>
                      <p className="about-nav-desc text-xs sm:text-xs md:text-xs lg:text-sm font-sans mt-0.5 leading-snug">
                        Why the RevOS is created and the thinking behind the RevOS.
                      </p>
                    </Link>

                    {/* Item 2: Founder Profile */}
                    <Link
                      to="/founder"
                      onClick={onClose}
                      className="about-nav-item group block p-1 -m-1 sm:p-0 sm:m-0 rounded-lg active:bg-white/5 transition-all"
                    >
                      <h4 className="about-nav-subtitle text-sm sm:text-base lg:text-lg font-medium font-sans leading-tight">
                        Founder Profile
                      </h4>
                      <p className="about-nav-desc text-xs sm:text-xs md:text-xs lg:text-sm font-sans mt-0.5 leading-snug">
                        Professional history, expertise, and career achievements.
                      </p>
                    </Link>

                    {/* Item 3: Business Impact */}
                    <Link
                      to="/impact"
                      onClick={onClose}
                      className="about-nav-item group block p-1 -m-1 sm:p-0 sm:m-0 rounded-lg active:bg-white/5 transition-all"
                    >
                      <h4 className="about-nav-subtitle text-sm sm:text-base lg:text-lg font-medium font-sans leading-tight">
                        Business Impact
                      </h4>
                      <p className="about-nav-desc text-xs sm:text-xs md:text-xs lg:text-sm font-sans mt-0.5 leading-snug">
                        Evidence of professional impact and business outcomes.
                      </p>
                    </Link>

                    {/* Item 4: Insights */}
                    <Link
                      to="/insights"
                      onClick={onClose}
                      className="about-nav-item group block p-1 -m-1 sm:p-0 sm:m-0 rounded-lg active:bg-white/5 transition-all"
                    >
                      <h4 className="about-nav-subtitle text-sm sm:text-base lg:text-lg font-medium font-sans leading-tight">
                        Insights
                      </h4>
                      <p className="about-nav-desc text-xs sm:text-xs md:text-xs lg:text-sm font-sans mt-0.5 leading-snug">
                        Practical perspectives on revenue growth.
                      </p>
                    </Link>

                    {/* Item 5: Research */}
                    <Link
                      to="/research"
                      onClick={onClose}
                      className="about-nav-item group block p-1 -m-1 sm:p-0 sm:m-0 rounded-lg active:bg-white/5 transition-all"
                    >
                      <h4 className="about-nav-subtitle text-sm sm:text-base lg:text-lg font-medium font-sans leading-tight">
                        Research
                      </h4>
                      <p className="about-nav-desc text-xs sm:text-xs md:text-xs lg:text-sm font-sans mt-0.5 leading-snug">
                        Evidence-based research shaping revenue growth.
                      </p>
                    </Link>
                  </div>
                </div>

                {/* ========================================================= */}
                {/* COLUMN 3: Contact */}
                {/* ========================================================= */}
                <div className="flex flex-col space-y-2 sm:space-y-2.5">
                  <div className="pb-1.5 border-b" style={lineStyle}>
                    <h3 className="text-lg sm:text-xl md:text-xl lg:text-2xl font-medium tracking-normal font-sans leading-tight" style={titleStyle}>
                      Contact
                    </h3>
                  </div>

                  <div className="space-y-2.5 sm:space-y-3 pt-0.5">
                    <Link
                      to="/contact"
                      onClick={onClose}
                      className="about-nav-item group block p-1 -m-1 sm:p-0 sm:m-0 rounded-lg active:bg-white/5 transition-all"
                    >
                      <h4 className="about-nav-subtitle text-sm sm:text-base lg:text-lg font-medium font-sans leading-tight">
                        Contact
                      </h4>
                      <p className="about-nav-desc text-xs sm:text-xs md:text-xs lg:text-sm font-sans mt-0.5 leading-snug">
                        Connect with RevOS to explore collaboration opportunities.
                      </p>
                    </Link>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
