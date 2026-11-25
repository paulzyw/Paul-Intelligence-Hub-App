import { supabase } from '../../../../lib/supabase';
import { PipelineAssessmentSnapshot } from '../../types/pipeline';
import { PipelineCardItem } from '../components/PipelineCard';
import { PipelineConfigService } from './PipelineConfigService';
import { resolveAuthenticatedRevOSUserId } from '../../utils/userIsolation';

export const REVENUE_INTELLIGENCE_PROMPT_VERSION = '1.0';
export const REVENUE_INTELLIGENCE_SPEC_VERSION = '1.0';
export const REVENUE_INTELLIGENCE_RULES_VERSION = 'v1.1';
export const REVENUE_INTELLIGENCE_DATA_PREP_VERSION = '1.0';
export const REVENUE_INTELLIGENCE_MODEL_ID = 'gemini-3.1-flash-lite';

export interface RevenueIntelligenceFilterSummary {
  scopeFilter: 'ALL' | 'ACTIVE' | 'CLOSED';
  assessmentStartDate?: string;
  assessmentEndDate?: string;
  industry: string;
  revenueMotion: string;
  opportunityOwner: string;
  pipelineStage: string;
  opportunityStage: string;
  closingStartDate?: string;
  closingEndDate?: string;
}

export interface RevenueIntelligenceRiskRow {
  risk_instance_id: string;
  pipeline_id: string;
  assessment_id: string;
  risk_id?: string;
  severity: string;
  likelihood?: string;
  impact?: string;
  risk_status: string;
  risk_category?: string;
  risk_description?: string;
  mitigation_strategy?: string;
  triggering_evidence?: string[];
  owner?: string;
}

export interface RevenueIntelligenceActionRow {
  action_id: string;
  pipeline_id: string;
  action_status: string;
  action_description?: string;
  strategic_objective?: string;
  action_owner?: string;
  priority?: string;
  target_date?: string;
}

