import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  RotateCcw,
  Search,
  ShieldAlert,
  Target,
  X
} from 'lucide-react';
import { PipelineCardItem } from './PipelineCard';
import { PipelineConfigService } from '../services/PipelineConfigService';

export interface DashboardRiskRow {
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

export interface DashboardActionRow {
  action_id: string;
  pipeline_id: string;
  action_status: string;
  action_description?: string;
  strategic_objective?: string;
  action_owner?: string;
  priority?: string;
  target_date?: string;
}

interface PriorityInterventionsSectionProps {
  scopedItems: PipelineCardItem[];
  riskRows: DashboardRiskRow[];
  actionRows: DashboardActionRow[];
}

type SortField = 'PRIORITY' | 'VALUE' | 'WINABILITY' | 'RISK';
type SortDirection = 'asc' | 'desc';
type PriorityTier = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
type HealthLabel = 'Strong' | 'Moderate' | 'Weak' | 'Critical' | 'Pending';
type RiskLabel = 'Critical' | 'High' | 'Medium' | 'Low' | 'None';
type FocusFilter =
  | 'ALL'
  | 'INTERVENTION_TARGETS'
  | 'LOW_WINABILITY'
  | 'SIGNIFICANT_RISK'
  | 'WEAK_OR_CRITICAL_HEALTH'
  | 'UNASSESSED';

interface InterventionRow {
  id: string;
  item: PipelineCardItem;
  opportunityName: string;
  customer: string;
  stage: string;
  value: number;
  isAssessed: boolean;
  winability: number | null;
  healthLabel: HealthLabel;
  healthRank: number;
  healthBadgeClass: string;
  riskLabel: RiskLabel;
  riskRank: number;
  riskTextClass: string;
  riskBadgeClass: string;
  activeRisks: DashboardRiskRow[];
  keyWeakness: string;
  keyWeaknessDim?: string;
  allWeaknesses: Array<{ source: string; text: string }>;
  recommendedAction: string;
  recommendedActionSource?: string;
  allActions: Array<{
    title: string;
    priority: PriorityTier;
    status?: string;
    owner?: string;
    impact?: string;
    targetDate?: string;
    source: string;
  }>;
  openActionsCount: number;
  priority: PriorityTier;
  priorityRank: number;
  priorityBadgeClass: string;
  prioritySortScore: number;
  isHighValue: boolean;
  isLowWinability: boolean;
  hasSignificantRisk: boolean;
  isInterventionTarget: boolean;
  targetUrl: string;
}

const CANONICAL_PADF_DIMS = PipelineConfigService.getCanonicalPADFDimensions();

function formatCompactCurrency(val: number): string {
  if (!val || val <= 0) return '$0';
  if (val >= 1_000_000) {
    const m = val / 1_000_000;
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(2)}M`;
  }
  if (val >= 1_000) {
    const k = val / 1_000;
    return `$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return `$${val.toLocaleString('en-US')}`;
}

function normalizePriorityTier(raw?: string | null): PriorityTier {
  const upper = String(raw || '').trim().toUpperCase();
  if (upper === 'CRITICAL') return 'CRITICAL';
  if (upper === 'HIGH') return 'HIGH';
  if (upper === 'MEDIUM' || upper === 'MODERATE') return 'MEDIUM';
  return 'LOW';
}

function priorityTierRank(tier: PriorityTier): number {
  if (tier === 'CRITICAL') return 4;
  if (tier === 'HIGH') return 3;
  if (tier === 'MEDIUM') return 2;
  return 1;
}

function getPriorityBadgeClass(tier: PriorityTier): string {
  if (tier === 'CRITICAL') {
    return 'bg-red-700/20 text-red-500 border-red-700/40 dark:bg-red-700/30 dark:text-red-300 dark:border-red-600/50';
  }
  if (tier === 'HIGH') {
    return 'bg-red-500/15 text-red-500 border-red-500/35 dark:text-red-400';
  }
  if (tier === 'MEDIUM') {
    return 'bg-amber-500/15 text-amber-600 border-amber-500/35 dark:text-amber-400';
  }
  return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400';
}

export const PriorityInterventionsSection: React.FC<PriorityInterventionsSectionProps> = ({
  scopedItems,
  riskRows,
  actionRows
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | PriorityTier>('ALL');
  const [focusFilter, setFocusFilter] = useState<FocusFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortField>('PRIORITY');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [reviewRow, setReviewRow] = useState<InterventionRow | null>(null);

  const valueThreshold = useMemo(() => {
    const nonZeroValues = scopedItems
      .map((i) => Math.max(0, Number(i.estimated_value || 0)))
      .filter((v) => v > 0)
      .sort((a, b) => a - b);

    if (nonZeroValues.length === 0) return 500_000;
    const mid = Math.floor(nonZeroValues.length / 2);
    const median =
      nonZeroValues.length % 2 === 0
        ? (nonZeroValues[mid - 1] + nonZeroValues[mid]) / 2
        : nonZeroValues[mid];
    return median > 0 ? Math.round(median) : 100_000;
  }, [scopedItems]);

  const rows = useMemo<InterventionRow[]>(() => {
    return scopedItems.map((item) => {
      const assess = item.pipeline_opp?.latest_assessment;
      const isAssessed = Boolean(assess);
      const rawOutput: any = assess?.raw_reasoning_output || {};
      const execSummary: any = assess?.executive_summary || rawOutput.executive_summary_v2 || {};

      const value = Math.max(0, Number(item.estimated_value || 0));
      const winability = isAssessed
        ? Math.max(0, Math.min(100, Math.round(Number(assess?.risk_adjusted_winability ?? 0))))
        : null;

      // Authoritative Pipeline Health mapping aligned with Assessment Workspace
      const rawHealth = String(assess?.pipeline_health || '').toUpperCase();
      let healthLabel: HealthLabel = 'Pending';
      let healthRank = 0;
      let healthBadgeClass = 'bg-bg-primary/60 text-text-secondary border-border';

      if (isAssessed) {
        if (rawHealth === 'STRONG' || rawHealth === 'HEALTHY') {
          healthLabel = 'Strong';
          healthRank = 4;
          healthBadgeClass =
            'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/35';
        } else if (rawHealth === 'MODERATE') {
          healthLabel = 'Moderate';
          healthRank = 3;
          healthBadgeClass =
            'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/35';
        } else if (rawHealth === 'AT_RISK') {
          healthLabel = 'Weak';
          healthRank = 2;
          healthBadgeClass = 'bg-red-500/15 text-red-500 dark:text-red-400 border-red-500/35';
        } else if (rawHealth === 'CRITICAL') {
          healthLabel = 'Critical';
          healthRank = 1;
          healthBadgeClass =
            'bg-red-700/20 text-red-600 dark:text-red-400 border-red-700/45';
        } else if (winability !== null) {
          if (winability >= 75) {
            healthLabel = 'Strong';
            healthRank = 4;
            healthBadgeClass =
              'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/35';
          } else if (winability >= 55) {
            healthLabel = 'Moderate';
            healthRank = 3;
            healthBadgeClass =
              'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/35';
          } else if (winability >= 35) {
            healthLabel = 'Weak';
            healthRank = 2;
            healthBadgeClass = 'bg-red-500/15 text-red-500 dark:text-red-400 border-red-500/35';
          } else {
            healthLabel = 'Critical';
            healthRank = 1;
            healthBadgeClass =
              'bg-red-700/20 text-red-600 dark:text-red-400 border-red-700/45';
          }
        }
      }

      // Active risks scoped to latest assessment when assessment_id exists
      const pid = item.pipeline_opp?.pipeline_id;
      const latestAssessId = assess?.assessment_id;
      const severityWeight = (sev?: string): number => {
        const s = String(sev || '').toUpperCase();
        if (s === 'CRITICAL') return 4;
        if (s === 'HIGH') return 3;
        if (s === 'MEDIUM') return 2;
        if (s === 'LOW') return 1;
        return 0;
      };

      const activeRisks = riskRows
        .filter((r) => {
          if (!pid || r.pipeline_id !== pid) return false;
          if (latestAssessId && r.assessment_id && r.assessment_id !== latestAssessId) return false;
          return r.risk_status === 'ACTIVE' || r.risk_status === 'MITIGATING';
        })
        .sort((a, b) => severityWeight(b.severity) - severityWeight(a.severity));

      let riskLabel: RiskLabel = 'None';
      let riskRank = 0;
      let riskTextClass = 'text-text-secondary';
      let riskBadgeClass = 'bg-bg-primary/60 text-text-secondary border-border';

      if (activeRisks.some((r) => String(r.severity).toUpperCase() === 'CRITICAL')) {
        riskLabel = 'Critical';
        riskRank = 4;
        riskTextClass = 'text-red-600 dark:text-red-400';
        riskBadgeClass = 'bg-red-700/20 text-red-600 dark:text-red-400 border-red-700/45';
      } else if (activeRisks.some((r) => String(r.severity).toUpperCase() === 'HIGH')) {
        riskLabel = 'High';
        riskRank = 3;
        riskTextClass = 'text-red-500 dark:text-red-400';
        riskBadgeClass = 'bg-red-500/15 text-red-500 dark:text-red-400 border-red-500/35';
      } else if (activeRisks.some((r) => String(r.severity).toUpperCase() === 'MEDIUM')) {
        riskLabel = 'Medium';
        riskRank = 2;
        riskTextClass = 'text-amber-600 dark:text-amber-400';
        riskBadgeClass = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/35';
      } else if (activeRisks.some((r) => String(r.severity).toUpperCase() === 'LOW')) {
        riskLabel = 'Low';
        riskRank = 1;
        riskTextClass = 'text-emerald-600 dark:text-emerald-400';
        riskBadgeClass =
          'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      }

      // Extract Key Weaknesses across PADF dimensions, executive summary, and risks
      const aiNarratives: any[] = Array.isArray(rawOutput.padf_dimension_narratives)
        ? rawOutput.padf_dimension_narratives
        : [];
      const padfResults: any[] = Array.isArray((assess as any)?.padf_results)
        ? (assess as any).padf_results
        : [];

      const dimRecords = CANONICAL_PADF_DIMS.map((dim) => {
        const dbRow = padfResults.find(
          (r: any) => PipelineConfigService.normalizePADFDimensionId(r.dimension_id) === dim.id
        );
        const narr = aiNarratives.find(
          (n: any) =>
            n.dimension_code === dim.id ||
            n.dimension_code === dim.shortCode ||
            String(n.dimension_code || '').startsWith(dim.shortCode)
        );
        const score = Number(dbRow?.dimension_score ?? narr?.score ?? 999);
        const weaknesses: string[] = [
          ...(Array.isArray(narr?.weaknesses) ? narr.weaknesses : []),
          ...(Array.isArray(dbRow?.key_weaknesses) ? dbRow.key_weaknesses : [])
        ]
          .map((w) => String(w || '').trim())
          .filter(Boolean);
        const evidenceGaps: string[] = Array.isArray(narr?.evidence_gaps)
          ? narr.evidence_gaps.map((g: any) => String(g || '').trim()).filter(Boolean)
          : [];
        const shortInterp = String(
          narr?.short_interpretation || narr?.interpretation || dbRow?.assessment_summary || ''
        ).trim();

        return {
          shortCode: dim.shortCode,
          name: dim.name,
          score,
          weaknesses,
          evidenceGaps,
          shortInterp
        };
      }).sort((a, b) => a.score - b.score);

      const allWeaknesses: Array<{ source: string; text: string }> = [];
      dimRecords.forEach((d) => {
        d.weaknesses.forEach((w) => {
          allWeaknesses.push({
            source: `${d.shortCode} (${d.score < 999 ? `${d.score}/100` : d.name})`,
            text: w
          });
        });
      });

      if (Array.isArray(execSummary?.key_constraints)) {
        execSummary.key_constraints.forEach((c: any) => {
          const text = String(c || '').trim();
          if (text) allWeaknesses.push({ source: 'Constraint', text });
        });
      }
      if (Array.isArray(execSummary?.evidence_gaps)) {
        execSummary.evidence_gaps.forEach((g: any) => {
          const text = String(g || '').trim();
          if (text) allWeaknesses.push({ source: 'Evidence Gap', text });
        });
      }
      activeRisks.forEach((r) => {
        if (r.risk_description) {
          allWeaknesses.push({
            source: `${String(r.severity || 'Risk').toUpperCase()} Risk`,
            text: r.risk_description
          });
        }
      });

      let keyWeakness = 'Pending PADF assessment';
      let keyWeaknessDim: string | undefined;

      if (isAssessed) {
        const lowestWithWeakness = dimRecords.find((d) => d.weaknesses.length > 0);
        const lowestScoredDim = dimRecords.find((d) => d.score < 70);

        if (lowestWithWeakness && lowestWithWeakness.score <= 74) {
          keyWeaknessDim = lowestWithWeakness.shortCode;
          keyWeakness = lowestWithWeakness.weaknesses[0];
        } else if (
          Array.isArray(execSummary?.key_constraints) &&
          execSummary.key_constraints.length > 0
        ) {
          keyWeakness = String(execSummary.key_constraints[0]);
        } else if (lowestWithWeakness) {
          keyWeaknessDim = lowestWithWeakness.shortCode;
          keyWeakness = lowestWithWeakness.weaknesses[0];
        } else if (lowestScoredDim && lowestScoredDim.evidenceGaps.length > 0) {
          keyWeaknessDim = lowestScoredDim.shortCode;
          keyWeakness = lowestScoredDim.evidenceGaps[0];
        } else if (lowestScoredDim && lowestScoredDim.shortInterp) {
          keyWeaknessDim = lowestScoredDim.shortCode;
          keyWeakness = lowestScoredDim.shortInterp;
        } else if (activeRisks[0]?.risk_description) {
          keyWeakness = activeRisks[0].risk_description;
        } else if (execSummary?.primary_reason && (winability ?? 100) < 75) {
          keyWeakness = String(execSummary.primary_reason);
        } else {
          keyWeakness = 'No critical weaknesses identified — maintain deal execution';
        }
      }

      // Extract Recommended Actions across DB open actions, AI recommended_next_actions, winning strategies, executive summary, and risk mitigations
      const dealActions = actionRows.filter((a) => pid && a.pipeline_id === pid);
      const openActions = dealActions
        .filter((a) => a.action_status !== 'COMPLETED' && a.action_status !== 'CANCELLED')
        .sort((a, b) => {
          const pDiff =
            priorityTierRank(normalizePriorityTier(b.priority)) -
            priorityTierRank(normalizePriorityTier(a.priority));
          if (pDiff !== 0) return pDiff;
          return String(a.target_date || '9999').localeCompare(String(b.target_date || '9999'));
        });

      const allActions: InterventionRow['allActions'] = [];
      openActions.forEach((a) => {
        if (a.action_description) {
          allActions.push({
            title: a.action_description,
            priority: normalizePriorityTier(a.priority),
            status: a.action_status,
            owner: a.action_owner,
            impact: a.strategic_objective,
            targetDate: a.target_date,
            source: 'Playbook Action'
          });
        }
      });

      const rawRecommendedNext: any[] = Array.isArray(rawOutput.recommended_next_actions)
        ? [...rawOutput.recommended_next_actions].sort(
            (a, b) =>
              priorityTierRank(normalizePriorityTier(b?.priority)) -
              priorityTierRank(normalizePriorityTier(a?.priority))
          )
        : [];

      rawRecommendedNext.forEach((rec) => {
        const text = String(rec?.action || '').trim();
        if (text && !allActions.some((existing) => existing.title === text)) {
          allActions.push({
            title: text,
            priority: normalizePriorityTier(rec?.priority),
            owner: rec?.owner,
            impact: rec?.expected_impact,
            targetDate: rec?.timeframe,
            source: rec?.related_dimension || 'AI Recommendation'
          });
        }
      });

      const winningStrategies: any[] = Array.isArray(rawOutput.winning_strategies)
        ? [...rawOutput.winning_strategies].sort(
            (a, b) =>
              priorityTierRank(normalizePriorityTier(b?.priority)) -
              priorityTierRank(normalizePriorityTier(a?.priority))
          )
        : [];

      winningStrategies.forEach((ws) => {
        const firstAction = ws?.recommended_actions?.[0];
        const title = String(
          firstAction?.action_description || firstAction?.action_title || ws?.title || ''
        ).trim();
        if (title && !allActions.some((existing) => existing.title === title)) {
          allActions.push({
            title,
            priority: normalizePriorityTier(ws?.priority),
            owner: firstAction?.owner_role,
            impact: ws?.expected_impact || firstAction?.expected_outcome,
            targetDate: firstAction?.timeframe,
            source: 'Winning Strategy'
          });
        }
      });

      if (Array.isArray(execSummary?.priority_actions)) {
        execSummary.priority_actions.forEach((act: any) => {
          const text = String(act || '').trim();
          if (text && !allActions.some((existing) => existing.title === text)) {
            allActions.push({
              title: text,
              priority: winability !== null && winability < 55 ? 'HIGH' : 'MEDIUM',
              source: 'Executive Summary'
            });
          }
        });
      }

      activeRisks.forEach((r) => {
        const mit = String(r.mitigation_strategy || '').trim();
        if (mit && !allActions.some((existing) => existing.title === mit)) {
          allActions.push({
            title: mit,
            priority: normalizePriorityTier(r.severity),
            owner: r.owner,
            source: 'Risk Mitigation'
          });
        }
      });

      let recommendedAction = 'Launch initial PADF assessment to generate strategic action plan';
      let recommendedActionSource: string | undefined = 'Assessment Required';

      if (allActions.length > 0) {
        recommendedAction = allActions[0].title;
        recommendedActionSource = allActions[0].source;
      } else if (isAssessed) {
        recommendedAction = 'Review deal scorecard and confirm next milestone with customer';
        recommendedActionSource = 'Deal Governance';
      }

      // Priority & Management Intervention Detection
      const isHighValue = value >= valueThreshold && value > 0;
      const isLowWinability = winability !== null && winability < 55;
      const hasSignificantRisk = riskRank >= 3; // CRITICAL or HIGH active risk
      const isInterventionTarget =
        isHighValue &&
        (isLowWinability || healthLabel === 'Weak' || healthLabel === 'Critical') &&
        (hasSignificantRisk || healthLabel === 'Critical' || (winability !== null && winability < 45));

      let priority: PriorityTier = allActions[0]?.priority || 'MEDIUM';

      if (!isAssessed) {
        priority = isHighValue ? 'HIGH' : 'LOW';
      } else {
        if (
          isInterventionTarget ||
          (isHighValue && riskRank === 4) ||
          healthLabel === 'Critical' ||
          (riskRank === 4 && (winability ?? 100) < 55)
        ) {
          priority = 'CRITICAL';
        } else if (
          isLowWinability ||
          hasSignificantRisk ||
          healthLabel === 'Weak' ||
          priorityTierRank(priority) >= 3
        ) {
          priority = priorityTierRank(priority) === 4 ? 'CRITICAL' : 'HIGH';
        } else if (healthLabel === 'Strong' && riskRank <= 1 && (winability ?? 0) >= 75) {
          priority = allActions[0]?.priority === 'CRITICAL' ? 'HIGH' : allActions[0]?.priority || 'LOW';
        }
      }

      const priorityRank = priorityTierRank(priority);

      // Composite management urgency score so default Priority sort places high-impact intervention targets first
      const valueRatio = valueThreshold > 0 ? Math.min(3, value / valueThreshold) : 0;
      const winabilityGap = winability !== null ? Math.max(0, 100 - winability) / 100 : 0.45;
      const prioritySortScore =
        (isInterventionTarget ? 1000 : 0) +
        priorityRank * 180 +
        riskRank * 45 +
        (isAssessed ? winabilityGap * 60 : 10) +
        valueRatio * 25;

      const targetUrl = `/product/revos/pipeline?opportunityId=${encodeURIComponent(item.id)}${
        item.lead_id ? `&leadId=${encodeURIComponent(item.lead_id)}` : ''
      }&source=pipeline_dashboard`;

      return {
        id: item.id,
        item,
        opportunityName: item.opportunity_name || 'Untitled Opportunity',
        customer: item.company_name || '—',
        stage: item.pipeline_stage || 'Qualification',
        value,
        isAssessed,
        winability,
        healthLabel,
        healthRank,
        healthBadgeClass,
        riskLabel,
        riskRank,
        riskTextClass,
        riskBadgeClass,
        activeRisks,
        keyWeakness,
        keyWeaknessDim,
        allWeaknesses,
        recommendedAction,
        recommendedActionSource,
        allActions,
        openActionsCount: openActions.length,
        priority,
        priorityRank,
        priorityBadgeClass: getPriorityBadgeClass(priority),
        prioritySortScore,
        isHighValue,
        isLowWinability,
        hasSignificantRisk,
        isInterventionTarget,
        targetUrl
      };
    });
  }, [scopedItems, riskRows, actionRows, valueThreshold]);

  const summaryCounts = useMemo(() => {
    const interventionTargets = rows.filter((r) => r.isInterventionTarget);
    const criticalPriority = rows.filter((r) => r.priority === 'CRITICAL');
    const interventionValue = interventionTargets.reduce((sum, r) => sum + r.value, 0);
    return {
      total: rows.length,
      interventionCount: interventionTargets.length,
      interventionValue,
      criticalCount: criticalPriority.length
    };
  }, [rows]);

  const filteredAndSortedRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = rows.filter((row) => {
      if (query) {
        const matches =
          row.opportunityName.toLowerCase().includes(query) ||
          row.customer.toLowerCase().includes(query) ||
          row.keyWeakness.toLowerCase().includes(query) ||
          row.recommendedAction.toLowerCase().includes(query);
        if (!matches) return false;
      }

      if (priorityFilter !== 'ALL' && row.priority !== priorityFilter) {
        return false;
      }

      if (focusFilter === 'INTERVENTION_TARGETS' && !row.isInterventionTarget) return false;
      if (focusFilter === 'LOW_WINABILITY' && !(row.winability !== null && row.winability < 55))
        return false;
      if (focusFilter === 'SIGNIFICANT_RISK' && !row.hasSignificantRisk) return false;
      if (
        focusFilter === 'WEAK_OR_CRITICAL_HEALTH' &&
        row.healthLabel !== 'Weak' &&
        row.healthLabel !== 'Critical'
      )
        return false;
      if (focusFilter === 'UNASSESSED' && row.isAssessed) return false;

      return true;
    });

    return [...filtered].sort((a, b) => {
      const dir = sortDirection === 'desc' ? 1 : -1;
      if (sortBy === 'PRIORITY') {
        const diff = b.prioritySortScore - a.prioritySortScore;
        if (diff !== 0) return diff * dir;
        return (b.value - a.value) * dir;
      }
      if (sortBy === 'VALUE') {
        const diff = b.value - a.value;
        if (diff !== 0) return diff * dir;
        return (b.prioritySortScore - a.prioritySortScore) * dir;
      }
      if (sortBy === 'WINABILITY') {
        const winA = a.winability ?? -1;
        const winB = b.winability ?? -1;
        const diff = winB - winA;
        if (diff !== 0) return diff * dir;
        return (b.value - a.value) * dir;
      }
      if (sortBy === 'RISK') {
        const riskDiff = b.riskRank - a.riskRank;
        if (riskDiff !== 0) return riskDiff * dir;
        const countDiff = b.activeRisks.length - a.activeRisks.length;
        if (countDiff !== 0) return countDiff * dir;
        return (b.value - a.value) * dir;
      }
      return 0;
    });
  }, [rows, searchQuery, priorityFilter, focusFilter, sortBy, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedRows.slice(start, start + pageSize);
  }, [filteredAndSortedRows, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, priorityFilter, focusFilter, sortBy, sortDirection, filteredAndSortedRows.length]);

  const handleSortColumn = (field: SortField) => {
    if (sortBy === field) {
      setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(field);
      // For Winability, lowest winability often needs urgent intervention first, while Value/Risk/Priority default descending
      setSortDirection(field === 'WINABILITY' ? 'asc' : 'desc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-3 w-3 opacity-50 group-hover/th:opacity-90 shrink-0" />;
    }
    return sortDirection === 'desc' ? (
      <ArrowDown className="h-3 w-3 text-accent shrink-0" />
    ) : (
      <ArrowUp className="h-3 w-3 text-accent shrink-0" />
    );
  };

  const hasLocalFilters =
    searchQuery.trim() !== '' || priorityFilter !== 'ALL' || focusFilter !== 'ALL';

  const resetLocalFilters = () => {
    setSearchQuery('');
    setPriorityFilter('ALL');
    setFocusFilter('ALL');
    setSortBy('PRIORITY');
    setSortDirection('desc');
  };

  return (
    <div className="p-5 rounded-2xl border border-border bg-bg-surface shadow-sm flex flex-col space-y-4">
      {/* Header Row */}
      <div className="border-b border-border/70 pb-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-accent" />
              Priority Opportunities &amp; Strategic Interventions
            </h3>
            <p className="text-[10px] text-text-secondary mt-0.5">
              Translate pipeline intelligence into actionable management priorities — high-value deals with low winability and active risks are surfaced for immediate attention
            </p>
          </div>

          {/* Quick Attention Summary Metrics */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono shrink-0">
            <button
              type="button"
              onClick={() =>
                setFocusFilter((prev) =>
                  prev === 'INTERVENTION_TARGETS' ? 'ALL' : 'INTERVENTION_TARGETS'
                )
              }
              className={`px-2.5 py-1.5 rounded-xl border transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                focusFilter === 'INTERVENTION_TARGETS'
                  ? 'border-red-500/60 bg-red-500/15 text-red-500 dark:text-red-400'
                  : 'border-border bg-bg-primary/60 text-text-secondary hover:text-text-primary hover:border-red-500/40'
              }`}
              title="Filter to high-value opportunities with low winability and significant risk"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-red-500 dark:text-red-400 shrink-0" />
              <span>
                Intervention Targets:{' '}
                <strong className="text-text-primary tabular-nums">
                  {summaryCounts.interventionCount}
                </strong>
                {summaryCounts.interventionCount > 0 && (
                  <span className="text-red-500 dark:text-red-400 ml-1 tabular-nums">
                    ({formatCompactCurrency(summaryCounts.interventionValue)})
                  </span>
                )}
              </span>
            </button>

            <span className="text-border hidden sm:inline">|</span>

            <span className="text-text-secondary whitespace-nowrap tabular-nums">
              Critical Actions:{' '}
              <strong className="text-red-500 dark:text-red-400">{summaryCounts.criticalCount}</strong>
            </span>
          </div>
        </div>

        {/* Search, Filter & Sort Controls Row */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search opportunity, customer, weakness, action..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-border bg-bg-primary/70 text-xs text-text-primary focus:outline-none focus:border-accent w-64 sm:w-72"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as 'ALL' | PriorityTier)}
            className="px-3 py-1.5 rounded-xl border border-border bg-bg-primary/70 text-xs font-mono text-text-primary focus:outline-none focus:border-accent cursor-pointer"
            aria-label="Filter by action priority"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Priority: Critical</option>
            <option value="HIGH">Priority: High</option>
            <option value="MEDIUM">Priority: Medium</option>
            <option value="LOW">Priority: Low</option>
          </select>

          <select
            value={focusFilter}
            onChange={(e) => setFocusFilter(e.target.value as FocusFilter)}
            className="px-3 py-1.5 rounded-xl border border-border bg-bg-primary/70 text-xs font-mono text-text-primary focus:outline-none focus:border-accent cursor-pointer"
            aria-label="Filter by management focus"
          >
            <option value="ALL">All Focus Scopes</option>
            <option value="INTERVENTION_TARGETS">
              High Value · Low Winability · High Risk
            </option>
            <option value="LOW_WINABILITY">Low Winability (&lt;55%)</option>
            <option value="SIGNIFICANT_RISK">Critical / High Risk</option>
            <option value="WEAK_OR_CRITICAL_HEALTH">Weak / Critical Health</option>
            <option value="UNASSESSED">Pending PADF Assessment</option>
          </select>

          <div className="flex items-center gap-1">
            <select
              value={sortBy}
              onChange={(e) => {
                const next = e.target.value as SortField;
                setSortBy(next);
                setSortDirection(next === 'WINABILITY' ? 'asc' : 'desc');
              }}
              className="px-3 py-1.5 rounded-xl border border-border bg-bg-primary/70 text-xs font-mono text-text-primary focus:outline-none focus:border-accent cursor-pointer"
              aria-label="Sort prioritized opportunities"
            >
              <option value="PRIORITY">Sort: Priority</option>
              <option value="VALUE">Sort: Opportunity Value</option>
              <option value="WINABILITY">Sort: Winability</option>
              <option value="RISK">Sort: Risk</option>
            </select>

            <button
              type="button"
              onClick={() => setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              className="px-2.5 py-1.5 rounded-xl border border-border bg-bg-primary/70 text-xs font-mono text-text-secondary hover:text-text-primary hover:border-accent/50 transition-colors cursor-pointer inline-flex items-center gap-1 whitespace-nowrap shrink-0"
              title={`Sort direction: ${sortDirection === 'desc' ? 'Highest / Urgent first' : 'Lowest first'}`}
            >
              {sortDirection === 'desc' ? (
                <ArrowDown className="h-3.5 w-3.5 text-accent" />
              ) : (
                <ArrowUp className="h-3.5 w-3.5 text-accent" />
              )}
              <span className="hidden sm:inline">
                {sortDirection === 'desc' ? 'Desc' : 'Asc'}
              </span>
            </button>
          </div>

          {hasLocalFilters && (
            <button
              type="button"
              onClick={resetLocalFilters}
              className="px-2.5 py-1.5 rounded-xl border border-border bg-bg-primary/70 text-xs font-mono text-text-secondary hover:text-text-primary hover:border-accent/50 transition-colors cursor-pointer inline-flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Prioritized Opportunity Table */}
      <div className="overflow-x-auto custom-scrollbar-horizontal-neutral rounded-xl border border-border/70 pb-1">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-bg-primary/70 border-b border-border font-mono text-[10px] text-text-secondary uppercase tracking-wider">
              <th className="px-4 py-3 font-bold min-w-[210px] max-w-[250px]">
                Opportunity ({filteredAndSortedRows.length})
              </th>
              <th className="px-3 py-3 text-right min-w-[115px] whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => handleSortColumn('VALUE')}
                  className="group/th inline-flex items-center justify-end gap-1 font-bold uppercase hover:text-text-primary cursor-pointer ml-auto"
                >
                  <span>Opportunity Value</span>
                  {renderSortIcon('VALUE')}
                </button>
              </th>
              <th className="px-3 py-3 text-right min-w-[95px] whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => handleSortColumn('WINABILITY')}
                  className="group/th inline-flex items-center justify-end gap-1 font-bold uppercase hover:text-text-primary cursor-pointer ml-auto"
                >
                  <span>Winability</span>
                  {renderSortIcon('WINABILITY')}
                </button>
              </th>
              <th className="px-3 py-3 text-center min-w-[110px] whitespace-nowrap">
                Pipeline Health
              </th>
              <th className="px-3 py-3 text-center min-w-[105px] whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => handleSortColumn('RISK')}
                  className="group/th inline-flex items-center justify-center gap-1 font-bold uppercase hover:text-text-primary cursor-pointer mx-auto"
                >
                  <span>Risk</span>
                  {renderSortIcon('RISK')}
                </button>
              </th>
              <th className="px-3 py-3 min-w-[215px] max-w-[260px]">Key Weakness</th>
              <th className="px-3 py-3 min-w-[235px] max-w-[285px]">Recommended Action</th>
              <th className="px-3 py-3 text-center min-w-[105px] whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => handleSortColumn('PRIORITY')}
                  className="group/th inline-flex items-center justify-center gap-1 font-bold uppercase hover:text-text-primary cursor-pointer mx-auto"
                >
                  <span>Priority</span>
                  {renderSortIcon('PRIORITY')}
                </button>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60 font-sans">
            {paginatedRows.map((row) => {
              const winabilityColor =
                row.winability === null
                  ? 'text-text-secondary'
                  : row.winability >= 75
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : row.winability >= 55
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-500 dark:text-red-400';

              return (
                <tr
                  key={row.id}
                  className={`transition-colors ${
                    row.isInterventionTarget
                      ? 'bg-red-500/[0.05] hover:bg-red-500/[0.09]'
                      : 'hover:bg-bg-primary/45'
                  }`}
                >
                  {/* 1. Opportunity (Name & Customer + Assessment Workspace Link) */}
                  <td className="px-4 py-3 align-top max-w-[250px]">
                    <Link
                      to={row.targetUrl}
                      className="group/link block space-y-0.5"
                      title={`Open ${row.opportunityName} in Opportunity Assessment Workspace`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="font-bold text-text-primary group-hover/link:text-accent transition-colors line-clamp-1">
                          {row.opportunityName}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-text-secondary group-hover/link:text-accent shrink-0 mt-0.5 transition-colors" />
                      </div>
                      <div className="text-[11px] text-text-secondary truncate">
                        {row.customer} · <span className="font-mono text-[10px]">{row.stage}</span>
                      </div>
                      {row.isInterventionTarget && (
                        <div className="pt-1">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-red-500/40 bg-red-500/10 text-[9px] font-mono font-bold uppercase tracking-wide text-red-500 dark:text-red-400">
                            <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                            Intervention Target
                          </span>
                        </div>
                      )}
                    </Link>
                  </td>

                  {/* 2. Opportunity Value */}
                  <td
                    className="px-3 py-3 align-top text-right font-mono tabular-nums whitespace-nowrap"
                    title={
                      row.value > 0 ? `$${row.value.toLocaleString('en-US')}` : 'Value not specified'
                    }
                  >
                    <div className="font-bold text-text-primary">
                      {row.value > 0 ? formatCompactCurrency(row.value) : '—'}
                    </div>
                    {row.value > 0 && (
                      <div className="text-[10px] text-text-secondary">
                        ${row.value.toLocaleString('en-US')}
                      </div>
                    )}
                  </td>

                  {/* 3. Winability */}
                  <td className="px-3 py-3 align-top text-right font-mono tabular-nums whitespace-nowrap">
                    <span className={`font-black text-xs ${winabilityColor}`}>
                      {row.winability !== null ? `${row.winability}%` : '--'}
                    </span>
                  </td>

                  {/* 4. Pipeline Health */}
                  <td className="px-3 py-3 align-top text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold ${row.healthBadgeClass}`}
                    >
                      {row.healthLabel}
                    </span>
                  </td>

                  {/* 5. Risk */}
                  <td className="px-3 py-3 align-top text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold ${row.riskBadgeClass}`}
                      title={`${row.activeRisks.length} active risk${row.activeRisks.length === 1 ? '' : 's'}`}
                    >
                      <span>{row.riskLabel}</span>
                      {row.activeRisks.length > 0 && (
                        <span className="opacity-80 tabular-nums">({row.activeRisks.length})</span>
                      )}
                    </span>
                  </td>

                  {/* 6. Key Weakness */}
                  <td className="px-3 py-3 align-top max-w-[260px]">
                    <p
                      className="text-[11px] text-text-primary leading-snug line-clamp-2"
                      title={row.keyWeakness}
                    >
                      {row.keyWeaknessDim && (
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400 mr-1">
                          {row.keyWeaknessDim}:
                        </span>
                      )}
                      {row.keyWeakness}
                    </p>
                  </td>

                  {/* 7. Recommended Action (clickable to review full intervention plan) */}
                  <td className="px-3 py-3 align-top max-w-[285px]">
                    <button
                      type="button"
                      onClick={() => setReviewRow(row)}
                      className="text-left group/act w-full cursor-pointer space-y-1"
                      title="Click to review recommended actions, weaknesses, and risk details"
                    >
                      <p className="text-[11px] text-text-primary group-hover/act:text-accent transition-colors leading-snug line-clamp-2 font-medium">
                        {row.recommendedAction}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-text-secondary group-hover/act:text-accent transition-colors">
                        <span className="inline-flex items-center gap-1">
                          <Eye className="h-3 w-3 shrink-0" />
                          <span>Review plan</span>
                        </span>
                        {row.openActionsCount > 0 && (
                          <span>
                            · {row.openActionsCount} open action
                            {row.openActionsCount === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>
                    </button>
                  </td>

                  {/* 8. Priority */}
                  <td className="px-3 py-3 align-top text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setReviewRow(row)}
                      className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-md border text-[10px] font-mono font-black uppercase tracking-wider cursor-pointer hover:opacity-90 transition-opacity ${row.priorityBadgeClass}`}
                      title="Click to inspect full intervention priority & recommended actions"
                    >
                      {row.priority}
                    </button>
                  </td>
                </tr>
              );
            })}

            {paginatedRows.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 px-4 text-center">
                  <div className="space-y-2">
                    <p className="text-xs text-text-secondary">
                      No opportunities match the current search, priority, or focus criteria.
                    </p>
                    {hasLocalFilters && (
                      <button
                        type="button"
                        onClick={resetLocalFilters}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-bg-primary text-xs font-mono text-text-primary hover:border-accent cursor-pointer"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Reset Filters</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="pt-1 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="text-text-secondary text-[11px] font-mono tabular-nums">
          Showing{' '}
          <span className="font-bold text-text-primary">
            {filteredAndSortedRows.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
          </span>{' '}
          to{' '}
          <span className="font-bold text-text-primary">
            {Math.min(currentPage * pageSize, filteredAndSortedRows.length)}
          </span>{' '}
          of <span className="font-bold text-text-primary">{filteredAndSortedRows.length}</span> opportunities
        </div>

        <div className="flex items-center gap-2">
          {/* Page size selector */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-text-secondary mr-2">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              aria-label="Opportunities per page"
              className="bg-bg-primary border border-border rounded px-1.5 py-0.5 text-text-primary font-bold focus:outline-none cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          {/* Page nav */}
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-border bg-bg-surface text-text-primary hover:bg-bg-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Previous Page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="text-[11px] font-mono font-bold text-text-primary px-2 tabular-nums">
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-border bg-bg-surface text-text-primary hover:bg-bg-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Next Page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Strategic Intervention & Recommended Action Review Modal */}
      {typeof document !== 'undefined' &&
        reviewRow &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-xs"
            onClick={(e) => {
              if (e.target === e.currentTarget) setReviewRow(null);
            }}
          >
            <div
              className="bg-bg-surface border border-border/80 rounded-2xl max-w-2xl w-full max-h-[85vh] p-6 sm:p-7 shadow-2xl relative flex flex-col my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-4 shrink-0">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded border ${reviewRow.priorityBadgeClass}`}
                    >
                      {reviewRow.priority} Priority
                    </span>
                    {reviewRow.isInterventionTarget && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border border-red-500/40 bg-red-500/15 text-red-500 dark:text-red-400">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        Priority Intervention Target
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-black text-text-primary tracking-tight truncate">
                    {reviewRow.opportunityName}
                  </h3>
                  <p className="text-xs text-text-secondary font-mono">
                    {reviewRow.customer} · {reviewRow.stage}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setReviewRow(null)}
                  className="p-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-bg-primary transition-all cursor-pointer shrink-0"
                  title="Close Intervention Review"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Modal Body */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1.5 mt-4 text-xs">
                {/* Key Snapshot Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-bg-primary rounded-xl border border-border/50">
                    <span className="text-[9px] font-mono uppercase text-text-secondary block">
                      Opportunity Value
                    </span>
                    <span className="text-sm font-black font-mono tabular-nums text-text-primary mt-0.5 block">
                      {reviewRow.value > 0
                        ? `$${reviewRow.value.toLocaleString('en-US')}`
                        : '—'}
                    </span>
                  </div>

                  <div className="p-3 bg-bg-primary rounded-xl border border-border/50">
                    <span className="text-[9px] font-mono uppercase text-text-secondary block">
                      Winability
                    </span>
                    <span
                      className={`text-sm font-black font-mono tabular-nums mt-0.5 block ${
                        reviewRow.winability === null
                          ? 'text-text-secondary'
                          : reviewRow.winability >= 75
                            ? 'text-emerald-500 dark:text-emerald-400'
                            : reviewRow.winability >= 55
                              ? 'text-amber-500 dark:text-amber-400'
                              : 'text-red-500 dark:text-red-400'
                      }`}
                    >
                      {reviewRow.winability !== null ? `${reviewRow.winability}%` : 'Pending'}
                    </span>
                  </div>

                  <div className="p-3 bg-bg-primary rounded-xl border border-border/50">
                    <span className="text-[9px] font-mono uppercase text-text-secondary block">
                      Pipeline Health
                    </span>
                    <span className="text-sm font-black mt-0.5 block text-text-primary">
                      {reviewRow.healthLabel}
                    </span>
                  </div>

                  <div className="p-3 bg-bg-primary rounded-xl border border-border/50">
                    <span className="text-[9px] font-mono uppercase text-text-secondary block">
                      Risk Posture
                    </span>
                    <span
                      className={`text-sm font-black mt-0.5 block ${reviewRow.riskTextClass}`}
                    >
                      {reviewRow.riskLabel}
                      {reviewRow.activeRisks.length > 0
                        ? ` (${reviewRow.activeRisks.length})`
                        : ''}
                    </span>
                  </div>
                </div>

                {/* Primary Recommended Action */}
                <div className="p-3.5 rounded-xl bg-accent/5 border border-accent/25 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Main Recommended Intervention
                    </span>
                    {reviewRow.recommendedActionSource && (
                      <span className="text-[10px] font-mono text-text-secondary">
                        {reviewRow.recommendedActionSource}
                      </span>
                    )}
                  </div>
                  <p className="text-text-primary font-semibold leading-relaxed">
                    {reviewRow.recommendedAction}
                  </p>
                </div>

                {/* Key Weaknesses & Constraints */}
                <div className="p-3.5 rounded-xl bg-bg-primary/70 border border-border/50 space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                    Key Identified Weaknesses &amp; Gaps
                  </span>
                  {reviewRow.allWeaknesses.length > 0 ? (
                    <ul className="space-y-1.5 text-text-secondary leading-relaxed">
                      {reviewRow.allWeaknesses.slice(0, 6).map((w, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-amber-500 font-mono text-[10px] font-bold shrink-0 mt-0.5">
                            [{w.source}]
                          </span>
                          <span className="text-text-primary">{w.text}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-text-secondary">{reviewRow.keyWeakness}</p>
                  )}
                </div>

                {/* Active Risks */}
                {reviewRow.activeRisks.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-bg-primary/70 border border-border/50 space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-500 dark:text-red-400 flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Active Formal Risks ({reviewRow.activeRisks.length})
                    </span>
                    <div className="space-y-2">
                      {reviewRow.activeRisks.slice(0, 4).map((risk) => (
                        <div
                          key={risk.risk_instance_id}
                          className="p-2.5 rounded-lg border border-border/60 bg-bg-surface/60 space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                            <span className="font-bold text-red-500 dark:text-red-400 uppercase">
                              {risk.severity} {risk.risk_category ? `· ${risk.risk_category}` : ''}
                            </span>
                            <span className="text-text-secondary">{risk.risk_status}</span>
                          </div>
                          {risk.risk_description && (
                            <p className="text-text-primary leading-snug">
                              {risk.risk_description}
                            </p>
                          )}
                          {risk.mitigation_strategy && (
                            <p className="text-[11px] text-text-secondary">
                              <strong className="text-text-primary">Mitigation:</strong>{' '}
                              {risk.mitigation_strategy}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Full Recommended Actions & Playbook List */}
                {reviewRow.allActions.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-bg-primary/70 border border-border/50 space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-secondary block">
                      Action Plan &amp; Playbook Interventions ({reviewRow.allActions.length})
                    </span>
                    <div className="space-y-2">
                      {reviewRow.allActions.slice(0, 6).map((act, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg border border-border/60 bg-bg-surface/60 space-y-1"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
                            <span
                              className={`px-1.5 py-0.5 rounded border font-bold uppercase ${getPriorityBadgeClass(
                                act.priority
                              )}`}
                            >
                              {act.priority}
                            </span>
                            <span className="text-text-secondary">
                              {act.source}
                              {act.status ? ` · ${act.status.replace(/_/g, ' ')}` : ''}
                              {act.owner ? ` · ${act.owner}` : ''}
                            </span>
                          </div>
                          <p className="text-text-primary font-medium leading-snug">{act.title}</p>
                          {act.impact && (
                            <p className="text-[11px] text-text-secondary">
                              <strong className="text-text-primary">Objective / Impact:</strong>{' '}
                              {act.impact}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between gap-3 shrink-0">
                <Link
                  to={reviewRow.targetUrl}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-black rounded-xl text-xs font-bold hover:bg-accent-hover transition-colors"
                >
                  <span>Open Assessment Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <button
                  type="button"
                  onClick={() => setReviewRow(null)}
                  className="px-4 py-2 rounded-xl border border-border text-xs text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
