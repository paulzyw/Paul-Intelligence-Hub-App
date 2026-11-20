import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  User,
  X
} from 'lucide-react';
import { PipelineCardItem } from './PipelineCard';
import { DashboardRiskRow } from './PriorityInterventionsSection';

export interface PipelineRiskIntelligenceSectionProps {
  scopedItems: PipelineCardItem[];
  riskRows: DashboardRiskRow[];
  loading?: boolean;
}

type RiskPostureKey = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

interface EnrichedOpportunityRiskProfile {
  item: PipelineCardItem;
  id: string;
  opportunityName: string;
  customer: string;
  stage: string;
  value: number;
  isAssessed: boolean;
  winability: number | null;
  pipelineHealth: string;
  posture: RiskPostureKey | 'UNASSESSED';
  postureLabel: string;
  postureRationale: string;
  activeRisks: DashboardRiskRow[];
  targetUrl: string;
}

interface PostureBucket {
  key: RiskPostureKey;
  label: 'Critical' | 'High' | 'Moderate' | 'Low';
  description: string;
  deals: EnrichedOpportunityRiskProfile[];
  dealCount: number;
  pctOfAssessed: number;
  totalValue: number;
  activeRiskCount: number;
  barClass: string;
  textClass: string;
}

interface CategoryBucket {
  key: string;
  category: string;
  risks: Array<{
    risk: DashboardRiskRow;
    deal: EnrichedOpportunityRiskProfile;
  }>;
  riskCount: number;
  dealCount: number;
  deals: EnrichedOpportunityRiskProfile[];
  totalExposedValue: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  weightedScore: number;
}

type DrilldownSelection =
  | { type: 'POSTURE'; key: RiskPostureKey }
  | { type: 'CATEGORY'; key: string };

const POSTURE_META: Array<{
  key: RiskPostureKey;
  label: 'Critical' | 'High' | 'Moderate' | 'Low';
  description: string;
  barClass: string;
  textClass: string;
}> = [
  {
    key: 'CRITICAL',
    label: 'Critical',
    description: 'At least one unresolved critical risk, critical health, or severe winability block.',
    barClass: 'bg-red-700',
    textClass: 'text-red-600 dark:text-red-400'
  },
  {
    key: 'HIGH',
    label: 'High',
    description: 'High-severity exposure or At-Risk assessment posture requiring active mitigation.',
    barClass: 'bg-red-500',
    textClass: 'text-red-500 dark:text-red-400'
  },
  {
    key: 'MODERATE',
    label: 'Moderate',
    description: 'Medium-severity concerns or moderate pipeline health posture under monitoring.',
    barClass: 'bg-amber-500',
    textClass: 'text-amber-600 dark:text-amber-400'
  },
  {
    key: 'LOW',
    label: 'Low',
    description: 'Strong/Healthy assessment posture with zero unresolved critical, high, or medium risks.',
    barClass: 'bg-emerald-500',
    textClass: 'text-emerald-600 dark:text-emerald-400'
  }
];

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

function normalizeSeverity(raw?: string | null): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
  const s = String(raw || '').trim().toUpperCase();
  if (s === 'CRITICAL') return 'CRITICAL';
  if (s === 'HIGH') return 'HIGH';
  if (s === 'LOW') return 'LOW';
  return 'MEDIUM';
}

function severityRank(raw?: string | null): number {
  const s = normalizeSeverity(raw);
  if (s === 'CRITICAL') return 4;
  if (s === 'HIGH') return 3;
  if (s === 'MEDIUM') return 2;
  return 1;
}

function severityTextClass(raw?: string | null): string {
  const s = normalizeSeverity(raw);
  if (s === 'CRITICAL') return 'text-red-600 dark:text-red-400';
  if (s === 'HIGH') return 'text-red-500 dark:text-red-400';
  if (s === 'MEDIUM') return 'text-amber-600 dark:text-amber-400';
  return 'text-emerald-600 dark:text-emerald-400';
}

function normalizePostureFromExplicit(raw?: unknown): RiskPostureKey | null {
  const s = String(raw || '').trim().toUpperCase();
  if (s === 'CRITICAL') return 'CRITICAL';
  if (s === 'HIGH') return 'HIGH';
  if (s === 'MODERATE' || s === 'MEDIUM') return 'MODERATE';
  if (s === 'LOW') return 'LOW';
  return null;
}