export interface RevenueIntelligenceAssessmentRecord {
  assessment_id: string;
  pipeline_id: string;
  assessment_sequence: number;
  assessment_status: string;
  trigger_type?: string;
  base_winability?: number | null;
  risk_adjusted_winability?: number | null;
  pipeline_health?: string | null;
  assessment_confidence?: number | null;
  configuration_version?: string | null;
  evidence_kb_version?: string | null;
  rules_version?: string | null;
  completed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CurrencyPortfolioSummary {
  currency: string;
  opportunity_count: number;
  total_value: number;
  active_value: number;
  risk_adjusted_forecast: number;
}

export interface PortfolioIntelligenceOpportunityItem {
  opportunity_id: string;
  dashboard_item_id: string;
  pipeline_id: string | null;
  opportunity_name: string;
  customer_name: string;
  business_segment: string | null;
  industry: string;
  revenue_motion: string;
  pipeline_stage: string;
  opportunity_stage: string;
  lifecycle_status: string;
  deal_value: number;
  currency: string;
  expected_close_date: string | null;
  opportunity_owner: string | null;
  assessment_status: string;
  assessment_id: string | null;
  assessment_timestamp: string | null;
  configuration_version: string | null;
  rules_version: string | null;
  pipeline_health: string | null;
  base_winability: number | null;
  confidence_adjusted_winability: number | null;
  risk_adjusted_winability: number | null;
  assessment_confidence: number | null;
  padf_dimensions: Array<{
    dimension_code: string;
    dimension_name: string;
    score: number | null;
    assessment_state: string | null;
    short_interpretation: string | null;
    strengths: string[];
    weaknesses: string[];
    evidence_gaps: string[];
  }>;
  risk_count_active: number;
  critical_or_high_risk_count: number;
}

export interface PortfolioIntelligenceContext {
  schema_version: string;
  data_prep_version: string;
  portfolio_context: {
    analysis_timestamp: string;
    portfolio_scope: string;
    selected_filters: RevenueIntelligenceFilterSummary;
    included_opportunity_count: number;
    assessed_opportunity_count: number;
    unassessed_opportunity_count: number;
    incomplete_assessment_count: number;
    industry_distribution: Array<{ industry: string; count: number }>;
    revenue_motion_distribution: Array<{ revenue_motion: string; count: number }>;
    sales_stage_distribution: Array<{ pipeline_stage: string; count: number }>;
    currency_context: {
      has_mixed_currencies: boolean;
      currencies: string[];
      currency_note: string;
    };
    data_completeness: {
      has_confidence_adjusted_winability: boolean;
      confidence_adjusted_winability_note: string;
      opportunities_with_padf_count: number;
      opportunities_with_risks_count: number;
      opportunities_with_actions_count: number;
      compatible_historical_snapshot_pairs: number;
    };
  };
  portfolio_performance: {
    totals_by_currency: CurrencyPortfolioSummary[];
    pipeline_health_distribution: Record<string, number>;
    winability_distribution: {
      high_ge_75: number;
      moderate_55_to_74: number;
      low_lt_55: number;
      unassessed: number;
      avg_base_winability: number | null;
      avg_risk_adjusted_winability: number | null;
    };
    high_value_low_winability_opportunity_ids: string[];
  };
  padf_dimension_summary: Array<{
    dimension_code: string;
    dimension_name: string;
    assessed_count: number;
    average_score: number | null;
    strong_count: number;
    moderate_count: number;
    weak_count: number;
    critical_count: number;
    affected_weak_or_critical_opportunity_ids: string[];
  }>;
  opportunities: PortfolioIntelligenceOpportunityItem[];
  risk_intelligence: {
    total_active_or_mitigating_risks: number;
    severity_distribution: Record<string, number>;
    category_distribution: Array<{ category: string; count: number; critical_or_high: number }>;
    risks: Array<{
      risk_id: string;
      risk_instance_id: string;
      opportunity_id: string;
      pipeline_id: string;
      risk_category: string;
      severity: string;
      likelihood: string | null;
      impact: string | null;
      risk_status: string;
      risk_description: string;
      mitigation_strategy: string | null;
      triggering_evidence_ids: string[];
    }>;
  };
  actions_summary: Array<{
    action_id: string;
    opportunity_id: string;
    pipeline_id: string;
    priority: string;
    action_status: string;
    action_description: string;
    action_owner: string | null;
  }>;
  historical_intelligence: {
    has_compatible_history: boolean;
    compatibility_note: string;
    snapshot_transitions: Array<{
      snapshot_id: string;
      previous_snapshot_id: string | null;
      opportunity_id: string;
      pipeline_id: string;
      snapshot_timestamp: string;
      risk_adjusted_winability: number | null;
      winability_delta: number | null;
      previous_health: string | null;
      current_health: string | null;
      rules_version: string | null;
      configuration_version: string | null;
    }>;
  };
  reference_index: {
    opportunity_id_to_item_id: Record<string, string>;
    opportunity_id_to_label: Record<string, string>;
    valid_opportunity_ids: string[];
    valid_padf_dimensions: string[];
    valid_risk_ids: string[];
    valid_action_ids: string[];
    valid_snapshot_ids: string[];
  };
}

export interface RevenueIntelligenceKeyFinding {
  insight_id: string;
  title: string;
  finding: string;
  business_implication: string;
  affected_opportunity_ids: string[];
  padf_dimensions: string[];
  evidence_ids: string[];
  risk_ids: string[];
  support_level: 'strong' | 'mixed' | 'limited';
  limitations: string;
}

export interface RevenueIntelligenceRecurringWeakness {
  insight_id: string;
  title: string;
  weakness_description: string;
  affected_opportunity_count: number | null;
  affected_opportunity_ids: string[];
  padf_dimensions: string[];
  evidence_ids: string[];
  business_implication: string;
  management_attention: string;
}

export interface RevenueIntelligenceEmergingRisk {
  insight_id: string;
  title: string;
  risk_pattern: string;
  existing_risk_ids: string[];
  affected_opportunity_ids: string[];
  padf_dimensions: string[];
  revenue_exposure: number | null;
  business_implication: string;
  existing_mitigation_references: string[];
}

export interface RevenueIntelligenceImprovementOpportunity {
  insight_id: string;
  title: string;
  improvement_description: string;
  affected_opportunity_ids: string[];
  underlying_weaknesses: string[];
  existing_strategy_ids: string[];
  existing_action_ids: string[];
  expected_business_benefit: string;
}

export interface RevenueIntelligenceManagementRecommendation {
  insight_id: string;
  recommendation: string;
  strategic_rationale: string;
  affected_opportunity_ids: string[];
  existing_strategy_ids: string[];
  existing_action_ids: string[];
  suggested_management_focus: string;
  expected_business_implication: string;
}

export interface RevenueIntelligenceDataLimitation {
  issue: string;
  affected_analysis_area: string;
  implication: string;
}

export interface RevenueIntelligenceReportPayload {
  schema_version: string;
  analysis_status: 'ready' | 'partial' | 'insufficient_data';
  analysis_context: {
    analysis_timestamp: string;
    portfolio_scope: string;
    applied_filters: Record<string, unknown>;
    included_opportunity_count: number | null;
    assessed_opportunity_count: number | null;
    assessment_coverage_note: string;
    source_versions: Record<string, unknown>;
  };
  executive_summary: {
    headline: string;
    summary: string;
    most_important_finding: string;
    main_vulnerability: string;
    improvement_opportunity: string;
    management_focus: string;
  };
  key_pipeline_findings: RevenueIntelligenceKeyFinding[];
  recurring_pipeline_weaknesses: RevenueIntelligenceRecurringWeakness[];
  emerging_pipeline_risks: RevenueIntelligenceEmergingRisk[];
  pipeline_improvement_opportunities: RevenueIntelligenceImprovementOpportunity[];
  strategic_management_recommendations: RevenueIntelligenceManagementRecommendation[];
  data_quality_and_limitations: RevenueIntelligenceDataLimitation[];
  overall_analysis_limitations: string[];
  validated_reference_ids?: {
    evidence_ids?: string[];
    strategy_ids?: string[];
    swot_factor_ids?: string[];
    snapshot_ids?: string[];
    risk_ids?: string[];
    action_ids?: string[];
    opportunity_ids?: string[];
    opportunity_id_to_item_id?: Record<string, string>;
    opportunity_id_to_label?: Record<string, string>;
  };
}

export interface SavedRevenueIntelligenceRecord {
  report_id: string;
  scope_hash: string;
  user_id: string;
  scope_label: string;
  applied_filters: RevenueIntelligenceFilterSummary;
  portfolio_metrics: Record<string, unknown>;
  report_payload: RevenueIntelligenceReportPayload;
  analysis_status: 'ready' | 'partial' | 'insufficient_data';
  prompt_version: string;
  reasoning_spec_version: string;
  rules_version: string;
  model_identifier: string;
  is_saved: boolean;
  generated_at: string;
  saved_at: string | null;
}

const CANONICAL_PADF_DIMS = PipelineConfigService.getCanonicalPADFDimensions();

const CLOSED_STATUSES = new Set(['CLOSED_WON', 'CLOSED_LOST']);

function isItemClosed(item: PipelineCardItem): boolean {
  const lc = item.pipeline_opp?.lifecycle_status;
  const st = item.pipeline_stage;
  return Boolean(
    (lc && CLOSED_STATUSES.has(lc)) || st === 'Closed Won' || st === 'Closed Lost'
  );
}

function getOpportunityIdentifier(item: PipelineCardItem): string {
  return (
    item.pipeline_opp?.pipeline_id ||
    item.pipeline_opp?.opportunity_id ||
    item.id
  );
}

/**
 * Computes a deterministic hash for cache & staleness detection across the authorized user scope,
 * filters, included opportunity/assessment versions, snapshots, prompt version, rules version,
 * and data-prep version.
 */
export function computePortfolioScopeHash(params: {
  userId: string;
  filters: RevenueIntelligenceFilterSummary;
  scopedItems: PipelineCardItem[];
  riskRows: RevenueIntelligenceRiskRow[];
  actionRows: RevenueIntelligenceActionRow[];
  snapshots: PipelineAssessmentSnapshot[];
}): string {
  const scopedPipeIds = new Set(
    params.scopedItems.map((i) => i.pipeline_opp?.pipeline_id).filter(Boolean) as string[]
  );

  const oppFingerprint = params.scopedItems
    .map((item) => {
      const opp = item.pipeline_opp;
      const assess = opp?.latest_assessment;
      return [
        item.id,
        opp?.pipeline_id || '',
        item.estimated_value || 0,
        item.pipeline_stage || '',
        opp?.lifecycle_status || '',
        assess?.assessment_id || '',
        assess?.assessment_sequence || 0,
        assess?.updated_at || assess?.completed_at || ''
      ].join(':');
    })
    .sort()
    .join('|');

  const riskFingerprint = params.riskRows
    .filter((r) => scopedPipeIds.has(r.pipeline_id))
    .map((r) => `${r.risk_instance_id}:${r.severity}:${r.risk_status}`)
    .sort()
    .join('|');

  const actionFingerprint = params.actionRows
    .filter((a) => scopedPipeIds.has(a.pipeline_id))
    .map((a) => `${a.action_id}:${a.action_status}:${a.priority || ''}`)
    .sort()
    .join('|');

  const snapFingerprint = params.snapshots
    .filter((s) => scopedPipeIds.has(s.pipeline_id))
    .map((s) => `${s.snapshot_id}:${s.snapshot_timestamp}`)
    .sort()
    .join('|');

  const rawSignature = JSON.stringify({
    v: {
      prompt: REVENUE_INTELLIGENCE_PROMPT_VERSION,
      spec: REVENUE_INTELLIGENCE_SPEC_VERSION,
      rules: REVENUE_INTELLIGENCE_RULES_VERSION,
      prep: REVENUE_INTELLIGENCE_DATA_PREP_VERSION,
      model: REVENUE_INTELLIGENCE_MODEL_ID
    },
    userId: params.userId || 'workspace_default',
    filters: params.filters,
    oppFingerprint,
    riskFingerprint,
    actionFingerprint,
    snapFingerprint
  });

  // Deterministic 64-bit FNV-1a twin hash (hex) suitable for synchronous browser & edge comparison
  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5;
  for (let i = 0; i < rawSignature.length; i++) {
    const c = rawSignature.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= (c + i) & 0xff;
    h2 = Math.imul(h2, 0x01000193);
  }
  return `ri_${(h1 >>> 0).toString(16).padStart(8, '0')}${(h2 >>> 0).toString(16).padStart(8, '0')}`;
}

export function buildScopeDescription(filters: RevenueIntelligenceFilterSummary): string {
  const parts: string[] = [];
  if (filters.scopeFilter === 'ACTIVE') parts.push('Active Pipeline Only');
  else if (filters.scopeFilter === 'CLOSED') parts.push('Closed Outcomes Only');
  else parts.push('Full Portfolio (Active & Closed)');

  if (filters.industry !== 'ALL') parts.push(`Industry: ${filters.industry}`);
  if (filters.revenueMotion !== 'ALL') parts.push(`Motion: ${filters.revenueMotion}`);
  if (filters.opportunityOwner !== 'ALL') parts.push(`Owner: ${filters.opportunityOwner}`);
  if (filters.pipelineStage !== 'ALL') parts.push(`Pipeline Stage: ${filters.pipelineStage}`);
  if (filters.opportunityStage !== 'ALL') parts.push(`Opp Stage: ${filters.opportunityStage}`);
  if (filters.assessmentStartDate || filters.assessmentEndDate) {
    parts.push(`Assessed: ${filters.assessmentStartDate || '...'} to ${filters.assessmentEndDate || '...'}`);
  }
  if (filters.closingStartDate || filters.closingEndDate) {
    parts.push(`Closing: ${filters.closingStartDate || '...'} to ${filters.closingEndDate || '...'}`);
  }
  return parts.join(' · ');
}

/**
 * Builds the authoritative, normalized, currency-safe PORTFOLIO_INTELLIGENCE_CONTEXT object.
 * Never alters authoritative assessment scores, classifications, or missing values.
 */
export function buildPortfolioIntelligenceContext(params: {
  scopedItems: PipelineCardItem[];
  riskRows: RevenueIntelligenceRiskRow[];
  actionRows: RevenueIntelligenceActionRow[];
  assessments: RevenueIntelligenceAssessmentRecord[];
  snapshots: PipelineAssessmentSnapshot[];
  filters: RevenueIntelligenceFilterSummary;
}): PortfolioIntelligenceContext {
  const nowIso = new Date().toISOString();
  const { scopedItems, riskRows, actionRows, snapshots, filters } = params;

  const pipeIdToOppId = new Map<string, string>();
  const opportunityIdToItemId: Record<string, string> = {};
  const opportunityIdToLabel: Record<string, string> = {};

  scopedItems.forEach((item) => {
    const oppIdentifier = getOpportunityIdentifier(item);
    opportunityIdToItemId[oppIdentifier] = item.id;
    opportunityIdToLabel[oppIdentifier] = `${item.opportunity_name || 'Untitled'} (${item.company_name || '—'})`;
    if (item.pipeline_opp?.pipeline_id) {
      pipeIdToOppId.set(item.pipeline_opp.pipeline_id, oppIdentifier);
    }
  });

  const scopedPipeIds = new Set(
    scopedItems.map((i) => i.pipeline_opp?.pipeline_id).filter(Boolean) as string[]
  );

  const scopedRisks = riskRows.filter(
    (r) =>
      scopedPipeIds.has(r.pipeline_id) &&
      (r.risk_status === 'ACTIVE' || r.risk_status === 'MITIGATING')
  );
  const scopedActions = actionRows.filter((a) => scopedPipeIds.has(a.pipeline_id));

  // Currency-safe monetary rollups
  const currencyMap = new Map<string, CurrencyPortfolioSummary>();
  const industryCounts = new Map<string, number>();
  const motionCounts = new Map<string, number>();
  const stageCounts = new Map<string, number>();
  const healthCounts: Record<string, number> = {};

  let assessedCount = 0;
  let incompleteCount = 0;
  let highWinCount = 0;
  let modWinCount = 0;
  let lowWinCount = 0;
  let unassessedWinCount = 0;
  const baseWinValues: number[] = [];
  const riskAdjWinValues: number[] = [];
  const highValueLowWinIds: string[] = [];

  const padfStats = CANONICAL_PADF_DIMS.map((d) => ({
    dimension_code: d.shortCode,
    dimension_name: d.name,
    scores: [] as number[],
    strong_count: 0,
    moderate_count: 0,
    weak_count: 0,
    critical_count: 0,
    weakOrCriticalIds: [] as string[]
  }));
  const padfStatByShort = new Map(padfStats.map((s) => [s.dimension_code, s]));

  // Compute median deal value per currency to flag high-value / low-winability reliably without cross-currency distortion
  const valuesByCurrency = new Map<string, number[]>();
  scopedItems.forEach((item) => {
    const cur = item.pipeline_opp?.currency || 'USD';
    const arr = valuesByCurrency.get(cur) || [];
    arr.push(Number(item.estimated_value || 0));
    valuesByCurrency.set(cur, arr);
  });
  const medianByCurrency = new Map<string, number>();
  valuesByCurrency.forEach((arr, cur) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    medianByCurrency.set(cur, sorted.length > 0 ? sorted[mid] : 0);
  });

