import React, { useState, useEffect } from 'react';
import { MQLLead, MQLCampaign } from '../../types/mql';
import { Search, Edit, LayoutGrid, ChevronRight, ChevronLeft, CheckCircle2, AlertTriangle, AlertCircle, Table } from 'lucide-react';
import { MqlToSqlTable } from './MqlToSqlTable';
import { PromotionDataService } from '../services/promotionDataService';

interface LeadCanvasProps {
  leads: MQLLead[];
  campaigns: MQLCampaign[];
  onLeadSelect: (lead: MQLLead, columnType?: 'lead' | 'mql' | 'sql' | 'opp') => void;
  onViewTable?: () => void;
}

export const LeadCanvas: React.FC<LeadCanvasProps> = ({ leads, campaigns, onLeadSelect, onViewTable }) => {
  const [canvasView, setCanvasView] = useState<'kanban' | 'mql_table'>('kanban');
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

  const [promotedLeadIds, setPromotedLeadIds] = useState<string[]>([]);

  useEffect(() => {
    PromotionDataService.getPromotedLeadIds().then(ids => {
      setPromotedLeadIds(ids);
    }).catch(err => {
      console.error('Failed to load promoted leads from Supabase:', err);
    });
  }, []);

  const allLeads = filteredLeads;
  const mqlLeads = filteredLeads.filter(l => 
    (l.status && (l.status.includes('Qualified') || l.status === 'Highly Qualified MQL')) ||
    promotedLeadIds.includes(l.id) ||
    l.status === 'SQL'
  );
  const sqlLeads = filteredLeads.filter(l => l.status === 'SQL' || promotedLeadIds.includes(l.id));
  // For Opportunity, we don't have a strict DB field, so let's mock it for the demo using a subset of SQL leads
  // or we can just say if handover_status is 'Opportunity' (though it might just be 'Handover to Sales' right now)
  // Let's assume Opportunity is a subset of SQL where some opportunity field is true. We'll simulate it by checking if annual_revenue > 0 or randomly.
  // Wait, let's check if the DB has any 'opportunity' status. We will just use `status === 'Opportunity'` if it exists, otherwise mock it.
  const opportunityLeads = filteredLeads.filter(l => (l as any).is_opportunity === true || (l.status as string) === 'Opportunity');

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
    if (totalPages <= 1) return null;

    const boundedPage = Math.min(currentPage, totalPages);

    return (
      <div className="flex items-center justify-between px-2 py-1.5 bg-bg-surface/50 border border-border/60 rounded-xl mt-2 select-none">
        <button
          onClick={() => onPageChange(Math.max(1, boundedPage - 1))}
          disabled={boundedPage === 1}
          className="p-1 rounded-lg hover:bg-bg-primary disabled:opacity-30 disabled:hover:bg-transparent text-text-secondary hover:text-text-primary transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] font-bold font-mono text-text-secondary uppercase">
          Page {boundedPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, boundedPage + 1))}
          disabled={boundedPage === totalPages}
          className="p-1 rounded-lg hover:bg-bg-primary disabled:opacity-30 disabled:hover:bg-transparent text-text-secondary hover:text-text-primary transition-colors cursor-pointer disabled:cursor-not-allowed"
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
            {amount}
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
    if (lead.status === 'SQL' || isPromoted) {
      sqlTag = <span className="px-1.5 py-0.5 rounded bg-blue-500 text-white border border-blue-600 text-[8px] font-black uppercase tracking-wider shadow-sm">SQL</span>;
    } else if (isDisqual) {
      sqlTag = <span className="px-1.5 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black border border-border text-[8px] font-black uppercase tracking-wider shadow-sm">Disqualified</span>;
    }

    let oppTag = null;
    if ((lead as any).is_opportunity || lead.status === 'Opportunity') {
      oppTag = <span className="px-1.5 py-0.5 rounded bg-green-500 text-white border border-green-600 text-[8px] font-black uppercase tracking-wider shadow-sm">Opportunity</span>;
    }

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
            {mqlTag}
            {sqlTag}
            {oppTag}
          </>
        )}
      </div>
    );
  };

  const LeadCard = ({ lead, type }: { lead: MQLLead, type: 'lead' | 'mql' | 'sql' | 'opp' }) => {
    const currentLead = getIsolatedLead(lead, type);
    return (
      <div 
        onClick={() => onLeadSelect(currentLead, type)}
        className="bg-bg-surface border border-border rounded-xl p-3 cursor-pointer hover:border-accent/50 hover:shadow-md transition-all group flex flex-col gap-1.5"
      >
        <div className="flex justify-between items-start">
          <span className="px-2 py-0.5 rounded bg-bg-primary/50 text-text-secondary text-[10px] font-medium truncate max-w-[120px] lg:max-w-[140px]">
            {currentLead.company_name || 'Unknown Co'}
          </span>
          <Edit className="w-3.5 h-3.5 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </div>
        
        <div className="mt-1">
          <h4 className="text-sm font-bold text-text-primary font-sans leading-tight truncate">
            {currentLead.first_name} {currentLead.last_name}
          </h4>
          {(type === 'lead' || type === 'mql') && (
            <p className="text-xs font-semibold text-text-primary mt-0.5 truncate text-opacity-80">
              {getCampaignName(currentLead.campaign_id)}
            </p>
          )}
          {(type === 'sql' || type === 'opp') && (
            <p className="text-xs font-semibold text-text-primary mt-0.5">
              {currentLead.annual_revenue || '$0'}
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
              <div className="p-1 text-text-secondary/50" title="Table View (SQL)">
                <Table className="w-4 h-4" />
              </div>
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
              amount="$0" 
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
    </div>
  );
};
