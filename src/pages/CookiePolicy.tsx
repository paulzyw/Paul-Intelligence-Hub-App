import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Cookie, 
  ShieldCheck, 
  SlidersHorizontal, 
  Lock, 
  Layers, 
  BarChart3, 
  Target, 
  CheckCircle2, 
  ExternalLink,
  ArrowRight,
  Info,
  Calendar
} from 'lucide-react';
import { useCookieConsent } from '../context/CookieConsentContext';
import { COOKIE_CATEGORIES_METADATA } from '../types/cookies';

export function CookiePolicy() {
  const { openPreferences, consent, status } = useCookieConsent();

  // SEO & Document Title
  useEffect(() => {
    document.title = 'Cookie Policy | RevOS';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        'Learn how RevOS uses cookies and similar technologies, why they are used, how long they remain stored, and how to manage your privacy preferences.'
      );
    }
  }, []);

  const LAST_UPDATED = 'October 30, 2026';

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary transition-colors duration-300">
      
      {/* SECTION 1: HERO & INTRODUCTION */}
      <section className="border-b border-border bg-bg-surface/50 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-wider mb-6">
            <Cookie className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Privacy & Transparency</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-text-primary mb-6 leading-tight">
            How RevOS Uses Cookies and Similar Technologies
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-text-secondary max-w-3xl leading-relaxed mb-6">
            This policy explains how RevOS uses cookies and similar technologies when you visit our website or use our platform, why these technologies are used, and how you can manage your preferences.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-text-secondary pt-2 border-t border-border/60">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-accent" aria-hidden="true" />
              <span>Last updated: <strong>{LAST_UPDATED}</strong></span>
            </div>
            <span className="hidden sm:inline text-border">•</span>
            <div>Policy Version: <strong>1.0</strong></div>
            <span className="hidden sm:inline text-border">•</span>
            <Link to="/terms-of-service" className="text-accent hover:underline font-semibold">
              Terms of Service
            </Link>
            <span className="hidden sm:inline text-border">•</span>
            <Link to="/privacy-policy" className="text-accent hover:underline font-semibold">
              Privacy Policy
            </Link>
            <span className="hidden sm:inline text-border">•</span>
            <button
              type="button"
              onClick={openPreferences}
              className="text-accent hover:underline font-semibold flex items-center gap-1"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Manage Preferences</span>
            </button>
          </div>
        </div>
      </section>

      {/* MAIN EDITORIAL CONTENT */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">

        {/* SECTION 2: WHAT ARE COOKIES AND SIMILAR TECHNOLOGIES? */}
        <section aria-labelledby="what-are-cookies-title" className="space-y-4">
          <h2 id="what-are-cookies-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            1. What Are Cookies and Similar Technologies?
          </h2>
          <div className="text-sm sm:text-base text-text-secondary leading-relaxed space-y-4">
            <p>
              Cookies are small data files placed on your computer or mobile device when you visit a website. Websites use cookies to make interactions faster and more secure, remember user preferences, and provide analytical insights into platform performance.
            </p>
            <p>
              In addition to traditional HTTP cookies, modern web applications utilize <strong>similar browser storage technologies</strong>:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-text-secondary">
              <li>
                <strong className="text-text-primary">Web Storage (localStorage):</strong> Allows data to be stored securely directly within your browser with no expiration date until explicitly cleared by you or the application. RevOS uses localStorage to store client-side theme settings, workspace state drafts, and authentication session tokens.
              </li>
              <li>
                <strong className="text-text-primary">Session Storage (sessionStorage):</strong> Similar to localStorage, but data is automatically erased as soon as you close your browser tab or window. RevOS uses sessionStorage for temporary session permissions.
              </li>
              <li>
                <strong className="text-text-primary">HTTP / First-Party Cookies:</strong> Small key-value pairs exchanged between your browser and the web host.
              </li>
            </ul>
            <p>
              Under applicable European (GDPR / ePrivacy) and international privacy frameworks, non-essential browser storage mechanisms (such as localStorage entries used for analytics or tracking) are subject to the same strict consent standards as traditional tracking cookies. RevOS applies unified privacy standards across all storage mechanisms.
            </p>
          </div>
        </section>

        <hr className="border-border/60" />

        {/* SECTION 3: WHY DOES REVOS USE THEM? */}
        <section aria-labelledby="why-revos-uses-title" className="space-y-4">
          <h2 id="why-revos-uses-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            2. Why Does RevOS Use Them?
          </h2>
          <div className="text-sm sm:text-base text-text-secondary leading-relaxed space-y-4">
            <p>
              RevOS only deploys storage technologies that serve legitimate, verified platform operations. Specifically, we utilize browser storage for the following actual purposes:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-5 rounded-2xl border border-border bg-bg-surface space-y-2">
                <div className="flex items-center gap-2 text-accent font-semibold text-sm">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  <span>Platform Security & Authentication</span>
                </div>
                <p className="text-xs sm:text-sm text-text-secondary">
                  Maintaining your authenticated commercial session securely across pages, verifying user identity, and protecting against unauthorized access.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-border bg-bg-surface space-y-2">
                <div className="flex items-center gap-2 text-accent font-semibold text-sm">
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                  <span>Visitor Preferences & Interface State</span>
                </div>
                <p className="text-xs sm:text-sm text-text-secondary">
                  Preserving your visual appearance choices (dark/light theme) and saving in-progress workflow drafts within the RevOS intelligence modules.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-border bg-bg-surface space-y-2">
                <div className="flex items-center gap-2 text-accent font-semibold text-sm">
                  <Lock className="h-4 w-4" aria-hidden="true" />
                  <span>Privacy Decision Persistence</span>
                </div>
                <p className="text-xs sm:text-sm text-text-secondary">
                  Remembering your cookie and tracking consent decisions across visits so that we do not ask you repeatedly every time you navigate.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-border bg-bg-surface space-y-2">
                <div className="flex items-center gap-2 text-accent font-semibold text-sm">
                  <BarChart3 className="h-4 w-4" aria-hidden="true" />
                  <span>Performance Telemetry (With Consent)</span>
                </div>
                <p className="text-xs sm:text-sm text-text-secondary">
                  Collecting first-party page visit telemetry through secure edge functions to identify application latency and improve go-to-market tools.
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-text-secondary italic">
              <strong>Notice on Advertising:</strong> RevOS does not host third-party advertising networks, does not engage in behavioral retargeting, and does not sell or share personal information with data brokers.
            </p>
          </div>
        </section>

        <hr className="border-border/60" />

        {/* SECTION 4: CATEGORIES OF TECHNOLOGIES */}
        <section aria-labelledby="categories-title" className="space-y-6">
          <h2 id="categories-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            3. Categories of Technologies
          </h2>
          <p className="text-sm sm:text-base text-text-secondary">
            In our centralized Cookie Management System, technologies are organized into four transparent categories:
          </p>

          <div className="space-y-4">
            {COOKIE_CATEGORIES_METADATA.map((category) => (
              <div 
                key={category.id}
                className="p-5 sm:p-6 rounded-2xl border border-border bg-bg-surface hover:border-border/80 transition-colors space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base sm:text-lg font-bold text-text-primary">
                      {category.name}
                    </h3>
                    {category.isLocked ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-accent/15 text-accent border border-accent/25">
                        <Lock className="h-2.5 w-2.5" aria-hidden="true" />
                        Always Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-bg-primary border border-border text-text-secondary">
                        Requires Consent
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-mono text-text-secondary">
                    {category.isLocked ? 'Exempt from consent' : 'Default: Disabled'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                  {category.purpose}
                </p>

                <div className="pt-2 text-xs text-text-secondary border-t border-border/50">
                  <strong className="text-text-primary font-medium">Can be disabled in Cookie Settings? </strong>
                  {category.isLocked 
                    ? 'No. These technologies are indispensable for system security and basic navigation.'
                    : 'Yes. You can enable or disable this category at any time in Cookie Settings.'}
                </div>
              </div>
            ))}
          </div>
        </section>

        <hr className="border-border/60" />

        {/* SECTION 5: COOKIES AND SIMILAR TECHNOLOGIES IN USE (ACTUAL INVENTORY) */}
        <section aria-labelledby="inventory-title" className="space-y-6">
          <div className="space-y-2">
            <h2 id="inventory-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
              4. Technology Inventory (Actual Technologies in Use)
            </h2>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              Below is the comprehensive, verified inventory of cookies and browser storage technologies actively used across the RevOS platform.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border bg-bg-surface shadow-sm">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-primary/70 text-text-primary font-semibold">
                  <th scope="col" className="p-3.5 sm:p-4">Name / Identifier</th>
                  <th scope="col" className="p-3.5 sm:p-4">Provider</th>
                  <th scope="col" className="p-3.5 sm:p-4">Storage Type</th>
                  <th scope="col" className="p-3.5 sm:p-4">Category</th>
                  <th scope="col" className="p-3.5 sm:p-4">Duration</th>
                  <th scope="col" className="p-3.5 sm:p-4">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-text-secondary">
                {/* Strictly Necessary */}
                <tr className="hover:bg-bg-primary/30 transition-colors">
                  <td className="p-3.5 sm:p-4 font-mono font-medium text-text-primary">
                    sb-[ref]-auth-token
                  </td>
                  <td className="p-3.5 sm:p-4">Supabase (First-party client)</td>
                  <td className="p-3.5 sm:p-4 font-mono text-xs">localStorage</td>
                  <td className="p-3.5 sm:p-4">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-accent/10 text-accent">
                      Strictly Necessary
                    </span>
                  </td>
                  <td className="p-3.5 sm:p-4">Persistent (until sign-out)</td>
                  <td className="p-3.5 sm:p-4 leading-relaxed">
                    Maintains authenticated user session JWT, refresh tokens, and permissions.
                  </td>
                </tr>

                <tr className="hover:bg-bg-primary/30 transition-colors">
                  <td className="p-3.5 sm:p-4 font-mono font-medium text-text-primary">
                    revos_cookie_consent
                  </td>
                  <td className="p-3.5 sm:p-4">RevOS (First-party)</td>
                  <td className="p-3.5 sm:p-4 font-mono text-xs">localStorage</td>
                  <td className="p-3.5 sm:p-4">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-accent/10 text-accent">
                      Strictly Necessary
                    </span>
                  </td>
                  <td className="p-3.5 sm:p-4">365 days</td>
                  <td className="p-3.5 sm:p-4 leading-relaxed">
                    Stores the visitor’s cookie preference selections and policy version.
                  </td>
                </tr>

                <tr className="hover:bg-bg-primary/30 transition-colors">
                  <td className="p-3.5 sm:p-4 font-mono font-medium text-text-primary">
                    revos_anonymous_id
                  </td>
                  <td className="p-3.5 sm:p-4">RevOS (First-party)</td>
                  <td className="p-3.5 sm:p-4 font-mono text-xs">localStorage</td>
                  <td className="p-3.5 sm:p-4">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-accent/10 text-accent">
                      Strictly Necessary
                    </span>
                  </td>
                  <td className="p-3.5 sm:p-4">365 days</td>
                  <td className="p-3.5 sm:p-4 leading-relaxed">
                    Random pseudonymized identifier for anonymous consent audit records.
                  </td>
                </tr>

                <tr className="hover:bg-bg-primary/30 transition-colors">
                  <td className="p-3.5 sm:p-4 font-mono font-medium text-text-primary">
                    theme
                  </td>
                  <td className="p-3.5 sm:p-4">RevOS (First-party)</td>
                  <td className="p-3.5 sm:p-4 font-mono text-xs">localStorage</td>
                  <td className="p-3.5 sm:p-4">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-accent/10 text-accent">
                      Strictly Necessary
                    </span>
                  </td>
                  <td className="p-3.5 sm:p-4">Persistent</td>
                  <td className="p-3.5 sm:p-4 leading-relaxed">
                    Stores user preference for dark or light theme interface mode.
                  </td>
                </tr>

                <tr className="hover:bg-bg-primary/30 transition-colors">
                  <td className="p-3.5 sm:p-4 font-mono font-medium text-text-primary">
                    impact_authorized
                  </td>
                  <td className="p-3.5 sm:p-4">RevOS (First-party)</td>
                  <td className="p-3.5 sm:p-4 font-mono text-xs">sessionStorage</td>
                  <td className="p-3.5 sm:p-4">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-accent/10 text-accent">
                      Strictly Necessary
                    </span>
                  </td>
                  <td className="p-3.5 sm:p-4">Session only</td>
                  <td className="p-3.5 sm:p-4 leading-relaxed">
                    Temporary access flag for viewing protected commercial case studies.
                  </td>
                </tr>

                {/* Functional */}
                <tr className="hover:bg-bg-primary/30 transition-colors">
                  <td className="p-3.5 sm:p-4 font-mono font-medium text-text-primary">
                    revos_remembered_email
                  </td>
                  <td className="p-3.5 sm:p-4">RevOS (First-party)</td>
                  <td className="p-3.5 sm:p-4 font-mono text-xs">localStorage</td>
                  <td className="p-3.5 sm:p-4">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-border/60 text-text-primary">
                      Functional
                    </span>
                  </td>
                  <td className="p-3.5 sm:p-4">Persistent (until unselected)</td>
                  <td className="p-3.5 sm:p-4 leading-relaxed">
                    Optional convenience storage when user checks "Remember Me" on login.
                  </td>
                </tr>

                <tr className="hover:bg-bg-primary/30 transition-colors">
                  <td className="p-3.5 sm:p-4 font-mono font-medium text-text-primary">
                    gtmos_projects_cache_[id]
                  </td>
                  <td className="p-3.5 sm:p-4">RevOS (First-party)</td>
                  <td className="p-3.5 sm:p-4 font-mono text-xs">localStorage</td>
                  <td className="p-3.5 sm:p-4">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-border/60 text-text-primary">
                      Functional
                    </span>
                  </td>
                  <td className="p-3.5 sm:p-4">Persistent</td>
                  <td className="p-3.5 sm:p-4 leading-relaxed">
                    Caches Go-To-Market project calculation states for fast application responsiveness.
                  </td>
                </tr>

                <tr className="hover:bg-bg-primary/30 transition-colors">
                  <td className="p-3.5 sm:p-4 font-mono font-medium text-text-primary">
                    mql_lead_extra_[id]
                  </td>
                  <td className="p-3.5 sm:p-4">RevOS (First-party)</td>
                  <td className="p-3.5 sm:p-4 font-mono text-xs">localStorage</td>
                  <td className="p-3.5 sm:p-4">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-border/60 text-text-primary">
                      Functional
                    </span>
                  </td>
                  <td className="p-3.5 sm:p-4">Persistent</td>
                  <td className="p-3.5 sm:p-4 leading-relaxed">
                    Client draft storage for in-progress lead qualification assessments.
                  </td>
                </tr>

                {/* Analytics */}
                <tr className="hover:bg-bg-primary/30 transition-colors">
                  <td className="p-3.5 sm:p-4 font-mono font-medium text-text-primary">
                    log-traffic (Telemetry)
                  </td>
                  <td className="p-3.5 sm:p-4">RevOS Edge API (Supabase)</td>
                  <td className="p-3.5 sm:p-4 font-mono text-xs">API invocation (no cookie)</td>
                  <td className="p-3.5 sm:p-4">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Analytics
                    </span>
                  </td>
                  <td className="p-3.5 sm:p-4">Per page navigation</td>
                  <td className="p-3.5 sm:p-4 leading-relaxed">
                    First-party visit telemetry. Gated strictly by visitor consent before invocation.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-text-secondary">
            Note: RevOS does not set third-party cross-site tracking cookies. Third-party analytics tools (such as Google Analytics or Microsoft Clarity) and advertising networks are <strong>not</strong> installed.
          </p>
        </section>

        <hr className="border-border/60" />

        {/* SECTION 6: THIRD-PARTY TECHNOLOGIES */}
        <section aria-labelledby="third-party-title" className="space-y-4">
          <h2 id="third-party-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            5. Third-Party Technologies and Infrastructure
          </h2>
          <div className="text-sm sm:text-base text-text-secondary leading-relaxed space-y-4">
            <p>
              RevOS relies on select enterprise infrastructure providers to deliver its commercial cloud platform:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-5 rounded-2xl border border-border bg-bg-surface space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-text-primary text-sm sm:text-base">Supabase Inc.</h3>
                  <a 
                    href="https://supabase.com/privacy" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-accent hover:underline text-xs flex items-center gap-1 font-semibold"
                  >
                    <span>Privacy Policy</span>
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Provides our cloud database backend, edge functions, and user authentication infrastructure. Client authentication tokens are stored securely in first-party browser localStorage.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-border bg-bg-surface space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-text-primary text-sm sm:text-base">EmailJS</h3>
                  <a 
                    href="https://www.emailjs.com/legal/privacy-policy/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-accent hover:underline text-xs flex items-center gap-1 font-semibold"
                  >
                    <span>Privacy Policy</span>
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Used solely when you submit an inquiry through the Contact form to route your message to our leadership team. EmailJS does not place tracking cookies.
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-text-secondary">
              Non-essential third-party technologies are never activated until you have provided prior affirmative consent.
            </p>
          </div>
        </section>

        <hr className="border-border/60" />

        {/* SECTION 7: HOW TO MANAGE YOUR COOKIE PREFERENCES */}
        <section aria-labelledby="manage-preferences-title" className="space-y-6">
          <div className="space-y-2">
            <h2 id="manage-preferences-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
              6. How to Manage Your Cookie Preferences
            </h2>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              You have full control over non-essential technologies on RevOS. You can review, update, or withdraw your consent at any time.
            </p>
          </div>

          {/* Interactive Control Box */}
          <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-accent/30 bg-accent/5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-text-primary">
                  Manage Settings on RevOS
                </h3>
                <p className="text-xs sm:text-sm text-text-secondary">
                  Current Consent Status: <span className="font-mono font-bold uppercase text-accent">{status}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={openPreferences}
                className="px-6 py-3 rounded-xl bg-accent text-black font-bold text-sm shadow-md shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                <span>Open Cookie Preference Center</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-accent/20 text-xs">
              <div className="p-3 rounded-xl bg-bg-surface border border-border">
                <span className="text-text-secondary block mb-1">Strictly Necessary</span>
                <span className="font-bold text-accent flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Active
                </span>
              </div>
              <div className="p-3 rounded-xl bg-bg-surface border border-border">
                <span className="text-text-secondary block mb-1">Functional</span>
                <span className={`font-bold ${consent.functional ? 'text-accent' : 'text-text-secondary'}`}>
                  {consent.functional ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-bg-surface border border-border">
                <span className="text-text-secondary block mb-1">Analytics</span>
                <span className={`font-bold ${consent.analytics ? 'text-accent' : 'text-text-secondary'}`}>
                  {consent.analytics ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-bg-surface border border-border">
                <span className="text-text-secondary block mb-1">Marketing</span>
                <span className={`font-bold ${consent.marketing ? 'text-accent' : 'text-text-secondary'}`}>
                  {consent.marketing ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm sm:text-base text-text-secondary leading-relaxed">
            <h3 className="font-bold text-text-primary text-base">Managing Cookies via Your Browser</h3>
            <p>
              Most web browsers allow you to manage cookie and storage permissions through their built-in settings. You can configure your browser to block cookies, clear existing cookies, or notify you when a website attempts to place one:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
              <li><strong>Google Chrome:</strong> Settings &gt; Privacy and security &gt; Third-party cookies</li>
              <li><strong>Mozilla Firefox:</strong> Settings &gt; Privacy &amp; Security &gt; Enhanced Tracking Protection</li>
              <li><strong>Apple Safari:</strong> Settings &gt; Safari &gt; Advanced &gt; Block all cookies</li>
              <li><strong>Microsoft Edge:</strong> Settings &gt; Cookies and site permissions &gt; Manage and delete cookies</li>
            </ul>
            <p className="text-xs sm:text-sm pt-1">
              Please note: Blocking strictly necessary browser storage may impair your ability to sign in or navigate the RevOS workspace.
            </p>
          </div>
        </section>

        <hr className="border-border/60" />

        {/* SECTION 8: DATA RETENTION AND PRIVACY */}
        <section aria-labelledby="retention-title" className="space-y-4">
          <h2 id="retention-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            7. Data Retention and Privacy
          </h2>
          <div className="text-sm sm:text-base text-text-secondary leading-relaxed space-y-3">
            <p>
              The storage duration of data depends directly on its purpose:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>
                <strong>Session storage:</strong> Expires automatically upon closing your browser tab.
              </li>
              <li>
                <strong>Consent records:</strong> Retained for a maximum of 365 days (12 months) before we prompt you to reconfirm your privacy choices.
              </li>
              <li>
                <strong>Authentication tokens:</strong> Cleared immediately when you click <em>Sign Out</em> or when your session reaches its expiration threshold.
              </li>
            </ul>
            <p>
              All personal data processed through our platform is handled in compliance with international privacy standards. For details on how we collect, use, and protect your information, please review our <Link to="/privacy-policy" className="text-accent hover:underline font-semibold">Privacy Policy</Link> or reach out via our <Link to="/about/contact" className="text-accent hover:underline font-semibold">Contact Page</Link>.
            </p>
          </div>
        </section>

        <hr className="border-border/60" />

        {/* SECTION 9: POLICY UPDATES AND CONTACT */}
        <section aria-labelledby="updates-contact-title" className="space-y-4">
          <h2 id="updates-contact-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            8. Policy Updates and Contact Information
          </h2>
          <div className="text-sm sm:text-base text-text-secondary leading-relaxed space-y-3">
            <p>
              RevOS may revise this Cookie Policy periodically to reflect technological enhancements, operational changes, or statutory updates. When material revisions affect data categories or purposes, our centralized consent manager will automatically re-prompt you for consent upon your next visit.
            </p>
            <p>
              If you have questions, comments, or requests regarding this Cookie Policy or our privacy practices, please contact us:
            </p>
            <div className="p-5 rounded-2xl border border-border bg-bg-surface space-y-2 text-xs sm:text-sm">
              <div className="font-semibold text-text-primary">Apprevos Technology</div>
              <div>Platform: <strong>RevOS (AI-Native Revenue Operating System)</strong></div>
              <div>
                Direct Inquiries: <a href="mailto:paul.zy.wang@hotmail.com" className="text-accent hover:underline">paul.zy.wang@hotmail.com</a>
              </div>
              <div>
                Online Contact Form: <Link to="/about/contact" className="text-accent hover:underline font-medium">Contact Us</Link>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
