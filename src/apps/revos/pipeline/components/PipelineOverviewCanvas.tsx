import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  PieChart,
  Search,
  ArrowRight,
  RefreshCw,
  Briefcase,
  DollarSign,
  TrendingUp,
  Layers,
  LayoutGrid,
  List,
  ShieldAlert,
  Award,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { PipelineOpportunity, PipelineAssessment } from '../../types/pipeline';
import { PipelineDataService } from '../services/PipelineDataService';
import { PromotionDataService } from '../../leads/services/promotionDataService';
import { OpportunityDataService } from '../../leads/services/opportunityDataService';
import {
  PipelineCard,
  PipelineCardItem,
  PIPELINE_STAGE_OPTIONS,
  OPPORTUNITY_STAGE_OPTIONS,
  IsolatedPipelineCardEdits,
  getIsolatedPipelineCardEdits
} from './PipelineCard';

export type PipelineCanvasItem = PipelineCardItem;

type CanvasColumnKey =
  | 'Initial Pipeline'
  | 'Proposal/Evaluation'
  | 'Negotiation/Commit'
  | 'Closed';

const CANVAS_COLUMNS: Array<{
  key: CanvasColumnKey;
  label: string;
}> = [
  { key: 'Initial Pipeline', label: 'Initial Pipeline' },
  { key: 'Proposal/Evaluation', label: 'Proposal/Evaluation' },
  { key: 'Negotiation/Commit', label: 'Negotiation/Commit' },
  { key: 'Closed', label: 'Closed' }
];

const CARDS_PER_PAGE = 6;

function normalizePipelineStage(
  pipeStage?: string,
  lifecycleStatus?: string,
  formStage?: string,
  descStage?: string
): string {
  if (lifecycleStatus === 'CLOSED_WON' || pipeStage === 'Closed Won') return 'Closed Won';
  if (lifecycleStatus === 'CLOSED_LOST' || pipeStage === 'Closed Lost') return 'Closed Lost';
  const validStages = new Set<string>(PIPELINE_STAGE_OPTIONS);
  if (pipeStage && validStages.has(pipeStage)) return pipeStage;
  if (pipeStage === 'Proposal & Negotiation') return 'Proposal';
  if (formStage && validStages.has(formStage)) return formStage;
  if (descStage && validStages.has(descStage)) return descStage;
  if (pipeStage === 'Discovery & Solutioning') return 'Discovery';
  return 'Qualification';
}

function normalizeOpportunityStage(
  salesStage?: string,
  formOppStage?: string,
  descOppStage?: string
): string {
  const validOppStages = new Set<string>(OPPORTUNITY_STAGE_OPTIONS);
  if (salesStage && validOppStages.has(salesStage)) return salesStage;
  if (formOppStage && validOppStages.has(formOppStage)) return formOppStage;
  if (descOppStage && validOppStages.has(descOppStage)) return descOppStage;
  return formOppStage || descOppStage || salesStage || 'Emerging Opportunity';
}

function resolveCanvasColumn(item: PipelineCardItem): CanvasColumnKey {
  const stage = item.pipeline_stage;
  const lifecycle = item.pipeline_opp?.lifecycle_status;
  if (
    lifecycle === 'CLOSED_WON' ||
    lifecycle === 'CLOSED_LOST' ||
    stage === 'Closed Won' ||
    stage === 'Closed Lost'
  ) {
    return 'Closed';
  }
  if (stage === 'Negotiation' || stage === 'Commit') {
    return 'Negotiation/Commit';
  }
  if (stage === 'Proposal' || stage === 'Evaluation') {
    return 'Proposal/Evaluation';
  }
  return 'Initial Pipeline';
}

function applyIsolatedEdits(item: PipelineCardItem): PipelineCardItem {
  const isolated = getIsolatedPipelineCardEdits(item.id);
  if (!isolated) return item;
  return {
    ...item,
    company_name: isolated.company_name ?? item.company_name,
    opportunity_name: isolated.opportunity_name ?? item.opportunity_name,
    estimated_value:
      isolated.estimated_value !== undefined ? isolated.estimated_value : item.estimated_value,
    pipeline_stage: isolated.pipeline_stage ?? item.pipeline_stage,
    opportunity_stage: isolated.opportunity_stage ?? item.opportunity_stage
  };
}

