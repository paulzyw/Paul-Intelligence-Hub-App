import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Users
} from 'lucide-react';
import { ScrollytellingContainer } from '../components/theme-story';
import GradientWaves from '../components/GradientWaves';

type AudienceKey = 'individual' | 'enterprise';

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
    label: "Individual sales professional",
    cardTitle: "Individual Sales Professional",
    image: "https://yfonihlpdvelssfmzokp.supabase.co/storage/v1/object/public/page_image/Individual_sales.webp",
    imageAlt: "Individual sales professional holding a tablet",
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
    label: "Enterprise team",
    cardTitle: "Enterprise Team",
    image: "https://yfonihlpdvelssfmzokp.supabase.co/storage/v1/object/public/page_image/enterprise_team.webp",
    imageAlt: "Enterprise team shaking hands on a deal",
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

export function Home() {
  const [activeAudience, setActiveAudience] = useState<AudienceKey>('individual');

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
              className="text-[1.65rem] xs:text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-text-hero-primary mb-6 sm:mb-8 md:mb-10 max-w-5xl mx-auto leading-[1.18] sm:leading-[1.15] md:leading-[1.1]"
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
                to="/solutions/revos" 
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

      {/* NEGATIVE IMPACTS SECTION: RECOGNIZE THE COST OF THE PROBLEM */}
      <section 
        id="negative-impacts" 
        className="w-full bg-bg-surface py-20 lg:py-28 px-4 sm:px-6 lg:px-8 border-b border-border/60 transition-colors duration-400"
      >
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3.5">
            <span className="text-xs sm:text-sm font-bold tracking-[0.16em] uppercase text-accent">
              THE REVENUE CHALLENGE
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-text-primary tracking-tight leading-tight">
              When Revenue Execution Breaks Down, the Impact Adds Up.
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-text-secondary leading-relaxed pt-1">
              The visible problem may be a missed target, a stalled deal, or pressure to discount. Behind it may be disconnected decisions across the revenue lifecycle.
            </p>
          </div>

          {/* Impact Cards Grid: Desktop 3 cols, Tablet 2 cols, Mobile 1 col */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {IMPACT_CARDS.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.number}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.18 }}
                  transition={{
                    duration: 0.38,
                    delay: (index % 3) * 0.075,
                    ease: "easeOut"
                  }}
                  className="bg-bg-primary rounded-2xl border border-border/80 hover:border-accent/50 p-6 sm:p-7 flex flex-col justify-between transition-colors shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-mono font-bold text-accent/80 tracking-wider">
                        {card.number}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-accent mt-5 mb-2.5 leading-snug">
                      {card.title}
                    </h3>
                    
                    <p className="text-sm sm:text-[15px] text-text-primary leading-relaxed font-normal">
                      {card.explanation}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/50 text-xs text-text-secondary leading-snug">
                    <span className="font-semibold text-text-primary">Possible signal:</span> {card.signal}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CRITICAL PROBLEMS AND ROOT CAUSES SECTION */}
      <section 
        id="critical-problems" 
        className="w-full bg-bg-primary py-20 lg:py-28 px-4 sm:px-6 lg:px-8 border-b border-border/60 transition-colors duration-400"
      >
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3.5">
            <span className="text-xs sm:text-sm font-bold tracking-[0.16em] uppercase text-accent">
              LOOK BENEATH THE SYMPTOMS
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-text-primary tracking-tight leading-tight">
              The Visible Problem Is Not Always the Root Cause.
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-text-secondary leading-relaxed pt-1">
              A missed target, a stalled opportunity, or a price-led negotiation is an outcome. Understanding the underlying problem—and validating what is causing it—is where better revenue decisions begin.
            </p>
          </div>

          {/* Audience Segmented Control */}
          <div className="flex justify-center mb-10 sm:mb-12">
            <div 
              role="tablist" 
              aria-label="Select audience perspective"
              className="inline-flex p-1 sm:p-1.5 bg-bg-surface border border-border/80 rounded-xl shadow-xs max-w-full overflow-x-auto"
            >
              {(['individual', 'enterprise'] as const).map((key) => {
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
                    ) : (
                      <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-accent tracking-tight mb-8 sm:mb-10">
                      {AUDIENCE_DATA[activeAudience].cardTitle}
                    </h3>

                    {/* 01 / Symptoms */}
                    <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] lg:grid-cols-[200px_1fr] gap-3 sm:gap-6 items-start">
                      <div className="shrink-0">
                        <h4 className="text-lg sm:text-xl font-bold text-accent tracking-tight">
                          01 / Symptoms
                        </h4>
                        <p className="text-xs sm:text-sm text-text-secondary mt-1 leading-snug">
                          What you may be experiencing
                        </p>
                      </div>
                      <div className="w-full">
                        <ul className="space-y-2.5 sm:space-y-3">
                          {AUDIENCE_DATA[activeAudience].experiencing.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 sm:gap-3 text-text-primary text-sm sm:text-[15px] leading-relaxed">
                              <span className="text-text-primary font-bold select-none leading-relaxed shrink-0">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Divider line */}
                    <div className="border-t border-border/50 my-6 sm:my-8 w-full" />

                    {/* 02 / Root Causes */}
                    <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] lg:grid-cols-[200px_1fr] gap-3 sm:gap-6 items-start">
                      <div className="shrink-0">
                        <h4 className="text-lg sm:text-xl font-bold text-accent tracking-tight">
                          02 / Root Causes
                        </h4>
                        <p className="text-xs sm:text-sm text-text-secondary mt-1 leading-snug">
                          Possible underlying causes
                        </p>
                      </div>
                      <div className="w-full">
                        <ul className="space-y-2.5 sm:space-y-3">
                          {AUDIENCE_DATA[activeAudience].rootCauses.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 sm:gap-3 text-text-primary text-sm sm:text-[15px] leading-relaxed">
                              <span className="text-text-primary font-bold select-none leading-relaxed shrink-0">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* SCROLLYTELLING COMPONENT */}
      <ScrollytellingContainer />
    </div>
  );
}
