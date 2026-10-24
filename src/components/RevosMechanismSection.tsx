import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Layers, 
  Cpu, 
  Compass, 
  ArrowRight, 
  CheckCircle2, 
  HelpCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Sparkles
} from 'lucide-react';

interface PillarItem {
  id: number;
  label: string;
  title: string;
  coverTitle: [string, string];
  description: string;
  items: string[];
  icon: typeof Layers;
  bgGradient: string;
  textColor: string;
  labelColor: string;
  descColor: string;
  iconBg: string;
  borderColor: string;
  dividerBorder: string;
  bulletBg: string;
}

const PILLARS_DATA: PillarItem[] = [
  {
    id: 1,
    label: "Pillar 01",
    title: "Structured Methodologies",
    coverTitle: ["Structured", "Methodologies"],
    description: "Start with a clear framework for understanding the revenue challenge. RevOS helps organize the problem, establish relevant evaluation criteria, and create a repeatable path from initial questions to structured assessment.",
    items: [
      "Define the business problem and desired outcome.",
      "Organize relevant assessment criteria.",
      "Establish a repeatable workflow for analysis and decision-making."
    ],
    icon: Layers,
    bgGradient: "from-[#eef1b2] to-[#C5d704]",
    textColor: "text-[#051c2c]",
    labelColor: "text-[#051c2c]/75",
    descColor: "text-[#051c2c]/85",
    iconBg: "bg-white/40 border-[#051c2c]/15 text-[#051c2c]",
    borderColor: "border-[#051c2c]/10 hover:border-[#051c2c]/25",
    dividerBorder: "border-[#051c2c]/20",
    bulletBg: "bg-[#051c2c]"
  },
  {
    id: 2,
    label: "Pillar 02",
    title: "Evidence-Informed AI Reasoning",
    coverTitle: ["Evidence-Informed", "AI Reasoning"],
    description: "RevOS uses AI-powered reasoning to help users examine available information, connect evidence to the problem, and identify assumptions, uncertainties, and missing details that may affect the assessment.",
    items: [
      "Examine available customer and opportunity evidence.",
      "Distinguish supported findings from assumptions.",
      "Identify missing information and questions requiring validation."
    ],
    icon: Cpu,
    bgGradient: "from-[#b2e1f5] to-[#0a9fde]",
    textColor: "text-[#051c2c]",
    labelColor: "text-[#051c2c]/75",
    descColor: "text-[#051c2c]/85",
    iconBg: "bg-white/40 border-[#051c2c]/15 text-[#051c2c]",
    borderColor: "border-[#051c2c]/10 hover:border-[#051c2c]/25",
    dividerBorder: "border-[#051c2c]/20",
    bulletBg: "bg-[#051c2c]"
  },
  {
    id: 3,
    label: "Pillar 03",
    title: "Actionable Intelligence",
    coverTitle: ["Actionable", "Intelligence"],
    description: "Turn structured analysis into practical next steps. RevOS helps users understand what deserves attention, which gaps or risks to address, and what actions can move the revenue process forward.",
    items: [
      "Prioritize important gaps, risks, and opportunities.",
      "Generate recommendations and targeted follow-up questions.",
      "Identify practical next steps for human review and execution."
    ],
    icon: Compass,
    bgGradient: "from-[#b2becb] to-[#042b57]",
    textColor: "text-[#F4F4F9]",
    labelColor: "text-[#F4F4F9]/75",
    descColor: "text-[#F4F4F9]/90",
    iconBg: "bg-white/15 border-white/20 text-[#F4F4F9]",
    borderColor: "border-white/10 hover:border-white/25",
    dividerBorder: "border-white/20",
    bulletBg: "bg-[#F4F4F9]"
  }
];

