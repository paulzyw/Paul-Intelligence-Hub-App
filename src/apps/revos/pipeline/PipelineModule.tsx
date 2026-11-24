import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Cpu, Layers } from 'lucide-react';
import { OpportunityToPipeline } from './components/opportunity-to-pipeline';
import { PipelineOverviewCanvas } from './components/PipelineOverviewCanvas';
import { PipelineDashboard } from './components/PipelineDashboard';
import { OpportunityCreationForm } from './components/OpportunityCreationForm';

type PipelineTab = 'canvas' | 'dashboard';

export const PipelineModule: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const opportunityIdParam = searchParams.get('opportunityId');
  const leadIdParam = searchParams.get('leadId');
  const createParam = searchParams.get('create');
  const tabParam = searchParams.get('tab');

  // Independent Direct Opportunity Creation Form View
  if (createParam === 'true') {
    return (
      <OpportunityCreationForm
        onBack={() => {
          const nextParams = new URLSearchParams(searchParams);
          nextParams.delete('create');
          nextParams.delete('draftId');
          nextParams.delete('pipelineId');
          setSearchParams(nextParams, { replace: true });
        }}
      />
    );
  }

  // Isolated Parameter Route View: renders dedicated opportunity-to-pipeline bridge & workspace
  if (opportunityIdParam || leadIdParam) {
    return <OpportunityToPipeline />;
  }

  const activeTab: PipelineTab = tabParam === 'dashboard' ? 'dashboard' : 'canvas';

  const handleTabChange = (nextTab: PipelineTab) => {
    const nextParams = new URLSearchParams(searchParams);
    if (nextTab === 'canvas') {
      nextParams.delete('tab');
    } else {
      nextParams.set('tab', nextTab);
    }
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary text-text-primary px-4 sm:px-6 md:px-8 py-6 max-w-[1440px] mx-auto space-y-6">
      {/* Module Title Header panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-5">
        <div>
          <div className="text-[10px] sm:text-xs font-mono font-bold tracking-[0.2em] text-accent uppercase flex items-center gap-1.5 mb-1.5">
            <Cpu className="h-4 w-4 text-accent" />
            Layer 2 Commercial Reasoning Modules
          </div>
          <h1 className="text-xl sm:text-2xl font-black font-sans text-text-primary tracking-tight">
            Pipeline Assessment Engine
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/product/revos/leads"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary hover:border-accent/50 transition-colors whitespace-nowrap shrink-0"
          >
            <Layers className="h-3.5 w-3.5 text-accent" />
            <span>Open Lead Canvas</span>
          </Link>
        </div>
      </div>

      {/* Horizontal Navigation Tabs Bar (1. Pipeline Overview & Assessment Canvas, 2. Pipeline Dashboard) */}
      <div className="p-4 rounded-2xl bg-bg-surface/60 border border-border/80 shadow relative">
        <div className="flex items-center justify-between pointer-events-none mb-3 border-b border-border/40 pb-2">
          <span className="text-[10px] font-mono text-text-secondary uppercase">
            Unified pipeline assessment lifecycle sequence
          </span>
          <span className="text-xs font-bold text-accent">
            Active assessment step: {activeTab === 'canvas' ? '1 / 2' : '2 / 2'}
          </span>
        </div>

        {/* Rolling wrapper */}
        <div className="overflow-x-auto overflow-y-hidden whitespace-nowrap custom-scrollbar-horizontal py-1 pb-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleTabChange('canvas')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-[10px] sm:text-xs font-bold uppercase transition-all shrink-0 cursor-pointer ${
              activeTab === 'canvas'
                ? 'bg-accent border-accent text-black font-black scale-105 shadow-md shadow-accent/15'
                : 'bg-bg-primary/50 border-border/70 text-text-secondary hover:text-text-primary hover:border-text-secondary/40'
            }`}
          >
            <span className="font-mono">1.</span>
            <span>Pipeline Canvas</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('dashboard')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-[10px] sm:text-xs font-bold uppercase transition-all shrink-0 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-accent border-accent text-black font-black scale-105 shadow-md shadow-accent/15'
                : 'bg-bg-primary/50 border-border/70 text-text-secondary hover:text-text-primary hover:border-text-secondary/40'
            }`}
          >
            <span className="font-mono">2.</span>
            <span>Pipeline Dashboard</span>
          </button>
        </div>
      </div>

      {/* Full-width Workspace Area */}
      <div className="w-full flex flex-col min-w-0">
        {activeTab === 'canvas' ? (
          <PipelineOverviewCanvas embedded />
        ) : (
          <PipelineDashboard />
        )}
      </div>
    </div>
  );
};

export default PipelineModule;
