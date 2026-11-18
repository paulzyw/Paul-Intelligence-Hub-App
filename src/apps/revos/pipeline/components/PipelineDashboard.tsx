import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Award,
  ShieldAlert,
  Briefcase,
  ArrowRight,
  RefreshCw,
  PieChart as PieChartIcon,
  Layers,
  Filter,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { PipelineCardItem } from './PipelineCard';
import {
  loadCanonicalPipelinePortfolio,
  resolveCanvasColumn,
  isPipelineItemClosed
} from '../services/pipelinePortfolioLoader';

type StageKey =
  | 'Initial Pipeline'
  | 'Proposal / Evaluation'
  | 'Negotiation / Commit'
  | 'Closed Won'
  | 'Closed Lost';

const STAGE_ORDER: Array<{ key: StageKey; shortLabel: string; colorClass: string }> = [
  { key: 'Initial Pipeline', shortLabel: 'Initial', colorClass: 'bg-accent' },
  { key: 'Proposal / Evaluation', shortLabel: 'Proposal', colorClass: 'bg-sky-400' },
  { key: 'Negotiation / Commit', shortLabel: 'Negotiation', colorClass: 'bg-amber-400' },
  { key: 'Closed Won', shortLabel: 'Won', colorClass: 'bg-emerald-400' },
  { key: 'Closed Lost', shortLabel: 'Lost', colorClass: 'bg-red-400' }
];

function isClosedWonItem(item: PipelineCardItem): boolean {
  return (
    item.pipeline_stage === 'Closed Won' || item.pipeline_opp?.lifecycle_status === 'CLOSED_WON'
  );
}

function isClosedLostItem(item: PipelineCardItem): boolean {
  return (
    item.pipeline_stage === 'Closed Lost' || item.pipeline_opp?.lifecycle_status === 'CLOSED_LOST'
  );
}

function resolveStage(item: PipelineCardItem): StageKey {
  if (isClosedWonItem(item)) return 'Closed Won';
  if (isClosedLostItem(item)) return 'Closed Lost';
  const col = resolveCanvasColumn(item);
  if (col === 'Proposal/Evaluation') return 'Proposal / Evaluation';
  if (col === 'Negotiation/Commit') return 'Negotiation / Commit';
  return 'Initial Pipeline';
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

const StageTooltip: React.FC<{
  active?: boolean;
  payload?: Array<{ payload: { stage: string; count: number; totalValue: number; weightedValue: number } }>;
}> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-bg-surface px-3.5 py-2.5 shadow-lg text-xs space-y-1">
      <div className="font-bold text-text-primary">{row.stage}</div>
      <div className="font-mono text-text-secondary">
        Deals: <strong className="text-text-primary">{row.count}</strong>
      </div>
      <div className="font-mono text-text-secondary">
        Total Value: <strong className="text-accent">${row.totalValue.toLocaleString('en-US')}</strong>
      </div>
      <div className="font-mono text-text-secondary">
        Risk-Adj Forecast: <strong className="text-emerald-400">${Math.round(row.weightedValue).toLocaleString('en-US')}</strong>
      </div>
    </div>
  );
};

