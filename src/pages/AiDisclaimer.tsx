import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bot, 
  ShieldCheck, 
  SlidersHorizontal, 
  Cookie, 
  CheckCircle2, 
  AlertTriangle,
  Scale, 
  Calendar, 
  Users, 
  Server, 
  Database,
  ArrowRight,
  FileText
} from 'lucide-react';
import { useCookieConsent } from '../context/CookieConsentContext';

export function AiDisclaimer() {
  const { openPreferences } = useCookieConsent();

  useEffect(() => {
    document.title = 'AI Disclaimer | RevOS';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        'Understand how RevOS uses artificial intelligence for business analysis, revenue assessments and recommendations, including AI limitations and the importance of human judgment.'
      );
    }
  }, []);

  const LAST_UPDATED = 'October 30, 2026';

  const SECTIONS = [
    { id: 'introduction', title: '1. Introduction' },
    { id: 'role-of-ai', title: '2. The Role of AI in RevOS' },
    { id: 'ai-outputs', title: '3. What AI Can Generate' },
    { id: 'ai-limitations', title: '4. Understanding AI Limitations' },
    { id: 'evidence-context', title: '5. Why Evidence & Context Matter' },
    { id: 'human-judgment', title: '6. Human Judgment & Responsibility' },
    { id: 'commercial-outcomes', title: '7. No Guaranteed Business Results' },
    { id: 'data-confidentiality', title: '8. Information You Submit to AI' },
    { id: 'responsible-use', title: '9. Using RevOS AI Responsibly' },
    { id: 'updates-policies', title: '10. Updates & Related Policies' }
  ];

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary transition-colors duration-300">
      
      {/* HERO SECTION */}
      <section className="border-b border-border bg-bg-surface/50 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-wider mb-6">
            <Bot className="h-3.5 w-3.5" aria-hidden="true" />
            <span>AI Transparency</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-text-primary mb-6 leading-tight">
            Understanding AI in RevOS
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-text-secondary max-w-3xl leading-relaxed mb-6">
            RevOS uses artificial intelligence to support structured business analysis, revenue assessment, and strategic decision-making. This page explains how AI contributes to RevOS, what its outputs can and cannot tell you, and why human judgment remains essential.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-text-secondary pt-2 border-t border-border/60">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-accent" aria-hidden="true" />
              <span>Last updated: <strong>{LAST_UPDATED}</strong></span>
            </div>
            <span className="hidden sm:inline text-border">•</span>
            <div>Version: <strong>1.0</strong></div>
            <span className="hidden sm:inline text-border">•</span>
            <Link to="/terms-of-service" className="text-accent hover:underline font-semibold">
              Terms of Service
            </Link>
            <span className="hidden sm:inline text-border">•</span>
            <Link to="/privacy-policy" className="text-accent hover:underline font-semibold">
              Privacy Policy
            </Link>
          </div>
        </div>
      </section>

      {/* CORE PRINCIPLES BANNER */}
      <section className="border-b border-border bg-bg-primary py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl border border-border bg-bg-surface space-y-2">
              <div className="text-accent font-bold text-sm">1. Structured Methodologies</div>
              <p className="text-xs text-text-secondary leading-relaxed">
                AI applies formal revenue frameworks like MEDDPICC and Go-to-Market blueprints to your commercial data.
              </p>
            </div>
            <div className="p-5 rounded-2xl border border-border bg-bg-surface space-y-2">
              <div className="text-accent font-bold text-sm">2. Evidence-Informed Reasoning</div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Outputs synthesize user-provided inputs and evidence. Evidence-informed does not mean independently verified.
              </p>
            </div>
            <div className="p-5 rounded-2xl border border-border bg-bg-surface space-y-2">
              <div className="text-accent font-bold text-sm">3. Human-Led Decisions</div>
              <p className="text-xs text-text-secondary leading-relaxed">
                AI supports decision-making with objective metrics, but human sales leaders and executives remain fully accountable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN TWO-COLUMN CONTENT WITH STICKY TOC */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-12 items-start">
          
          {/* STICKY TABLE OF CONTENTS (DESKTOP) */}
          <aside className="hidden lg:block sticky top-24 space-y-4 p-5 rounded-2xl border border-border bg-bg-surface/80 max-h-[80vh] overflow-y-auto text-xs">
            <div className="font-bold uppercase tracking-wider text-accent text-[11px] mb-2">
              Disclaimer Sections
            </div>
            <nav className="space-y-1.5">
              {SECTIONS.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="block text-text-secondary hover:text-accent transition-colors py-1 leading-snug"
                >
                  {sec.title}
                </a>
              ))}
            </nav>
          </aside>

          {/* EDITORIAL ARTICLES */}
          <main className="space-y-16 text-sm sm:text-base text-text-secondary leading-relaxed">

            {/* SECTION 1 */}
            <section id="introduction" aria-labelledby="intro-heading" className="space-y-4">
              <h2 id="intro-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                1. Introduction
              </h2>
              <p>
                RevOS is an AI-native revenue operating system designed to assist business users, go-to-market leaders, and sales professionals in evaluating commercial opportunities, structuring strategies, and assessing deal health.
              </p>
              <p>
                This AI Disclaimer applies to all AI-generated content, analysis, assessments, confidence scores, executive critiques, and recommendations produced through the RevOS platform.
              </p>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 2 */}
            <section id="role-of-ai" aria-labelledby="role-heading" className="space-y-6">
              <h2 id="role-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                2. The Role of AI in RevOS
              </h2>
              <p>
                RevOS utilizes advanced generative artificial intelligence models (such as Google’s Gemini API) accessed exclusively through secure server-side backend proxies (Supabase Edge Functions). AI supports the examination of business information across our core modules:
              </p>

              <div className="space-y-4">
                <div className="p-5 rounded-2xl border border-border bg-bg-surface space-y-2">
                  <h3 className="font-bold text-text-primary text-base">GTMOS (Go-to-Market Strategy &amp; Intelligence)</h3>
                  <p className="text-xs sm:text-sm">
                    AI assists in structuring go-to-market strategies, evaluating market focus, Ideal Customer Profiles (ICPs), value propositions, and identifying strategic execution gaps.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-border bg-bg-surface space-y-2">
                  <h3 className="font-bold text-text-primary text-base">Lead &amp; Pipeline Qualification (MQL, SQL, Opportunities)</h3>
                  <p className="text-xs sm:text-sm">
                    AI evaluates user-submitted qualification evidence against rigorous enterprise frameworks (such as MEDDPICC), calculates objective evidence scores (0–100), identifies missing criteria, and flags potential deal risks.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-border bg-bg-surface space-y-2">
                  <h3 className="font-bold text-text-primary text-base">Pipeline Assessment &amp; SWOT Analysis</h3>
                  <p className="text-xs sm:text-sm">
                    AI synthesizes stakeholder coverage, win probability drivers, competitive positioning, and SWOT dimensions to formulate actionable next best steps.
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 3 */}
            <section id="ai-outputs" aria-labelledby="outputs-heading" className="space-y-4">
              <h2 id="outputs-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                3. What AI Can Generate
              </h2>
              <p>
                AI-generated outputs within RevOS may include:
              </p>
              <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm">
                <li>Structured strategic recommendations and tactical action plans.</li>
                <li>Numerical evidence scores and tiered qualification ratings (e.g., Strong, Moderate, Weak).</li>
                <li>Executive audit summaries and deal gap identifications.</li>
                <li>Suggested discovery questions and buyer engagement strategies.</li>
              </ul>
              <p className="text-xs sm:text-sm pt-1">
                These outputs are generated dynamically based on the specific inputs, criteria, and business context provided by the user during their session.
              </p>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 4 */}
            <section id="ai-limitations" aria-labelledby="limitations-heading" className="space-y-4">
              <h2 id="limitations-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                4. Understanding AI Limitations
              </h2>
              <p>
                Artificial intelligence models have inherent technical and operational limitations. You should be aware that AI-generated outputs may:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-xs sm:text-sm">
                <li><strong>Contain Inaccuracies:</strong> AI models can occasionally misinterpret complex business text, produce logical inconsistencies, or generate factual errors.</li>
                <li><strong>Overlook Context:</strong> An AI assessment cannot perceive unstated corporate politics, sudden macroeconomic shifts, or nuanced human dynamics unless explicitly supplied as input.</li>
                <li><strong>Produce False Confidence:</strong> AI outputs often present conclusions with a high degree of linguistic polish and confidence, even when the underlying data is incomplete or ambiguous.</li>
              </ul>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 5 */}
            <section id="evidence-context" aria-labelledby="evidence-heading" className="space-y-4">
              <h2 id="evidence-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                5. Why Evidence and Context Matter
              </h2>
              <p>
                RevOS is built on the principle that structured reasoning improves revenue outcomes. However, <strong>evidence-informed does not mean independently verified</strong>.
              </p>
              <p>
                The quality of any AI-generated insight depends directly on the quality, accuracy, and completeness of the evidence you input. If qualification notes are outdated, overly optimistic, or missing crucial context, the resulting AI evaluation will reflect those deficiencies. RevOS does not independently verify external prospect statements or CRM records.
              </p>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 6 */}
            <section id="human-judgment" aria-labelledby="judgment-heading" className="space-y-4">
              <h2 id="judgment-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                6. Human Judgment and Responsibility
              </h2>
              <div className="p-5 rounded-2xl border border-accent/30 bg-accent/5 space-y-3">
                <div className="flex items-center gap-2 text-accent font-bold text-base">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                  <span>AI Supports Decisions. People Remain Accountable.</span>
                </div>
                <p className="text-xs sm:text-sm">
                  AI-assisted analyses and recommendations are designed exclusively as decision-support tools for human revenue executives and sales professionals. Users are responsible for:
                </p>
                <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm">
                  <li>Reviewing and critically evaluating all AI-generated assessment scores and gap analyses.</li>
                  <li>Validating underlying facts and prospect assumptions.</li>
                  <li>Applying professional commercial judgment before allocating sales resources, discounting pricing, or altering deal strategies.</li>
                </ul>
              </div>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 7 */}
            <section id="commercial-outcomes" aria-labelledby="outcomes-heading" className="space-y-4">
              <h2 id="outcomes-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                7. No Guaranteed Business Results
              </h2>
              <p>
                RevOS is a revenue operating system intended to improve structured rigor and visibility. <strong>RevOS does not guarantee commercial results</strong>, including but not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
                <li>Closed sales deals or increased win rates.</li>
                <li>Successful opportunity qualification or forecast accuracy.</li>
                <li>Quota attainment or revenue growth.</li>
                <li>Profitable market entry or competitive dominance.</li>
              </ul>
              <p className="text-xs sm:text-sm pt-1">
                Commercial outcomes depend on numerous external variables outside the control of any software platform, including buyer behavior, macroeconomic conditions, executive execution, and competitor activity.
              </p>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 8 */}
            <section id="data-confidentiality" aria-labelledby="data-heading" className="space-y-4">
              <h2 id="data-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                8. Information You Submit to AI Features
              </h2>
              <p>
                When you input company strategy, lead details, or deal notes into RevOS AI modules, you must ensure you have the necessary authorization to disclose that information.
              </p>
              <p>
                For complete details regarding how your data is transmitted, secured, and processed under enterprise sub-processor agreements, please review our <Link to="/privacy-policy" className="text-accent hover:underline font-semibold">Privacy Policy</Link> and <Link to="/terms-of-service" className="text-accent hover:underline font-semibold">Terms of Service</Link>.
              </p>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 9 */}
            <section id="responsible-use" aria-labelledby="resp-heading" className="space-y-4">
              <h2 id="resp-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                9. Using RevOS AI Responsibly
              </h2>
              <p>
                To maintain professional integrity and operational safety, you agree <strong>not</strong> to:
              </p>
              <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm">
                <li>Misrepresent AI-generated recommendations as independently verified objective facts to external auditors or third parties without human review.</li>
                <li>Submit unnecessary sensitive personal data into AI prompt fields.</li>
                <li>Rely solely on automated AI assessments without human verification for critical corporate sales decisions.</li>
              </ul>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 10 */}
            <section id="updates-policies" aria-labelledby="updates-heading" className="space-y-4">
              <h2 id="updates-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                10. Updates and Related Information
              </h2>
              <p>
                As AI models and revenue methodologies evolve, RevOS may update this AI Disclaimer. Continued use of our platform constitutes agreement to the current published terms.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-medium">
                <Link to="/terms-of-service" className="text-accent hover:underline flex items-center gap-1">
                  <span>Terms of Service</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
                <Link to="/privacy-policy" className="text-accent hover:underline flex items-center gap-1">
                  <span>Privacy Policy</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
                <Link to="/cookie-policy" className="text-accent hover:underline flex items-center gap-1">
                  <span>Cookie Policy</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </section>

          </main>
        </div>
      </div>
    </div>
  );
}
