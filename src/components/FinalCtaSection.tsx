import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass } from 'lucide-react';

export function FinalCtaSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
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
      { threshold: 0.12, rootMargin: '30px 0px 30px 0px' }
    );

    const el = sectionRef.current;
    if (el) observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="final-cta"
      aria-label="Call to Action"
      className="relative w-full py-20 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 bg-bg-hero-primary border-t border-border-hero overflow-hidden transition-colors duration-400"
    >
      {/* BACKGROUND: Subtle workflow network / motif (vector SVG) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none select-none overflow-hidden"
      >
        {/* Soft radial glow */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-35 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 60%)' }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #002b5c 0%, transparent 60%)' }}
        />

        {/* Abstract structured workflow node lines motif */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.12]"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
        >
          <defs>
            <pattern
              id="workflow-grid-dots"
              x="0"
              y="0"
              width="48"
              height="48"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.2" fill="var(--accent)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#workflow-grid-dots)" />

          {/* Workflow connecting vectors */}
          <path
            d="M -100 120 C 300 120, 450 40, 750 70 S 1100 180, 1500 110"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeDasharray="6 6"
          />
          <path
            d="M 50 200 C 400 240, 600 140, 950 160 S 1300 80, 1600 130"
            stroke="var(--accent)"
            strokeWidth="1.2"
          />
          {/* Subtle workflow node circles */}
          <circle cx="450" cy="40" r="4" fill="var(--accent)" />
          <circle cx="750" cy="70" r="5" fill="var(--accent)" />
          <circle cx="950" cy="160" r="4" fill="var(--accent)" />
          <circle cx="1100" cy="180" r="5" fill="var(--accent)" />
        </svg>
      </div>

      {/* CONTENT CONTAINER */}
      <div
        className="relative z-10 max-w-6xl mx-auto transition-all duration-600 ease-out"
        style={{
          opacity: isVisible || prefersReducedMotion ? 1 : 0,
          transform: isVisible || prefersReducedMotion ? 'translateY(0)' : 'translateY(16px)',
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10 lg:gap-14 text-center lg:text-left">
          {/* LEFT: Headline & Supporting Text */}
          <div className="max-w-2xl mx-auto lg:mx-0 space-y-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-[2.65rem] font-extrabold text-text-hero-primary tracking-tight leading-[1.2]">
              Ready to Take a More Structured Approach to Revenue Growth?
            </h2>
            <p className="text-base sm:text-lg text-text-hero-secondary leading-relaxed font-normal">
              Start with the revenue challenge in front of you. Explore how RevOS can help you organize the evidence, assess the situation, and identify the next steps worth taking.
            </p>
          </div>

          {/* RIGHT: CTAs (centered on mobile, right-aligned on desktop) */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-3.5 sm:gap-4 shrink-0 w-full sm:w-auto">
            {/* Primary CTA */}
            <Link
              to="/product/revos"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 sm:px-7 py-3.5 sm:py-4 rounded-xl text-base font-bold bg-accent text-white shadow-md hover:bg-accent/90 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98] transition-all duration-180"
            >
              <span>Get Started with RevOS</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </Link>

            {/* Secondary CTA */}
            <Link
              to="/solutions"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 sm:py-4 rounded-xl text-base font-semibold border border-border-hero bg-bg-hero-primary/60 text-text-hero-primary hover:bg-bg-hero-primary hover:border-accent/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98] transition-all duration-180"
            >
              <Compass className="w-4 h-4 text-accent shrink-0" />
              <span>Explore Solutions</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