  let oppWithPadfCount = 0;
  const oppsWithRisks = new Set<string>();
  const oppsWithActions = new Set<string>();

  const opportunityEntries: PortfolioIntelligenceOpportunityItem[] = scopedItems.map((item) => {
    const oppId = getOpportunityIdentifier(item);
    const pipeOpp = item.pipeline_opp;
    const assess: any = pipeOpp?.latest_assessment;
    const currency = pipeOpp?.currency || 'USD';
    const dealValue = Number(item.estimated_value || 0);
    const closed = isItemClosed(item);

    // Currency summary
    const curAgg = currencyMap.get(currency) || {
      currency,
      opportunity_count: 0,
      total_value: 0,
      active_value: 0,
      risk_adjusted_forecast: 0
    };
    curAgg.opportunity_count += 1;
    curAgg.total_value += dealValue;
    if (!closed) {
      curAgg.active_value += dealValue;
      const weight =
        typeof assess?.risk_adjusted_winability === 'number'
          ? Math.max(0, Math.min(100, assess.risk_adjusted_winability)) / 100
          : 0.5;
      curAgg.risk_adjusted_forecast += Math.round(dealValue * weight);
    }
    currencyMap.set(currency, curAgg);

    const ind = (item.industry || 'Unspecified').trim();
    industryCounts.set(ind, (industryCounts.get(ind) || 0) + 1);
    const mot = (item.revenue_motion || 'Unspecified').trim();
    motionCounts.set(mot, (motionCounts.get(mot) || 0) + 1);
    const stg = (item.pipeline_stage || 'Unspecified').trim();
    stageCounts.set(stg, (stageCounts.get(stg) || 0) + 1);

    const hasAssessment = Boolean(assess && assess.assessment_id);
    const isCompleted = hasAssessment && (assess.assessment_status === 'COMPLETED' || typeof assess.risk_adjusted_winability === 'number');
    if (isCompleted) assessedCount += 1;
    else if (hasAssessment) incompleteCount += 1;

    const health = assess?.pipeline_health ? String(assess.pipeline_health) : null;
    if (health) {
      healthCounts[health] = (healthCounts[health] || 0) + 1;
    } else {
      healthCounts['UNASSESSED'] = (healthCounts['UNASSESSED'] || 0) + 1;
    }

    const baseWin = typeof assess?.base_winability === 'number' ? assess.base_winability : null;
    const riskAdjWin =
      typeof assess?.risk_adjusted_winability === 'number' ? assess.risk_adjusted_winability : null;

    if (baseWin !== null) baseWinValues.push(baseWin);
    if (riskAdjWin !== null) {
      riskAdjWinValues.push(riskAdjWin);
      if (riskAdjWin >= 75) highWinCount += 1;
      else if (riskAdjWin >= 55) modWinCount += 1;
      else lowWinCount += 1;

      const curMedian = medianByCurrency.get(currency) || 0;
      if (!closed && dealValue >= curMedian && dealValue > 0 && riskAdjWin < 55) {
        highValueLowWinIds.push(oppId);
      }
    } else {
      unassessedWinCount += 1;
    }

    // Build PADF per-opportunity records from authoritative db results + raw narratives
    const padfRows: any[] = Array.isArray(assess?.padf_results) ? assess.padf_results : [];
    const aiNarratives: any[] = Array.isArray(assess?.raw_reasoning_output?.padf_dimension_narratives)
      ? assess.raw_reasoning_output.padf_dimension_narratives
      : [];

    const padfByDimId = new Map<string, any>();
    padfRows.forEach((pr: any) => {
      padfByDimId.set(PipelineConfigService.normalizePADFDimensionId(pr.dimension_id), pr);
    });

    let hasAnyPadf = false;
    const oppPadfDims = CANONICAL_PADF_DIMS.map((dim) => {
      const dbRow = padfByDimId.get(dim.id);
      const aiNarr = aiNarratives.find(
        (n: any) =>
          n.dimension_code === dim.id ||
          n.dimension_code === dim.shortCode ||
          String(n.dimension_code || '').startsWith(dim.shortCode)
      );
      const rawScore = dbRow?.dimension_score ?? aiNarr?.score;
      const score = typeof rawScore === 'number' ? rawScore : null;
      const state = dbRow?.assessment_state
        ? String(dbRow.assessment_state)
        : score !== null
          ? score >= 75
            ? 'STRONG'
            : score >= 55
              ? 'MODERATE'
              : score >= 35
                ? 'WEAK'
                : 'CRITICAL'
          : null;

      if (score !== null) {
        hasAnyPadf = true;
        const aggStat = padfStatByShort.get(dim.shortCode);
        if (aggStat) {
          aggStat.scores.push(score);
          if (score >= 75) aggStat.strong_count += 1;
          else if (score >= 55) aggStat.moderate_count += 1;
          else if (score >= 35) {
            aggStat.weak_count += 1;
            aggStat.weakOrCriticalIds.push(oppId);
          } else {
            aggStat.critical_count += 1;
            aggStat.weakOrCriticalIds.push(oppId);
          }
        }
      }

      return {
        dimension_code: dim.shortCode,
        dimension_name: dim.name,
        score,
        assessment_state: state,
        short_interpretation:
          aiNarr?.short_interpretation || aiNarr?.summary || dbRow?.assessment_summary || null,
        strengths: Array.isArray(aiNarr?.strengths)
          ? aiNarr.strengths.slice(0, 3)
          : Array.isArray(dbRow?.key_strengths)
            ? dbRow.key_strengths.slice(0, 3)
            : [],
        weaknesses: Array.isArray(aiNarr?.weaknesses)
          ? aiNarr.weaknesses.slice(0, 3)
          : Array.isArray(dbRow?.key_weaknesses)
            ? dbRow.key_weaknesses.slice(0, 3)
            : [],
        evidence_gaps: Array.isArray(aiNarr?.evidence_gaps) ? aiNarr.evidence_gaps.slice(0, 2) : []
      };
    });

    if (hasAnyPadf) oppWithPadfCount += 1;

    const dealRisks = pipeOpp?.pipeline_id
      ? scopedRisks.filter((r) => r.pipeline_id === pipeOpp.pipeline_id)
      : [];
    if (dealRisks.length > 0) oppsWithRisks.add(oppId);

    const dealActions = pipeOpp?.pipeline_id
      ? scopedActions.filter((a) => a.pipeline_id === pipeOpp.pipeline_id)
      : [];
    if (dealActions.length > 0) oppsWithActions.add(oppId);

    return {
      opportunity_id: oppId,
      dashboard_item_id: item.id,
      pipeline_id: pipeOpp?.pipeline_id || null,
      opportunity_name: item.opportunity_name || 'Untitled Opportunity',
      customer_name: item.company_name || '—',
      business_segment: item.business_segment || null,
      industry: ind,
      revenue_motion: mot,
      pipeline_stage: stg,
      opportunity_stage: (item.opportunity_stage || 'Unspecified').trim(),
      lifecycle_status: pipeOpp?.lifecycle_status || (closed ? 'CLOSED' : 'ACTIVE'),
      deal_value: dealValue,
      currency,
      expected_close_date: item.expected_close_date || pipeOpp?.expected_close_date || null,
      opportunity_owner: item.opportunity_owner || pipeOpp?.opportunity_owner || null,
      assessment_status: assess?.assessment_status || 'UNASSESSED',
      assessment_id: assess?.assessment_id || null,
      assessment_timestamp: assess?.completed_at || assess?.updated_at || assess?.created_at || null,
      configuration_version: assess?.configuration_version || null,
      rules_version: assess?.rules_version || null,
      pipeline_health: health,
      base_winability: baseWin,
      confidence_adjusted_winability: null,
      risk_adjusted_winability: riskAdjWin,
      assessment_confidence:
        typeof assess?.assessment_confidence === 'number' ? assess.assessment_confidence : null,
      padf_dimensions: oppPadfDims,
      risk_count_active: dealRisks.length,
      critical_or_high_risk_count: dealRisks.filter(
        (r) => r.severity === 'CRITICAL' || r.severity === 'HIGH'
      ).length
    };
  });

