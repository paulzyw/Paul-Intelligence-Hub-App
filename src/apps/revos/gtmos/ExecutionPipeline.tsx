import React, { useState, useMemo, Fragment } from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Activity, 
  Search, 
  Trash2, 
  Target, 
  Layers, 
  Users,
  CheckSquare,
  Briefcase,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  BarChartHorizontal,
  Calendar
} from 'lucide-react';
import { GTMOSProject, GTMActionItem, GTMKPI, GTMExecutionPlan, GTMInitiative } from './types';

interface ExecutionPipelineProps {
  projects: GTMOSProject[];
  currentProjectId: string;
  onUpdateProjectPlan: (projectId: string, plan: GTMExecutionPlan) => void;
}

interface InitiativeRow {
  projectId: string;
  projectTitle: string;
  programName: string;
  workstreamId: string;
  workstreamName: string;
  initiative: GTMInitiative;
}

export const ExecutionPipeline: React.FC<ExecutionPipelineProps> = ({
  projects,
  currentProjectId,
  onUpdateProjectPlan
}) => {
  // Filter states
  const [projectFilter, setProjectFilter] = useState<string>(currentProjectId || 'all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showGanttChart, setShowGanttChart] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [editingKpiValue, setEditingKpiValue] = useState<{ kpiId: string; value: string } | null>(null);
  const [actionToDelete, setActionToDelete] = useState<{ row: InitiativeRow, actionId: string, actionName: string } | null>(null);

  // Parse all archived execution plans and flatten them into initiative rows
  const allInitiativeRows = useMemo(() => {
    const rows: InitiativeRow[] = [];
    
    projects.forEach(proj => {
      const plan = proj.archivedExecutionPlan;
      if (!plan || !plan.workstreams) return;

      plan.workstreams.forEach((ws) => {
        if (!ws.initiatives) return;
        ws.initiatives.forEach((init) => {
          rows.push({
            projectId: proj.id,
            projectTitle: proj.title,
            programName: plan.programName || 'GTM Strategy',
            workstreamId: ws.id,
            workstreamName: ws.workstreamName,
            initiative: init
          });
        });
      });
    });

    return rows;
  }, [projects]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return allInitiativeRows.map(row => {
      let filteredActions = row.initiative.actions || [];

      // Status filter
      if (statusFilter !== 'all') {
        filteredActions = filteredActions.filter(act => act.status === statusFilter);
      }
      
      // Search term
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        filteredActions = filteredActions.filter(act => 
          act.actionName.toLowerCase().includes(query) || 
          act.description?.toLowerCase().includes(query) ||
          act.owner?.toLowerCase().includes(query)
        );
      }

      return {
        ...row,
        initiative: {
          ...row.initiative,
          actions: filteredActions
        }
      };
    }).filter(row => {
      // Project filter
      if (projectFilter !== 'all' && row.projectId !== projectFilter) {
        return false;
      }
      
      // If we filtered actions and none matched (and we had search/status filters active), exclude the initiative
      if ((statusFilter !== 'all' || searchTerm.trim() !== '') && row.initiative.actions.length === 0) {
        // Wait, what if the search term matched the initiative name instead? 
        if (searchTerm.trim() !== '') {
           const query = searchTerm.toLowerCase();
           const matchInitiative = row.initiative.initiativeName.toLowerCase().includes(query);
           const matchWs = row.workstreamName.toLowerCase().includes(query);
           const matchProject = row.projectTitle.toLowerCase().includes(query);
           if (!matchInitiative && !matchWs && !matchProject) {
              return false;
           }
        } else {
           return false;
        }
      }

      return true;
    });
  }, [allInitiativeRows, projectFilter, statusFilter, searchTerm]);

  // Aggregate stats across active projects
  const stats = useMemo(() => {
    const activeRows = projectFilter === 'all' 
      ? allInitiativeRows 
      : allInitiativeRows.filter(r => r.projectId === projectFilter);

    let total = 0;
    let completed = 0;
    let inProgress = 0;
    let blocked = 0;
    let todo = 0;

    activeRows.forEach(row => {
      total += row.initiative.actions?.length || 0;
      row.initiative.actions?.forEach(act => {
        if (act.status === 'completed') completed++;
        else if (act.status === 'in_progress') inProgress++;
        else if (act.status === 'blocked') blocked++;
        else todo++; // default to todo
      });
    });

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, blocked, todo, completionRate };
  }, [allInitiativeRows, projectFilter]);

  const parseVal = (val: string) => {
    if (!val) return 0;
    const parsed = parseFloat(val.replace(/[^0-9.]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  };

  // Sum MQL equivalents across all active initiatives for the scorecard
  const mqlKpiStats = useMemo(() => {
    const activeRows = projectFilter === 'all' 
      ? allInitiativeRows 
      : allInitiativeRows.filter(r => r.projectId === projectFilter);

    const PRIORITY_PATTERNS = [
      { type: 'Deal / Revenue', pattern: /\b(deal|deals|revenue)\b/i },
      { type: 'Pipeline', pattern: /\bpipeline\b/i },
      { type: 'Opportunities', pattern: /\b(opportunity|opportunities)\b/i },
      { type: 'SQLs', pattern: /\b(sql|sqls|sales qualified)\b/i },
      { type: 'MQLs', pattern: /\b(mql|mqls|marketing qualified)\b/i },
    ];

    let totalMqlBase = 0;
    let totalMqlTarget = 0;
    let totalMqlCurrent = 0;
    let hasKpis = false;

    // Helper functions for parsing rates/numbers from config
    const getRate = (configVal: string | undefined, defaultRate: number) => {
      if (!configVal) return defaultRate;
      const parsed = parseFloat(configVal.replace(/[^0-9.]/g, ''));
      return isNaN(parsed) || parsed === 0 ? defaultRate : parsed / 100;
    };
    const getNum = (configVal: string | undefined, defaultNum: number) => {
      if (!configVal) return defaultNum;
      const parsed = parseFloat(configVal.replace(/[^0-9.]/g, ''));
      return isNaN(parsed) || parsed === 0 ? defaultNum : parsed;
    };

    activeRows.forEach(row => {
      if (!row.initiative.kpis || row.initiative.kpis.length === 0) return;

      const proj = projects.find(p => p.id === row.projectId);
      const config = proj?.revenueDecomposition?.config;
      
      const winRate = getRate(config?.winRate, 0.2);
      const sqlOpp = getRate(config?.sqlConversionRate, 0.3);
      const mqlSql = getRate(config?.mqlConversionRate, 0.2);
      const acv = getNum(config?.acv, 50000);

      // Pick the single highest priority KPI from this initiative to prevent double counting
      for (const p of PRIORITY_PATTERNS) {
        const matched = row.initiative.kpis.find(k => p.pattern.test(k.kpiName));
        if (matched) {
          hasKpis = true;
          let multiplier = 1;

          const isDollar = (val: string) => val.includes('$');
          const checkDollar = isDollar(matched.target) || isDollar(matched.baseline) || isDollar(matched.currentValue);

          if (p.type === 'Deal / Revenue') {
             if (checkDollar || matched.kpiName.toLowerCase().includes('revenue')) {
                // Revenue -> Deals -> MQLs
                multiplier = 1 / (acv * winRate * sqlOpp * mqlSql);
             } else {
                // Deals -> MQLs
                multiplier = 1 / (winRate * sqlOpp * mqlSql);
             }
          } else if (p.type === 'Pipeline') {
             if (checkDollar || matched.kpiName.toLowerCase().includes('pipeline')) {
                // Pipeline ($) -> Opps -> MQLs
                multiplier = 1 / (acv * sqlOpp * mqlSql);
             } else {
                multiplier = 1 / (acv * sqlOpp * mqlSql);
             }
          } else if (p.type === 'Opportunities') {
             multiplier = 1 / (sqlOpp * mqlSql);
          } else if (p.type === 'SQLs') {
             multiplier = 1 / mqlSql;
          } else {
             multiplier = 1; // MQLs
          }

          totalMqlBase += parseVal(matched.baseline) * multiplier;
          totalMqlTarget += parseVal(matched.target) * multiplier;
          totalMqlCurrent += parseVal(matched.currentValue) * multiplier;
          
          break; // Stop at highest priority KPI
        }
      }
    });

    if (!hasKpis || totalMqlTarget === 0) return null;

    let attainment = 0;
    if (Math.abs(totalMqlTarget - totalMqlBase) !== 0) {
      const progress = (totalMqlCurrent - totalMqlBase) / (totalMqlTarget - totalMqlBase);
      attainment = Math.min(Math.max(Math.round(progress * 100), 0), 100);
    } else {
      attainment = Math.min(Math.max(Math.round((totalMqlCurrent / totalMqlTarget) * 100), 0), 100);
    }

    return { 
      type: 'MQLs', 
      currentValue: Math.round(totalMqlCurrent).toLocaleString(), 
      target: Math.round(totalMqlTarget).toLocaleString(), 
      attainment 
    };
  }, [allInitiativeRows, projectFilter, projects]);

  const calculateKpiAttainment = (kpi: GTMKPI) => {
    const baselineNum = parseVal(kpi.baseline);
    const targetNum = parseVal(kpi.target);
    const currentNum = parseVal(kpi.currentValue);

    if (Math.abs(targetNum - baselineNum) === 0) return 0;

    const progress = (currentNum - baselineNum) / (targetNum - baselineNum);
    const percent = Math.min(Math.max(Math.round(progress * 100), 0), 100);
    return percent;
  };

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

  const handleUpdateActionStatus = (row: InitiativeRow, actionId: string, nextStatus: 'todo' | 'in_progress' | 'completed' | 'blocked') => {
    const targetProj = projects.find(p => p.id === row.projectId);
    if (!targetProj || !targetProj.archivedExecutionPlan) return;

    const originalPlan = targetProj.archivedExecutionPlan;

    const updatedWorkstreams = originalPlan.workstreams.map(ws => {
      if (ws.id !== row.workstreamId) return ws;
      
      return {
        ...ws,
        initiatives: ws.initiatives.map(init => {
          if (init.id !== row.initiative.id) return init;

          const nextActions = init.actions.map(act => {
            if (act.id === actionId) {
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

  const handleUpdateKPIValue = (row: InitiativeRow, kpiId: string, value: string) => {
    const targetProj = projects.find(p => p.id === row.projectId);
    if (!targetProj || !targetProj.archivedExecutionPlan) return;

    const originalPlan = targetProj.archivedExecutionPlan;

    const updatedWorkstreams = originalPlan.workstreams.map(ws => {
      if (ws.id !== row.workstreamId) return ws;
      return {
        ...ws,
        initiatives: ws.initiatives.map(init => {
          if (init.id !== row.initiative.id) return init;
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

  const requestDeleteAction = (row: InitiativeRow, actionId: string, actionName: string) => {
    setActionToDelete({ row, actionId, actionName });
  };

  const confirmDeleteAction = () => {
    if (!actionToDelete) return;
    const { row, actionId } = actionToDelete;

    const targetProj = projects.find(p => p.id === row.projectId);
    if (!targetProj || !targetProj.archivedExecutionPlan) {
      setActionToDelete(null);
      return;
    }

    const originalPlan = targetProj.archivedExecutionPlan;

    const updatedWorkstreams = originalPlan.workstreams.map(ws => {
      if (ws.id !== row.workstreamId) return ws;
      
      return {
        ...ws,
        initiatives: ws.initiatives.map(init => {
          if (init.id !== row.initiative.id) return init;

          const nextActions = init.actions.filter(act => act.id !== actionId);

          const totalActions = nextActions.length;
          const completedActions = nextActions.filter(a => a.status === 'completed').length;
          const progressMultiplier = totalActions > 0 ? (completedActions / totalActions) : 0;

          const updatedKPIs = init.kpis.map(kpi => {
            const baseInfo = parseValueHelper(kpi.baseline);
            const targetInfo = parseValueHelper(kpi.target);
            const nextValNum = baseInfo.num + (targetInfo.num - baseInfo.num) * progressMultiplier;
            const updatedVal = formatValueHelper(nextValNum, targetInfo.hasPercent, targetInfo.hasDollar);
            return { ...kpi, currentValue: updatedVal };
          });

          return {
            ...init,
            actions: nextActions,
            kpis: updatedKPIs
          };
        })
      };
    });

    onUpdateProjectPlan(row.projectId, {
      ...originalPlan,
      workstreams: updatedWorkstreams
    });
    setActionToDelete(null);
    triggerFeedback();
  };

  const triggerFeedback = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // --- Gantt Chart Logic ---
  const { normalizedActions, timelineMarkers } = useMemo(() => {
    let minMs = Infinity;
    let maxMs = -Infinity;
    
    const actionsWithDates: Array<{
      id: string;
      initiativeName: string;
      actionName: string;
      status: string;
      owner: string;
      startDateStr: string;
      dueDateStr: string;
      sMs: number;
      dMs: number;
    }> = [];

    const fallbackMs = Date.now();

    filteredRows.forEach(row => {
      row.initiative.actions?.forEach(act => {
        let sMs = act.startDate ? new Date(act.startDate).getTime() : fallbackMs;
        let dMs = act.dueDate ? new Date(act.dueDate).getTime() : sMs + 7 * 24 * 60 * 60 * 1000;

        if (isNaN(sMs)) sMs = fallbackMs;
        if (isNaN(dMs)) dMs = sMs + 7 * 24 * 60 * 60 * 1000;
        
        if (dMs < sMs) dMs = sMs;

        if (sMs < minMs) minMs = sMs;
        if (dMs > maxMs) maxMs = dMs;

        actionsWithDates.push({
          id: act.id,
          initiativeName: row.initiative.initiativeName,
          actionName: act.actionName,
          status: act.status,
          owner: act.owner || 'Unassigned',
          startDateStr: act.startDate || new Date(sMs).toISOString().split('T')[0],
          dueDateStr: act.dueDate || new Date(dMs).toISOString().split('T')[0],
          sMs,
          dMs
        });
      });
    });

    if (minMs === Infinity || actionsWithDates.length === 0) {
       minMs = fallbackMs;
       maxMs = fallbackMs + 30 * 24 * 60 * 60 * 1000;
    }
    
    let span = maxMs - minMs;
    if (span === 0) span = 7 * 24 * 60 * 60 * 1000;
    
    // Add visual padding ~ 5%
    const viewMinMs = minMs - span * 0.05;
    const viewMaxMs = maxMs + span * 0.05;

    const normActions = actionsWithDates.map(a => {
      const leftPct = ((a.sMs - viewMinMs) / (viewMaxMs - viewMinMs)) * 100;
      const widthPct = ((a.dMs - a.sMs) / (viewMaxMs - viewMinMs)) * 100;
      return {
         ...a,
         leftPct: Math.max(0, leftPct),
         widthPct: Math.max(0.5, widthPct)
      };
    }).sort((a,b) => a.sMs - b.sMs); // Sort by start date

    // Create markers
    const markers = [];
    const steps = 6;
    for (let i = 0; i <= steps; i++) {
        const ms = viewMinMs + (viewMaxMs - viewMinMs) * (i / steps);
        const d = new Date(ms);
        const name = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        markers.push({ pct: (i / steps) * 100, label: name });
    }

    return { 
      normalizedActions: normActions,
      timelineMarkers: markers
    };
  }, [filteredRows]);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-bg-surface/30 p-4 sm:p-6 rounded-3xl border border-border/80">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-accent uppercase block">Live Pipeline Ledger</span>
            <span className="px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-[9px] font-mono text-accent flex items-center gap-1 animate-pulse">
              <Activity className="h-2.5 w-2.5" /> Integrated Tracking
            </span>
          </div>
          <h2 className="text-lg font-black text-text-primary tracking-tight">Step 16: Operational Execution Pipeline</h2>
          <p className="text-[11px] sm:text-xs text-text-secondary max-w-2xl leading-relaxed">
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
        {mqlKpiStats ? (
          <div className="p-4 rounded-2xl bg-[#00F090]/5 border border-[#00F090]/20 space-y-1">
            <div className="text-[9px] font-mono font-bold text-[#00F090] uppercase flex items-center gap-1">
              <Target className="h-2.5 w-2.5" /> High-Priority: MQLs
            </div>
            <div className="flex justify-between items-end">
              <div className="text-xl font-black text-[#00F090] leading-none">
                {mqlKpiStats.currentValue || '0'}
                <span className="text-[10px] font-mono opacity-60 ml-1">/ {mqlKpiStats.target}</span>
              </div>
              <div className="text-xs font-bold text-[#00F090] leading-none">{mqlKpiStats.attainment}%</div>
            </div>
            <div className="w-full bg-[#00F090]/20 rounded-full h-1 overflow-hidden mt-1.5">
              <div 
                className="bg-[#00F090] h-full rounded-full transition-all duration-500" 
                style={{ width: `${mqlKpiStats.attainment}%` }} 
              />
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-bg-surface/40 border border-border space-y-1 text-center flex flex-col justify-center items-center">
            <div className="text-[9px] font-mono font-bold text-text-secondary uppercase">Essential KPI Goal</div>
            <div className="text-xs font-bold text-text-secondary/50">No pipeline KPI set</div>
          </div>
        )}
        <div className="p-4 rounded-2xl bg-bg-surface/40 border border-border space-y-1">
          <div className="text-[9px] font-mono font-bold text-text-secondary uppercase">Initiative Actions</div>
          <div className="text-xl font-black text-text-primary flex items-baseline gap-1">
            {stats.total} <span className="text-[10px] font-mono text-text-secondary">active actions</span>
          </div>
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
                <th className="py-3 px-4 w-[400px]">Initiative Details & Tactical Actions</th>
                <th className="py-3 px-4 w-[250px]">Initiative KPI Goals & Attainment</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center">
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
                    key={row.initiative.id} 
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
                          <Layers className="h-3 w-3 text-text-secondary hover:text-accent shrink-0" />
                          <span className="line-clamp-2 leading-tight">{row.workstreamName}</span>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Initiative details and nested Actions block */}
                    <td className="py-3 px-4 align-top space-y-4">
                      {/* Initiative Head */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-text-secondary/80 bg-bg-surface/60 border border-border px-1.5 py-0.5 rounded-md">
                          Initiative
                        </span>
                        <h4 className="text-sm font-black text-text-primary leading-snug">
                          {row.initiative.initiativeName}
                        </h4>
                        {row.initiative.description && (
                          <p className="text-[10px] text-text-secondary/80 font-sans leading-normal">
                            {row.initiative.description}
                          </p>
                        )}
                      </div>

                      {/* Nested Actions */}
                      <div className="space-y-2">
                         {row.initiative.actions.map(act => (
                           <div key={act.id} className="p-3 bg-bg-surface/50 border border-border/60 rounded-xl space-y-2 min-w-[340px]">
                              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                                 {/* Context */}
                                 <div className="space-y-1">
                                    <div className="text-xs font-bold text-text-primary leading-tight">{act.actionName}</div>
                                    <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-[9px] font-mono text-text-secondary/70">
                                      <span className="flex items-center gap-1">
                                        <Users className="h-2.5 w-2.5 text-accent" /> {act.owner || 'Unassigned'}
                                      </span>
                                      {act.dueDate && (
                                        <span className="flex items-center gap-1">
                                          <Clock className="h-2.5 w-2.5" /> Due: {act.dueDate}
                                        </span>
                                      )}
                                    </div>
                                 </div>
                                 {/* Status & Controls */}
                                 <div className="flex flex-col items-end gap-2 shrink-0">
                                   <select
                                     value={act.status}
                                     onChange={(e) => handleUpdateActionStatus(row, act.id, e.target.value as any)}
                                     className={`w-36 text-[9px] font-bold py-1.5 px-2 rounded-xl focus:outline-none border select-none tracking-wider uppercase transition-all ${
                                       act.status === 'completed'
                                         ? 'bg-green-500/20 border-green-500/30 text-green-500'
                                         : act.status === 'in_progress'
                                         ? 'bg-blue-500/20 border-blue-500/30 text-blue-500'
                                         : act.status === 'blocked'
                                         ? 'bg-red-500/20 border-red-500/30 text-red-500 font-semibold'
                                         : 'bg-bg-surface border-border text-text-secondary'
                                     }`}
                                   >
                                     <option value="todo">Todo</option>
                                     <option value="in_progress">In Progress</option>
                                     <option value="completed">Completed</option>
                                     <option value="blocked">Blocked</option>
                                   </select>
                                   <button 
                                      onClick={() => requestDeleteAction(row, act.id, act.actionName)}
                                      className="text-[9px] font-bold text-text-secondary/60 uppercase hover:text-red-500 flex items-center gap-1 transition-colors"
                                      title="Delete Action Item"
                                    >
                                       <Trash2 className="h-3 w-3" /> Delete
                                    </button>
                                 </div>
                              </div>
                           </div>
                         ))}
                         {row.initiative.actions.length === 0 && (
                           <div className="text-[10px] text-text-secondary bg-bg-surface/40 p-2 rounded-lg border border-border/50 border-dashed text-center">
                             No actions found
                           </div>
                         )}
                      </div>
                    </td>

                    {/* Column 3: Associated KPI Goal Tracker & direct achievement inputs */}
                    <td className="py-3 px-4 align-top space-y-3 w-[260px]">
                      {row.initiative.kpis.length === 0 ? (
                        <div className="text-[10px] text-text-secondary/65 italic font-sans flex items-center gap-1.5 pt-1.5">
                          <AlertCircle className="h-3 w-3 text-text-secondary/40" />
                          No direct KPI defined
                        </div>
                      ) : (
                        row.initiative.kpis.map((kpi) => {
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

      {/* Gantt Chart Section */}
      <div className="border border-border rounded-2xl overflow-hidden bg-bg-surface/20 relative">
        <div 
          className="p-4 bg-bg-surface/60 border-b border-border flex justify-between items-center cursor-pointer hover:bg-bg-surface/80 transition-colors"
          onClick={() => setShowGanttChart(!showGanttChart)}
        >
          <div className="flex items-center gap-3">
             {showGanttChart ? (
                 <ChevronUp className="h-5 w-5 text-text-secondary" />
             ) : (
                 <ChevronDown className="h-5 w-5 text-text-secondary" />
             )}
            <div className="p-2 rounded-xl bg-accent/10 border border-accent/20 text-accent">
              <BarChartHorizontal className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-text-primary tracking-wide">Execution Timeline (Gantt View)</h3>
              <p className="text-[10px] text-text-secondary">Visual layout of active operational tasks across the execution horizon.</p>
            </div>
          </div>
          {normalizedActions.length > 0 && (
              <div className="flex items-center gap-2 text-[10px] font-mono text-text-secondary">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {normalizedActions.length} Actions</span>
              </div>
          )}
        </div>
        
        {showGanttChart && (
          <div className="flex bg-bg-base overflow-x-auto relative">
             <div className="w-[300px] shrink-0 border-r border-border/60 bg-bg-surface/30 z-20">
                <div className="h-10 border-b border-border/50 px-4 flex items-center">
                   <span className="text-[10px] font-black uppercase text-text-secondary tracking-widest">Tactical Actions</span>
                </div>
                <div className="py-2">
                   {normalizedActions.map((act) => (
                      <div key={'label-'+act.id} className="h-10 px-4 flex flex-col justify-center border-b border-border/20 group">
                         <div className="text-[11px] font-black text-text-primary truncate">{act.actionName}</div>
                         <div className="text-[9px] font-mono text-text-secondary/70 truncate flex justify-between">
                            <span>{act.initiativeName}</span>
                            {act.owner && <span className="text-accent/80 opacity-0 group-hover:opacity-100 transition-opacity">{act.owner}</span>}
                         </div>
                      </div>
                   ))}
                </div>
             </div>
             
             <div className="min-w-[600px] flex-grow relative">
                <div className="h-10 border-b border-border/50 relative bg-bg-surface/10">
                   {timelineMarkers.map((marker, idx) => (
                      <div 
                        key={idx} 
                        className="absolute bottom-1 text-[9px] font-mono text-text-secondary/80 -translate-x-1/2 whitespace-nowrap"
                        style={{ left: `${marker.pct}%` }}
                      >
                        {marker.label}
                      </div>
                    ))}
                </div>
                
                {/* Grid */}
                <div className="absolute top-10 bottom-0 left-0 right-0 pointer-events-none">
                    {timelineMarkers.map((marker, idx) => (
                        <div 
                          key={`grid-${idx}`}
                          className="absolute top-0 bottom-0 border-l border-border/20 border-dashed"
                          style={{ left: `${marker.pct}%` }}
                        />
                    ))}
                </div>

                <div className="py-2 relative w-full z-10">
                   {normalizedActions.map((act) => {
                      let colorClasses = 'bg-border/40 border-border/60 text-text-secondary';
                      if (act.status === 'completed') colorClasses = 'bg-[#00F090]/30 border-[#00F090]/50 text-[#00F090]';
                      if (act.status === 'in_progress') colorClasses = 'bg-[#7000FF]/30 border-[#7000FF]/50 text-[#7000FF]';
                      if (act.status === 'blocked') colorClasses = 'bg-[#f21b3f]/30 border-[#f21b3f]/50 text-[#f21b3f]';

                      return (
                         <div key={'bar-'+act.id} className="h-10 border-b border-border/20 flex items-center relative group">
                            <div 
                               className={`absolute h-[18px] rounded-md border flex items-center overflow-hidden transition-all hover:brightness-125 ${colorClasses} shadow-[0_0_10px_rgba(0,0,0,0.1)]`}
                               style={{ left: `${act.leftPct}%`, width: `${act.widthPct}%` }}
                               title={`Start: ${act.startDateStr}\nDue: ${act.dueDateStr}\nStatus: ${act.status}`}
                            >
                               {/* Optional progress indicator chunk */}
                               {act.status === 'in_progress' && (
                                   <div className="absolute left-0 top-0 bottom-0 bg-white/10 w-1/2" />
                               )}
                            </div>
                         </div>
                      )
                   })}
                   {normalizedActions.length === 0 && (
                       <div className="h-32 flex items-center justify-center">
                           <span className="text-xs font-mono text-text-secondary/50">No actions to display on timeline.</span>
                       </div>
                   )}
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {actionToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg-base/80 backdrop-blur-sm p-4 animate-fade-in text-left">
          <div className="bg-bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-border/50 flex items-center gap-3 bg-red-500/10 text-red-500">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <h4 className="text-sm font-black uppercase tracking-wider">Confirm Action</h4>
            </div>
            <div className="p-6 space-y-4 text-sm text-text-secondary">
              <p>
                Are you sure you want to permanently delete the following action?
              </p>
              <div className="bg-bg-base border border-border p-3 rounded-xl">
                 <div className="text-[10px] uppercase font-mono text-text-secondary/70 mb-1">Action Title</div>
                 <div className="font-bold text-text-primary text-xs">{actionToDelete.actionName}</div>
              </div>
            </div>
            <div className="p-4 border-t border-border/50 bg-bg-surface/50 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setActionToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-bg-base transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteAction}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20 transition-colors flex items-center gap-2 group"
              >
                <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" /> Delete Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
