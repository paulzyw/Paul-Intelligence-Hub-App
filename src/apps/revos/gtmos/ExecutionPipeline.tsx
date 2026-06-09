import React, { useState, useMemo } from 'react';
import { 
  Briefcase, CheckCircle, Clock, AlertCircle, ArrowUpRight, Search, 
  Filter, TrendingUp, Users, Target, Save, CheckSquare, ChevronRight, 
  RefreshCw, Layers, Award, Activity, SearchIcon
} from 'lucide-react';
import { GTMOSProject, GTMExecutionPlan, GTMWorkstream, GTMInitiative, GTMActionItem, GTMKPI } from './types';

interface ExecutionPipelineProps {
  projects: GTMOSProject[];
  currentProjectId: string;
  onUpdateProjectPlan: (projectId: string, plan: GTMExecutionPlan) => void;
}

interface ActionRow {
  projectId: string;
  projectTitle: string;
  programName: string;
  workstreamId: string;
  workstreamName: string;
  initiativeId: string;
  initiativeName: string;
  action: GTMActionItem;
  kpis: GTMKPI[];
}

export const ExecutionPipeline: React.FC<ExecutionPipelineProps> = ({
  projects,
  currentProjectId,
  onUpdateProjectPlan
}) => {
  // Filter states
  const [projectFilter, setProjectFilter] = useState<string>(currentProjectId || 'all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [editingKpiValue, setEditingKpiValue] = useState<{ kpiId: string; value: string } | null>(null);

  // Parse all archived execution plans and flatten them into action rows
  const allActionRows = useMemo(() => {
    const rows: ActionRow[] = [];
    
    projects.forEach(proj => {
      const plan = proj.archivedExecutionPlan;
      if (!plan || !plan.workstreams) return;

      plan.workstreams.forEach((ws) => {
        if (!ws.initiatives) return;
        ws.initiatives.forEach((init) => {
          if (!init.actions) return;
          init.actions.forEach((act) => {
            rows.push({
              projectId: proj.id,
              projectTitle: proj.title,
              programName: plan.programName || 'GTM Strategy',
              workstreamId: ws.id,
              workstreamName: ws.workstreamName,
              initiativeId: init.id,
              initiativeName: init.initiativeName,
              action: act,
              kpis: init.kpis || []
            });
          });
        });
      });
    });

    return rows;
  }, [projects]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return allActionRows.filter(row => {
      // Project filter
      if (projectFilter !== 'all' && row.projectId !== projectFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && row.action.status !== statusFilter) {
        return false;
      }
      // Priority filter
      if (priorityFilter !== 'all' && row.action.taskType?.toLowerCase() !== priorityFilter.toLowerCase()) {
        // Fallback checks for priority in initiatives or action level info
        const matchesType = row.action.taskType?.toLowerCase() === priorityFilter.toLowerCase();
        const matchesOwner = row.action.owner?.toLowerCase() === priorityFilter.toLowerCase();
        if (!matchesType && !matchesOwner) {
          // If filtering by "completed" etc., skip
        }
      }
      
      // Search term
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const matchAction = row.action.actionName.toLowerCase().includes(query) || 
                            row.action.description?.toLowerCase().includes(query) ||
                            row.action.owner?.toLowerCase().includes(query);
        const matchInitiative = row.initiativeName.toLowerCase().includes(query);
        const matchWs = row.workstreamName.toLowerCase().includes(query);
        const matchProject = row.projectTitle.toLowerCase().includes(query);
        
        return matchAction || matchInitiative || matchWs || matchProject;
      }

      return true;
    });
  }, [allActionRows, projectFilter, statusFilter, priorityFilter, searchTerm]);

  // Aggregate stats across active/filtered rows
  const stats = useMemo(() => {
    const activeRows = projectFilter === 'all' 
      ? allActionRows 
      : allActionRows.filter(r => r.projectId === projectFilter);

    const total = activeRows.length;
    const completed = activeRows.filter(r => r.action.status === 'completed').length;
    const inProgress = activeRows.filter(r => r.action.status === 'in_progress').length;
    const blocked = activeRows.filter(r => r.action.status === 'blocked').length;
    const todo = activeRows.filter(r => r.action.status === 'todo').length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, blocked, todo, completionRate };
  }, [allActionRows, projectFilter]);

  // Function to helper-parse values and return progress percentages
  const parseVal = (val: string) => {
    if (!val) return 0;
    const parsed = parseFloat(val.replace(/[^0-9.]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  };

  // Safe KPI attainment indicator
  const calculateKpiAttainment = (kpi: GTMKPI) => {
    const baselineNum = parseVal(kpi.baseline);
    const targetNum = parseVal(kpi.target);
    const currentNum = parseVal(kpi.currentValue);

    if (Math.abs(targetNum - baselineNum) === 0) return 0;

    const progress = (currentNum - baselineNum) / (targetNum - baselineNum);
    const percent = Math.min(Math.max(Math.round(progress * 100), 0), 100);
    return percent;
  };

  // Update action status in the database
  const handleUpdateStatus = (row: ActionRow, nextStatus: 'todo' | 'in_progress' | 'completed' | 'blocked') => {
    const targetProj = projects.find(p => p.id === row.projectId);
    if (!targetProj || !targetProj.archivedExecutionPlan) return;

    const originalPlan = targetProj.archivedExecutionPlan;

    // Helper to format values
    const parseValueHelper = (val: string) => {
      if (!val) return { num: 0, hasPercent: false, hasDollar: false };
      const cleaned = val.replace(/[^0-9.]/g, '');
      const num = parseFloat(cleaned) || 0;
      return {
        num,
        hasPercent: val.includes('%'),
        hasDollar: val.includes('$')
      };
    };

    const formatValueHelper = (num: number, hasPercent: boolean, hasDollar: boolean) => {
      let formatted = num.toFixed(0);
      if (hasDollar) {
        if (num >= 1000) {
          formatted = Math.round(num).toLocaleString('en-US');
        }
        return `$${formatted}`;
      }
      if (hasPercent) {
        return `${formatted}%`;
      }
      return formatted;
    };

    const updatedWorkstreams = originalPlan.workstreams.map(ws => {
      if (ws.id !== row.workstreamId) return ws;
      
      return {
        ...ws,
        initiatives: ws.initiatives.map(init => {
          if (init.id !== row.initiativeId) return init;

          // Update status of actual action
          const nextActions = init.actions.map(act => {
            if (act.id === row.action.id) {
              return { ...act, status: nextStatus };
            }
            return act;
          });

          // Recalculate KPI progress based on percentage of completed tasks
          const totalActions = nextActions.length;
          const completedActions = nextActions.filter(a => a.status === 'completed').length;
          const progressMultiplier = totalActions > 0 ? (completedActions / totalActions) : 0;

          // Automatically shift KPI current levels closer to targets
          const updatedKPIs = init.kpis.map(kpi => {
            const baseInfo = parseValueHelper(kpi.baseline);
            const targetInfo = parseValueHelper(kpi.target);
            const nextValNum = baseInfo.num + (targetInfo.num - baseInfo.num) * progressMultiplier;
            const updatedVal = formatValueHelper(nextValNum, targetInfo.hasPercent, targetInfo.hasDollar);
            return {
              ...kpi,
              currentValue: updatedVal
            };
          });

          return {
            ...init,
            actions: nextActions,
            kpis: updatedKPIs
          };
        })
      };
    });

    const finalPlan = {
      ...originalPlan,
      workstreams: updatedWorkstreams
    };

    onUpdateProjectPlan(row.projectId, finalPlan);
    triggerFeedback();
  };

  // Direct manual update of KPI value attainment
  const handleUpdateKPIValue = (row: ActionRow, kpiId: string, value: string) => {
    const targetProj = projects.find(p => p.id === row.projectId);
    if (!targetProj || !targetProj.archivedExecutionPlan) return;

    const originalPlan = targetProj.archivedExecutionPlan;

    const updatedWorkstreams = originalPlan.workstreams.map(ws => {
      if (ws.id !== row.workstreamId) return ws;
      return {
        ...ws,
        initiatives: ws.initiatives.map(init => {
          if (init.id !== row.initiativeId) return init;
          return {
            ...init,
            kpis: init.kpis.map(kpi => {
              if (kpi.id === kpiId) {
                return { ...kpi, currentValue: value };
              }
              return kpi;
            })
          };
        })
      };
    });

    const finalPlan = {
      ...originalPlan,
      workstreams: updatedWorkstreams
    };

    onUpdateProjectPlan(row.projectId, finalPlan);
    triggerFeedback();
  };

  const triggerFeedback = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-bg-surface/30 p-6 rounded-3xl border border-border/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-accent uppercase block">Live Pipeline Ledger</span>
            <span className="px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-[9px] font-mono text-accent flex items-center gap-1 animate-pulse">
              <Activity className="h-2.5 w-2.5" /> Integrated Tracking
            </span>
          </div>
          <h2 className="text-lg font-black text-text-primary tracking-tight">Step 16: Operational Execution Pipeline</h2>
          <p className="text-xs text-text-secondary max-w-2xl leading-relaxed">
            Consolidates active actions, strategic workstreams, and indicator goals from your live executed GTM programs. Update operational readiness in real time and measure direct KPI attainment of strategic outcomes.
          </p>
        </div>

        {/* Sync Trigger feedback indicator */}
        <div className="flex items-center gap-3 shrink-0">
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-[10px] font-sans font-black transition-all ${
            saveSuccess 
              ? 'bg-[#00F090]/10 border-[#00F090]/30 text-[#00F090]' 
              : 'bg-bg-surface/50 border-border text-text-secondary'
          }`}>
            <RefreshCw className={`h-3 w-3 ${saveSuccess ? 'animate-spin' : ''}`} />
            {saveSuccess ? 'Real-time Synced' : 'Database Connected'}
          </div>
        </div>
      </div>

      {/* Aggregate Scorecards panel */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-bg-surface/40 border border-border space-y-1">
          <div className="text-[9px] font-mono font-bold text-text-secondary uppercase">Initiative Streams</div>
          <div className="text-xl font-black text-text-primary flex items-baseline gap-1">
            {stats.total} <span className="text-[10px] font-mono text-text-secondary">active actions</span>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#00F090]/5 border border-[#00F090]/10 space-y-1">
          <div className="text-[9px] font-mono font-bold text-[#00F090] uppercase flex items-center gap-1">
            <CheckCircle className="h-2.5 w-2.5" /> Accomplished
          </div>
          <div className="text-xl font-black text-[#00F090]">{stats.completed}</div>
        </div>
        <div className="p-4 rounded-2xl bg-accent/5 border border-accent/10 space-y-1">
          <div className="text-[9px] font-mono font-bold text-accent uppercase flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" /> In Active Drift
          </div>
          <div className="text-xl font-black text-accent">{stats.inProgress}</div>
        </div>
        <div className="p-4 rounded-2xl bg-red-400/5 border border-red-400/10 space-y-1">
          <div className="text-[9px] font-mono font-bold text-red-400 uppercase flex items-center gap-1">
            <AlertCircle className="h-2.5 w-2.5" /> Blocked/Delayed
          </div>
          <div className="text-xl font-black text-red-400">{stats.blocked}</div>
        </div>
        <div className="p-4 rounded-2xl bg-bg-surface/40 border border-border space-y-1 col-span-2 md:col-span-1">
          <div className="text-[9px] font-mono font-bold text-text-secondary uppercase">Completion Yield</div>
          <div className="flex items-center gap-2">
            <div className="text-xl font-black text-text-primary">{stats.completionRate}%</div>
            <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-[#00F090] h-full rounded-full transition-all duration-500" 
                style={{ width: `${stats.completionRate}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Structured Controls Section */}
      <div className="bg-bg-surface/20 p-4 rounded-2xl border border-border/80 flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search Input block */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-secondary/60" />
          <input 
            type="text" 
            placeholder="Search Actions, Objectives or Owners..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 border border-border bg-bg-surface/60 rounded-xl focus:border-accent text-text-primary placeholder-text-secondary/60 focus:outline-none"
          />
        </div>

        {/* Filter selection widgets */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Project switch */}
          <div className="flex items-center gap-1.5 bg-bg-surface border border-border px-2.5 py-1 rounded-xl text-xs">
            <Briefcase className="h-3.5 w-3.5 text-text-secondary/80" />
            <select
              value={projectFilter}
              onChange={e => setProjectFilter(e.target.value)}
              className="bg-transparent text-text-primary font-bold focus:outline-none pr-3"
            >
              <option value="all" className="bg-bg-primary text-text-primary">All Active Projects</option>
              {projects.filter(p => p.archivedExecutionPlan).map(p => (
                <option key={p.id} value={p.id} className="bg-bg-primary text-text-primary">{p.title}</option>
              ))}
            </select>
          </div>

          {/* Status switch */}
          <div className="flex items-center gap-1.5 bg-bg-surface border border-border px-2.5 py-1 rounded-xl text-xs">
            <CheckSquare className="h-3.5 w-3.5 text-text-secondary/80" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-transparent text-text-primary font-bold focus:outline-none pr-3"
            >
              <option value="all">All Statuses</option>
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Ledger Spreadsheet panel */}
      <div className="border border-border rounded-2xl overflow-hidden bg-bg-surface/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-border bg-bg-surface/60 text-[9px] font-mono uppercase tracking-wider text-text-secondary">
                <th className="py-3 px-4 w-[250px]">Execution Stream / Workstream</th>
                <th className="py-3 px-4 w-[280px]">Initiative & Tactical Action</th>
                <th className="py-3 px-4 w-[120px]">Live Status</th>
                <th className="py-3 px-4 w-[250px]">KPI Goal Target & Attainment</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <div className="max-w-md mx-auto space-y-2">
                      <Target className="h-8 w-8 text-text-secondary/40 mx-auto animate-pulse" />
                      <p className="text-xs font-bold text-text-secondary">No matching active GTM actions found</p>
                      <p className="text-[10px] text-text-secondary/75 leading-relaxed">
                        Ensure you have successfully archived a GTM Execution Plan in Step 15 to track it inside this live pipeline.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr 
                    key={row.action.id} 
                    className="border-b border-border/70 hover:bg-bg-surface/40 transition-colors"
                  >
                    {/* Column 1: Stream Information */}
                    <td className="py-3 px-4 align-top space-y-1">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-extrabold text-accent uppercase tracking-wider truncate max-w-[220px]">
                          {row.projectTitle}
                        </span>
                        <span className="text-[8px] font-mono text-text-secondary/70 uppercase">
                          {row.programName}
                        </span>
                      </div>
                      <div className="pt-2">
                        <div className="flex items-center gap-1 text-[11px] font-black text-text-primary">
                          <Layers className="h-3 w-3 text-text-secondary hover:text-accent" />
                          <span className="line-clamp-2 leading-tight">{row.workstreamName}</span>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Action details */}
                    <td className="py-3 px-4 align-top space-y-2">
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-text-secondary/80 bg-bg-surface/60 border border-border px-1.5 py-0.5 rounded-md">
                          Initiative: {row.initiativeName}
                        </span>
                        <h4 className="text-xs font-black text-text-primary leading-snug">
                          {row.action.actionName}
                        </h4>
                        {row.action.description && (
                          <p className="text-[10px] text-text-secondary/80 font-sans leading-normal">
                            {row.action.description}
                          </p>
                        )}
                      </div>
                      
                      {/* Sub row meta tags */}
                      <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-[9px] font-mono text-text-secondary/70">
                        <span className="flex items-center gap-1">
                          <Users className="h-2.5 w-2.5 text-accent" /> {row.action.owner || 'Unassigned'}
                        </span>
                        {row.action.dueDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" /> Due: {row.action.dueDate}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Column 3: Live interactive status selector */}
                    <td className="py-3 px-4 align-top">
                      <div className="relative inline-block w-full">
                        <select
                          value={row.action.status}
                          onChange={(e) => handleUpdateStatus(row, e.target.value as any)}
                          className={`w-full text-[10px] font-bold py-1.5 px-2 rounded-xl focus:outline-none border select-none tracking-wider uppercase transition-all ${
                            row.action.status === 'completed'
                              ? 'bg-status-success-bg/25 border-status-success/30 text-status-success'
                              : row.action.status === 'in_progress'
                              ? 'bg-status-progress-bg/25 border-status-progress/30 text-status-progress'
                              : row.action.status === 'blocked'
                              ? 'bg-status-danger-bg/25 border-status-danger/30 text-status-danger font-semibold'
                              : 'bg-bg-surface border-border text-text-secondary'
                          }`}
                        >
                          <option value="todo">Todo</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="blocked">Blocked</option>
                        </select>
                      </div>
                    </td>

                    {/* Column 4: Associated KPI Goal Tracker & direct achievement inputs */}
                    <td className="py-3 px-4 align-top space-y-3 w-[260px]">
                      {row.kpis.length === 0 ? (
                        <div className="text-[10px] text-text-secondary/65 italic font-sans flex items-center gap-1.5 pt-1.5">
                          <AlertCircle className="h-3 w-3 text-text-secondary/40" />
                          No direct KPI defined
                        </div>
                      ) : (
                        row.kpis.map((kpi) => {
                          const attainment = calculateKpiAttainment(kpi);
                          const isEditingThisKpi = editingKpiValue?.kpiId === kpi.id;

                          return (
                            <div key={kpi.id} className="p-2 rounded-xl bg-bg-surface/50 border border-border/80 space-y-2">
                              {/* KPI Title */}
                              <div className="flex justify-between items-start gap-1">
                                <div className="space-y-0.5">
                                  <div className="text-[8px] font-mono text-text-secondary/70 uppercase">
                                    {kpi.kpiCategory || 'Performance Indic.'}
                                  </div>
                                  <h6 className="text-[10px] font-bold text-text-primary leading-tight line-clamp-2">
                                    {kpi.kpiName}
                                  </h6>
                                </div>
                                <span className="text-[9px] font-mono font-bold text-accent shrink-0">
                                  {attainment}% Attained
                                </span>
                              </div>

                              {/* Target boundaries */}
                              <div className="grid grid-cols-2 gap-1 text-[8px] font-mono text-text-secondary bg-bg-surface p-1 rounded-md">
                                <div>Baseline: <span className="text-text-primary font-bold">{kpi.baseline}</span></div>
                                <div>Target Goal: <span className="text-accent font-bold">{kpi.target}</span></div>
                              </div>

                              {/* Interactive In-line Achievement value trigger */}
                              <div className="space-y-1">
                                <div className="text-[8px] font-mono text-text-secondary flex justify-between">
                                  <span>Final Achievement:</span>
                                  {isEditingThisKpi && <span className="text-accent">Editing...</span>}
                                </div>
                                <div className="flex gap-1">
                                  <input 
                                    type="text" 
                                    value={
                                      isEditingThisKpi 
                                        ? editingKpiValue.value 
                                        : kpi.currentValue || ''
                                    }
                                    onFocus={() => {
                                      setEditingKpiValue({ kpiId: kpi.id, value: kpi.currentValue || '' });
                                    }}
                                    onChange={(e) => {
                                      setEditingKpiValue({ kpiId: kpi.id, value: e.target.value });
                                    }}
                                    onBlur={() => {
                                      if (editingKpiValue) {
                                        handleUpdateKPIValue(row, kpi.id, editingKpiValue.value);
                                        setEditingKpiValue(null);
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && editingKpiValue) {
                                        handleUpdateKPIValue(row, kpi.id, editingKpiValue.value);
                                        setEditingKpiValue(null);
                                      }
                                    }}
                                    className="w-full text-xs bg-bg-surface border border-border px-2 py-1 rounded-lg text-text-primary font-mono focus:border-accent focus:outline-none"
                                    placeholder={kpi.baseline}
                                  />
                                </div>
                              </div>

                              {/* Progress bar representing alignment */}
                              <div className="w-full bg-border rounded-full h-1 overflow-hidden">
                                <div 
                                  className="bg-accent h-full rounded-full transition-all duration-300" 
                                  style={{ width: `${attainment}%` }} 
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