  // Sort opportunities in bounded context: highest value & risk-exposed deals first so large portfolios stay focused
  const sortedOpps = [...opportunityEntries].sort((a, b) => {
    const aPriority = a.deal_value * (a.risk_adjusted_winability !== null && a.risk_adjusted_winability < 55 ? 2 : 1);
    const bPriority = b.deal_value * (b.risk_adjusted_winability !== null && b.risk_adjusted_winability < 55 ? 2 : 1);
    return bPriority - aPriority;
  });

  // Risk Intelligence rollups
  const riskSeverityCounts: Record<string, number> = {};
  const riskCatMap = new Map<string, { category: string; count: number; critical_or_high: number }>();
  scopedRisks.forEach((r) => {
    const sev = (r.severity || 'MEDIUM').toUpperCase();
    riskSeverityCounts[sev] = (riskSeverityCounts[sev] || 0) + 1;
    const cat = (r.risk_category || 'General').trim();
    const existing = riskCatMap.get(cat) || { category: cat, count: 0, critical_or_high: 0 };
    existing.count += 1;
    if (sev === 'CRITICAL' || sev === 'HIGH') existing.critical_or_high += 1;
    riskCatMap.set(cat, existing);
  });

  const formattedRisks = scopedRisks.slice(0, 60).map((r) => ({
    risk_id: r.risk_id || r.risk_instance_id,
    risk_instance_id: r.risk_instance_id,
    opportunity_id: pipeIdToOppId.get(r.pipeline_id) || r.pipeline_id,
    pipeline_id: r.pipeline_id,
    risk_category: (r.risk_category || 'General').trim(),
    severity: (r.severity || 'MEDIUM').toUpperCase(),
    likelihood: r.likelihood || null,
    impact: r.impact || null,
    risk_status: r.risk_status,
    risk_description: String(r.risk_description || '').slice(0, 260),
    mitigation_strategy: r.mitigation_strategy ? String(r.mitigation_strategy).slice(0, 220) : null,
    triggering_evidence_ids: Array.isArray(r.triggering_evidence) ? r.triggering_evidence : []
  }));

