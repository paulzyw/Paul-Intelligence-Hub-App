import { useState } from 'react';
import { ArrowDown, Compass, Target, ShieldCheck, TrendingUp, Zap } from 'lucide-react';

interface InsightsHeroProps {
  onScrollToChallenges: () => void;
  onScrollToCategories: () => void;
}

export function InsightsHero({ onScrollToChallenges, onScrollToCategories }: InsightsHeroProps) {
  const [activeMilestone, setActiveMilestone] = useState<number | null>(null);
  const [activeTriad, setActiveTriad] = useState<number | null>(null);
  const [isChartHovered, setIsChartHovered] = useState<boolean>(false);
  const [animationKey, setAnimationKey] = useState<number>(0);

  const milestones = [
    { id: 1, title: 'Opportunity Stage', desc: 'Initial friction identification and account intelligence mapping.', cx: 25, cy: 160 },
    { id: 2, title: 'Pipeline Velocity', desc: 'Accelerated deal staging with verified decision-maker engagement.', cx: 180, cy: 85 },
    { id: 3, title: 'Closed-Won Predictability', desc: 'Consistent revenue realization through systematic execution frameworks.', cx: 335, cy: 35 }
  ];

  const triadItems = [
    { id: 1, label: 'Diagnosis', value: 'Root Causes', icon: ShieldCheck, detail: 'Isolate deal leakage and structural misalignment.' },
    { id: 2, label: 'Methodology', value: 'Evidence-First', icon: TrendingUp, detail: 'Deploy validated playbooks backed by empirical data.' },
    { id: 3, label: 'Execution', value: 'Predictable', icon: Zap, detail: 'Achieve repeatable scale across enterprise pipelines.' }
  ];

  return (
    <section className="relative overflow-hidden pt-8 pb-16 md:pt-12 md:pb-20 border-b border-border/40 bg-bg-hero-primary">
      <style>{`
        @keyframes curvePulseCycle {
          0% { stroke-dashoffset: 0; }
          50% { stroke-dashoffset: 350; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-curve-cycle {
          animation: curvePulseCycle 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Editorial Headline & Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            {/* Eyebrow Label: Anti-slop unboxed uppercase kicker */}
            <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-accent">
              <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
              <span>RevOS Insights</span>
              <span className="text-text-secondary/40 font-normal">/</span>
              <span className="text-text-secondary font-medium tracking-normal capitalize">Executive Knowledge Hub</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-text-hero-primary tracking-tight leading-[1.1] text-balance">
              Make Better Revenue Decisions.
            </h1>

            <p className="text-lg sm:text-xl text-text-hero-secondary leading-relaxed max-w-2xl font-light">
              Explore practical insights, analytical perspectives, and evidence-driven approaches to the challenges shaping modern revenue performance, sales execution, and business growth.
            </p>

            {/* Navigation Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={onScrollToChallenges}
                className="inline-flex items-center gap-2.5 px-5 py-3 rounded-lg bg-accent text-white font-medium text-sm hover:opacity-95 transition-all transform hover:-translate-y-0.5 shadow-sm cursor-pointer whitespace-nowrap"
              >
                <Target size={16} />
                <span>Explore by Business Challenge</span>
                <ArrowDown size={14} className="opacity-80" />
              </button>

              <button
                onClick={onScrollToCategories}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-border/80 bg-bg-hero-surface/80 backdrop-blur-sm text-text-hero-primary font-medium text-sm hover:border-accent/40 hover:text-accent transition-all transform hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
              >
                <Compass size={16} />
                <span>Browse Knowledge Areas</span>
              </button>
            </div>

            {/* Quiet Domain Indicator */}
            <div className="pt-4 flex items-center gap-6 text-xs text-text-hero-secondary border-t border-border/40 max-w-xl">
              <div>
                <span className="text-text-hero-primary font-semibold">18</span> Business Challenges
              </div>
              <span className="text-border" aria-hidden="true">·</span>
              <div>
                <span className="text-text-hero-primary font-semibold">8</span> Knowledge Domains
              </div>
              <span className="text-border" aria-hidden="true">·</span>
              <div>
                <span className="text-text-hero-primary font-semibold">100%</span> Evidence-Driven
              </div>
            </div>
          </div>

          {/* Right Column: Analytical Visual Element (Telemetry & Decision Matrix with Breathing Nodes & 100%->0%->100% Curve Cycle) */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl border border-border/80 bg-bg-hero-surface/90 backdrop-blur-md p-6 sm:p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-accent/30 group">
              
              {/* Header with Live Status / Hover feedback */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <span className="text-xs font-semibold text-text-hero-secondary uppercase tracking-wider">
                    {activeMilestone !== null ? milestones[activeMilestone].title : (isChartHovered ? 'Trajectory Cycle: 100% → 0% → 100%' : 'Revenue Intelligence Matrix')}
                  </span>
                </div>
                <span className="text-xs font-mono text-accent bg-accent/10 px-2 py-0.5 rounded">
                  {activeMilestone !== null ? `Milestone 0${activeMilestone + 1}` : (isChartHovered ? 'Active Cycle' : 'RevOS Telemetry')}
                </span>
              </div>

              {/* Fixed-height description banner */}
              <div className="h-10 mb-3 flex items-center text-xs text-text-hero-secondary">
                {activeMilestone !== null ? (
                  <p className="text-text-hero-primary font-medium">
                    <span className="text-accent font-semibold">Focus:</span> {milestones[activeMilestone].desc}
                  </p>
                ) : (
                  <p className="opacity-80">Hover over chart area to re-trigger curve cycle (100% → 0% → 100%) and inspect nodes.</p>
                )}
              </div>

              {/* Vector Graphic: Convergence Architecture with Hover Chart Area */}
              <div 
                className="relative overflow-hidden rounded-xl bg-bg-hero-primary/30 p-2 border border-border/40 cursor-crosshair"
                onMouseEnter={() => {
                  setIsChartHovered(true);
                  setAnimationKey(prev => prev + 1);
                }}
                onMouseLeave={() => setIsChartHovered(false)}
              >
                <svg viewBox="0 0 360 220" className="w-full h-auto drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Background Grid Lines */}
                  <line x1="20" y1="40" x2="340" y2="40" stroke="var(--text-hero-secondary)" strokeOpacity="0.08" strokeDasharray="4 4" />
                  <line x1="20" y1="90" x2="340" y2="90" stroke="var(--text-hero-secondary)" strokeOpacity="0.08" strokeDasharray="4 4" />
                  <line x1="20" y1="140" x2="340" y2="140" stroke="var(--text-hero-secondary)" strokeOpacity="0.08" strokeDasharray="4 4" />
                  <line x1="20" y1="190" x2="340" y2="190" stroke="var(--text-hero-secondary)" strokeOpacity="0.08" strokeDasharray="4 4" />

                  {/* Vertical Axis Steps */}
                  <line x1="90" y1="20" x2="90" y2="200" stroke="currentColor" strokeOpacity="0.06" />
                  <line x1="180" y1="20" x2="180" y2="200" stroke="currentColor" strokeOpacity="0.06" />
                  <line x1="270" y1="20" x2="270" y2="200" stroke="currentColor" strokeOpacity="0.06" />

                  {/* Analytical Curve: Conversion Trajectory with 100% -> 0% -> 100% Cycle on Hover */}
                  <path
                    key={animationKey}
                    d="M 25 160 C 80 150, 120 120, 180 85 C 240 50, 290 45, 335 35"
                    stroke="var(--accent)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    pathLength="350"
                    strokeDasharray="350"
                    strokeDashoffset={0}
                    className={`drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.3)] ${isChartHovered ? 'animate-curve-cycle' : ''}`}
                  />

                  {/* Secondary Reference Curve: Traditional Friction */}
                  <path
                    d="M 25 150 C 90 145, 150 160, 210 170 C 270 180, 310 185, 335 188"
                    stroke="var(--text-hero-secondary)"
                    strokeOpacity="0.25"
                    strokeWidth="1.5"
                    strokeDasharray="5 5"
                  />

                  {/* Decision Milestone Nodes with SVG Breathing Animation */}
                  {milestones.map((m, idx) => {
                    const isHovered = activeMilestone === idx;
                    const baseRadius = idx === 2 ? 6 : (idx === 1 ? 5 : 4);
                    return (
                      <g key={m.id} className="cursor-pointer" onMouseEnter={() => setActiveMilestone(idx)} onMouseLeave={() => setActiveMilestone(null)}>
                        {/* Outer breathing ring */}
                        <circle cx={m.cx} cy={m.cy} r={baseRadius + 4} fill="var(--accent)" fillOpacity="0.2">
                          <animate attributeName="r" values={`${baseRadius + 2};${baseRadius + 8};${baseRadius + 2}`} dur="2.5s" repeatCount="indefinite" />
                          <animate attributeName="fill-opacity" values="0.15;0.35;0.15" dur="2.5s" repeatCount="indefinite" />
                        </circle>
                        {/* Core node */}
                        <circle
                          cx={m.cx}
                          cy={m.cy}
                          r={isHovered ? baseRadius + 3 : baseRadius}
                          fill="var(--accent)"
                          stroke="var(--bg-hero-surface)"
                          strokeWidth={2}
                          className="transition-all duration-200"
                        />
                      </g>
                    );
                  })}

                  {/* Callout Labels in SVG */}
                  <text x="35" y="152" fill="var(--text-hero-secondary)" fillOpacity={activeMilestone === 0 ? "1" : "0.6"} fontSize="9" fontFamily="var(--font-mono)" className="transition-opacity">Opportunity Stage</text>
                  <text x="145" y="73" fill="var(--text-hero-secondary)" fillOpacity={activeMilestone === 1 ? "1" : "0.75"} fontSize="9" fontFamily="var(--font-mono)" className="transition-opacity">Pipeline Velocity</text>
                  <text x="260" y="27" fill="var(--accent)" fontSize="9" fontWeight="600" fontFamily="var(--font-mono)">Closed-Won Predictability</text>
                </svg>
              </div>

              {/* Data Triad Summary with Smooth Hover Enhancements */}
              <div className="grid grid-cols-3 gap-3 pt-5 mt-4 border-t border-border/60 text-center">
                {triadItems.map((item, idx) => {
                  const Icon = item.icon;
                  const isSelected = activeTriad === idx;
                  return (
                    <div
                      key={item.id}
                      onMouseEnter={() => { setActiveTriad(idx); setActiveMilestone(idx); }}
                      onMouseLeave={() => { setActiveTriad(null); setActiveMilestone(null); }}
                      className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer text-left h-[78px] flex flex-col justify-between ${
                        isSelected 
                          ? 'bg-accent/10 border-accent/40 shadow-md' 
                          : 'bg-bg-hero-primary/50 border-border/40 hover:border-border hover:bg-bg-hero-primary'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-text-hero-secondary">{item.label}</span>
                        <Icon size={13} className={isSelected ? 'text-accent' : 'text-text-hero-secondary/60'} />
                      </div>
                      <div className="text-xs font-semibold text-text-hero-primary truncate">{item.value}</div>
                      <div className="text-[10px] text-text-hero-secondary line-clamp-1 opacity-80">{item.detail}</div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
