import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2, Info, CheckCircle2, Eye, Palette } from 'lucide-react';

interface RevosWorkflowChartProps {
  className?: string;
}

export const RevosWorkflowChart: React.FC<RevosWorkflowChartProps> = ({ className = '' }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [useGradientBg, setUseGradientBg] = useState<boolean>(true);

  // Fetch the latest SVG markup directly to bypass any browser HTTP cache
  // and guarantee 100% vector fidelity identical to the editor preview
  useEffect(() => {
    let isMounted = true;
    fetch(`/images/RevOS_Workflow_Chart_revos.svg?v=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.text())
      .then((text) => {
        if (isMounted) {
          // Strip XML prologue so inline SVG parses cleanly in DOM
          const sanitized = text.replace(/<\?xml[\s\S]*?\?>/i, '').trim();
          setSvgContent(sanitized);
        }
      })
      .catch((err) => {
        console.error('Failed to load inline SVG:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Lock body scroll and listen for Escape key when expanded
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsFullscreen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isFullscreen]);

  const stepsInfo = [
    {
      num: 1,
      title: '1. Data & Input',
      desc: 'Multi-source data ingestion covering market intelligence, CRM records, customer notes, buying signals, and commercial context.',
      badge: 'Data Layer',
    },
    {
      num: 2,
      title: '2. RevOS Core',
      desc: 'Data integration and cross-validation to organize disjointed information and eliminate unverified assumptions.',
      badge: 'Core Engine',
    },
    {
      num: 3,
      title: '3. AI Reasoning',
      desc: 'Six interconnected reasoning phases: Context Understanding → Evidence Analysis → Reasoning & Analysis → Decision Evaluation → Advice Generation → Validation & Uncertainty Check.',
      badge: 'Reasoning Engine',
    },
    {
      num: 4,
      title: '4. Three Engines',
      desc: 'Specialized application engines applying tailored methodologies: GTMOS (Strategy), Lead Qualification (Readiness), Pipeline Assessment (Opportunity Health).',
      badge: 'Operating Engines',
    },
    {
      num: 5,
      title: '5. Business Outcomes',
      desc: 'Measurable impact: higher win rate, shorter sales cycle, disciplined resource allocation, improved forecast accuracy, and sustainable growth.',
      badge: 'Realized Value',
    }
  ];

  return (
    <div className={`relative w-full rounded-2xl border border-border/80 bg-bg-surface p-4 sm:p-6 lg:p-8 shadow-sm ${className}`}>
      {/* Chart Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">Platform Architecture Diagram</span>
          <h3 className="text-lg sm:text-xl font-bold text-text-primary mt-1">
            RevOS End-to-End Revenue Operating Workflow
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle Background Style: Gradient vs Clean Preview Canvas */}
          <button
            onClick={() => setUseGradientBg(!useGradientBg)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-bg-primary/50 text-xs font-medium text-text-secondary hover:text-accent hover:border-accent transition-colors"
            title={useGradientBg ? 'Switch to Clean Preview Canvas' : 'Switch to RevOS Platform Gradient'}
            aria-label="Toggle diagram background"
          >
            {useGradientBg ? <Eye className="w-3.5 h-3.5" /> : <Palette className="w-3.5 h-3.5" />}
            <span>{useGradientBg ? 'Preview Canvas' : 'RevOS Gradient'}</span>
          </button>

          {/* Full-width Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-bg-primary/50 text-xs font-medium text-text-secondary hover:text-accent hover:border-accent transition-colors"
            title={isFullscreen ? 'Exit full width view' : 'Expand diagram'}
            aria-label="Toggle diagram view size"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span>{isFullscreen ? 'Standard' : 'Expand'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Step Selector */}
      <div className="pt-4 pb-2 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        {stepsInfo.map((s) => (
          <button
            key={s.num}
            onClick={() => setActiveStep(activeStep === s.num ? null : s.num)}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              activeStep === s.num
                ? 'border-accent bg-accent/10 text-text-primary shadow-xs'
                : 'border-border/60 bg-bg-primary/30 text-text-secondary hover:border-accent/40 hover:text-text-primary'
            }`}
          >
            <div className="font-semibold">{s.title}</div>
            <div className="text-[11px] text-text-secondary/80 truncate mt-0.5">{s.badge}</div>
          </button>
        ))}
      </div>

      {/* Active Step Context Box */}
      {activeStep && (
        <div className="my-3 p-3.5 rounded-xl border border-accent/40 bg-accent/5 text-xs text-text-primary flex items-start gap-2.5 transition-all">
          <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-accent mr-1.5">{stepsInfo[activeStep - 1].title}:</span>
            <span className="text-text-secondary">{stepsInfo[activeStep - 1].desc}</span>
          </div>
        </div>
      )}

      {/* SVG Container: supports both RevOS Platform Gradient & Clean Canvas Preview */}
      <div 
        className={`w-full overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 my-4 border transition-all duration-300 ${
          useGradientBg 
            ? 'border-white/20 shadow-2xl backdrop-blur-sm' 
            : 'border-border bg-white dark:bg-[#121416] shadow-md'
        }`}
        style={
          useGradientBg
            ? { background: 'linear-gradient(135deg, rgba(197, 215, 4, 0.60) 0%, rgba(10, 159, 222, 0.60) 48%, rgba(4, 43, 87, 0.60) 100%)' }
            : undefined
        }
      >
        {svgContent ? (
          <div 
            className="w-full h-auto flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:block [&>svg]:max-w-full select-none"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <img
            src={`/images/RevOS_Workflow_Chart_revos.svg?v=${Date.now()}`}
            alt="RevOS Workflow Architecture Chart - from Multi-source Data Ingestion, Core Validation, 6-Step AI Reasoning, Three Engines to Business Outcomes"
            className="w-full h-auto object-contain mx-auto block"
          />
        )}
      </div>

      {/* Caption & Accessibility notes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-text-secondary gap-2 pt-2 border-t border-border/40">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
          <span>Structured revenue data → Evidence-informed AI reasoning → Coordinated execution</span>
        </div>
        <span className="text-[11px] text-text-secondary/70">Source: RevOS Core Technical Architecture V1.0</span>
      </div>

      {/* Expanded Fullscreen Lightbox Modal */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto"
          onClick={() => setIsFullscreen(false)}
        >
          <div 
            className="relative w-full max-w-7xl mx-auto my-auto bg-bg-surface border border-border rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-accent">Expanded Platform Architecture</span>
                <h3 className="text-base sm:text-xl font-bold text-text-primary mt-0.5">
                  RevOS End-to-End Revenue Operating Workflow
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUseGradientBg(!useGradientBg)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-bg-primary/50 text-xs font-medium text-text-secondary hover:text-accent hover:border-accent transition-colors"
                >
                  {useGradientBg ? <Eye className="w-3.5 h-3.5" /> : <Palette className="w-3.5 h-3.5" />}
                  <span>{useGradientBg ? 'Preview Canvas' : 'RevOS Gradient'}</span>
                </button>
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-accent bg-accent text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  <Minimize2 className="w-4 h-4" />
                  <span>Standard View (Esc)</span>
                </button>
              </div>
            </div>

            {/* Expanded SVG Container */}
            <div 
              className={`w-full overflow-hidden rounded-xl p-4 sm:p-8 my-4 border transition-all duration-300 ${
                useGradientBg 
                  ? 'border-white/20 shadow-2xl backdrop-blur-sm' 
                  : 'border-border bg-white dark:bg-[#121416] shadow-md'
              }`}
              style={
                useGradientBg
                  ? { background: 'linear-gradient(135deg, rgba(197, 215, 4, 0.60) 0%, rgba(10, 159, 222, 0.60) 48%, rgba(4, 43, 87, 0.60) 100%)' }
                  : undefined
              }
            >
              {svgContent ? (
                <div 
                  className="w-full h-auto flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:block [&>svg]:max-w-full select-none"
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                />
              ) : (
                <img
                  src={`/images/RevOS_Workflow_Chart_revos.svg?v=${Date.now()}`}
                  alt="RevOS Workflow Architecture Chart"
                  className="w-full h-auto object-contain mx-auto block"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

