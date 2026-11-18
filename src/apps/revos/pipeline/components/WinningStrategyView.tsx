import React, { useMemo, useState } from 'react';
import {
  Target,
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  FileCheck2,
  User,
  Clock,
  Layers
} from 'lucide-react';
import {
  PipelineAssessment,
  PipelineOpportunity,
  PipelinePADFResult,
  PipelineSWOTResult,
  PipelineRisk,
  PipelineStrategy,
  PipelineEvidence,
  PipelineWinningStrategy,
  PipelineWinningStrategySummary,
  WinningStrategyExecutionStatus
} from '../../types/pipeline';
import { PipelineDataService } from '../services/PipelineDataService';

export interface WinningStrategyViewProps {
  opportunity: PipelineOpportunity;
  assessment: PipelineAssessment;
  padfResults: PipelinePADFResult[];
  swotResults: PipelineSWOTResult[];
  risks: PipelineRisk[];
  towsStrategies: PipelineStrategy[];
  evidence: PipelineEvidence[];
  onAssessmentUpdated?: (updated: PipelineAssessment) => void;
  onTriggerReassessment?: () => void;
}

const PRIORITY_ORDER: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3
};

const priorityColor = (priority?: string) => {
  switch (String(priority || '').toUpperCase()) {
    case 'CRITICAL':
      return 'text-red-400';
    case 'HIGH':
      return 'text-amber-400';
    case 'MEDIUM':
      return 'text-sky-400';
    default:
      return 'text-text-secondary';
  }
};

const feasibilityColor = (feasibility?: string) => {
  switch (String(feasibility || '').toUpperCase()) {
    case 'HIGH':
      return 'text-emerald-400';
    case 'MODERATE':
      return 'text-amber-400';
    case 'CHALLENGING':
      return 'text-red-400';
    default:
      return 'text-text-secondary';
  }
};

const towsLabel = (cat?: string) => {
  const c = String(cat || '').toUpperCase();
  if (c === 'SO') return 'SO · Strengths × Opportunities';
  if (c === 'WO') return 'WO · Weaknesses × Opportunities';
  if (c === 'ST') return 'ST · Strengths × Threats';
  if (c === 'WT') return 'WT · Weaknesses × Threats';
  return 'Direct Strategic Play (No TOWS Pairing Required)';
};

