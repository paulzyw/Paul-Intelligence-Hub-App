import React, { useState, useEffect } from 'react';
import { SQLOpportunity } from '../../types/sql';
import { OpportunitySession } from '../../types/opportunity_qualification';
import { MQLLead } from '../../types/mql';
import { PromotionDataService } from '../services/promotionDataService';
import { OpportunityDataService } from '../services/opportunityDataService';
import { SQLDataService } from '../services/sqlDataService';
import { Search, Download, Trash, Trash2, RefreshCw, ArrowLeft } from 'lucide-react';

const MiniScorePieChart: React.FC<{ score: number; status?: string }> = ({ score, status }) => {
  const roundedScore = Math.round(score);
  const size = 26;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(Math.max(roundedScore, 0), 100) / 100) * circumference;

  let strokeClass = "stroke-emerald-500";
  if (status) {
    const s = status.toLowerCase();
    if (s.includes('qualified') && !s.includes('conditionally') && !s.includes('conditional')) {
      strokeClass = "stroke-emerald-500";
    } else if (s.includes('disqualified')) {
      strokeClass = "stroke-red-500";
    } else if (s.includes('conditionally') || s.includes('conditional') || s.includes('gaps')) {
      strokeClass = "stroke-amber-500";
    } else {
      strokeClass = "stroke-text-secondary/40";
    }
  } else {
    if (roundedScore >= 70) {
      strokeClass = "stroke-emerald-500";
    } else if (roundedScore >= 40) {
      strokeClass = "stroke-amber-500";
    } else if (roundedScore > 0) {
      strokeClass = "stroke-red-500";
    } else {
      strokeClass = "stroke-text-secondary/40";
    }
  }

  return (
    <div className="flex items-center gap-1.5 select-none" onClick={(e) => e.stopPropagation()}>
      <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            className="stroke-border dark:stroke-border/40"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            strokeWidth={strokeWidth}
          />
          <circle
            className={strokeClass}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-[8.5px] font-black font-sans text-text-primary leading-none">
          {roundedScore}
        </span>
      </div>
    </div>
  );
};

export interface SqlToOpportunityTableProps {
  opportunities?: SQLOpportunity[];
  sessions?: Record<string, OpportunitySession>;
  leads?: MQLLead[];
  sqlLeads?: MQLLead[];
  onSelect?: (opp: SQLOpportunity) => void;
  onBack?: () => void;
  onLeadSelect?: (lead: MQLLead, columnType?: 'lead' | 'mql' | 'sql' | 'opp') => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const SqlToOpportunityTable: React.FC<SqlToOpportunityTableProps> = ({
  opportunities: propOpportunities,
  sessions: propSessions,
  leads: propLeads = [],
  sqlLeads: propSqlLeads = [],
  onSelect,
  onBack,
  onLeadSelect,
  searchQuery: externalSearchQuery,
  onSearchChange: externalOnSearchChange
}) => {
  const [internalOpportunities, setInternalOpportunities] = useState<SQLOpportunity[]>([]);
  const [internalSessions, setInternalSessions] = useState<Record<string, OpportunitySession>>({});
  const [loading, setLoading] = useState(true);
  
  // Search query state
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const isSearchControlled = externalSearchQuery !== undefined;
  const searchQuery = isSearchControlled ? externalSearchQuery : internalSearchQuery;
  const setSearchQuery = (val: string) => {
    if (externalOnSearchChange) {
      externalOnSearchChange(val);
    }
    if (!isSearchControlled) {
      setInternalSearchQuery(val);
    }
  };

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeletedOnly, setShowDeletedOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Soft-deleted SQL opportunity IDs inside this table
  const [deletedIds, setDeletedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('sql_opportunity_table_deleted_ids');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('sql_opportunity_table_deleted_ids', JSON.stringify(deletedIds));
  }, [deletedIds]);

