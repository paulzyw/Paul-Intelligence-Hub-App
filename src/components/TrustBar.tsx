import { useEffect, useRef, useState } from 'react';
import { Layers, FileCheck2, ShieldCheck, Compass } from 'lucide-react';

interface TrustCard {
  number: string;
  title: string;
  shortDesc: string;
  body: string;
  icon: typeof Layers;
}

const TRUST_CARDS: TrustCard[] = [
  {
    number: "01",
    title: "Proven Methodologies",
    shortDesc: "A repeatable approach to revenue challenges.",
    body: "RevOS organizes complex revenue questions into defined dimensions, criteria, and workflows, helping teams approach assessments with greater consistency.",
    icon: Layers,
  },
  {
    number: "02",
    title: "Evidence-Informed AI",
    shortDesc: "Reasoning grounded in the information available.",
    body: "RevOS uses the context and evidence provided to develop assessments, connect relevant findings, and help distinguish supported conclusions from assumptions or unanswered questions.",
    icon: FileCheck2,
  },
  {
    number: "03",
    title: "Transparent Assessment",
    shortDesc: "Make strengths, risks, and gaps easier to examine.",
    body: "RevOS is designed to help users understand the factors behind an assessment, including supporting evidence, potential risks, and information that still needs clarification.",
    icon: ShieldCheck,
  },
  {
    number: "04",
    title: "Actionable Next Steps",
    shortDesc: "Turn assessment findings into practical priorities.",
    body: "RevOS translates identified gaps, risks, and opportunities into recommended actions, helping revenue professionals decide what to investigate, address, or do next.",
    icon: Compass,
  },
];

export function TrustBar() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<string | null>(null);

  useEffect(() => {
    // If IntersectionObserver is not supported, reveal immediately
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Trigger once per page visit
        }
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const currentElem = sectionRef.current;
    if (currentElem) {
      observer.observe(currentElem);
    }

    // Fallback safety timeout: ensure content is fully visible if observer doesn't fire
    const fallbackTimer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);

    return () => {
      observer.disconnect();
      clearTimeout(fallbackTimer);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="trust-bar"
      style={{ backgroundColor: 'var(--bg-hero-primary)' }}
      className="relative w-full py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 border-y border-border-hero/60 transition-colors duration-400 z-20"
      aria-label="Trust Through Methodology"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header: Subtle fade-in with small upward transform */}
        <div
          className={`text-center max-w-4xl mx-auto mb-12 sm:mb-16 transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <span className="text-xs sm:text-sm font-bold tracking-[0.16em] uppercase text-accent mb-3 block">
            THE PROVEN METHODOLOGY
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-text-hero-primary tracking-tight leading-tight mb-5">
            Why RevOS
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-text-hero-secondary leading-relaxed pt-1 max-w-3xl mx-auto font-normal">
            RevOS combines billions-of-revenue proven structured methodologies with evidence-informed AI reasoning to assess available information, identify gaps and risks, and turn complex revenue challenges into clearer, actionable decisions.
          </p>
        </div>

        {/* 4 Trust Cards Grid: Staggered 70-100ms apart via CSS transitions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {TRUST_CARDS.map((card, idx) => {
            const Icon = card.icon;
            const staggerDelayMs = (idx + 1) * 80; // 80ms, 160ms, 240ms, 320ms
            const isHovered = hoveredCard === card.number;
            const isToggled = activeCard === card.number;
            const isExpanded = isHovered || isToggled;

            return (
              <div
                key={card.number}
                tabIndex={0}
                role="region"
                aria-label={card.title}
                onMouseEnter={() => setHoveredCard(card.number)}
                onMouseLeave={() => setHoveredCard(null)}
                onFocus={() => setHoveredCard(card.number)}
                onBlur={() => setHoveredCard(null)}
                onClick={() => setActiveCard(isToggled ? null : card.number)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveCard(isToggled ? null : card.number);
                  }
                }}
                style={{ transitionDelay: `${staggerDelayMs}ms` }}
                className={`trust-card group flex flex-col justify-start p-6 sm:p-7 rounded-2xl bg-bg-hero-surface/75 border border-border-hero/80 hover:border-accent/60 hover:bg-bg-hero-surface/95 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent/60 cursor-pointer transition-all duration-500 ease-out motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100 ${
                  isExpanded ? 'is-active border-accent/60 bg-bg-hero-surface/95 shadow-xl shadow-black/25 -translate-y-1' : ''
                } ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                }`}
              >
                {/* Top Bar: Number & Icon */}
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold text-accent tracking-widest uppercase">
                    {card.number}
                  </span>
                  <div className={`w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:scale-105 group-hover:border-accent/40 group-focus-visible:border-accent/40 transition-all duration-300 ${
                    isExpanded ? 'scale-105 border-accent/40 bg-accent/15' : ''
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                {/* Heading */}
                <h3 className={`text-lg sm:text-xl font-bold text-text-hero-primary mb-2 tracking-tight group-hover:text-white transition-colors ${
                  isExpanded ? 'text-white' : ''
                }`}>
                  {card.title}
                </h3>

                {/* Short Description */}
                <p className="text-xs sm:text-sm font-semibold text-accent/90 leading-snug">
                  {card.shortDesc}
                </p>

                {/* Body Content: Displayed only when user hovers over the card (or focuses / taps) */}
                <div
                  className={`trust-card-body ${
                    isExpanded ? 'opacity-100 max-h-[280px] mt-3.5 pt-3.5 border-t border-border-hero/40' : ''
                  }`}
                  style={{
                    maxHeight: isExpanded ? '280px' : undefined,
                    opacity: isExpanded ? 1 : undefined,
                    marginTop: isExpanded ? '0.875rem' : undefined,
                    paddingTop: isExpanded ? '0.875rem' : undefined,
                  }}
                >
                  <p className="text-xs sm:text-sm text-text-hero-secondary leading-relaxed font-normal">
                    {card.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Closing Statement: Staggered after cards */}
        <div
          style={{ transitionDelay: '400ms' }}
          className={`mt-12 sm:mt-16 text-center max-w-3xl mx-auto px-4 transition-all duration-600 ease-out motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <div className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-bg-hero-surface/80 border border-border-hero/80 text-xs sm:text-sm font-medium text-text-hero-primary shadow-sm backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-accent shrink-0 animate-pulse" aria-hidden="true" />
            <span>Confidence comes from a clearer process—not from an unexplained answer.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