export const WinningStrategyView: React.FC<WinningStrategyViewProps> = ({
  opportunity,
  assessment,
  padfResults,
  swotResults,
  risks,
  towsStrategies,
  evidence,
  onAssessmentUpdated,
  onTriggerReassessment
}) => {
  const winningStrategies: PipelineWinningStrategy[] = useMemo(() => {
    const raw = assessment.raw_reasoning_output?.winning_strategies;
    if (!Array.isArray(raw)) return [];
    return [...raw].sort(
      (a, b) =>
        (PRIORITY_ORDER[String(a.priority || 'HIGH').toUpperCase()] ?? 2) -
        (PRIORITY_ORDER[String(b.priority || 'HIGH').toUpperCase()] ?? 2)
    );
  }, [assessment]);

  const summary: PipelineWinningStrategySummary | null = useMemo(() => {
    return (assessment.raw_reasoning_output?.winning_strategy_summary as PipelineWinningStrategySummary) || null;
  }, [assessment]);

  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | WinningStrategyExecutionStatus>('ALL');
  const [expandedChains, setExpandedChains] = useState<Record<string, boolean>>({});
  const [savingStrategyId, setSavingStrategyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredStrategies = useMemo(() => {
    return winningStrategies.filter((ws) => {
      const pMatch =
        priorityFilter === 'ALL' || String(ws.priority || '').toUpperCase() === priorityFilter;
      const sMatch = statusFilter === 'ALL' || ws.execution_status === statusFilter;
      return pMatch && sMatch;
    });
  }, [winningStrategies, priorityFilter, statusFilter]);

  const swotLookup = useMemo(() => {
    const map = new Map<string, PipelineSWOTResult>();
    swotResults.forEach((s) => map.set(s.factor_id, s));
    return map;
  }, [swotResults]);

  const evidenceLookup = useMemo(() => {
    const map = new Map<string, PipelineEvidence>();
    evidence.forEach((ev) => {
      if (ev.evidence_object_id) map.set(ev.evidence_object_id, ev);
    });
    return map;
  }, [evidence]);

  const riskLookup = useMemo(() => {
    const map = new Map<string, PipelineRisk>();
    risks.forEach((r) => map.set(r.risk_id, r));
    return map;
  }, [risks]);

  const toggleChain = (strategyId: string) => {
    setExpandedChains((prev) => ({
      ...prev,
      [strategyId]: !prev[strategyId]
    }));
  };

  const handleStatusChange = async (
    ws: PipelineWinningStrategy,
    nextStatus: WinningStrategyExecutionStatus
  ) => {
    setSavingStrategyId(ws.strategy_id);
    setFeedback(null);
    setErrorMsg(null);
    try {
      const updatedAssessment = await PipelineDataService.updateWinningStrategyStatus(
        opportunity.pipeline_id,
        assessment,
        ws.strategy_id,
        nextStatus
      );
      if (updatedAssessment && onAssessmentUpdated) {
        onAssessmentUpdated(updatedAssessment);
      }
      setFeedback(`Execution status for "${ws.title}" updated to ${nextStatus}.`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to update winning strategy execution status.');
    } finally {
      setSavingStrategyId(null);
    }
  };

  // Legacy assessment saved before Winning Strategy Engine was introduced
  if (winningStrategies.length === 0) {
    return (
      <div className="bg-bg-surface border border-border rounded-2xl p-8 sm:p-10 space-y-5">
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <Target className="h-9 w-9 text-accent mx-auto" />
          <h3 className="text-base font-bold text-text-primary">
            Opportunity-Specific Winning Strategy Pending Generation
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            This saved assessment snapshot ({assessment.assessment_id}) was generated before the integrated Winning Strategy Engine was enabled. Re-run the assessment engine to synthesize evidence-grounded strategies for{' '}
            <span className="text-text-primary font-medium">{opportunity.customer_name}</span> across your {evidence.length} logged evidence items, {padfResults.length} PADF dimensions, {swotResults.length} SWOT factors, {risks.length} formal risks, and {towsStrategies.length} TOWS combinations.
          </p>
          {onTriggerReassessment && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onTriggerReassessment}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-black font-bold text-xs rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Re-Run Assessment to Generate Winning Strategies</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const criticalOrHighCount = winningStrategies.filter((ws) =>
    ['CRITICAL', 'HIGH'].includes(String(ws.priority || '').toUpperCase())
  ).length;
  const activeCount = winningStrategies.filter((ws) =>
    ['APPROVED', 'IN_PROGRESS', 'COMPLETED'].includes(ws.execution_status)
  ).length;

  return (
    <div className="space-y-6">
      {/* Status Feedback */}
      {feedback && (
        <div className="px-4 py-2.5 bg-bg-surface border border-emerald-500/40 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}
      {errorMsg && (
        <div className="px-4 py-2.5 bg-bg-surface border border-red-500/40 rounded-xl text-xs text-red-400 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Executive Strategic Synthesis & End-to-End Lineage Header */}
      <div className="bg-bg-surface border border-border rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-4 border-b border-border/60">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary font-mono tabular-nums">
              <span className="text-accent font-semibold">Integrated Winning Strategy</span>
              <span aria-hidden="true">·</span>
              <span>{winningStrategies.length} Strategies</span>
              <span aria-hidden="true">·</span>
              <span>{criticalOrHighCount} Critical/High Priority</span>
              <span aria-hidden="true">·</span>
              <span>{activeCount} Approved / In Execution</span>
            </div>
            <h2 className="text-lg font-bold text-text-primary leading-snug">
              {summary?.primary_winning_thesis ||
                `Winning Strategy Blueprint for ${opportunity.customer_name} — ${opportunity.opportunity_name}`}
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              {summary?.winability_context_note ||
                `Calibrated against Base Winability (${assessment.base_winability}%), Risk-Adjusted Winability (${assessment.risk_adjusted_winability}%), and ${assessment.pipeline_health} health status to improve both probability and commercial quality of winning.`}
            </p>
          </div>

          {/* Interactive Filters */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <select
              aria-label="Filter strategies by priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-bg-primary border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value="ALL">All Priorities ({winningStrategies.length})</option>
              <option value="CRITICAL">Critical Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
            </select>

            <select
              aria-label="Filter strategies by execution status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-bg-primary border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PROPOSED">Proposed</option>
              <option value="APPROVED">Approved</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="SUPERSEDED">Superseded</option>
            </select>
          </div>
        </div>

        {/* Opportunity Strategic Context Triplet */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-text-secondary">
                Customer Objectives & Desired Outcomes
              </div>
              <p className="text-text-primary leading-relaxed">
                {summary.customer_objectives_and_outcomes}
              </p>
            </div>
            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-text-secondary">
                Opportunity-Specific Business Conditions
              </div>
              <p className="text-text-primary leading-relaxed">
                {summary.opportunity_business_conditions}
              </p>
            </div>
            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-text-secondary">
                Competitive Circumstances
              </div>
              <p className="text-text-primary leading-relaxed">
                {summary.competitive_circumstances}
              </p>
            </div>
          </div>
        )}

        {/* System Reasoning Architecture Strip */}
        <div className="pt-3 border-t border-border/60 flex flex-wrap items-center gap-2 text-[11px] text-text-secondary">
          <span className="font-semibold text-text-primary inline-flex items-center gap-1.5 mr-1">
            <Layers className="h-3.5 w-3.5 text-accent" />
            Decision Architecture:
          </span>
          <span>Evidence ({evidence.length})</span>
          <ArrowRight className="h-3 w-3 text-text-secondary/70" />
          <span>SWOT Factors ({swotResults.length})</span>
          <ArrowRight className="h-3 w-3 text-text-secondary/70" />
          <span>PADF & Risk Implications ({risks.length})</span>
          <ArrowRight className="h-3 w-3 text-text-secondary/70" />
          <span>TOWS Combinations ({towsStrategies.length})</span>
          <ArrowRight className="h-3 w-3 text-text-secondary/70" />
          <span>Strategic Objective</span>
          <ArrowRight className="h-3 w-3 text-text-secondary/70" />
          <span className="text-accent font-semibold">Winning Strategy</span>
          <ArrowRight className="h-3 w-3 text-text-secondary/70" />
          <span>Execution Actions</span>
        </div>
      </div>

      {/* Strategy Cards */}
      {filteredStrategies.length === 0 ? (
        <div className="bg-bg-surface border border-border rounded-2xl p-8 text-center text-xs text-text-secondary">
          No winning strategies match the selected priority or execution status filter.
        </div>
      ) : (
        <div className="space-y-6">
          {filteredStrategies.map((ws, idx) => {
            const isSaving = savingStrategyId === ws.strategy_id;
            const showChain = Boolean(expandedChains[ws.strategy_id]);
            const ordinal = String(idx + 1).padStart(2, '0');

            return (
              <section
                key={ws.strategy_id}
                className="bg-bg-surface border border-border rounded-2xl p-5 sm:p-6 space-y-5"
              >
                {/* Strategy Header + Execution Status Control */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-4 border-b border-border/60">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-mono tabular-nums text-text-secondary">
                      <span className="text-accent font-semibold">{ws.strategy_id}</span>
                      <span aria-hidden="true">·</span>
                      <span className={`font-semibold ${priorityColor(ws.priority)}`}>
                        Priority: {ws.priority}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className={`font-semibold ${feasibilityColor(ws.feasibility)}`}>
                        Feasibility: {ws.feasibility}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        TOWS: {ws.tows_category && ws.tows_category !== 'NONE' ? towsLabel(ws.tows_category) : 'Direct Mitigation'}
                      </span>
                      {(ws.linked_padf_dimensions || []).length > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Dimensions: {(ws.linked_padf_dimensions || []).join(', ')}</span>
                        </>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-text-primary leading-snug">
                      {ordinal}. {ws.title}
                    </h3>

                    <div className="text-xs sm:text-sm text-text-primary font-medium leading-relaxed pt-0.5">
                      <span className="text-text-secondary font-normal mr-1.5">Strategic Objective:</span>
                      {ws.strategic_objective}
                    </div>
                  </div>

                  {/* Working Execution Status Control */}
                  <div className="flex items-center gap-2 shrink-0">
                    <label
                      htmlFor={`ws-status-${ws.strategy_id}`}
                      className="text-[11px] font-mono text-text-secondary whitespace-nowrap"
                    >
                      Execution Status
                    </label>
                    <select
                      id={`ws-status-${ws.strategy_id}`}
                      value={ws.execution_status || 'PROPOSED'}
                      disabled={isSaving}
                      onChange={(e) =>
                        handleStatusChange(ws, e.target.value as WinningStrategyExecutionStatus)
                      }
                      className="px-3 py-1.5 bg-bg-primary border border-border rounded-xl text-xs font-mono font-semibold text-text-primary focus:outline-none focus:border-accent cursor-pointer"
                    >
                      <option value="PROPOSED">PROPOSED</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="SUPERSEDED">SUPERSEDED</option>
                    </select>
                    {isSaving && <RefreshCw className="h-3.5 w-3.5 text-accent animate-spin" />}
                  </div>
                </div>

                {/* Strategic Rationale & Directional Impact */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-xs">
                  <div className="lg:col-span-2 space-y-1.5">
                    <div className="text-[11px] font-semibold text-text-secondary">
                      Strategic Rationale
                    </div>
                    <p className="text-text-primary leading-relaxed">{ws.strategic_rationale}</p>
                  </div>

                  <div className="space-y-3 lg:pl-5 lg:border-l lg:border-border/60">
                    <div className="space-y-1">
                      <div className="text-[11px] font-semibold text-text-secondary">
                        Expected Impact (Directional)
                      </div>
                      <p className="text-emerald-400 font-medium leading-relaxed">
                        {ws.expected_impact}
                      </p>
                    </div>
                    {ws.feasibility_notes && (
                      <div className="space-y-1">
                        <div className="text-[11px] font-semibold text-text-secondary">
                          Feasibility Assessment ({ws.feasibility})
                        </div>
                        <p className="text-text-secondary leading-relaxed">{ws.feasibility_notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Explicit 8-Question Strategic Breakdown */}
                <div className="pt-4 border-t border-border/60 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-xs">
                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold text-text-secondary">
                      1. Condition That Must Change
                    </div>
                    <p className="text-text-primary leading-relaxed">{ws.condition_to_change}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold text-text-secondary">
                      2. Why This Condition Is Important
                    </div>
                    <p className="text-text-primary leading-relaxed">{ws.why_condition_important}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold text-text-secondary">
                      3. Influence on Probability & Quality of Winning (Directional)
                    </div>
                    <p className="text-text-primary leading-relaxed">
                      {ws.probability_and_quality_influence}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold text-text-secondary">
                      4. Resources & Dependencies Involved
                    </div>
                    {(ws.dependencies || []).length > 0 ? (
                      <ul className="space-y-1 text-text-primary list-disc list-inside leading-relaxed">
                        {ws.dependencies.map((dep, dIdx) => (
                          <li key={dIdx}>{dep}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-text-secondary">Account Executive & internal deal desk alignment.</p>
                    )}
                  </div>
                </div>

                {/* Recommended Actions & Expected Evidence of Improvement */}
                <div className="pt-4 border-t border-border/60 grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
                  <div className="lg:col-span-7 space-y-2.5">
                    <div className="text-[11px] font-semibold text-text-secondary">
                      Recommended Sales Organization Actions ({(ws.recommended_actions || []).length})
                    </div>
                    <div className="divide-y divide-border/50 border-t border-b border-border/50">
                      {(ws.recommended_actions || []).map((act, aIdx) => (
                        <div key={aIdx} className="py-2.5 space-y-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <span className="font-semibold text-text-primary">
                              {aIdx + 1}. {act.action_title}
                            </span>
                            <span className="text-[11px] font-mono tabular-nums text-text-secondary inline-flex items-center gap-2 shrink-0">
                              {act.owner_role && (
                                <span className="inline-flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {act.owner_role}
                                </span>
                              )}
                              {act.timeframe && (
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {act.timeframe}
                                </span>
                              )}
                            </span>
                          </div>
                          <p className="text-text-secondary leading-relaxed">
                            {act.action_description}
                          </p>
                          {act.expected_outcome && (
                            <p className="text-[11px] text-emerald-400">
                              Target Outcome: {act.expected_outcome}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-5 space-y-2.5">
                    <div className="text-[11px] font-semibold text-text-secondary inline-flex items-center gap-1.5">
                      <FileCheck2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Expected Evidence of Improvement</span>
                    </div>
                    {(ws.expected_evidence_of_improvement || []).length > 0 ? (
                      <ul className="space-y-2 text-text-primary leading-relaxed">
                        {ws.expected_evidence_of_improvement.map((proof, pIdx) => (
                          <li key={pIdx} className="flex items-start gap-2">
                            <span className="font-mono tabular-nums text-emerald-400 text-[11px] mt-0.5">
                              0{pIdx + 1}.
                            </span>
                            <span>{proof}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-text-secondary">
                        Customer-confirmed milestone documented in pipeline evidence.
                      </p>
                    )}
                  </div>
                </div>

                {/* Grounding Traceability: Supporting Evidence, SWOT Factors & Formal Risks */}
                <div className="pt-4 border-t border-border/60 grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-text-secondary">
                      Supporting Evidence ({(ws.supporting_evidence || []).length})
                    </div>
                    {(ws.supporting_evidence || []).length > 0 ? (
                      <ul className="space-y-1.5">
                        {ws.supporting_evidence.map((ev, eIdx) => {
                          const liveEv = evidenceLookup.get(ev.evidence_object_id);
                          const snippet = ev.evidence_snippet || liveEv?.evidence_statement;
                          return (
                            <li key={eIdx} className="text-[11px] leading-relaxed">
                              <div className="font-medium text-text-primary">
                                <span className="font-mono text-accent mr-1.5">
                                  {ev.evidence_object_id}
                                </span>
                                {ev.title}
                                {typeof ev.signal_score === 'number' && (
                                  <span className="font-mono tabular-nums text-text-secondary ml-1.5">
                                    ({ev.signal_score}/100)
                                  </span>
                                )}
                              </div>
                              {snippet && (
                                <div className="text-text-secondary line-clamp-2">{snippet}</div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="text-[11px] text-text-secondary">
                        Linked to active PADF assessment baseline.
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-text-secondary">
                      Supporting SWOT Factors ({(ws.supporting_swot_factors || []).length})
                    </div>
                    {(ws.supporting_swot_factors || []).length > 0 ? (
                      <ul className="space-y-1.5">
                        {ws.supporting_swot_factors.map((sf, sIdx) => {
                          const matchedSwot = swotLookup.get(sf.factor_id);
                          const cls = sf.classification || matchedSwot?.factor_type || '';
                          return (
                            <li key={sIdx} className="text-[11px] leading-relaxed">
                              <span className="font-mono text-accent mr-1.5">{sf.factor_id}</span>
                              <span className="text-text-primary font-medium">
                                {sf.factor_name || matchedSwot?.factor_name}
                              </span>
                              {cls && (
                                <span className="text-text-secondary ml-1.5">
                                  ({String(cls).toLowerCase()})
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="text-[11px] text-text-secondary">
                        Synthesized from active 16-factor SWOT evaluation.
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-text-secondary">
                      Related Formal Risks ({(ws.related_formal_risks || []).length})
                    </div>
                    {(ws.related_formal_risks || []).length > 0 ? (
                      <ul className="space-y-1.5">
                        {ws.related_formal_risks.map((rk, rIdx) => {
                          const liveRisk = riskLookup.get(rk.risk_id);
                          const sev = rk.severity || liveRisk?.severity || '';
                          return (
                            <li key={rIdx} className="text-[11px] leading-relaxed">
                              <span className="font-mono text-red-400 mr-1.5">{rk.risk_id}</span>
                              <span className="text-text-primary font-medium">
                                {rk.risk_title || liveRisk?.risk_description}
                              </span>
                              {sev && (
                                <span className="font-mono text-text-secondary ml-1.5">
                                  ({String(sev).toUpperCase()})
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="text-[11px] text-text-secondary">
                        Preventive win-quality and execution safeguard.
                      </div>
                    )}
                  </div>
                </div>

                {/* Connected Causal Chain Trace (7 Sequential Nodes) */}
                {ws.causal_chain && (
                  <div className="pt-4 border-t border-border/60 space-y-3">
                    <button
                      type="button"
                      onClick={() => toggleChain(ws.strategy_id)}
                      className="w-full flex items-center justify-between text-left text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                    >
                      <span>
                        Connected Strategic Causal Chain (Weakness/Threat → Evidence → Objective → TOWS → Risk Context → Action → Improvement Proof)
                      </span>
                      {showChain ? (
                        <ChevronUp className="h-4 w-4 shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0" />
                      )}
                    </button>

                    {showChain && (
                      <div className="pl-2 space-y-2 text-xs">
                        {[
                          {
                            label: 'Assessment Weakness or Threat',
                            value: ws.causal_chain.assessment_weakness_or_threat
                          },
                          {
                            label: 'Evidence and Business Implication',
                            value: ws.causal_chain.evidence_and_business_implication
                          },
                          {
                            label: 'Strategic Objective',
                            value: ws.causal_chain.strategic_objective
                          },
                          {
                            label: 'TOWS Response, Where Applicable',
                            value: ws.causal_chain.tows_response
                          },
                          {
                            label: 'Existing Risk and Winability Context',
                            value: ws.causal_chain.existing_risk_and_winability_context
                          },
                          {
                            label: 'Recommended Action',
                            value: ws.causal_chain.recommended_action
                          },
                          {
                            label: 'Expected Evidence of Improvement',
                            value: ws.causal_chain.expected_evidence_of_improvement
                          }
                        ].map((node, nIdx, arr) => (
                          <div key={nIdx} className="space-y-1.5">
                            <div className="flex items-start gap-3">
                              <span className="font-mono tabular-nums text-[11px] text-accent font-semibold w-5 shrink-0 pt-0.5">
                                0{nIdx + 1}
                              </span>
                              <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4">
                                <span className="sm:col-span-4 font-semibold text-text-secondary">
                                  {node.label}
                                </span>
                                <span className="sm:col-span-8 text-text-primary leading-relaxed">
                                  {node.value}
                                </span>
                              </div>
                            </div>
                            {nIdx < arr.length - 1 && (
                              <div className="pl-1">
                                <ArrowDown className="h-3 w-3 text-text-secondary/50" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WinningStrategyView;