function normalizeCategoryLabel(raw?: string | null): string {
  const cleaned = String(raw || '').trim();
  if (!cleaned) return 'General';
  return cleaned;
}

function formatHealthLabel(rawHealth: string): string {
  const u = rawHealth.toUpperCase();
  if (u === 'STRONG' || u === 'HEALTHY') return 'Strong';
  if (u === 'MODERATE') return 'Moderate';
  if (u === 'AT_RISK') return 'Weak';
  if (u === 'CRITICAL') return 'Critical';
  return 'Unassessed';
}

export const PipelineRiskIntelligenceSection: React.FC<PipelineRiskIntelligenceSectionProps> = ({
  scopedItems,
  riskRows,
  loading = false
}) => {
  const [drilldown, setDrilldown] = useState<DrilldownSelection | null>(null);

  useEffect(() => {
    if (!drilldown) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrilldown(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [drilldown]);

  const {
    assessedProfiles,
    unassessedCount,
    totalActiveRisksCount,
    postureBuckets,
    maxPostureDeals,
    categoryBuckets,
    maxCategoryRiskCount
  } = useMemo(() => {
    const profiles: EnrichedOpportunityRiskProfile[] = scopedItems.map((item) => {
      const assess = item.pipeline_opp?.latest_assessment;
      const isAssessed = Boolean(assess);
      const pid = item.pipeline_opp?.pipeline_id;
      const latestAssessId = assess?.assessment_id;
      const value = Math.max(0, Number(item.estimated_value || 0));
      const winability = isAssessed
        ? Math.max(0, Math.min(100, Math.round(Number(assess?.risk_adjusted_winability ?? 0))))
        : null;
      const rawHealth = String(assess?.pipeline_health || '').toUpperCase();

      const activeRisks = riskRows
        .filter((r) => {
          if (!pid || r.pipeline_id !== pid) return false;
          if (latestAssessId && r.assessment_id && r.assessment_id !== latestAssessId) return false;
          return r.risk_status === 'ACTIVE' || r.risk_status === 'MITIGATING';
        })
        .sort((a, b) => severityRank(b.severity) - severityRank(a.severity));

      let posture: RiskPostureKey | 'UNASSESSED' = 'UNASSESSED';
      let postureLabel = 'Pending Assessment';
      let postureRationale = 'Awaiting authoritative Pipeline Assessment.';

      if (isAssessed && assess) {
        const rawOut: any = assess.raw_reasoning_output || {};
        const explicitPosture =
          normalizePostureFromExplicit(rawOut.pipeline_risk_posture) ||
          normalizePostureFromExplicit(rawOut.overall_risk_posture) ||
          normalizePostureFromExplicit(rawOut.risk_posture);

        const critCount = activeRisks.filter((r) => normalizeSeverity(r.severity) === 'CRITICAL').length;
        const highCount = activeRisks.filter((r) => normalizeSeverity(r.severity) === 'HIGH').length;
        const medCount = activeRisks.filter((r) => normalizeSeverity(r.severity) === 'MEDIUM').length;

        if (explicitPosture) {
          posture = explicitPosture;
        } else if (critCount > 0 || rawHealth === 'CRITICAL' || (winability !== null && winability < 35)) {
          posture = 'CRITICAL';
        } else if (highCount > 0 || rawHealth === 'AT_RISK' || (winability !== null && winability < 55)) {
          posture = 'HIGH';
        } else if (medCount > 0 || rawHealth === 'MODERATE' || (winability !== null && winability < 75)) {
          posture = 'MODERATE';
        } else {
          posture = 'LOW';
        }

        const metaMatch = POSTURE_META.find((m) => m.key === posture);
        postureLabel = metaMatch ? metaMatch.label : 'Moderate';

        const parts: string[] = [];
        if (critCount > 0) parts.push(`${critCount} Critical risk${critCount === 1 ? '' : 's'}`);
        else if (highCount > 0) parts.push(`${highCount} High risk${highCount === 1 ? '' : 's'}`);
        else if (medCount > 0) parts.push(`${medCount} Medium risk${medCount === 1 ? '' : 's'}`);
        else if (activeRisks.length > 0) parts.push(`${activeRisks.length} Low risk${activeRisks.length === 1 ? '' : 's'}`);
        else parts.push('0 open formal risks');

        parts.push(`Health: ${formatHealthLabel(rawHealth)}`);
        if (winability !== null) parts.push(`Winability: ${winability}%`);
        postureRationale = parts.join(' · ');
      }

      const targetUrl = `/product/revos/pipeline?opportunityId=${encodeURIComponent(item.id)}${
        item.lead_id ? `&leadId=${encodeURIComponent(item.lead_id)}` : ''
      }&source=pipeline_dashboard`;

      return {
        item,
        id: item.id,
        opportunityName: item.opportunity_name || 'Untitled Opportunity',
        customer: item.company_name || '—',
        stage: item.pipeline_stage || 'Pipeline',
        value,
        isAssessed,
        winability,
        pipelineHealth: formatHealthLabel(rawHealth),
        posture,
        postureLabel,
        postureRationale,
        activeRisks,
        targetUrl
      };
    });

    const assessed = profiles.filter((p) => p.isAssessed && p.posture !== 'UNASSESSED');
    const unassessed = profiles.length - assessed.length;
    const assessedTotal = assessed.length;

    const postureBucketsList: PostureBucket[] = POSTURE_META.map((meta) => {
      const matchingDeals = assessed
        .filter((p) => p.posture === meta.key)
        .sort((a, b) => b.value - a.value);
      return {
        key: meta.key,
        label: meta.label,
        description: meta.description,
        deals: matchingDeals,
        dealCount: matchingDeals.length,
        pctOfAssessed: assessedTotal > 0 ? Math.round((matchingDeals.length / assessedTotal) * 100) : 0,
        totalValue: matchingDeals.reduce((sum, d) => sum + d.value, 0),
        activeRiskCount: matchingDeals.reduce((sum, d) => sum + d.activeRisks.length, 0),
        barClass: meta.barClass,
        textClass: meta.textClass
      };
    });

    const maxPosture = postureBucketsList.reduce((m, b) => Math.max(m, b.dealCount), 0) || 1;

    // Group active formal risks by authoritative risk_category from pipeline_risks
    const catMap = new Map<
      string,
      {
        category: string;
        risks: Array<{ risk: DashboardRiskRow; deal: EnrichedOpportunityRiskProfile }>;
        dealMap: Map<string, EnrichedOpportunityRiskProfile>;
        criticalCount: number;
        highCount: number;
        mediumCount: number;
        lowCount: number;
      }
    >();

    let activeRisksTotal = 0;

    profiles.forEach((dealProfile) => {
      dealProfile.activeRisks.forEach((risk) => {
        activeRisksTotal += 1;
        const label = normalizeCategoryLabel(risk.risk_category);
        const key = label.toLowerCase();
        const existing = catMap.get(key) || {
          category: label,
          risks: [],
          dealMap: new Map<string, EnrichedOpportunityRiskProfile>(),
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0
        };

        existing.risks.push({ risk, deal: dealProfile });
        existing.dealMap.set(dealProfile.id, dealProfile);

        const sev = normalizeSeverity(risk.severity);
        if (sev === 'CRITICAL') existing.criticalCount += 1;
        else if (sev === 'HIGH') existing.highCount += 1;
        else if (sev === 'MEDIUM') existing.mediumCount += 1;
        else existing.lowCount += 1;

        catMap.set(key, existing);
      });
    });

    const categoryList: CategoryBucket[] = Array.from(catMap.entries())
      .map(([key, bucket]) => {
        const sortedRisks = [...bucket.risks].sort((a, b) => {
          const sevDiff = severityRank(b.risk.severity) - severityRank(a.risk.severity);
          if (sevDiff !== 0) return sevDiff;
          return b.deal.value - a.deal.value;
        });
        const uniqueDeals = Array.from(bucket.dealMap.values()).sort((a, b) => b.value - a.value);
        const totalExposedValue = uniqueDeals.reduce((sum, d) => sum + d.value, 0);
        const weightedScore =
          bucket.criticalCount * 4 +
          bucket.highCount * 3 +
          bucket.mediumCount * 2 +
          bucket.lowCount * 1;

        return {
          key,
          category: bucket.category,
          risks: sortedRisks,
          riskCount: sortedRisks.length,
          dealCount: uniqueDeals.length,
          deals: uniqueDeals,
          totalExposedValue,
          criticalCount: bucket.criticalCount,
          highCount: bucket.highCount,
          mediumCount: bucket.mediumCount,
          lowCount: bucket.lowCount,
          weightedScore
        };
      })
      .sort((a, b) => {
        if (b.riskCount !== a.riskCount) return b.riskCount - a.riskCount;
        if (b.weightedScore !== a.weightedScore) return b.weightedScore - a.weightedScore;
        return b.totalExposedValue - a.totalExposedValue;
      });

    const maxCatRisks = categoryList.reduce((m, c) => Math.max(m, c.riskCount), 0) || 1;

    return {
      assessedProfiles: assessed,
      unassessedCount: unassessed,
      totalActiveRisksCount: activeRisksTotal,
      postureBuckets: postureBucketsList,
      maxPostureDeals: maxPosture,
      categoryBuckets: categoryList,
      maxCategoryRiskCount: maxCatRisks
    };
  }, [scopedItems, riskRows]);

  const activePostureBucket =
    drilldown?.type === 'POSTURE'
      ? postureBuckets.find((b) => b.key === drilldown.key) || null
      : null;

  const activeCategoryBucket =
    drilldown?.type === 'CATEGORY'
      ? categoryBuckets.find((c) => c.key === drilldown.key) || null
      : null;

  if (loading) {
    return (
      <div className="lg:col-span-7 p-5 rounded-2xl border border-border bg-bg-surface shadow-sm flex flex-col justify-between animate-pulse space-y-4">
        <div className="border-b border-border/70 pb-3 flex items-center justify-between gap-2">
          <div className="space-y-1.5">
            <div className="h-4 w-48 bg-bg-primary rounded" />
            <div className="h-3 w-72 max-w-full bg-bg-primary rounded" />
          </div>
          <div className="h-3.5 w-32 bg-bg-primary rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">
          <div className="h-52 bg-bg-primary/60 rounded-xl" />
          <div className="h-52 bg-bg-primary/60 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-7 p-5 rounded-2xl border border-border bg-bg-surface shadow-sm flex flex-col justify-between">
      {/* Header */}
      <div className="border-b border-border/70 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-accent shrink-0" />
            <span>Pipeline Risk Intelligence</span>
          </h3>
          <p className="text-[10px] text-text-secondary mt-0.5">
            Authoritative overall risk posture across opportunities and individual risk category exposure
          </p>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-text-secondary shrink-0 tabular-nums">
          <span>
            <strong className="text-text-primary">{assessedProfiles.length}</strong> assessed
          </span>
          <span aria-hidden="true">·</span>
          <span>
            <strong className="text-text-primary">{totalActiveRisksCount}</strong> formal risks
          </span>
          {unassessedCount > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span>{unassessedCount} pending</span>
            </>
          )}
        </div>
      </div>

      {/* Empty Scope State */}
      {scopedItems.length === 0 ? (
        <div className="py-10 text-center space-y-1.5">
          <ShieldAlert className="h-6 w-6 text-text-secondary/50 mx-auto" />
          <div className="text-xs font-bold text-text-primary">No Opportunities in Scope</div>
          <p className="text-[11px] text-text-secondary">
            Adjust dashboard scope or portfolio filters to inspect pipeline risk exposure.
          </p>
        </div>
      ) : assessedProfiles.length === 0 ? (
        <div className="py-10 text-center space-y-1.5">
          <ShieldAlert className="h-6 w-6 text-text-secondary/50 mx-auto" />
          <div className="text-xs font-bold text-text-primary">No Assessed Opportunities Yet</div>
          <p className="text-[11px] text-text-secondary max-w-md mx-auto">
            Run a Pipeline Assessment on opportunities in scope to populate authoritative risk posture and formal risk categories.
          </p>
        </div>
      ) : (
        /* Two Side-by-Side Visual Components */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">
          {/* Component A: Risk Distribution (Overall Opportunity Risk Posture) */}
          <div className="space-y-3 min-w-0 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-text-primary">Risk Distribution</div>
                  <div className="text-[10px] text-text-secondary truncate">
                    Opportunities by overall risk posture
                  </div>
                </div>
                <span className="text-[10px] font-mono text-text-secondary shrink-0 tabular-nums">
                  {assessedProfiles.length} deal{assessedProfiles.length === 1 ? '' : 's'}
                </span>
              </div>

              {/* Segmented Portfolio Posture Bar */}
              <div
                className="h-2.5 w-full rounded-full bg-bg-primary overflow-hidden flex"
                role="group"
                aria-label="Overall risk posture segmented bar"
              >
                {postureBuckets.map((bucket) => {
                  if (bucket.dealCount === 0) return null;
                  return (
                    <button
                      key={bucket.key}
                      type="button"
                      onClick={() => setDrilldown({ type: 'POSTURE', key: bucket.key })}
                      title={`${bucket.label} Risk Posture: ${bucket.dealCount} opportunities (${bucket.pctOfAssessed}%) — Click to inspect`}
                      className={`${bucket.barClass} h-full transition-opacity hover:opacity-85 cursor-pointer focus-visible:outline-none`}
                      style={{ width: `${Math.max(3, bucket.pctOfAssessed)}%` }}
                    />
                  );
                })}
              </div>

              {/* Horizontal Posture Bars */}
              <div className="space-y-2">
                {postureBuckets.map((bucket) => {
                  const widthPct =
                    bucket.dealCount > 0
                      ? Math.max(6, Math.round((bucket.dealCount / maxPostureDeals) * 100))
                      : 0;
                  const isSelected =
                    drilldown?.type === 'POSTURE' && drilldown.key === bucket.key;

                  return (
                    <button
                      key={bucket.key}
                      type="button"
                      onClick={() => setDrilldown({ type: 'POSTURE', key: bucket.key })}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                        isSelected
                          ? 'border-accent bg-accent/10'
                          : 'border-transparent hover:border-border hover:bg-bg-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className={`font-semibold ${bucket.textClass}`}>
                          {bucket.label}
                        </span>
                        <span className="font-mono text-[11px] text-text-secondary tabular-nums shrink-0">
                          <strong className="text-text-primary">{bucket.dealCount}</strong>{' '}
                          {bucket.dealCount === 1 ? 'deal' : 'deals'}
                          <span aria-hidden="true"> · </span>
                          {formatCompactCurrency(bucket.totalValue)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1.5 flex-1 bg-bg-primary rounded-full overflow-hidden">
                          {widthPct > 0 && (
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${bucket.barClass}`}
                              style={{ width: `${widthPct}%` }}
                            />
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-text-secondary tabular-nums w-8 text-right shrink-0">
                          {bucket.pctOfAssessed}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-[10px] text-text-secondary pt-1">
              Click any posture tier to inspect matching opportunities
            </div>
          </div>

          {/* Component B: Risk Category Distribution */}
          <div className="space-y-3 min-w-0 md:border-l md:border-border/60 md:pl-5 flex flex-col justify-between">
            <div className="space-y-3 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-text-primary">
                    Risk Category Distribution
                  </div>
                  <div className="text-[10px] text-text-secondary truncate">
                    Assessment formal risks by category & severity
                  </div>
                </div>
                <span className="text-[10px] font-mono text-text-secondary shrink-0 tabular-nums">
                  {categoryBuckets.length} {categoryBuckets.length === 1 ? 'category' : 'categories'}
                </span>
              </div>

              {categoryBuckets.length === 0 ? (
                <div className="py-8 px-3 rounded-xl bg-bg-primary/40 border border-border/60 text-center space-y-1">
                  <ShieldCheck className="h-5 w-5 text-emerald-500 mx-auto" />
                  <div className="text-[11px] font-bold text-text-primary">
                    No Active Formal Risks Flagged
                  </div>
                  <p className="text-[10px] text-text-secondary">
                    Assessed opportunities in this scope currently have zero open formal risks.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[240px] overflow-y-auto custom-scrollbar-vertical pr-1.5">
                  {categoryBuckets.map((cat) => {
                    const totalScalePct = Math.max(
                      8,
                      Math.round((cat.riskCount / maxCategoryRiskCount) * 100)
                    );
                    const isSelected =
                      drilldown?.type === 'CATEGORY' && drilldown.key === cat.key;
                    const critShare = (cat.criticalCount / cat.riskCount) * 100;
                    const highShare = (cat.highCount / cat.riskCount) * 100;
                    const medShare = (cat.mediumCount / cat.riskCount) * 100;
                    const lowShare = (cat.lowCount / cat.riskCount) * 100;

                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setDrilldown({ type: 'CATEGORY', key: cat.key })}
                        title={`${cat.category}: ${cat.riskCount} active risks across ${cat.dealCount} deals — Click to inspect`}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                          isSelected
                            ? 'border-accent bg-accent/10'
                            : 'border-transparent hover:border-border hover:bg-bg-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
                            {cat.category}
                          </span>
                          <span className="font-mono text-[11px] text-text-secondary tabular-nums shrink-0">
                            <strong className="text-text-primary">{cat.riskCount}</strong>{' '}
                            {cat.riskCount === 1 ? 'risk' : 'risks'}
                            <span aria-hidden="true"> · </span>
                            {cat.dealCount} {cat.dealCount === 1 ? 'deal' : 'deals'}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="h-1.5 flex-1 bg-bg-primary rounded-full overflow-hidden">
                            <div
                              className="h-full flex rounded-full overflow-hidden transition-all duration-300"
                              style={{ width: `${totalScalePct}%` }}
                            >
                              {critShare > 0 && (
                                <span
                                  className="bg-red-700 h-full inline-block"
                                  style={{ width: `${critShare}%` }}
                                />
                              )}
                              {highShare > 0 && (
                                <span
                                  className="bg-red-500 h-full inline-block"
                                  style={{ width: `${highShare}%` }}
                                />
                              )}
                              {medShare > 0 && (
                                <span
                                  className="bg-amber-500 h-full inline-block"
                                  style={{ width: `${medShare}%` }}
                                />
                              )}
                              {lowShare > 0 && (
                                <span
                                  className="bg-emerald-500 h-full inline-block"
                                  style={{ width: `${lowShare}%` }}
                                />
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-text-secondary tabular-nums shrink-0">
                            {cat.criticalCount > 0
                              ? `${cat.criticalCount}C`
                              : cat.highCount > 0
                                ? `${cat.highCount}H`
                                : cat.mediumCount > 0
                                  ? `${cat.mediumCount}M`
                                  : `${cat.lowCount}L`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {categoryBuckets.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] font-mono text-text-secondary pt-1">
                <span>Severity:</span>
                <span className="text-red-600 dark:text-red-400">Critical</span>
                <span aria-hidden="true">·</span>
                <span className="text-red-500 dark:text-red-400">High</span>
                <span aria-hidden="true">·</span>
                <span className="text-amber-600 dark:text-amber-400">Medium</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-600 dark:text-emerald-400">Low</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Centered Viewport Toolkit Modal (Matching Pipeline Assessment Heatmap Cell Behavior & Content-Fit Height) */}
      {typeof document !== 'undefined' &&
        drilldown &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-xs"
            onClick={(e) => {
              if (e.target === e.currentTarget) setDrilldown(null);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Pipeline Risk Exposure Toolkit"
              onClick={(e) => e.stopPropagation()}
              className="bg-bg-surface border border-border/80 rounded-2xl max-w-2xl w-full max-h-[85vh] p-6 shadow-2xl relative flex flex-col my-auto"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-border/60 pb-3.5 shrink-0 gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent">
                    {activePostureBucket
                      ? 'Overall Opportunity Risk Posture Toolkit'
                      : 'Risk Category Intelligence Toolkit'}
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-text-primary tracking-tight">
                    {activePostureBucket ? (
                      <span className={activePostureBucket.textClass}>
                        {activePostureBucket.label} Risk Posture
                      </span>
                    ) : (
                      <span>{activeCategoryBucket?.category || 'Risk Category'}</span>
                    )}
                  </h3>
                  <p className="text-xs text-text-secondary">
                    {activePostureBucket
                      ? activePostureBucket.description
                      : 'Associated opportunities and underlying formal risks produced by Pipeline Assessment.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setDrilldown(null)}
                  className="p-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-bg-primary transition-colors cursor-pointer shrink-0"
                  title="Close Toolkit"
                  aria-label="Close Toolkit"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Compact Metrics & Switcher Strip */}
              <div className="py-2.5 border-b border-border/60 flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono tabular-nums">
                  {activePostureBucket ? (
                    <>
                      <span>
                        <span className="text-text-secondary">Opportunities: </span>
                        <strong className="text-text-primary">{activePostureBucket.dealCount}</strong>
                      </span>
                      <span>
                        <span className="text-text-secondary">Value: </span>
                        <strong className="text-accent">
                          {formatCompactCurrency(activePostureBucket.totalValue)}
                        </strong>
                      </span>
                      <span>
                        <span className="text-text-secondary">Open Risks: </span>
                        <strong className="text-text-primary">
                          {activePostureBucket.activeRiskCount}
                        </strong>
                      </span>
                    </>
                  ) : activeCategoryBucket ? (
                    <>
                      <span>
                        <span className="text-text-secondary">Formal Risks: </span>
                        <strong className="text-text-primary">{activeCategoryBucket.riskCount}</strong>
                      </span>
                      <span>
                        <span className="text-text-secondary">Deals: </span>
                        <strong className="text-text-primary">{activeCategoryBucket.dealCount}</strong>
                      </span>
                      <span>
                        <span className="text-text-secondary">Exposed Value: </span>
                        <strong className="text-accent">
                          {formatCompactCurrency(activeCategoryBucket.totalExposedValue)}
                        </strong>
                      </span>
                    </>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  {drilldown.type === 'POSTURE'
                    ? postureBuckets.map((b) => (
                        <button
                          key={b.key}
                          type="button"
                          onClick={() => setDrilldown({ type: 'POSTURE', key: b.key })}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                            drilldown.key === b.key
                              ? 'bg-accent text-black font-bold'
                              : 'text-text-secondary hover:text-text-primary hover:bg-bg-primary'
                          }`}
                        >
                          {b.label} ({b.dealCount})
                        </button>
                      ))
                    : categoryBuckets.map((c) => (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => setDrilldown({ type: 'CATEGORY', key: c.key })}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                            drilldown.key === c.key
                              ? 'bg-accent text-black font-bold'
                              : 'text-text-secondary hover:text-text-primary hover:bg-bg-primary'
                          }`}
                        >
                          {c.category} ({c.riskCount})
                        </button>
                      ))}
                </div>
              </div>

              {/* Scrollable Content-Fit Body */}
              <div className="overflow-y-auto custom-scrollbar-vertical space-y-3 pr-1.5 mt-3.5 text-xs">
                {(() => {
                  const dealsToRender: Array<{
                    deal: EnrichedOpportunityRiskProfile;
                    risks: DashboardRiskRow[];
                  }> = activePostureBucket
                    ? activePostureBucket.deals.map((deal) => ({
                        deal,
                        risks: deal.activeRisks
                      }))
                    : activeCategoryBucket
                      ? activeCategoryBucket.deals.map((deal) => ({
                          deal,
                          risks: deal.activeRisks.filter(
                            (r) =>
                              normalizeCategoryLabel(r.risk_category).toLowerCase() ===
                              activeCategoryBucket.key
                          )
                        }))
                      : [];

                  if (dealsToRender.length === 0) {
                    return (
                      <div className="py-6 text-center space-y-1.5">
                        <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto" />
                        <div className="text-xs font-bold text-text-primary">
                          No Opportunities in This Selection
                        </div>
                        <p className="text-[11px] text-text-secondary">
                          Zero assessed opportunities match this filter within the active dashboard scope.
                        </p>
                      </div>
                    );
                  }

                  return dealsToRender.map(({ deal, risks }) => {
                    const postureColor =
                      POSTURE_META.find((m) => m.key === deal.posture)?.textClass ||
                      'text-text-primary';

                    return (
                      <div
                        key={deal.id}
                        className="rounded-xl border border-border/70 bg-bg-primary/45 p-3.5 space-y-2.5"
                      >
                        {/* Opportunity Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-text-primary truncate">
                              {deal.opportunityName}
                            </div>
                            <div className="text-[10px] font-mono text-text-secondary flex flex-wrap items-center gap-1.5 tabular-nums mt-0.5">
                              <span>{deal.customer}</span>
                              <span aria-hidden="true">·</span>
                              <span>{deal.stage}</span>
                              <span aria-hidden="true">·</span>
                              <strong className="text-text-primary">
                                {deal.value > 0 ? `$${deal.value.toLocaleString('en-US')}` : '—'}
                              </strong>
                              <span aria-hidden="true">·</span>
                              <span>
                                Winability:{' '}
                                <strong className="text-accent">
                                  {deal.winability !== null ? `${deal.winability}%` : '--'}
                                </strong>
                              </span>
                            </div>
                          </div>

                          <Link
                            to={deal.targetUrl}
                            onClick={() => setDrilldown(null)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border bg-bg-surface text-[11px] font-bold text-text-primary hover:border-accent hover:text-accent transition-colors whitespace-nowrap shrink-0"
                          >
                            <span>Open Assessment</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>

                        {/* Overall Opportunity Posture Line */}
                        <div className="pt-2 border-t border-border/50 flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="text-text-secondary font-medium">
                            Overall Risk Posture:
                          </span>
                          <strong className={`font-mono ${postureColor}`}>
                            {deal.postureLabel}
                          </strong>
                          <span className="text-text-secondary" aria-hidden="true">·</span>
                          <span className="font-mono text-text-secondary tabular-nums">
                            {deal.postureRationale}
                          </span>
                        </div>

                        {/* Underlying Formal Risks */}
                        {risks.length === 0 ? (
                          <div className="text-[11px] text-text-secondary">
                            No individual open risks logged in this view; posture reflects authoritative Pipeline Health and Winability thresholds.
                          </div>
                        ) : (
                          <div className="divide-y divide-border/50">
                            {risks.map((risk) => {
                              const sevLabel = normalizeSeverity(risk.severity);
                              return (
                                <div
                                  key={risk.risk_instance_id}
                                  className="py-2 first:pt-1 last:pb-0 space-y-1"
                                >
                                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                                    <span
                                      className={`font-bold inline-flex items-center gap-1 ${severityTextClass(
                                        risk.severity
                                      )}`}
                                    >
                                      <AlertTriangle className="h-3 w-3 shrink-0" />
                                      <span>{sevLabel} PRIORITY</span>
                                    </span>
                                    <span className="text-text-secondary" aria-hidden="true">·</span>
                                    <span className="text-text-primary font-semibold">
                                      {normalizeCategoryLabel(risk.risk_category)}
                                    </span>
                                    <span className="text-text-secondary" aria-hidden="true">·</span>
                                    <span className="text-text-secondary">{risk.risk_status}</span>
                                    {(risk.likelihood || risk.impact) && (
                                      <>
                                        <span className="text-text-secondary" aria-hidden="true">·</span>
                                        <span className="text-text-secondary">
                                          {risk.likelihood ? `Likelihood: ${risk.likelihood}` : ''}
                                          {risk.likelihood && risk.impact ? ' / ' : ''}
                                          {risk.impact ? `Impact: ${risk.impact}` : ''}
                                        </span>
                                      </>
                                    )}
                                  </div>

                                  {risk.risk_description && (
                                    <p className="text-[11px] text-text-primary leading-relaxed">
                                      {risk.risk_description}
                                    </p>
                                  )}

                                  {risk.mitigation_strategy && (
                                    <p className="text-[11px] text-text-secondary leading-relaxed">
                                      <strong className="text-text-primary">Mitigation: </strong>
                                      {risk.mitigation_strategy}
                                    </p>
                                  )}

                                  {risk.owner && (
                                    <div className="text-[10px] font-mono text-text-secondary flex items-center gap-1">
                                      <User className="h-3 w-3 shrink-0" />
                                      <span>Owner: {risk.owner}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Modal Footer */}
              <div className="pt-3.5 mt-3.5 border-t border-border/60 flex items-center justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setDrilldown(null)}
                  className="px-4 py-1.5 rounded-xl border border-border text-xs font-medium text-text-secondary hover:text-text-primary cursor-pointer"
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

export default PipelineRiskIntelligenceSection;
