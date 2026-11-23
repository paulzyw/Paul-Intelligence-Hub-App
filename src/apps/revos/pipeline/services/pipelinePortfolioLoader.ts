import { supabase } from '../../../../lib/supabase';
import { PipelineOpportunity, PipelineAssessment } from '../../types/pipeline';
import { PipelineDataService } from './PipelineDataService';
import { PromotionDataService } from '../../leads/services/promotionDataService';
import {
  PipelineCardItem,
  PIPELINE_STAGE_OPTIONS,
  OPPORTUNITY_STAGE_OPTIONS,
  getIsolatedPipelineCardEdits
} from '../components/PipelineCard';

const PORTFOLIO_CACHE_STORAGE_KEY = 'revos_cached_pipeline_portfolio_v2';
const PORTFOLIO_FRESH_WINDOW_MS = 15_000;

let memoryPortfolioCache: { items: PipelineCardItem[]; fetchedAt: number } | null = null;
let inFlightPortfolioLoad: Promise<PipelineCardItem[]> | null = null;
let portfolioCacheDirty = false;
let portfolioListenersAttached = false;

function ensurePortfolioInvalidationListeners() {
  if (portfolioListenersAttached || typeof window === 'undefined') return;
  portfolioListenersAttached = true;
  const markDirty = () => {
    portfolioCacheDirty = true;
  };
  window.addEventListener('opportunity_form_updated', markDirty);
  window.addEventListener('opportunity_qualification_updated', markDirty);
  window.addEventListener('pipeline_portfolio_updated', markDirty);
}

function hydrateMemoryPortfolioFromStorage(): { items: PipelineCardItem[]; fetchedAt: number } | null {
  if (memoryPortfolioCache) return memoryPortfolioCache;
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PORTFOLIO_CACHE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.items)) {
      memoryPortfolioCache = {
        items: parsed.items,
        fetchedAt: typeof parsed.fetchedAt === 'number' ? parsed.fetchedAt : 0
      };
      return memoryPortfolioCache;
    }
  } catch {}
  return null;
}

function persistPortfolioCache(items: PipelineCardItem[]) {
  const entry = { items, fetchedAt: Date.now() };
  memoryPortfolioCache = entry;
  portfolioCacheDirty = false;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(PORTFOLIO_CACHE_STORAGE_KEY, JSON.stringify(entry));
    } catch {}
  }
}

export function getCachedCanonicalPipelinePortfolio(): PipelineCardItem[] | null {
  ensurePortfolioInvalidationListeners();
  const cached = hydrateMemoryPortfolioFromStorage();
  if (!cached) return null;
  return cached.items.map(applyIsolatedEdits);
}

export function isPipelinePortfolioCacheFresh(): boolean {
  ensurePortfolioInvalidationListeners();
  const cached = hydrateMemoryPortfolioFromStorage();
  if (!cached || portfolioCacheDirty) return false;
  return Date.now() - cached.fetchedAt < PORTFOLIO_FRESH_WINDOW_MS;
}

export function invalidatePipelinePortfolioCache(): void {
  portfolioCacheDirty = true;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pipeline_cache_invalidated'));
  }
}

export function updateCachedCanonicalPipelinePortfolio(
  updater: (prev: PipelineCardItem[]) => PipelineCardItem[]
): void {
  const cached = hydrateMemoryPortfolioFromStorage();
  if (!cached) return;
  const next = updater(cached.items);
  persistPortfolioCache(next);
}

export type CanvasColumnKey =
  | 'Initial Pipeline'
  | 'Proposal/Evaluation'
  | 'Negotiation/Commit'
  | 'Closed';

