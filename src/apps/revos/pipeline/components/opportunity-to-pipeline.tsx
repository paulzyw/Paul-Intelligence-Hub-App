import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Briefcase,
  Calendar,
  DollarSign,
  User,
  Layers,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  GitBranch,
  Target
} from 'lucide-react';
import {
  PipelineOpportunity,
  PipelineInheritance,
  PipelineAssessment
} from '../../types/pipeline';
import { PipelineDataService } from '../services/PipelineDataService';
import { PipelineConfigService, ActiveFactorResolutionResult } from '../services/PipelineConfigService';
import { PipelineAssessmentForm } from './PipelineAssessmentForm';
import { PipelineIntelligenceWorkspace } from './PipelineIntelligenceWorkspace';

export interface OpportunityToPipelineProps {
  opportunityIdOverride?: string;
  leadIdOverride?: string;
  onAssessmentReady?: (assessmentPayload: any, opportunity: PipelineOpportunity) => void;
}

export const OpportunityToPipeline: React.FC<OpportunityToPipelineProps> = ({
  opportunityIdOverride,
  leadIdOverride,
  onAssessmentReady
}) => {
  const [searchParams] = useSearchParams();
  const opportunityId = opportunityIdOverride || searchParams.get('opportunityId') || '';
  const leadId = leadIdOverride || searchParams.get('leadId') || undefined;
  const sourceChannel = searchParams.get('source') || 'lead_canvas_opp';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pipelineOpp, setPipelineOpp] = useState<PipelineOpportunity | null>(null);
  const [inheritance, setInheritance] = useState<PipelineInheritance | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);

  const [swotResolution, setSwotResolution] = useState<ActiveFactorResolutionResult | null>(null);
  const [latestAssessment, setLatestAssessment] = useState<PipelineAssessment | null>(null);
  const [lastRunSummary, setLastRunSummary] = useState<any>(null);
  const [showWorkspace, setShowWorkspace] = useState(false);

  const [inheritanceExpanded, setInheritanceExpanded] = useState(true);
  const [swotLayerTab, setSwotLayerTab] = useState<'all' | 'universal_baseline' | 'revenue_motion_override' | 'industry_override'>('all');

  useEffect(() => {
    let mounted = true;

    const hydrateOpportunityToPipeline = async () => {
      if (!opportunityId && !leadId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // 1. PADIF v1.0 Data Inheritance Bridge
        const { opportunity, inheritance: inh, isNew } =
          await PipelineDataService.getOrCreatePipelineOpportunity(opportunityId, leadId);

        if (!mounted) return;
        setPipelineOpp(opportunity);
        setInheritance(inh);
        setIsNewRecord(isNew);

        // 2. Resolve Active 16 SWOT Factors (8 Universal + 4 Motion + 4 Industry)
        const swot = PipelineConfigService.resolveActiveSWOTFactors(
          opportunity.revenue_motion_id || opportunity.revenue_motion_name,
          opportunity.industry_id || opportunity.industry_name
        );
        setSwotResolution(swot);

        // 3. Check for existing completed Pipeline Assessment
        const latest = await PipelineDataService.getLatestAssessment(opportunity.pipeline_id);
        if (!mounted) return;
        if (latest?.assessment) {
          setLatestAssessment(latest.assessment);
          setShowWorkspace(true);
        } else {
          setLatestAssessment(null);
          setShowWorkspace(false);
        }
      } catch (err: any) {
        console.error('Error hydrating Opportunity-to-Pipeline bridge:', err);
        if (mounted) {
          setError(err.message || 'Failed to initialize Pipeline Opportunity from upstream Opportunity record.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    hydrateOpportunityToPipeline();

    return () => {
      mounted = false;
    };
  }, [opportunityId, leadId]);

  const displayedSwotFactors = useMemo(() => {
    if (!swotResolution) return [];
    if (swotLayerTab === 'all') return swotResolution.active16Factors;
    return swotResolution.active16Factors.filter((f) => f.layer === swotLayerTab);
  }, [swotResolution, swotLayerTab]);

  const inheritedOq = (inheritance?.inherited_payload as any)?.opportunity_qualification || {};
  const inheritedLead = (inheritance?.inherited_payload as any)?.upstream_lead || {};
  const inheritedNotes = (inheritance?.inherited_payload as any)?.handover_notes || '';
  const inheritedRisks: any[] = Array.isArray(inheritedOq.risks) ? inheritedOq.risks : [];

  if (!opportunityId && !leadId) {
    return (
      <div className="p-6 sm:p-8 max-w-4xl mx-auto">
        <div className="bg-bg-surface border border-border rounded-2xl p-8 text-center space-y-4">
          <Target className="h-10 w-10 text-accent mx-auto" />
          <h2 className="text-xl font-bold text-text-primary">No Opportunity Selected</h2>
          <p className="text-xs sm:text-sm text-text-secondary max-w-md mx-auto">
            Select an opportunity card in the Opportunity Column of Lead Canvas or choose an active opportunity in the Pipeline Hub to start assessment.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              to="/product/revos/leads"
              className="px-4 py-2 bg-bg-primary border border-border text-text-primary rounded-xl text-xs font-semibold hover:border-accent/50 transition-colors whitespace-nowrap"
            >
              Return to Lead Canvas
            </Link>
            <Link
              to="/product/revos/pipeline"
              className="px-4 py-2 bg-accent text-black rounded-xl text-xs font-bold hover:bg-accent-hover transition-colors whitespace-nowrap"
            >
              View Pipeline Opportunities
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-10 flex flex-col items-center justify-center min-h-[55vh] space-y-3">
        <RefreshCw className="h-7 w-7 text-accent animate-spin" />
        <p className="text-xs font-mono text-text-secondary uppercase tracking-wider">
          Hydrating PADIF v1.0 Upstream Inheritance & SWOT Matrix...
        </p>
      </div>
    );
  }

  if (error || !pipelineOpp) {
    return (
      <div className="p-6 sm:p-8 max-w-3xl mx-auto">
        <div className="bg-bg-surface border border-red-500/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <h2 className="text-base font-bold">Opportunity-to-Pipeline Bridge Error</h2>
          </div>
          <p className="text-xs text-text-secondary">{error || 'Unable to load target pipeline opportunity.'}</p>
          <Link
            to="/product/revos/leads"
            className="inline-flex items-center gap-2 px-4 py-2 bg-bg-primary border border-border rounded-xl text-xs font-semibold text-text-primary hover:border-accent/50 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Lead Canvas
          </Link>
        </div>
      </div>
    );
  }

  const formattedDealValue =
    pipelineOpp.deal_value > 0
      ? `${pipelineOpp.currency || 'USD'} $${pipelineOpp.deal_value.toLocaleString('en-US')}`
      : 'USD $0';

  const handleAssessmentComplete = (result: any) => {
    setLastRunSummary(result);
    if (result?.assessment) {
      setLatestAssessment(result.assessment);
    }
    setShowWorkspace(true);
    if (onAssessmentReady && pipelineOpp) {
      onAssessmentReady(result, pipelineOpp);
    }
  };

  // Stage 6 Full Intelligence Workspace (when assessment exists & user didn't stay in intake)
  if (showWorkspace && (latestAssessment || lastRunSummary)) {
    return (
      <PipelineIntelligenceWorkspace
        opportunity={pipelineOpp}
        inheritance={inheritance}
        sourceChannel={sourceChannel}
        onOpportunityUpdated={(updated) => setPipelineOpp(updated)}
      />
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Isolated Route Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/70">
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to="/product/revos/leads"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bg-surface border border-border text-xs font-medium text-text-secondary hover:text-text-primary hover:border-accent/40 transition-colors whitespace-nowrap"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Lead Canvas</span>
          </Link>

          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <Link to="/product/revos/pipeline" className="hover:text-text-primary transition-colors">
              Pipeline Assessment
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-text-primary font-medium truncate max-w-[240px]">
              {pipelineOpp.opportunity_name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-text-secondary font-mono">
          <span>Route: {sourceChannel}</span>
          <span aria-hidden="true">·</span>
          <span>{isNewRecord ? 'PADIF Initialized' : 'Existing Record'}</span>
        </div>
      </div>

      {/* Commercial Opportunity Identity Strip */}
      <div className="bg-bg-surface border border-border rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <Building2 className="h-3.5 w-3.5 text-accent" />
              <span className="font-semibold text-text-primary">{pipelineOpp.customer_name}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{pipelineOpp.pipeline_id}</span>
            </div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              {pipelineOpp.opportunity_name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary pt-1">
              <span>{swotResolution?.industryName || pipelineOpp.industry_name}</span>
              <span aria-hidden="true">·</span>
              <span>{swotResolution?.revenueMotionName || pipelineOpp.revenue_motion_name}</span>
              <span aria-hidden="true">·</span>
              <span>Stage: {pipelineOpp.sales_stage}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6 bg-bg-primary p-4 rounded-xl border border-border/80 shrink-0">
            <div>
              <div className="text-[11px] text-text-secondary flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Deal Value
              </div>
              <div className="text-sm font-bold font-mono tabular-nums text-text-primary mt-0.5">
                {formattedDealValue}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-text-secondary flex items-center gap-1">
                <User className="h-3 w-3" />
                Owner
              </div>
              <div className="text-sm font-semibold text-text-primary mt-0.5 truncate max-w-[140px]">
                {pipelineOpp.opportunity_owner}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-text-secondary flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Target Close
              </div>
              <div className="text-sm font-mono tabular-nums text-text-primary mt-0.5">
                {pipelineOpp.expected_close_date || 'Not Set'}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-text-secondary flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                Pipeline Stage
              </div>
              <div className="text-sm font-semibold text-accent mt-0.5 truncate max-w-[140px]">
                {pipelineOpp.pipeline_stage}
              </div>
            </div>
          </div>
        </div>

        {/* Latest Assessment Outcome Banner (if previously evaluated or just executed) */}
        {(lastRunSummary || latestAssessment) && (
          <div className="p-4 bg-bg-primary border border-accent/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-sm font-bold text-text-primary">
                  Latest Assessment #{lastRunSummary?.sequence || latestAssessment?.assessment_sequence || 1} —{' '}
                  {lastRunSummary?.pipeline_health || latestAssessment?.pipeline_health}
                </div>
                <p className="text-xs text-text-secondary line-clamp-2">
                  {lastRunSummary?.assessment?.executive_summary?.overall_assessment ||
                    latestAssessment?.executive_summary?.overall_assessment ||
                    'Deterministic PADF scoring and Gemini SWOT/TOWS intelligence persisted to Supabase.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-5 font-mono tabular-nums shrink-0">
              <div>
                <div className="text-[10px] text-text-secondary">Base Winability</div>
                <div className="text-base font-bold text-text-primary">
                  {lastRunSummary?.base_winability ?? latestAssessment?.base_winability ?? '--'}%
                </div>
              </div>
              <div>
                <div className="text-[10px] text-text-secondary">Risk-Adjusted</div>
                <div className="text-base font-bold text-accent">
                  {lastRunSummary?.risk_adjusted_winability ?? latestAssessment?.risk_adjusted_winability ?? '--'}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PADIF v1.0 Upstream Inheritance & 16 Active SWOT Matrix */}
      <div className="bg-bg-surface border border-border rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setInheritanceExpanded((prev) => !prev)}
          className="w-full px-5 sm:px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-bg-primary/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <GitBranch className="h-4 w-4 text-accent shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-text-primary">
                PADIF v1.0 Upstream Inheritance & 16 Active SWOT Factors
              </h2>
              <p className="text-xs text-text-secondary">
                Inherited Opportunity Qualification baseline ({inheritance?.qualification_decision || 'QUALIFIED'} ·{' '}
                {inheritance?.qualification_score ?? 82}/100) + Canonical {swotResolution?.canonicalRevenueMotionId} &{' '}
                {swotResolution?.canonicalIndustryId}
              </p>
            </div>
          </div>
          {inheritanceExpanded ? (
            <ChevronUp className="h-4 w-4 text-text-secondary shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-text-secondary shrink-0" />
          )}
        </button>

        {inheritanceExpanded && (
          <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-border/60 space-y-5">
            {/* Upstream PADIF Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-bg-primary rounded-xl border border-border/70 space-y-1.5">
                <div className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                  Qualification Continuity
                </div>
                <div className="text-xs text-text-secondary space-y-1 font-mono tabular-nums">
                  <div>Decision: {inheritance?.qualification_decision || 'QUALIFIED'}</div>
                  <div>QIP Score: {inheritance?.qualification_score ?? '--'}/100</div>
                  <div>Confidence: {inheritance?.qualification_confidence ?? '--'}%</div>
                </div>
              </div>

              <div className="p-4 bg-bg-primary rounded-xl border border-border/70 space-y-1.5">
                <div className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-accent" />
                  Canonical Classification
                </div>
                <div className="text-xs text-text-secondary space-y-1">
                  <div className="font-mono truncate">{swotResolution?.canonicalRevenueMotionId}</div>
                  <div className="font-mono truncate">{swotResolution?.canonicalIndustryId}</div>
                  <div>
                    Lead Ref:{' '}
                    <span className="font-mono">{inheritedLead.contact_name || pipelineOpp.lead_id || 'Direct'}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-bg-primary rounded-xl border border-border/70 space-y-1.5">
                <div className="text-xs font-semibold text-text-primary">Upstream Handover & Risks</div>
                <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">
                  {inheritedNotes ||
                    inheritedOq.explanation ||
                    (inheritedRisks.length > 0
                      ? `${inheritedRisks.length} upstream qualification risk(s) carried into Pipeline Assessment context.`
                      : 'Validated Opportunity Qualification context inherited under PADIF v1.0.')}
                </p>
              </div>
            </div>

            {/* 16 Active SWOT Factors Layer Selector & Grid */}
            {swotResolution && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-text-primary">
                    Active 16 SWOT Factor Matrix ({swotResolution.universalFactors.length} Universal +{' '}
                    {swotResolution.revenueMotionFactors.length} Motion +{' '}
                    {swotResolution.industryFactors.length} Industry)
                  </div>
                  <div className="flex items-center gap-1 p-1 bg-bg-primary border border-border rounded-lg self-start sm:self-auto">
                    {[
                      { key: 'all', label: `All (${swotResolution.active16Factors.length})` },
                      { key: 'universal_baseline', label: 'Universal (8)' },
                      { key: 'revenue_motion_override', label: 'Motion (4)' },
                      { key: 'industry_override', label: 'Industry (4)' }
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setSwotLayerTab(tab.key as any)}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                          swotLayerTab === tab.key
                            ? 'bg-accent text-black font-semibold'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {displayedSwotFactors.map((factor) => {
                    const clsColor =
                      factor.factor_classification === 'strength'
                        ? 'text-emerald-400'
                        : factor.factor_classification === 'weakness'
                          ? 'text-amber-400'
                          : factor.factor_classification === 'opportunity'
                            ? 'text-sky-400'
                            : 'text-red-400';
                    return (
                      <div
                        key={factor.factor_type_id}
                        className="p-3 bg-bg-primary border border-border/70 rounded-xl space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                          <span className={`uppercase font-bold ${clsColor}`}>
                            {factor.factor_classification}
                          </span>
                          <span className="text-text-secondary truncate">{factor.factor_type_id}</span>
                        </div>
                        <div className="text-xs font-semibold text-text-primary leading-snug line-clamp-1">
                          {factor.factor_name}
                        </div>
                        <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-2">
                          {factor.factor_description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stage 5 Core Deliverable: Pipeline Assessment Evidence Collection Form */}
      <PipelineAssessmentForm
        opportunity={pipelineOpp}
        inheritance={inheritance}
        onAssessmentComplete={handleAssessmentComplete}
      />
    </div>
  );
};

export default OpportunityToPipeline;
