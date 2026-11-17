import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Briefcase,
  Calendar,
  DollarSign,
  User,
  Layers,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  GitBranch,
  Target,
  X
} from 'lucide-react';
import {
  PipelineOpportunity,
  PipelineInheritance,
  PipelineAssessment,
  PipelineOpportunityHandoverDetail,
  PADFDimensionId
} from '../../types/pipeline';
import { PipelineDataService } from '../services/PipelineDataService';
import { PipelineConfigService, ActiveFactorResolutionResult } from '../services/PipelineConfigService';
import { PipelineAssessmentForm } from './PipelineAssessmentForm';
import { PipelineIntelligenceWorkspace } from './PipelineIntelligenceWorkspace';
import { OpportunityHandoverDetail } from './OpportunityHandoverDetail';
import { PipelineForm } from './PipelineForm';

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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const opportunityId = opportunityIdOverride || searchParams.get('opportunityId') || '';
  const leadId = leadIdOverride || searchParams.get('leadId') || undefined;
  const sourceChannel = searchParams.get('source') || 'lead_canvas_opp';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pipelineOpp, setPipelineOpp] = useState<PipelineOpportunity | null>(null);
  const [inheritance, setInheritance] = useState<PipelineInheritance | null>(null);
  const [handoverDetail, setHandoverDetail] = useState<PipelineOpportunityHandoverDetail | null>(null);
  const [syncingHandover, setSyncingHandover] = useState(false);
  const [revalidatingHandover, setRevalidatingHandover] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);

  const [swotResolution, setSwotResolution] = useState<ActiveFactorResolutionResult | null>(null);
  const [latestAssessment, setLatestAssessment] = useState<PipelineAssessment | null>(null);
  const [lastRunSummary, setLastRunSummary] = useState<any>(null);
  const [showWorkspace, setShowWorkspace] = useState(false);

  const [swotExpanded, setSwotExpanded] = useState(false);
  const [swotLayerTab, setSwotLayerTab] = useState<'all' | 'universal_baseline' | 'revenue_motion_override' | 'industry_override'>('all');
  const [assessmentFormOpen, setAssessmentFormOpen] = useState(false);
  const [targetEvidenceDimension, setTargetEvidenceDimension] = useState<PADFDimensionId | undefined>(undefined);
  const assessmentFormRef = useRef<HTMLDivElement>(null);
  const assessmentResultRef = useRef<HTMLDivElement>(null);
  const rootContainerRef = useRef<HTMLDivElement>(null);
  const prevLoadingRef = useRef<boolean>(true);

  const scrollToPageTop = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    const scrollMain = rootContainerRef.current?.closest('main') || document.querySelector('main');
    if (scrollMain) {
      scrollMain.scrollTop = 0;
    }

    let parent: HTMLElement | null = rootContainerRef.current?.parentElement || null;
    while (parent) {
      if (parent.scrollTop > 0) {
        parent.scrollTop = 0;
      }
      parent = parent.parentElement;
    }
  }, []);

  useEffect(() => {
    setAssessmentFormOpen(false);
    scrollToPageTop();
  }, [opportunityId, leadId, scrollToPageTop]);

  useEffect(() => {
    if (prevLoadingRef.current && !loading) {
      const raf = requestAnimationFrame(() => scrollToPageTop());
      prevLoadingRef.current = loading;
      return () => cancelAnimationFrame(raf);
    }
    prevLoadingRef.current = loading;
  }, [loading, scrollToPageTop]);

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

        // 3. Hydrate Dedicated & Isolated Opportunity Handover Detail (PADIF v1.0) & Existing Evidence Check
        const [handoverRes, latest, existingEvidence] = await Promise.all([
          PipelineDataService.getOrSyncOpportunityHandoverDetail(opportunity, inh).catch((e) => {
            console.warn('Opportunity Handover hydration warning:', e);
            return null;
          }),
          PipelineDataService.getLatestAssessment(opportunity.pipeline_id),
          PipelineDataService.listEvidence(opportunity.pipeline_id).catch(() => [])
        ]);

        if (!mounted) return;
        if (handoverRes) setHandoverDetail(handoverRes);

        // Auto-open Pipeline Assessment Form if any saved evidence or assessment exists in Supabase under this pipeline
        setAssessmentFormOpen(
          (Array.isArray(existingEvidence) && existingEvidence.length > 0) || Boolean(latest?.assessment)
        );

        // 4. Check for existing completed Pipeline Assessment
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

  const handleSyncHandover = async () => {
    if (!pipelineOpp) return;
    setSyncingHandover(true);
    try {
      const updated = await PipelineDataService.getOrSyncOpportunityHandoverDetail(
        pipelineOpp,
        inheritance,
        true
      );
      setHandoverDetail(updated);
    } finally {
      setSyncingHandover(false);
    }
  };

  const handleRevalidateHandover = async () => {
    if (!pipelineOpp) return;
    setRevalidatingHandover(true);
    try {
      const updated = await PipelineDataService.revalidateOpportunityHandover(
        pipelineOpp.pipeline_id
      );
      if (updated) {
        setHandoverDetail(updated);
      }
    } finally {
      setRevalidatingHandover(false);
    }
  };

  const displayedSwotFactors = useMemo(() => {
    if (!swotResolution) return [];
    if (swotLayerTab === 'all') return swotResolution.active16Factors;
    return swotResolution.active16Factors.filter((f) => f.layer === swotLayerTab);
  }, [swotResolution, swotLayerTab]);

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
      <div ref={rootContainerRef} className="p-10 flex flex-col items-center justify-center min-h-[55vh] space-y-3">
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
    setTimeout(() => {
      assessmentResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    if (onAssessmentReady && pipelineOpp) {
      onAssessmentReady(result, pipelineOpp);
    }
  };

  return (
    <div ref={rootContainerRef} className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Isolated Route Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/70">
        <div className="flex items-center gap-3 flex-wrap">
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
      <div className="bg-bg-surface border border-border rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <Building2 className="h-3.5 w-3.5 text-accent shrink-0" />
                <span className="font-semibold text-text-primary">{pipelineOpp.customer_name}</span>
              </div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                {pipelineOpp.opportunity_name}
              </h1>
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

          <button
            type="button"
            onClick={() => navigate('/product/revos/pipeline')}
            className="p-2 rounded-xl bg-bg-primary border border-border text-text-secondary hover:text-text-primary hover:border-accent/50 transition-colors cursor-pointer shrink-0"
            title="Close and return to Pipeline Canvas"
            aria-label="Close and return to Pipeline Canvas"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
          <span>{swotResolution?.industryName || pipelineOpp.industry_name}</span>
          <span aria-hidden="true">·</span>
          <span>{swotResolution?.revenueMotionName || pipelineOpp.revenue_motion_name}</span>
          <span aria-hidden="true">·</span>
          <span>Opportunity Stage: {pipelineOpp.sales_stage}</span>
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

      {/* Opportunity Handover Detail (PADIF v1.0 — Dedicated & Isolated Persistence) */}
      <OpportunityHandoverDetail
        opportunity={pipelineOpp}
        inheritance={inheritance}
        handoverDetail={handoverDetail}
        syncing={syncingHandover}
        revalidating={revalidatingHandover}
        onSyncUpstream={handleSyncHandover}
        onRevalidateHandover={handleRevalidateHandover}
      />

      {/* Active 16 SWOT Factor Matrix (8 Universal + 4 Motion + 4 Industry) */}
      {swotResolution && (
        <div className="bg-bg-surface border border-border rounded-2xl">
          <button
            type="button"
            onClick={() => setSwotExpanded((prev) => !prev)}
            className={`w-full px-5 sm:px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-bg-primary/40 transition-colors cursor-pointer ${
              swotExpanded ? 'rounded-t-2xl' : 'rounded-2xl'
            }`}
          >
            <div className="flex items-center gap-3">
              <GitBranch className="h-4 w-4 text-accent shrink-0" />
              <div>
                <h2 className="text-sm font-bold text-text-primary">
                  SWOT Factor Matrix ({swotResolution.universalFactors.length} Universal +{' '}
                  {swotResolution.revenueMotionFactors.length} Motion +{' '}
                  {swotResolution.industryFactors.length} Industry)
                </h2>
                <p className="text-xs text-text-secondary">
                  Canonical {swotResolution.canonicalRevenueMotionId} &amp; {swotResolution.canonicalIndustryId}
                </p>
              </div>
            </div>
            {swotExpanded ? (
              <ChevronUp className="h-4 w-4 text-text-secondary shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-text-secondary shrink-0" />
            )}
          </button>

          {swotExpanded && (
            <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-border/60 space-y-3">
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
                {displayedSwotFactors.map((factor, idx) => {
                  const clsColor =
                    factor.factor_classification === 'strength'
                      ? 'text-emerald-400'
                      : factor.factor_classification === 'weakness'
                        ? 'text-amber-400'
                        : factor.factor_classification === 'opportunity'
                          ? 'text-sky-400'
                          : 'text-red-400';

                  const smAlign = idx % 2 === 0 ? 'sm:left-0 sm:right-auto' : 'sm:right-0 sm:left-auto';
                  const lgAlign =
                    idx % 4 === 0
                      ? 'lg:left-0 lg:right-auto lg:translate-x-0'
                      : idx % 4 === 3
                        ? 'lg:right-0 lg:left-auto lg:translate-x-0'
                        : 'lg:left-1/2 lg:right-auto lg:-translate-x-1/2';

                  return (
                    <div
                      key={factor.factor_type_id}
                      className="relative group p-3 bg-bg-primary border border-border/70 rounded-xl space-y-1 hover:border-accent/40 transition-colors"
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

                      {/* Hover Tooltip showing full untruncated factor card text */}
                      <div
                        role="tooltip"
                        className={`pointer-events-none absolute bottom-full mb-2 left-0 right-0 sm:w-80 ${smAlign} ${lgAlign} p-3.5 bg-bg-surface border border-border rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-30 space-y-1.5`}
                      >
                        <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                          <span className={`uppercase font-bold ${clsColor}`}>
                            {factor.factor_classification}
                          </span>
                          <span className="text-text-secondary break-all text-right">
                            {factor.factor_type_id}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-text-primary leading-snug">
                          {factor.factor_name}
                        </div>
                        <p className="text-[11px] text-text-secondary leading-relaxed">
                          {factor.factor_description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pipeline Form (After Active 16 SWOT Factor Matrix — Supabase Persistence) */}
      <PipelineForm
        opportunity={pipelineOpp}
        handoverDetail={handoverDetail}
        onUpdate={(updatedOpp, savedForm) => {
          setPipelineOpp(updatedOpp);
          setHandoverDetail((prev) => {
            if (!prev || !prev.canonical_classification) return prev;
            return {
              ...prev,
              canonical_classification: {
                ...prev.canonical_classification,
                opportunity_identity: {
                  ...prev.canonical_classification.opportunity_identity,
                  account_name: savedForm.company_name,
                  opportunity_name: savedForm.opportunity_name,
                  opportunity_owner: savedForm.opportunity_owner
                },
                commercial_context: {
                  ...prev.canonical_classification.commercial_context,
                  estimated_value: savedForm.deal_value,
                  currency: updatedOpp.currency,
                  expected_close_date:
                    savedForm.expected_close_date ||
                    prev.canonical_classification.commercial_context.expected_close_date
                },
                lifecycle_context: {
                  ...prev.canonical_classification.lifecycle_context,
                  current_opportunity_stage: savedForm.opportunity_stage,
                  pipeline_stage: savedForm.pipeline_stage
                }
              },
              updated_at: new Date().toISOString()
            };
          });
        }}
        onStartAssessment={() => {
          setAssessmentFormOpen(true);
          setTimeout(() => {
            assessmentFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }}
      />

      {/* Stage 5 Core Deliverable: Pipeline Assessment Evidence Collection Form (Opened only after clicking Start Assessment) */}
      {assessmentFormOpen && (
        <div ref={assessmentFormRef}>
          <PipelineAssessmentForm
            opportunity={pipelineOpp}
            inheritance={inheritance}
            initialDimension={targetEvidenceDimension}
            onAssessmentComplete={handleAssessmentComplete}
          />
        </div>
      )}

      {/* Stage 6 Assessment Result Workspace (Displayed below Pipeline Assessment Form after Run Assessment or when stored in Supabase) */}
      {showWorkspace && (latestAssessment || lastRunSummary) && (
        <div ref={assessmentResultRef} className="pt-2">
          <PipelineIntelligenceWorkspace
            embedded
            opportunity={pipelineOpp}
            inheritance={inheritance}
            sourceChannel={sourceChannel}
            initialResult={lastRunSummary}
            onOpportunityUpdated={(updated) => setPipelineOpp(updated)}
            onRequestEditDimensionEvidence={(dimId) => {
              setAssessmentFormOpen(true);
              setTargetEvidenceDimension(dimId);
              setTimeout(() => {
                assessmentFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 80);
            }}
            onTriggerReassessment={() => {
              setAssessmentFormOpen(true);
              setTargetEvidenceDimension(undefined);
              setTimeout(() => {
                assessmentFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 80);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default OpportunityToPipeline;
