import { motion, Variants } from 'motion/react';
import { 
  Compass, 
  Layers, 
  Workflow, 
  Cpu, 
  UserCheck, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight,
  GitMerge,
  ShieldCheck,
  Binary,
  Target,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
  }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

export function WhyIBuiltRevosSection() {
  return (
    <div id="why-i-built-revos" className="w-full flex flex-col bg-bg-primary text-text-primary selection:bg-accent/20">
      
      {/* =========================================================================
          SECTION OPENING — Editorial Header & Founder Vision Card
          ========================================================================= */}
      <section className="w-full py-20 lg:py-28 px-4 sm:px-6 lg:px-8 border-b border-border bg-gradient-to-b from-bg-primary via-bg-surface/30 to-bg-primary">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center"
          >
            {/* Left Column: Narrative Headline */}
            <div className="lg:col-span-7 flex flex-col space-y-6">
              <motion.div variants={sectionVariants}>
                <span className="text-xs font-semibold tracking-widest text-accent uppercase font-mono">
                  ABOUT THE FOUNDER
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text-primary mt-3 leading-[1.15]">
                  Why I Built RevOS
                </h2>
                <p className="text-lg sm:text-xl text-accent font-medium mt-4 leading-relaxed">
                  A belief shaped by experience. A vision built for better revenue decisions.
                </p>
              </motion.div>

              <motion.div variants={sectionVariants} className="space-y-4 text-text-secondary text-base sm:text-lg leading-relaxed pt-2">
                <p>
                  Throughout my career, I have worked at the intersection of technology, business strategy and transformation.
                </p>
                <p>
                  Across enterprise technology, industrial software and digital transformation, one lesson has stayed with me: technology creates real value not simply because it is powerful, but because it helps people understand complex problems, make better decisions and turn those decisions into meaningful business outcomes.
                </p>
              </motion.div>
            </div>

            {/* Right Column: Abstract Executive Architectural Monogram & Statement */}
            <motion.div variants={sectionVariants} className="lg:col-span-5">
              <div className="relative rounded-2xl border border-accent/20 bg-bg-surface p-8 sm:p-10 shadow-lg transition-all duration-300 hover:border-accent/60 hover:shadow-xl hover:border-[3px]">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-border/80">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text-primary tracking-wide">RevOS Narrative</h3>
                      <p className="text-xs text-text-secondary">Executive Genesis</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-accent">00 // INTENT</span>
                </div>

                <blockquote className="space-y-4 text-text-primary text-base sm:text-lg font-medium italic border-l-2 border-accent pl-4">
                  "Technology creates real value not simply because it is powerful, but because it helps people understand complex problems, make better decisions and turn those decisions into meaningful business outcomes."
                </blockquote>

                <div className="mt-8 pt-6 border-t border-border/80 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Paul W.</p>
                    <p className="text-xs text-text-secondary">Founder & Architect, RevOS</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-text-secondary uppercase">Enterprise AI-Native</p>
                    <p className="text-xs font-mono text-accent">Revenue Operating System</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* =========================================================================
          MOVEMENT 1 — What I Learned
          ========================================================================= */}
      <section className="w-full py-20 lg:py-24 px-4 sm:px-6 lg:px-8 border-b border-border bg-bg-surface">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="space-y-12"
          >
            {/* Header */}
            <div className="max-w-3xl">
              <span className="text-xs font-mono tracking-widest text-accent uppercase">
                Movement 01 — What I Learned
              </span>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-text-primary mt-2">
                Technology Creates Value When It Solves Real Problems.
              </h3>
              <div className="mt-6 space-y-4 text-text-secondary text-base sm:text-lg leading-relaxed">
                <p>
                  I have seen how much organizations invest in technology, data, people and processes. Yet having more information or more tools does not automatically lead to better results.
                </p>
                <p>
                  The real challenge is often connecting what an organization wants to achieve with how it understands its situation, evaluates its options and executes the right actions.
                </p>
              </div>
            </div>

            {/* Visual Progression: The Value Realization Chain */}
            <div className="pt-4">
              <p className="text-xs font-mono tracking-wider text-text-secondary uppercase mb-6">
                The Realization Progression — From Investment to Commercial Value
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                {[
                  {
                    step: "01",
                    title: "Technology & Data",
                    subtitle: "Infrastructure",
                    description: "CapEx & tools deployed across systems"
                  },
                  {
                    step: "02",
                    title: "Information",
                    subtitle: "Raw Signals",
                    description: "Activity records, metrics & transaction logs"
                  },
                  {
                    step: "03",
                    title: "Understanding",
                    subtitle: "Contextual Clarity",
                    description: "Diagnosing root causes and evaluating constraints"
                  },
                  {
                    step: "04",
                    title: "Decisions",
                    subtitle: "Strategic Reasoning",
                    description: "Choosing prioritized trade-offs with high conviction"
                  },
                  {
                    step: "05",
                    title: "Outcomes",
                    subtitle: "Realized Value",
                    description: "Sustainable revenue growth & organizational margin"
                  }
                ].map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-5 rounded-xl border border-border bg-bg-primary hover:border-accent/60 transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-mono text-accent font-semibold">{item.step}</span>
                        {idx < 4 && (
                          <ArrowRight className="w-4 h-4 text-text-secondary/40 group-hover:text-accent transition-colors hidden md:block" />
                        )}
                      </div>
                      <h4 className="text-base font-bold text-text-primary group-hover:text-accent transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-accent font-medium mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                    <p className="text-xs text-text-secondary mt-4 leading-normal">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* =========================================================================
          MOVEMENT 2 — What I Observed
          ========================================================================= */}
      <section className="w-full py-20 lg:py-24 px-4 sm:px-6 lg:px-8 border-b border-border bg-bg-primary">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="space-y-12"
          >
            {/* Header */}
            <div className="max-w-3xl">
              <span className="text-xs font-mono tracking-widest text-accent uppercase">
                Movement 02 — What I Observed
              </span>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-text-primary mt-2">
                Revenue Growth Is a Connected Challenge.
              </h3>
              <div className="mt-6 space-y-4 text-text-secondary text-base sm:text-lg leading-relaxed">
                <p>
                  Over time, I began to recognize a similar challenge in revenue management.
                </p>
                <p>
                  Revenue growth is one of the most important priorities for any business, yet the activities that drive it are often fragmented. Go-to-market strategy, lead qualification, opportunity assessment, competitive positioning and sales execution can be managed through different processes, tools and individual approaches.
                </p>
                <p>
                  Information is available, but turning it into useful intelligence is difficult. Decisions are made, but the reasoning behind them is not always structured or consistent. Risks are identified, but translating those insights into the right actions remains a challenge.
                </p>
              </div>
            </div>

            {/* Visual Representation of Disconnected Elements */}
            <div className="p-8 sm:p-10 rounded-2xl border border-border bg-bg-surface shadow-lg">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 mb-8 border-b border-border">
                <div>
                  <h4 className="text-lg font-bold text-text-primary">
                    The Fragmented Revenue Process
                  </h4>
                  <p className="text-sm text-text-secondary mt-1">
                    Isolated functional silos operate on disconnected data, tools, and personal intuitions
                  </p>
                </div>
                <div className="mt-3 md:mt-0">
                  <span className="text-xs font-mono text-alert-red font-medium tracking-wide">
                    STATUS QUO // SILOED EXECUTION
                  </span>
                </div>
              </div>

              {/* 5 Disconnected Nodes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  {
                    title: "Go-to-Market Strategy",
                    symptom: "Macro assumptions detached from field reality",
                    icon: Compass
                  },
                  {
                    title: "Lead Qualification",
                    symptom: "Surface criteria without evidence verification",
                    icon: Target
                  },
                  {
                    title: "Opportunity Assessment",
                    symptom: "Subjective pipeline scoring and hidden deal risks",
                    icon: Layers
                  },
                  {
                    title: "Competitive Positioning",
                    symptom: "Static battlecards ignored in active deal cycles",
                    icon: ShieldCheck
                  },
                  {
                    title: "Sales Execution",
                    symptom: "Unstructured rep habits without systematic learning",
                    icon: Workflow
                  }
                ].map((node, i) => (
                  <div 
                    key={i} 
                    className="p-5 rounded-xl border border-dashed border-border bg-accent/5 hover:bg-accent/15 flex flex-col justify-between hover:border-accent/60 hover:shadow-lg transition-colors"
                  >
                    <div>
                      <div className="w-8 h-8 rounded-md bg-accent/5 border border-accent/20 flex items-center justify-center text-accent mb-3">
                        <node.icon className="w-4 h-4" />
                      </div>
                      <h5 className="text-sm font-bold text-text-primary">{node.title}</h5>
                    </div>
                    <div className="mt-4 pt-3 border-t border-border/60">
                      <p className="text-xs text-text-secondary leading-snug">{node.symptom}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Transition Note */}
              <div className="mt-8 pt-6 border-t border-border text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-sm text-text-secondary max-w-2xl">
                  <strong className="text-text-primary font-semibold">The Core Problem:</strong> Having multiple CRM records, BI dashboards, and communication apps does not create a cohesive thinking framework. The gap is in structured revenue intelligence.
                </p>
                <div className="text-xs font-mono text-accent whitespace-nowrap self-start sm:self-center">
                  THE NEED: REASONING OVER RECORD-KEEPING
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* =========================================================================
          MOVEMENT 3 — The Question (Central Turning Point)
          ========================================================================= */}
      <section className="w-full py-24 lg:py-32 px-4 sm:px-6 lg:px-8 border-b border-border bg-bg-hero-primary text-text-hero-primary relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,163,224,0.08)_0,transparent_70%)] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="space-y-8"
          >
            <motion.div variants={sectionVariants}>
              <span className="text-xs font-mono tracking-widest text-accent uppercase font-semibold">
                Movement 03 — The Question
              </span>
            </motion.div>

            {/* Central Visual Question */}
            <motion.blockquote variants={sectionVariants} className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
              “What if we could bring a more structured, intelligent and connected way of thinking to the entire revenue process?”
            </motion.blockquote>

            {/* Deliberate Editorial Pause & Supporting Narrative */}
            <motion.div variants={sectionVariants} className="max-w-5xl mx-auto pt-4">
              <p className="text-lg sm:text-xl text-text-hero-secondary leading-relaxed font-normal">
                Not another system simply designed to record sales activities or manage customer relationships, but an operating system that helps people understand revenue challenges, evaluate available evidence, reason through complex situations and determine what to do next.
              </p>
            </motion.div>

            <motion.div variants={sectionVariants} className="pt-6 flex justify-center">
              <div className="h-10 w-px bg-gradient-to-b from-accent to-transparent" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* =========================================================================
          MOVEMENT 4 — The Conviction
          ========================================================================= */}
      <section className="w-full py-20 lg:py-24 px-4 sm:px-6 lg:px-8 border-b border-border bg-bg-surface">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="space-y-12"
          >
            {/* Header */}
            <div className="max-w-3xl">
              <span className="text-xs font-mono tracking-widest text-accent uppercase">
                Movement 04 — The Conviction
              </span>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-text-primary mt-2">
                AI Should Strengthen Human Thinking, Not Replace It.
              </h3>
              <div className="mt-6 space-y-4 text-text-secondary text-base sm:text-lg leading-relaxed">
                <p>
                  The emergence of AI made this vision increasingly practical.
                </p>
                <p>
                  I saw an opportunity to combine structured business methodologies with AI reasoning—not to replace human experience or judgment, but to make rigorous thinking more accessible, systematic and actionable.
                </p>
              </div>
            </div>

            {/* The Four Foundational Principles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  number: "01",
                  title: "Structure Before Assumptions",
                  summary: "Start with a structured methodology rather than relying entirely on intuition.",
                  badge: "Methodology",
                  icon: Compass
                },
                {
                  number: "02",
                  title: "Evidence Before Conclusions",
                  summary: "Ground analysis in available information and recognize what is still unknown.",
                  badge: "Epistemic Rigor",
                  icon: Binary
                },
                {
                  number: "03",
                  title: "Reasoning Before Recommendations",
                  summary: "Use AI to help examine context, identify gaps and evaluate possible implications.",
                  badge: "AI Reasoning",
                  icon: Cpu
                },
                {
                  number: "04",
                  title: "Human Judgment Remains Essential",
                  summary: "Keep people responsible for reviewing insights and making business decisions.",
                  badge: "Human Authority",
                  icon: UserCheck,
                  isHighlight: true
                }
              ].map((principle, index) => (
                <div
                  key={index}
                  className={`p-6 sm:p-7 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                    principle.isHighlight 
                      ? 'border-accent bg-accent/5 shadow-md ring-1 ring-accent/30' 
                      : 'border-border bg-bg-primary hover:border-accent/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-mono font-bold text-accent">
                        {principle.number}
                      </span>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-text-secondary">
                        {principle.badge}
                      </span>
                    </div>
                    
                    <div className="w-10 h-10 rounded-xl bg-bg-surface border border-border flex items-center justify-center text-accent mb-4">
                      <principle.icon className="w-5 h-5" />
                    </div>

                    <h4 className="text-lg font-bold text-text-primary mb-2">
                      {principle.title}
                    </h4>
                  </div>

                  <p className="text-sm text-text-secondary leading-relaxed mt-4 pt-4 border-t border-border/60">
                    {principle.summary}
                  </p>
                </div>
              ))}
            </div>

            {/* AI Responsibility Notice */}
            <div className="p-4 rounded-xl border border-border bg-bg-primary/50 flex items-center space-x-3 text-xs text-text-secondary">
              <ShieldCheck className="w-5 h-5 text-accent shrink-0" />
              <span>
                <strong>Architectural Tenet:</strong> RevOS uses AI reasoning to interrogate assumptions, compute multidimensional risk, and surface hidden gaps. It does not replace executive accountability or make unilateral decisions.
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* =========================================================================
          MOVEMENT 5 — What I Set Out to Build
          ========================================================================= */}
      <section className="w-full py-20 lg:py-24 px-4 sm:px-6 lg:px-8 border-b border-border bg-bg-primary">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="space-y-12"
          >
            {/* Header */}
            <div className="max-w-3xl">
              <span className="text-xs font-mono tracking-widest text-accent uppercase">
                Movement 05 — What I Set Out to Build
              </span>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-text-primary mt-2">
                That Conviction Became the Foundation of RevOS.
              </h3>
              <div className="mt-6 space-y-4 text-text-secondary text-base sm:text-lg leading-relaxed">
                <p>
                  I built RevOS to bring together the thinking behind go-to-market strategy, lead qualification and pipeline assessment within an AI-native Revenue Operating System.
                </p>
                <p>
                  Its purpose is straightforward: help people approach revenue challenges with greater structure, make better-informed decisions and turn strategy into sustainable growth.
                </p>
              </div>
            </div>

            {/* Convergence Architecture: The 3 Core RevOS Engines */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Engine 1: GTMOS */}
              <div className="p-8 rounded-2xl border border-border bg-gtm/20 hover:bg-gtm/60 shadow-lghover:border-accent/60 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                    <span className="text-xs font-mono font-semibold text-accent uppercase">
                      Engine 01 // Strategy
                    </span>
                    <Compass className="w-5 h-5 text-accent" />
                  </div>
                  <h4 className="text-xl font-bold text-text-primary mb-3 group-hover:text-accent transition-colors">
                    Go-to-Market Strategy (GTMOS)
                  </h4>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Formulates structured market entry, ICP definition, and competitive positioning with rigorous strategic frameworks.
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-border/80">
                  <div className="flex items-center text-xs font-medium text-text-secondary space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                    <span>From Intuition to Repeatable Methodology</span>
                  </div>
                </div>
              </div>

              {/* Engine 2: Lead Qualification */}
              <div className="p-8 rounded-2xl border border-border bg-lead/20 hover:bg-lead/60 shadow-lg hover:border-accent/60 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                    <span className="text-xs font-mono font-semibold text-accent uppercase">
                      Engine 02 // Validation
                    </span>
                    <Target className="w-5 h-5 text-accent" />
                  </div>
                  <h4 className="text-xl font-bold text-text-primary mb-3 group-hover:text-accent transition-colors">
                    Lead Qualification
                  </h4>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Evaluates available evidence, validates real purchasing intent, and identifies missing context before committing enterprise sales effort.
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-border/80">
                  <div className="flex items-center text-xs font-medium text-text-secondary space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                    <span>Evidence-Grounded Prospect Evaluation</span>
                  </div>
                </div>
              </div>

              {/* Engine 3: Pipeline Assessment */}
              <div className="p-8 rounded-2xl border border-border bg-pipeline/20 hover:bg-pipeline/60 shadow-lg hover:border-accent/60 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                    <span className="text-xs font-mono font-semibold text-accent uppercase">
                      Engine 03 // Execution
                    </span>
                    <TrendingUp className="w-5 h-5 text-accent" />
                  </div>
                  <h4 className="text-xl font-bold text-text-primary mb-3 group-hover:text-accent transition-colors">
                    Pipeline Assessment
                  </h4>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Surfaces hidden deal risks, evaluates closing probability, and formulates structured action plans for executive deal reviews.
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-border/80">
                  <div className="flex items-center text-xs font-medium text-text-secondary space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                    <span>Predictable, Risk-Aware Revenue Realization</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* =========================================================================
          CLOSING NARRATIVE — The Founder's Belief
          ========================================================================= */}
      <section className="w-full py-24 lg:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-bg-surface via-bg-primary to-bg-surface border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="space-y-8"
          >
            <motion.div variants={sectionVariants}>
              <span className="text-xs font-mono tracking-widest text-accent uppercase font-semibold">
                THE FOUNDER'S BELIEF
              </span>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text-primary mt-3">
                “That is why I built RevOS.”
              </h3>
            </motion.div>

            <motion.div variants={sectionVariants} className="max-w-3xl mx-auto space-y-4 text-text-secondary text-base sm:text-lg leading-relaxed">
              <p>
                Not just to build another software platform, but to offer a better way of thinking about revenue growth.
              </p>
              <p>
                Because when businesses think more clearly about their revenue challenges, they make better decisions. And better decisions create lasting value.
              </p>
            </motion.div>

            <motion.div variants={sectionVariants} className="pt-4">
              <p className="text-xl sm:text-2xl font-bold text-accent tracking-tight">
                Better revenue outcomes begin with better thinking.
              </p>
            </motion.div>

            {/* Thoughtful, non-aggressive navigational links */}
            <motion.div variants={sectionVariants} className="pt-8 flex flex-wrap items-center justify-center gap-4 text-sm font-medium">
              <Link 
                to="/about/aboutRevos" 
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border bg-bg-surface hover:border-accent hover:text-accent transition-all text-text-primary"
              >
                <span>Explore Platform Architecture</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link 
                to="/product" 
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border bg-bg-surface hover:border-accent hover:text-accent transition-all text-text-primary"
              >
                <span>View RevOS Engines</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link 
                to="/about/contact" 
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-white hover:opacity-90 transition-all font-semibold shadow-sm"
              >
                <span>Connect with Founder</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
