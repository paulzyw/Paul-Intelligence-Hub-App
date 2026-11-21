import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Trash, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { PipelineCardItem } from './PipelineCard';
import { PipelineConfigService } from '../services/PipelineConfigService';

const MiniScorePieChart: React.FC<{ score: number; status?: string }> = ({ score, status }) => {
  const roundedScore = Math.round(score);
  const size = 26;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(Math.max(roundedScore, 0), 100) / 100) * circumference;

  let strokeClass = 'stroke-emerald-500';
  if (status) {
    const s = status.toUpperCase();
    if (s === 'STRONG' || s === 'HEALTHY') {
      strokeClass = 'stroke-emerald-500';
    } else if (s === 'CRITICAL' || s === 'AT_RISK' || s === 'WEAK') {
      strokeClass = 'stroke-red-500';
    } else if (s === 'MODERATE') {
      strokeClass = 'stroke-amber-500';
    } else {
      strokeClass = 'stroke-text-secondary/40';
    }
  } else {
    if (roundedScore >= 75) {
      strokeClass = 'stroke-emerald-500';
    } else if (roundedScore >= 55) {
      strokeClass = 'stroke-amber-500';
    } else if (roundedScore > 0) {
      strokeClass = 'stroke-red-500';
    } else {
      strokeClass = 'stroke-text-secondary/40';
    }
  }

  return (
    <div className="flex items-center justify-center select-none">
      <div
        className="relative inline-flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
      >
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

function formatDateMMDDYYYY(ts?: string): string {
  if (!ts) return '--';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '--';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

export interface PipelineDirectoryTableProps {
  items: PipelineCardItem[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  healthFilter: 'ALL' | 'UNASSESSED' | 'STRONG' | 'HEALTHY' | 'MODERATE' | 'AT_RISK';
  onItemsPurged?: (purgedIds: string[]) => void;
}

export const PipelineDirectoryTable: React.FC<PipelineDirectoryTableProps> = ({
  items,
  loading,
  searchQuery,
  onSearchChange,
  healthFilter,
  onItemsPurged
}) => {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeletedOnly, setShowDeletedOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [deletedIds, setDeletedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('pipeline_directory_deleted_ids');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [purgedIds, setPurgedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('pipeline_directory_purged_ids');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('pipeline_directory_deleted_ids', JSON.stringify(deletedIds));
    } catch {}
  }, [deletedIds]);

  useEffect(() => {
    try {
      localStorage.setItem('pipeline_directory_purged_ids', JSON.stringify(purgedIds));
    } catch {}
  }, [purgedIds]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, showDeletedOnly, healthFilter]);

  const resolvedRows = useMemo(() => {
    return items
      .filter((item) => !purgedIds.includes(item.id))
      .map((item) => {
        const assess = item.pipeline_opp?.latest_assessment;
        const statusEval = assess
          ? PipelineConfigService.resolvePipelineAssessmentClassifications({
              baseWinability: assess.base_winability ?? 0,
              riskAdjustedWinability: assess.risk_adjusted_winability ?? 0,
              assessmentConfidence: assess.assessment_confidence ?? 0,
              pipelineHealth: assess.pipeline_health
            })
          : null;

        const targetUrl = `/product/revos/pipeline?opportunityId=${encodeURIComponent(
          item.id
        )}${item.lead_id ? `&leadId=${encodeURIComponent(item.lead_id)}` : ''}&source=pipeline_directory`;

        const winningPossibility = statusEval?.winabilityLabel || 'Pending Assessment';
        const healthStatus = assess?.pipeline_health || 'UNASSESSED';
        const assessmentNo = assess?.assessment_sequence ? `#${assess.assessment_sequence}` : '--';
        const assessmentDate = assess
          ? formatDateMMDDYYYY(assess.completed_at || assess.updated_at || assess.created_at)
          : '--';
        const estimatedValueStr =
          item.estimated_value > 0 ? `$${item.estimated_value.toLocaleString('en-US')}` : '—';

        return {
          item,
          assess,
          targetUrl,
          opportunityName: item.opportunity_name || '—',
          customer: item.company_name || '—',
          businessSegment: item.business_segment || item.industry || 'Enterprise Cloud Software',
          revenueMotion: item.revenue_motion || 'Digital Solution Selling',
          opportunityStage: item.opportunity_stage || 'Validated Opportunity',
          pipelineStage: item.pipeline_stage || 'Qualification',
          estimatedValueStr,
          closeDate: item.expected_close_date || item.pipeline_opp?.expected_close_date || '—',
          owner: item.opportunity_owner || item.pipeline_opp?.opportunity_owner || 'Senior Enterprise AE',
          baseWin: assess ? Math.round(Number(assess.base_winability ?? 0)) : null,
          riskAdj: assess ? Math.round(Number(assess.risk_adjusted_winability ?? 0)) : null,
          winningPossibility,
          healthStatus,
          assessmentNo,
          assessmentDate
        };
      });
  }, [items, purgedIds]);

  const visibleRows = useMemo(() => {
    return resolvedRows.filter((row) => {
      const isDeleted = deletedIds.includes(row.item.id);
      if (showDeletedOnly) {
        if (!isDeleted) return false;
      } else {
        if (isDeleted) return false;
      }

      if (healthFilter !== 'ALL') {
        const h = row.assess?.pipeline_health;
        if (healthFilter === 'UNASSESSED' && h) return false;
        if (healthFilter === 'AT_RISK' && h !== 'AT_RISK' && h !== 'CRITICAL') return false;
        if (healthFilter !== 'UNASSESSED' && healthFilter !== 'AT_RISK' && h !== healthFilter) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          row.opportunityName.toLowerCase().includes(q) ||
          row.customer.toLowerCase().includes(q) ||
          row.businessSegment.toLowerCase().includes(q) ||
          row.revenueMotion.toLowerCase().includes(q) ||
          row.opportunityStage.toLowerCase().includes(q) ||
          row.pipelineStage.toLowerCase().includes(q) ||
          row.owner.toLowerCase().includes(q) ||
          row.winningPossibility.toLowerCase().includes(q) ||
          row.healthStatus.toLowerCase().includes(q) ||
          row.assessmentNo.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [resolvedRows, deletedIds, showDeletedOnly, healthFilter, searchQuery]);

  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(visibleRows.length / itemsPerPage));
  const paginatedRows = visibleRows.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedRows.map((r) => r.item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    setDeletedIds((prev) => Array.from(new Set([...prev, ...selectedIds])));
    setSelectedIds([]);
  };

  const handleRestoreSelected = () => {
    if (selectedIds.length === 0) return;
    setDeletedIds((prev) => prev.filter((id) => !selectedIds.includes(id)));
    setSelectedIds([]);
  };

  const handlePermanentDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const toPurge = [...selectedIds];
    const pipeIdsToDelete = resolvedRows
      .filter((r) => toPurge.includes(r.item.id) && r.item.pipeline_opp?.pipeline_id)
      .map((r) => r.item.pipeline_opp!.pipeline_id);

    if (pipeIdsToDelete.length > 0) {
      try {
        await supabase
          .from('pipeline_opportunities')
          .delete()
          .in('pipeline_id', pipeIdsToDelete);
      } catch (err) {
        console.warn('Non-blocking warning purging pipeline_opportunities rows:', err);
      }
    }

    setPurgedIds((prev) => Array.from(new Set([...prev, ...toPurge])));
    setDeletedIds((prev) => prev.filter((id) => !toPurge.includes(id)));
    setSelectedIds([]);
    if (onItemsPurged) onItemsPurged(toPurge);
  };

  const handleExportCSV = () => {
    const headers = [
      'SN',
      'Opportunity Name',
      'Customer',
      'Business Segment',
      'Revenue Motion',
      'Opportunity Stage',
      'Pipeline Stage',
      'Estimated Value',
      'Close Date',
      'Owner',
      'Base Win',
      'Risk-Adj',
      'Winning Possibility',
      'Health',
      'Assessment No.',
      'Assessment Date'
    ];

    const csvRows = [headers.join(',')];

    visibleRows.forEach((row, idx) => {
      const esc = (v: string | number | null | undefined) =>
        `"${String(v ?? '').replace(/"/g, '""')}"`;
      const line = [
        idx + 1,
        esc(row.opportunityName),
        esc(row.customer),
        esc(row.businessSegment),
        esc(row.revenueMotion),
        esc(row.opportunityStage),
        esc(row.pipelineStage),
        esc(row.estimatedValueStr),
        esc(row.closeDate),
        esc(row.owner),
        row.baseWin !== null ? `${row.baseWin}%` : '--',
        row.riskAdj !== null ? `${row.riskAdj}%` : '--',
        esc(row.winningPossibility),
        esc(row.healthStatus),
        esc(row.assessmentNo),
        esc(row.assessmentDate)
      ];
      csvRows.push(line.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pipeline_directory_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getWinningPossibilityBadge = (label: string, assessed: boolean) => {
    if (!assessed) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-bg-primary text-text-secondary border border-border text-[9px] font-mono font-bold uppercase tracking-wider whitespace-nowrap">
          Pending
        </span>
      );
    }
    const lower = label.toLowerCase();
    if (lower.includes('high')) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-mono font-bold uppercase tracking-wider whitespace-nowrap">
          {label}
        </span>
      );
    }
    if (lower.includes('moderate')) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-mono font-bold uppercase tracking-wider whitespace-nowrap">
          {label}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 text-[9px] font-mono font-bold uppercase tracking-wider whitespace-nowrap">
        {label}
      </span>
    );
  };

  const getHealthBadge = (health: string) => {
    const upper = String(health || '').toUpperCase();
    if (upper === 'STRONG') {
      return (
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-mono font-bold uppercase tracking-wider whitespace-nowrap">
          STRONG
        </span>
      );
    }
    if (upper === 'HEALTHY') {
      return (
        <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[9px] font-mono font-bold uppercase tracking-wider whitespace-nowrap">
          HEALTHY
        </span>
      );
    }
    if (upper === 'MODERATE') {
      return (
        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-mono font-bold uppercase tracking-wider whitespace-nowrap">
          MODERATE
        </span>
      );
    }
    if (upper === 'AT_RISK' || upper === 'CRITICAL') {
      return (
        <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 text-[9px] font-mono font-bold uppercase tracking-wider whitespace-nowrap">
          {upper === 'AT_RISK' ? 'AT RISK' : 'CRITICAL'}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full bg-bg-primary text-text-secondary border border-border text-[9px] font-mono font-bold uppercase tracking-wider whitespace-nowrap">
        UNASSESSED
      </span>
    );
  };

  const activeTrashCount = deletedIds.filter((id) => !purgedIds.includes(id)).length;

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-300">
      {/* Toolbar matching SqlToOpportunityTable */}
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
                <span>{visibleRows.length} active pipeline(s)</span>
              )}
            </span>
          )}

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search pipelines..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-bg-surface border border-border text-text-primary placeholder:text-text-secondary/45 font-sans text-xs font-normal rounded-xl pl-8 pr-8 py-1.5 focus:outline-none focus:border-accent shadow-sm"
            />
            <svg
              className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-secondary/60"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-2 hover:text-text-primary text-text-secondary transition-colors cursor-pointer"
                title="Clear search"
              >
                <svg
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
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
                type="button"
                onClick={handleRestoreSelected}
                disabled={selectedIds.length === 0}
                className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 disabled:opacity-50 font-black text-[10px] rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Restore
              </button>
              <button
                type="button"
                onClick={handlePermanentDeleteSelected}
                disabled={selectedIds.length === 0}
                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 disabled:opacity-50 font-black text-[10px] rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                title="Permanently remove selected items from pipeline directory"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Purge
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeletedOnly(false);
                  setSelectedIds([]);
                }}
                className="px-3 py-1.5 bg-bg-surface border border-border text-text-primary hover:bg-bg-primary/50 font-black text-[10px] rounded-xl uppercase tracking-wider transition-all cursor-pointer"
              >
                Back to Active
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleDeleteSelected}
                disabled={selectedIds.length === 0}
                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 disabled:opacity-50 font-black text-[10px] rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                title="Soft-delete selected items"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-bg-surface border border-border text-text-primary hover:bg-bg-primary/50 font-black text-[10px] rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                title="Export list to CSV"
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeletedOnly(true);
                  setSelectedIds([]);
                }}
                className={`px-3 py-1.5 border font-black text-[10px] rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTrashCount > 0
                    ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                    : 'bg-bg-surface text-text-secondary border-border hover:bg-bg-primary/50'
                }`}
                title="View soft-deleted items"
              >
                <Trash className="h-3.5 w-3.5" />
                Trash ({activeTrashCount})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar-horizontal-neutral pb-2">
          <table className="w-full text-left text-xs min-w-[2180px]">
            <thead className="bg-bg-primary/50 border-b border-border text-text-secondary font-mono uppercase tracking-wider">
              <tr>
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      paginatedRows.length > 0 &&
                      paginatedRows.every((r) => selectedIds.includes(r.item.id))
                    }
                    onChange={handleSelectAll}
                    className="rounded border-border bg-bg-surface focus:ring-0 text-accent cursor-pointer"
                  />
                </th>
                <th className="p-4 w-12 min-w-[48px] text-center font-bold">SN</th>
                <th className="p-4 font-bold min-w-[320px] w-[320px]">Opportunity Name</th>
                <th className="p-4 font-bold min-w-[160px]">Customer</th>
                <th className="p-4 font-bold min-w-[170px]">Business Segment</th>
                <th className="p-4 font-bold min-w-[180px]">Revenue Motion</th>
                <th className="p-4 font-bold min-w-[160px]">Opportunity Stage</th>
                <th className="p-4 font-bold min-w-[150px]">Pipeline Stage</th>
                <th className="p-4 font-bold w-[140px] min-w-[140px]">Estimated Value</th>
                <th className="p-4 font-bold min-w-[120px]">Close Date</th>
                <th className="p-4 font-bold min-w-[150px]">Owner</th>
                <th className="p-4 font-bold text-center min-w-[90px]">Base Win</th>
                <th className="p-4 font-bold text-center min-w-[90px]">Risk-Adj</th>
                <th className="p-4 font-bold min-w-[165px]">Winning Possibility</th>
                <th className="p-4 font-bold min-w-[120px]">Health</th>
                <th className="p-4 font-bold text-center min-w-[120px]">Assessment No.</th>
                <th className="p-4 font-bold text-center min-w-[130px]">Assessment Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={17} className="p-8 text-center text-text-secondary">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                      <span>Loading Pipeline Directory Data...</span>
                    </div>
                  </td>
                </tr>
              ) : visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={17} className="p-8 text-center text-text-secondary">
                    No pipeline opportunities match your selection.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => {
                  const serialNumber = (currentPage - 1) * itemsPerPage + idx + 1;
                  return (
                    <tr
                      key={row.item.id}
                      onClick={() => navigate(row.targetUrl)}
                      className="hover:bg-bg-primary/30 transition-colors cursor-pointer"
                    >
                      <td
                        className="p-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(row.item.id)}
                          onChange={(e) => handleSelectRow(row.item.id, e.target.checked)}
                          className="rounded border-border bg-bg-surface focus:ring-0 text-accent cursor-pointer"
                        />
                      </td>
                      <td className="p-4 w-12 min-w-[48px] text-center font-mono font-medium text-text-secondary">
                        {serialNumber}
                      </td>
                      <td className="p-4 font-bold min-w-[320px] w-[320px]">
                        <span className="text-left text-accent hover:underline hover:text-accent/80 font-bold transition-all">
                          {row.opportunityName}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-text-primary">{row.customer}</td>
                      <td className="p-4 text-text-secondary font-medium">{row.businessSegment}</td>
                      <td className="p-4 text-text-secondary font-medium">{row.revenueMotion}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 bg-bg-primary rounded border border-border text-[10px] text-text-secondary whitespace-nowrap">
                          {row.opportunityStage}
                        </span>
                      </td>
                      <td className="p-4 text-text-secondary font-medium whitespace-nowrap">
                        {row.pipelineStage}
                      </td>
                      <td className="p-4 font-mono font-bold text-text-primary w-[140px] min-w-[140px]">
                        {row.estimatedValueStr}
                      </td>
                      <td className="p-4 text-text-secondary font-medium whitespace-nowrap">
                        {row.closeDate}
                      </td>
                      <td className="p-4 text-text-secondary whitespace-nowrap">{row.owner}</td>
                      <td className="p-4 text-center">
                        <div className="inline-flex justify-center w-full">
                          {row.baseWin !== null ? (
                            <MiniScorePieChart score={row.baseWin} />
                          ) : (
                            <span className="font-mono text-text-secondary/60">--</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex justify-center w-full">
                          {row.riskAdj !== null ? (
                            <MiniScorePieChart score={row.riskAdj} status={row.healthStatus} />
                          ) : (
                            <span className="font-mono text-text-secondary/60">--</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {getWinningPossibilityBadge(row.winningPossibility, Boolean(row.assess))}
                      </td>
                      <td className="p-4">{getHealthBadge(row.healthStatus)}</td>
                      <td className="p-4 text-center font-mono font-medium text-text-secondary">
                        {row.assessmentNo}
                      </td>
                      <td className="p-4 text-center font-mono text-text-secondary whitespace-nowrap">
                        {row.assessmentDate}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer matching SqlToOpportunityTable */}
        {!loading && visibleRows.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-border bg-bg-surface text-xs text-text-secondary select-none">
            <div className="font-medium">
              Showing{' '}
              <span className="font-semibold text-text-primary">
                {Math.min(visibleRows.length, (currentPage - 1) * itemsPerPage + 1)}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-text-primary">
                {Math.min(visibleRows.length, currentPage * itemsPerPage)}
              </span>{' '}
              of <span className="font-semibold text-text-primary">{visibleRows.length}</span>{' '}
              results
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
                      type="button"
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

                if (
                  (page === 2 && currentPage > 3) ||
                  (page === totalPages - 1 && currentPage < totalPages - 2)
                ) {
                  return (
                    <span key={page} className="px-1 text-text-secondary select-none">
                      ...
                    </span>
                  );
                }

                return null;
              })}

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
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

export default PipelineDirectoryTable;
