import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { MQLLead, MQLCampaign } from '../../types/mql';
import { Search, Edit, LayoutGrid, ChevronRight, ChevronLeft, CheckCircle2, AlertTriangle, AlertCircle, Table, ArrowUpRight, X } from 'lucide-react';
import { MqlToSqlTable } from './MqlToSqlTable';
import { SqlToOpportunityTable } from './SqlToOpportunityTable';
import { PromotionDataService } from '../services/promotionDataService';
import { OpportunityDataService } from '../services/opportunityDataService';
import { supabase } from '@/src/lib/supabase';

interface LeadCanvasProps {
  leads: MQLLead[];
  campaigns: MQLCampaign[];
  onLeadSelect: (lead: MQLLead, columnType?: 'lead' | 'mql' | 'sql' | 'opp') => void;
  onViewTable?: () => void;
}

export const LeadCanvas: React.FC<LeadCanvasProps> = ({ leads, campaigns, onLeadSelect, onViewTable }) => {
  const [canvasView, setCanvasView] = useState<'kanban' | 'mql_table' | 'sql_table'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination states
  const [leadPage, setLeadPage] = useState(1);
  const [mqlPage, setMqlPage] = useState(1);
  const [sqlPage, setSqlPage] = useState(1);
  const [oppPage, setOppPage] = useState(1);

  const CARDS_PER_PAGE = 6;

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setLeadPage(1);
    setMqlPage(1);
    setSqlPage(1);
    setOppPage(1);
  };

  const filteredLeads = leads.filter(lead => {
    const query = searchQuery.toLowerCase();
    const name = `${lead.first_name || ''} ${lead.last_name || ''}`.toLowerCase();
    const company = (lead.company_name || '').toLowerCase();
    return name.includes(query) || company.includes(query);
  });

  const [promotedLeadIds, setPromotedLeadIds] = useState<string[]>(() => PromotionDataService.getCachedPromotedLeadIds());
  const [sqlPromotedLeadIds, setSqlPromotedLeadIds] = useState<string[]>(() => PromotionDataService.getCachedSqlOpportunityPromotedLeadIds());
  const [oppRevenueMap, setOppRevenueMap] = useState<Record<string, number>>(() => OpportunityDataService.getCachedOpportunityEstimatedRevenuesMap());
  const [oppNameMap, setOppNameMap] = useState<Record<string, string>>(() => OpportunityDataService.getCachedOpportunityNamesMap());
  const [oppIdByLeadMap, setOppIdByLeadMap] = useState<Record<string, string>>({});
  const [oppRecordsById, setOppRecordsById] = useState<Record<string, any>>({});
  const [oppFormByOppId, setOppFormByOppId] = useState<Record<string, any>>({});
  const [oppHandoverByOppId, setOppHandoverByOppId] = useState<Record<string, any>>({});
  const [oppSessionByOppId, setOppSessionByOppId] = useState<Record<string, any>>({});
  const [oppResultByOppId, setOppResultByOppId] = useState<Record<string, any>>({});
  const [selectedOppLeadId, setSelectedOppLeadId] = useState<string | null>(null);

  useEffect(() => {
    PromotionDataService.getPromotedLeadIds().then(ids => {
      setPromotedLeadIds(ids);
    }).catch(err => {
      console.error('Failed to load promoted leads from Supabase:', err);
    });

    PromotionDataService.getSqlOpportunityPromotedLeadIds().then(ids => {
      setSqlPromotedLeadIds(ids);
    }).catch(err => {
      console.error('Failed to load SQL to Opportunity promotions from Supabase:', err);
    });

    const loadOpportunityData = () => {
      OpportunityDataService.getOpportunityEstimatedRevenuesMap().then(map => {
        setOppRevenueMap(map);
      }).catch(err => {
        console.error('Failed to load opportunity estimated revenues from Supabase:', err);
      });

      OpportunityDataService.getOpportunityNamesMap().then(map => {
        setOppNameMap(map);
      }).catch(err => {
        console.error('Failed to load opportunity names from Supabase:', err);
      });

      Promise.all([
        supabase.from('opportunities').select('*'),
        supabase.from('sql_opportunity_promotions').select('lead_id, opportunity_id'),
        supabase.from('opportunity_form_records').select('*'),
        supabase.from('opportunity_sql_handover_details').select('*'),
        supabase.from('opportunity_qualification_sessions').select('*'),
        supabase.from('opportunity_qualification_results').select('*').order('created_at', { ascending: false })
      ]).then(([oppsRes, promosRes, formsRes, handoversRes, sessionsRes, resultsRes]) => {
        const nextIdMap: Record<string, string> = {};
        const nextOpps: Record<string, any> = {};
        (promosRes.data || []).forEach((p: any) => {
          if (p.lead_id && p.opportunity_id) nextIdMap[p.lead_id] = p.opportunity_id;
        });
        (oppsRes.data || []).forEach((o: any) => {
          if (o.id) nextOpps[o.id] = o;
          if (o.mql_reference_id && o.id) nextIdMap[o.mql_reference_id] = o.id;
        });
        setOppIdByLeadMap(nextIdMap);
        setOppRecordsById(nextOpps);

        const nextForms: Record<string, any> = {};
        (formsRes.data || []).forEach((f: any) => {
          if (f.opportunity_id) nextForms[f.opportunity_id] = f;
        });
        setOppFormByOppId(nextForms);

        const nextHandovers: Record<string, any> = {};
        (handoversRes.data || []).forEach((h: any) => {
          if (h.opportunity_id) nextHandovers[h.opportunity_id] = h;
        });
        setOppHandoverByOppId(nextHandovers);

        const nextSessions: Record<string, any> = {};
        (sessionsRes.data || []).forEach((s: any) => {
          if (!s.opportunity_id) return;
          const prev = nextSessions[s.opportunity_id];
          if (!prev) {
            nextSessions[s.opportunity_id] = s;
          } else {
            const prevTime = new Date(prev.updated_at || prev.created_at || 0).getTime();
            const curTime = new Date(s.updated_at || s.created_at || 0).getTime();
            if (curTime > prevTime) nextSessions[s.opportunity_id] = s;
          }
        });
        setOppSessionByOppId(nextSessions);

        const nextResults: Record<string, any> = {};
        (resultsRes.data || []).forEach((r: any) => {
          if (r.opportunity_id && !nextResults[r.opportunity_id]) {
            nextResults[r.opportunity_id] = r;
          }
        });
        setOppResultByOppId(nextResults);
      }).catch(() => {});
    };

    loadOpportunityData();

    const handleFormUpdate = () => {
      loadOpportunityData();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('opportunity_form_updated', handleFormUpdate);
      window.addEventListener('opportunity_qualification_updated', handleFormUpdate);
      window.addEventListener('storage', handleFormUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('opportunity_form_updated', handleFormUpdate);
        window.removeEventListener('opportunity_qualification_updated', handleFormUpdate);
        window.removeEventListener('storage', handleFormUpdate);
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedOppLeadId) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedOppLeadId(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selectedOppLeadId]);

  const allLeads = filteredLeads;
  const mqlLeads = filteredLeads.filter(l => l.handover_status === 'Handover to Sales');
  const sqlLeads = filteredLeads.filter(l => l.status === 'SQL' || promotedLeadIds.includes(l.id));
  
  // Render any opportunity associated with leads present in sql_opportunity_promotions
  const opportunityLeads = filteredLeads.filter(l => 
    sqlPromotedLeadIds.includes(l.id) ||
    (l as any).is_opportunity === true || 
    (l.status as string) === 'Opportunity'
  );

  const getPaginatedItems = (items: any[], page: number) => {
    const totalPages = Math.ceil(items.length / CARDS_PER_PAGE) || 1;
    const boundedPage = Math.min(page, totalPages);
    const start = (boundedPage - 1) * CARDS_PER_PAGE;
    return items.slice(start, start + CARDS_PER_PAGE);
  };

  const paginatedAllLeads = getPaginatedItems(allLeads, leadPage);
  const paginatedMqlLeads = getPaginatedItems(mqlLeads, mqlPage);
  const paginatedSqlLeads = getPaginatedItems(sqlLeads, sqlPage);
  const paginatedOpportunityLeads = getPaginatedItems(opportunityLeads, oppPage);

  const PaginationControls = ({ 
    currentPage, 
    totalItems, 
    onPageChange 
  }: { 
    currentPage: number; 
    totalItems: number; 
    onPageChange: (page: number) => void; 
  }) => {
    const totalPages = Math.ceil(totalItems / CARDS_PER_PAGE) || 1;
    const boundedPage = Math.min(Math.max(1, currentPage), totalPages);

    return (
      <div className="flex items-center justify-between px-2 py-1.5 bg-bg-surface/50 border border-border/60 rounded-xl mt-2 select-none">
        <button
          onClick={() => onPageChange(Math.max(1, boundedPage - 1))}
          disabled={boundedPage <= 1}
          className="p-1 rounded-lg hover:bg-bg-primary disabled:opacity-30 disabled:hover:bg-transparent text-text-secondary hover:text-text-primary transition-colors cursor-pointer disabled:cursor-not-allowed"
          title="Previous Page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] font-bold font-mono text-text-secondary uppercase">
          Page {boundedPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, boundedPage + 1))}
          disabled={boundedPage >= totalPages}
          className="p-1 rounded-lg hover:bg-bg-primary disabled:opacity-30 disabled:hover:bg-transparent text-text-secondary hover:text-text-primary transition-colors cursor-pointer disabled:cursor-not-allowed"
          title="Next Page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  const calcRatio = (num: number, denom: number) => {
    if (denom === 0) return 0;
    return Math.round((num / denom) * 100);
  };

  const leadToMqlRatio = calcRatio(mqlLeads.length, allLeads.length);
  const mqlToSqlRatio = calcRatio(sqlLeads.length, mqlLeads.length);
  const sqlToOppRatio = calcRatio(opportunityLeads.length, sqlLeads.length);
  const leadToOppRatio = calcRatio(opportunityLeads.length, allLeads.length);

  // Helper to extract Estimated Revenue defined in Opportunity Form
  const getOpportunityEstimatedRevenue = (lead: MQLLead): number => {
    // 1. Check direct map loaded from Opportunity Form records (matched by lead.id or opportunity.id)
    if (oppRevenueMap[lead.id] !== undefined && oppRevenueMap[lead.id] > 0) {
      return oppRevenueMap[lead.id];
    }
    // 2. Check localStorage isolated card edits or form drafts
    if (typeof window !== 'undefined') {
      const oppCardEdits = localStorage.getItem(`opp_isolated_card_edits_${lead.id}`);
      if (oppCardEdits) {
        try {
          const parsed = JSON.parse(oppCardEdits);
          if (parsed.estimated_revenue) {
            const num = parseFloat(String(parsed.estimated_revenue).replace(/[^0-9.]/g, ''));
            if (!isNaN(num) && num > 0) return num;
          }
        } catch (e) {}
      }

      const sqlCardEdits = localStorage.getItem(`sql_isolated_card_edits_${lead.id}`);
      if (sqlCardEdits) {
        try {
          const parsed = JSON.parse(sqlCardEdits);
          if (parsed.estimated_revenue) {
            const num = parseFloat(String(parsed.estimated_revenue).replace(/[^0-9.]/g, ''));
            if (!isNaN(num) && num > 0) return num;
          }
        } catch (e) {}
      }
    }
    // 3. Fallback: check if lead object itself contains estimated_revenue from opportunity table
    if ((lead as any).estimated_revenue) {
      const num = parseFloat(String((lead as any).estimated_revenue).replace(/[^0-9.]/g, ''));
      if (!isNaN(num) && num > 0) return num;
    }
    // Never fall back to company annual revenue (which represents company turnover, not opportunity deal size)
    return 0;
  };

  // Accumulated number by summing up the "Estimated Revenue" in the Opportunity Form of all opportunities listed in this Opportunity Column
  const totalOppAmount = opportunityLeads.reduce((acc, curr) => {
    return acc + getOpportunityEstimatedRevenue(curr);
  }, 0);

  const formattedOppAmount = totalOppAmount > 0 
    ? `$${totalOppAmount.toLocaleString('en-US')}` 
    : '$0';

  // Kanban Card Component
  const KanbanCard = ({ title, count, ratioText, ratioNum, amount }: { title: string, count: number, ratioText?: string, ratioNum?: number, amount?: string }) => (
    <div className="h-[88px] bg-gradient-to-br from-bg-surface to-accent/[0.03] dark:to-accent/[0.06] border border-accent rounded-xl p-3 flex justify-between items-center shadow-sm hover:shadow-md hover:shadow-accent/5 hover:scale-[1.01] transition-all duration-300 relative overflow-hidden group select-none">
      {/* Decorative subtle accent gradient background glow */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-accent/80" />
      
      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-xs font-black text-text-primary font-sans tracking-tight uppercase">{title}</span>
          <span className="inline-flex items-center justify-center text-[9px] font-black font-mono px-1.5 py-0.5 rounded-full bg-accent/10 border border-accent/25 text-accent shadow-sm">
            {count}
          </span>
        </div>
        {ratioText ? (
          <div className="text-[9px] font-bold text-text-secondary uppercase tracking-wider font-mono opacity-80 truncate">{ratioText}</div>
        ) : (
          <div className="text-[9px] font-bold text-text-secondary uppercase tracking-wider font-mono opacity-80 truncate">Active Pipeline Value</div>
        )}
        {amount !== undefined && (
          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-green-500/10 border border-green-500/25 text-green-500 font-mono font-black text-[10px] mt-1 shadow-sm">
            Opp: {amount}
          </div>
        )}
      </div>
      
      <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
        <svg className="w-full h-full transform -rotate-90 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.05)]" viewBox="0 0 36 36">
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
            strokeDasharray={`${ratioNum !== undefined ? ratioNum : 100}, 100`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-[9px] font-black text-text-primary font-mono">
          {ratioNum !== undefined ? `${ratioNum}%` : '100%'}
        </span>
      </div>
    </div>
  );

  const getIsolatedLead = (lead: MQLLead, type: 'lead' | 'mql' | 'sql' | 'opp') => {
    if (type === 'sql') {
      const stored = localStorage.getItem(`sql_isolated_card_edits_${lead.id}`);
      if (stored) {
        try {
          return { ...lead, ...JSON.parse(stored) };
        } catch (e) {
          return lead;
        }
      }
    }
    if (type === 'opp') {
      const stored = localStorage.getItem(`opp_isolated_card_edits_${lead.id}`);
      if (stored) {
        try {
          return { ...lead, ...JSON.parse(stored) };
        } catch (e) {
          return lead;
        }
      }
    }
    return lead;
  };

  const getCampaignName = (id: string) => {
    return campaigns.find(c => c.id === id)?.name || 'Unknown Campaign';
  };

  const getLeadTags = (lead: MQLLead, type: 'lead' | 'mql' | 'sql' | 'opp') => {
    const isQual = lead.status && (lead.status.includes('Qualified') || lead.status === 'Highly Qualified MQL');
    const isDisqual = lead.status?.includes('Disqualified');
    const isNurture = lead.status?.includes('Nurture');
    const isHandover = lead.handover_status === 'Handover to Sales';
    const isPromoted = promotedLeadIds.includes(lead.id) || lead.status === 'SQL';
    const isPromotedToOpp = sqlPromotedLeadIds.includes(lead.id);

    let mqlTag = null;
    if (isPromoted && type === 'mql') {
      mqlTag = <span className="px-1.5 py-0.5 rounded bg-blue-500 text-white border border-blue-600 text-[8px] font-black uppercase tracking-wider shadow-sm">SQL</span>;
    } else if (isQual) {
      mqlTag = <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30 text-[8px] font-black uppercase tracking-wider">MQL</span>;
    } else if (isDisqual) {
      mqlTag = <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 text-[8px] font-black uppercase tracking-wider">Disqualified</span>;
    } else if (isNurture) {
      mqlTag = <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[8px] font-black uppercase tracking-wider">Nurture</span>;
    } else {
      mqlTag = <span className="px-1.5 py-0.5 rounded border border-border text-text-secondary text-[8px] font-black uppercase tracking-wider">Lead</span>;
    }

    let handoverTag = null;
    if (isHandover) {
      handoverTag = <span className="px-1.5 py-0.5 rounded bg-[#00a3ff] text-white border border-[#00a3ff]/30 text-[8px] font-black uppercase tracking-wider shadow-sm shadow-[#00a3ff]/20">Handover</span>;
    } else if (isDisqual) {
      handoverTag = <span className="px-1.5 py-0.5 rounded bg-red-500 text-white border border-red-600 text-[8px] font-black uppercase tracking-wider shadow-sm">Disqualified</span>;
    } else if (isNurture) {
      handoverTag = <span className="px-1.5 py-0.5 rounded bg-transparent border border-border text-text-secondary text-[8px] font-black uppercase tracking-wider">Nurture</span>;
    }

    let sqlTag = null;
    if (isPromotedToOpp) {
      // If lead.id is in sql_opportunity_promotions, the SQL card displays the Opportunity tag (blue badge) replacing the SQL tag
      sqlTag = (
        <span className="px-1.5 py-0.5 rounded bg-[#00a3ff] text-white border border-[#00a3ff]/40 text-[8px] font-black uppercase tracking-wider shadow-sm shadow-[#00a3ff]/20">
          Opportunity
        </span>
      );
    } else if (lead.status === 'SQL' || isPromoted) {
      sqlTag = <span className="px-1.5 py-0.5 rounded bg-blue-500 text-white border border-blue-600 text-[8px] font-black uppercase tracking-wider shadow-sm">SQL</span>;
    } else if (isDisqual) {
      sqlTag = <span className="px-1.5 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black border border-border text-[8px] font-black uppercase tracking-wider shadow-sm">Disqualified</span>;
    }

    let oppTag = (
      <span className="px-1.5 py-0.5 rounded bg-[#00a3ff] text-white border border-[#00a3ff]/40 text-[8px] font-black uppercase tracking-wider shadow-sm shadow-[#00a3ff]/20">
        Opportunity
      </span>
    );

    const assessPipelineUrl = getAssessPipelineUrl(lead);

    return (
      <div className="flex flex-col items-end gap-1.5 mt-2">
        {type === 'lead' && (
          <>
            {isHandover ? (
              <span className="px-1.5 py-0.5 rounded bg-[#00a3ff] text-white border border-[#00a3ff]/30 text-[8px] font-black uppercase tracking-wider shadow-sm shadow-[#00a3ff]/20">Handover</span>
            ) : isQual ? (
              <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30 text-[8px] font-black uppercase tracking-wider">MQL</span>
            ) : isNurture ? (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[8px] font-black uppercase tracking-wider">Nurture</span>
            ) : isDisqual ? (
              <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 text-[8px] font-black uppercase tracking-wider">Disqualified</span>
            ) : (
              <span className="px-1.5 py-0.5 rounded border border-border text-text-secondary text-[8px] font-black uppercase tracking-wider">Lead</span>
            )}
          </>
        )}
        {type === 'mql' && (
          <>
            {mqlTag}
          </>
        )}
        {type === 'sql' && (
          <>
            {sqlTag}
          </>
        )}
        {type === 'opp' && (
          <>
            <Link
              to={assessPipelineUrl}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-accent/15 hover:bg-accent text-accent hover:text-black border border-accent/30 text-[9px] font-bold whitespace-nowrap shrink-0 transition-colors"
              title="Open Pipeline Assessment Bridge"
            >
              <span>Assess Pipeline</span>
              <ArrowUpRight className="w-2.5 h-2.5" />
            </Link>
            {oppTag}
          </>
        )}
      </div>
    );
  };

  const getAssessPipelineUrl = (lead: MQLLead): string => {
    return `/product/revos/pipeline?opportunityId=${encodeURIComponent(oppIdByLeadMap[lead.id] || lead.id)}&leadId=${encodeURIComponent(lead.id)}&source=lead_canvas_opp`;
  };

  const getOpportunityName = (lead: MQLLead): string => {
    // 1. Check isolated card edits for SQL card
    if (typeof window !== 'undefined') {
      const sqlCardEdits = localStorage.getItem(`sql_isolated_card_edits_${lead.id}`);
      if (sqlCardEdits) {
        try {
          const parsed = JSON.parse(sqlCardEdits);
          if (parsed.opportunity_name) return parsed.opportunity_name;
        } catch (e) {}
      }
    }
    // 2. Check oppNameMap (from opportunities, form records, and promotions)
    if (oppNameMap[lead.id]) {
      return oppNameMap[lead.id];
    }
    // 3. Check lead properties if present
    if ((lead as any).opportunity_name) {
      return (lead as any).opportunity_name;
    }
    // 4. Default to Company Name + "Opportunity"
    return `${lead.company_name || 'Enterprise'} Opportunity`;
  };

  const resolveOpportunityTooltipDetails = (lead: MQLLead) => {
    const currentLead = getIsolatedLead(lead, 'opp');
    const resolvedOppId = oppIdByLeadMap[lead.id];
    const opp =
      (resolvedOppId ? oppRecordsById[resolvedOppId] : undefined) ||
      Object.values(oppRecordsById).find(
        (o: any) =>
          o.mql_reference_id === lead.id ||
          (o.company_name &&
            lead.company_name &&
            o.company_name.toLowerCase().trim() === lead.company_name.toLowerCase().trim())
      );
    const effectiveOppId = opp?.id || resolvedOppId;
    const formRecord = effectiveOppId ? oppFormByOppId[effectiveOppId] : undefined;
    const handover = effectiveOppId ? oppHandoverByOppId[effectiveOppId] : undefined;
    const session = effectiveOppId ? oppSessionByOppId[effectiveOppId] : undefined;
    const oqResult = effectiveOppId ? oppResultByOppId[effectiveOppId] : undefined;

    let parsedDesc: any = {};
    if (opp?.description && typeof opp.description === 'string' && opp.description.trim().startsWith('{')) {
      try {
        parsedDesc = JSON.parse(opp.description);
      } catch {}
    }

    const companyName =
      formRecord?.company_name || opp?.company_name || currentLead.company_name || '—';
    const opportunityName =
      formRecord?.opportunity_name ||
      opp?.opportunity_name ||
      getOpportunityName(currentLead);

    let extraBusinessSegment = '';
    if (typeof window !== 'undefined') {
      const extraJson = localStorage.getItem(`mql_lead_extra_${lead.id}`);
      if (extraJson) {
        try {
          const parsedExtra = JSON.parse(extraJson);
          extraBusinessSegment = parsedExtra.business_segment || parsedExtra.lead_industry || '';
        } catch {}
      }
    }

    const businessSegment =
      handover?.sql_qip_package?.company_context?.business_segment ||
      handover?.company_context?.business_segment ||
      handover?.editable_fields?.business_segment ||
      formRecord?.business_segment ||
      extraBusinessSegment ||
      currentLead.lead_industry ||
      opp?.industry ||
      '—';

    const opportunityOwner =
      formRecord?.opportunity_owner ||
      handover?.editable_fields?.opportunity_owner ||
      parsedDesc.opportunity_owner ||
      opp?.opportunity_owner ||
      'Senior Enterprise AE';

    const revenueMotion =
      formRecord?.revenue_motion ||
      handover?.editable_fields?.revenue_motion ||
      handover?.sql_qip_package?.revenue_motion_context?.revenue_motion ||
      session?.revenue_motion ||
      opp?.revenue_motion ||
      parsedDesc.revenue_motion ||
      'Digital Solution Selling';

    const industryConfiguration =
      formRecord?.industry ||
      handover?.editable_fields?.industry ||
      handover?.sql_qip_package?.company_context?.industry ||
      session?.industry ||
      opp?.industry ||
      parsedDesc.industry ||
      currentLead.lead_industry ||
      'Enterprise Software';

    const pipelineStage =
      formRecord?.pipeline_stage ||
      handover?.editable_fields?.pipeline_stage ||
      parsedDesc.pipeline_stage ||
      'Qualification';

    const opportunityStage =
      formRecord?.opportunity_stage ||
      handover?.editable_fields?.opportunity_stage ||
      parsedDesc.opportunity_stage ||
      'Emerging Opportunity';

    const rawEstRev =
      formRecord?.estimated_revenue ||
      handover?.editable_fields?.estimated_revenue ||
      parsedDesc.estimated_revenue;
    const revNum = getOpportunityEstimatedRevenue(currentLead);
    let estimatedRevenueValue = '—';
    if (revNum > 0) {
      estimatedRevenueValue = `$${revNum.toLocaleString('en-US')}`;
    } else if (rawEstRev) {
      estimatedRevenueValue = String(rawEstRev);
    }

    const expectedCloseDate =
      formRecord?.expected_close_date ||
      handover?.editable_fields?.expected_close_date ||
      parsedDesc.expected_close_date ||
      '—';

    const rawScore =
      oqResult?.overall_score ??
      oqResult?.final_decision?.qualification_summary?.overall_score ??
      (session?.qualification_status && session.qualification_status !== 'NOT_STARTED'
        ? session.overall_score
        : null);
    const oqScore =
      typeof rawScore === 'number' && rawScore > 0 ? Math.round(rawScore) : null;

    const rawStatus =
      oqResult?.qualification_status ||
      oqResult?.final_decision?.qualification_summary?.qualification_status ||
      (session?.qualification_status && session.qualification_status !== 'NOT_STARTED'
        ? session.qualification_status
        : null);
    const oqStatus = rawStatus || 'Not Assessed';

    return {
      opportunityName,
      companyName,
      businessSegment,
      opportunityOwner,
      revenueMotion,
      industryConfiguration,
      pipelineStage,
      opportunityStage,
      estimatedRevenueValue,
      expectedCloseDate,
      oqScore,
      oqStatus,
      assessPipelineUrl: getAssessPipelineUrl(currentLead)
    };
  };

  const selectedOppTooltip = useMemo(() => {
    if (!selectedOppLeadId) return null;
    const targetLead = leads.find((l) => l.id === selectedOppLeadId);
    if (!targetLead) return null;
    return resolveOpportunityTooltipDetails(targetLead);
  }, [
    selectedOppLeadId,
    leads,
    oppIdByLeadMap,
    oppRecordsById,
    oppFormByOppId,
    oppHandoverByOppId,
    oppSessionByOppId,
    oppResultByOppId,
    oppRevenueMap,
    oppNameMap
  ]);

  const getOqStatusBadgeClass = (status: string) => {
    const u = status.toUpperCase();
    if (u.includes('DISQUALIFIED')) {
      return 'bg-red-500/15 text-red-500 border-red-500/30';
    }
    if (u.includes('CONDITIONALLY') || u.includes('CONDITIONAL') || u.includes('ON_HOLD')) {
      return 'bg-amber-500/15 text-amber-500 border-amber-500/30';
    }
    if (u.includes('INSUFFICIENT') || u.includes('EVIDENCE')) {
      return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
    }
    if (u.includes('QUALIFIED')) {
      return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30';
    }
    return 'bg-bg-primary text-text-secondary border-border';
  };

  const LeadCard = ({ lead, type }: { lead: MQLLead, type: 'lead' | 'mql' | 'sql' | 'opp' }) => {
    const currentLead = getIsolatedLead(lead, type);
    return (
      <div 
        onClick={() => {
          if (type === 'opp') {
            setSelectedOppLeadId(currentLead.id);
          } else {
            onLeadSelect(currentLead, type);
          }
        }}
        className="bg-bg-surface border border-border rounded-xl p-3 cursor-pointer hover:border-accent/50 hover:shadow-md transition-all group flex flex-col gap-1.5"
      >
        <div className="flex justify-between items-start">
          <span className="px-2 py-0.5 rounded bg-bg-primary/50 text-text-secondary text-[10px] font-medium truncate max-w-[120px] lg:max-w-[140px]">
            {currentLead.company_name || 'Unknown Co'}
          </span>
          <Edit className="w-3.5 h-3.5 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </div>
        
        <div className="mt-1">
          {(type === 'sql' || type === 'opp') ? (
            <h4 className="text-sm font-bold text-text-primary font-sans leading-tight truncate" title={getOpportunityName(currentLead)}>
              {getOpportunityName(currentLead)}
            </h4>
          ) : (
            <h4 className="text-sm font-bold text-text-primary font-sans leading-tight truncate">
              {currentLead.first_name} {currentLead.last_name}
            </h4>
          )}
          {(type === 'lead' || type === 'mql') && (
            <p className="text-xs font-semibold text-text-primary mt-0.5 truncate text-opacity-80">
              {getCampaignName(currentLead.campaign_id)}
            </p>
          )}
          {type === 'sql' && (
            <p className="text-xs font-semibold text-text-primary mt-0.5">
              {getOpportunityEstimatedRevenue(currentLead) > 0
                ? `$${getOpportunityEstimatedRevenue(currentLead).toLocaleString('en-US')}`
                : '—'}
            </p>
          )}
          {type === 'opp' && (
            <p className="text-xs font-semibold text-text-primary mt-0.5">
              {getOpportunityEstimatedRevenue(currentLead) > 0
                ? `$${getOpportunityEstimatedRevenue(currentLead).toLocaleString('en-US')}`
                : '—'}
            </p>
          )}
        </div>

        <div className="flex justify-between items-end mt-1.5 gap-2">
          <div className="flex flex-wrap gap-1.5 items-center">
            {currentLead.lead_industry && (
              <span className="px-1.5 py-0.5 rounded border border-border text-text-secondary text-[9px] font-medium truncate max-w-[70px]">
                {currentLead.lead_industry}
              </span>
            )}
            {currentLead.job_title && (
              <span className="px-1.5 py-0.5 rounded border border-border text-text-secondary text-[9px] font-medium truncate max-w-[80px]">
                {currentLead.job_title}
              </span>
            )}
          </div>
          {getLeadTags(currentLead, type)}
        </div>
      </div>
    );
  };

  if (canvasView === 'mql_table') {
    return (
      <MqlToSqlTable 
        leads={leads}
        campaigns={campaigns}
        onBack={() => setCanvasView('kanban')}
        onLeadSelect={onLeadSelect}
      />
    );
  }

  if (canvasView === 'sql_table') {
    return (
      <SqlToOpportunityTable 
        leads={leads}
        sqlLeads={sqlLeads}
        onBack={() => setCanvasView('kanban')}
        onLeadSelect={onLeadSelect}
      />
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text-primary font-sans">Lead Canvas</h2>
        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-bg-surface border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent/50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden pb-4">
        <div className="flex gap-3 h-full w-full items-start">
          
          {/* Lead Column */}
          <div className="flex-1 flex flex-col gap-3 h-full min-w-[200px]">
            <KanbanCard 
              title="Lead" 
              count={allLeads.length} 
              ratioText={`Lead -> MQL ${leadToMqlRatio}%`} 
              ratioNum={leadToMqlRatio} 
            />
            <div className="flex justify-end -mt-1 -mb-1 px-1">
              <button onClick={onViewTable} className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors text-text-secondary hover:text-text-primary" title="Table View">
                <Table className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar-vertical flex flex-col gap-3 pb-2">
              {paginatedAllLeads.map(lead => (
                <LeadCard key={lead.id} lead={lead} type="lead" />
              ))}
              {allLeads.length === 0 && (
                <div className="p-8 text-center text-text-secondary text-sm border border-dashed border-border rounded-xl">
                  No leads found
                </div>
              )}
            </div>
            <PaginationControls 
              currentPage={leadPage} 
              totalItems={allLeads.length} 
              onPageChange={setLeadPage} 
            />
          </div>

          {/* MQL Column */}
          <div className="flex-1 flex flex-col gap-3 h-full min-w-[200px]">
            <KanbanCard 
              title="MQL" 
              count={mqlLeads.length} 
              ratioText={`MQL -> SQL ${mqlToSqlRatio}%`} 
              ratioNum={mqlToSqlRatio} 
            />
            <div className="flex justify-end -mt-1 -mb-1 px-1">
              <button 
                onClick={() => setCanvasView('mql_table')}
                className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors text-text-secondary hover:text-text-primary cursor-pointer animate-pulse" 
                title="MQL Table View"
              >
                <Table className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar-vertical flex flex-col gap-3 pb-2">
              {paginatedMqlLeads.map(lead => (
                <LeadCard key={lead.id} lead={lead} type="mql" />
              ))}
              {mqlLeads.length === 0 && (
                <div className="p-8 text-center text-text-secondary text-sm border border-dashed border-border rounded-xl">
                  No MQL leads found
                </div>
              )}
            </div>
            <PaginationControls 
              currentPage={mqlPage} 
              totalItems={mqlLeads.length} 
              onPageChange={setMqlPage} 
            />
          </div>

          {/* SQL Column */}
          <div className="flex-1 flex flex-col gap-3 h-full min-w-[200px]">
            <KanbanCard 
              title="SQL" 
              count={sqlLeads.length} 
              ratioText={`SQL -> Opp ${sqlToOppRatio}%`} 
              ratioNum={sqlToOppRatio} 
            />
            <div className="flex justify-end -mt-1 -mb-1 px-1">
              <button 
                onClick={() => setCanvasView('sql_table')}
                className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors text-text-secondary hover:text-text-primary cursor-pointer animate-pulse" 
                title="SQL Table View"
              >
                <Table className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar-vertical flex flex-col gap-3 pb-2">
              {paginatedSqlLeads.map(lead => (
                <LeadCard key={lead.id} lead={lead} type="sql" />
              ))}
              {sqlLeads.length === 0 && (
                <div className="p-8 text-center text-text-secondary text-sm border border-dashed border-border rounded-xl">
                  No SQL leads found
                </div>
              )}
            </div>
            <PaginationControls 
              currentPage={sqlPage} 
              totalItems={sqlLeads.length} 
              onPageChange={setSqlPage} 
            />
          </div>

          {/* Opportunity Column */}
          <div className="flex-1 flex flex-col gap-3 h-full min-w-[200px]">
            <KanbanCard 
              title="Opportunity" 
              count={opportunityLeads.length} 
              ratioText={`Lead -> Opp ${leadToOppRatio}%`}
              amount={formattedOppAmount}
              ratioNum={leadToOppRatio}
            />
            <div className="flex justify-end -mt-1 -mb-1 px-1">
              <div className="p-1 text-text-secondary/50" title="Table View (Opportunity)">
                <Table className="w-4 h-4" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar-vertical flex flex-col gap-3 pb-2">
              {paginatedOpportunityLeads.map(lead => (
                <LeadCard key={lead.id} lead={lead} type="opp" />
              ))}
              {opportunityLeads.length === 0 && (
                <div className="p-8 text-center text-text-secondary text-sm border border-dashed border-border rounded-xl">
                  No opportunities found
                </div>
              )}
            </div>
            <PaginationControls 
              currentPage={oppPage} 
              totalItems={opportunityLeads.length} 
              onPageChange={setOppPage} 
            />
          </div>

        </div>
      </div>

      {/* Centered Opportunity Card Tooltip (Matches Lead Dashboard Heatmap Modal Behavior) */}
      {typeof document !== 'undefined' &&
        selectedOppTooltip &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setSelectedOppLeadId(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`Opportunity Details — ${selectedOppTooltip.opportunityName}`}
              className="w-full max-w-2xl max-h-[85vh] bg-bg-surface border border-border rounded-2xl shadow-2xl relative flex flex-col my-auto overflow-hidden animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-border bg-bg-primary/40 flex items-start justify-between gap-4 shrink-0">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#00a3ff]/15 border border-[#00a3ff]/30 text-[#00a3ff] uppercase tracking-wider">
                      Opportunity Record
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold border ${getOqStatusBadgeClass(
                        selectedOppTooltip.oqStatus
                      )}`}
                    >
                      {selectedOppTooltip.oqStatus}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-text-primary tracking-tight mt-1.5">
                    {selectedOppTooltip.opportunityName}
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {selectedOppTooltip.companyName}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedOppLeadId(null)}
                  className="p-1.5 rounded-lg hover:bg-bg-primary text-text-secondary hover:text-text-primary transition-colors cursor-pointer shrink-0"
                  title="Close"
                  aria-label="Close Opportunity Tooltip"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content-Fit Body */}
              <div className="overflow-y-auto custom-scrollbar-vertical p-5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-bg-primary/50 border border-border">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary block">
                      Opportunity name
                    </span>
                    <span className="text-xs font-bold text-text-primary mt-0.5 block">
                      {selectedOppTooltip.opportunityName}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-bg-primary/50 border border-border">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary block">
                      Company Name
                    </span>
                    <span className="text-xs font-bold text-text-primary mt-0.5 block">
                      {selectedOppTooltip.companyName}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-bg-primary/50 border border-border">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary block">
                      Business Segment
                    </span>
                    <span className="text-xs font-semibold text-text-primary mt-0.5 block">
                      {selectedOppTooltip.businessSegment}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-bg-primary/50 border border-border">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary block">
                      Opportunity Owner
                    </span>
                    <span className="text-xs font-semibold text-text-primary mt-0.5 block">
                      {selectedOppTooltip.opportunityOwner}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-bg-primary/50 border border-border">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary block">
                      Revenue Motion
                    </span>
                    <span className="text-xs font-semibold text-text-primary mt-0.5 block">
                      {selectedOppTooltip.revenueMotion}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-bg-primary/50 border border-border">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary block">
                      Industry Configuration
                    </span>
                    <span className="text-xs font-semibold text-text-primary mt-0.5 block">
                      {selectedOppTooltip.industryConfiguration}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-bg-primary/50 border border-border">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary block">
                      Pipeline Stage
                    </span>
                    <span className="text-xs font-semibold text-text-primary mt-0.5 block">
                      {selectedOppTooltip.pipelineStage}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-bg-primary/50 border border-border">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary block">
                      Opportunity Stage
                    </span>
                    <span className="text-xs font-semibold text-text-primary mt-0.5 block">
                      {selectedOppTooltip.opportunityStage}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-bg-primary/50 border border-border">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary block">
                      Estimated Revenue Value
                    </span>
                    <span className="text-sm font-black font-mono tabular-nums text-emerald-500 mt-0.5 block">
                      {selectedOppTooltip.estimatedRevenueValue}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-bg-primary/50 border border-border">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary block">
                      Expected Close Date
                    </span>
                    <span className="text-xs font-mono tabular-nums font-semibold text-text-primary mt-0.5 block">
                      {selectedOppTooltip.expectedCloseDate}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-bg-primary/50 border border-border">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary block">
                      OQ Score
                    </span>
                    <span className="text-sm font-black font-mono tabular-nums text-accent mt-0.5 block">
                      {selectedOppTooltip.oqScore !== null
                        ? `${selectedOppTooltip.oqScore} / 100`
                        : 'Not Assessed'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-bg-primary/50 border border-border">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary block">
                      Opportunity Qualification Status
                    </span>
                    <span
                      className={`inline-flex items-center mt-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getOqStatusBadgeClass(
                        selectedOppTooltip.oqStatus
                      )}`}
                    >
                      {selectedOppTooltip.oqStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-border bg-bg-surface flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedOppLeadId(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-border text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-primary transition-colors cursor-pointer"
                >
                  Close
                </button>
                <Link
                  to={selectedOppTooltip.assessPipelineUrl}
                  onClick={() => setSelectedOppLeadId(null)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent text-white text-xs font-bold hover:bg-accent/90 transition-all cursor-pointer shadow-sm"
                >
                  <span>Assess Pipeline</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