  const [promotedOppIds, setPromotedOppIds] = useState<string[]>([]);
  const [promotedLeadIds, setPromotedLeadIds] = useState<string[]>([]);
  const [formDataMap, setFormDataMap] = useState<Record<string, any>>({});
  const [resultsMap, setResultsMap] = useState<Record<string, any>>({});
  const [handoverDetailsMap, setHandoverDetailsMap] = useState<Record<string, any>>({});

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, showDeletedOnly]);

  // Load pipeline data, form records, handover details, and qualification results
  useEffect(() => {
    let isMounted = true;

    const loadAllData = async () => {
      setLoading(true);
      try {
        let oppList = propOpportunities;
        if (!oppList || oppList.length === 0) {
          oppList = await SQLDataService.getOpportunities();
        }

        if (propSqlLeads && propSqlLeads.length > 0) {
          oppList = oppList.filter(opp => {
            return propSqlLeads.some(l => 
              l.id === opp.mql_reference_id ||
              (l.company_name && opp.company_name && l.company_name.toLowerCase() === opp.company_name.toLowerCase())
            );
          });

          propSqlLeads.forEach(l => {
            const exists = oppList.some(opp => 
              l.id === opp.mql_reference_id ||
              (l.company_name && opp.company_name && l.company_name.toLowerCase() === opp.company_name.toLowerCase())
            );
            if (!exists) {
              oppList.push({
                id: `virtual_opp_${l.id}`,
                company_name: l.company_name || 'Enterprise Client',
                industry: l.lead_industry || 'Enterprise Software',
                revenue_motion: 'Digital Solution Selling',
                opportunity_name: `${l.company_name || 'Enterprise'} Opportunity`,
                mql_reference_id: l.id,
                created_at: l.lead_date || new Date().toISOString()
              });
            }
          });
        }

        if (isMounted) {
          setInternalOpportunities(oppList);
        }

        const [pOppIds, pLeadIds] = await Promise.all([
          PromotionDataService.getSqlOpportunityPromotedOppIds(),
          PromotionDataService.getSqlOpportunityPromotedLeadIds()
        ]);
        if (isMounted) {
          setPromotedOppIds(pOppIds);
          setPromotedLeadIds(pLeadIds);
        }

        // Load sessions, form data, handover details, and qualification results
        const formRecords: Record<string, any> = {};
        const qResults: Record<string, any> = {};
        const handovers: Record<string, any> = {};
        const fetchedSessions: Record<string, OpportunitySession> = { ...(propSessions || {}) };

        await Promise.all(
          oppList.map(async (opp) => {
            const oppId = opp.id;
            try {
              if (!fetchedSessions[oppId]) {
                const sess = await OpportunityDataService.getSessionByOpportunity(oppId);
                if (sess) fetchedSessions[oppId] = sess;
              }

              // 1. Opportunity Form data (company_name, opportunity_name, owner, stage, revenue, etc.)
              const fData = await OpportunityDataService.getOpportunityFormData(oppId);
              if (fData) formRecords[oppId] = fData;

              // 2. Handover details (for static context Cat A / Business Segment)
              const hData = await OpportunityDataService.getSqlHandoverData(oppId);
              if (hData) handovers[oppId] = hData;

              // 3. Qualification result (score, status, readiness)
              const qRes = await OpportunityDataService.getSavedQualificationResult(oppId, fetchedSessions[oppId]?.id);
              if (qRes) qResults[oppId] = qRes;
            } catch (err) {
              console.warn(`Error loading details for opp ${oppId}:`, err);
            }
          })
        );

        if (isMounted) {
          setInternalSessions(fetchedSessions);
          setFormDataMap(formRecords);
          setHandoverDetailsMap(handovers);
          setResultsMap(qResults);
        }
      } catch (e) {
        console.error("Failed to load SQL Opportunity table data:", e);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAllData();
    return () => { isMounted = false; };
  }, [propOpportunities, propSessions]);

  const activeOpportunities = propOpportunities && propOpportunities.length > 0 
    ? propOpportunities 
    : internalOpportunities;
  const activeSessions = propSessions && Object.keys(propSessions).length > 0 
    ? propSessions 
    : internalSessions;

  // Helper to parse description JSON
  const parseOppDescription = (desc?: string) => {
    if (desc && desc.trim().startsWith('{')) {
      try {
        return JSON.parse(desc);
      } catch {
        // fallback
      }
    }
    return {};
  };

  // Helper to extract Business Segment from handover context (CAT A)
  const extractBusinessSegment = (opp: SQLOpportunity, handover: any): string => {
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

    // Try finding matching lead from propLeads
    if (opp.mql_reference_id) {
      const matchLead = propLeads.find(l => l.id === opp.mql_reference_id);
      if (matchLead) {
        if (matchLead.lead_industry) return matchLead.lead_industry;
        const extraJson = typeof window !== 'undefined' ? localStorage.getItem(`mql_lead_extra_${matchLead.id}`) : null;
        if (extraJson) {
          try {
            const extra = JSON.parse(extraJson);
            if (extra.lead_industry) return extra.lead_industry;
          } catch {}
        }
      }
    }

    return opp.industry || "Enterprise Cloud Software";
  };

  // Build resolved rows
  const resolvedRows = activeOpportunities.map((opp) => {
    const oppId = opp.id;
    const formRecord = formDataMap[oppId];
    const handover = handoverDetailsMap[oppId];
    const qResult = resultsMap[oppId];
    const session = activeSessions[oppId];
    const parsedDesc = parseOppDescription(opp.description);

    // 1. Company Name
    const companyName = formRecord?.company_name || opp.company_name || '—';

    // 2. Business Segment (from MQL handover detail - static context CAT A)
    const businessSegment = extractBusinessSegment(opp, handover);

    // 3. Opportunity Name
    const opportunityName = formRecord?.opportunity_name || opp.opportunity_name || `${companyName} Opportunity`;

    // 4. Opportunity Owner
    const opportunityOwner = formRecord?.opportunity_owner || parsedDesc.opportunity_owner || 'Senior Enterprise AE';

    // 5. Opportunity Stage
    const opportunityStage = formRecord?.opportunity_stage || parsedDesc.opportunity_stage || 'Validated Opportunity';

    // 6. Pipeline Stage
    const pipelineStage = formRecord?.pipeline_stage || parsedDesc.pipeline_stage || 'Qualification';

    // 7. Estimated Revenue
    const rawRevenue = formRecord?.estimated_revenue || parsedDesc.estimated_revenue || (opp as any).deal_size;
    let estimatedRevenue = '—';
    if (rawRevenue !== undefined && rawRevenue !== null && rawRevenue !== '') {
      if (typeof rawRevenue === 'number') {
        estimatedRevenue = `$${rawRevenue.toLocaleString('en-US')}`;
      } else {
        const str = String(rawRevenue).trim();
        if (str.startsWith('$')) {
          estimatedRevenue = str;
        } else {
          const num = parseFloat(str.replace(/[^0-9.]/g, ''));
          estimatedRevenue = !isNaN(num) ? `$${num.toLocaleString('en-US')}` : str;
        }
      }
    }

    // 8. Expected Close Date
    const expectedCloseDate = formRecord?.expected_close_date || parsedDesc.expected_close_date || '—';

    // 9. Opportunity Score
    const scoreVal = qResult?.qualification_summary?.overall_score ?? (session ? 75 : 0);
    const opportunityScore = Math.round(Number(scoreVal) || 0);

    // 10. Opportunity Status
    const opportunityStatus = qResult?.qualification_summary?.qualification_status 
      || session?.qualification_status 
      || 'Needs More Evidence';

    // 11. Promote to Opportunity
    const isPromoted = promotedOppIds.includes(oppId) || 
      (opp.mql_reference_id ? promotedLeadIds.includes(opp.mql_reference_id) : false) || 
      Boolean(session?.is_promoted);

    // Find backing lead if any
    const backingLead = propLeads.find(l => l.id === opp.mql_reference_id);

    return {
      oppId,
      oppRaw: opp,
      backingLead,
      companyName,
      businessSegment,
      opportunityName,
      opportunityOwner,
      opportunityStage,
      pipelineStage,
      estimatedRevenue,
      expectedCloseDate,
      opportunityScore,
      opportunityStatus,
      isPromoted
    };
  });

  // Filter based on Trash and Search
  const visibleRows = resolvedRows.filter(row => {
    const isDeleted = deletedIds.includes(row.oppId);
    if (showDeletedOnly) {
      if (!isDeleted) return false;
    } else {
      if (isDeleted) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const promotedText = row.isPromoted ? "yes promoted" : "no not promoted";
      return (
        row.companyName.toLowerCase().includes(q) ||
        row.opportunityName.toLowerCase().includes(q) ||
        row.opportunityOwner.toLowerCase().includes(q) ||
        row.businessSegment.toLowerCase().includes(q) ||
        row.opportunityStage.toLowerCase().includes(q) ||
        row.pipelineStage.toLowerCase().includes(q) ||
        row.opportunityStatus.toLowerCase().includes(q) ||
        promotedText.includes(q)
      );
    }
    return true;
  });

  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(visibleRows.length / itemsPerPage));
  const paginatedRows = visibleRows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedRows.map(r => r.oppId));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (oppId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, oppId]);
    } else {
      setSelectedIds(prev => prev.filter(id => id !== oppId));
    }
  };

  const handleDeleteSelected = () => {
    setDeletedIds(prev => [...prev, ...selectedIds]);
    setSelectedIds([]);
  };

  const handleRestoreSelected = () => {
    setDeletedIds(prev => prev.filter(id => !selectedIds.includes(id)));
    setSelectedIds([]);
  };

  const handlePermanentDeleteSelected = async () => {
    for (const oppId of selectedIds) {
      await PromotionDataService.unpromoteSqlOpportunity(oppId);
    }
    setPromotedOppIds(prev => prev.filter(id => !selectedIds.includes(id)));
    setDeletedIds(prev => prev.filter(id => !selectedIds.includes(id)));
    setSelectedIds([]);
  };

  const handleExportCSV = () => {
    const headers = [
      "SN",
      "Company Name",
      "Business Segment",
      "Opportunity Name",
      "Opportunity Owner",
      "Opportunity Stage",
      "Pipeline Stage",
      "Estimated Revenue",
      "Expected Close Date",
      "Opportunity Score",
      "Opportunity Status",
      "Promote to Opportunity"
    ];

    const csvRows = [headers.join(",")];

    visibleRows.forEach((row, idx) => {
      const line = [
        idx + 1,
        `"${row.companyName.replace(/"/g, '""')}"`,
        `"${row.businessSegment.replace(/"/g, '""')}"`,
        `"${row.opportunityName.replace(/"/g, '""')}"`,
        `"${row.opportunityOwner.replace(/"/g, '""')}"`,
        `"${row.opportunityStage.replace(/"/g, '""')}"`,
        `"${row.pipelineStage.replace(/"/g, '""')}"`,
        `"${row.estimatedRevenue.replace(/"/g, '""')}"`,
        `"${row.expectedCloseDate.replace(/"/g, '""')}"`,
        row.opportunityScore,
        `"${row.opportunityStatus}"`,
        row.isPromoted ? "YES" : "NO"
      ];
      csvRows.push(line.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sql_opportunity_roster_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getOpportunityStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('qualified') && !s.includes('conditional') && !s.includes('conditionally')) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-mono font-bold uppercase tracking-wider">
          Qualified
        </span>
      );
    }
    if (s.includes('disqualified')) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 text-[9px] font-mono font-bold uppercase tracking-wider">
          Disqualified
        </span>
      );
    }
    if (s.includes('conditional')) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-mono font-bold uppercase tracking-wider">
          Conditional
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full bg-bg-primary text-text-secondary border border-border text-[9px] font-mono font-bold uppercase tracking-wider">
        Needs Evidence
      </span>
    );
  };

  const handleRowClick = (row: typeof resolvedRows[0]) => {
    if (onSelect) {
      onSelect(row.oppRaw);
    } else if (onLeadSelect && row.backingLead) {
      onLeadSelect(row.backingLead, 'sql');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 rounded-xl border border-border bg-bg-surface hover:bg-bg-primary/50 text-text-secondary hover:text-text-primary transition-all cursor-pointer"
              title="Back to Kanban"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold text-text-primary font-sans">SQL Opportunity Qualification Roster</h2>
            <p className="text-xs text-text-secondary mt-0.5">Enterprise opportunities converted from Sales Qualified Leads (SQL)</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-bg-surface/30 p-4 rounded-2xl border border-border">
        <div className="flex items-center gap-4 w-full sm:w-auto text-xs font-mono font-bold text-text-secondary">
          {showDeletedOnly ? (
            <span className="flex items-center gap-1.5 text-red-500 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Viewing Trash
            </span>
          ) : (
            <span className="text-text-secondary whitespace-nowrap">
              {selectedIds.length > 0 ? (
                <span className="text-accent">{selectedIds.length} item(s) selected</span>
              ) : (
                <span>{visibleRows.length} active SQL opportunity(ies)</span>
              )}
            </span>
          )}

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search SQL opportunities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-surface border border-border text-text-primary placeholder:text-text-secondary/45 font-sans text-xs font-normal rounded-xl pl-8 pr-8 py-1.5 focus:outline-none focus:border-accent shadow-sm"
            />
            <svg
              className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-secondary/60"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 hover:text-text-primary text-text-secondary transition-colors cursor-pointer"
                title="Clear search"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {showDeletedOnly ? (
            <>
              <button
                onClick={handleRestoreSelected}
                disabled={selectedIds.length === 0}
                className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 disabled:opacity-50 font-black text-[10px] rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Restore
              </button>
              <button
                onClick={handlePermanentDeleteSelected}
                disabled={selectedIds.length === 0}
                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 disabled:opacity-50 font-black text-[10px] rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                title="Permanently remove selected opportunities from pipeline"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Purge
              </button>
              <button
                onClick={() => setShowDeletedOnly(false)}
                className="px-3 py-1.5 bg-bg-surface border border-border text-text-primary hover:bg-bg-primary/50 font-black text-[10px] rounded-xl uppercase tracking-wider transition-all cursor-pointer"
              >
                Back to Active
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedIds.length === 0}
                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 disabled:opacity-50 font-black text-[10px] rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                title="Soft-delete selected items"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-bg-surface border border-border text-text-primary hover:bg-bg-primary/50 font-black text-[10px] rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                title="Export list to CSV"
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </button>
              <button
                onClick={() => {
                  setShowDeletedOnly(true);
                  setSelectedIds([]);
                }}
                className={`px-3 py-1.5 border font-black text-[10px] rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  deletedIds.length > 0
                    ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                    : 'bg-bg-surface text-text-secondary border-border hover:bg-bg-primary/50'
                }`}
                title="View soft-deleted items"
              >
                <Trash className="h-3.5 w-3.5" />
                Trash ({deletedIds.length})
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar-horizontal pb-2">
          <table className="w-full text-left text-xs min-w-[1720px]">
            <thead className="bg-bg-primary/50 border-b border-border text-text-secondary font-mono uppercase tracking-wider">
              <tr>
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={paginatedRows.length > 0 && paginatedRows.every(r => selectedIds.includes(r.oppId))}
                    onChange={handleSelectAll}
                    className="rounded border-border bg-bg-surface focus:ring-0 text-accent cursor-pointer"
                  />
                </th>
                <th className="p-4 w-12 min-w-[48px] text-center font-bold">SN</th>
                <th className="p-4 font-bold">Company Name</th>
                <th className="p-4 font-bold">Business Segment</th>
                <th className="p-4 font-bold min-w-[360px] w-[360px]">Opportunity Name</th>
                <th className="p-4 font-bold">Opportunity Owner</th>
                <th className="p-4 font-bold">Opportunity Stage</th>
                <th className="p-4 font-bold">Pipeline Stage</th>
                <th className="p-4 font-bold w-[150px] min-w-[150px]">Estimated Revenue</th>
                <th className="p-4 font-bold">Expected Close Date</th>
                <th className="p-4 font-bold text-center">Opportunity Score</th>
                <th className="p-4 font-bold w-[180px] min-w-[180px]">Opportunity Status</th>
                <th className="p-4 font-bold text-center">Promote to Opportunity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={13} className="p-8 text-center text-text-secondary">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                      <span>Loading SQL Opportunity Data...</span>
                    </div>
                  </td>
                </tr>
              ) : visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="p-8 text-center text-text-secondary">
                    No SQL opportunities match your selection.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => {
                  const serialNumber = (currentPage - 1) * itemsPerPage + idx + 1;
                  return (
                    <tr 
                      key={row.oppId}
                      className="hover:bg-bg-primary/30 transition-colors"
                    >
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(row.oppId)}
                          onChange={(e) => handleSelectRow(row.oppId, e.target.checked)}
                          className="rounded border-border bg-bg-surface focus:ring-0 text-accent cursor-pointer"
                        />
                      </td>
                      <td className="p-4 w-12 min-w-[48px] text-center font-mono font-medium text-text-secondary">
                        {serialNumber}
                      </td>
                      <td className="p-4 font-bold text-text-primary">{row.companyName}</td>
                      <td className="p-4 text-text-secondary font-medium">{row.businessSegment}</td>
                      <td className="p-4 font-bold min-w-[360px] w-[360px]">
                        <button
                          onClick={() => handleRowClick(row)}
                          className="text-left text-accent hover:underline hover:text-accent/80 font-bold transition-all cursor-pointer focus:outline-none"
                        >
                          {row.opportunityName}
                        </button>
                      </td>
                      <td className="p-4 text-text-secondary">{row.opportunityOwner}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 bg-bg-primary rounded border border-border text-[10px] text-text-secondary">
                          {row.opportunityStage}
                        </span>
                      </td>
                      <td className="p-4 text-text-secondary font-medium">{row.pipelineStage}</td>
                      <td className="p-4 font-mono font-bold text-text-primary w-[150px] min-w-[150px]">{row.estimatedRevenue}</td>
                      <td className="p-4 text-text-secondary font-medium">{row.expectedCloseDate}</td>
                      <td className="p-4 text-center">
                        <div className="inline-flex justify-center w-full">
                          <MiniScorePieChart score={row.opportunityScore} status={row.opportunityStatus} />
                        </div>
                      </td>
                      <td className="p-4 w-[180px] min-w-[180px]">{getOpportunityStatusBadge(row.opportunityStatus)}</td>
                      <td className="p-4 text-center">
                        {row.isPromoted ? (
                          <span className="inline-flex px-1.5 py-0.5 bg-emerald-500/15 text-emerald-500 border border-emerald-500/25 text-[8px] font-black uppercase tracking-wider rounded">
                            YES
                          </span>
                        ) : (
                          <span className="inline-flex px-1.5 py-0.5 bg-red-500/15 text-red-500 border border-red-500/25 text-[8px] font-black uppercase tracking-wider rounded">
                            NO
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && visibleRows.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-border bg-bg-surface text-xs text-text-secondary select-none">
            <div className="font-medium">
              Showing <span className="font-semibold text-text-primary">{Math.min(visibleRows.length, (currentPage - 1) * itemsPerPage + 1)}</span> to{' '}
              <span className="font-semibold text-text-primary">{Math.min(visibleRows.length, currentPage * itemsPerPage)}</span> of{' '}
              <span className="font-semibold text-text-primary">{visibleRows.length}</span> results
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-bg-surface text-text-primary font-medium hover:bg-bg-primary/50 disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                const isFirst = page === 1;
                const isLast = page === totalPages;
                const isWithinRange = Math.abs(page - currentPage) <= 1;

                if (isFirst || isLast || isWithinRange) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`inline-flex items-center justify-center w-[26px] h-[26px] rounded-full text-[13px] font-normal transition-colors cursor-pointer ${
                        currentPage === page
                          ? 'bg-accent text-white font-medium'
                          : 'border border-border hover:bg-bg-primary/50 text-text-primary'
                      }`}
                    >
                      {page}
                    </button>
                  );
                }

                // Render ellipsis
                if (
                  (page === 2 && currentPage > 3) ||
                  (page === totalPages - 1 && currentPage < totalPages - 2)
                ) {
                  return <span key={page} className="px-1 text-text-secondary select-none">...</span>;
                }

                return null;
              })}

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-bg-surface text-text-primary font-medium hover:bg-bg-primary/50 disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SqlToOpportunityTable;
