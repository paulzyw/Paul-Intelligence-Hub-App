import { useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Target, 
  CheckCircle2, 
  LineChart, 
  Info,
  ArrowRight
} from 'lucide-react';
import { STORY_SCENES, StoryScene } from './theme-story/story-data';
import RevosInActionScrollingAnimation from './revosInAction_scrollingAnimation';

interface CapabilityCard {
  id: string;
  badge: string;
  title: string;
  description: string;
  icon: typeof Target;
}

const CAPABILITY_CARDS: CapabilityCard[] = [
  {
    id: 'gtmos',
    badge: 'Strategy',
    title: 'GTMOS',
    description: 'Structure and organize go-to-market strategy, including target markets, ideal customer profiles, value propositions, messaging, and revenue approach.',
    icon: Target,
  },
  {
    id: 'lead-qualification',
    badge: 'Qualification',
    title: 'Lead Qualification',
    description: 'Support MQL, SQL, and Opportunity Qualification through structured evaluation of lead and opportunity fit, readiness, evidence, risks, and progression.',
    icon: CheckCircle2,
  },
  {
    id: 'opportunity-assessment',
    badge: 'Assessment',
    title: 'Pipeline Assessment',
    description: 'Help sales professionals examine pipeline strengths, gaps, risks, competitive factors, and potential winning actions.',
    icon: LineChart,
  },
];

