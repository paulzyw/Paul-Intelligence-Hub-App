import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  DollarSign,
  User,
  Calendar,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  FileText,
  Radar as RadarIcon,
  Grid2X2,
  ShieldAlert,
  Compass,
  History,
  GitBranch,
  Award,
  XCircle,
  X,
  ShieldCheck
} from 'lucide-react';
import {
  PipelineOpportunity,
  PipelineInheritance,
  PipelineAssessment,
  PipelinePADFResult,
  PipelineSWOTResult,
  PipelineRisk,
  PipelineStrategy,
  PipelineAction,
  PipelineEvidence,
  PipelineEvidenceRelationship,
  PipelineAssessmentSnapshot,
  PADFDimensionId
} from '../../types/pipeline';
import { PipelineDataService } from '../services/PipelineDataService';
import { PipelineConfigService } from '../services/PipelineConfigService';
import { PADFDimensionHealthView } from './PADFDimensionHealthView';
import { SWOTIntelligenceBoard } from './SWOTIntelligenceBoard';
import { RiskIntelligenceRegister } from './RiskIntelligenceRegister';
import { TOWSStrategyCanvas } from './TOWSStrategyCanvas';
import { PipelineEvolutionTimeline } from './PipelineEvolutionTimeline';
import { PipelineAssessmentForm } from './PipelineAssessmentForm';
import { PipelineGovernanceAuditPanel } from './PipelineGovernanceAuditPanel';

export type WorkspaceTabKey =
  | 'overview'
  | 'padf'
  | 'swot'
  | 'risks'
  | 'tows'
  | 'evolution'
  | 'governance'
  | 'evidence';

export interface PipelineIntelligenceWorkspaceProps {
  opportunity: PipelineOpportunity;
  inheritance: PipelineInheritance | null;
  sourceChannel?: string;
  onOpportunityUpdated?: (opp: PipelineOpportunity) => void;
}

const PIPELINE_STAGE_OPTIONS = [
  'Active Assessment',
  'Discovery & Solutioning',
  'Proposal & Negotiation',
  'Closed Won',
  'Closed Lost'
];