  const formattedActions = scopedActions.slice(0, 60).map((a) => ({
    action_id: a.action_id,
    opportunity_id: pipeIdToOppId.get(a.pipeline_id) || a.pipeline_id,
    pipeline_id: a.pipeline_id,
    priority: a.priority || 'MEDIUM',
    action_status: a.action_status,
    action_description: String(a.action_description || '').slice(0, 240),
    action_owner: a.action_owner || null
  }));

  // Historical Snapshot Transitions (version-compatible consecutive comparisons per pipeline_id)
  const snapsByPipe = new Map<string, PipelineAssessmentSnapshot[]>();
  snapshots
    .filter((s) => scopedPipeIds.has(s.pipeline_id))
    .forEach((s) => {
      const list = snapsByPipe.get(s.pipeline_id) || [];
      list.push(s);
      snapsByPipe.set(s.pipeline_id, list);
    });

  const transitions: PortfolioIntelligenceContext['historical_intelligence']['snapshot_transitions'] = [];
  snapsByPipe.forEach((list, pid) => {
    const ordered = [...list].sort(
      (a, b) =>
        new Date(a.snapshot_timestamp).getTime() - new Date(b.snapshot_timestamp).getTime()
    );
    for (let i = 1; i < ordered.length; i++) {
      const prev = ordered[i - 1];
      const curr = ordered[i];
      const prevAssess: any = (prev.full_snapshot_payload as any)?.assessment || {};
      const currAssess: any = (curr.full_snapshot_payload as any)?.assessment || {};
      const prevRules = prevAssess.rules_version || null;
      const currRules = currAssess.rules_version || null;
      const prevCfg = prevAssess.configuration_version || null;
      const currCfg = currAssess.configuration_version || null;
      if (prevRules === currRules && prevCfg === currCfg) {
        const prevWin =
          typeof prevAssess.risk_adjusted_winability === 'number'
            ? prevAssess.risk_adjusted_winability
            : null;
        const currWin =
          typeof currAssess.risk_adjusted_winability === 'number'
            ? currAssess.risk_adjusted_winability
            : null;
        transitions.push({
          snapshot_id: curr.snapshot_id,
          previous_snapshot_id: prev.snapshot_id,
          opportunity_id: pipeIdToOppId.get(pid) || pid,
          pipeline_id: pid,
          snapshot_timestamp: curr.snapshot_timestamp,
          risk_adjusted_winability: currWin,
          winability_delta:
            prevWin !== null && currWin !== null ? Math.round(currWin - prevWin) : null,
          previous_health: prevAssess.pipeline_health || null,
          current_health: currAssess.pipeline_health || null,
          rules_version: currRules,
          configuration_version: currCfg
        });
      }
    }
  });

