import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Target, 
  TrendingDown, 
  Tag, 
  Coins, 
  Clock, 
  LineChart,
  User,
  Users,
  Briefcase
} from 'lucide-react';
import RevosInAction from '../components/revosInAction';
import { RevenueOutcomesSection } from '../components/RevenueOutcomesSection';
import { FaqSection } from '../components/FaqSection';
import { FinalCtaSection } from '../components/FinalCtaSection';
import GradientWaves from '../components/GradientWaves';
import { RevosMechanismSection } from '../components/RevosMechanismSection';
import { RevosPlatformSection } from '../components/RevosPlatformSection';
import { TrustBar } from '../components/TrustBar';

type AudienceKey = 'individual' | 'enterprise' | 'executive';

interface AudienceContent {
  label: string;
  cardTitle: string;
  image: string;
  imageAlt: string;
  experiencing: string[];
  rootCauses: string[];
}

const AUDIENCE_DATA: Record<AudienceKey, AudienceContent> = {
  individual: {
    label: "Sales Professional",
    cardTitle: "Sales Professional",
    image: "https://yfonihlpdvelssfmzokp.supabase.co/storage/v1/object/public/page_image/Individual_sales.webp",
    imageAlt: "Sales professional",
    experiencing: [
      "Leads look promising but lack verified buying potential.",
      "Discovery does not fully establish the customer's problem, impact, or decision criteria.",
      "Critical stakeholder, value, or competitive risks surface late.",
      "Follow-up and next actions are inconsistent."
    ],
    rootCauses: [
      "Qualification criteria are not explicit or consistently applied.",
      "Evidence is incomplete, scattered, or not validated with the customer.",
      "Stakeholder access and the decision process are not sufficiently understood.",
      "Risks are identified without a prioritized mitigation plan."
    ]
  },
  enterprise: {
    label: "Enterprise Team",
    cardTitle: "Enterprise Team",
    image: "https://yfonihlpdvelssfmzokp.supabase.co/storage/v1/object/public/page_image/enterprise_team_02.webp",
    imageAlt: "Enterprise team reviewing sales strategy and performance",
    experiencing: [
      "Marketing and sales disagree about which leads deserve attention.",
      "Qualification quality varies between sellers and teams.",
      "Pipeline reviews reveal risks too late to influence outcomes.",
      "Management lacks a consistent basis for coaching and resource allocation."
    ],
    rootCauses: [
      "GTM priorities are not consistently connected to lead and opportunity criteria.",
      "Teams use different definitions of a qualified lead or healthy opportunity.",
      "Evidence gaps and deal risks are not visible in a consistent assessment process.",
      "Presales and management resources are not consistently tied to opportunity potential."
    ]
  },
  executive: {
    label: "Enterprise Executive",
    cardTitle: "Enterprise Executive",
    image: "https://yfonihlpdvelssfmzokp.supabase.co/storage/v1/object/public/page_image/enterprise_executive.webp",
    imageAlt: "Enterprise executive seated at desk with laptop and strategy documents",
    experiencing: [
      "Revenue targets are difficult to achieve consistently.",
      "Forecasts change unexpectedly, marketing and sales are not always aligned.",
      "Rising commercial investment does not always translate into proportional growth.",
      "Performance show only what is happening, not identifying the underlying causes and deciding where to intervene."
    ],
    rootCauses: [
      "Revenue strategies are not consistently translated into operational priorities and actions.",
      "Forecasts and opportunity assessments rely on insufficiently validated evidence.",
      "Marketing and sales lack shared qualification standards.",
      "Commercial resources are not systematically prioritized.",
      "Performance data and insights not consistently reveal root causes and corrective action."
    ]
  }
};