export const PipelineDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PipelineCardItem[]>([]);
  const [riskRows, setRiskRows] = useState<
    Array<{ risk_instance_id: string; pipeline_id: string; assessment_id: string; severity: string; risk_status: string }>
  >([]);
  const [actionRows, setActionRows] = useState<
    Array<{ action_id: string; pipeline_id: string; action_status: string }>
  >([]);
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'ACTIVE' | 'CLOSED'>('ALL');

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [mergedItems, risksRes, actionsRes] = await Promise.all([
        loadCanonicalPipelinePortfolio(),
        supabase
          .from('pipeline_risks')
          .select('risk_instance_id, pipeline_id, assessment_id, severity, risk_status'),
        supabase.from('pipeline_actions').select('action_id, pipeline_id, action_status')
      ]);

      setItems(mergedItems);
      setRiskRows((risksRes.data || []) as any[]);
      setActionRows((actionsRes.data || []) as any[]);
    } catch (err) {
      console.error('Error loading Pipeline Dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const scopedItems = useMemo(() => {
    if (scopeFilter === 'ACTIVE') {
      return items.filter((i) => !isPipelineItemClosed(i));
    }
    if (scopeFilter === 'CLOSED') {
      return items.filter((i) => isPipelineItemClosed(i));
    }
    return items;
  }, [items, scopeFilter]);

  const { activeRisksCount, criticalRisksCount, openActionsCount } = useMemo(() => {
    const scopedPipeIds = new Set<string>();
    const latestAssessmentByPipe = new Map<string, string>();
    scopedItems.forEach((i) => {
      const pid = i.pipeline_opp?.pipeline_id;
      if (pid) {
        scopedPipeIds.add(pid);
        if (i.pipeline_opp?.latest_assessment?.assessment_id) {
          latestAssessmentByPipe.set(pid, i.pipeline_opp.latest_assessment.assessment_id);
        }
      }
    });

    const activeRisks = riskRows.filter((r) => {
      if (!scopedPipeIds.has(r.pipeline_id)) return false;
      const latestAssessId = latestAssessmentByPipe.get(r.pipeline_id);
      if (latestAssessId && r.assessment_id && r.assessment_id !== latestAssessId) return false;
      return r.risk_status === 'ACTIVE' || r.risk_status === 'MITIGATING';
    });

    const openActions = actionRows.filter(
      (a) =>
        scopedPipeIds.has(a.pipeline_id) &&
        a.action_status !== 'COMPLETED' &&
        a.action_status !== 'CANCELLED'
    );

    return {
      activeRisksCount: activeRisks.length,
      criticalRisksCount: activeRisks.filter(
        (r) => r.severity === 'CRITICAL' || r.severity === 'HIGH'
      ).length,
      openActionsCount: openActions.length
    };
  }, [scopedItems, riskRows, actionRows]);

  const kpis = useMemo(() => {
    const activeDeals = items.filter((i) => !isPipelineItemClosed(i));
    const closedWon = items.filter((i) => isClosedWonItem(i));
    const closedLost = items.filter((i) => isClosedLostItem(i));

    const activeValue = activeDeals.reduce((sum, i) => sum + (i.estimated_value || 0), 0);
    const closedWonValue = closedWon.reduce((sum, i) => sum + (i.estimated_value || 0), 0);

    const assessedItems = scopedItems.filter((i) => Boolean(i.pipeline_opp?.latest_assessment));
    const avgBaseWin =
      assessedItems.length > 0
        ? Math.round(
            assessedItems.reduce(
              (sum, i) => sum + (i.pipeline_opp?.latest_assessment?.base_winability ?? 0),
              0
            ) / assessedItems.length
          )
        : 0;
    const avgRiskAdjWin =
      assessedItems.length > 0
        ? Math.round(
            assessedItems.reduce(
              (sum, i) => sum + (i.pipeline_opp?.latest_assessment?.risk_adjusted_winability ?? 0),
              0
            ) / assessedItems.length
          )
        : 0;

    // Risk-adjusted expected revenue across active deals
    const riskAdjustedForecast = activeDeals.reduce((sum, i) => {
      const winPct = i.pipeline_opp?.latest_assessment?.risk_adjusted_winability ?? 50;
      return sum + (i.estimated_value || 0) * (winPct / 100);
    }, 0);

    const closedTotal = closedWon.length + closedLost.length;
    const winRate = closedTotal > 0 ? Math.round((closedWon.length / closedTotal) * 100) : null;

    return {
      totalDeals: items.length,
      activeCount: activeDeals.length,
      activeValue,
      riskAdjustedForecast: Math.round(riskAdjustedForecast),
      assessedCount: assessedItems.length,
      avgBaseWin,
      avgRiskAdjWin,
      closedWonCount: closedWon.length,
      closedWonValue,
      closedTotal,
      winRate
    };
  }, [items, scopedItems]);

  const stageChartData = useMemo(() => {
    return STAGE_ORDER.map((st) => {
      const matches = scopedItems.filter((i) => resolveStage(i) === st.key);
      const totalValue = matches.reduce((s, i) => s + (i.estimated_value || 0), 0);
      const weightedValue = matches.reduce((s, i) => {
        if (st.key === 'Closed Won') return s + (i.estimated_value || 0);
        if (st.key === 'Closed Lost') return s;
        const pct = i.pipeline_opp?.latest_assessment?.risk_adjusted_winability ?? 50;
        return s + (i.estimated_value || 0) * (pct / 100);
      }, 0);

      return {
        stage: st.key,
        shortLabel: st.shortLabel,
        count: matches.length,
        totalValue,
        weightedValue: Math.round(weightedValue)
      };
    });
  }, [scopedItems]);

  const healthBreakdown = useMemo(() => {
    const buckets: Array<{
      key: string;
      label: string;
      count: number;
      value: number;
      barClass: string;
      textClass: string;
    }> = [
      { key: 'STRONG', label: 'Strong', count: 0, value: 0, barClass: 'bg-emerald-400', textClass: 'text-emerald-400' },
      { key: 'HEALTHY', label: 'Healthy', count: 0, value: 0, barClass: 'bg-sky-400', textClass: 'text-sky-400' },
      { key: 'MODERATE', label: 'Moderate', count: 0, value: 0, barClass: 'bg-amber-400', textClass: 'text-amber-400' },
      { key: 'AT_RISK', label: 'At Risk / Critical', count: 0, value: 0, barClass: 'bg-red-400', textClass: 'text-red-400' },
      { key: 'UNASSESSED', label: 'Pending PADF Assessment', count: 0, value: 0, barClass: 'bg-border', textClass: 'text-text-secondary' }
    ];

    scopedItems.forEach((item) => {
      const h = item.pipeline_opp?.latest_assessment?.pipeline_health;
      let targetKey = 'UNASSESSED';
      if (h === 'STRONG' || h === 'HEALTHY' || h === 'MODERATE') targetKey = h;
      else if (h === 'AT_RISK' || h === 'CRITICAL') targetKey = 'AT_RISK';

      const b = buckets.find((x) => x.key === targetKey);
      if (b) {
        b.count += 1;
        b.value += item.estimated_value || 0;
      }
    });

    return buckets;
  }, [scopedItems]);

  const motionBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; count: number; value: number }>();
    scopedItems.forEach((item) => {
      const key = item.revenue_motion || 'Digital Solution Selling';
      const existing = map.get(key) || { name: key, count: 0, value: 0 };
      existing.count += 1;
      existing.value += item.estimated_value || 0;
      map.set(key, existing);
    });
    const list = Array.from(map.values()).sort((a, b) => b.value - a.value);
    const maxVal = list.reduce((m, r) => Math.max(m, r.value), 0) || 1;
    return list.map((r) => ({ ...r, pct: Math.round((r.value / maxVal) * 100) }));
  }, [scopedItems]);

  const priorityOpportunities = useMemo(() => {
    return [...scopedItems]
      .sort((a, b) => {
        const valDiff = (b.estimated_value || 0) - (a.estimated_value || 0);
        if (valDiff !== 0) return valDiff;
        const winA = a.pipeline_opp?.latest_assessment?.risk_adjusted_winability ?? 0;
        const winB = b.pipeline_opp?.latest_assessment?.risk_adjusted_winability ?? 0;
        return winB - winA;
      })
      .slice(0, 6);
  }, [scopedItems]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-secondary space-y-2">
        <RefreshCw className="h-6 w-6 animate-spin text-accent" />
        <span className="text-xs font-mono">Loading Pipeline Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Header Card (matching LeadDashboard) */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 p-5 rounded-2xl bg-bg-surface/50 border border-border shadow-sm">
        <div className="flex-1 min-w-0">
          <span className="text-[9px] font-mono font-black text-text-secondary uppercase tracking-widest">
            Account-Wide Pipeline Diagnostics
          </span>
          <h2 className="text-lg font-black text-text-primary uppercase tracking-wide mt-0.5 truncate">
            Pipeline Portfolio Executive Summary
          </h2>
          <p className="text-xs text-text-secondary mt-1 max-w-2xl leading-relaxed">
            Real-time portfolio valuation, PADF health distribution, risk-adjusted winability, and active strategic risks across your pipeline.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-bg-surface border border-border rounded-xl px-3 py-2 shadow-sm">
            <Filter className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="text-[10px] font-mono font-bold text-text-secondary uppercase whitespace-nowrap">
              Scope:
            </span>
            <select
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value as 'ALL' | 'ACTIVE' | 'CLOSED')}
              className="bg-transparent text-text-primary font-sans text-xs font-bold focus:outline-none cursor-pointer pr-1"
            >
              <option value="ALL" className="bg-bg-surface text-text-primary font-medium">
                All Deals ({items.length})
              </option>
              <option value="ACTIVE" className="bg-bg-surface text-text-primary font-medium">
                Active Pipeline ({kpis.activeCount})
              </option>
              <option value="CLOSED" className="bg-bg-surface text-text-primary font-medium">
                Closed Outcomes ({kpis.closedTotal})
              </option>
            </select>
          </div>

          <button
            type="button"
            onClick={loadDashboardData}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-bg-surface border border-border rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary hover:border-accent/50 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Executive KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-border bg-bg-surface flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-wider">
              Active Pipeline Value
            </span>
            <DollarSign className="h-4 w-4 text-accent" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight font-mono tabular-nums mt-1">
            {formatCompactCurrency(kpis.activeValue)}
          </div>
          <div className="mt-2 text-[10px] font-mono text-text-secondary">
            Across {kpis.activeCount} active deal{kpis.activeCount === 1 ? '' : 's'}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-bg-surface flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-wider">
              Risk-Adj Forecast
            </span>
            <Briefcase className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight font-mono tabular-nums mt-1">
            {formatCompactCurrency(kpis.riskAdjustedForecast)}
          </div>
          <div className="mt-2 text-[10px] font-mono text-text-secondary">
            {kpis.activeValue > 0
              ? `${Math.round((kpis.riskAdjustedForecast / kpis.activeValue) * 100)}% of active gross value`
              : 'No active value recorded'}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-bg-surface flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-wider">
              Avg Risk-Adj Winability
            </span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight font-mono tabular-nums mt-1">
            {kpis.assessedCount > 0 ? `${kpis.avgRiskAdjWin}%` : '--'}
          </div>
          <div className="mt-2 text-[10px] font-mono text-text-secondary">
            {kpis.assessedCount > 0
              ? `Base Avg: ${kpis.avgBaseWin}% (${kpis.assessedCount} assessed)`
              : 'Run PADF assessment to score'}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-bg-surface flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-wider">
              Closed Won Revenue
            </span>
            <Award className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight font-mono tabular-nums mt-1">
            {formatCompactCurrency(kpis.closedWonValue)}
          </div>
          <div className="mt-2 text-[10px] font-mono text-text-secondary">
            {kpis.winRate !== null
              ? `${kpis.winRate}% win rate (${kpis.closedWonCount}/${kpis.closedTotal} closed)`
              : `${kpis.closedWonCount} closed won deals`}
          </div>
        </div>
      </div>

      {/* Empty State if zero portfolio records */}
      {items.length === 0 ? (
        <div className="p-10 text-center bg-bg-surface border border-border rounded-2xl space-y-3">
          <PieChartIcon className="h-9 w-9 mx-auto text-text-secondary/50" />
          <h3 className="text-sm font-bold text-text-primary">No Pipeline Opportunities Recorded</h3>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            Promote qualified SQL opportunities in Lead Canvas to unlock pipeline valuation analytics, PADF scoring breakdowns, and closeability forecasting.
          </p>
          <Link
            to="/product/revos/leads"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-black rounded-xl text-xs font-bold hover:bg-accent-hover transition-colors"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Open Lead Canvas</span>
          </Link>
        </div>
      ) : (
        <>
          {/* Charts Row: Stage Valuation Bar Chart + PADF Health & Risk Posture */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Stage Distribution & Valuation */}
            <div className="lg:col-span-7 p-5 rounded-2xl border border-border bg-bg-surface shadow-sm flex flex-col justify-between">
              <div className="border-b border-border/70 pb-3 mb-4 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <PieChartIcon className="h-3.5 w-3.5 text-accent" />
                    Stage Valuation &amp; Risk-Adjusted Forecast
                  </h3>
                  <p className="text-[10px] text-text-secondary mt-0.5">
                    Gross deal value vs. risk-adjusted expected revenue across pipeline stages
                  </p>
                </div>
                <span className="text-[10px] font-mono text-text-secondary">
                  {scopedItems.length} deal{scopedItems.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stageChartData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                    <XAxis
                      dataKey="shortLabel"
                      tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => formatCompactCurrency(Number(v))}
                      tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                      axisLine={false}
                      tickLine={false}
                      width={64}
                    />
                    <Tooltip content={<StageTooltip />} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
                    <Bar dataKey="totalValue" name="Gross Value" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="weightedValue" name="Risk-Adj Forecast" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-3 mt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1.5 text-text-secondary">
                    <span className="h-2.5 w-2.5 rounded-sm bg-sky-400" />
                    Gross Pipeline Value
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-text-secondary">
                    <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                    Risk-Adjusted Forecast
                  </span>
                </div>
                <span className="text-text-secondary">
                  Won: <strong className="text-emerald-400">{kpis.closedWonCount}</strong>
                </span>
              </div>
            </div>

            {/* PADF Health Breakdown & Risk Execution Posture */}
            <div className="lg:col-span-5 p-5 rounded-2xl border border-border bg-bg-surface shadow-sm flex flex-col justify-between space-y-5">
              <div>
                <div className="border-b border-border/70 pb-3 mb-4">
                  <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 text-accent" />
                    PADF Health &amp; Governance Posture
                  </h3>
                  <p className="text-[10px] text-text-secondary mt-0.5">
                    Portfolio health classification based on latest deterministic PADF assessments
                  </p>
                </div>

                <div className="space-y-3">
                  {healthBreakdown.map((b) => {
                    const pct =
                      scopedItems.length > 0 ? Math.round((b.count / scopedItems.length) * 100) : 0;
                    return (
                      <div key={b.key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className={`font-bold ${b.textClass}`}>{b.label}</span>
                          <span className="text-text-secondary tabular-nums">
                            <strong className="text-text-primary">{b.count}</strong> ({pct}%) ·{' '}
                            {formatCompactCurrency(b.value)}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-bg-primary rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${b.barClass}`}
                            style={{ width: `${pct > 0 ? Math.max(4, pct) : 0}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/60">
                <div className="p-3 rounded-xl bg-bg-primary/60 border border-border/70">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-secondary uppercase">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    <span>Active Risks</span>
                  </div>
                  <div className="text-lg font-black font-mono tabular-nums text-text-primary mt-1">
                    {activeRisksCount}
                  </div>
                  <div className="text-[10px] font-mono text-amber-400">
                    {criticalRisksCount} high / critical
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-bg-primary/60 border border-border/70">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-secondary uppercase">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Open Playbook Actions</span>
                  </div>
                  <div className="text-lg font-black font-mono tabular-nums text-text-primary mt-1">
                    {openActionsCount}
                  </div>
                  <div className="text-[10px] font-mono text-text-secondary">
                    Across TOWS strategies
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Revenue Motion Exposure & Top Priority Opportunities */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Revenue Motion Valuation Exposure */}
            <div className="lg:col-span-5 p-5 rounded-2xl border border-border bg-bg-surface shadow-sm flex flex-col justify-between">
              <div className="border-b border-border/70 pb-3 mb-4">
                <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-accent" />
                  Revenue Motion Exposure
                </h3>
                <p className="text-[10px] text-text-secondary mt-0.5">
                  Pipeline concentration by commercial selling motion
                </p>
              </div>

              <div className="space-y-3.5 flex-1">
                {motionBreakdown.map((m) => (
                  <div key={m.name} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-text-primary truncate">{m.name}</span>
                      <span className="font-mono text-[11px] text-text-secondary shrink-0 tabular-nums">
                        {m.count} deal{m.count === 1 ? '' : 's'} ·{' '}
                        <strong className="text-text-primary">{formatCompactCurrency(m.value)}</strong>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-bg-primary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(4, m.pct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Opportunities Leaderboard */}
            <div className="lg:col-span-7 p-5 rounded-2xl border border-border bg-bg-surface shadow-sm flex flex-col">
              <div className="border-b border-border/70 pb-3 mb-4 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-accent" />
                    Top Pipeline Opportunities
                  </h3>
                  <p className="text-[10px] text-text-secondary mt-0.5">
                    Highest-value opportunities in scope — select to open assessment workspace
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 overflow-y-auto max-h-[300px] pr-1">
                {priorityOpportunities.map((item, idx) => {
                  const assess = item.pipeline_opp?.latest_assessment;
                  const stage = item.pipeline_stage || resolveStage(item);
                  const targetUrl = `/product/revos/pipeline?opportunityId=${encodeURIComponent(
                    item.id
                  )}${item.lead_id ? `&leadId=${encodeURIComponent(item.lead_id)}` : ''}&source=pipeline_dashboard`;

                  return (
                    <Link
                      key={item.id}
                      to={targetUrl}
                      className="p-3 rounded-xl border border-border bg-bg-primary/40 hover:bg-bg-primary/80 hover:border-accent/50 transition-all flex items-center justify-between gap-3 text-xs group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-accent/10 border border-accent/20 text-accent font-mono text-[10px] font-black shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-text-primary group-hover:text-accent transition-colors truncate">
                            {item.opportunity_name}
                          </div>
                          <div className="text-[10px] text-text-secondary truncate font-mono">
                            {item.company_name} · {stage} ·{' '}
                            <strong className="text-text-primary">
                              {item.estimated_value > 0
                                ? `$${item.estimated_value.toLocaleString('en-US')}`
                                : '—'}
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right font-mono">
                          <div className="text-xs font-black text-accent">
                            {assess ? `${assess.risk_adjusted_winability}%` : '--'}
                          </div>
                          <div className="text-[9px] text-text-secondary uppercase">
                            {assess?.pipeline_health || 'Unassessed'}
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-text-secondary group-hover:text-accent transition-colors" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PipelineDashboard;
