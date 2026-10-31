import React, { useEffect, useRef } from 'react';
import { useCookieConsent } from '../../context/CookieConsentContext';
import { ShieldCheck, SlidersHorizontal, Check, X } from 'lucide-react';

export const CookieConsentBanner: React.FC = () => {
  const { isBannerOpen, acceptAll, rejectNonEssential, openPreferences } = useCookieConsent();
  const bannerRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management: when banner appears, ensure screen reader announcement
  useEffect(() => {
    if (isBannerOpen && firstButtonRef.current) {
      // Gentle accessibility focus without jumping scroll position
      firstButtonRef.current.focus({ preventScroll: true });
    }
  }, [isBannerOpen]);

  if (!isBannerOpen) return null;

  return (
    <div
      ref={bannerRef}
      role="region"
      aria-label="Cookie consent banner"
      aria-describedby="cookie-banner-description"
      className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 pointer-events-none transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto pointer-events-auto">
        <div className="bg-bg-surface/95 backdrop-blur-md border border-border rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-7 shadow-2xl shadow-black/30">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* Content Section */}
            <div className="flex items-start gap-4 max-w-4xl">
              <div className="hidden sm:flex h-11 w-11 shrink-0 rounded-2xl bg-accent/10 border border-accent/20 items-center justify-center text-accent">
                <ShieldCheck className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="sm:hidden text-accent">
                    <ShieldCheck className="h-5 w-5 inline mr-1.5" aria-hidden="true" />
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
                    Your Privacy Matters
                  </h2>
                </div>
                <p id="cookie-banner-description" className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                  RevOS uses essential technologies to keep the platform secure and functional. With your permission, we may also use functional, analytics, and marketing technologies to improve your experience and understand how visitors use our platform.
                </p>
              </div>
            </div>

            {/* Actions Section */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3 shrink-0">
              {/* Customize Preferences */}
              <button
                type="button"
                onClick={openPreferences}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border hover:border-accent/40 bg-bg-primary/60 text-text-primary text-xs sm:text-sm font-semibold transition-all hover:bg-bg-primary active:scale-[0.98] flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                <span>Customize Preferences</span>
              </button>

              {/* Reject Non-Essential */}
              <button
                type="button"
                onClick={() => rejectNonEssential()}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border hover:border-text-secondary/50 bg-bg-surface text-text-primary text-xs sm:text-sm font-semibold transition-all hover:bg-bg-primary active:scale-[0.98] flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <X className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
                <span>Reject Non-Essential</span>
              </button>

              {/* Accept All */}
              <button
                ref={firstButtonRef}
                type="button"
                onClick={() => acceptAll()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-accent text-black text-xs sm:text-sm font-bold shadow-md shadow-accent/20 transition-all hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
              >
                <Check className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
                <span>Accept All</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
