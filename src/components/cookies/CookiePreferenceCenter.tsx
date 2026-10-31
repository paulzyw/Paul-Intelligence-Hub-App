import React, { useState, useEffect, useRef } from 'react';
import { useCookieConsent } from '../../context/CookieConsentContext';
import { 
  COOKIE_CATEGORIES_METADATA, 
  CookieCategories, 
  CookieCategory 
} from '../../types/cookies';
import { 
  X, 
  Lock, 
  Check, 
  ShieldCheck, 
  SlidersHorizontal,
  Info
} from 'lucide-react';

export const CookiePreferenceCenter: React.FC = () => {
  const { 
    isPreferencesOpen, 
    closePreferences, 
    consent, 
    updateConsent, 
    acceptAll, 
    rejectNonEssential 
  } = useCookieConsent();

  // Local draft state for individual toggles while preference center is open
  const [draftState, setDraftState] = useState<CookieCategories>({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false
  });

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Sync draft state with active consent record when opening
  useEffect(() => {
    if (isPreferencesOpen) {
      setDraftState({
        necessary: true,
        functional: Boolean(consent.functional),
        analytics: Boolean(consent.analytics),
        marketing: Boolean(consent.marketing)
      });
    }
  }, [isPreferencesOpen, consent]);

  // Focus trap and keyboard listeners (Escape key)
  useEffect(() => {
    if (!isPreferencesOpen) return;

    // Focus close button on open
    const prevActiveElement = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePreferences();
      }

      // Simple focus trap
      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      prevActiveElement?.focus();
    };
  }, [isPreferencesOpen, closePreferences]);

  if (!isPreferencesOpen) return null;

  const handleToggle = (category: CookieCategory) => {
    if (category === 'necessary') return; // Strictly necessary is locked
    setDraftState(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleSave = async () => {
    await updateConsent(draftState);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) closePreferences();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-preferences-title"
        aria-describedby="cookie-preferences-description"
        className="relative w-full max-w-2xl max-h-[90vh] bg-bg-surface border border-border rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-text-primary animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-border/80 bg-bg-surface/80">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="cookie-preferences-title" className="text-base sm:text-lg font-bold tracking-tight">
                Privacy Preference Center
              </h2>
              <p className="text-xs text-text-secondary">
                Manage your cookie & data processing preferences
              </p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closePreferences}
            aria-label="Close preferences"
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5">
          <p id="cookie-preferences-description" className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            When you visit the RevOS platform, we store and retrieve information on your browser, mostly in the form of cookies and local storage tokens. You can choose not to allow some types of non-essential technologies. Click on the different category headings below to learn more and change your preferences.
          </p>

          <div className="space-y-3.5">
            {COOKIE_CATEGORIES_METADATA.map((cat) => {
              const isEnabled = cat.isLocked ? true : draftState[cat.id];

              return (
                <div
                  key={cat.id}
                  className="p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-border bg-bg-primary/50 hover:border-border/80 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-semibold text-text-primary">
                          {cat.name}
                        </h3>
                        {cat.isLocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-accent/15 text-accent border border-accent/25">
                            <Lock className="h-2.5 w-2.5" aria-hidden="true" />
                            {cat.badge || 'Always Active'}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs sm:text-[13px] text-text-secondary leading-relaxed pt-1">
                        {cat.purpose}
                      </p>
                    </div>

                    {/* Toggle Switch */}
                    <div className="shrink-0 pt-0.5">
                      {cat.isLocked ? (
                        <div 
                          className="w-12 h-6 bg-accent/30 rounded-full flex items-center px-1 cursor-not-allowed opacity-80"
                          title="Strictly necessary technologies are always active"
                        >
                          <div className="w-4 h-4 rounded-full bg-accent ml-auto flex items-center justify-center">
                            <Check className="h-2.5 w-2.5 text-black stroke-[3]" />
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isEnabled}
                          aria-label={`Toggle ${cat.name} technologies`}
                          onClick={() => handleToggle(cat.id)}
                          className={`w-12 h-6 rounded-full transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                            isEnabled ? 'bg-accent' : 'bg-border/80 hover:bg-border'
                          }`}
                        >
                          <span
                            className={`block w-4 h-4 rounded-full bg-black transition-transform ${
                              isEnabled ? 'translate-x-7' : 'translate-x-1 bg-text-secondary'
                            }`}
                          />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Examples */}
                  <div className="mt-3 pt-3 border-t border-border/50 text-[11px] text-text-secondary">
                    <span className="font-semibold text-text-primary/90">Typical uses: </span>
                    {cat.examples.join(' • ')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Privacy Note */}
          <div className="p-3.5 rounded-xl bg-accent/5 border border-accent/15 text-xs text-text-secondary flex items-start gap-2.5">
            <Info className="h-4 w-4 text-accent shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              Your preferences are stored locally on your device for 12 months. You may withdraw or modify your consent at any time via the <strong>Cookie Settings</strong> link located in the footer.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-border/80 bg-bg-surface flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => rejectNonEssential()}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border hover:border-text-secondary/50 bg-bg-surface text-text-primary text-xs sm:text-sm font-semibold transition-all hover:bg-bg-primary active:scale-[0.98] order-2 sm:order-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Reject Non-Essential
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto order-1 sm:order-2">
            <button
              type="button"
              onClick={() => acceptAll()}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border hover:border-accent/40 bg-bg-primary text-text-primary text-xs sm:text-sm font-semibold transition-all hover:bg-bg-primary/80 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Accept All
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-accent text-black text-xs sm:text-sm font-bold shadow-md shadow-accent/20 transition-all hover:opacity-95 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
            >
              Save My Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
