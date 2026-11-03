import { ArrowDown, Compass, Target, Sparkles } from 'lucide-react';

interface InsightsHeroProps {
  onScrollToChallenges: () => void;
  onScrollToCategories: () => void;
}

export function InsightsHero({ onScrollToChallenges, onScrollToCategories }: InsightsHeroProps) {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 md:pt-12 md:pb-20 border-b border-border/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Editorial Headline & Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            {/* Eyebrow Label: Anti-slop unboxed uppercase kicker */}
            <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-accent">
              <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
              <span>RevOS Insights</span>
              <span className="text-text-secondary/40 font-normal">/</span>
              <span className="text-text-secondary font-medium tracking-normal capitalize">Executive Knowledge Hub</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-text-primary tracking-tight leading-[1.1] text-balance">
              Make Better Revenue Decisions.
            </h1>

            <p className="text-lg sm:text-xl text-text-secondary leading-relaxed max-w-2xl font-light">
              Explore practical insights, analytical perspectives, and evidence-driven approaches to the challenges shaping modern revenue performance, sales execution, and business growth.
            </p>

            {/* Navigation Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={onScrollToChallenges}
                className="inline-flex items-center gap-2.5 px-5 py-3 rounded-lg bg-accent text-white font-medium text-sm hover:opacity-95 transition-opacity shadow-sm cursor-pointer whitespace-nowrap"
              >
                <Target size={16} />
                <span>Explore by Business Challenge</span>
                <ArrowDown size={14} className="opacity-80" />
              </button>

              <button
                onClick={onScrollToCategories}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-border bg-bg-surface text-text-primary font-medium text-sm hover:border-accent/40 hover:text-accent transition-colors cursor-pointer whitespace-nowrap"
              >
                <Compass size={16} />
                <span>Browse Knowledge Areas</span>
              </button>
            </div>

            {/* Quiet Domain Indicator */}
            <div className="pt-4 flex items-center gap-6 text-xs text-text-secondary border-t border-border/40 max-w-xl">
              <div>
                <span className="text-text-primary font-semibold">18</span> Business Challenges
              </div>
              <span className="text-border" aria-hidden="true">·</span>
              <div>
                <span className="text-text-primary font-semibold">8</span> Knowledge Domains
              </div>
              <span className="text-border" aria-hidden="true">·</span>
              <div>
                <span className="text-text-primary font-semibold">100%</span> Evidence-Driven
              </div>
            </div>
          </div>

          {/* Right Column: Analytical Visual Element (Telemetry & Decision Matrix) */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl border border-border bg-bg-surface p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/60">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Revenue Intelligence Matrix
                </span>
                <span className="text-xs font-mono text-accent">RevOS Telemetry</span>
              </div>

              {/* Vector Graphic: Convergence Architecture */}
              <svg viewBox="0 0 360 220" className="w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Background Grid Lines */}
                <line x1="20" y1="40" x2="340" y2="40" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="4 4" />
                <line x1="20" y1="90" x2="340" y2="90" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="4 4" />
                <line x1="20" y1="140" x2="340" y2="140" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="4 4" />
                <line x1="20" y1="190" x2="340" y2="190" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="4 4" />

                {/* Vertical Axis Steps */}
                <line x1="90" y1="20" x2="90" y2="200" stroke="currentColor" strokeOpacity="0.06" />
                <line x1="180" y1="20" x2="180" y2="200" stroke="currentColor" strokeOpacity="0.06" />
                <line x1="270" y1="20" x2="270" y2="200" stroke="currentColor" strokeOpacity="0.06" />

                {/* Analytical Curve: Conversion Trajectory */}
                <path
                  d="M 25 160 C 80 150, 120 120, 180 85 C 240 50, 290 45, 335 35"
                  stroke="var(--accent)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Secondary Reference Curve: Traditional Friction */}
                <path
                  d="M 25 150 C 90 145, 150 160, 210 170 C 270 180, 310 185, 335 188"
                  stroke="currentColor"
                  strokeOpacity="0.25"
                  strokeWidth="1.5"
                  strokeDasharray="5 5"
                />

                {/* Decision Milestone Nodes */}
                <circle cx="25" cy="160" r="4" fill="var(--accent)" />
                <circle cx="180" cy="85" r="5" fill="var(--accent)" stroke="var(--bg-surface)" strokeWidth="2" />
                <circle cx="335" cy="35" r="6" fill="var(--accent)" stroke="var(--bg-surface)" strokeWidth="2" />

                {/* Callout Labels in SVG */}
                <text x="35" y="152" fill="currentColor" fillOpacity="0.6" fontSize="9" fontFamily="var(--font-mono)">Opportunity Stage</text>
                <text x="145" y="73" fill="currentColor" fillOpacity="0.75" fontSize="9" fontFamily="var(--font-mono)">Pipeline Velocity</text>
                <text x="260" y="27" fill="var(--accent)" fontSize="9" fontWeight="600" fontFamily="var(--font-mono)">Closed-Won Predictability</text>
              </svg>

              {/* Data Triad Summary */}
              <div className="grid grid-cols-3 gap-3 pt-5 mt-4 border-t border-border/60 text-center">
                <div className="p-2 rounded-lg bg-bg-primary/50">
                  <div className="text-xs text-text-secondary">Diagnosis</div>
                  <div className="text-sm font-semibold text-text-primary mt-0.5">Root Causes</div>
                </div>
                <div className="p-2 rounded-lg bg-bg-primary/50">
                  <div className="text-xs text-text-secondary">Methodology</div>
                  <div className="text-sm font-semibold text-text-primary mt-0.5">Evidence-First</div>
                </div>
                <div className="p-2 rounded-lg bg-bg-primary/50">
                  <div className="text-xs text-text-secondary">Execution</div>
                  <div className="text-sm font-semibold text-accent mt-0.5">Predictable</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
