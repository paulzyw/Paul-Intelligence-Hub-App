import React, { useState, useEffect } from 'react';
import { SQLOpportunity } from '../../types/sql';
import { OpportunitySession } from '../../types/opportunity_qualification';
import { Search, ChevronRight, BadgeCheck, AlertTriangle, AlertCircle, Play, Calendar, User, Clock, Layers, Table as TableIcon, LayoutGrid, CheckCircle2, XCircle } from 'lucide-react';
import { PromotionDataService } from '../services/promotionDataService';

interface SqlToOpportunityTableProps {
  opportunities: SQLOpportunity[];
  sessions: Record<string, OpportunitySession>;
  onSelect: (opp: SQLOpportunity) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const SqlToOpportunityTable: React.FC<SqlToOpportunityTableProps> = ({
  opportunities,
  sessions,
  onSelect,
  searchQuery,
  onSearchChange
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [promotedLeadIds, setPromotedLeadIds] = useState<string[]>([]);
  const [promotedOppIds, setPromotedOppIds] = useState<string[]>([]);

  // Query sql_opportunity_promotions from Supabase
  useEffect(() => {
    let isMounted = true;
    const fetchPromotions = async () => {
      try {
        const [leadIds, oppIds] = await Promise.all([
          PromotionDataService.getSqlOpportunityPromotedLeadIds(),
          PromotionDataService.getSqlOpportunityPromotedOppIds()
        ]);
        if (isMounted) {
          setPromotedLeadIds(leadIds);
          setPromotedOppIds(oppIds);
        }
      } catch (err) {
        console.error("Failed to query sql_opportunity_promotions:", err);
      }
    };
    fetchPromotions();
    return () => { isMounted = false; };
  }, []);

  const isOpportunityPromoted = (opp: SQLOpportunity) => {
    if (promotedOppIds.includes(opp.id)) return true;
    if (opp.mql_reference_id && promotedLeadIds.includes(opp.mql_reference_id)) return true;
    if (sessions[opp.id]?.is_promoted) return true;
    return false;
  };

  // Parse description JSON/string
  const getOppDetails = (desc?: string) => {
    if (!desc) {
      return {
        description: 'No business definition or opportunity background provided.',
        owner: 'Unassigned',
        opportunity_stage: 'Emerging Opportunity',
        estimated_revenue: '—',
        pipeline_stage: 'Qualification',
        expected_close_date: '—'
      };
    }
    if (desc.trim().startsWith('{') && desc.trim().endsWith('}')) {
      try {
        const parsed = JSON.parse(desc);
        return {
          description: parsed.description || 'No business definition or opportunity background provided.',
          owner: parsed.opportunity_owner || 'Unassigned',
          opportunity_stage: parsed.opportunity_stage || 'Emerging Opportunity',
          estimated_revenue: parsed.estimated_revenue || '—',
          pipeline_stage: parsed.pipeline_stage || 'Qualification',
          expected_close_date: parsed.expected_close_date || '—'
        };
      } catch (e) {
        // Fallback
      }
    }
    return {
      description: desc,
      owner: 'Unassigned',
      opportunity_stage: 'Emerging Opportunity',
      estimated_revenue: '—',
      pipeline_stage: 'Qualification',
      expected_close_date: '—'
    };
  };

  const getStatusBadge = (status: string | undefined) => {
    const defaultClasses = "bg-zinc-100 text-zinc-800 border-zinc-200/50";
    const statusMap: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
      NOT_STARTED: {
        label: 'Ready for OQ',
        cls: 'bg-blue-50 text-blue-700 border-blue-200/50',
        icon: <Clock className="h-3 w-3 shrink-0" />
      },
      IN_PROGRESS: {
        label: 'Assessing',
        cls: 'bg-amber-50 text-amber-700 border-amber-200/50 animate-pulse',
        icon: <Play className="h-3 w-3 shrink-0" />
      },
      QUALIFIED: {
        label: 'OQ Qualified',
        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200/50',
        icon: <BadgeCheck className="h-3.5 w-3.5 shrink-0" />
      },
      CONDITIONALLY_QUALIFIED: {
        label: 'Conditionally Qual',
        cls: 'bg-emerald-50/60 text-emerald-600 border-emerald-200/40',
        icon: <BadgeCheck className="h-3.5 w-3.5 shrink-0" />
      },
      EVIDENCE_INSUFFICIENT: {
        label: 'Gaps Active',
        cls: 'bg-yellow-50 text-yellow-700 border-yellow-200/50',
        icon: <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      },
      DISQUALIFIED: {
        label: 'Disqualified',
        cls: 'bg-red-50 text-red-700 border-red-200/50',
        icon: <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      },
      ON_HOLD: {
        label: 'On Hold',
        cls: 'bg-zinc-100 text-zinc-700 border-zinc-200/50',
        icon: <Clock className="h-3 w-3 shrink-0" />
      }
    };

    const config = statusMap[status || ''] || {
      label: status || 'Ready for OQ',
      cls: defaultClasses,
      icon: <Clock className="h-3 w-3 shrink-0" />
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg border ${config.cls}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const filteredOpps = opportunities.filter(opp => {
    const q = searchQuery.toLowerCase();
    return (
      (opp.opportunity_name || '').toLowerCase().includes(q) ||
      (opp.company_name || '').toLowerCase().includes(q) ||
      (opp.industry || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Search & View Mode Header */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-white p-4 rounded-xl border border-zinc-200/60 shadow-sm gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search enterprise SQL opportunities..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:border-zinc-500 rounded-xl text-xs focus:outline-none transition-all"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="text-xs text-zinc-500 font-medium">
            Found <span className="font-bold text-zinc-800">{filteredOpps.length}</span> opportunities
          </div>

          {/* Toggle between Table and Grid */}
          <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200/60">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
              title="Opportunity Handover Table"
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'grid'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>
        </div>
      </div>

      {filteredOpps.length === 0 ? (
        <div className="p-12 text-center bg-white border border-dashed border-zinc-200 rounded-2xl">
          <AlertCircle className="h-10 w-10 mx-auto mb-3 text-zinc-400 opacity-60" />
          <h3 className="text-sm font-bold text-zinc-800">No Enterprise SQL Opportunities Found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search filters or check the Lead Canvas to qualify and promote more leads.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* Opportunity Handover Table */
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200 text-[11px] font-bold text-zinc-500 uppercase tracking-wider select-none">
                  <th className="py-3.5 px-4 font-black">Opportunity & Account</th>
                  <th className="py-3.5 px-4 font-black">Motion & Industry</th>
                  <th className="py-3.5 px-4 font-black">Owner</th>
                  <th className="py-3.5 px-4 font-black">Est. Revenue</th>
                  <th className="py-3.5 px-4 font-black text-center">Promoted</th>
                  <th className="py-3.5 px-4 font-black text-right">OQ Status</th>
                  <th className="py-3.5 px-4 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {filteredOpps.map(opp => {
                  const details = getOppDetails(opp.description);
                  const session = sessions[opp.id];
                  const isPromoted = isOpportunityPromoted(opp);

                  return (
                    <tr
                      key={opp.id}
                      onClick={() => onSelect(opp)}
                      className={`hover:bg-zinc-50/80 transition-colors cursor-pointer group ${
                        isPromoted ? 'bg-emerald-50/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-zinc-900 group-hover:text-zinc-600 transition-colors flex items-center gap-1.5">
                          {opp.opportunity_name || `${opp.company_name} Opportunity`}
                        </div>
                        <div className="text-[11px] font-medium text-zinc-500 mt-0.5">
                          {opp.company_name}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block text-[10px] font-bold uppercase text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                          {opp.revenue_motion || 'Digital Solution Selling'}
                        </span>
                        <div className="text-[11px] text-zinc-400 mt-1 truncate max-w-[150px]">
                          {opp.industry || 'Enterprise Software'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-zinc-700 font-medium">
                        {details.owner}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-zinc-900">
                        {details.estimated_revenue !== '—' ? details.estimated_revenue : '$150,000'}
                      </td>

                      {/* Promoted Column: Displays Yes if the lead is in sql_opportunity_promotions, and No otherwise */}
                      <td className="py-3.5 px-4 text-center">
                        {isPromoted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-500 border border-zinc-200">
                            No
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {getStatusBadge(session?.qualification_status)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-700 group-hover:translate-x-0.5 transition-all inline-block" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid List View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOpps.map(opp => {
            const details = getOppDetails(opp.description);
            const session = sessions[opp.id];
            const isPromoted = isOpportunityPromoted(opp);

            return (
              <div
                key={opp.id}
                onClick={() => onSelect(opp)}
                className={`p-5 rounded-2xl border bg-white shadow-xs hover:shadow-md transition-all group cursor-pointer relative flex flex-col justify-between ${
                  isPromoted 
                    ? 'border-emerald-300 bg-emerald-50/10' 
                    : 'border-zinc-200/80 hover:border-zinc-400/80'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200">
                        {opp.revenue_motion || 'Digital Solution Selling'}
                      </span>
                      <h3 className="text-sm font-black text-zinc-800 mt-2 line-clamp-1 group-hover:text-zinc-600 transition-colors">
                        {opp.opportunity_name}
                      </h3>
                      <p className="text-xs font-bold text-zinc-500">{opp.company_name}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-700 group-hover:translate-x-0.5 transition-all mt-1" />
                  </div>

                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mt-3">
                    {details.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-4 items-center">
                    {details.owner !== 'Unassigned' && (
                      <div className="flex items-center gap-1 bg-zinc-50 px-2 py-0.5 rounded-md border border-zinc-150">
                        <User className="h-3 w-3 text-zinc-400" />
                        <span className="text-[9px] font-bold text-zinc-600">
                          Owner: <span className="font-semibold text-zinc-500">{details.owner}</span>
                        </span>
                      </div>
                    )}
                    {details.estimated_revenue && details.estimated_revenue !== '—' && (
                      <div className="flex items-center gap-1 bg-zinc-50 px-2 py-0.5 rounded-md border border-zinc-150">
                        <span className="text-[9px] font-bold text-zinc-700">
                          Est: <span className="text-zinc-900 font-extrabold">{details.estimated_revenue}</span>
                        </span>
                      </div>
                    )}
                    <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-md border ${
                      isPromoted
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                    }`}>
                      Promoted: {isPromoted ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                <div className="border-t border-zinc-100 pt-3.5 mt-4.5 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-zinc-400">
                    <Calendar className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-mono">
                      {opp.created_at ? new Date(opp.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>

                  <div className="text-right">
                    {getStatusBadge(session?.qualification_status)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default SqlToOpportunityTable;