export default function RevosInAction() {
  const [activeScene, setActiveScene] = useState<StoryScene>(STORY_SCENES[0]);

  return (
    <section 
      id="see-revos-in-action"
      aria-label="See RevOS in Action"
      className="w-full bg-bg-primary text-text-primary py-20 lg:py-28 px-4 sm:px-6 lg:px-8 border-b border-border/60 transition-colors duration-400"
    >
      <div className="max-w-7xl mx-auto">
        
        {/* 1. Section Header Matching RevOS Mechanism Typography */}
        <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-bg-surface border border-border/80 text-xs font-bold tracking-[0.16em] uppercase text-accent shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>SEE REVOS IN ACTION</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-text-primary tracking-tight leading-tight">
            Turn Revenue Challenge into Decisions and Action
          </h2>

          <p className="text-base sm:text-lg text-text-secondary leading-relaxed pt-2 max-w-3xl mx-auto">
            RevOS helps sales professionals and revenue teams turn the information they have into structured assessments, clearer priorities, and actionable decisions across the revenue lifecycle. From go-to-market strategy and lead qualification to opportunity (pipeline) assessment, RevOS combines structured methodologies with evidence-informed AI reasoning to help you understand what matters and determine what to do next.
          </p>
        </div>

        {/* 2. Compact Capability Introduction Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 lg:mb-24">
          {CAPABILITY_CARDS.map((cap, index) => {
            const IconComponent = cap.icon;
            return (
              <motion.div
                key={cap.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.35,
                  delay: index * 0.08,
                  ease: "easeOut"
                }}
                className="bg-bg-surface rounded-2xl border border-border/80 hover:border-accent/50 p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 shadow-xs hover:shadow-md group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:scale-105 transition-transform">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-accent px-2.5 py-1 rounded-md bg-accent/10 border border-accent/20">
                      {cap.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-text-primary tracking-tight mb-2.5">
                    {cap.title}
                  </h3>

                  <p className="text-sm text-text-secondary leading-relaxed">
                    {cap.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* 3. Sub-section: One Example: SQL Qualification */}
        <div className="pt-14 sm:pt-20 pb-12 sm:pb-16 border-t border-border/70 my-6 sm:my-8">
          <div className="text-center max-w-4xl mx-auto space-y-4">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-xs font-mono font-bold tracking-[0.14em] uppercase text-accent shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>ONE EXAMPLE: SQL QUALIFICATION</span>
            </div>

            {/* H2 */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-text-primary tracking-tight leading-tight">
              From MQL to SQL: Turn Customer Evidence Into Qualification Decisions
            </h2>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed pt-1 max-w-4xl mx-auto">
              A promising lead is not yet a qualified sales opportunity. See how RevOS applies its structured, evidence-informed approach to SQL Qualification—carrying information of customer’s fit, intent, engagement, and timing etc., forward customer context from MQL qualification, evaluating updated evidence across 10 qualification dimensions, identifying supporting evidence and risks, and recommending the next actions needed to determine whether the opportunity warrants promotion to SQL.
            </p>

            {/* Clarification */}
            <div className="pt-2">
              <div className="inline-flex items-start sm:items-center gap-2.5 px-4 py-2.5 rounded-xl bg-bg-surface border border-border/90 text-xs sm:text-sm text-text-secondary shadow-xs max-w-3xl mx-auto text-left sm:text-center">
                <Info className="w-4 h-4 text-accent shrink-0 mt-0.5 sm:mt-0" />
                <span>
                  &ldquo;This is one example of how RevOS turns information into a structured sales decision—not a demonstration of every RevOS capability.&rdquo;
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Existing Scrolling Animation Part (Split Screen Container) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start relative">
          
          {/* Left Column: Sticky Visual Panel */}
          <div className="lg:col-span-6 lg:sticky lg:top-24 w-full h-[380px] sm:h-[450px] lg:h-[calc(100vh-160px)] flex items-center justify-center z-10">
            <div className="w-full h-full max-w-xl mx-auto">
              <RevosInActionScrollingAnimation activeScene={activeScene} />
            </div>
          </div>

          {/* Right Column: Scrolling Narrative Cards */}
          <div className="lg:col-span-6 space-y-[30vh] lg:space-y-[40vh] pb-[20vh] lg:pb-[30vh]">
            {STORY_SCENES.map((scene) => {
              const isActive = activeScene.id === scene.id;

              return (
                <motion.div
                  key={scene.id}
                  id={scene.id}
                  // viewport: when 45% of the card is visible in the viewport, activate this scene
                  onViewportEnter={() => {
                    setActiveScene(scene);
                  }}
                  viewport={{ amount: 0.45 }}
                  initial={{ opacity: 0.15, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`relative p-8 rounded-2xl border transition-all duration-500 group ${
                    isActive 
                      ? 'bg-bg-surface border-border shadow-lg shadow-black/5 dark:shadow-black/40' 
                      : 'bg-bg-surface/50 border-border/50 hover:border-border'
                  }`}
                >
                  {/* Decorative Side Highlight */}
                  <div className={`absolute top-0 bottom-0 left-0 w-[3px] rounded-l-2xl transition-all duration-700 ${
                    isActive 
                      ? `bg-gradient-to-b ${scene.accentColor} opacity-100` 
                      : 'bg-transparent opacity-0'
                  }`} />

                  {/* Chapter Badge */}
                  <div className="flex justify-between items-center mb-6">
                    <span className="font-mono text-3xl font-extrabold text-text-secondary/40 group-hover:text-text-secondary/70 transition-colors duration-400">
                      {scene.chapter}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[10px] tracking-wider uppercase font-mono font-bold border transition-colors duration-300 ${
                      isActive 
                        ? 'text-text-primary bg-bg-surface border-border/80 shadow-xs' 
                        : 'text-text-secondary bg-bg-primary border-border/40'
                    }`}>
                      {scene.badgeText}
                    </span>
                  </div>

                  {/* Card Main Header */}
                  <h3 className={`text-xl sm:text-2xl font-bold tracking-tight mb-4 transition-colors duration-400 ${
                    isActive ? 'text-text-primary' : 'text-text-secondary'
                  }`}>
                    {scene.title}
                  </h3>

                  {/* Supporting Copy / Structured Fields */}
                  <div className="space-y-4">
                    {scene.fields.map((field, idx) => {
                      const isBlock = field.value.length > 55 || field.value.startsWith('"') || field.value.startsWith('“');
                      return (
                        <div key={idx} className="text-sm sm:text-base leading-relaxed">
                          <span className={`font-semibold text-text-primary ${isBlock ? 'block mb-1' : ''}`}>
                            {field.label}:{' '}
                          </span>
                          <span className={`text-text-secondary ${field.label === 'Recommendation' ? 'italic font-medium' : ''}`}>
                            {field.value}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}

            {/* Final Call To Action Card */}
            <motion.div
              initial={{ opacity: 0.15, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ amount: 0.4 }}
              transition={{ duration: 0.8 }}
              className="p-8 sm:p-10 rounded-2xl bg-bg-surface border border-border/80 shadow-xl text-center space-y-5"
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>

              <h3 className="text-[24px] sm:text-[28px] font-extrabold text-text-primary tracking-tight">
                Qualify With Evidence. Act With Clarity.
              </h3>

              <p className="text-[14px] sm:text-[16px] font-medium text-text-primary max-w-lg mx-auto leading-relaxed">
                SQL Qualification is one way RevOS turns evidence into action.
              </p>

              <p className="text-[8px] sm:text-[10px] text-text-secondary max-w-xl mx-auto leading-tight">
                Across go-to-market strategy, lead qualification, and opportunity assessment, RevOS helps revenue professionals structure complex challenges, evaluate what they know, identify what needs attention, and make more informed decisions about what to do next.
              </p>

              <div className="pt-2">
                <Link
                  to="/product/revos"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-accent hover:opacity-90 text-text-hero-primary text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl transition-all duration-300 shadow-lg shadow-accent/15 hover:scale-105 active:scale-95"
                >
                  <span>Explore RevOS</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>

          </div>

        </div>

      </div>
    </section>
  );
}
