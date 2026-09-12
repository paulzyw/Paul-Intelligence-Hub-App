import React, { useState, useEffect } from 'react';
import { MQLLead, MQLCampaign } from '../../types/mql';
import { SQLOpportunity, SQLAssessment } from '../../types/sql';
import { SQLDataService } from '../services/sqlDataService';
import { PromotionDataService } from '../services/promotionDataService';
import { supabase } from '@/src/lib/supabase';
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
    if (s.includes('qualified') || s === 'completed' || s === 'success') {
      strokeClass = "stroke-emerald-500";
    } else if (s.includes('disqualified')) {
      strokeClass = "stroke-red-500";
    } else if (s.includes('conditionally') || s.includes('nurture')) {
      strokeClass = "stroke-accent";
    } else {
      strokeClass = "stroke-text-secondary/40";
    }
  } else {
    if (roundedScore >= 70) {
      strokeClass = "stroke-emerald-500";
    } else if (roundedScore >= 40) {
      strokeClass = "stroke-accent";
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

interface MqlToSqlTableProps {
  leads: MQLLead[];
  campaigns: MQLCampaign[];
  onBack: () => void;
  onLeadSelect?: (lead: MQLLead, columnType?: 'lead' | 'mql' | 'sql' | 'opp') => void;
}

export const MqlToSqlTable: React.FC<MqlToSqlTableProps> = ({ leads, campaigns, onBack, onLeadSelect }) => {
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<SQLOpportunity[]>([]);
  const [assessments, setAssessments] = useState<SQLAssessment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [showDeletedOnly, setShowDeletedOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, showDeletedOnly]);

  // Soft-deleted MQL Lead IDs inside this view
  const [deletedMqlIds, setDeletedMqlIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('sql_mql_table_deleted_ids');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('sql_mql_table_deleted_ids', JSON.stringify(deletedMqlIds));
  }, [deletedMqlIds]);

  const [promotedLeadIds, setPromotedLeadIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [opps, pIds] = await Promise.all([
          SQLDataService.getOpportunities(),
          PromotionDataService.getPromotedLeadIds()
        ]);
        setOpportunities(opps);
        setPromotedLeadIds(pIds);

        const { data: assessList, error } = await supabase
          .from('sql_assessments')
          .select('*');
        if (!error && assessList) {
          setAssessments(assessList as SQLAssessment[]);
        }
      } catch (e) {
        console.error("Failed to load SQL table context data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter only the leads belonging to MQL Column
  const mqlLeadsRaw = leads.filter(l => 
    (l.status && (l.status.includes('Qualified') || l.status === 'Highly Qualified MQL')) ||
    promotedLeadIds.includes(l.id) ||
    l.status === 'SQL'
  );

  // Parse JSON fields from opportunity description
  const parseOppDetails = (desc?: string) => {
    if (!desc) {
      return {
        owner: '—',
        opportunity_stage: '—',
        estimated_revenue: '—',
        pipeline_stage: '—',
        expected_close_date: '—'
      };
    }
    if (desc.trim().startsWith('{') && desc.trim().endsWith('}')) {
      try {
        const parsed = JSON.parse(desc);
        return {
          owner: parsed.opportunity_owner || '—',
          opportunity_stage: parsed.opportunity_stage || '—',
          estimated_revenue: parsed.estimated_revenue || '—',
          pipeline_stage: parsed.pipeline_stage || '—',
          expected_close_date: parsed.expected_close_date || '—'
        };
      } catch {
        // fallback
      }
    }
    return {
      owner: '—',
      opportunity_stage: '—',
      estimated_revenue: '—',
      pipeline_stage: '—',
      expected_close_date: '—'
    };
  };

  // Build rows mapping leads with resolved SQL values
  const resolvedRows = mqlLeadsRaw.map(lead => {
    const opportunity = opportunities.find(o => o.mql_reference_id === lead.id);
    const assessment = opportunity ? assessments.find(a => a.opportunity_id === opportunity.id) : null;
    const oppDetails = parseOppDetails(opportunity?.description);

    const isPromoted = lead.status === 'SQL' || promotedLeadIds.includes(lead.id);

    return {
      leadId: lead.id,
      leadRaw: lead,
      companyName: opportunity?.company_name || lead.company_name || '—',
      businessSegment: lead.lead_industry || "Enterprise Cloud Software",
      opportunityName: opportunity?.opportunity_name || '—',
      opportunityOwner: oppDetails.owner,
      opportunityStage: oppDetails.opportunity_stage,
      pipelineStage: oppDetails.pipeline_stage,
      estimatedRevenue: oppDetails.estimated_revenue,
      expectedCloseDate: oppDetails.expected_close_date,
      sqlScore: assessment?.overall_score ?? 0,
      sqlStatus: assessment?.qualification_status || 'Needs More Evidence',
      isPromoted: isPromoted
    };
  });

  // Filter based on Trash and Search
  const visibleRows = resolvedRows.filter(row => {
    const isDeleted = deletedMqlIds.includes(row.leadId);
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
        row.sqlStatus.toLowerCase().includes(q) ||
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
      setSelectedLeadIds(paginatedRows.map(r => r.leadId));
    } else {
      setSelectedLeadIds([]);
    }
  };

  const handleSelectRow = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeadIds(prev => [...prev, leadId]);
    } else {
      setSelectedLeadIds(prev => prev.filter(id => id !== leadId));
    }
  };

  const handleDeleteSelected = () => {
    setDeletedMqlIds(prev => [...prev, ...selectedLeadIds]);
    setSelectedLeadIds([]);
  };

  const handleRestoreSelected = () => {
    setDeletedMqlIds(prev => prev.filter(id => !selectedLeadIds.includes(id)));
    setSelectedLeadIds([]);
  };

  const handlePermanentDeleteSelected = async () => {
    for (const leadId of selectedLeadIds) {
      await PromotionDataService.unpromoteLead(leadId);
    }
    setPromotedLeadIds(prev => prev.filter(id => !selectedLeadIds.includes(id)));
    setDeletedMqlIds(prev => prev.filter(id => !selectedLeadIds.includes(id)));
    setSelectedLeadIds([]);
  };

  const handleExportCSV = () => {
    const headers = [
      "Company Name",
      "Business Segment",
      "Opportunity Name",
      "Opportunity Owner",
      "Opportunity Stage",
      "Pipeline Stage",
      "Estimated Revenue",
      "Expected Close Date",
      "SQL Score",
      "SQL Status",
      "Promote to SQL"
    ];

    const csvRows = [headers.join(",")];

    visibleRows.forEach(row => {
      const line = [
        `"${row.companyName.replace(/"/g, '""')}"`,
        `"${row.businessSegment.replace(/"/g, '""')}"`,
        `"${row.opportunityName.replace(/"/g, '""')}"`,
        `"${row.opportunityOwner.replace(/"/g, '""')}"`,
        `"${row.opportunityStage.replace(/"/g, '""')}"`,
        `"${row.pipelineStage.replace(/"/g, '""')}"`,
        `"${row.estimatedRevenue.replace(/"/g, '""')}"`,
        `"${row.expectedCloseDate.replace(/"/g, '""')}"`,
        row.sqlScore,
        `"${row.sqlStatus}"`,
        row.isPromoted ? "YES" : "NO"
      ];
      csvRows.push(line.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `mql_sales_roster_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Badge stylings
  const getSqlStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('qualified') && !s.includes('conditional')) {
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

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 rounded-xl border border-border bg-bg-surface hover:bg-bg-primary/50 text-text-secondary hover:text-text-primary transition-all cursor-pointer"
            title="Back to Kanban"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-text-primary font-sans">MQL Sales Qualification Roster</h2>
            <p className="text-xs text-text-secondary mt-0.5">Sales opportunities converted from Marketing Qualified Leads (MQL)</p>
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
              {selectedLeadIds.length > 0 ? (
                <span className="text-accent">{selectedLeadIds.length} item(s) selected</span>
              ) : (
                <span>{visibleRows.length} active MQL lead(s)</span>
              )}
            </span>
          )}

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search MQL leads..."
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
                className="absolute right-2.5 top-2 hover:text-text-primary text-text-secondary transition-colors"
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
                disabled={selectedLeadIds.length === 0}
                className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 disabled:opacity-50 font-black text-[10px] rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Restore
              </button>
              <button
                onClick={handlePermanentDeleteSelected}
                disabled={selectedLeadIds.length === 0}
                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 disabled:opacity-50 font-black text-[10px] rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                title="Permanently remove selected leads from pipeline"
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
                disabled={selectedLeadIds.length === 0}
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
                  setSelectedLeadIds([]);
                }}
                className={`px-3 py-1.5 border font-black text-[10px] rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  deletedMqlIds.length > 0
                    ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                    : 'bg-bg-surface text-text-secondary border-border hover:bg-bg-primary/50'
                }`}
                title="View soft-deleted items"
              >
                <Trash className="h-3.5 w-3.5" />
                Trash ({deletedMqlIds.length})
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar-horizontal pb-2">
          <table className="w-full text-left text-xs min-w-[1650px]">
            <thead className="bg-bg-primary/50 border-b border-border text-text-secondary font-mono uppercase tracking-wider">
              <tr>
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={paginatedRows.length > 0 && paginatedRows.every(r => selectedLeadIds.includes(r.leadId))}
                    onChange={handleSelectAll}
                    className="rounded border-border bg-bg-surface focus:ring-0 text-accent cursor-pointer"
                  />
                </th>
                <th className="p-4 w-12 min-w-[48px] text-center font-bold">SN</th>
                <th className="p-4 font-bold">Company Name</th>
                <th className="p-4 font-bold">Business Segment</th>
                <th className="p-4 font-bold min-w-[360px] w-[360px]">Opportunity Name</th>
                <th className="p-4 font-bold">Owner</th>
                <th className="p-4 font-bold">Opp Stage</th>
                <th className="p-4 font-bold">Pipeline Stage</th>
                <th className="p-4 font-bold w-[150px] min-w-[150px]">Est. Revenue</th>
                <th className="p-4 font-bold">Expected Close</th>
                <th className="p-4 font-bold text-center">SQL Score</th>
                <th className="p-4 font-bold w-[180px] min-w-[180px]">SQL Status</th>
                <th className="p-4 font-bold text-center">Promoted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={13} className="p-8 text-center text-text-secondary">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                      <span>Loading SQL Data...</span>
                    </div>
                  </td>
                </tr>
              ) : visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="p-8 text-center text-text-secondary">
                    No leads match your selection.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => {
                  const serialNumber = (currentPage - 1) * itemsPerPage + idx + 1;
                  return (
                    <tr 
                      key={row.leadId}
                      className="hover:bg-bg-primary/30 transition-colors"
                    >
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedLeadIds.includes(row.leadId)}
                          onChange={(e) => handleSelectRow(row.leadId, e.target.checked)}
                          className="rounded border-border bg-bg-surface focus:ring-0 text-accent cursor-pointer"
                        />
                      </td>
                      <td className="p-4 w-12 min-w-[48px] text-center font-mono font-medium text-text-secondary">
                        {serialNumber}
                      </td>
                      <td className="p-4 font-bold text-text-primary">{row.companyName}</td>
                      <td className="p-4 text-text-secondary font-medium">{row.businessSegment}</td>
                      <td className="p-4 font-bold min-w-[360px] w-[360px]">
                        {onLeadSelect ? (
                          <button
                            onClick={() => onLeadSelect(row.leadRaw, 'mql')}
                            className="text-left text-accent hover:underline hover:text-accent/80 font-bold transition-all cursor-pointer focus:outline-none"
                          >
                            {row.opportunityName}
                          </button>
                        ) : (
                          <span className="text-text-primary">{row.opportunityName}</span>
                        )}
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
                          <MiniScorePieChart score={row.sqlScore} status={row.sqlStatus} />
                        </div>
                      </td>
                      <td className="p-4 w-[180px] min-w-[180px]">{getSqlStatusBadge(row.sqlStatus)}</td>
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
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page, index, arr) => {
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
