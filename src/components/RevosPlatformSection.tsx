import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Layers, 
  Target, 
  CheckCircle2, 
  LineChart,
  ArrowRight
} from 'lucide-react';
import { ShaderBackground } from './ShaderBackground';
import { RevosProductCard } from './RevosProductCard';
import { GtmosProductCard } from './GtmosProductCard';
import { LeadQualificationProductCard } from './LeadQualificationProductCard';
import { PipelineAssessmentProductCard } from './PipelineAssessmentProductCard';

export type PlatformTabKey = 'revos' | 'gtmos' | 'lead-qualification' | 'pipeline-assessment';

interface TabItem {
  id: PlatformTabKey;
  label: string;
  tagline: string;
  badge: string;
  accentColor: string;
  glowColor: string;
  icon: typeof Layers;
}

const PLATFORM_TABS: TabItem[] = [
  {
    id: 'revos',
    label: 'RevOS',
    tagline: 'Unified Revenue Operating System',
    badge: 'Core Engine',
    accentColor: '#F4F4F9',
    glowColor: 'rgba(244, 244, 249, 0.15)',
    icon: Layers,
  },
  {
    id: 'gtmos',
    label: 'GTMOS',
    tagline: 'Go-to-Market Strategy & Motion Alignment',
    badge: 'Strategy',
    accentColor: '#C5D704', // --gtm
    glowColor: 'rgba(197, 215, 4, 0.20)',
    icon: Target,
  },
  {
    id: 'lead-qualification',
    label: 'Lead Qualification',
    tagline: 'Evidence-Based Inbound & Outbound Qualification',
    badge: 'Qualification',
    accentColor: '#0A9FDE', // --lead
    glowColor: 'rgba(10, 159, 222, 0.20)',
    icon: CheckCircle2,
  },
  {
    id: 'pipeline-assessment',
    label: 'Pipeline Assessment',
    tagline: 'Opportunity Health, Risk Diagnostics & Execution',
    badge: 'Assessment',
    accentColor: '#EEF1B2', // bright highlight on pipeline navy
    glowColor: 'rgba(4, 43, 87, 0.40)',
    icon: LineChart,
  },
];

export function RevosPlatformSection() {
  const [activeTab, setActiveTab] = useState<PlatformTabKey>('revos');
  const activeTabMeta = PLATFORM_TABS.find((t) => t.id === activeTab) || PLATFORM_TABS[0];
  const ActiveIcon = activeTabMeta.icon;

  return (
    <section
      id="revos-platform"
      aria-label="RevOS Platform"
      className="relative w-full overflow-hidden bg-bg-hero-primary text-text-hero-primary py-24 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8 border-b border-border-hero/60 transition-colors duration-400"
    >
      {/* 1. ANIMATED WEBGL SHADER BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none opacity-60 mix-blend-screen overflow-hidden">
        <ShaderBackground className="absolute inset-0" speed={0.9} intensity={1.1} />
      </div>

      {/* Subtle radial vignette to maintain high text contrast & focal depth */}
      <div 
        aria-hidden="true" 
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(5,28,44,0.35)_0%,rgba(5,28,44,0.85)_80%,rgba(5,28,44,0.98)_100%)]" 
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* 2. SECTION HEADER & NARRATIVE */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-4">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold tracking-[0.18em] uppercase text-accent backdrop-blur-xs shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>THE REVOS PLATFORM</span>
          </div>

          {/* Heading H2 */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            One Revenue Operating System. Connected Revenue Workflows.
          </h2>

          {/* Supporting paragraph */}
          <p className="text-base sm:text-lg text-text-hero-secondary leading-relaxed pt-2 max-w-2xl mx-auto">
            RevOS connects go-to-market strategy, lead qualification, and opportunity assessment through structured workflows and AI-powered intelligence—helping individuals and teams make more informed revenue decisions.
          </p>
        </div>

        {/* 3. INTERACTIVE CATEGORY TABS */}
        <div className="flex justify-center mb-8 sm:mb-12">
          <div
            role="tablist"
            aria-label="RevOS Platform Modules"
            className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md shadow-lg"
          >
            {PLATFORM_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const TabIcon = tab.icon;

              return (
                <button
                  key={tab.id}
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all duration-300 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent ${
                    isActive
                      ? 'text-white shadow-md'
                      : 'text-text-hero-secondary hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  {/* Active highlight pill underlay */}
                  {isActive && (
                    <motion.div
                      layoutId="activePlatformTab"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      className="absolute inset-0 rounded-xl bg-white/10 border border-white/20 backdrop-blur-xs"
                      style={{
                        boxShadow: `0 0 20px ${tab.glowColor}`,
                      }}
                    />
                  )}

                  <TabIcon
                    className={`relative z-10 w-4 h-4 transition-colors duration-300 ${
                      isActive ? 'text-accent' : 'text-text-hero-secondary group-hover:text-white'
                    }`}
                  />
                  <span className="relative z-10 whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. CARDS DISPLAY AREA */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            {activeTab === 'revos' ? (
              <motion.div
                key="revos-card-panel"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="w-full"
              >
                <RevosProductCard />
              </motion.div>
            ) : activeTab === 'gtmos' ? (
              <motion.div
                key="gtmos-card-panel"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="w-full"
              >
                <GtmosProductCard />
              </motion.div>
            ) : activeTab === 'lead-qualification' ? (
              <motion.div
                key="lead-qualification-card-panel"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="w-full"
              >
                <LeadQualificationProductCard />
              </motion.div>
            ) : (
              <motion.div
                key="pipeline-assessment-card-panel"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="w-full"
              >
                <PipelineAssessmentProductCard />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

export default RevosPlatformSection;