  const currencies = Array.from(currencyMap.keys());
  const avg = (arr: number[]) =>
    arr.length > 0 ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : null;

  return {
    schema_version: '1.0',
    data_prep_version: REVENUE_INTELLIGENCE_DATA_PREP_VERSION,
    portfolio_context: {
      analysis_timestamp: nowIso,
      portfolio_scope: buildScopeDescription(filters),
      selected_filters: filters,
      included_opportunity_count: scopedItems.length,
      assessed_opportunity_count: assessedCount,
      unassessed_opportunity_count: scopedItems.length - assessedCount - incompleteCount,
      incomplete_assessment_count: incompleteCount,
      industry_distribution: Array.from(industryCounts.entries()).map(([industry, count]) => ({
        industry,
        count
      })),
      revenue_motion_distribution: Array.from(motionCounts.entries()).map(
        ([revenue_motion, count]) => ({ revenue_motion, count })
      ),
      sales_stage_distribution: Array.from(stageCounts.entries()).map(
        ([pipeline_stage, count]) => ({ pipeline_stage, count })
      ),
      currency_context: {
        has_mixed_currencies: currencies.length > 1,
        currencies,
        currency_note:
          currencies.length > 1
            ? `Portfolio includes multiple currencies (${currencies.join(', ')}). Totals are separated by currency without FX conversion.`
            : `All portfolio values are denominated in ${currencies[0] || 'USD'}.`
      },
      data_completeness: {
        has_confidence_adjusted_winability: false,
        confidence_adjusted_winability_note:
          'Confidence-Adjusted Winability is not separately persisted in pipeline_assessments; Risk-Adjusted Winability and Base Winability are authoritative.',
        opportunities_with_padf_count: oppWithPadfCount,
        opportunities_with_risks_count: oppsWithRisks.size,
        opportunities_with_actions_count: oppsWithActions.size,
        compatible_historical_snapshot_pairs: transitions.length
      }
    },
    portfolio_performance: {
      totals_by_currency: Array.from(currencyMap.values()),
      pipeline_health_distribution: healthCounts,
      winability_distribution: {
        high_ge_75: highWinCount,
        moderate_55_to_74: modWinCount,
        low_lt_55: lowWinCount,
        unassessed: unassessedWinCount,
        avg_base_winability: avg(baseWinValues),
        avg_risk_adjusted_winability: avg(riskAdjWinValues)
      },
      high_value_low_winability_opportunity_ids: highValueLowWinIds
    },
    padf_dimension_summary: padfStats.map((s) => ({
      dimension_code: s.dimension_code,
      dimension_name: s.dimension_name,
      assessed_count: s.scores.length,
      average_score: avg(s.scores),
      strong_count: s.strong_count,
      moderate_count: s.moderate_count,
      weak_count: s.weak_count,
      critical_count: s.critical_count,
      affected_weak_or_critical_opportunity_ids: Array.from(new Set(s.weakOrCriticalIds))
    })),
    // Bound detailed per-opportunity records cleanly to top 35 priority opportunities for predictable token budget
    opportunities: sortedOpps.slice(0, 35),
    risk_intelligence: {
      total_active_or_mitigating_risks: scopedRisks.length,
      severity_distribution: riskSeverityCounts,
      category_distribution: Array.from(riskCatMap.values()).sort((a, b) => b.count - a.count),
      risks: formattedRisks
    },
    actions_summary: formattedActions,
    historical_intelligence: {
      has_compatible_history: transitions.length > 0,
      compatibility_note:
        transitions.length > 0
          ? `${transitions.length} version-compatible historical snapshot transition(s) available.`
          : 'No version-compatible multi-snapshot transitions are available in the selected scope; do not fabricate historical trends.',
      snapshot_transitions: transitions.slice(0, 40)
    },
    reference_index: {
      opportunity_id_to_item_id: opportunityIdToItemId,
      opportunity_id_to_label: opportunityIdToLabel,
      valid_opportunity_ids: opportunityEntries.map((o) => o.opportunity_id),
      valid_padf_dimensions: CANONICAL_PADF_DIMS.map((d) => d.shortCode),
      valid_risk_ids: formattedRisks.flatMap((r) => [r.risk_id, r.risk_instance_id]),
      valid_action_ids: formattedActions.map((a) => a.action_id),
      valid_snapshot_ids: transitions.flatMap((t) =>
        t.previous_snapshot_id ? [t.snapshot_id, t.previous_snapshot_id] : [t.snapshot_id]
      )
    }
  };
}

/**
 * Frontend guardrail validation ensuring rendered Revenue Intelligence strictly conforms to schema
 * and never renders fabricated references or invalid enums.
 */
