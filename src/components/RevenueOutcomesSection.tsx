import { useEffect, useRef, useState } from 'react';
import { 
  TrendingUp, 
  Clock, 
  Compass, 
  LineChart, 
  BarChart3, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface OutcomeCard {
  id: string;
  number: string;
  title: string;
  statement: string;
  kpiImpact: string;
  icon: typeof TrendingUp;
}

const OUTCOMES: OutcomeCard[] = [
  {
    id: 'higher-win-rates',
    number: '01',
    title: 'Higher Win Rates',
    statement: 'Identify deal risks, strengthen winning strategies, and focus on opportunities with greater potential.',
    kpiImpact: 'opportunity win rate, conversion rate',
    icon: TrendingUp,
  },
  {
    id: 'shorter-sales-cycles',
    number: '02',
    title: 'Shorter Sales Cycles',
    statement: 'Uncover deal blockers, resolve critical gaps, and determine the next actions needed to move opportunities forward.',
    kpiImpact: 'sales-cycle length, time spent in each sales stage.',
    icon: Clock,
  },
  {
    id: 'better-resource-allocation',
    number: '03',
    title: 'Better Resource Allocation',
    statement: 'Prioritize promising opportunities and direct sales effort where it can create the greatest value.',
    kpiImpact: 'sales effort by opportunity segment, conversion rate, cost per acquired customer.',
    icon: Compass,
  },
  {
    id: 'improved-forecast-accuracy',
    number: '04',
    title: 'Improved Forecast Accuracy',
    statement: 'Assess opportunities through structured criteria and clearer evidence to make more informed revenue forecasts.',
    kpiImpact: 'forecast error & bias, actual revenue vs. forecast.',
    icon: LineChart,
  },
  {
    id: 'profitable-sustainable-growth',
    number: '05',
    title: 'Profitable Revenue Growth',
    statement: 'Strengthen go-to-market decisions, address competitive and commercial risks, and pursue growth while protecting margins.',
    kpiImpact: 'revenue growth, gross margin, and revenue attainment.',
    icon: BarChart3,
  },
];

export function RevenueOutcomesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check reduced motion preference
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.08, rootMargin: '40px 0px 40px 0px' }
    );

    const el = sectionRef.current;
    if (el) observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="revenue-outcomes"
      aria-label="Revenue Outcomes"
      className="relative w-full py-24 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden transition-colors duration-400"
    >
      {/* 1. BOTTOM LAYER: Gradient from --accent to #ffffff */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, var(--accent) 0%, #ffffff 100%)',
        }}
      />

      {/* 2. UP LAYER: Animated between bg-bg-surface/100 and bg-bg-surface/85 */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-bg-surface backdrop-blur-xs animate-pulse-surface"
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* SECTION HEADER */}
        <div
          className="text-center max-w-3xl mx-auto mb-14 sm:mb-16 lg:mb-20 space-y-4 transition-all duration-700 ease-out"
          style={{
            opacity: isVisible || prefersReducedMotion ? 1 : 0,
            transform: isVisible || prefersReducedMotion ? 'translateY(0)' : 'translateY(16px)',
          }}
        >
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-xs font-bold tracking-[0.18em] uppercase text-accent shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>REVOS MAKES BETTER REVENUE OUTCOMES</span>
          </div>

          {/* Headline H2 */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-text-primary tracking-tight leading-tight">
            Better Revenue Decisions, Better Business Outcomes
          </h2>

          {/* Supporting paragraph */}
          <p className="text-base sm:text-lg text-text-secondary leading-relaxed pt-1 max-w-2xl mx-auto">
            RevOS helps revenue teams qualify smarter, focus their efforts, manage opportunities more effectively, and make informed decisions that support stronger sales performance and profitable growth.
          </p>
        </div>

        {/* 6-CARD GRID: 3x2 on Desktop, 2-col on Tablet, 1-col on Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 lg:gap-8">
          {/* CARDS 01 TO 05 */}
          {OUTCOMES.map((item, index) => {
            const IconComponent = item.icon;
            const staggerDelay = prefersReducedMotion ? 0 : index * 80;

            return (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between bg-bg-primary rounded-2xl sm:rounded-3xl p-6 sm:p-7 lg:p-8 border border-border/80 hover:border-accent hover:shadow-xl transition-all duration-300 transform-gpu"
                style={{
                  opacity: isVisible || prefersReducedMotion ? 1 : 0,
                  transform: isVisible || prefersReducedMotion ? 'translateY(0)' : 'translateY(20px)',
                  transitionProperty: 'opacity, transform, border-color, box-shadow',
                  transitionDuration: prefersReducedMotion ? '0ms' : '500ms',
                  transitionDelay: `${staggerDelay}ms`,
                  transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {/* Top: Icon & Number Badge */}
                <div>
                  <div className="flex items-center justify-between gap-4 mb-5 sm:mb-6">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-accent/10 text-accent flex items-center justify-center border border-accent/20 group-hover:scale-105 group-hover:bg-accent group-hover:text-white transition-all duration-300 shrink-0">
                      <IconComponent className="w-5 h-5 transition-colors duration-300" />
                    </div>
                    <span className="text-xs sm:text-sm font-mono font-bold tracking-wider text-accent bg-bg-surface px-2.5 py-1 rounded-md border border-border/70 select-none">
                      {item.number}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight mb-2.5 group-hover:text-accent transition-colors duration-200">
                    {item.title}
                  </h3>

                  {/* Short Statement */}
                  <p className="text-sm sm:text-[15px] text-text-secondary leading-normal">
                    {item.statement}
                  </p>
                </div>

                {/* Bottom: Supplemental KPI Impact */}
                <div className="border-t border-border/60 pt-4 mt-6">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-accent/90 mb-1">
                    KPI Impact
                  </span>
                  <p className="text-xs sm:text-[13px] text-text-secondary/85 leading-none">
                    {item.kpiImpact}
                  </p>
                </div>
              </div>
            );
          })}

          {/* CARD 06: CLOSING STATEMENT CARD */}
          <div
            className="group relative flex flex-col justify-between bg-accent/60 text-white rounded-2xl sm:rounded-3xl p-6 sm:p-7 lg:p-8 border border-accent/30 hover:border-white/50 hover:shadow-2xl transition-all duration-300 transform-gpu overflow-hidden"
            style={{
              opacity: isVisible || prefersReducedMotion ? 1 : 0,
              transform: isVisible || prefersReducedMotion ? 'translateY(0)' : 'translateY(20px)',
              transitionProperty: 'opacity, transform, border-color, box-shadow',
              transitionDuration: prefersReducedMotion ? '0ms' : '500ms',
              transitionDelay: prefersReducedMotion ? '0ms' : `${5 * 80}ms`,
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Subtle background glow highlight */}
            <div 
              aria-hidden="true" 
              className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" 
            />

            <div>
              {/* Top: Icon & Indicator */}
              <div className="flex items-center justify-between gap-4 mb-5 sm:mb-6 relative z-10">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/20 text-white flex items-center justify-center border border-white/30 group-hover:scale-105 transition-all duration-300 shrink-0 shadow-xs">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs sm:text-sm font-mono font-bold tracking-wider text-white bg-white/15 px-2.5 py-1 rounded-md border border-white/25 select-none">
                  06
                </span>
              </div>

              {/* Eyebrow Label */}
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-white/80 mb-2 relative z-10">
                Guiding Principle
              </span>

              {/* Closing Statement */}
              <h3 className="text-lg sm:text-xl lg:text-[20px] font-bold text-white tracking-tight leading-normal relative z-10">
                Structure your thinking. Make Better-Informed Revenue Decisions. Focus your actions. Move revenue forward.
              </h3>
            </div>

            {/* Bottom accent action touch */}
            <div className="border-t border-white/20 pt-4 mt-6 flex items-center justify-between text-xs sm:text-[13px] font-semibold text-white/90 relative z-10">
              <span>The RevOS Advantage</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default RevenueOutcomesSection;