export function normalizePipelineStage(
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

export function normalizeOpportunityStage(
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

export function resolveCanvasColumn(item: Pick<PipelineCardItem, 'pipeline_stage' | 'pipeline_opp'>): CanvasColumnKey {
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

export function isPipelineItemClosed(item: Pick<PipelineCardItem, 'pipeline_stage' | 'pipeline_opp'>): boolean {
  return (
    resolveCanvasColumn(item) === 'Closed' ||
    item.pipeline_opp?.lifecycle_status === 'CLOSED_WON' ||
    item.pipeline_opp?.lifecycle_status === 'CLOSED_LOST'
  );
}

export function isCreatedOpportunityReadyForCanvas(
  opp: Pick<PipelineOpportunity, 'pipeline_id'> & { latest_assessment?: PipelineAssessment },
  handoverRow?: {
    summary_status?: string | null;
    initial_opportunity_context_summary?: any;
    padif_package?: any;
  } | null
): boolean {
  if (opp.latest_assessment) {
    return true;
  }
  if (!handoverRow) {
    return true;
  }
  if (handoverRow.summary_status === 'READY') {
    return true;
  }
  if (
    handoverRow.initial_opportunity_context_summary?.summary_sections ||
    handoverRow.padif_package?.initial_opportunity_context_summary?.summary_sections
  ) {
    return true;
  }
  if (
    handoverRow.summary_status === 'NOT_GENERATED' ||
    handoverRow.summary_status === 'GENERATING' ||
    handoverRow.summary_status === 'FAILED'
  ) {
    return false;
  }
  return true;
}

export function applyIsolatedEdits(item: PipelineCardItem): PipelineCardItem {
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

/**
 * Canonical Pipeline Portfolio Loader shared by Pipeline Canvas & Pipeline Dashboard
 * so Active Pipeline, Closed Outcomes, and deal valuations match 1:1.
 * Deduplicates concurrent requests and uses SWR memory + localStorage caching.
 */
export async function loadCanonicalPipelinePortfolio(options?: {
  forceRefresh?: boolean;
}): Promise<PipelineCardItem[]> {
  ensurePortfolioInvalidationListeners();

  if (!options?.forceRefresh && isPipelinePortfolioCacheFresh() && memoryPortfolioCache) {
    return memoryPortfolioCache.items.map(applyIsolatedEdits);
  }

  if (!options?.forceRefresh && inFlightPortfolioLoad) {
    return inFlightPortfolioLoad;
  }

  const runPromise = executeLoadCanonicalPipelinePortfolio().finally(() => {
    if (inFlightPortfolioLoad === runPromise) {
      inFlightPortfolioLoad = null;
    }
  });

  inFlightPortfolioLoad = runPromise;
  return runPromise;
}

async function executeLoadCanonicalPipelinePortfolio(): Promise<PipelineCardItem[]> {
  const [
    pipeList,
    oppsRes,
    promosRes,
    mqlPromosRes,
    formRes,
    leadsRes,
    sqlHandoverRes,
    pipeFormRes,
    pipeHandoverRes
  ] = await Promise.all([
    PipelineDataService.listPipelineOpportunities(),
    supabase
      .from('opportunities')
      .select(
        'id, mql_reference_id, company_name, opportunity_name, industry, revenue_motion, expected_revenue, description, created_at'
      )
      .order('created_at', { ascending: false }),
    supabase.from('sql_opportunity_promotions').select('lead_id, opportunity_id'),
    supabase.from('mql_sql_promotions').select('lead_id, opportunity_id'),
    supabase
      .from('opportunity_form_records')
      .select(
        'opportunity_id, company_name, opportunity_name, estimated_revenue, industry, revenue_motion, pipeline_stage, opportunity_stage, expected_close_date, opportunity_owner'
      ),
    supabase.from('mql_leads').select('id, company_name, lead_industry, status'),
    supabase
      .from('opportunity_sql_handover_details')
      .select('opportunity_id, sql_qip_package, editable_fields'),
    supabase
      .from('pipeline_form_records')
      .select('*'),
    supabase
      .from('pipeline_opportunity_handover_details')
      .select('pipeline_id, summary_status, initial_opportunity_context_summary, padif_package')
  ]);

  if (leadsRes.error) {
    console.warn('Error fetching mql_leads for Pipeline Portfolio sync:', leadsRes.error.message);
  }

  // Derive oppRevenueMap & oppNameMap in-memory from already-fetched rows (avoids 10 duplicate Supabase calls)
  const oppRevenueMap: Record<string, number> = {};
  const oppNameMap: Record<string, string> = {};
  const parseNumericRevenue = (val: any): number => {
    if (!val) return 0;
    const clean = String(val).replace(/[^0-9.]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  (oppsRes.data || []).forEach((opp: any) => {
    let desc: any = {};
    if (opp.description && typeof opp.description === 'string' && opp.description.trim().startsWith('{')) {
      try {
        desc = JSON.parse(opp.description);
      } catch {}
    }
    if (desc.estimated_revenue) {
      const num = parseNumericRevenue(desc.estimated_revenue);
      oppRevenueMap[opp.id] = num;
      if (opp.mql_reference_id) oppRevenueMap[opp.mql_reference_id] = num;
    }
    const name =
      opp.opportunity_name ||
      desc.opportunity_name ||
      (opp.company_name ? `${opp.company_name} Opportunity` : '');
    if (name) {
      oppNameMap[opp.id] = name;
      if (opp.mql_reference_id) oppNameMap[opp.mql_reference_id] = name;
    }
  });

  (sqlHandoverRes.data || []).forEach((h: any) => {
    const rev = h.editable_fields?.estimated_revenue;
    if (rev) oppRevenueMap[h.opportunity_id] = parseNumericRevenue(rev);
    const name = h.editable_fields?.opportunity_name;
    if (name) oppNameMap[h.opportunity_id] = name;
  });

  (formRes.data || []).forEach((f: any) => {
    if (f.estimated_revenue) oppRevenueMap[f.opportunity_id] = parseNumericRevenue(f.estimated_revenue);
    if (f.opportunity_name) oppNameMap[f.opportunity_id] = f.opportunity_name;
  });

  (promosRes.data || []).forEach((p: any) => {
    if (p.opportunity_id && p.lead_id) {
      if (oppRevenueMap[p.opportunity_id]) oppRevenueMap[p.lead_id] = oppRevenueMap[p.opportunity_id];
      if (oppNameMap[p.opportunity_id]) oppNameMap[p.lead_id] = oppNameMap[p.opportunity_id];
    }
  });

  (mqlPromosRes.data || []).forEach((p: any) => {
    if (p.opportunity_id && p.lead_id) {
      if (oppRevenueMap[p.opportunity_id]) oppRevenueMap[p.lead_id] = oppRevenueMap[p.opportunity_id];
      if (oppNameMap[p.opportunity_id]) oppNameMap[p.lead_id] = oppNameMap[p.opportunity_id];
    }
  });

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

  const handoverByOppId = new Map<string, any>();
  (sqlHandoverRes.data || []).forEach((h: any) => {
    if (h.opportunity_id) handoverByOppId.set(h.opportunity_id, h);
  });

  const pipeFormByKey = new Map<string, any>();
  (pipeFormRes.data || []).forEach((pf: any) => {
    if (pf.pipeline_id) pipeFormByKey.set(pf.pipeline_id, pf);
    if (pf.opportunity_id) pipeFormByKey.set(pf.opportunity_id, pf);
  });

  const pipeHandoverByPipeId = new Map<string, any>();
  if (!pipeHandoverRes.error) {
    (pipeHandoverRes.data || []).forEach((ph: any) => {
      if (ph?.pipeline_id) {
        pipeHandoverByPipeId.set(ph.pipeline_id, ph);
      }
    });
  }

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

  // Exact match to SqlToOpportunityTable.extractBusinessSegment
  const resolveBusinessSegment = (
    oppId?: string,
    leadId?: string,
    fallbackIndustry?: string
  ): string => {
    const handover = oppId ? handoverByOppId.get(oppId) : undefined;
    if (handover) {
      if (handover.sql_qip_package?.company_context?.business_segment) {
        return handover.sql_qip_package.company_context.business_segment;
      }
      if (handover.company_context?.business_segment) {
        return handover.company_context.business_segment;
      }
      if (handover.editable_fields?.business_segment) {
        return handover.editable_fields.business_segment;
      }
    }

    if (leadId) {
      const matchLead = leadById.get(leadId);
      if (matchLead?.lead_industry) return matchLead.lead_industry;
      if (typeof window !== 'undefined') {
        const extraJson = localStorage.getItem(`mql_lead_extra_${leadId}`);
        if (extraJson) {
          try {
            const extra = JSON.parse(extraJson);
            if (extra.lead_industry) return extra.lead_industry;
          } catch {}
        }
      }
    }

    return fallbackIndustry || 'Enterprise Cloud Software';
  };

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
    const pipeForm =
      (linkedPipe?.pipeline_id ? pipeFormByKey.get(linkedPipe.pipeline_id) : undefined) ||
      pipeFormByKey.get(opp.id);
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
      business_segment: resolveBusinessSegment(opp.id, resolvedLeadId, opp.industry),
      revenue_motion:
        linkedPipe?.revenue_motion_name ||
        form.revenue_motion ||
        opp.revenue_motion ||
        'Digital Solution Selling',
      estimated_value: linkedPipe?.deal_value || estVal,
      expected_close_date:
        pipeForm?.expected_close_date ||
        linkedPipe?.expected_close_date ||
        form.expected_close_date ||
        parsedDesc.expected_close_date ||
        undefined,
      opportunity_owner:
        pipeForm?.opportunity_owner ||
        linkedPipe?.opportunity_owner ||
        form.opportunity_owner ||
        parsedDesc.opportunity_owner ||
        'Senior Enterprise AE',
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
      source:
        linkedPipe?.source ||
        pipeForm?.source ||
        (linkedPipe?.metadata as any)?.source ||
        'Inherited',
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
    const pipeForm =
      (linkedPipe?.pipeline_id ? pipeFormByKey.get(linkedPipe.pipeline_id) : undefined) ||
      pipeFormByKey.get(resolvedItemId);
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
      business_segment: resolveBusinessSegment(resolvedItemId, l.id, l.lead_industry),
      revenue_motion:
        linkedPipe?.revenue_motion_name || form.revenue_motion || 'Digital Solution Selling',
      estimated_value: linkedPipe?.deal_value || fallbackRev,
      expected_close_date:
        pipeForm?.expected_close_date ||
        linkedPipe?.expected_close_date ||
        form.expected_close_date ||
        undefined,
      opportunity_owner:
        pipeForm?.opportunity_owner ||
        linkedPipe?.opportunity_owner ||
        form.opportunity_owner ||
        'Senior Enterprise AE',
      pipeline_stage: normalizePipelineStage(
        linkedPipe?.pipeline_stage,
        linkedPipe?.lifecycle_status,
        form.pipeline_stage
      ),
      opportunity_stage: normalizeOpportunityStage(
        linkedPipe?.sales_stage,
        form.opportunity_stage
      ),
      source:
        linkedPipe?.source ||
        pipeForm?.source ||
        (linkedPipe?.metadata as any)?.source ||
        'Inherited',
      pipeline_opp: linkedPipe
    };

    mergedItems.push(applyIsolatedEdits(baseItem));
  });

  const readyCreatedItems: PipelineCardItem[] = [];

  // Direct pipeline_opportunities records without upstream match (only for non-Initial Pipeline stages unless in Lead Canvas Opportunity Column or Source = 'Created' with READY summary)
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

    const pipeForm = pipeFormByKey.get(p.pipeline_id) || pipeFormByKey.get(candidateId);

    const baseItem: PipelineCardItem = {
      id: candidateId,
      lead_id: resolvedLeadId,
      company_name: p.customer_name,
      opportunity_name: p.opportunity_name,
      industry: p.industry_name,
      business_segment:
        p.business_segment ||
        pipeForm?.business_segment ||
        (p.metadata as any)?.business_segment ||
        (p.initial_context as any)?.business_segment ||
        resolveBusinessSegment(p.opportunity_id, resolvedLeadId, p.industry_name),
      revenue_motion: p.revenue_motion_name,
      estimated_value: p.deal_value || 0,
      expected_close_date: pipeForm?.expected_close_date || p.expected_close_date || undefined,
      opportunity_owner: pipeForm?.opportunity_owner || p.opportunity_owner || 'Senior Enterprise AE',
      pipeline_stage: normalizePipelineStage(
        p.pipeline_stage,
        p.lifecycle_status,
        pipeForm?.pipeline_stage
      ),
      opportunity_stage: normalizeOpportunityStage(p.sales_stage, pipeForm?.opportunity_stage),
      source:
        p.source ||
        pipeForm?.source ||
        (p.metadata as any)?.source ||
        (p.opportunity_id || p.lead_id || p.source_system === 'RevOS_Opportunity_Qualification'
          ? 'Inherited'
          : ''),
      pipeline_opp: p
    };

    const finalItem = applyIsolatedEdits(baseItem);
    const resolvedItemSource = String(finalItem.source || '').trim().toLowerCase();
    const isCreatedDirect =
      resolvedItemSource === 'created' ||
      p.source_system === 'RevOS_Pipeline_Direct_Creation';

    if (isCreatedDirect) {
      const handoverRow = pipeHandoverByPipeId.get(p.pipeline_id);
      if (!isCreatedOpportunityReadyForCanvas(p, handoverRow)) {
        return;
      }
    } else if (
      resolveCanvasColumn(finalItem) === 'Initial Pipeline' &&
      !isInLeadCanvasOppColumn
    ) {
      return;
    }

    seenItemIds.add(candidateId);
    seenPipeIds.add(p.pipeline_id);
    markMatchingPipesSeen(p.opportunity_id, resolvedLeadId);

    if (isCreatedDirect) {
      readyCreatedItems.push(finalItem);
    } else {
      mergedItems.push(finalItem);
    }
  });

  const combinedItems =
    readyCreatedItems.length > 0 ? [...readyCreatedItems, ...mergedItems] : mergedItems;

  persistPortfolioCache(combinedItems);

  return combinedItems;
}