function InteractiveWalkthrough() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const stepRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  const panelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isUserInteractingRef = useRef<boolean>(false);
  const isIntersectingRef = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<number | null>(null);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Sync active step when user scrolls:
  // Guarded by IntersectionObserver so no scroll events or layout measurements run when offscreen
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number | null = null;

    const updateActiveStep = () => {
      if (isUserInteractingRef.current || !isIntersectingRef.current) return;
      if (window.innerWidth < 1024) return;

      const card1 = stepRefs[0].current;
      const card2 = stepRefs[1].current;
      const card3 = stepRefs[2].current;

      if (!card1 || !card2 || !card3) return;

      const card1Rect = card1.getBoundingClientRect();
      const card2Rect = card2.getBoundingClientRect();

      let nextStep = 1;
      const card1Threshold = -(card1Rect.height / 8);
      const card2Threshold = -(card2Rect.height / 8);

      if (card2Rect.top <= card2Threshold) {
        nextStep = 3;
      } else if (card1Rect.top <= card1Threshold) {
        nextStep = 2;
      } else {
        nextStep = 1;
      }

      setActiveStep((prev) => (prev !== nextStep ? nextStep : prev));
    };

    const handleScroll = () => {
      if (!isIntersectingRef.current || isUserInteractingRef.current) return;
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        updateActiveStep();
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isIntersectingRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          updateActiveStep();
        }
      },
      { rootMargin: '100px 0px 100px 0px', threshold: 0 }
    );

    observer.observe(container);

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const handleStepClick = (stepNumber: number) => {
    isUserInteractingRef.current = true;
    setActiveStep(stepNumber);

    const targetCard = stepRefs[stepNumber - 1].current;
    const panel = panelRef.current;
    if (targetCard && panel && window.innerWidth >= 1024) {
      const cardRect = targetCard.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const offset = cardRect.top - panelRect.top;
      window.scrollBy({
        top: offset,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
    }

    if (scrollTimeoutRef.current !== null) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = window.setTimeout(() => {
      isUserInteractingRef.current = false;
      scrollTimeoutRef.current = null;
    }, 700);
  };

  const panelAnimation = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.1 }
      }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.25, ease: "easeOut" as const }
      };

  return (
    <div ref={containerRef} className="pt-8 border-t border-border/60">
      <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-2">
        <span className="text-xs font-bold tracking-[0.16em] uppercase text-accent font-mono">
          INTERACTIVE WALKTHROUGH
        </span>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
          How RevOS Turns a Revenue Challenge Into Action
        </h3>
        <p className="text-sm text-text-secondary">
          Explore each stage of the assessment workflow below.
        </p>
      </div>

      {/* Responsive Layout: Desktop 2-column with sticky visual panel, Mobile interactive steps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start relative">
        
        {/* LEFT COLUMN: Narrative Steps */}
        <div className="lg:col-span-6 space-y-6 sm:space-y-8 lg:pb-72">
          
          {/* STEP 1 */}
          <div 
            ref={stepRefs[0]}
            onClick={() => handleStepClick(1)}
            className={`rounded-2xl border p-6 sm:p-8 transition-[opacity,border-color,background-color] duration-200 cursor-pointer ${
              activeStep === 1
                ? 'opacity-100 visible bg-bg-primary border-accent/80 shadow-xs ring-1 ring-accent/30'
                : 'opacity-0 invisible pointer-events-none hidden lg:block'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-md ${
                activeStep === 1 ? 'bg-accent/15 text-accent' : 'bg-bg-surface text-text-secondary'
              }`}>
                01 — Structure the Problem
              </span>
              <div className={`w-3 h-3 rounded-full transition-colors ${
                activeStep === 1 ? 'bg-accent' : 'bg-border'
              }`} />
            </div>
            
            <h4 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight mb-2.5">
              Start With the Business Problem.
            </h4>
            
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              Define the revenue challenge, clarify the desired outcome, and organize the questions and criteria that matter. RevOS provides a structured starting point for understanding what needs to be assessed.
            </p>

            <div className="border-t border-border/50 pt-3.5">
              <ul className="space-y-1.5">
                <li className="flex items-center gap-2 text-xs sm:text-sm text-text-primary">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Clarify the business challenge.</span>
                </li>
                <li className="flex items-center gap-2 text-xs sm:text-sm text-text-primary">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Define the intended outcome.</span>
                </li>
                <li className="flex items-center gap-2 text-xs sm:text-sm text-text-primary">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Establish relevant evaluation criteria.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* STEP 2 */}
          <div 
            ref={stepRefs[1]}
            onClick={() => handleStepClick(2)}
            className={`rounded-2xl border p-6 sm:p-8 transition-[opacity,border-color,background-color] duration-200 cursor-pointer ${
              activeStep === 2
                ? 'opacity-100 visible bg-bg-primary border-accent/80 shadow-xs ring-1 ring-accent/30'
                : 'opacity-0 invisible pointer-events-none hidden lg:block'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-md ${
                activeStep === 2 ? 'bg-accent/15 text-accent' : 'bg-bg-surface text-text-secondary'
              }`}>
                02 — Examine the Evidence
              </span>
              <div className={`w-3 h-3 rounded-full transition-colors ${
                activeStep === 2 ? 'bg-accent' : 'bg-border'
              }`} />
            </div>
            
            <h4 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight mb-2.5">
              Understand What the Evidence Actually Tells You.
            </h4>
            
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              Examine the available information, connect it to the assessment criteria, and distinguish supported findings from assumptions and unanswered questions. This helps users understand both what is known and what still needs validation.
            </p>

            <div className="border-t border-border/50 pt-3.5">
              <ul className="space-y-1.5">
                <li className="flex items-center gap-2 text-xs sm:text-sm text-text-primary">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Review relevant available evidence.</span>
                </li>
                <li className="flex items-center gap-2 text-xs sm:text-sm text-text-primary">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Identify assumptions and uncertainties.</span>
                </li>
                <li className="flex items-center gap-2 text-xs sm:text-sm text-text-primary">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Surface gaps that may affect the assessment.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* STEP 3 */}
          <div 
            ref={stepRefs[2]}
            onClick={() => handleStepClick(3)}
            className={`rounded-2xl border p-6 sm:p-8 transition-[opacity,border-color,background-color] duration-200 cursor-pointer ${
              activeStep === 3
                ? 'opacity-100 visible bg-bg-primary border-accent/80 shadow-xs ring-1 ring-accent/30'
                : 'opacity-0 invisible pointer-events-none hidden lg:block'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-md ${
                activeStep === 3 ? 'bg-accent/15 text-accent' : 'bg-bg-surface text-text-secondary'
              }`}>
                03 — Turn Insight Into Action
              </span>
              <div className={`w-3 h-3 rounded-full transition-colors ${
                activeStep === 3 ? 'bg-accent' : 'bg-border'
              }`} />
            </div>
            
            <h4 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight mb-2.5">
              Decide What Deserves Attention Next.
            </h4>
            
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              Translate the assessment into prioritized gaps, risks, recommendations, and next steps. RevOS helps users move from understanding a revenue challenge toward practical actions that can be evaluated, validated, and executed.
            </p>

            <div className="border-t border-border/50 pt-3.5">
              <ul className="space-y-1.5">
                <li className="flex items-center gap-2 text-xs sm:text-sm text-text-primary">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Prioritize the issues that matter most.</span>
                </li>
                <li className="flex items-center gap-2 text-xs sm:text-sm text-text-primary">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Identify actions and follow-up questions.</span>
                </li>
                <li className="flex items-center gap-2 text-xs sm:text-sm text-text-primary">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Establish the next steps for human review.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sticky Visual Explanation Panel */}
        <div className="lg:col-span-6 lg:sticky lg:top-[calc(100vh/5)] w-full">
          <div 
            ref={panelRef}
            className="bg-bg-primary rounded-2xl border border-border/80 p-6 sm:p-8 shadow-xs min-h-[460px] flex flex-col justify-between"
          >
            
            {/* Panel Top Header Bar */}
            <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse motion-reduce:animate-none" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">
                  {activeStep === 1 && "Stage 01 — Structured Problem Formulation"}
                  {activeStep === 2 && "Stage 02 — Evidence-Informed Assessment"}
                  {activeStep === 3 && "Stage 03 — Action Plan & Priority Guidance"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-text-secondary font-mono">
                <span className="text-accent font-bold">0{activeStep}</span>
                <span>/</span>
                <span>03</span>
              </div>
            </div>

            {/* Animated Panel Body */}
            <div className="flex-1">
              <AnimatePresence mode="wait">
                {/* VISUAL PANEL 1: STRUCTURED PROBLEM */}
                {activeStep === 1 && (
                  <motion.div
                    key="step-1-panel"
                    {...panelAnimation}
                    className="space-y-4"
                  >
                    {/* Field 1: Business Challenge */}
                    <div className="bg-bg-surface rounded-xl border border-border/70 p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-accent">
                          BUSINESS CHALLENGE
                        </span>
                        <span className="text-[10px] text-text-secondary font-mono">Input definition</span>
                      </div>
                      <div className="text-sm font-semibold text-text-primary">
                        What needs to improve?
                      </div>
                      <p className="text-xs text-text-secondary mt-1">
                        Core revenue execution breakdown, affected deal segments, and pipeline bottlenecks.
                      </p>
                    </div>

                    {/* Field 2: Desired Outcome */}
                    <div className="bg-bg-surface rounded-xl border border-border/70 p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-accent">
                          DESIRED OUTCOME
                        </span>
                        <span className="text-[10px] text-text-secondary font-mono">Target state</span>
                      </div>
                      <div className="text-sm font-semibold text-text-primary">
                        What does success look like?
                      </div>
                      <p className="text-xs text-text-secondary mt-1">
                        Target win-rate recovery, margin preservation thresholds, and cycle-time velocity goals.
                      </p>
                    </div>

                    {/* Field 3: Assessment Criteria */}
                    <div className="bg-bg-surface rounded-xl border border-border/70 p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-accent">
                          ASSESSMENT CRITERIA
                        </span>
                        <span className="text-[10px] text-text-secondary font-mono">Evaluation framework</span>
                      </div>
                      <div className="text-sm font-semibold text-text-primary">
                        What do we need to understand?
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        <span className="px-2 py-0.5 rounded-md bg-bg-primary text-[11px] text-text-secondary border border-border/60">
                          Economic buyer criteria
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-bg-primary text-[11px] text-text-secondary border border-border/60">
                          Verified business pain
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-bg-primary text-[11px] text-text-secondary border border-border/60">
                          Decision timeline
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-bg-primary text-[11px] text-text-secondary border border-border/60">
                          Competitive exposure
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* VISUAL PANEL 2: EVIDENCE ASSESSMENT */}
                {activeStep === 2 && (
                  <motion.div
                    key="step-2-panel"
                    {...panelAnimation}
                    className="space-y-4"
                  >
                    {/* Group 1: Supported by evidence */}
                    <div className="bg-bg-surface rounded-xl border border-emerald-500/30 p-4 relative overflow-hidden">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-mono font-bold uppercase tracking-wider">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          SUPPORTED BY EVIDENCE
                        </span>
                        <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-mono font-semibold">Validated</span>
                      </div>
                      <div className="text-sm font-medium text-text-primary mt-1">
                        Information that supports an assessment.
                      </div>
                      <p className="text-xs text-text-secondary mt-1">
                        Verified customer budget sign-off and mutual technical evaluation criteria confirmed in meeting transcripts.
                      </p>
                    </div>

                    {/* Group 2: Assumption to validate */}
                    <div className="bg-bg-surface rounded-xl border border-amber-500/30 p-4 relative overflow-hidden">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-mono font-bold uppercase tracking-wider">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          ASSUMPTION TO VALIDATE
                        </span>
                        <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-mono font-semibold">Requires test</span>
                      </div>
                      <div className="text-sm font-medium text-text-primary mt-1">
                        A plausible interpretation that needs confirmation.
                      </div>
                      <p className="text-xs text-text-secondary mt-1">
                        Belief that the internal champion has unilateral signing authority without procurement board escalation.
                      </p>
                    </div>

                    {/* Group 3: Information needed */}
                    <div className="bg-bg-surface rounded-xl border border-sky-500/30 p-4 relative overflow-hidden">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[11px] font-mono font-bold uppercase tracking-wider">
                          <HelpCircle className="w-3.5 h-3.5" />
                          INFORMATION NEEDED
                        </span>
                        <span className="text-[10px] text-sky-600/80 dark:text-sky-400/80 font-mono font-semibold">Missing gap</span>
                      </div>
                      <div className="text-sm font-medium text-text-primary mt-1">
                        A missing detail or unanswered question.
                      </div>
                      <p className="text-xs text-text-secondary mt-1">
                        Customer's formal legal review checklist and security questionnaire completion timeline.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* VISUAL PANEL 3: ACTION PLAN */}
                {activeStep === 3 && (
                  <motion.div
                    key="step-3-panel"
                    {...panelAnimation}
                    className="space-y-4"
                  >
                    {/* Field 1: Priority */}
                    <div className="bg-bg-surface rounded-xl border border-border/70 p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-accent">
                          PRIORITY
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-accent/15 text-accent text-[10px] font-bold font-mono">
                          High Focus
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-text-primary">
                        What deserves attention first?
                      </div>
                      <p className="text-xs text-text-secondary mt-1">
                        Address the unverified executive sponsor and resolve concession trade-offs before contract renegotiation.
                      </p>
                    </div>

                    {/* Field 2: Recommended Action */}
                    <div className="bg-bg-surface rounded-xl border border-border/70 p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-accent">
                          RECOMMENDED ACTION
                        </span>
                        <span className="text-[10px] text-text-secondary font-mono">Targeted intervention</span>
                      </div>
                      <div className="text-sm font-semibold text-text-primary">
                        What should be investigated or addressed?
                      </div>
                      <p className="text-xs text-text-secondary mt-1">
                        Schedule mutual alignment workshop with the VP of Engineering to validate critical technical decision criteria.
                      </p>
                    </div>

                    {/* Field 3: Next Step */}
                    <div className="bg-bg-surface rounded-xl border border-border/70 p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-accent">
                          NEXT STEP
                        </span>
                        <span className="text-[10px] text-text-secondary font-mono">Execution assignment</span>
                      </div>
                      <div className="text-sm font-semibold text-text-primary">
                        Who needs to do what next?
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs p-2 rounded-lg bg-bg-primary border border-border/60">
                        <span className="font-medium text-text-primary">Enterprise Deal Team & Presales Lead</span>
                        <span className="font-mono text-[11px] text-accent">Assign & Follow Up</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Panel Footer Navigation Bar */}
            <div className="border-t border-border/60 pt-4 mt-6 flex items-center justify-between">
              <div className="flex gap-2">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleStepClick(num)}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      activeStep === num ? 'w-8 bg-accent' : 'w-2 bg-border hover:bg-border/80'
                    }`}
                    aria-label={`Switch to step ${num}`}
                  />
                ))}
              </div>
              <span className="text-[11px] text-text-secondary font-mono">
                Click steps or scroll to explore
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RevosMechanismSection() {
  const [activePillar, setActivePillar] = useState<number>(1);

  return (
    <section 
      id="revos-mechanism" 
      className="relative w-full bg-bg-surface py-20 lg:py-28 px-4 sm:px-6 lg:px-8 border-b border-border/60 transition-colors duration-400"
    >
      <div className="max-w-7xl mx-auto">
        {/* 1. SECTION INTRODUCTION */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bg-primary border border-border/80 text-xs font-bold tracking-[0.16em] uppercase text-accent">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>REVOS MECHANISM</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-text-primary tracking-tight leading-tight">
            Move From Revenue Complexity to Structured Action.
          </h2>

          <p className="text-base sm:text-lg text-text-secondary leading-relaxed pt-2 max-w-2xl mx-auto">
            Revenue challenges rarely have a single obvious cause. RevOS combines structured revenue methodologies with AI-powered reasoning to help you organize the problem, examine the available evidence, and identify the actions worth taking next.
          </p>
        </div>

        {/* 2. THREE CORE MECHANISM PILLARS */}
        <div className="mb-20 lg:mb-28">
          <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start relative">
            {/* Connecting line on desktop */}
            <div className="hidden md:block absolute top-1/3 left-[15%] right-[15%] -translate-y-8 h-[2px] bg-gradient-to-r from-accent/20 via-accent/40 to-accent/20 z-0 pointer-events-none" />

            {PILLARS_DATA.map((pillar) => {
              const isOpened = activePillar === pillar.id;
              const IconComponent = pillar.icon;

              return (
                <div
                  key={pillar.id}
                  style={{ flex: isOpened ? 1.25 : 0.875 }}
                  className="w-full relative z-10 transition-all duration-500 ease-in-out min-w-0"
                >
                  <AnimatePresence mode="wait">
                    {isOpened ? (
                      <motion.div
                        key={`full-${pillar.id}`}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.28, ease: "easeOut" }}
                        className={`w-full bg-gradient-to-br ${pillar.bgGradient} ${pillar.textColor} rounded-2xl md:rounded-3xl border ${pillar.borderColor} p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-300`}
                      >
                        <div>
                          <div className={`w-12 h-12 rounded-xl backdrop-blur-xs border flex items-center justify-center mb-6 shadow-xs ${pillar.iconBg}`}>
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <div className={`text-xs font-mono font-semibold uppercase tracking-wider mb-1 ${pillar.labelColor}`}>
                            {pillar.label}
                          </div>
                          <h3 className={`text-xl sm:text-2xl font-bold tracking-tight mb-3 ${pillar.textColor}`}>
                            {pillar.title}
                          </h3>
                          <p className={`text-sm leading-relaxed mb-6 ${pillar.descColor}`}>
                            {pillar.description}
                          </p>
                        </div>

                        <div className={`border-t pt-4 mt-2 ${pillar.dividerBorder}`}>
                          <ul className="space-y-2.5">
                            {pillar.items.map((item, idx) => (
                              <li key={idx} className={`flex items-start gap-2.5 text-xs sm:text-sm ${pillar.textColor}`}>
                                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${pillar.bulletBg}`} />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={`cover-${pillar.id}`}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        onMouseEnter={() => setActivePillar(pillar.id)}
                        onClick={() => setActivePillar(pillar.id)}
                        className={`aspect-[5/3] w-full rounded-2xl md:rounded-3xl p-6 sm:p-7 flex flex-col justify-end bg-gradient-to-br ${pillar.bgGradient} ${pillar.textColor} border ${pillar.borderColor} shadow-xs hover:shadow-lg cursor-pointer transition-all duration-300 group`}
                        aria-label={`Open ${pillar.title}`}
                      >
                        <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight leading-tight select-none group-hover:scale-[1.02] transition-transform duration-200">
                          {pillar.coverTitle[0]}
                          <br />
                          {pillar.coverTitle[1]}
                        </h3>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Sequential Relationship Indicator */}
          <div className="mt-8 text-center">
            <span className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-text-secondary font-medium">
              <span>Methodology establishes structure</span>
              <ArrowRight className="w-3.5 h-3.5 text-accent shrink-0" />
              <span>Evidence-informed reasoning develops assessment</span>
              <ArrowRight className="w-3.5 h-3.5 text-accent shrink-0" />
              <span>Actionable intelligence guides next steps</span>
            </span>
          </div>
        </div>

        {/* 3. SCROLL-DRIVEN / INTERACTIVE EXPLANATORY SEQUENCE */}
        <InteractiveWalkthrough />

        {/* 4. CLOSING STATEMENT */}
        <div className="mt-20 lg:mt-28 pt-12 border-t border-border/60 text-center max-w-3xl mx-auto">
          <p className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight leading-snug">
            “Better-informed decisions. Clearer priorities. More structured next steps.”
          </p>
          <p className="text-sm sm:text-base text-text-secondary mt-3.5 leading-relaxed">
            RevOS helps turn complex revenue challenges into a more systematic process for assessment, prioritization, and action.
          </p>
        </div>
      </div>
    </section>
  );
}
