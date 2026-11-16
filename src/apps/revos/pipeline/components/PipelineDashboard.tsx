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
import { PipelineOpportunity, PipelineAssessment } from '../../types/pipeline';
import { PipelineDataService } from '../services/PipelineDataService';

interface DashboardPortfolioItem {
  id: string;
  lead_id?: string;
  company_name: string;
  opportunity_name: string;
  industry: string;
  revenue_motion: string;
  estimated_value: number;
  pipeline_opp?: PipelineOpportunity & { latest_assessment?: PipelineAssessment };
}

type StageKey =
  | 'Active Assessment'
  | 'Discovery & Solutioning'
  | 'Proposal & Negotiation'
  | 'Closed Won'
  | 'Closed Lost';

const STAGE_ORDER: Array<{ key: StageKey; shortLabel: string; colorClass: string }> = [
  { key: 'Active Assessment', shortLabel: 'Active', colorClass: 'bg-accent' },
  { key: 'Discovery & Solutioning', shortLabel: 'Discovery', colorClass: 'bg-sky-400' },
  { key: 'Proposal & Negotiation', shortLabel: 'Proposal', colorClass: 'bg-amber-400' },
  { key: 'Closed Won', shortLabel: 'Won', colorClass: 'bg-emerald-400' },
  { key: 'Closed Lost', shortLabel: 'Lost', colorClass: 'bg-red-400' }
];

