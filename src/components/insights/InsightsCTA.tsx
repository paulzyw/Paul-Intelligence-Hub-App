import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Compass, Sparkles } from 'lucide-react';

export function InsightsCTA() {
  return (
    <section className="py-20 bg-bg-surface/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl border border-border bg-bg-surface p-8 sm:p-12 lg:p-16 overflow-hidden shadow-sm">
          
          {/* Subtle Ambient Radial Highlight */}
          <div 
            className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10 pointer-events-none"
            style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)' }}
          />

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-accent">
              <Sparkles size={14} />
              <span>Platform Execution</span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-text-primary tracking-tight text-balance">
              From Revenue Insights to Revenue Impact.
            </h2>

            {/* Description */}
            <p className="text-base sm:text-lg text-text-secondary font-light leading-relaxed max-w-2xl mx-auto">
              Understanding revenue challenges is the first step. RevOS helps revenue teams turn evidence into clearer assessments, better strategies, and more actionable decisions.
            </p>

            {/* Actions */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/product/overview/revos"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg bg-accent text-white font-semibold text-sm hover:opacity-95 transition-opacity shadow-sm cursor-pointer whitespace-nowrap"
              >
                <span>Explore RevOS</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/about/contact"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg border border-border bg-bg-surface text-text-primary font-medium text-sm hover:border-accent/40 hover:text-accent transition-colors cursor-pointer whitespace-nowrap"
              >
                <Compass size={16} />
                <span>Talk to a Revenue Architect</span>
              </Link>
            </div>

            {/* Trust Markers */}
            {/*<div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-text-secondary border-t border-border/40 mt-8">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-accent" />
                <span>SOC2 Type II Aligned</span>
              </span>
              <span className="text-border" aria-hidden="true">·</span>
              <span>Enterprise CRM Native</span>
              <span className="text-border" aria-hidden="true">·</span>
              <span>Self-Hosted & Cloud Deployments</span>
            </div>*/}

          </div>

        </div>
      </div>
    </section>
  );
}