export const PipelineIntelligenceWorkspace: React.FC<PipelineIntelligenceWorkspaceProps> = ({
  opportunity: initialOpp,
  inheritance: initialInheritance,
  sourceChannel = 'pipeline_canvas',
  onOpportunityUpdated
}) => {
  const [opportunity, setOpportunity] = useState<PipelineOpportunity>(initialOpp);
  const [inheritance, setInheritance] = useState<PipelineInheritance | null>(initialInheritance);
  const [activeTab, setActiveTab] = useState<WorkspaceTabKey>('overview');
  const [targetEvidenceDimension, setTargetEvidenceDimension] = useState<PADFDimensionId | undefined>(undefined);
  const [loadingData, setLoadingData] = useState(true);

  const [assessment, setAssessment] = useState<PipelineAssessment | null>(null);
  const [padfResults, setPadfResults] = useState<PipelinePADFResult[]>([]);
  const [swotResults, setSwotResults] = useState<PipelineSWOTResult[]>([]);
  const [risks, setRisks] = useState<PipelineRisk[]>([]);
  const [strategies, setStrategies] = useState<PipelineStrategy[]>([]);
  const [actions, setActions] = useState<PipelineAction[]>([]);
  const [evidence, setEvidence] = useState<PipelineEvidence[]>([]);
  const [evidenceRelationships, setEvidenceRelationships] = useState<PipelineEvidenceRelationship[]>([]);
  const [snapshots, setSnapshots] = useState<PipelineAssessmentSnapshot[]>([]);

  const [showInheritanceModal, setShowInheritanceModal] = useState(false);
  const [showClosureModal, setShowClosureModal] = useState<'CLOSED_WON' | 'CLOSED_LOST' | null>(null);
  const [closureReason, setClosureReason] = useState('');
  const [closureCompetitor, setClosureCompetitor] = useState('');
  const [closureLessons, setClosureLessons] = useState('');
  const [savingStage, setSavingStage] = useState(false);

  useEffect(() => {
    setOpportunity(initialOpp);
  }, [initialOpp]);

  useEffect(() => {
    setInheritance(initialInheritance);
  }, [initialInheritance]);

  const hydrateWorkspace = useCallback(async (pipelineId: string) => {
    setLoadingData(true);
    try {
      const [latest, evList, relList, snapList] = await Promise.all([
        PipelineDataService.getLatestAssessment(pipelineId),
        PipelineDataService.listEvidence(pipelineId),
        PipelineDataService.listEvidenceRelationships(pipelineId),
        PipelineDataService.getAssessmentSnapshots(pipelineId)
      ]);

      let activeRels = relList;
      if (relList.length === 0 && evList.length > 0) {
        activeRels = await PipelineDataService.syncEvidenceRelationships(pipelineId, evList);
      }

      setAssessment(latest.assessment);
      setPadfResults(latest.padf_results);
      setSwotResults(latest.swot_results);
      setRisks(latest.risks);
      setStrategies(latest.strategies);
      setActions(latest.actions);
      setEvidence(evList);
      setEvidenceRelationships(activeRels);
      setSnapshots(snapList);
    } catch (err) {
      console.error('Error hydrating Pipeline Intelligence Workspace:', err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    hydrateWorkspace(opportunity.pipeline_id);
  }, [opportunity.pipeline_id, hydrateWorkspace]);

  const reassessmentAudit = PipelineDataService.evaluateReassessmentNeeds({
    opportunity,
    inheritance,
    assessment,
    evidence,
    risks,
    actions
  });

  const handleStageChange = async (newStage: string) => {
    if (newStage === 'Closed Won') {
      setShowClosureModal('CLOSED_WON');
      return;
    }
    if (newStage === 'Closed Lost') {
      setShowClosureModal('CLOSED_LOST');
      return;
    }

    setSavingStage(true);
    const updated = await PipelineDataService.updatePipelineStage(opportunity.pipeline_id, {
      pipeline_stage: newStage,
      lifecycle_status: 'ACTIVE'
    });
    setSavingStage(false);
    if (updated) {
      setOpportunity(updated);
      if (onOpportunityUpdated) onOpportunityUpdated(updated);
    }
  };

  const handleConfirmClosure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showClosureModal) return;

    setSavingStage(true);
    const stageName = showClosureModal === 'CLOSED_WON' ? 'Closed Won' : 'Closed Lost';
    const updated = await PipelineDataService.updatePipelineStage(opportunity.pipeline_id, {
      pipeline_stage: stageName,
      sales_stage: stageName,
      lifecycle_status: showClosureModal,
      closure_outcome: {
        outcome: showClosureModal,
        primary_reason: closureReason.trim(),
        competitor: closureCompetitor.trim() || undefined,
        lessons_learned: closureLessons.trim() || undefined,
        closed_at: new Date().toISOString()
      }
    });
    setSavingStage(false);
    setShowClosureModal(null);

    if (updated) {
      setOpportunity(updated);
      if (onOpportunityUpdated) onOpportunityUpdated(updated);
    }
  };

  const healthColor = (health?: string) => {
    switch (health) {
      case 'STRONG':
        return 'text-emerald-400';
      case 'HEALTHY':
        return 'text-sky-400';
      case 'MODERATE':
        return 'text-amber-400';
      case 'AT_RISK':
      case 'CRITICAL':
        return 'text-red-400';
      default:
        return 'text-text-secondary';
    }
  };

  const baseWin = assessment?.base_winability ?? 0;
  const riskAdjWin = assessment?.risk_adjusted_winability ?? 0;
  const riskPenalty = baseWin - riskAdjWin;
  const execSummary = assessment?.executive_summary || {};
  const closureMeta = (opportunity.metadata as any)?.closure_outcome;
  const swotMeta = PipelineConfigService.resolveActiveSWOTFactors(
    opportunity.revenue_motion_id || opportunity.revenue_motion_name,
    opportunity.industry_id || opportunity.industry_name
  );

  const formattedDealValue =
    opportunity.deal_value > 0
      ? `${opportunity.currency || 'USD'} $${opportunity.deal_value.toLocaleString('en-US')}`
      : 'USD $0';

  const currentStageSelectValue =
    opportunity.lifecycle_status === 'CLOSED_WON'
      ? 'Closed Won'
      : opportunity.lifecycle_status === 'CLOSED_LOST'
        ? 'Closed Lost'
        : PIPELINE_STAGE_OPTIONS.includes(opportunity.pipeline_stage)
          ? opportunity.pipeline_stage
          : 'Active Assessment';

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/70">
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to="/product/revos/pipeline"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bg-surface border border-border text-xs font-medium text-text-secondary hover:text-text-primary hover:border-accent/40 transition-colors whitespace-nowrap"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Pipeline Canvas</span>
          </Link>

          <Link
            to="/product/revos/leads"
            className="text-xs text-text-secondary hover:text-text-primary transition-colors whitespace-nowrap"
          >
            Lead Canvas
          </Link>

          <span className="text-xs text-text-secondary" aria-hidden="true">/</span>

          <span className="text-xs text-text-primary font-medium truncate max-w-[240px]">
            {opportunity.opportunity_name}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <button
            type="button"
            onClick={() => setShowInheritanceModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg-surface border border-border rounded-xl text-text-secondary hover:text-text-primary hover:border-accent/40 transition-colors cursor-pointer whitespace-nowrap"
          >
            <GitBranch className="h-3.5 w-3.5 text-accent" />
            <span>PADIF Inheritance</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('evidence')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-accent text-black font-bold rounded-xl hover:bg-accent-hover transition-colors cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Evidence & Reassess</span>
          </button>
        </div>
      </div>

      {/* Persistent Opportunity Assessment Workspace Header */}
      <div className="bg-bg-surface border border-border rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
              <Building2 className="h-3.5 w-3.5 text-accent shrink-0" />
              <span className="font-semibold text-text-primary">{opportunity.customer_name}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{opportunity.pipeline_id}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{sourceChannel}</span>
            </div>

            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              {opportunity.opportunity_name}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
              <span>{swotMeta.industryName}</span>
              <span aria-hidden="true">·</span>
              <span>{swotMeta.revenueMotionName}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <User className="h-3 w-3" />
                {opportunity.opportunity_owner}
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                <DollarSign className="h-3 w-3" />
                {formattedDealValue}
              </span>
              {opportunity.expected_close_date && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                    <Calendar className="h-3 w-3" />
                    Close {opportunity.expected_close_date}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Pipeline Stage & Deal Outcome Controls */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <select
              value={currentStageSelectValue}
              disabled={savingStage}
              onChange={(e) => handleStageChange(e.target.value)}
              className="px-3 py-2 bg-bg-primary border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-accent cursor-pointer"
            >
              {PIPELINE_STAGE_OPTIONS.map((stage) => (
                <option key={stage} value={stage}>
                  Stage: {stage}
                </option>
              ))}
            </select>

            {opportunity.lifecycle_status === 'ACTIVE' && (
              <>
                <button
                  type="button"
                  onClick={() => setShowClosureModal('CLOSED_WON')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-bg-primary border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Award className="h-3.5 w-3.5" />
                  <span>Close Won</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowClosureModal('CLOSED_LOST')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-bg-primary border border-red-500/40 text-red-400 hover:bg-red-500/10 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Close Lost</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Closed Deal Outcome Banner if closed */}
        {(opportunity.lifecycle_status === 'CLOSED_WON' ||
          opportunity.lifecycle_status === 'CLOSED_LOST') && (
          <div
            className={`p-4 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              opportunity.lifecycle_status === 'CLOSED_WON'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-red-500/10 border-red-500/40 text-red-300'
            }`}
          >
            <div className="space-y-0.5">
              <div className="font-bold">
                Outcome Recorded: {opportunity.lifecycle_status === 'CLOSED_WON' ? 'Closed Won' : 'Closed Lost'}
              </div>
              {closureMeta?.primary_reason && (
                <div className="text-text-secondary">
                  Reason: {closureMeta.primary_reason}
                  {closureMeta.competitor ? ` · Competitor: ${closureMeta.competitor}` : ''}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleStageChange('Proposal & Negotiation')}
              className="px-3 py-1.5 bg-bg-primary border border-border rounded-lg text-xs text-text-primary hover:border-accent/50 cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              Reopen Opportunity
            </button>
          </div>
        )}

        {/* 4 Distinct Assessment Metric Blocks (Strictly Separated Concepts) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="p-4 bg-bg-primary border border-border/80 rounded-xl space-y-1">
            <div className="text-[11px] text-text-secondary">Base Winability (PADF)</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-text-primary">
              {assessment ? `${baseWin}%` : '--'}
            </div>
            <div className="text-[11px] text-text-secondary font-mono">
              Deterministic PA1–PA8 weighted
            </div>
          </div>

          <div className="p-4 bg-bg-primary border border-border/80 rounded-xl space-y-1">
            <div className="text-[11px] text-text-secondary">Risk-Adjusted Winability</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-accent">
              {assessment ? `${riskAdjWin}%` : '--'}
            </div>
            <div className="text-[11px] text-text-secondary font-mono tabular-nums">
              {assessment
                ? riskPenalty > 0
                  ? `−${riskPenalty}% formal risk penalty`
                  : 'Zero unmitigated risk penalty'
                : 'Awaiting assessment run'}
            </div>
          </div>

          <div className="p-4 bg-bg-primary border border-border/80 rounded-xl space-y-1">
            <div className="text-[11px] text-text-secondary">Pipeline Health</div>
            <div className={`text-xl font-bold font-mono ${healthColor(assessment?.pipeline_health)}`}>
              {assessment?.pipeline_health || 'UNASSESSED'}
            </div>
            <div className="text-[11px] text-text-secondary font-mono tabular-nums">
              {assessment ? `Run #${assessment.assessment_sequence}` : 'Run initial assessment'}
            </div>
          </div>

          <div className="p-4 bg-bg-primary border border-border/80 rounded-xl space-y-1">
            <div className="text-[11px] text-text-secondary">Assessment Confidence</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-text-primary">
              {assessment ? `${assessment.assessment_confidence}%` : '--'}
            </div>
            <div className="text-[11px] text-text-secondary font-mono tabular-nums">
              {evidence.length} / 48 evidence items logged
            </div>
          </div>
        </div>
        {/* Continuous Monitoring & Material Change Banner */}
        {!loadingData && reassessmentAudit.reassessmentRequired && activeTab !== 'evidence' && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5 text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold">Material Changes Detected — Reassessment Recommended</div>
                <div className="text-text-secondary">
                  {reassessmentAudit.reasons[0]}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setTargetEvidenceDimension(undefined);
                setActiveTab('evidence');
              }}
              className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-black font-bold rounded-xl text-xs whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
            >
              Review & Re-Run Assessment
            </button>
          </div>
        )}
      </div>

      {/* Multi-Tab Intelligence Workspace Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border/70">
        {[
          { key: 'overview', label: 'Executive Summary', icon: Sparkles },
          { key: 'padf', label: 'PADF Dimensions (8)', icon: RadarIcon },
          { key: 'swot', label: 'SWOT Intelligence (16)', icon: Grid2X2 },
          { key: 'risks', label: `Risk Register (${risks.length})`, icon: ShieldAlert },
          { key: 'tows', label: `TOWS & Actions (${strategies.length})`, icon: Compass },
          { key: 'evolution', label: `Evolution Timeline (${snapshots.length})`, icon: History },
          { key: 'governance', label: 'Governance & Audit', icon: ShieldCheck },
          { key: 'evidence', label: `Evidence Intake (${evidence.length}/48)`, icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as WorkspaceTabKey)}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                active
                  ? 'border-accent text-text-primary bg-bg-surface'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${active ? 'text-accent' : ''}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Workspace Tab Body */}
      {loadingData ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-3 text-text-secondary">
          <RefreshCw className="h-6 w-6 animate-spin text-accent" />
          <span className="text-xs font-mono">Loading Pipeline Intelligence Workspace...</span>
        </div>
      ) : activeTab === 'evidence' ? (
        <PipelineAssessmentForm
          opportunity={opportunity}
          inheritance={inheritance}
          initialDimension={targetEvidenceDimension}
          onBack={() => setActiveTab('overview')}
          onEvidenceSaved={async () => {
            const [evList, relList] = await Promise.all([
              PipelineDataService.listEvidence(opportunity.pipeline_id),
              PipelineDataService.listEvidenceRelationships(opportunity.pipeline_id)
            ]);
            setEvidence(evList);
            setEvidenceRelationships(relList);
          }}
          onAssessmentComplete={async () => {
            await hydrateWorkspace(opportunity.pipeline_id);
            setActiveTab('overview');
          }}
        />
      ) : activeTab === 'governance' ? (
        <PipelineGovernanceAuditPanel
          opportunity={opportunity}
          inheritance={inheritance}
          assessment={assessment}
          evidence={evidence}
          evidenceRelationships={evidenceRelationships}
          padfResults={padfResults}
          swotResults={swotResults}
          risks={risks}
          strategies={strategies}
          actions={actions}
          snapshots={snapshots}
          reassessmentAudit={reassessmentAudit}
          onInheritanceRevalidated={(updated) => setInheritance(updated)}
          onTriggerReassessment={() => {
            setTargetEvidenceDimension(undefined);
            setActiveTab('evidence');
          }}
        />
      ) : !assessment ? (
        <div className="bg-bg-surface border border-border rounded-2xl p-10 text-center space-y-4">
          <Sparkles className="h-9 w-9 text-accent mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-text-primary">
              Ready for Initial Pipeline Assessment
            </h3>
            <p className="text-xs text-text-secondary max-w-lg mx-auto">
              Populate verified deal evidence across the 8 PADF dimensions and run the deterministic + Gemini reasoning engine to unlock SWOT intelligence, risks, and TOWS winning strategies.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('evidence')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-black font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            <span>Open Evidence Intake Form</span>
          </button>
        </div>
      ) : activeTab === 'overview' ? (
        <div className="space-y-6">
          {/* Executive Narrative */}
          <div className="bg-bg-surface border border-border rounded-2xl p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <span>Executive Pipeline Assessment Narrative</span>
              </h2>
              <span className="text-[11px] font-mono text-text-secondary">
                {assessment.model_identifier} · Rules v{assessment.rules_version}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-text-primary leading-relaxed">
              {execSummary.overall_assessment ||
                'Deterministic PADF scoring and Gemini SWOT/TOWS strategic assessment completed and persisted.'}
            </p>
          </div>

          {/* 2-Column Drivers & Constraints */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-bg-surface border border-border rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Key Positive Drivers</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('padf')}
                  className="text-xs text-text-secondary hover:text-accent cursor-pointer"
                >
                  Inspect PADF →
                </button>
              </div>
              {(execSummary.current_strengths || []).length > 0 ? (
                <ul className="space-y-2 text-xs text-text-secondary">
                  {(execSummary.current_strengths || []).map((item, i) => (
                    <li key={i} className="leading-relaxed">
                      • {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-text-secondary italic">
                  No positive drivers highlighted yet.
                </p>
              )}
            </div>

            <div className="bg-bg-surface border border-border rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Critical Constraints & Evidence Gaps</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('risks')}
                  className="text-xs text-text-secondary hover:text-accent cursor-pointer"
                >
                  Risk Register →
                </button>
              </div>
              {(execSummary.key_constraints || []).length > 0 ||
              (execSummary.evidence_gaps || []).length > 0 ? (
                <ul className="space-y-2 text-xs text-text-secondary">
                  {(execSummary.key_constraints || []).map((item, i) => (
                    <li key={`c-${i}`} className="leading-relaxed">
                      • {item}
                    </li>
                  ))}
                  {(execSummary.evidence_gaps || []).map((gap, i) => (
                    <li key={`g-${i}`} className="leading-relaxed text-amber-300/90">
                      • Gap: {gap}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-text-secondary italic">
                  No severe structural constraints flagged.
                </p>
              )}
            </div>
          </div>

          {/* Priority Interventions Preview + Intelligence Section Cards */}
          <div className="bg-bg-surface border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Compass className="h-4 w-4 text-accent" />
                <span>Priority Interventions & Next Best Actions</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('tows')}
                className="text-xs font-semibold text-accent hover:underline cursor-pointer"
              >
                Open Full TOWS & Action Tracker →
              </button>
            </div>

            {(execSummary.priority_actions || []).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(execSummary.priority_actions || []).slice(0, 4).map((pa, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-bg-primary border border-border/70 rounded-xl text-xs text-text-primary leading-relaxed"
                  >
                    <span className="font-mono text-accent mr-2">0{idx + 1}.</span>
                    {pa}
                  </div>
                ))}
              </div>
            ) : actions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {actions.slice(0, 4).map((act, idx) => (
                  <div
                    key={act.action_id}
                    className="p-3.5 bg-bg-primary border border-border/70 rounded-xl text-xs space-y-1"
                  >
                    <div className="font-mono text-[11px] text-accent">
                      0{idx + 1} · {act.priority} · {act.action_status}
                    </div>
                    <div className="text-text-primary font-medium">{act.action_description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-secondary">
                Inspect the TOWS & Winning Strategy tab for strategic playbooks.
              </p>
            )}
          </div>
        </div>
      ) : activeTab === 'padf' ? (
        <PADFDimensionHealthView
          opportunity={opportunity}
          padfResults={padfResults}
          evidence={evidence}
          onEditDimensionEvidence={(dimId) => {
            setTargetEvidenceDimension(dimId as PADFDimensionId);
            setActiveTab('evidence');
          }}
        />
      ) : activeTab === 'swot' ? (
        <SWOTIntelligenceBoard
          swotResults={swotResults}
          evidence={evidence}
          evidenceRelationships={evidenceRelationships}
          revenueMotionId={opportunity.revenue_motion_id}
          industryId={opportunity.industry_id}
        />
      ) : activeTab === 'risks' ? (
        <RiskIntelligenceRegister
          risks={risks}
          onRiskUpdated={(updated) =>
            setRisks((prev) =>
              prev.map((r) => (r.risk_instance_id === updated.risk_instance_id ? updated : r))
            )
          }
        />
      ) : activeTab === 'tows' ? (
        <TOWSStrategyCanvas
          strategies={strategies}
          actions={actions}
          onStrategyUpdated={(updated) =>
            setStrategies((prev) =>
              prev.map((s) =>
                s.strategy_instance_id === updated.strategy_instance_id ? updated : s
              )
            )
          }
          onActionUpdated={(updated) =>
            setActions((prev) =>
              prev.map((a) => (a.action_id === updated.action_id ? updated : a))
            )
          }
        />
      ) : (
        <PipelineEvolutionTimeline snapshots={snapshots} />
      )}

      {/* PADIF Upstream Inheritance Inspection Modal */}
      {showInheritanceModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-bg-surface border border-border rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
                <GitBranch className="h-4 w-4 text-accent" />
                <span>PADIF v1.0 Upstream Inheritance Context</span>
              </div>
              <button
                type="button"
                onClick={() => setShowInheritanceModal(false)}
                className="p-1.5 rounded-lg bg-bg-primary border border-border text-text-secondary hover:text-text-primary cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {inheritance ? (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-3 gap-3 font-mono tabular-nums">
                  <div className="p-3 bg-bg-primary border border-border/70 rounded-xl">
                    <div className="text-[10px] text-text-secondary">Source Module</div>
                    <div className="font-semibold text-text-primary mt-0.5">
                      {inheritance.source_module}
                    </div>
                  </div>
                  <div className="p-3 bg-bg-primary border border-border/70 rounded-xl">
                    <div className="text-[10px] text-text-secondary">OQ Score</div>
                    <div className="font-semibold text-accent mt-0.5">
                      {inheritance.qualification_score ?? '--'}/100
                    </div>
                  </div>
                  <div className="p-3 bg-bg-primary border border-border/70 rounded-xl">
                    <div className="text-[10px] text-text-secondary">Decision</div>
                    <div className="font-semibold text-emerald-400 mt-0.5">
                      {inheritance.qualification_decision || 'QUALIFIED'}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-bg-primary border border-border/70 rounded-xl space-y-2">
                  <div className="font-semibold text-text-primary">Inherited Payload Summary</div>
                  <pre className="text-[11px] font-mono text-text-secondary whitespace-pre-wrap overflow-x-auto max-h-64">
                    {JSON.stringify(inheritance.inherited_payload, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-xs text-text-secondary">
                No upstream inheritance record attached to this opportunity.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Closed Won / Closed Lost Outcome Capture Modal */}
      {showClosureModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmClosure}
            className="bg-bg-surface border border-border rounded-2xl max-w-lg w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
                {showClosureModal === 'CLOSED_WON' ? (
                  <Award className="h-4 w-4 text-emerald-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-400" />
                )}
                <span>
                  Record Deal Outcome —{' '}
                  {showClosureModal === 'CLOSED_WON' ? 'Closed Won' : 'Closed Lost'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowClosureModal(null)}
                className="p-1.5 rounded-lg bg-bg-primary border border-border text-text-secondary hover:text-text-primary cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-text-primary mb-1">
                  Primary Outcome Reason *
                </label>
                <input
                  type="text"
                  required
                  value={closureReason}
                  onChange={(e) => setClosureReason(e.target.value)}
                  placeholder={
                    showClosureModal === 'CLOSED_WON'
                      ? 'e.g., Executive sponsor alignment + confirmed ROI business case'
                      : 'e.g., Lost on incumbent pricing / stalled security sign-off'
                  }
                  className="w-full px-3 py-2 bg-bg-primary border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block font-semibold text-text-primary mb-1">
                  Key Competitor (optional)
                </label>
                <input
                  type="text"
                  value={closureCompetitor}
                  onChange={(e) => setClosureCompetitor(e.target.value)}
                  placeholder="e.g., Incumbent ERP vendor / In-house team"
                  className="w-full px-3 py-2 bg-bg-primary border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block font-semibold text-text-primary mb-1">
                  Post-Outcome Lessons Learned
                </label>
                <textarea
                  rows={3}
                  value={closureLessons}
                  onChange={(e) => setClosureLessons(e.target.value)}
                  placeholder="Capture deal execution lessons for institutional memory..."
                  className="w-full px-3 py-2 bg-bg-primary border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClosureModal(null)}
                className="px-4 py-2 bg-bg-primary border border-border rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingStage}
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-black font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                {savingStage ? 'Saving...' : 'Confirm Outcome'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PipelineIntelligenceWorkspace;
