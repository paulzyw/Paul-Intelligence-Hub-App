import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  History,
  Info,
  Minus,
  RefreshCw,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  X
} from 'lucide-react';
import { PipelineAssessmentSnapshot } from '../../types/pipeline';
import { PipelineCardItem } from './PipelineCard';
import { isPipelineItemClosed } from '../services/pipelinePortfolioLoader';
import { PipelineEvolutionTimeline, consolidateDailySnapshots } from './PipelineEvolutionTimeline';

/**
 * Approved governance freshness windows anchored to PipelineDataService.evaluateReassessmentNeeds
 * (30-day stale threshold) and Pipeline_Assessment_Rules_v1.1.json EFR002–EFR004 (current / aging / stale).
 */
export const FRESH_MAX_AGE_DAYS = 14;
export const AGING_MAX_AGE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface DashboardAssessmentRecord {
  assessment_id: string;
  pipeline_id: string;
  assessment_sequence: number;
  assessment_status: string;
  trigger_type: string;
  base_winability: number;
  risk_adjusted_winability: number;
  pipeline_health: string;
  assessment_confidence: number;
  configuration_version?: string;
  evidence_kb_version?: string;
  rules_version?: string;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OpportunityCreatedRecord {
  id: string;
  created_at?: string;
}

interface PipelineWinabilityEvolutionSectionProps {
  filteredItems: PipelineCardItem[];
  assessments: DashboardAssessmentRecord[];
  snapshots: PipelineAssessmentSnapshot[];
  opportunityDates: OpportunityCreatedRecord[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

type ObservationInterval = 'MONTHLY' | 'WEEKLY';
type MeasurementMethod = 'AVERAGE' | 'VALUE_WEIGHTED';
type TimeRangeKey = '30D' | '3M' | '6M' | '12M' | 'YTD' | 'ALL';
type FreshnessStatus = 'FRESH' | 'AGING' | 'STALE' | 'NOT_ASSESSED';

interface NormalizedHistoricalAssessment {
  assessmentId: string;
  pipelineId: string;
  sequence: number;
  timestampMs: number;
  dayKey: string;
  isoDate: string;
  baseWinability: number;
  riskAdjustedWinability: number;
  pipelineHealth: string;
  confidence: number;
  configVersion?: string;
  kbVersion?: string;
  rulesVersion?: string;
  triggerType?: string;
  historicalStage?: string;
  historicalDealValue?: number;
  snapshot?: PipelineAssessmentSnapshot;
}

interface OpportunityContributionRow {
  item: PipelineCardItem;
  pipelineId?: string;
  opportunityName: string;
  customer: string;
  owner: string;
  stageAtPoint: string;
  revenueValue: number;
  freshnessStatus: FreshnessStatus;
  ageDays: number | null;
  assessment: NormalizedHistoricalAssessment | null;
  snapshotsForOpp: PipelineAssessmentSnapshot[];
  targetUrl: string;
}

interface ObservationPoint {
  id: string;
  label: string;
  fullDateLabel: string;
  endOfDayMs: number;
  winabilityValue: number | null;
  previousValidValue: number | null;
  deltaFromPrevious: number | null;
  activeCount: number;
  includedCount: number;
  freshCount: number;
  agingCount: number;
  staleCount: number;
  notAssessedCount: number;
  validCoveragePct: number;
  freshShareOfIncludedPct: number | null;
  valueWeightedDenominatorZero: boolean;
  hasAgingOrStaleImpact: boolean;
  isIncompleteCoverage: boolean;
  contributions: OpportunityContributionRow[];
}

function toLocalDayKey(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getEndOfDayMs(d: Date): number {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy.getTime();
}

function getStartOfDayMs(d: Date): number {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
}

function formatAxisDate(ms: number, interval: ObservationInterval): string {
  const d = new Date(ms);
  if (interval === 'MONTHLY') {
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatFullDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

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

function formatWinPct(val: number | null): string {
  if (val === null || Number.isNaN(val)) return '--';
  const rounded = Math.round(val * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
}

function formatDeltaPts(delta: number | null): string {
  if (delta === null || Number.isNaN(delta)) return '--';
  const rounded = Math.round(delta * 10) / 10;
  if (rounded > 0) return `+${rounded.toFixed(1)} pts`;
  if (rounded < 0) return `${rounded.toFixed(1)} pts`;
  return '0.0 pts';
}

function freshnessBadgeMeta(status: FreshnessStatus): {
  label: string;
  badgeClass: string;
} {
  if (status === 'FRESH') {
    return {
      label: 'Fresh',
      badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/35'
    };
  }
  if (status === 'AGING') {
    return {
      label: 'Aging',
      badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/35'
    };
  }
  if (status === 'STALE') {
    return {
      label: 'Stale (>30d)',
      badgeClass: 'bg-red-500/15 text-red-500 dark:text-red-400 border-red-500/35'
    };
  }
  return {
    label: 'Not Assessed',
    badgeClass: 'bg-bg-primary/70 text-text-secondary border-border'
  };
}

export const PipelineWinabilityEvolutionSection: React.FC<
  PipelineWinabilityEvolutionSectionProps
> = ({ filteredItems, assessments, snapshots, opportunityDates, loading, error, onRetry }) => {
  const [interval, setInterval] = useState<ObservationInterval>('MONTHLY');
  const [measurement, setMeasurement] = useState<MeasurementMethod>('AVERAGE');
  const [timeRange, setTimeRange] = useState<TimeRangeKey>('6M');
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [inspectTimelinePipelineId, setInspectTimelinePipelineId] = useState<string | null>(null);

  const oppCreatedMap = useMemo(() => {
    const map = new Map<string, number>();
    opportunityDates.forEach((o) => {
      if (o.id && o.created_at) {
        const ms = new Date(o.created_at).getTime();
        if (!Number.isNaN(ms)) map.set(o.id, ms);
      }
    });
    return map;
  }, [opportunityDates]);

  // 1. Index snapshots & assessment records chronologically per pipeline_id
  const { timelineByPipe, rawSnapshotsByPipe, earliestHistoryMs } = useMemo(() => {
    const byPipeRecords = new Map<string, Map<string, NormalizedHistoricalAssessment>>();
    const snapMap = new Map<string, PipelineAssessmentSnapshot[]>();
    let minTs = Number.POSITIVE_INFINITY;

    const assessMetaMap = new Map<string, DashboardAssessmentRecord>();
    assessments.forEach((a) => {
      if (a.assessment_id) assessMetaMap.set(a.assessment_id, a);
    });

    snapshots.forEach((snap) => {
      if (!snap.pipeline_id) return;
      const list = snapMap.get(snap.pipeline_id) || [];
      list.push(snap);
      snapMap.set(snap.pipeline_id, list);

      const snapAssess = snap.full_snapshot_payload?.assessment;
      const linkedAssess = assessMetaMap.get(snap.assessment_id);
      const rawWin =
        snapAssess?.risk_adjusted_winability ?? linkedAssess?.risk_adjusted_winability;
      if (rawWin === undefined || rawWin === null || Number.isNaN(Number(rawWin))) return;

      const tsStr =
        snap.snapshot_timestamp ||
        snapAssess?.completed_at ||
        linkedAssess?.completed_at ||
        linkedAssess?.created_at ||
        snap.created_at;
      if (!tsStr) return;
      const ms = new Date(tsStr).getTime();
      if (Number.isNaN(ms)) return;
      if (ms < minTs) minTs = ms;

      const dayKey = toLocalDayKey(ms);
      const pipeMap = byPipeRecords.get(snap.pipeline_id) || new Map();
      const existing = pipeMap.get(dayKey);
      const seq = snap.snapshot_sequence ?? linkedAssess?.assessment_sequence ?? 1;

      if (!existing || ms >= existing.timestampMs || seq >= existing.sequence) {
        const snapOpp = snap.full_snapshot_payload?.opportunity;
        pipeMap.set(dayKey, {
          assessmentId: snap.assessment_id || linkedAssess?.assessment_id || snap.snapshot_id,
          pipelineId: snap.pipeline_id,
          sequence: seq,
          timestampMs: ms,
          dayKey,
          isoDate: tsStr,
          baseWinability: Number(
            snapAssess?.base_winability ?? linkedAssess?.base_winability ?? rawWin
          ),
          riskAdjustedWinability: Math.max(0, Math.min(100, Number(rawWin))),
          pipelineHealth: String(
            snapAssess?.pipeline_health || linkedAssess?.pipeline_health || 'MODERATE'
          ),
          confidence: Number(
            snapAssess?.assessment_confidence ?? linkedAssess?.assessment_confidence ?? 0
          ),
          configVersion:
            snapAssess?.configuration_version || linkedAssess?.configuration_version,
          kbVersion: snapAssess?.evidence_kb_version || linkedAssess?.evidence_kb_version,
          rulesVersion: snapAssess?.rules_version || linkedAssess?.rules_version,
          triggerType: snapAssess?.trigger_type || linkedAssess?.trigger_type,
          historicalStage: snapOpp?.pipeline_stage || snapOpp?.sales_stage,
          historicalDealValue:
            typeof snapOpp?.deal_value === 'number' && snapOpp.deal_value > 0
              ? snapOpp.deal_value
              : undefined,
          snapshot: snap
        });
        byPipeRecords.set(snap.pipeline_id, pipeMap);
      }
    });

    // Also include historical rows from pipeline_assessments not yet covered by snapshots
    assessments.forEach((a) => {
      if (!a.pipeline_id) return;
      if (a.assessment_status === 'FAILED' || a.assessment_status === 'INITIALIZING') return;
      if (
        a.risk_adjusted_winability === undefined ||
        a.risk_adjusted_winability === null ||
        Number.isNaN(Number(a.risk_adjusted_winability))
      ) {
        return;
      }
      const tsStr = a.completed_at || a.created_at || a.updated_at;
      if (!tsStr) return;
      const ms = new Date(tsStr).getTime();
      if (Number.isNaN(ms)) return;
      if (ms < minTs) minTs = ms;

      const dayKey = toLocalDayKey(ms);
      const pipeMap = byPipeRecords.get(a.pipeline_id) || new Map();
      const existing = pipeMap.get(dayKey);
      if (!existing || (!existing.snapshot && ms >= existing.timestampMs)) {
        pipeMap.set(dayKey, {
          assessmentId: a.assessment_id,
          pipelineId: a.pipeline_id,
          sequence: a.assessment_sequence || 1,
          timestampMs: ms,
          dayKey,
          isoDate: tsStr,
          baseWinability: Number(a.base_winability ?? a.risk_adjusted_winability),
          riskAdjustedWinability: Math.max(0, Math.min(100, Number(a.risk_adjusted_winability))),
          pipelineHealth: String(a.pipeline_health || 'MODERATE'),
          confidence: Number(a.assessment_confidence ?? 0),
          configVersion: a.configuration_version,
          kbVersion: a.evidence_kb_version,
          rulesVersion: a.rules_version,
          triggerType: a.trigger_type
        });
        byPipeRecords.set(a.pipeline_id, pipeMap);
      }
    });

    const sortedByPipe = new Map<string, NormalizedHistoricalAssessment[]>();
    byPipeRecords.forEach((dayMap, pid) => {
      sortedByPipe.set(
        pid,
        Array.from(dayMap.values()).sort((a, b) => a.timestampMs - b.timestampMs)
      );
    });

    const consolidatedSnaps = new Map<string, PipelineAssessmentSnapshot[]>();
    snapMap.forEach((list, pid) => {
      consolidatedSnaps.set(pid, consolidateDailySnapshots(list));
    });

    return {
      timelineByPipe: sortedByPipe,
      rawSnapshotsByPipe: consolidatedSnaps,
      earliestHistoryMs: Number.isFinite(minTs) ? minTs : null
    };
  }, [assessments, snapshots]);

  // 2. Determine opportunity lifecycle entry & closure bounds for historical reconstruction
  const opportunityLifecycles = useMemo(() => {
    return filteredItems.map((item) => {
      const pid = item.pipeline_opp?.pipeline_id;
      const history = pid ? timelineByPipe.get(pid) || [] : [];

      const candidates: number[] = [];
      const oppCreated = oppCreatedMap.get(item.id);
      if (oppCreated) candidates.push(oppCreated);
      if (item.pipeline_opp?.opportunity_id) {
        const linkedCreated = oppCreatedMap.get(item.pipeline_opp.opportunity_id);
        if (linkedCreated) candidates.push(linkedCreated);
      }
      if (item.pipeline_opp?.created_at) {
        const ms = new Date(item.pipeline_opp.created_at).getTime();
        if (!Number.isNaN(ms)) candidates.push(ms);
      }
      if (history.length > 0) {
        candidates.push(history[0].timestampMs);
      }

      const entryMs =
        candidates.length > 0
          ? getStartOfDayMs(new Date(Math.min(...candidates)))
          : getStartOfDayMs(new Date());

      let closedDayStartMs: number | null = null;
      if (isPipelineItemClosed(item)) {
        const closureOutcome: any = (item.pipeline_opp?.metadata as any)?.closure_outcome;
        const closedRaw = closureOutcome?.closed_at || item.pipeline_opp?.updated_at;
        if (closedRaw) {
          const parsed = new Date(closedRaw).getTime();
          if (!Number.isNaN(parsed)) {
            closedDayStartMs = getStartOfDayMs(new Date(parsed));
          }
        }
        if (closedDayStartMs === null) {
          closedDayStartMs = getStartOfDayMs(new Date());
        }
      }

      return {
        item,
        pid,
        history,
        entryMs,
        closedDayStartMs
      };
    });
  }, [filteredItems, timelineByPipe, oppCreatedMap]);

  // 3. Generate common observation dates (Monthly default or Weekly) across selected timeRange
  const observationDates = useMemo(() => {
    const now = new Date();
    const todayEndMs = getEndOfDayMs(now);

    let startBoundary = new Date(now);
    if (timeRange === '30D') {
      startBoundary.setDate(startBoundary.getDate() - 30);
    } else if (timeRange === '3M') {
      startBoundary.setMonth(startBoundary.getMonth() - 3);
    } else if (timeRange === '6M') {
      startBoundary.setMonth(startBoundary.getMonth() - 6);
    } else if (timeRange === '12M') {
      startBoundary.setMonth(startBoundary.getMonth() - 12);
    } else if (timeRange === 'YTD') {
      startBoundary = new Date(now.getFullYear(), 0, 1);
    } else {
      // ALL available history
      const allDates = [
        ...(earliestHistoryMs ? [earliestHistoryMs] : []),
        ...opportunityLifecycles.map((o) => o.entryMs)
      ];
      const earliest = allDates.length > 0 ? Math.min(...allDates) : now.getTime() - 180 * DAY_MS;
      startBoundary = new Date(earliest);
    }

    const startMs = getStartOfDayMs(startBoundary);
    const points: Array<{ id: string; endOfDayMs: number }> = [];
    const seenKeys = new Set<string>();

    const pushPoint = (d: Date) => {
      const endMs = Math.min(todayEndMs, getEndOfDayMs(d));
      const key = toLocalDayKey(endMs);
      if (endMs < startMs) return;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        points.push({ id: key, endOfDayMs: endMs });
      }
    };

    if (interval === 'MONTHLY') {
      const cursor = new Date(startBoundary.getFullYear(), startBoundary.getMonth(), 1);
      while (cursor.getTime() <= todayEndMs) {
        const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
        if (monthEnd.getTime() <= todayEndMs) {
          pushPoint(monthEnd);
        }
        cursor.setMonth(cursor.getMonth() + 1);
      }
      pushPoint(now);
    } else {
      // Weekly intervals aligned so the final observation point lands on today
      const weeklyOffsets: Date[] = [];
      let cursor = new Date(now);
      let guard = 0;
      while (getEndOfDayMs(cursor) >= startMs && guard < 110) {
        weeklyOffsets.push(new Date(cursor));
        cursor = new Date(cursor.getTime() - 7 * DAY_MS);
        guard += 1;
      }
      weeklyOffsets.reverse().forEach(pushPoint);
    }

    return points.sort((a, b) => a.endOfDayMs - b.endOfDayMs);
  }, [interval, timeRange, earliestHistoryMs, opportunityLifecycles]);

  // 4. Reconstruct active portfolio, apply LOCF + freshness governance, and compute series
  const observationSeries = useMemo<ObservationPoint[]>(() => {
    const rawPoints = observationDates.map((obs) => {
      const obsDayStartMs = getStartOfDayMs(new Date(obs.endOfDayMs));

      const activeLifecycles = opportunityLifecycles.filter(
        (ol) =>
          ol.entryMs <= obs.endOfDayMs &&
          (ol.closedDayStartMs === null || obsDayStartMs < ol.closedDayStartMs)
      );

      let freshCount = 0;
      let agingCount = 0;
      let staleCount = 0;
      let notAssessedCount = 0;

      const validContributions: OpportunityContributionRow[] = [];
      const contributions: OpportunityContributionRow[] = activeLifecycles.map((ol) => {
        // Retrieve latest assessment recorded on or before observation end-of-day (LOCF)
        let latestAssess: NormalizedHistoricalAssessment | null = null;
        for (let idx = ol.history.length - 1; idx >= 0; idx -= 1) {
          if (ol.history[idx].timestampMs <= obs.endOfDayMs) {
            latestAssess = ol.history[idx];
            break;
          }
        }

        let freshnessStatus: FreshnessStatus = 'NOT_ASSESSED';
        let ageDays: number | null = null;

        if (latestAssess) {
          const assessDayStartMs = getStartOfDayMs(new Date(latestAssess.timestampMs));
          ageDays = Math.max(0, Math.floor((obsDayStartMs - assessDayStartMs) / DAY_MS));
          if (ageDays <= FRESH_MAX_AGE_DAYS) {
            freshnessStatus = 'FRESH';
            freshCount += 1;
          } else if (ageDays <= AGING_MAX_AGE_DAYS) {
            freshnessStatus = 'AGING';
            agingCount += 1;
          } else {
            freshnessStatus = 'STALE';
            staleCount += 1;
          }
        } else {
          notAssessedCount += 1;
        }

        const revenueValue = Math.max(
          0,
          Number(latestAssess?.historicalDealValue ?? ol.item.estimated_value ?? 0)
        );
        const stageAtPoint =
          latestAssess?.historicalStage ||
          ol.item.pipeline_stage ||
          ol.item.opportunity_stage ||
          'Qualification';

        const row: OpportunityContributionRow = {
          item: ol.item,
          pipelineId: ol.pid,
          opportunityName: ol.item.opportunity_name || 'Untitled Opportunity',
          customer: ol.item.company_name || '—',
          owner: ol.item.opportunity_owner || 'Unassigned',
          stageAtPoint,
          revenueValue,
          freshnessStatus,
          ageDays,
          assessment: latestAssess,
          snapshotsForOpp: ol.pid ? rawSnapshotsByPipe.get(ol.pid) || [] : [],
          targetUrl: `/product/revos/pipeline?opportunityId=${encodeURIComponent(ol.item.id)}${
            ol.item.lead_id ? `&leadId=${encodeURIComponent(ol.item.lead_id)}` : ''
          }&source=pipeline_dashboard_evolution`
        };

        // Only Fresh & Aging assessments within the 30-day governance validity window are treated as valid current observations
        if (freshnessStatus === 'FRESH' || freshnessStatus === 'AGING') {
          validContributions.push(row);
        }

        return row;
      });

      let winabilityValue: number | null = null;
      let valueWeightedDenominatorZero = false;

      if (validContributions.length > 0) {
        if (measurement === 'AVERAGE') {
          const sum = validContributions.reduce(
            (acc, r) => acc + (r.assessment?.riskAdjustedWinability ?? 0),
            0
          );
          winabilityValue = Math.round((sum / validContributions.length) * 10) / 10;
        } else {
          const withConfirmedValue = validContributions.filter((r) => r.revenueValue > 0);
          const totalRev = withConfirmedValue.reduce((acc, r) => acc + r.revenueValue, 0);
          if (totalRev > 0) {
            const weightedSum = withConfirmedValue.reduce(
              (acc, r) => acc + r.revenueValue * (r.assessment?.riskAdjustedWinability ?? 0),
              0
            );
            winabilityValue = Math.round((weightedSum / totalRev) * 10) / 10;
          } else {
            valueWeightedDenominatorZero = true;
          }
        }
      }

      const activeCount = activeLifecycles.length;
      const includedCount = validContributions.length;
      const validCoveragePct = activeCount > 0 ? Math.round((includedCount / activeCount) * 100) : 0;
      const freshShareOfIncludedPct =
        includedCount > 0 ? Math.round((freshCount / includedCount) * 100) : null;

      return {
        id: obs.id,
        label: formatAxisDate(obs.endOfDayMs, interval),
        fullDateLabel: formatFullDate(obs.endOfDayMs),
        endOfDayMs: obs.endOfDayMs,
        winabilityValue,
        previousValidValue: null as number | null,
        deltaFromPrevious: null as number | null,
        activeCount,
        includedCount,
        freshCount,
        agingCount,
        staleCount,
        notAssessedCount,
        validCoveragePct,
        freshShareOfIncludedPct,
        valueWeightedDenominatorZero,
        hasAgingOrStaleImpact: agingCount > 0 || staleCount > 0,
        isIncompleteCoverage: activeCount > 0 && includedCount < activeCount,
        contributions: [...contributions].sort((a, b) => {
          const rank = (s: FreshnessStatus) =>
            s === 'FRESH' ? 4 : s === 'AGING' ? 3 : s === 'STALE' ? 2 : 1;
          const rDiff = rank(b.freshnessStatus) - rank(a.freshnessStatus);
          if (rDiff !== 0) return rDiff;
          return b.revenueValue - a.revenueValue;
        })
      };
    });

    // Populate delta vs immediately preceding valid observation point
    let lastValid: number | null = null;
    return rawPoints.map((pt) => {
      const prev = lastValid;
      const delta =
        pt.winabilityValue !== null && prev !== null
          ? Math.round((pt.winabilityValue - prev) * 10) / 10
          : null;
      if (pt.winabilityValue !== null) {
        lastValid = pt.winabilityValue;
      }
      return {
        ...pt,
        previousValidValue: prev,
        deltaFromPrevious: delta
      };
    });
  }, [observationDates, opportunityLifecycles, rawSnapshotsByPipe, measurement, interval]);

  const validPoints = useMemo(
    () => observationSeries.filter((p) => p.winabilityValue !== null),
    [observationSeries]
  );

  const latestValidPoint = validPoints.length > 0 ? validPoints[validPoints.length - 1] : null;
  const latestObservationPoint =
    observationSeries.length > 0 ? observationSeries[observationSeries.length - 1] : null;

  const hasAnyHistoricalAssessments = earliestHistoryMs !== null && assessments.length + snapshots.length > 0;
  const isInsufficientData = hasAnyHistoricalAssessments && validPoints.length === 0;
  const isPartialData =
    validPoints.length > 0 &&
    (validPoints.some((p) => p.isIncompleteCoverage) ||
      observationSeries.some((p) => p.winabilityValue === null && p.activeCount > 0));
  const hasStaleOrAgingImpact = Boolean(
    latestValidPoint?.hasAgingOrStaleImpact ||
      observationSeries.some((p) => p.staleCount > 0 || p.agingCount > 0)
  );

  const selectedPoint = useMemo(
    () => observationSeries.find((p) => p.id === selectedPointId) || null,
    [observationSeries, selectedPointId]
  );

  const inspectedOpportunity = useMemo(() => {
    if (!selectedPoint || !inspectTimelinePipelineId) return null;
    return (
      selectedPoint.contributions.find((c) => c.pipelineId === inspectTimelinePipelineId) || null
    );
  }, [selectedPoint, inspectTimelinePipelineId]);

  const openPointDrawer = (point: ObservationPoint) => {
    setInspectTimelinePipelineId(null);
    setSelectedPointId(point.id);
  };

  const measurementLabel =
    measurement === 'AVERAGE'
      ? 'Average Portfolio Winability'
      : 'Value-Weighted Portfolio Winability';

  // Custom dot so observation points remain clearly legible, indicate coverage/freshness state, and open drawer on click
  const renderObservationDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (cx === undefined || cy === undefined || !payload) return null;
    const isSelected = payload.id === selectedPointId;
    const hasValue = payload.winabilityValue !== null;
    const isAffected = payload.hasAgingOrStaleImpact || payload.isIncompleteCoverage;

    if (!hasValue) {
      return null;
    }

    const fill = isAffected ? '#f59e0b' : '#10b981';
    const stroke = isSelected ? '#ffffff' : '#0f172a';

    return (
      <g
        key={`dot-${payload.id}`}
        onClick={() => openPointDrawer(payload)}
        style={{ cursor: 'pointer' }}
      >
        {isSelected && (
          <circle cx={cx} cy={cy} r={10} fill={fill} fillOpacity={0.2} />
        )}
        <circle
          cx={cx}
          cy={cy}
          r={isSelected ? 6 : 4.5}
          fill={fill}
          stroke={stroke}
          strokeWidth={isSelected ? 2 : 1.5}
        />
      </g>
    );
  };

  const renderActiveDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (cx === undefined || cy === undefined || !payload || payload.winabilityValue === null) {
      return null;
    }
    const isAffected = payload.hasAgingOrStaleImpact || payload.isIncompleteCoverage;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={7}
        fill={isAffected ? '#f59e0b' : '#10b981'}
        stroke="#ffffff"
        strokeWidth={2}
        style={{ cursor: 'pointer' }}
        onClick={() => openPointDrawer(payload)}
      />
    );
  };

  const EvolutionTooltip: React.FC<{
    active?: boolean;
    payload?: Array<{ payload: ObservationPoint }>;
  }> = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;
    const pt = payload[0].payload;
    return (
      <div className="rounded-xl border border-border bg-bg-surface px-3.5 py-2.5 shadow-xl text-xs space-y-1.5 max-w-[260px]">
        <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-1">
          <span className="font-bold text-text-primary">{pt.fullDateLabel}</span>
          <span className="text-[10px] font-mono text-text-secondary">
            {interval === 'MONTHLY' ? 'Monthly' : 'Weekly'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 font-mono tabular-nums">
          <span className="text-text-secondary">{measurementLabel}:</span>
          <strong className="text-accent">
            {pt.winabilityValue !== null ? formatWinPct(pt.winabilityValue) : 'Unavailable'}
          </strong>
        </div>

        {pt.deltaFromPrevious !== null && (
          <div className="flex items-center justify-between gap-3 font-mono tabular-nums text-[11px]">
            <span className="text-text-secondary">Change vs. prior:</span>
            <span
              className={
                pt.deltaFromPrevious > 0
                  ? 'text-emerald-500 dark:text-emerald-400 font-bold'
                  : pt.deltaFromPrevious < 0
                    ? 'text-red-500 dark:text-red-400 font-bold'
                    : 'text-text-secondary'
              }
            >
              {formatDeltaPts(pt.deltaFromPrevious)}
            </span>
          </div>
        )}

        <div className="pt-1 border-t border-border/60 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] font-mono tabular-nums text-text-secondary">
          <span>
            Active: <strong className="text-text-primary">{pt.activeCount}</strong>
          </span>
          <span>
            Included: <strong className="text-text-primary">{pt.includedCount}</strong>
          </span>
          <span className="text-emerald-600 dark:text-emerald-400">Fresh: {pt.freshCount}</span>
          <span className="text-amber-600 dark:text-amber-400">Aging: {pt.agingCount}</span>
          <span className="text-red-500 dark:text-red-400">Stale: {pt.staleCount}</span>
          <span>No Valid: {pt.notAssessedCount}</span>
        </div>

        <div className="text-[10px] text-accent font-mono pt-0.5">
          Click observation marker to inspect details
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4 rounded-2xl border border-border bg-bg-surface shadow-sm space-y-3 animate-pulse">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2 border-b border-border/60 pb-2.5">
          <div className="space-y-1">
            <div className="h-4 w-52 bg-bg-primary rounded" />
            <div className="h-3 w-80 max-w-full bg-bg-primary rounded" />
          </div>
          <div className="h-7 w-72 max-w-full bg-bg-primary rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-4 grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((idx) => (
              <div key={idx} className="h-16 rounded-xl bg-bg-primary border border-border/50" />
            ))}
          </div>
          <div className="lg:col-span-8 h-[196px] rounded-xl bg-bg-primary border border-border/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl border border-border bg-bg-surface shadow-sm flex flex-col space-y-3">
      {/* Compact Header + Inline Controls Row */}
      <div className="border-b border-border/70 pb-2.5 flex flex-col xl:flex-row xl:items-center justify-between gap-2.5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
              <History className="h-3.5 w-3.5 text-accent shrink-0" />
              <span>Pipeline Winability Evolution</span>
            </h3>
            <span
              className="text-[10px] font-mono text-text-secondary inline-flex items-center gap-1 whitespace-nowrap"
              title="Governed by 30-day assessment validity window (Fresh ≤14d, Aging 15–30d, Stale >30d excluded)"
            >
              <span>·</span>
              <Info className="h-3 w-3 text-accent shrink-0" />
              <span>LOCF · 30d Validity</span>
            </span>
          </div>
          <p className="text-[10px] text-text-secondary mt-0.5 truncate" title="Track how opportunity winability and revenue-weighted pipeline strength evolve over time, using historical Pipeline Assessment records.">
            Track how opportunity winability and revenue-weighted pipeline strength evolve over time, using historical Pipeline Assessment records.
          </p>
        </div>

        {/* Inline Chart Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-text-secondary shrink-0" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRangeKey)}
              aria-label="Historical time range"
              className="px-2 py-1 rounded-lg border border-border bg-bg-primary/70 text-[11px] font-mono text-text-primary focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value="30D">Last 30D</option>
              <option value="3M">Last 3M</option>
              <option value="6M">Last 6M</option>
              <option value="12M">Last 12M</option>
              <option value="YTD">YTD</option>
              <option value="ALL">All History</option>
            </select>
          </div>

          <div
            className="inline-flex items-center p-0.5 rounded-lg border border-border bg-bg-primary/70"
            role="group"
            aria-label="Observation interval"
          >
            <button
              type="button"
              onClick={() => setInterval('WEEKLY')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                interval === 'WEEKLY'
                  ? 'bg-accent text-black font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Weekly
            </button>
            <button
              type="button"
              onClick={() => setInterval('MONTHLY')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                interval === 'MONTHLY'
                  ? 'bg-accent text-black font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Monthly
            </button>
          </div>

          <div
            className="inline-flex items-center p-0.5 rounded-lg border border-border bg-bg-primary/70"
            role="group"
            aria-label="Portfolio winability measurement"
          >
            <button
              type="button"
              onClick={() => setMeasurement('AVERAGE')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                measurement === 'AVERAGE'
                  ? 'bg-accent text-black font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Average Winability
            </button>
            <button
              type="button"
              onClick={() => setMeasurement('VALUE_WEIGHTED')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                measurement === 'VALUE_WEIGHTED'
                  ? 'bg-accent text-black font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Value-Weighted
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="px-3.5 py-2.5 rounded-xl border border-red-500/40 bg-red-500/10 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-red-500 dark:text-red-400">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>
              <strong>Unable to load historical assessment records:</strong> {error}
            </span>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-red-500/40 bg-bg-surface text-[11px] font-bold text-text-primary hover:border-red-500 cursor-pointer whitespace-nowrap shrink-0"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}

      {/* Horizontal Split Body: Compact 2x2 KPIs Left (lg:col-span-4) + Wide Low-Height Evolution Chart Right (lg:col-span-8) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        {/* Left: Compact 2x2 KPI Grid + Governance Coverage Summary */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-2">
          <div className="grid grid-cols-2 gap-2 flex-1">
            {/* KPI 1: Current Portfolio Winability */}
            <div className="px-3 py-2 rounded-xl border border-border/70 bg-bg-primary/50 flex flex-col justify-center">
              <div className="text-[9px] font-mono uppercase text-text-secondary truncate">
                Current Portfolio Winability
              </div>
              <div className="text-lg font-black font-mono tabular-nums text-text-primary leading-tight mt-0.5">
                {latestValidPoint ? formatWinPct(latestValidPoint.winabilityValue) : '--'}
              </div>
              <div className="text-[10px] text-text-secondary truncate">
                {measurement === 'AVERAGE' ? 'Mean' : 'Weighted'}
                {latestValidPoint ? ` · ${latestValidPoint.label}` : ''}
              </div>
            </div>

            {/* KPI 2: Change vs. Previous Period */}
            <div className="px-3 py-2 rounded-xl border border-border/70 bg-bg-primary/50 flex flex-col justify-center">
              <div className="text-[9px] font-mono uppercase text-text-secondary truncate">
                Change vs. Previous
              </div>
              <div className="flex items-center gap-1 text-lg font-black font-mono tabular-nums leading-tight mt-0.5">
                {latestValidPoint?.deltaFromPrevious === null ||
                latestValidPoint?.deltaFromPrevious === undefined ? (
                  <span className="text-text-secondary">--</span>
                ) : latestValidPoint.deltaFromPrevious > 0 ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                    {formatDeltaPts(latestValidPoint.deltaFromPrevious)}
                  </span>
                ) : latestValidPoint.deltaFromPrevious < 0 ? (
                  <span className="inline-flex items-center gap-1 text-red-500 dark:text-red-400">
                    <TrendingDown className="h-3.5 w-3.5 shrink-0" />
                    {formatDeltaPts(latestValidPoint.deltaFromPrevious)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-text-secondary">
                    <Minus className="h-3.5 w-3.5 shrink-0" />
                    0.0 pts
                  </span>
                )}
              </div>
              <div className="text-[10px] text-text-secondary truncate">
                {latestValidPoint?.previousValidValue !== null &&
                latestValidPoint?.previousValidValue !== undefined
                  ? `Prior: ${formatWinPct(latestValidPoint.previousValidValue)}`
                  : 'Needs ≥2 valid'}
              </div>
            </div>

            {/* KPI 3: Opportunities Included */}
            <div className="px-3 py-2 rounded-xl border border-border/70 bg-bg-primary/50 flex flex-col justify-center">
              <div className="text-[9px] font-mono uppercase text-text-secondary truncate">
                Opportunities Included
              </div>
              <div className="text-lg font-black font-mono tabular-nums text-text-primary leading-tight mt-0.5">
                {latestValidPoint
                  ? `${latestValidPoint.includedCount} / ${latestValidPoint.activeCount}`
                  : latestObservationPoint
                    ? `0 / ${latestObservationPoint.activeCount}`
                    : '--'}
              </div>
              <div className="text-[10px] text-text-secondary truncate tabular-nums">
                {latestValidPoint
                  ? `${latestValidPoint.validCoveragePct}% valid active`
                  : 'No valid records'}
              </div>
            </div>

            {/* KPI 4: Assessment Freshness */}
            <div className="px-3 py-2 rounded-xl border border-border/70 bg-bg-primary/50 flex flex-col justify-center">
              <div className="text-[9px] font-mono uppercase text-text-secondary truncate">
                Assessment Freshness
              </div>
              <div
                className={`text-lg font-black font-mono tabular-nums leading-tight mt-0.5 ${
                  !latestValidPoint || latestValidPoint.freshShareOfIncludedPct === null
                    ? 'text-text-secondary'
                    : latestValidPoint.freshShareOfIncludedPct >= 75
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : latestValidPoint.freshShareOfIncludedPct >= 40
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-red-500 dark:text-red-400'
                }`}
              >
                {latestValidPoint?.freshShareOfIncludedPct !== null &&
                latestValidPoint?.freshShareOfIncludedPct !== undefined
                  ? `${latestValidPoint.freshShareOfIncludedPct}% Fresh`
                  : '--'}
              </div>
              <div className="text-[10px] text-text-secondary truncate tabular-nums">
                {latestValidPoint
                  ? `${latestValidPoint.freshCount}F · ${latestValidPoint.agingCount}A · ${latestValidPoint.staleCount}S`
                  : '14d / 30d window'}
              </div>
            </div>
          </div>

          {/* Inline Coverage / Freshness Status Strip */}
          {!error && (isPartialData || hasStaleOrAgingImpact) ? (
            <div className="px-2.5 py-1.5 rounded-lg border border-amber-500/35 bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-300 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 truncate">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {hasStaleOrAgingImpact
                    ? 'Includes aging or excludes stale (>30d) deals'
                    : 'Partial historical coverage on some dates'}
                </span>
              </span>
              {latestObservationPoint && (
                <button
                  type="button"
                  onClick={() => openPointDrawer(latestObservationPoint)}
                  className="font-mono font-bold underline hover:opacity-80 cursor-pointer whitespace-nowrap shrink-0"
                >
                  Details
                </button>
              )}
            </div>
          ) : (
            <div className="px-2.5 py-1.5 rounded-lg border border-border/60 bg-bg-primary/40 text-[10px] text-text-secondary flex items-center justify-between gap-2">
              <span className="truncate">
                {validPoints.length > 0
                  ? `${validPoints.length} valid observation${validPoints.length === 1 ? '' : 's'} in range`
                  : 'Click any observation point for breakdown'}
              </span>
              {latestObservationPoint && (
                <button
                  type="button"
                  onClick={() => openPointDrawer(latestObservationPoint)}
                  className="font-mono font-semibold text-accent hover:underline cursor-pointer whitespace-nowrap shrink-0"
                >
                  Latest Drawer
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right: Compact Evolution Chart + Single-Line Observation Strip */}
        <div className="lg:col-span-8 min-w-0 rounded-xl border border-border/60 bg-bg-primary/25 p-3 flex flex-col justify-between gap-2">
          {!error && !hasAnyHistoricalAssessments ? (
            <div className="h-[178px] flex flex-col items-center justify-center text-center px-4 space-y-1.5">
              <History className="h-6 w-6 text-text-secondary/60" />
              <div className="text-xs font-bold text-text-primary">No Historical Assessment Data</div>
              <p className="text-[11px] text-text-secondary max-w-md">
                Historical Pipeline Assessment records are not available for the selected portfolio filters and time range.
              </p>
            </div>
          ) : !error && isInsufficientData ? (
            <div className="h-[178px] flex flex-col items-center justify-center text-center px-4 space-y-2">
              <Clock className="h-6 w-6 text-amber-500" />
              <div className="text-xs font-bold text-text-primary">
                Insufficient Valid Historical Assessments
              </div>
              <p className="text-[11px] text-text-secondary max-w-md">
                {measurement === 'VALUE_WEIGHTED' &&
                observationSeries.some((p) => p.valueWeightedDenominatorZero)
                  ? 'Active assessed opportunities lack confirmed revenue values for value-weighted winability.'
                  : 'Historical assessments fall outside the 30-day governance validity window or predate portfolio entry.'}
              </p>
              {latestObservationPoint && (
                <button
                  type="button"
                  onClick={() => openPointDrawer(latestObservationPoint)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border bg-bg-surface text-[11px] font-mono text-text-primary hover:border-accent cursor-pointer"
                >
                  <span>Inspect Breakdown</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-text-primary">{measurementLabel}</span>
                  <span className="text-text-secondary">·</span>
                  <span className="font-mono text-[10px] text-text-secondary">
                    {interval === 'MONTHLY' ? 'Monthly' : 'Weekly'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[10px] font-mono text-text-secondary">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                    Fresh
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
                    Aging / Partial
                  </span>
                  <span className="hidden sm:inline">Click marker for drawer</span>
                </div>
              </div>

              <div className="overflow-x-auto custom-scrollbar-horizontal">
                <div className="h-[145px] min-w-[420px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={observationSeries}
                      margin={{ top: 8, right: 14, left: -16, bottom: 0 }}
                      onClick={(state: any) => {
                        const idx = state?.activeTooltipIndex;
                        if (typeof idx === 'number' && observationSeries[idx]) {
                          openPointDrawer(observationSeries[idx]);
                        }
                      }}
                    >
                      <CartesianGrid stroke="rgba(148,163,184,0.14)" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                        tickMargin={4}
                      />
                      <YAxis
                        domain={[0, 100]}
                        ticks={[0, 25, 50, 75, 100]}
                        tickFormatter={(v) => `${v}%`}
                        tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                      />
                      <Tooltip content={<EvolutionTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="winabilityValue"
                        name={measurementLabel}
                        stroke="#10b981"
                        strokeWidth={2.5}
                        connectNulls={false}
                        dot={renderObservationDot}
                        activeDot={renderActiveDot}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Single-line Scrollable Observation Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar-horizontal pt-1 border-t border-border/50 pb-0.5">
                <span className="text-[10px] font-mono text-text-secondary shrink-0">Points:</span>
                {observationSeries.map((pt) => {
                  const isSelected = pt.id === selectedPointId;
                  const isUnavailable = pt.winabilityValue === null;
                  return (
                    <button
                      key={pt.id}
                      type="button"
                      onClick={() => openPointDrawer(pt)}
                      className={`px-2 py-0.5 rounded border text-[10px] font-mono tabular-nums transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        isSelected
                          ? 'border-accent bg-accent/15 text-accent font-bold'
                          : isUnavailable
                            ? 'border-border/60 bg-bg-primary/30 text-text-secondary/70 hover:text-text-primary'
                            : 'border-border bg-bg-surface text-text-primary hover:border-accent/50'
                      }`}
                      title={`Inspect ${pt.fullDateLabel}`}
                    >
                      {pt.label}: {pt.winabilityValue !== null ? formatWinPct(pt.winabilityValue) : '—'}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Element 4: Historical Observation Detail Drawer (Slide-over on Desktop/Tablet, Full-Height Sheet on Mobile) */}
      {typeof document !== 'undefined' &&
        selectedPoint &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-xs flex justify-end"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedPointId(null);
            }}
          >
            <div
              className="w-full sm:max-w-2xl h-full bg-bg-surface border-l border-border shadow-2xl flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Header */}
              <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-3 shrink-0 bg-bg-surface">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-text-secondary">
                    <span>{interval === 'MONTHLY' ? 'Monthly Observation' : 'Weekly Observation'}</span>
                    <span>·</span>
                    <span>{measurementLabel}</span>
                  </div>
                  <h3 className="text-base font-black text-text-primary tracking-tight">
                    Historical Portfolio Snapshot — {selectedPoint.fullDateLabel}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPointId(null)}
                  className="p-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-bg-primary cursor-pointer shrink-0"
                  title="Close Observation Detail Drawer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Drawer Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
                {/* Optional Nested Individual Opportunity Evolution Timeline */}
                {inspectedOpportunity && inspectedOpportunity.snapshotsForOpp.length > 0 && (
                  <div className="p-4 rounded-xl border border-accent/40 bg-bg-primary/60 space-y-3">
                    <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                      <div>
                        <div className="text-[10px] font-mono uppercase text-accent font-bold">
                          Opportunity Historical Evolution Timeline
                        </div>
                        <div className="text-xs font-bold text-text-primary">
                          {inspectedOpportunity.opportunityName} ({inspectedOpportunity.customer})
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setInspectTimelinePipelineId(null)}
                        className="px-2.5 py-1 rounded-lg border border-border text-[11px] font-mono text-text-secondary hover:text-text-primary cursor-pointer"
                      >
                        Close Timeline
                      </button>
                    </div>
                    <PipelineEvolutionTimeline snapshots={inspectedOpportunity.snapshotsForOpp} />
                  </div>
                )}

                {/* A. Portfolio Overview */}
                <div className="space-y-2">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-secondary">
                    A. Portfolio Overview
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div className="p-3 rounded-xl border border-border/60 bg-bg-primary/60">
                      <span className="text-[10px] font-mono text-text-secondary block">
                        Observation Date
                      </span>
                      <span className="text-xs font-bold text-text-primary mt-0.5 block">
                        {selectedPoint.fullDateLabel}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-border/60 bg-bg-primary/60">
                      <span className="text-[10px] font-mono text-text-secondary block">
                        Selected Measurement
                      </span>
                      <span className="text-xs font-bold text-text-primary mt-0.5 block truncate">
                        {measurement === 'AVERAGE' ? 'Average Winability' : 'Value-Weighted'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-border/60 bg-bg-primary/60">
                      <span className="text-[10px] font-mono text-text-secondary block">
                        Portfolio Winability
                      </span>
                      <span className="text-sm font-black font-mono tabular-nums text-accent mt-0.5 block">
                        {selectedPoint.winabilityValue !== null
                          ? formatWinPct(selectedPoint.winabilityValue)
                          : 'Unavailable'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-border/60 bg-bg-primary/60">
                      <span className="text-[10px] font-mono text-text-secondary block">
                        Change vs. Previous
                      </span>
                      <span
                        className={`text-sm font-black font-mono tabular-nums mt-0.5 block ${
                          selectedPoint.deltaFromPrevious === null
                            ? 'text-text-secondary'
                            : selectedPoint.deltaFromPrevious > 0
                              ? 'text-emerald-500 dark:text-emerald-400'
                              : selectedPoint.deltaFromPrevious < 0
                                ? 'text-red-500 dark:text-red-400'
                                : 'text-text-secondary'
                        }`}
                      >
                        {formatDeltaPts(selectedPoint.deltaFromPrevious)}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-border/60 bg-bg-primary/60">
                      <span className="text-[10px] font-mono text-text-secondary block">
                        Active Opportunities
                      </span>
                      <span className="text-sm font-black font-mono tabular-nums text-text-primary mt-0.5 block">
                        {selectedPoint.activeCount}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-border/60 bg-bg-primary/60">
                      <span className="text-[10px] font-mono text-text-secondary block">
                        Included in Calc
                      </span>
                      <span className="text-sm font-black font-mono tabular-nums text-text-primary mt-0.5 block">
                        {selectedPoint.includedCount} ({selectedPoint.validCoveragePct}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* B. Assessment Coverage */}
                <div className="space-y-2.5 p-3.5 rounded-xl border border-border/60 bg-bg-primary/50">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-secondary">
                      B. Assessment Coverage &amp; Freshness Distribution
                    </span>
                    <span className="text-[11px] font-mono font-bold text-text-primary tabular-nums">
                      {selectedPoint.validCoveragePct}% Valid Coverage
                    </span>
                  </div>

                  {/* Proportional Stacked Coverage Bar */}
                  <div className="h-2.5 w-full rounded-full bg-bg-surface border border-border/60 overflow-hidden flex">
                    {selectedPoint.activeCount > 0 && (
                      <>
                        {selectedPoint.freshCount > 0 && (
                          <div
                            className="h-full bg-emerald-500"
                            style={{
                              width: `${(selectedPoint.freshCount / selectedPoint.activeCount) * 100}%`
                            }}
                            title={`Fresh: ${selectedPoint.freshCount}`}
                          />
                        )}
                        {selectedPoint.agingCount > 0 && (
                          <div
                            className="h-full bg-amber-500"
                            style={{
                              width: `${(selectedPoint.agingCount / selectedPoint.activeCount) * 100}%`
                            }}
                            title={`Aging: ${selectedPoint.agingCount}`}
                          />
                        )}
                        {selectedPoint.staleCount > 0 && (
                          <div
                            className="h-full bg-red-500"
                            style={{
                              width: `${(selectedPoint.staleCount / selectedPoint.activeCount) * 100}%`
                            }}
                            title={`Stale (>30d): ${selectedPoint.staleCount}`}
                          />
                        )}
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono tabular-nums">
                    <div className="p-2 rounded-lg bg-bg-surface border border-border/60">
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">
                        Fresh (≤14d)
                      </span>
                      <strong className="text-text-primary text-xs">{selectedPoint.freshCount}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-bg-surface border border-border/60">
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 block">
                        Aging (15–30d)
                      </span>
                      <strong className="text-text-primary text-xs">{selectedPoint.agingCount}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-bg-surface border border-border/60">
                      <span className="text-[10px] text-red-500 dark:text-red-400 block">
                        Stale (&gt;30d)
                      </span>
                      <strong className="text-text-primary text-xs">{selectedPoint.staleCount}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-bg-surface border border-border/60">
                      <span className="text-[10px] text-text-secondary block">
                        Not Assessed
                      </span>
                      <strong className="text-text-primary text-xs">
                        {selectedPoint.notAssessedCount}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* C. Opportunity Contributions */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-secondary">
                      C. Opportunity Contributions ({selectedPoint.contributions.length})
                    </span>
                    <span className="text-[10px] font-mono text-text-secondary">
                      Stale (&gt;30d) &amp; Not Assessed excluded from calculation
                    </span>
                  </div>

                  {selectedPoint.contributions.length === 0 ? (
                    <div className="p-6 rounded-xl border border-border/60 bg-bg-primary/40 text-center text-text-secondary">
                      No active opportunities existed in the reconstructed portfolio at this observation date.
                    </div>
                  ) : (
                    <div className="overflow-x-auto custom-scrollbar-horizontal rounded-xl border border-border/70">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-bg-primary/70 border-b border-border font-mono text-[10px] text-text-secondary uppercase">
                            <th className="px-3 py-2.5 min-w-[180px]">Opportunity</th>
                            <th className="px-3 py-2.5 min-w-[110px]">Owner / Stage</th>
                            <th className="px-3 py-2.5 text-right min-w-[85px]">Value</th>
                            <th className="px-3 py-2.5 text-right min-w-[80px]">Winability</th>
                            <th className="px-3 py-2.5 min-w-[130px]">Assessment &amp; Freshness</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {selectedPoint.contributions.map((c) => {
                            const fMeta = freshnessBadgeMeta(c.freshnessStatus);
                            const isExcluded =
                              c.freshnessStatus === 'STALE' || c.freshnessStatus === 'NOT_ASSESSED';
                            return (
                              <tr
                                key={c.item.id}
                                className={
                                  isExcluded ? 'bg-bg-primary/20 opacity-85' : 'hover:bg-bg-primary/40'
                                }
                              >
                                <td className="px-3 py-2.5 align-top">
                                  <Link
                                    to={c.targetUrl}
                                    className="font-bold text-text-primary hover:text-accent transition-colors inline-flex items-center gap-1"
                                  >
                                    <span className="line-clamp-1">{c.opportunityName}</span>
                                    <ArrowRight className="h-3 w-3 shrink-0" />
                                  </Link>
                                  <div className="text-[10px] text-text-secondary truncate">
                                    {c.customer}
                                  </div>
                                  {c.pipelineId && c.snapshotsForOpp.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setInspectTimelinePipelineId((prev) =>
                                          prev === c.pipelineId ? null : c.pipelineId!
                                        )
                                      }
                                      className="mt-1 inline-flex items-center gap-1 text-[10px] font-mono text-accent hover:underline cursor-pointer"
                                    >
                                      <History className="h-3 w-3 shrink-0" />
                                      <span>
                                        {inspectTimelinePipelineId === c.pipelineId
                                          ? 'Hide Evolution Timeline'
                                          : `Evolution Timeline (${c.snapshotsForOpp.length})`}
                                      </span>
                                    </button>
                                  )}
                                </td>

                                <td className="px-3 py-2.5 align-top">
                                  <div className="text-text-primary truncate max-w-[130px]">
                                    {c.owner}
                                  </div>
                                  <div className="text-[10px] font-mono text-text-secondary truncate max-w-[130px]">
                                    {c.stageAtPoint}
                                  </div>
                                </td>

                                <td className="px-3 py-2.5 align-top text-right font-mono tabular-nums whitespace-nowrap text-text-primary">
                                  {c.revenueValue > 0 ? formatCompactCurrency(c.revenueValue) : '—'}
                                </td>

                                <td className="px-3 py-2.5 align-top text-right font-mono tabular-nums whitespace-nowrap">
                                  {c.assessment ? (
                                    <span className="font-bold text-text-primary">
                                      {c.assessment.riskAdjustedWinability}%
                                    </span>
                                  ) : (
                                    <span className="text-text-secondary">--</span>
                                  )}
                                </td>

                                <td className="px-3 py-2.5 align-top space-y-1">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-mono font-bold ${fMeta.badgeClass}`}
                                  >
                                    {fMeta.label}
                                  </span>
                                  <div className="text-[10px] font-mono text-text-secondary">
                                    {c.assessment
                                      ? `${formatFullDate(c.assessment.timestampMs)}${
                                          c.ageDays !== null ? ` (${c.ageDays}d old)` : ''
                                        }`
                                      : 'No assessment on/before date'}
                                  </div>
                                  {c.assessment?.configVersion && (
                                    <div className="text-[9px] font-mono text-text-secondary/80">
                                      Cfg {c.assessment.configVersion} · Rules{' '}
                                      {c.assessment.rulesVersion || 'v1.1'}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="px-5 py-3.5 border-t border-border flex items-center justify-between gap-3 shrink-0 bg-bg-surface">
                <div className="text-[11px] font-mono text-text-secondary flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>
                    {selectedPoint.includedCount} valid of {selectedPoint.activeCount} active
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPointId(null)}
                  className="px-4 py-1.5 rounded-xl border border-border bg-bg-primary text-xs font-semibold text-text-primary hover:border-accent cursor-pointer"
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