function resolveStage(item: DashboardPortfolioItem): StageKey {
  const opp = item.pipeline_opp;
  if (!opp) return 'Active Assessment';
  if (opp.lifecycle_status === 'CLOSED_WON' || opp.pipeline_stage === 'Closed Won') {
    return 'Closed Won';
  }
  if (opp.lifecycle_status === 'CLOSED_LOST' || opp.pipeline_stage === 'Closed Lost') {
    return 'Closed Lost';
  }
  if (opp.pipeline_stage === 'Proposal & Negotiation') return 'Proposal & Negotiation';
  if (opp.pipeline_stage === 'Discovery & Solutioning') return 'Discovery & Solutioning';
  return 'Active Assessment';
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
  const [items, setItems] = useState<DashboardPortfolioItem[]>([]);
  const [activeRisksCount, setActiveRisksCount] = useState(0);
  const [criticalRisksCount, setCriticalRisksCount] = useState(0);
  const [openActionsCount, setOpenActionsCount] = useState(0);
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'ACTIVE' | 'CLOSED'>('ALL');

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [pipeList, oppsRes, promosRes, formRes, risksRes, actionsRes] = await Promise.all([
        PipelineDataService.listPipelineOpportunities(),
        supabase.from('opportunities').select('*').order('created_at', { ascending: false }),
        supabase.from('sql_opportunity_promotions').select('lead_id, opportunity_id'),
        supabase
          .from('opportunity_form_records')
          .select('opportunity_id, company_name, opportunity_name, estimated_revenue, industry, revenue_motion'),
        supabase.from('pipeline_risks').select('risk_instance_id, severity, risk_status'),
        supabase.from('pipeline_actions').select('action_id, action_status')
      ]);

      const pipeByOppId = new Map<string, PipelineOpportunity & { latest_assessment?: PipelineAssessment }>();
      const registerPipeLookup = (
        key: string | undefined,
        candidate: PipelineOpportunity & { latest_assessment?: PipelineAssessment }
      ) => {
        if (!key) return;
        const existing = pipeByOppId.get(key);
        if (!existing || (!existing.latest_assessment && candidate.latest_assessment)) {
          pipeByOppId.set(key, candidate);
        }
      };
      pipeList.forEach((p) => {
        registerPipeLookup(p.pipeline_id, p);
        registerPipeLookup(p.opportunity_id, p);
        registerPipeLookup(p.lead_id, p);
      });

      const formByOppId = new Map<string, any>();
      (formRes.data || []).forEach((f: any) => {
        if (f.opportunity_id) formByOppId.set(f.opportunity_id, f);
      });

      const promoLeadIds = new Set<string>(
        (promosRes.data || []).map((p: any) => p.lead_id).filter(Boolean)
      );
      const seenIds = new Set<string>();
      const seenItemIds = new Set<string>();
      const seenPipeIds = new Set<string>();
      const mergedItems: DashboardPortfolioItem[] = [];

      const markMatchingPipesSeen = (oppId?: string, leadId?: string) => {
        pipeList.forEach((p) => {
          if (
            (oppId && (p.opportunity_id === oppId || p.pipeline_id === oppId)) ||
            (leadId && p.lead_id === leadId)
          ) {
            seenPipeIds.add(p.pipeline_id);
          }
        });
      };

      (oppsRes.data || []).forEach((opp: any) => {
        if (!opp?.id || seenItemIds.has(opp.id)) return;
        const form = formByOppId.get(opp.id) || {};
        let parsedDesc: any = {};
        if (opp.description && typeof opp.description === 'string' && opp.description.trim().startsWith('{')) {
          try {
            parsedDesc = JSON.parse(opp.description);
          } catch (_e) {}
        }
        const rawRev = form.estimated_revenue || parsedDesc.estimated_revenue || opp.expected_revenue || '0';
        const estVal = parseFloat(String(rawRev).replace(/[^0-9.]/g, '')) || 0;
        const linkedPipe =
          pipeByOppId.get(opp.id) ||
          (opp.mql_reference_id ? pipeByOppId.get(opp.mql_reference_id) : undefined);

        seenIds.add(opp.id);
        seenItemIds.add(opp.id);
        if (opp.mql_reference_id) seenIds.add(opp.mql_reference_id);
        if (linkedPipe) seenPipeIds.add(linkedPipe.pipeline_id);
        markMatchingPipesSeen(opp.id, opp.mql_reference_id);

        mergedItems.push({
          id: opp.id,
          lead_id: opp.mql_reference_id || undefined,
          company_name: linkedPipe?.customer_name || form.company_name || opp.company_name || 'Enterprise Customer',
          opportunity_name:
            linkedPipe?.opportunity_name ||
            form.opportunity_name ||
            opp.opportunity_name ||
            `${opp.company_name || 'Enterprise'} Opportunity`,
          industry: linkedPipe?.industry_name || form.industry || opp.industry || 'Enterprise Software',
          revenue_motion:
            linkedPipe?.revenue_motion_name || form.revenue_motion || opp.revenue_motion || 'Digital Solution Selling',
          estimated_value: linkedPipe?.deal_value || estVal,
          pipeline_opp: linkedPipe
        });
      });

      const missingLeadIds = Array.from(promoLeadIds).filter((lid) => !seenIds.has(lid));
      if (missingLeadIds.length > 0) {
        const { data: leadRows } = await supabase
          .from('mql_leads')
          .select('id, company_name, lead_industry')
          .in('id', missingLeadIds);

        (leadRows || []).forEach((l: any) => {
          if (!l?.id) return;
          const linkedPipe = pipeByOppId.get(l.id);
          const resolvedItemId = linkedPipe?.opportunity_id || l.id;
          if (seenItemIds.has(resolvedItemId) || seenItemIds.has(l.id)) {
            markMatchingPipesSeen(linkedPipe?.opportunity_id, l.id);
            return;
          }
          seenIds.add(l.id);
          seenItemIds.add(resolvedItemId);
          if (linkedPipe) seenPipeIds.add(linkedPipe.pipeline_id);
          markMatchingPipesSeen(linkedPipe?.opportunity_id, l.id);

          mergedItems.push({
            id: resolvedItemId,
            lead_id: l.id,
            company_name: linkedPipe?.customer_name || l.company_name || 'Enterprise Customer',
            opportunity_name:
              linkedPipe?.opportunity_name || `${l.company_name || 'Enterprise'} Opportunity`,
            industry: linkedPipe?.industry_name || l.lead_industry || 'Enterprise Software',
            revenue_motion: linkedPipe?.revenue_motion_name || 'Digital Solution Selling',
            estimated_value: linkedPipe?.deal_value || 0,
            pipeline_opp: linkedPipe
          });
        });
      }

      pipeList.forEach((p) => {
        const candidateId = p.opportunity_id || p.pipeline_id;
        if (
          seenPipeIds.has(p.pipeline_id) ||
          seenItemIds.has(candidateId) ||
          (p.lead_id && seenIds.has(p.lead_id))
        ) {
          return;
        }
        seenItemIds.add(candidateId);
        seenPipeIds.add(p.pipeline_id);
        markMatchingPipesSeen(p.opportunity_id, p.lead_id);

        mergedItems.push({
          id: candidateId,
          lead_id: p.lead_id,
          company_name: p.customer_name,
          opportunity_name: p.opportunity_name,
          industry: p.industry_name,
          revenue_motion: p.revenue_motion_name,
          estimated_value: p.deal_value || 0,
          pipeline_opp: p
        });
      });

      setItems(mergedItems);

      const activeRisks = (risksRes.data || []).filter(
        (r: any) => r.risk_status === 'ACTIVE' || r.risk_status === 'MITIGATING'
      );
      setActiveRisksCount(activeRisks.length);
      setCriticalRisksCount(
        activeRisks.filter((r: any) => r.severity === 'CRITICAL' || r.severity === 'HIGH').length
      );

      const openActions = (actionsRes.data || []).filter(
        (a: any) => a.action_status !== 'COMPLETED' && a.action_status !== 'CANCELLED'
      );
      setOpenActionsCount(openActions.length);
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
      return items.filter((i) => {
        const stage = resolveStage(i);
        return stage !== 'Closed Won' && stage !== 'Closed Lost';
      });
    }
    if (scopeFilter === 'CLOSED') {
      return items.filter((i) => {
        const stage = resolveStage(i);
        return stage === 'Closed Won' || stage === 'Closed Lost';
      });
    }
    return items;
  }, [items, scopeFilter]);

  const kpis = useMemo(() => {
    const activeDeals = items.filter((i) => {
      const stage = resolveStage(i);
      return stage !== 'Closed Won' && stage !== 'Closed Lost';
    });
    const closedWon = items.filter((i) => resolveStage(i) === 'Closed Won');
    const closedLost = items.filter((i) => resolveStage(i) === 'Closed Lost');

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
                  const stage = resolveStage(item);
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
