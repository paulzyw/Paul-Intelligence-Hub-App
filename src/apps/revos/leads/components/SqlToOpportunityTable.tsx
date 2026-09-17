import React from 'react';
import { SQLOpportunity } from '../../types/sql';
import { OpportunitySession } from '../../types/opportunity_qualification';
import { Search, ChevronRight, BadgeCheck, AlertTriangle, AlertCircle, Play, Calendar, User, Clock, Layers } from 'lucide-react';

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
      {/* Search Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-zinc-200/60 shadow-sm">
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
        <div className="text-xs text-zinc-500 font-medium">
          Found <span className="font-bold text-zinc-800">{filteredOpps.length}</span> opportunities in pipeline
        </div>
      </div>

      {/* Grid List */}
      {filteredOpps.length === 0 ? (
        <div className="p-12 text-center bg-white border border-dashed border-zinc-200 rounded-2xl">
          <AlertCircle className="h-10 w-10 mx-auto mb-3 text-zinc-400 opacity-60" />
          <h3 className="text-sm font-bold text-zinc-800">No Enterprise SQL Opportunities Found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search filters or check the Lead Canvas to qualify and promote more leads.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOpps.map(opp => {
            const details = getOppDetails(opp.description);
            const session = sessions[opp.id];
            const isPromoted = session?.is_promoted;

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

                  <div className="flex flex-wrap gap-1.5 mt-4">
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
                    {isPromoted && (
                      <span className="inline-flex bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-md border border-emerald-200">
                        PROMOTED PIPELINE
                      </span>
                    )}
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
