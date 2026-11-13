import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  PieChart,
  Search,
  ArrowRight,
  RefreshCw,
  Building2,
  Briefcase,
  DollarSign,
  TrendingUp,
  Layers,
  LayoutGrid,
  List,
  ShieldAlert,
  Award
} from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { PipelineOpportunity, PipelineAssessment } from '../../types/pipeline';
import { PipelineDataService } from '../services/PipelineDataService';

export interface PipelineCanvasItem {
  id: string;
  lead_id?: string;
  company_name: string;
  opportunity_name: string;
  industry: string;
  revenue_motion: string;
  estimated_value: number;
  pipeline_opp?: PipelineOpportunity & { latest_assessment?: PipelineAssessment };
}

type CanvasColumnKey =
  | 'Active Assessment'
  | 'Discovery & Solutioning'
  | 'Proposal & Negotiation'
  | 'Closed Won'
  | 'Closed Lost';

const CANVAS_COLUMNS: Array<{
  key: CanvasColumnKey;
  label: string;
  accentClass: string;
}> = [
  { key: 'Active Assessment', label: 'Active Assessment', accentClass: 'text-accent' },
  {
    key: 'Discovery & Solutioning',
    label: 'Discovery & Solutioning',
    accentClass: 'text-sky-400'
  },
  {
    key: 'Proposal & Negotiation',
    label: 'Proposal & Negotiation',
    accentClass: 'text-amber-400'
  },
  { key: 'Closed Won', label: 'Closed Won', accentClass: 'text-emerald-400' },
  { key: 'Closed Lost', label: 'Closed Lost', accentClass: 'text-red-400' }
];