export function validateRevenueIntelligencePayload(
  raw: any,
  fallbackValidOppIds?: Set<string>
): RevenueIntelligenceReportPayload {
  const safeStatus =
    raw?.analysis_status === 'ready' ||
    raw?.analysis_status === 'partial' ||
    raw?.analysis_status === 'insufficient_data'
      ? raw.analysis_status
      : 'partial';

  const validatedRefs = raw?.validated_reference_ids || {};
  const validOppSet = new Set<string>(
    Array.isArray(validatedRefs.opportunity_ids) && validatedRefs.opportunity_ids.length > 0
      ? validatedRefs.opportunity_ids
      : fallbackValidOppIds
        ? Array.from(fallbackValidOppIds)
        : []
  );

  const filterOppIds = (arr: any): string[] => {
    if (!Array.isArray(arr)) return [];
    const cleaned = arr.map((v) => String(v || '').trim()).filter(Boolean);
    return validOppSet.size > 0 ? cleaned.filter((id) => validOppSet.has(id)) : cleaned;
  };

  const strArr = (arr: any): string[] =>
    Array.isArray(arr) ? arr.map((v) => String(v || '').trim()).filter(Boolean) : [];

  return {
    schema_version: String(raw?.schema_version || '1.0'),
    analysis_status: safeStatus,
    analysis_context: {
      analysis_timestamp: String(raw?.analysis_context?.analysis_timestamp || new Date().toISOString()),
      portfolio_scope: String(raw?.analysis_context?.portfolio_scope || 'Selected Pipeline Portfolio'),
      applied_filters:
        raw?.analysis_context?.applied_filters && typeof raw.analysis_context.applied_filters === 'object'
          ? raw.analysis_context.applied_filters
          : {},
      included_opportunity_count:
        typeof raw?.analysis_context?.included_opportunity_count === 'number'
          ? raw.analysis_context.included_opportunity_count
          : null,
      assessed_opportunity_count:
        typeof raw?.analysis_context?.assessed_opportunity_count === 'number'
          ? raw.analysis_context.assessed_opportunity_count
          : null,
      assessment_coverage_note: String(raw?.analysis_context?.assessment_coverage_note || ''),
      source_versions:
        raw?.analysis_context?.source_versions && typeof raw.analysis_context.source_versions === 'object'
          ? raw.analysis_context.source_versions
          : {}
    },
    executive_summary: {
      headline: String(raw?.executive_summary?.headline || 'Portfolio Revenue Intelligence Summary'),
      summary: String(raw?.executive_summary?.summary || ''),
      most_important_finding: String(raw?.executive_summary?.most_important_finding || ''),
      main_vulnerability: String(raw?.executive_summary?.main_vulnerability || ''),
      improvement_opportunity: String(raw?.executive_summary?.improvement_opportunity || ''),
      management_focus: String(raw?.executive_summary?.management_focus || '')
    },
    key_pipeline_findings: Array.isArray(raw?.key_pipeline_findings)
      ? raw.key_pipeline_findings.map((f: any, idx: number) => ({
          insight_id: String(f?.insight_id || `KPF-${idx + 1}`),
          title: String(f?.title || ''),
          finding: String(f?.finding || ''),
          business_implication: String(f?.business_implication || ''),
          affected_opportunity_ids: filterOppIds(f?.affected_opportunity_ids),
          padf_dimensions: strArr(f?.padf_dimensions),
          evidence_ids: strArr(f?.evidence_ids),
          risk_ids: strArr(f?.risk_ids),
          support_level:
            f?.support_level === 'strong' || f?.support_level === 'mixed' || f?.support_level === 'limited'
              ? f.support_level
              : 'mixed',
          limitations: String(f?.limitations || '')
        }))
      : [],
    recurring_pipeline_weaknesses: Array.isArray(raw?.recurring_pipeline_weaknesses)
      ? raw.recurring_pipeline_weaknesses.map((w: any, idx: number) => ({
          insight_id: String(w?.insight_id || `RPW-${idx + 1}`),
          title: String(w?.title || ''),
          weakness_description: String(w?.weakness_description || ''),
          affected_opportunity_count:
            typeof w?.affected_opportunity_count === 'number' ? w.affected_opportunity_count : null,
          affected_opportunity_ids: filterOppIds(w?.affected_opportunity_ids),
          padf_dimensions: strArr(w?.padf_dimensions),
          evidence_ids: strArr(w?.evidence_ids),
          business_implication: String(w?.business_implication || ''),
          management_attention: String(w?.management_attention || '')
        }))
      : [],
    emerging_pipeline_risks: Array.isArray(raw?.emerging_pipeline_risks)
      ? raw.emerging_pipeline_risks.map((r: any, idx: number) => ({
          insight_id: String(r?.insight_id || `EPR-${idx + 1}`),
          title: String(r?.title || ''),
          risk_pattern: String(r?.risk_pattern || ''),
          existing_risk_ids: strArr(r?.existing_risk_ids),
          affected_opportunity_ids: filterOppIds(r?.affected_opportunity_ids),
          padf_dimensions: strArr(r?.padf_dimensions),
          revenue_exposure: typeof r?.revenue_exposure === 'number' ? r.revenue_exposure : null,
          business_implication: String(r?.business_implication || ''),
          existing_mitigation_references: strArr(r?.existing_mitigation_references)
        }))
      : [],
    pipeline_improvement_opportunities: Array.isArray(raw?.pipeline_improvement_opportunities)
      ? raw.pipeline_improvement_opportunities.map((o: any, idx: number) => ({
          insight_id: String(o?.insight_id || `PIO-${idx + 1}`),
          title: String(o?.title || ''),
          improvement_description: String(o?.improvement_description || ''),
          affected_opportunity_ids: filterOppIds(o?.affected_opportunity_ids),
          underlying_weaknesses: strArr(o?.underlying_weaknesses),
          existing_strategy_ids: strArr(o?.existing_strategy_ids),
          existing_action_ids: strArr(o?.existing_action_ids),
          expected_business_benefit: String(o?.expected_business_benefit || '')
        }))
      : [],
    strategic_management_recommendations: Array.isArray(raw?.strategic_management_recommendations)
      ? raw.strategic_management_recommendations.map((m: any, idx: number) => ({
          insight_id: String(m?.insight_id || `SMR-${idx + 1}`),
          recommendation: String(m?.recommendation || ''),
          strategic_rationale: String(m?.strategic_rationale || ''),
          affected_opportunity_ids: filterOppIds(m?.affected_opportunity_ids),
          existing_strategy_ids: strArr(m?.existing_strategy_ids),
          existing_action_ids: strArr(m?.existing_action_ids),
          suggested_management_focus: String(m?.suggested_management_focus || ''),
          expected_business_implication: String(m?.expected_business_implication || '')
        }))
      : [],
    data_quality_and_limitations: Array.isArray(raw?.data_quality_and_limitations)
      ? raw.data_quality_and_limitations.map((d: any) => ({
          issue: String(d?.issue || ''),
          affected_analysis_area: String(d?.affected_analysis_area || ''),
          implication: String(d?.implication || '')
        }))
      : [],
    overall_analysis_limitations: strArr(raw?.overall_analysis_limitations),
    validated_reference_ids: validatedRefs
  };
}