export interface PipelineOverviewCanvasProps {
  embedded?: boolean;
}

export const PipelineOverviewCanvas: React.FC<PipelineOverviewCanvasProps> = ({ embedded = false }) => {
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'canvas' | 'list'>('canvas');
  const [searchQuery, setSearchQuery] = useState('');
  const [healthFilter, setHealthFilter] = useState<
    'ALL' | 'UNASSESSED' | 'STRONG' | 'HEALTHY' | 'MODERATE' | 'AT_RISK'
  >('ALL');
  const [items, setItems] = useState<PipelineCardItem[]>([]);
  const [columnPages, setColumnPages] = useState<Record<CanvasColumnKey, number>>({
    'Initial Pipeline': 1,
    'Proposal/Evaluation': 1,
    'Negotiation/Commit': 1,
    Closed: 1
  });

  const loadPipelinePortfolio = async () => {
    setLoading(true);
    try {
      const [pipeList, oppsRes, promosRes, mqlPromosRes, formRes, leadsRes, oppRevenueMap, oppNameMap] =
        await Promise.all([
          PipelineDataService.listPipelineOpportunities(),
          supabase.from('opportunities').select('*').order('created_at', { ascending: false }),
          supabase.from('sql_opportunity_promotions').select('lead_id, opportunity_id'),
          supabase.from('mql_sql_promotions').select('lead_id, opportunity_id'),
          supabase
            .from('opportunity_form_records')
            .select(
              'opportunity_id, company_name, opportunity_name, estimated_revenue, industry, revenue_motion, pipeline_stage, opportunity_stage'
            ),
          supabase
            .from('mql_leads')
            .select('id, company_name, lead_industry, status'),
          OpportunityDataService.getOpportunityEstimatedRevenuesMap().catch(() => ({} as Record<string, number>)),
          OpportunityDataService.getOpportunityNamesMap().catch(() => ({} as Record<string, string>))
        ]);

      if (leadsRes.error) {
        console.warn('Error fetching mql_leads for Pipeline Canvas sync:', leadsRes.error.message);
      }

      // Prefer assessed / newest pipeline record when multiple rows share an opportunity_id or lead_id
      const pipeByOppId = new Map<
        string,
        PipelineOpportunity & { latest_assessment?: PipelineAssessment }
      >();
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

      let deletedLeadIds = new Set<string>();
      let deletedOppIds = new Set<string>();
      if (typeof window !== 'undefined') {
        try {
          const storedLeads = localStorage.getItem('mql_deleted_lead_ids');
          if (storedLeads) {
            const parsed = JSON.parse(storedLeads);
            if (Array.isArray(parsed)) deletedLeadIds = new Set(parsed.filter(Boolean));
          }
        } catch {}
        try {
          const storedOpps = localStorage.getItem('sql_opportunity_table_deleted_ids');
          if (storedOpps) {
            const parsed = JSON.parse(storedOpps);
            if (Array.isArray(parsed)) deletedOppIds = new Set(parsed.filter(Boolean));
          }
        } catch {}
      }

      const promoLeadIds = new Set<string>(
        promosRes.error
          ? PromotionDataService.getCachedSqlOpportunityPromotedLeadIds()
          : (promosRes.data || []).map((p: any) => p.lead_id).filter(Boolean)
      );
      const promoLeadByOppId = new Map<string, string>();
      const promoOppByLeadId = new Map<string, string>();
      (promosRes.data || []).forEach((p: any) => {
        if (p.opportunity_id && p.lead_id) {
          promoLeadByOppId.set(p.opportunity_id, p.lead_id);
          promoOppByLeadId.set(p.lead_id, p.opportunity_id);
        }
      });

      const mqlPromoLeadByOppId = new Map<string, string>();
      const mqlPromoOppByLeadId = new Map<string, string>();
      (mqlPromosRes.data || []).forEach((p: any) => {
        if (p.opportunity_id && p.lead_id) {
          mqlPromoLeadByOppId.set(p.opportunity_id, p.lead_id);
          mqlPromoOppByLeadId.set(p.lead_id, p.opportunity_id);
        }
      });

      const leadRows = leadsRes.data || [];
      const leadById = new Map<string, any>();
      // Exact match to LeadCanvas Opportunity Column: non-deleted leads in sql_opportunity_promotions or marked Opportunity
      const activeLeadCanvasOppLeadIds = new Set<string>();
      leadRows.forEach((l: any) => {
        if (!l?.id) return;
        leadById.set(l.id, l);
        if (deletedLeadIds.has(l.id)) return;
        if (promoLeadIds.has(l.id) || l.status === 'Opportunity') {
          activeLeadCanvasOppLeadIds.add(l.id);
        }
      });

      const seenIds = new Set<string>();
      const seenItemIds = new Set<string>();
      const seenPipeIds = new Set<string>();
      const mergedItems: PipelineCardItem[] = [];

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
        if (!opp?.id || seenItemIds.has(opp.id) || deletedOppIds.has(opp.id)) return;

        const resolvedLeadId =
          opp.mql_reference_id || promoLeadByOppId.get(opp.id) || mqlPromoLeadByOppId.get(opp.id);
        if (resolvedLeadId && deletedLeadIds.has(resolvedLeadId)) return;

        const linkedPipe =
          pipeByOppId.get(opp.id) ||
          (resolvedLeadId ? pipeByOppId.get(resolvedLeadId) : undefined);

        const isInLeadCanvasOppColumn = Boolean(
          resolvedLeadId && activeLeadCanvasOppLeadIds.has(resolvedLeadId)
        );

        if (!isInLeadCanvasOppColumn && !linkedPipe) return;

        const form = formByOppId.get(opp.id) || {};
        let parsedDesc: any = {};
        if (
          opp.description &&
          typeof opp.description === 'string' &&
          opp.description.trim().startsWith('{')
        ) {
          try {
            parsedDesc = JSON.parse(opp.description);
          } catch (_e) {}
        }
        const rawRev =
          form.estimated_revenue || parsedDesc.estimated_revenue || opp.expected_revenue || '0';
        const parsedRev = parseFloat(String(rawRev).replace(/[^0-9.]/g, '')) || 0;
        const estVal =
          parsedRev > 0
            ? parsedRev
            : oppRevenueMap[opp.id] || (resolvedLeadId ? oppRevenueMap[resolvedLeadId] : 0) || 0;

        const baseItem: PipelineCardItem = {
          id: opp.id,
          lead_id: resolvedLeadId || undefined,
          company_name:
            linkedPipe?.customer_name ||
            form.company_name ||
            opp.company_name ||
            'Enterprise Customer',
          opportunity_name:
            linkedPipe?.opportunity_name ||
            form.opportunity_name ||
            oppNameMap[opp.id] ||
            (resolvedLeadId ? oppNameMap[resolvedLeadId] : undefined) ||
            opp.opportunity_name ||
            `${opp.company_name || 'Enterprise'} Opportunity`,
          industry:
            linkedPipe?.industry_name || form.industry || opp.industry || 'Enterprise Software',
          revenue_motion:
            linkedPipe?.revenue_motion_name ||
            form.revenue_motion ||
            opp.revenue_motion ||
            'Digital Solution Selling',
          estimated_value: linkedPipe?.deal_value || estVal,
          pipeline_stage: normalizePipelineStage(
            linkedPipe?.pipeline_stage,
            linkedPipe?.lifecycle_status,
            form.pipeline_stage,
            parsedDesc.pipeline_stage
          ),
          opportunity_stage: normalizeOpportunityStage(
            linkedPipe?.sales_stage,
            form.opportunity_stage,
            parsedDesc.opportunity_stage
          ),
          pipeline_opp: linkedPipe
        };

        const finalItem = applyIsolatedEdits(baseItem);
        // Column 1 (Initial Pipeline) must ONLY display items currently listed in Lead Canvas Opportunity Column
        if (resolveCanvasColumn(finalItem) === 'Initial Pipeline' && !isInLeadCanvasOppColumn) {
          return;
        }

        seenIds.add(opp.id);
        seenItemIds.add(opp.id);
        if (resolvedLeadId) seenIds.add(resolvedLeadId);
        if (linkedPipe) seenPipeIds.add(linkedPipe.pipeline_id);
        markMatchingPipesSeen(opp.id, resolvedLeadId);

        mergedItems.push(finalItem);
      });

      // Qualified Opportunity leads from Lead Canvas Opportunity Column not yet backed by an opportunities row
      activeLeadCanvasOppLeadIds.forEach((lid) => {
        if (seenIds.has(lid)) return;
        const l = leadById.get(lid);
        if (!l) return;

        const promoOppId = promoOppByLeadId.get(l.id) || mqlPromoOppByLeadId.get(l.id);
        const linkedPipe =
          pipeByOppId.get(l.id) || (promoOppId ? pipeByOppId.get(promoOppId) : undefined);
        const resolvedItemId = linkedPipe?.opportunity_id || promoOppId || l.id;
        if (seenItemIds.has(resolvedItemId) || seenItemIds.has(l.id)) {
          markMatchingPipesSeen(linkedPipe?.opportunity_id || promoOppId, l.id);
          return;
        }
        seenIds.add(l.id);
        seenItemIds.add(resolvedItemId);
        if (linkedPipe) seenPipeIds.add(linkedPipe.pipeline_id);
        markMatchingPipesSeen(linkedPipe?.opportunity_id || promoOppId, l.id);

        const form = formByOppId.get(resolvedItemId) || {};
        const formRev = parseFloat(String(form.estimated_revenue || '').replace(/[^0-9.]/g, '')) || 0;
        const fallbackRev =
          formRev > 0 ? formRev : oppRevenueMap[resolvedItemId] || oppRevenueMap[l.id] || 0;
        const baseItem: PipelineCardItem = {
          id: resolvedItemId,
          lead_id: l.id,
          company_name:
            linkedPipe?.customer_name || form.company_name || l.company_name || 'Enterprise Customer',
          opportunity_name:
            linkedPipe?.opportunity_name ||
            form.opportunity_name ||
            oppNameMap[resolvedItemId] ||
            oppNameMap[l.id] ||
            `${l.company_name || 'Enterprise'} Opportunity`,
          industry:
            linkedPipe?.industry_name ||
            form.industry ||
            l.lead_industry ||
            'Enterprise Software',
          revenue_motion:
            linkedPipe?.revenue_motion_name || form.revenue_motion || 'Digital Solution Selling',
          estimated_value: linkedPipe?.deal_value || fallbackRev,
          pipeline_stage: normalizePipelineStage(
            linkedPipe?.pipeline_stage,
            linkedPipe?.lifecycle_status,
            form.pipeline_stage
          ),
          opportunity_stage: normalizeOpportunityStage(
            linkedPipe?.sales_stage,
            form.opportunity_stage
          ),
          pipeline_opp: linkedPipe
        };

        mergedItems.push(applyIsolatedEdits(baseItem));
      });

      // Direct pipeline_opportunities records without upstream match (only for non-Initial Pipeline stages unless in Lead Canvas Opportunity Column)
      pipeList.forEach((p) => {
        const candidateId = p.opportunity_id || p.pipeline_id;
        const resolvedLeadId =
          p.lead_id ||
          (p.opportunity_id
            ? promoLeadByOppId.get(p.opportunity_id) || mqlPromoLeadByOppId.get(p.opportunity_id)
            : undefined);

        if (
          seenPipeIds.has(p.pipeline_id) ||
          seenItemIds.has(candidateId) ||
          (resolvedLeadId && seenIds.has(resolvedLeadId)) ||
          (resolvedLeadId && deletedLeadIds.has(resolvedLeadId)) ||
          (p.opportunity_id && deletedOppIds.has(p.opportunity_id))
        ) {
          return;
        }

        const isInLeadCanvasOppColumn = Boolean(
          resolvedLeadId && activeLeadCanvasOppLeadIds.has(resolvedLeadId)
        );

        const baseItem: PipelineCardItem = {
          id: candidateId,
          lead_id: resolvedLeadId,
          company_name: p.customer_name,
          opportunity_name: p.opportunity_name,
          industry: p.industry_name,
          revenue_motion: p.revenue_motion_name,
          estimated_value: p.deal_value || 0,
          pipeline_stage: normalizePipelineStage(p.pipeline_stage, p.lifecycle_status),
          opportunity_stage: normalizeOpportunityStage(p.sales_stage),
          pipeline_opp: p
        };

        const finalItem = applyIsolatedEdits(baseItem);
        if (resolveCanvasColumn(finalItem) === 'Initial Pipeline' && !isInLeadCanvasOppColumn) {
          return;
        }

        seenItemIds.add(candidateId);
        seenPipeIds.add(p.pipeline_id);
        markMatchingPipesSeen(p.opportunity_id, resolvedLeadId);

        mergedItems.push(finalItem);
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
          item.industry.toLowerCase().includes(q) ||
          item.pipeline_stage.toLowerCase().includes(q) ||
          item.opportunity_stage.toLowerCase().includes(q);
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
        resolveCanvasColumn(i) !== 'Closed' &&
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
      .filter(
        (i) =>
          i.pipeline_stage === 'Closed Won' || i.pipeline_opp?.lifecycle_status === 'CLOSED_WON'
      )
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

  const handleSaveIsolatedCardEdits = async (
    item: PipelineCardItem,
    edits: IsolatedPipelineCardEdits
  ) => {
    const nextStage = edits.pipeline_stage ?? item.pipeline_stage;
    const nextLifecycle: PipelineOpportunity['lifecycle_status'] =
      nextStage === 'Closed Won'
        ? 'CLOSED_WON'
        : nextStage === 'Closed Lost'
          ? 'CLOSED_LOST'
          : 'ACTIVE';

    // Update isolated state immediately so the Pipeline Card stays responsive and independent
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== item.id) return it;
        return {
          ...it,
          company_name: edits.company_name ?? it.company_name,
          opportunity_name: edits.opportunity_name ?? it.opportunity_name,
          estimated_value:
            edits.estimated_value !== undefined ? edits.estimated_value : it.estimated_value,
          pipeline_stage: nextStage,
          opportunity_stage: edits.opportunity_stage ?? it.opportunity_stage,
          pipeline_opp: it.pipeline_opp
            ? {
                ...it.pipeline_opp,
                customer_name: edits.company_name ?? it.pipeline_opp.customer_name,
                opportunity_name: edits.opportunity_name ?? it.pipeline_opp.opportunity_name,
                deal_value:
                  edits.estimated_value !== undefined
                    ? edits.estimated_value
                    : it.pipeline_opp.deal_value,
                pipeline_stage: nextStage,
                sales_stage: edits.opportunity_stage ?? it.pipeline_opp.sales_stage,
                lifecycle_status: nextLifecycle
              }
            : undefined
        };
      })
    );

    // If a pipeline_opportunities record exists in Pipeline Engine, persist strictly there (never upstream Lead Canvas tables)
    if (item.pipeline_opp?.pipeline_id) {
      await PipelineDataService.updatePipelineStage(item.pipeline_opp.pipeline_id, {
        customer_name: edits.company_name,
        opportunity_name: edits.opportunity_name,
        deal_value: edits.estimated_value,
        pipeline_stage: nextStage,
        sales_stage: edits.opportunity_stage,
        lifecycle_status: nextLifecycle
      });
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

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setColumnPages({
      'Initial Pipeline': 1,
      'Proposal/Evaluation': 1,
      'Negotiation/Commit': 1,
      Closed: 1
    });
  };

  return (
    <div className={embedded ? 'space-y-6' : 'p-4 sm:p-6 md:p-8 space-y-6 max-w-[1440px] mx-auto'}>
      {/* Header */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 ${
          embedded ? 'pb-4' : 'pb-5'
        }`}
      >
        <div>
          {!embedded && (
            <div className="flex items-center gap-2 text-xs text-accent font-medium mb-1">
              <PieChart className="h-3.5 w-3.5" />
              <span>RevOS Pipeline Assessment Engine</span>
            </div>
          )}
          <h2
            className={
              embedded
                ? 'text-lg sm:text-xl font-bold text-text-primary tracking-tight'
                : 'text-2xl sm:text-3xl font-bold text-text-primary tracking-tight'
            }
          >
            Pipeline Overview &amp; Assessment Canvas
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Track opportunities from Lead Canvas inheritance through PADF scoring, SWOT/TOWS strategy execution, and Closed Won / Lost outcomes.
          </p>
        </div>

        {!embedded && (
          <Link
            to="/product/revos/leads"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary hover:border-accent/50 transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            <Layers className="h-3.5 w-3.5 text-accent" />
            <span>Open Lead Canvas</span>
          </Link>
        )}
      </div>

      {/* Portfolio Metrics Strip (Unchanged 5 cards) */}
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

      {/* Filter & View Controls (Unchanged) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
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
      ) : viewMode === 'canvas' ? (
        /* 4-Column Kanban Canvas matching Lead Canvas UI Style */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 items-start pb-4">
          {CANVAS_COLUMNS.map((col) => {
            const colItems = filteredItems.filter((it) => resolveCanvasColumn(it) === col.key);
            const colTotalVal = colItems.reduce((s, i) => s + (i.estimated_value || 0), 0);

            const isClosedCol = col.key === 'Closed';
            const closedWonColVal = isClosedCol
              ? colItems
                  .filter(
                    (i) =>
                      i.pipeline_stage === 'Closed Won' ||
                      i.pipeline_opp?.lifecycle_status === 'CLOSED_WON'
                  )
                  .reduce((s, i) => s + (i.estimated_value || 0), 0)
              : 0;
            const winRatePct =
              isClosedCol && colTotalVal > 0
                ? Math.round((closedWonColVal / colTotalVal) * 100)
                : 0;

            const totalPages = Math.ceil(colItems.length / CARDS_PER_PAGE) || 1;
            const currentPage = Math.min(Math.max(1, columnPages[col.key] || 1), totalPages);
            const startIdx = (currentPage - 1) * CARDS_PER_PAGE;
            const paginatedItems = colItems.slice(startIdx, startIdx + CARDS_PER_PAGE);

            return (
              <div key={col.key} className="flex flex-col gap-3 min-w-0">
                {/* Column Header Card matching LeadCanvas KanbanCard style */}
                <div className="min-h-[96px] bg-gradient-to-br from-bg-surface to-accent/[0.03] dark:to-accent/[0.06] border border-accent rounded-xl p-3 flex justify-between items-center shadow-sm hover:shadow-md hover:shadow-accent/5 hover:scale-[1.01] transition-all duration-300 relative overflow-hidden group select-none">
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-accent/80" />

                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-black text-text-primary font-sans tracking-tight uppercase truncate">
                        {col.label}
                      </span>
                      <span className="inline-flex items-center justify-center text-[9px] font-black font-mono px-1.5 py-0.5 rounded-full bg-accent/10 border border-accent/25 text-accent shadow-sm shrink-0">
                        {colItems.length}
                      </span>
                    </div>

                    {isClosedCol ? (
                      <>
                        <div className="text-[9px] font-bold text-text-secondary uppercase tracking-wider font-mono opacity-80 truncate">
                          Total: ${colTotalVal.toLocaleString('en-US')}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-green-500/10 border border-green-500/25 text-green-500 font-mono font-black text-[10px] shadow-sm">
                            Won: ${closedWonColVal.toLocaleString('en-US')}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-[9px] font-bold text-text-secondary uppercase tracking-wider font-mono opacity-80 truncate">
                          Estimated Revenue
                        </div>
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-green-500/10 border border-green-500/25 text-green-500 font-mono font-black text-[10px] mt-1 shadow-sm">
                          Total: ${colTotalVal.toLocaleString('en-US')}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Circle Win Rate Chart on Column 4 Closed */}
                  {isClosedCol && (
                    <div
                      className="relative w-11 h-11 flex items-center justify-center shrink-0"
                      title={`Win Rate: ${winRatePct}% ($${closedWonColVal.toLocaleString(
                        'en-US'
                      )} / $${colTotalVal.toLocaleString('en-US')})`}
                    >
                      <svg
                        className="w-full h-full transform -rotate-90 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.05)]"
                        viewBox="0 0 36 36"
                      >
                        <circle
                          className="text-border dark:text-border/40"
                          cx="18"
                          cy="18"
                          r="15.9155"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        />
                        <circle
                          className="text-accent transition-all duration-500 ease-out"
                          cx="18"
                          cy="18"
                          r="15.9155"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeDasharray={`${winRatePct}, 100`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute text-[9px] font-black text-text-primary font-mono">
                        {winRatePct}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Column Cards List */}
                <div className="flex flex-col gap-3 min-h-[160px]">
                  {paginatedItems.map((item) => (
                    <PipelineCard
                      key={item.id}
                      item={item}
                      onSaveIsolatedEdits={handleSaveIsolatedCardEdits}
                    />
                  ))}

                  {colItems.length === 0 && (
                    <div className="p-8 text-center text-text-secondary text-sm border border-dashed border-border rounded-xl">
                      No pipelines found
                    </div>
                  )}
                </div>

                {/* Pagination Controls matching LeadCanvas */}
                <div className="flex items-center justify-between px-2 py-1.5 bg-bg-surface/50 border border-border/60 rounded-xl select-none">
                  <button
                    type="button"
                    onClick={() =>
                      setColumnPages((prev) => ({
                        ...prev,
                        [col.key]: Math.max(1, currentPage - 1)
                      }))
                    }
                    disabled={currentPage <= 1}
                    className="p-1 rounded-lg hover:bg-bg-primary disabled:opacity-30 disabled:hover:bg-transparent text-text-secondary hover:text-text-primary transition-colors cursor-pointer disabled:cursor-not-allowed"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-bold font-mono text-text-secondary uppercase">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setColumnPages((prev) => ({
                        ...prev,
                        [col.key]: Math.min(totalPages, currentPage + 1)
                      }))
                    }
                    disabled={currentPage >= totalPages}
                    className="p-1 rounded-lg hover:bg-bg-primary disabled:opacity-30 disabled:hover:bg-transparent text-text-secondary hover:text-text-primary transition-colors cursor-pointer disabled:cursor-not-allowed"
                    title="Next Page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
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
      ) : (
        <div className="bg-bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/70 text-text-secondary font-mono bg-bg-primary/60">
                  <th className="py-3 px-4">Opportunity / Customer</th>
                  <th className="py-3 px-4">Opportunity Stage</th>
                  <th className="py-3 px-4">Pipeline Stage</th>
                  <th className="py-3 px-4 text-right">Estimate Value</th>
                  <th className="py-3 px-4 text-right">Base Win</th>
                  <th className="py-3 px-4 text-right">Risk-Adj</th>
                  <th className="py-3 px-4">Health</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredItems.map((item) => {
                  const assess = item.pipeline_opp?.latest_assessment;
                  const targetUrl = `/product/revos/pipeline?opportunityId=${encodeURIComponent(
                    item.id
                  )}${item.lead_id ? `&leadId=${encodeURIComponent(item.lead_id)}` : ''}&source=pipeline_directory`;

                  return (
                    <tr key={item.id} className="hover:bg-bg-primary/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-text-primary">{item.opportunity_name}</div>
                        <div className="text-[11px] text-text-secondary">{item.company_name}</div>
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary">{item.opportunity_stage}</td>
                      <td className="py-3.5 px-4 font-mono text-text-primary">{item.pipeline_stage}</td>
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