const IMPACT_CARDS = [
  {
    number: "01",
    title: "Missing sales targets",
    icon: Target,
    explanation: "Revenue goals remain out of reach when the pipeline, qualification decisions, and opportunity execution do not translate into sufficient progress.",
    signal: "revenue attainment and qualified pipeline coverage."
  },
  {
    number: "02",
    title: "Low win rates",
    icon: TrendingDown,
    explanation: "Opportunities consume time and resources but fail to convert into won business.",
    signal: "stage conversion and win rate."
  },
  {
    number: "03",
    title: "Price competition and margin erosion",
    icon: Tag,
    explanation: "Deals become price-led when customer value, differentiation, or concession trade-offs are not sufficiently clear.",
    signal: "average discount and concession rate."
  },
  {
    number: "04",
    title: "High sales operating costs",
    icon: Coins,
    explanation: "Selling and presales resources are consumed by opportunities that may not merit the same level of effort.",
    signal: "presales hours per won deal and cost per qualified opportunity."
  },
  {
    number: "05",
    title: "Low sales efficiency and productivity",
    icon: Clock,
    explanation: "Preparation, discovery, prioritization, and follow-up are repetitive or inconsistent.",
    signal: "preparation time and follow-up completion."
  },
  {
    number: "06",
    title: "Low revenue predictability",
    icon: LineChart,
    explanation: "Pipeline progress, deal risks, and expected close dates are difficult to assess consistently.",
    signal: "forecast variance and stage progression."
  }
];