function resolveCanvasColumn(item: PipelineCanvasItem): CanvasColumnKey {
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

export const PipelineOverviewCanvas: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'canvas' | 'list'>('canvas');
  const [searchQuery, setSearchQuery] = useState('');
  const [healthFilter, setHealthFilter] = useState<'ALL' | 'UNASSESSED' | 'STRONG' | 'HEALTHY' | 'MODERATE' | 'AT_RISK'>('ALL');
  const [items, setItems] = useState<PipelineCanvasItem[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadPipelinePortfolio = async () => {
    setLoading(true);
    try {
      const [pipeList, oppsRes, promosRes, formRes] = await Promise.all([
        PipelineDataService.listPipelineOpportunities(),
        supabase.from('opportunities').select('*').order('created_at', { ascending: false }),
        supabase.from('sql_opportunity_promotions').select('lead_id, opportunity_id'),
        supabase
          .from('opportunity_form_records')
          .select('opportunity_id, company_name, opportunity_name, estimated_revenue, industry, revenue_motion')
      ]);

      const pipeByOppId = new Map<string, PipelineOpportunity & { latest_assessment?: PipelineAssessment }>();
      pipeList.forEach((p) => {
        if (p.pipeline_id) pipeByOppId.set(p.pipeline_id, p);
        if (p.opportunity_id) pipeByOppId.set(p.opportunity_id, p);
        if (p.lead_id) pipeByOppId.set(p.lead_id, p);
      });

      const formByOppId = new Map<string, any>();
      (formRes.data || []).forEach((f: any) => {
        if (f.opportunity_id) formByOppId.set(f.opportunity_id, f);
      });

      const promoLeadIds = new Set<string>(
        (promosRes.data || []).map((p: any) => p.lead_id).filter(Boolean)
      );
      const seenIds = new Set<string>();
      const seenPipeIds = new Set<string>();
      const mergedItems: PipelineCanvasItem[] = [];

      (oppsRes.data || []).forEach((opp: any) => {
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
        if (opp.mql_reference_id) seenIds.add(opp.mql_reference_id);
        if (linkedPipe) seenPipeIds.add(linkedPipe.pipeline_id);

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

      // Promoted SQL leads not yet present in opportunities
      const missingLeadIds = Array.from(promoLeadIds).filter((lid) => !seenIds.has(lid));
      if (missingLeadIds.length > 0) {
        const { data: leadRows } = await supabase
          .from('mql_leads')
          .select('id, company_name, lead_industry')
          .in('id', missingLeadIds);

        (leadRows || []).forEach((l: any) => {
          const linkedPipe = pipeByOppId.get(l.id);
          if (linkedPipe) seenPipeIds.add(linkedPipe.pipeline_id);
          mergedItems.push({
            id: l.id,
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

      // Direct pipeline_opportunities records without upstream match
      pipeList.forEach((p) => {
        if (!seenPipeIds.has(p.pipeline_id)) {
          mergedItems.push({
            id: p.opportunity_id || p.pipeline_id,
            lead_id: p.lead_id,
            company_name: p.customer_name,
            opportunity_name: p.opportunity_name,
            industry: p.industry_name,
            revenue_motion: p.revenue_motion_name,
            estimated_value: p.deal_value || 0,
            pipeline_opp: p
          });
        }
      });

      setItems(mergedItems);
    } catch (err) {
      console.error('Error loading Pipeline Overview & Canvas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPipelinePortfolio();
  }, []);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (q) {
        const matched =
          item.company_name.toLowerCase().includes(q) ||
          item.opportunity_name.toLowerCase().includes(q) ||
          item.industry.toLowerCase().includes(q);
        if (!matched) return false;
      }

      const health = item.pipeline_opp?.latest_assessment?.pipeline_health;
      if (healthFilter === 'UNASSESSED') return !health;
      if (healthFilter === 'AT_RISK') return health === 'AT_RISK' || health === 'CRITICAL';
      if (healthFilter !== 'ALL') return health === healthFilter;
      return true;
    });
  }, [items, searchQuery, healthFilter]);

  const metrics = useMemo(() => {
    const active = items.filter(
      (i) =>
        i.pipeline_opp?.lifecycle_status !== 'CLOSED_WON' &&
        i.pipeline_opp?.lifecycle_status !== 'CLOSED_LOST'
    );
    const totalVal = active.reduce((s, i) => s + (i.estimated_value || 0), 0);
    const assessed = items.filter((i) => Boolean(i.pipeline_opp?.latest_assessment));
    const avgRiskAdj =
      assessed.length > 0
        ? Math.round(
            assessed.reduce(
              (s, i) => s + (i.pipeline_opp?.latest_assessment?.risk_adjusted_winability ?? 0),
              0
            ) / assessed.length
          )
        : 0;
    const atRiskCount = assessed.filter((i) => {
      const h = i.pipeline_opp?.latest_assessment?.pipeline_health;
      return h === 'AT_RISK' || h === 'CRITICAL';
    }).length;
    const closedWonVal = items
      .filter((i) => resolveCanvasColumn(i) === 'Closed Won')
      .reduce((s, i) => s + (i.estimated_value || 0), 0);

    return {
      activeCount: active.length,
      totalVal,
      assessedCount: assessed.length,
      avgRiskAdj,
      atRiskCount,
      closedWonVal
    };
  }, [items]);

  const handleMoveColumn = async (item: PipelineCanvasItem, targetCol: CanvasColumnKey) => {
    if (!item.pipeline_opp) return;
    setUpdatingId(item.pipeline_opp.pipeline_id);
    const lifecycle: PipelineOpportunity['lifecycle_status'] =
      targetCol === 'Closed Won'
        ? 'CLOSED_WON'
        : targetCol === 'Closed Lost'
          ? 'CLOSED_LOST'
          : 'ACTIVE';

    const updated = await PipelineDataService.updatePipelineStage(item.pipeline_opp.pipeline_id, {
      pipeline_stage: targetCol,
      lifecycle_status: lifecycle
    });
    setUpdatingId(null);

    if (updated) {
      setItems((prev) =>
        prev.map((it) =>
          it.pipeline_opp?.pipeline_id === updated.pipeline_id
            ? { ...it, pipeline_opp: { ...it.pipeline_opp, ...updated } }
            : it
        )
      );
    }
  };

  const healthTextClass = (h?: string) => {
    switch (h) {
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

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2 text-xs text-accent font-medium mb-1">
            <PieChart className="h-3.5 w-3.5" />
            <span>RevOS Pipeline Assessment Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            Pipeline Overview & Assessment Canvas
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Track opportunities from Lead Canvas inheritance through PADF scoring, SWOT/TOWS strategy execution, and Closed Won / Lost outcomes.
          </p>
        </div>

        <Link
          to="/product/revos/leads"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary hover:border-accent/50 transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Layers className="h-3.5 w-3.5 text-accent" />
          <span>Open Lead Canvas</span>
        </Link>
      </div>

      {/* Portfolio Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 bg-bg-surface border border-border rounded-2xl">
          <div className="text-[11px] text-text-secondary flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5 text-accent" />
            <span>Active Deals</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-text-primary mt-1">
            {metrics.activeCount}
          </div>
        </div>

        <div className="p-4 bg-bg-surface border border-border rounded-2xl">
          <div className="text-[11px] text-text-secondary flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-accent" />
            <span>Active Pipeline Value</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-text-primary mt-1">
            ${metrics.totalVal.toLocaleString('en-US')}
          </div>
        </div>

        <div className="p-4 bg-bg-surface border border-border rounded-2xl">
          <div className="text-[11px] text-text-secondary flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            <span>Avg Risk-Adj Winability</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
            {metrics.assessedCount > 0 ? `${metrics.avgRiskAdj}%` : '--'}
          </div>
        </div>

        <div className="p-4 bg-bg-surface border border-border rounded-2xl">
          <div className="text-[11px] text-text-secondary flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
            <span>At-Risk / Critical</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-amber-400 mt-1">
            {metrics.atRiskCount}
          </div>
        </div>

        <div className="p-4 bg-bg-surface border border-border rounded-2xl col-span-2 md:col-span-1">
          <div className="text-[11px] text-text-secondary flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5 text-emerald-400" />
            <span>Closed Won Value</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-text-primary mt-1">
            ${metrics.closedWonVal.toLocaleString('en-US')}
          </div>
        </div>
      </div>

      {/* Filter & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company, opportunity, or industry..."
              className="pl-10 pr-4 py-2 bg-bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-accent w-64 sm:w-72"
            />
          </div>

          <select
            value={healthFilter}
            onChange={(e) => setHealthFilter(e.target.value as any)}
            className="px-3 py-2 bg-bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="ALL">All Health States</option>
            <option value="STRONG">Strong</option>
            <option value="HEALTHY">Healthy</option>
            <option value="MODERATE">Moderate</option>
            <option value="AT_RISK">At Risk / Critical</option>
            <option value="UNASSESSED">Unassessed</option>
          </select>
        </div>

        <div className="flex items-center gap-1 p-1 bg-bg-surface border border-border rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('canvas')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              viewMode === 'canvas'
                ? 'bg-accent text-black'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Kanban Canvas</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              viewMode === 'list'
                ? 'bg-accent text-black'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span>Directory</span>
          </button>
        </div>
      </div>

      {/* Main Portfolio View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-text-secondary space-y-2">
          <RefreshCw className="h-6 w-6 animate-spin text-accent" />
          <span className="text-xs font-mono">Loading Pipeline Canvas...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-10 text-center bg-bg-surface border border-border rounded-2xl space-y-3">
          <PieChart className="h-9 w-9 mx-auto text-text-secondary/50" />
          <h3 className="text-sm font-bold text-text-primary">No Matching Pipeline Opportunities</h3>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            Promote qualified SQLs into the Opportunity column in Lead Canvas or clear your active search filters.
          </p>
          <Link
            to="/product/revos/leads"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-black rounded-xl text-xs font-bold hover:bg-accent-hover transition-colors"
          >
            <span>Go to Lead Canvas</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : viewMode === 'canvas' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 items-start">
          {CANVAS_COLUMNS.map((col) => {
            const colItems = filteredItems.filter((it) => resolveCanvasColumn(it) === col.key);
            const colTotal = colItems.reduce((s, i) => s + (i.estimated_value || 0), 0);

            return (
              <div
                key={col.key}
                className="bg-bg-surface border border-border rounded-2xl p-3.5 space-y-3 min-h-[260px]"
              >
                <div className="pb-2.5 border-b border-border/60 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-bold ${col.accentClass}`}>{col.label}</span>
                    <span className="text-xs font-mono tabular-nums text-text-secondary">
                      {colItems.length}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono tabular-nums text-text-secondary">
                    ${colTotal.toLocaleString('en-US')}
                  </div>
                </div>

                {colItems.length === 0 ? (
                  <div className="py-8 text-center text-[11px] text-text-secondary">
                    No opportunities in this stage
                  </div>
                ) : (
                  <div className="space-y-3">
                    {colItems.map((item) => {
                      const assess = item.pipeline_opp?.latest_assessment;
                      const targetUrl = `/product/revos/pipeline?opportunityId=${encodeURIComponent(
                        item.id
                      )}${item.lead_id ? `&leadId=${encodeURIComponent(item.lead_id)}` : ''}&source=pipeline_canvas`;
                      const isMoving = updatingId === item.pipeline_opp?.pipeline_id;

                      return (
                        <div
                          key={item.id}
                          className="p-3.5 bg-bg-primary border border-border/80 hover:border-accent/50 rounded-xl space-y-2.5 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2 text-[11px]">
                            <span className="inline-flex items-center gap-1 text-text-secondary truncate">
                              <Building2 className="h-3 w-3 text-accent shrink-0" />
                              <span className="truncate font-medium text-text-primary">
                                {item.company_name}
                              </span>
                            </span>
                            <span className="font-mono tabular-nums font-semibold text-text-primary shrink-0">
                              {item.estimated_value > 0
                                ? `$${item.estimated_value.toLocaleString('en-US')}`
                                : '—'}
                            </span>
                          </div>

                          <Link
                            to={targetUrl}
                            className="block text-xs font-bold text-text-primary hover:text-accent transition-colors leading-snug line-clamp-2"
                          >
                            {item.opportunity_name}
                          </Link>

                          <div className="text-[11px] text-text-secondary truncate">
                            {item.industry} · {item.revenue_motion}
                          </div>

                          {assess ? (
                            <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] font-mono tabular-nums">
                              <span className="text-text-secondary">
                                Base <strong className="text-text-primary">{assess.base_winability}%</strong> ·{' '}
                                Adj <strong className="text-accent">{assess.risk_adjusted_winability}%</strong>
                              </span>
                              <span className={`font-bold ${healthTextClass(assess.pipeline_health)}`}>
                                {assess.pipeline_health}
                              </span>
                            </div>
                          ) : (
                            <div className="pt-2 border-t border-border/50 text-[11px] font-mono text-text-secondary">
                              {item.pipeline_opp?.pipeline_stage || 'Ready for PADIF Intake'}
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-2 pt-1">
                            {item.pipeline_opp ? (
                              <select
                                value={col.key}
                                disabled={isMoving}
                                onChange={(e) =>
                                  handleMoveColumn(item, e.target.value as CanvasColumnKey)
                                }
                                className="px-2 py-1 bg-bg-surface border border-border rounded-lg text-[10px] font-mono text-text-secondary focus:outline-none focus:border-accent cursor-pointer max-w-[125px]"
                              >
                                {CANVAS_COLUMNS.map((c) => (
                                  <option key={c.key} value={c.key}>
                                    {c.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-[10px] font-mono text-text-secondary">
                                Upstream SQL
                              </span>
                            )}

                            <Link
                              to={targetUrl}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-accent hover:bg-accent-hover text-black font-bold text-[11px] rounded-lg transition-colors whitespace-nowrap shrink-0"
                            >
                              <span>{assess ? 'Open' : 'Assess'}</span>
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/70 text-text-secondary font-mono bg-bg-primary/60">
                  <th className="py-3 px-4">Opportunity / Customer</th>
                  <th className="py-3 px-4">Industry · Motion</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4 text-right">Deal Value</th>
                  <th className="py-3 px-4 text-right">Base Win</th>
                  <th className="py-3 px-4 text-right">Risk-Adj</th>
                  <th className="py-3 px-4">Health</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredItems.map((item) => {
                  const assess = item.pipeline_opp?.latest_assessment;
                  const colKey = resolveCanvasColumn(item);
                  const targetUrl = `/product/revos/pipeline?opportunityId=${encodeURIComponent(
                    item.id
                  )}${item.lead_id ? `&leadId=${encodeURIComponent(item.lead_id)}` : ''}&source=pipeline_directory`;

                  return (
                    <tr key={item.id} className="hover:bg-bg-primary/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-text-primary">{item.opportunity_name}</div>
                        <div className="text-[11px] text-text-secondary">{item.company_name}</div>
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary">
                        <div>{item.industry}</div>
                        <div className="text-[11px] truncate max-w-[180px]">{item.revenue_motion}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-text-primary">{colKey}</td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-text-primary font-semibold">
                        {item.estimated_value > 0
                          ? `$${item.estimated_value.toLocaleString('en-US')}`
                          : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-text-secondary">
                        {assess ? `${assess.base_winability}%` : '--'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-accent">
                        {assess ? `${assess.risk_adjusted_winability}%` : '--'}
                      </td>
                      <td className={`py-3.5 px-4 font-mono font-bold ${healthTextClass(assess?.pipeline_health)}`}>
                        {assess?.pipeline_health || 'UNASSESSED'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={targetUrl}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent hover:bg-accent-hover text-black font-bold text-[11px] rounded-xl transition-colors whitespace-nowrap"
                        >
                          <span>{assess ? 'Workspace' : 'Assess'}</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelineOverviewCanvas;