async function extractEdgeFunctionError(error: any, fallbackMessage: string): Promise<string> {
  try {
    const ctx = error?.context;
    if (ctx && typeof ctx.json === 'function') {
      const clone = typeof ctx.clone === 'function' ? ctx.clone() : ctx;
      const body = await clone.json();
      if (body?.error) return String(body.error);
      if (body?.message) return String(body.message);
    } else if (ctx && typeof ctx.text === 'function') {
      const txt = await ctx.text();
      if (txt) return txt;
    }
  } catch (_parseErr) {
    // Fallback to error.message
  }
  return error?.message || fallbackMessage;
}

export class RevenueIntelligenceService {
  static async getSavedReport(params: {
    userId: string;
    scopeHash: string;
  }): Promise<{
    exactMatch: SavedRevenueIntelligenceRecord | null;
    latestSaved: SavedRevenueIntelligenceRecord | null;
    storageReady: boolean;
  }> {
    const uid = await resolveAuthenticatedRevOSUserId(params.userId);
    if (!uid) {
      return { exactMatch: null, latestSaved: null, storageReady: false };
    }

    try {
      const { data, error } = await supabase.functions.invoke('pipeline-assessment', {
        body: {
          action: 'get-saved-revenue-intelligence',
          user_id: uid,
          scope_hash: params.scopeHash
        }
      });

      if (!error && data && data.status === 'success') {
        return {
          exactMatch: data.exact_match || null,
          latestSaved: data.latest_saved || null,
          storageReady: data.storage_ready !== false
        };
      }
    } catch (_err) {
      // Fallback to direct Supabase read-only SELECT if Edge Function is not yet updated
    }

    try {
      const { data: rows, error } = await supabase
        .from('pipeline_revenue_intelligence_reports')
        .select('*')
        .eq('user_id', uid)
        .eq('is_saved', true)
        .order('generated_at', { ascending: false })
        .limit(10);

      if (error) {
        return { exactMatch: null, latestSaved: null, storageReady: false };
      }

      const list = (rows || []) as SavedRevenueIntelligenceRecord[];
      const exactMatch = list.find((r) => r.scope_hash === params.scopeHash) || null;
      return {
        exactMatch,
        latestSaved: list[0] || null,
        storageReady: true
      };
    } catch (_e) {
      return { exactMatch: null, latestSaved: null, storageReady: false };
    }
  }

  static async generateInsights(params: {
    userId: string;
    scopeHash: string;
    portfolioContext: PortfolioIntelligenceContext;
    forceRefresh?: boolean;
  }): Promise<{
    report: RevenueIntelligenceReportPayload;
    generatedAt: string;
    scopeHash: string;
    modelIdentifier: string;
    fromCache: boolean;
  }> {
    const uid = await resolveAuthenticatedRevOSUserId(params.userId);
    if (!uid) {
      throw new Error('Authentication required to generate Revenue Intelligence insights.');
    }

    const { data, error } = await supabase.functions.invoke('pipeline-assessment', {
      body: {
        action: 'generate-revenue-intelligence',
        user_id: uid,
        scope_hash: params.scopeHash,
        force_refresh: Boolean(params.forceRefresh),
        portfolio_context: params.portfolioContext
      }
    });

    if (error) {
      const detail = await extractEdgeFunctionError(
        error,
        'Failed to invoke Revenue Intelligence Edge Function.'
      );
      throw new Error(detail);
    }
    if (!data || data.error) {
      throw new Error(data?.error || 'Revenue Intelligence generation failed.');
    }

    const validOppSet = new Set(params.portfolioContext.reference_index.valid_opportunity_ids);
    const validatedReport = validateRevenueIntelligencePayload(data.report, validOppSet);

    return {
      report: validatedReport,
      generatedAt: String(data.generated_at || new Date().toISOString()),
      scopeHash: String(data.scope_hash || params.scopeHash),
      modelIdentifier: String(data.model_identifier || REVENUE_INTELLIGENCE_MODEL_ID),
      fromCache: Boolean(data.from_cache)
    };
  }

  static async saveReport(params: {
    userId: string;
    scopeHash: string;
    scopeLabel: string;
    appliedFilters: RevenueIntelligenceFilterSummary;
    portfolioMetrics: Record<string, unknown>;
    reportPayload: RevenueIntelligenceReportPayload;
    generatedAt: string;
    modelIdentifier?: string;
  }): Promise<SavedRevenueIntelligenceRecord> {
    const uid = await resolveAuthenticatedRevOSUserId(params.userId);
    if (!uid) {
      throw new Error('Authentication required to save Revenue Intelligence report.');
    }

    const { data, error } = await supabase.functions.invoke('pipeline-assessment', {
      body: {
        action: 'save-revenue-intelligence',
        user_id: uid,
        scope_hash: params.scopeHash,
        scope_label: params.scopeLabel,
        applied_filters: params.appliedFilters,
        portfolio_metrics: params.portfolioMetrics,
        report_payload: params.reportPayload,
        generated_at: params.generatedAt,
        model_identifier: params.modelIdentifier || REVENUE_INTELLIGENCE_MODEL_ID
      }
    });

    if (error) {
      const detail = await extractEdgeFunctionError(
        error,
        'Failed to save Revenue Intelligence report to Supabase.'
      );
      throw new Error(detail);
    }
    if (!data || data.error || !data.saved_report) {
      throw new Error(data?.error || 'Supabase did not confirm saved Revenue Intelligence report.');
    }

    return data.saved_report as SavedRevenueIntelligenceRecord;
  }
}