// Distance (in pixels) the user must scroll for each card to transition from 0% to 100% opacity.
export function Home() {
  const [activeAudience, setActiveAudience] = useState<AudienceKey>('individual');
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  const trackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [shiftRange, setShiftRange] = useState({ stage1Y: 140, stage2Y: -40 });
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const updateLayout = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      setWindowWidth(window.innerWidth);

      if (!desktop) {
        setShiftRange({ stage1Y: 0, stage2Y: 0 });
        return;
      }

      // Height of the sticky viewport (container or window height minus top-16 header)
      const vHeight = containerRef.current?.clientHeight || (window.innerHeight - 64);
      const headerEl = headerRef.current;
      const gridEl = gridRef.current;

      if (headerEl && gridEl) {
        const headerH = headerEl.offsetHeight;
        // header bottom margin (mb-6 / sm:mb-8)
        const headerMb = window.innerWidth >= 640 ? 32 : 24;
        const gridH = gridEl.offsetHeight;

        // Measure first card height for Row 1
        const firstCard = gridEl.children[0] as HTMLElement | undefined;
        const row1H = firstCard ? firstCard.offsetHeight : Math.round((gridH - 20) / 2);

        // Stage 1 (First Half State): Center Header + Row 1 cards vertically in the viewport
        const stage1ContentH = headerH + headerMb + row1H;
        const s1Y = Math.max(16, Math.round((vHeight - stage1ContentH) / 2));

        // Stage 2 (Complete State): Center all 6 cards (the Grid) vertically in the viewport
        const stage2GridTop = Math.max(16, Math.round((vHeight - gridH) / 2));
        // motion.div contains header and then grid, so grid is at offset (headerH + headerMb) inside motion.div.
        // To place grid at stage2GridTop, motion.div's y must be:
        const s2Y = stage2GridTop - (headerH + headerMb);

        setShiftRange({ stage1Y: s1Y, stage2Y: s2Y });
      }
    };

    updateLayout();
    const rafId = requestAnimationFrame(updateLayout);
    const timer = setTimeout(updateLayout, 150);

    window.addEventListener('resize', updateLayout);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
      window.removeEventListener('resize', updateLayout);
    };
  }, []);

  // Raw scroll progress through the generous 550vh storytelling track
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start end", "end end"]
  });

  // Smooth the scroll input with a physics spring so mouse wheel notches and fast scrolls
  // glide continuously across 60/120fps frames without abrupt stepping or instant snapping
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 85,
    damping: 22,
    mass: 0.15,
    restDelta: 0.0001
  });

  // Vertical framing shift with ease-in-out:
  // - Stage 1 (First Half State: 0.00 -> 0.46): contentY = shiftRange.stage1Y
  //   Header and Row 1 are vertically centered in the viewport
  // - Transition (0.46 -> 0.58): smoothly translates content to shiftRange.stage2Y
  // - Stage 2 (Complete State: 0.58 -> 1.00): contentY = shiftRange.stage2Y
  //   Row 1 and Row 2 (all 6 cards) are vertically centered in the viewport
  const contentY = useTransform(smoothProgress, (v) => {
    if (!isDesktop) return 0;
    if (v <= 0.46) return shiftRange.stage1Y;
    if (v >= 0.58) return shiftRange.stage2Y;
    const progress = (v - 0.46) / (0.58 - 0.46);
    // Smooth quadratic ease-in-out
    const eased = progress < 0.5 
      ? 2 * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    return shiftRange.stage1Y + (shiftRange.stage2Y - shiftRange.stage1Y) * eased;
  });

  // Storytelling card revelations driven directly by user scrolling:
  //
  // Row 1 (first half state):
  // Card 01 (Missing sales targets): Fades in with vertical lift as section enters visible screen
  const card1Opacity = useTransform(smoothProgress, [0.03, 0.15], [0, 1]);
  const card1Y = useTransform(card1Opacity, [0, 1], [16, 0]);

  // Slide distance from right side of viewport for Column 2 (center) and Column 3 (right):
  const col2Slide = Math.min(windowWidth * 0.7, 850);
  const col3Slide = Math.min(windowWidth * 0.45, 500);

  // Card 02 (Low win rates): Enters moving from right side of the viewport to its position
  const card2Opacity = useTransform(smoothProgress, [0.18, 0.23], [0, 1]);
  const card2X = useTransform(smoothProgress, (v) => {
    if (!isDesktop) return 0;
    if (v <= 0.18) return col2Slide;
    if (v >= 0.29) return 0;
    const p = (v - 0.18) / (0.29 - 0.18);
    const eased = 1 - Math.pow(1 - p, 3);
    return col2Slide * (1 - eased);
  });

  // Card 03 (Price competition and margin erosion): Enters moving from right side of the viewport to its position
  const card3Opacity = useTransform(smoothProgress, [0.32, 0.37], [0, 1]);
  const card3X = useTransform(smoothProgress, (v) => {
    if (!isDesktop) return 0;
    if (v <= 0.32) return col3Slide;
    if (v >= 0.43) return 0;
    const p = (v - 0.32) / (0.43 - 0.32);
    const eased = 1 - Math.pow(1 - p, 3);
    return col3Slide * (1 - eased);
  });

  // Row 2 (complete state):
  // Card 04 (High sales operating costs): Fades in with vertical lift as screen shifts to complete state framing
  const card4Opacity = useTransform(smoothProgress, [0.50, 0.58], [0, 1]);
  const card4Y = useTransform(card4Opacity, [0, 1], [16, 0]);

  // Card 05 (Low sales efficiency and productivity): Enters moving from right side of the viewport to its position
  const card5Opacity = useTransform(smoothProgress, [0.61, 0.66], [0, 1]);
  const card5X = useTransform(smoothProgress, (v) => {
    if (!isDesktop) return 0;
    if (v <= 0.61) return col2Slide;
    if (v >= 0.71) return 0;
    const p = (v - 0.61) / (0.71 - 0.61);
    const eased = 1 - Math.pow(1 - p, 3);
    return col2Slide * (1 - eased);
  });

  // Card 06 (Low revenue predictability): Enters moving from right side of the viewport to its position
  // Finishes at 0.84, giving a generous 16% buffer (0.84 -> 1.00) where all 6 cards are fully visible together
  const card6Opacity = useTransform(smoothProgress, [0.74, 0.79], [0, 1]);
  const card6X = useTransform(smoothProgress, (v) => {
    if (!isDesktop) return 0;
    if (v <= 0.74) return col3Slide;
    if (v >= 0.84) return 0;
    const p = (v - 0.74) / (0.84 - 0.74);
    const eased = 1 - Math.pow(1 - p, 3);
    return col3Slide * (1 - eased);
  });

  const cardOpacities = [card1Opacity, card2Opacity, card3Opacity, card4Opacity, card5Opacity, card6Opacity];
  const cardXs = [0, card2X, card3X, 0, card5X, card6X];
  const cardYs = [card1Y, 0, 0, card4Y, 0, 0];

  useEffect(() => {
    // Preload both audience images for instantaneous blurred background transition
    Object.values(AUDIENCE_DATA).forEach((item) => {
      const img = new Image();
      img.src = item.image;
    });
  }, []);

  return (
    <div className="flex flex-col w-full">
      {/* NEW HERO SECTION DUPLICATING SOLUTIONS HERO CONTENT (WITHOUT THREADS OR GEAR TRAIN) */}
      <section id="hero" className="relative w-full bg-bg-hero-primary pt-24 pb-20 sm:pt-28 sm:pb-24 md:pt-32 md:pb-28 overflow-hidden transition-colors duration-400">
        {/* WebGL Gradient Waves background */}
        <div className="absolute inset-0 z-0 opacity-100">
          <GradientWaves 
            horizonColor="#1b2f3e"
            waveColor="#00a3e0"
            crestColor="#A0AEC0"
            speed={0.5}
            amplitude={2.5}
            waveScale={0.6}
            opacity={1.0}
            brightness={1.5}
            detail="medium"
          />
        </div>

        {/* Grid overlay over the WebGL waves for a technical mesh look */}
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] z-10 pointer-events-none"></div>
        {/* Soft fade-out gradient overlay to blend waves with the rest of the dark page */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-hero-primary via-bg-hero-primary/10 to-transparent z-10 pointer-events-none"></div>
    
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-20">
          <div>
            <motion.h2 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="text-xs sm:text-sm font-bold tracking-[0.14em] sm:tracking-[0.2em] uppercase text-accent mb-3 sm:mb-4"
            >
              AI-Native Revenue Operating System
            </motion.h2>
            
            <motion.h1 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.08, ease: "easeOut" }}
              className="text-4xl md:text-7xl font-extrabold tracking-tight text-text-hero-primary mb-6 sm:mb-8 md:mb-10 max-w-5xl mx-auto leading-[1.18] sm:leading-[1.15] md:leading-[1.1]"
            >
              RevOS Turns Revenue Challenges Into <br className="hidden md:block" /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-text-hero-primary via-accent to-text-primary bg-[length:200%_auto] animate-gradient">
                Clearer Paths to Growth
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.16, ease: "easeOut" }}
              className="text-sm sm:text-base md:text-lg text-text-hero-secondary max-w-5xl mx-auto leading-relaxed md:leading-normal font-normal sm:font-medium mb-8 sm:mb-10 md:mb-12 px-1 sm:px-0"
            >
              Revenue growth becomes difficult when go-to-market priorities, lead qualification, and sales pipeline decisions are disconnected. RevOS brings structured revenue methodologies and AI-powered reasoning together to help you assess what matters, identify what is missing, and decide what to do next.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.24, ease: "easeOut" }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link 
                to="/product/revos" 
                className="group relative px-7 py-3.5 sm:px-8 sm:py-4 bg-accent text-text-hero-primary text-sm sm:text-base font-bold rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95"
              >
                <div className="relative z-10 flex items-center gap-2">
                  Explore RevOS <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* SCROLL INDICATOR */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex justify-center pointer-events-none z-10"
        >
          <div className="w-5 h-8 border-2 border-text-hero-secondary/30 rounded-full flex justify-center p-1">
            <motion.div
              animate={{
                y: [0, 12, 0],
                opacity: [1, 0.2, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-1 h-1.5 bg-accent rounded-full"
            />
          </div>
        </motion.div>
      </section>

      {/* TRUST BAR SECTION: TRUST THROUGH METHODOLOGY */}
      <TrustBar />

      {/* NEGATIVE IMPACTS SECTION: RECOGNIZE THE COST OF THE PROBLEM */}
      <section 
        id="negative-impacts" 
        ref={trackRef}
        className="relative w-full bg-bg-surface h-auto lg:h-[550vh] transition-colors duration-400"
      >
        <div 
          ref={containerRef}
          className="static lg:sticky lg:top-16 lg:h-[calc(100vh-64px)] w-full flex flex-col justify-start overflow-hidden py-12 sm:py-16 lg:py-0 px-4 sm:px-6 lg:px-8 border-b border-border/60"
        >
          <div className="max-w-7xl mx-auto w-full h-full flex flex-col justify-start">
            <motion.div 
              style={{ y: isDesktop ? contentY : 0 }}
              className="flex flex-col w-full"
            >
              {/* Section Header */}
              <div 
                ref={headerRef}
                className="text-center max-w-3xl mx-auto mb-6 sm:mb-8 space-y-2.5"
              >
                <span className="text-xs sm:text-sm font-bold tracking-[0.16em] uppercase text-accent">
                  THE REVENUE CHALLENGE
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-text-primary tracking-tight leading-tight">
                  When Revenue Execution Breaks Down, the Impact Adds Up
                </h2>
                <p className="text-sm sm:text-base md:text-lg text-text-secondary leading-relaxed pt-0.5">
                  The visible problem may be a missed target, a stalled deal, or pressure to discount. Behind it may be disconnected decisions across the revenue lifecycle.
                </p>
              </div>

              {/* Impact Cards Grid: Desktop 3 cols, Tablet 2 cols, Mobile 1 col */}
              <div 
                ref={gridRef}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5"
              >
                {IMPACT_CARDS.map((card, index) => {
                  const Icon = card.icon;

                  return (
                    <motion.div
                      key={card.number}
                      style={{
                        opacity: isDesktop ? cardOpacities[index] : 1,
                        x: isDesktop ? cardXs[index] : 0,
                        y: isDesktop ? cardYs[index] : 0,
                      }}
                      className="bg-bg-primary rounded-2xl border border-border/80 hover:border-accent/50 p-4 sm:p-5 lg:p-5 flex flex-col justify-between transition-colors shadow-sm"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                            <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                          </div>
                          <span className="text-xs font-mono font-bold text-accent/80 tracking-wider">
                            {card.number}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-accent mt-3 sm:mt-3.5 mb-1.5 leading-snug">
                          {card.title}
                        </h3>
                        
                        <p className="text-xs sm:text-[13.5px] text-text-primary leading-relaxed font-normal">
                          {card.explanation}
                        </p>
                      </div>

                      <div className="mt-4 pt-2.5 border-t border-border/50 text-[11px] sm:text-xs text-text-secondary leading-snug">
                        <span className="font-semibold text-text-primary">Possible signal:</span> {card.signal}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CRITICAL PROBLEMS AND ROOT CAUSES SECTION */}
      <section 
        id="critical-problems" 
        className="relative w-full bg-bg-primary py-20 lg:py-28 px-4 sm:px-6 lg:px-8 border-b border-border/60 transition-colors duration-400 overflow-hidden"
      >
        {/* Dynamic blurred ambient background mixing the card picture subtly into the section ground */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
          <AnimatePresence mode="sync">
            <motion.div
              key={activeAudience}
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <img 
                src={AUDIENCE_DATA[activeAudience].image} 
                alt=""
                className="w-full h-full object-cover object-center scale-125 filter blur-[45px] sm:blur-[65px] md:blur-[80px] saturate-150 contrast-110 opacity-60 sm:opacity-70 dark:opacity-55"
              />
            </motion.div>
          </AnimatePresence>

          {/* Soft top and bottom boundary blend to seamlessly transition with adjacent sections */}
          <div className="absolute inset-0 bg-gradient-to-b from-bg-primary via-transparent to-bg-primary opacity-80" />

          {/* Gentle vignette to keep edges elegant while leaving atmospheric center vibrant */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 50% 50%, transparent 45%, var(--bg-primary) 95%)'
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3.5">
            <span className="text-xs sm:text-sm font-bold tracking-[0.16em] uppercase text-accent">
              LOOK BENEATH THE PROBLEMS
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-text-primary tracking-tight leading-tight">
              Root Cause behind Visible Problem
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-text-secondary leading-relaxed pt-1">
              A missed target, a stalled opportunity, or a price-led negotiation is an outcome. Understanding the underlying problem across various of roles—and validating what is causing it—is where better revenue decisions begin.
            </p>
          </div>

          {/* Audience Segmented Control */}
          <div className="flex justify-center mb-10 sm:mb-12">
            <div 
              role="tablist" 
              aria-label="Select audience perspective"
              className="inline-flex p-1 sm:p-1.5 bg-bg-surface border border-border/80 rounded-xl shadow-xs max-w-full overflow-x-auto"
            >
              {(['individual', 'enterprise', 'executive'] as const).map((key) => {
                const isSelected = activeAudience === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setActiveAudience(key)}
                    className={`px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                      isSelected
                        ? 'bg-accent text-text-hero-primary shadow-xs'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-primary/60'
                    }`}
                  >
                    {key === 'individual' ? (
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    ) : key === 'enterprise' ? (
                      <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    ) : (
                      <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    )}
                    {AUDIENCE_DATA[key].label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ONE-CARD LAYOUT MATCHING IMAGE SHOWCASE */}
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeAudience}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="bg-bg-surface rounded-2xl md:rounded-3xl border border-border/80 p-6 sm:p-8 md:p-10 lg:p-12 shadow-sm"
              >
                <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-stretch">
                  {/* Left: Picture with rounded corners */}
                  <div className="w-full md:w-64 lg:w-80 shrink-0 flex">
                    <img 
                      src={AUDIENCE_DATA[activeAudience].image} 
                      alt={AUDIENCE_DATA[activeAudience].imageAlt}
                      className="w-full h-64 sm:h-80 md:h-full object-cover object-center rounded-xl sm:rounded-2xl border border-border/40 shadow-sm"
                      loading="lazy"
                    />
                  </div>

                  {/* Right: Content */}
                  <div className="flex-1 flex flex-col justify-between w-full min-w-0">
                    {/* Card Title */}
                    <div>
                      <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-accent tracking-tight">
                        {AUDIENCE_DATA[activeAudience].cardTitle}
                      </h3>
                      {/* Top Divider line below Card Title */}
                      <div className="border-t border-border/50 mt-5 mb-6 sm:mt-6 sm:mb-7 w-full" />
                    </div>

                    {/* 01 / Problems */}
                    <div className="flex flex-col">
                      <div>
                        <h4 className="text-lg sm:text-xl font-bold text-accent tracking-tight">
                          01 / Problems
                        </h4>
                        <p className="text-xs sm:text-sm text-text-secondary mt-1 leading-snug">
                          What you may be experiencing
                        </p>
                      </div>
                      <ul className="mt-2 sm:mt-3 pl-3 sm:pl-4 space-y-[1px] sm:space-y-[1px]">
                        {AUDIENCE_DATA[activeAudience].experiencing.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3 sm:gap-3.5 text-text-primary text-sm sm:text-[15px] leading-relaxed">
                            <span className="text-text-primary font-bold select-none leading-relaxed shrink-0">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Middle Divider line */}
                    <div className="border-t border-border/50 my-6 sm:my-7 w-full" />

                    {/* 02 / Root Causes */}
                    <div className="flex flex-col">
                      <div>
                        <h4 className="text-lg sm:text-xl font-bold text-accent tracking-tight">
                          02 / Root Causes
                        </h4>
                        <p className="text-xs sm:text-sm text-text-secondary mt-1 leading-snug">
                          Possible underlying causes
                        </p>
                      </div>
                      <ul className="mt-2 sm:mt-3 pl-3 sm:pl-4 space-y-[1px] sm:space-y-[1px]">
                        {AUDIENCE_DATA[activeAudience].rootCauses.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3 sm:gap-3.5 text-text-primary text-sm sm:text-[15px] leading-relaxed">
                            <span className="text-text-primary font-bold select-none leading-relaxed shrink-0">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* REVOS MECHANISM SECTION */}
      <RevosMechanismSection />

      {/* REVOS PLATFORM SECTION */}
      <RevosPlatformSection />

      {/* SEE REVOS IN ACTION SECTION */}
      <RevosInAction />

      {/* REVENUE OUTCOMES SECTION */}
      <RevenueOutcomesSection />

      {/* FAQ SECTION */}
      <FaqSection />

      {/* FINAL CTA SECTION */}
      <FinalCtaSection />
    </div>
  );
}
