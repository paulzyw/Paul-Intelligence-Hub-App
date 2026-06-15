import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  LineChart, 
  Users, 
  Target, 
  ShieldAlert, 
  TrendingUp, 
  Briefcase, 
  Zap,
  Activity,
  Award,
  AlertOctagon,
  CheckCircle2,
  PieChart,
  Settings,
  ShieldCheck,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { GTMOSProject, RevenueDecompositionData, OnboardingCategoryFields } from './types';

interface ExecutiveDashboardProps {
  project: GTMOSProject;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ project }) => {
  const { 
    onboarding, 
    revenueDecomposition, 
    readinessScore, 
    risks, 
    recommendations,
    gtmExecutionPlan
  } = project;

  // Extract necessary data, providing fallbacks if some engine parts haven't been completed
  const rawTargetARR = revenueDecomposition?.config?.revenueTarget || onboarding?.['financial_targets']?.target_arr || 'N/A';
  const formatInThousands = (val: string) => {
    if (!val || val === 'N/A') return 'N/A';
    const num = parseFloat(val.replace(/[^0-9.-]+/g, ''));
    if (isNaN(num)) return val;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(num / 1000) + 'k';
  };
  const targetRevenue = formatInThousands(rawTargetARR);
  
  const timeframe = revenueDecomposition?.config?.timeHorizon || onboarding?.['financial_targets']?.timeframe || '12 Months';
  const rawAcv = revenueDecomposition?.config?.acv || onboarding?.['financial_targets']?.avg_acv || 'N/A';
  const acv = formatInThousands(rawAcv);
  
  const pipelineRequired = revenueDecomposition?.result?.pipelineRequired || 'N/A';
  const sqlRequired = revenueDecomposition?.result?.sqlRequired || 'N/A';
  const mqlRequired = revenueDecomposition?.result?.mqlRequired || 'N/A';
  const winRate = revenueDecomposition?.config?.winRate || '20%';

  const salesCapacity = revenueDecomposition?.result?.salesCapacityRequired || 'N/A';
  const marketingCapacity = revenueDecomposition?.result?.marketingCapacityRequired || 'N/A';
  const csCapacity = revenueDecomposition?.result?.customerSuccessCapacityRequired || 'N/A';

  const executionPlan = project.archivedExecutionPlan || project.gtmExecutionPlan;
  const executionStatus = executionPlan ? 'Active Execution' : 'Planning Phase';
  const activeRisksCount = risks?.length || 0;
  const pivotActionsCount = recommendations?.length || 0;

  const calculateHealthStatus = () => {
    if (readinessScore > 80) return { label: 'Optimal', color: 'text-green-400', bg: 'bg-green-500/10' };
    if (readinessScore > 50) return { label: 'At Risk', color: 'text-amber-400', bg: 'bg-amber-500/10' };
    return { label: 'Needs Pivot', color: 'text-red-400', bg: 'bg-red-500/10' };
  };

  const health = calculateHealthStatus();

  // Calculate Execution Telemetry from Workstreams, Initiatives, and Actions
  const executionTelemetry = useMemo(() => {
    if (!executionPlan || !executionPlan.workstreams) {
      return { 
        totalActions: 0, completedActions: 0, inProgressActions: 0, blockedActions: 0, completionRate: 0, 
        totalWorkstreams: 0, avgKpiAttainment: 0
      };
    }

    let totalActions = 0;
    let completedActions = 0;
    let inProgressActions = 0;
    let blockedActions = 0;

    let totalKpis = 0;
    let accumulatedKpiAttainment = 0;

    const parseValueHelper = (val: string) => {
      if (!val) return 0;
      const parsed = parseFloat(val.replace(/[^0-9.-]+/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    };

    executionPlan.workstreams.forEach(ws => {
      if (ws.initiatives) {
        ws.initiatives.forEach(init => {
          // Actions
          init.actions?.forEach((act) => {
            totalActions++;
            if (act.status === 'completed') completedActions++;
            else if (act.status === 'in_progress') inProgressActions++;
            else if (act.status === 'blocked') blockedActions++;
          });

          // KPIs
          init.kpis?.forEach((kpi) => {
            totalKpis++;
            const base = parseValueHelper(kpi.baseline);
            const target = parseValueHelper(kpi.target);
            const curr = parseValueHelper(kpi.currentValue);

            if (Math.abs(target - base) > 0) {
              const attainment = Math.min(Math.max((curr - base) / (target - base), 0), 1) * 100;
              accumulatedKpiAttainment += attainment;
            } else {
              accumulatedKpiAttainment += 100; // instant baseline target match
            }
          });
        });
      }
    });

    const completionRate = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
    const avgKpiAttainment = totalKpis > 0 ? Math.round(accumulatedKpiAttainment / totalKpis) : 0;

    return {
      totalActions,
      completedActions,
      inProgressActions,
      blockedActions,
      completionRate,
      avgKpiAttainment,
      totalWorkstreams: executionPlan.workstreams.length
    };
  }, [executionPlan]);

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="p-6 rounded-2xl bg-bg-surface/50 border border-border flex flex-col md:flex-row gap-6 justify-between items-start md:items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Building2 className="w-32 h-32" />
        </div>
        
        <div className="space-y-1 relative z-10">
          <h2 className="text-xl md:text-2xl font-black text-text-primary tracking-tight">Executive Boardroom Insights</h2>
          <p className="text-sm text-text-secondary font-sans leading-relaxed max-w-2xl">
            Real-time aggregate intelligence dynamically compiled from your active GTM operation across Strategy, Mechanics, Math, and Defense layers.
          </p>
        </div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="p-4 rounded-xl border border-border bg-bg-primary shadow-sm text-center min-w-[120px]">
            <span className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-wider block mb-1">Target Revenue</span>
            <span className="text-lg font-black text-accent">{targetRevenue}</span>
          </div>
          <div className="p-4 rounded-xl border border-border bg-bg-primary shadow-sm text-center min-w-[120px]">
            <span className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-wider block mb-1">GTM Health</span>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg ${health.bg} ${health.color}`}>
              <Activity className="h-4 w-4" />
              <span className="text-lg font-black">{readinessScore}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CEO / Overall Strategic Posture */}
        <div className="p-5 rounded-2xl bg-bg-surface/30 border border-border space-y-5 flex flex-col">
          <div className="flex items-center gap-3 border-b border-border/40 pb-3">
            <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">CEO Context</h3>
              <p className="text-[10px] text-text-secondary uppercase tracking-wider font-mono">Strategy & Defense</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 flex-1">
            <div className="p-4 rounded-xl border border-border/40 bg-bg-primary flex flex-col justify-center">
              <span className="text-[10px] text-text-secondary font-mono mb-1">Market Segment</span>
              <span className="text-xs font-bold text-text-primary capitalize">{project.market_segment || 'Not Defined'}</span>
            </div>
            <div className="p-4 rounded-xl border border-border/40 bg-bg-primary flex flex-col justify-center">
              <span className="text-[10px] text-text-secondary font-mono mb-1">Time Horizon</span>
              <span className="text-xs font-bold text-text-primary">{timeframe}</span>
            </div>
            <div className="p-4 rounded-xl border border-border/40 bg-bg-primary flex flex-col justify-center">
              <span className="text-[10px] text-text-secondary font-mono mb-1">Critical Vulnerabilities</span>
              <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                <AlertOctagon className="h-3.5 w-3.5" /> {activeRisksCount} Detected
              </span>
            </div>
            <div className="p-4 rounded-xl border border-border/40 bg-bg-primary flex flex-col justify-center">
              <span className="text-[10px] text-text-secondary font-mono mb-1">Exec. Posture</span>
              <span className="text-xs font-bold text-accent">{executionStatus}</span>
            </div>
          </div>
        </div>

        {/* CFO / Financial Mechanics */}
        <div className="p-5 rounded-2xl bg-bg-surface/30 border border-border space-y-5 flex flex-col">
          <div className="flex items-center gap-3 border-b border-border/40 pb-3">
            <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <LineChart className="h-4 w-4 text-green-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">CFO Context</h3>
              <p className="text-[10px] text-text-secondary uppercase tracking-wider font-mono">Unit Economics & Capacity</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 flex-1">
            <div className="p-4 rounded-xl border border-border/40 bg-bg-primary">
              <span className="text-[10px] text-text-secondary font-mono mb-1 block">Expected ACV</span>
              <span className="text-sm font-black text-text-primary">{acv}</span>
            </div>
            <div className="p-4 rounded-xl border border-border/40 bg-bg-primary">
              <span className="text-[10px] text-text-secondary font-mono mb-1 block">Pipeline Coverage Reqd.</span>
              <span className="text-sm font-black text-text-primary">{pipelineRequired}</span>
            </div>
            <div className="p-4 rounded-xl border border-border/40 bg-bg-primary col-span-2 flex justify-between items-center bg-gradient-to-r from-bg-primary to-green-500/5">
              <div>
                <span className="text-[10px] text-text-secondary font-mono mb-1 block">Capital Deployment Risks</span>
                <span className="text-xs font-bold text-text-primary">Budget tied to {pivotActionsCount} pivot actions</span>
              </div>
              <PieChart className="h-6 w-6 text-green-400 opacity-50" />
            </div>
          </div>
        </div>

        {/* CRO / Revenue Engine Mechanics */}
        <div className="p-5 rounded-2xl bg-bg-surface/30 border border-border space-y-5 flex flex-col">
          <div className="flex items-center gap-3 border-b border-border/40 pb-3">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Target className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">CRO Context</h3>
              <p className="text-[10px] text-text-secondary uppercase tracking-wider font-mono">Velocity & Attainment</p>
            </div>
          </div>

          <div className="space-y-3 flex-1">
            <div className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-bg-primary">
              <span className="text-xs text-text-secondary">Expected Win Rate</span>
              <span className="text-sm font-bold text-text-primary">{winRate}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-bg-primary">
              <span className="text-xs text-text-secondary">Qualified SQLs Required</span>
              <span className="text-sm font-bold text-blue-400">{sqlRequired}</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-bg-primary">
              <Users className="h-4 w-4 text-text-secondary" />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-text-secondary font-mono">Sales Capacity Demand</span>
                  <span className="text-[10px] font-bold text-text-primary">{salesCapacity} AE/Reps</span>
                </div>
                <div className="w-full bg-border/50 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-400 h-full rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CMO / Demand Generation Engine */}
        <div className="p-5 rounded-2xl bg-bg-surface/30 border border-border space-y-5 flex flex-col">
          <div className="flex items-center gap-3 border-b border-border/40 pb-3">
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">CMO Context</h3>
              <p className="text-[10px] text-text-secondary uppercase tracking-wider font-mono">Demand Gen Demands</p>
            </div>
          </div>

          <div className="space-y-3 flex-1">
            <div className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-bg-primary">
              <span className="text-xs text-text-secondary">Raw Leads / MQLs Required</span>
              <span className="text-sm font-bold text-purple-400">{mqlRequired}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-bg-primary">
              <span className="text-xs text-text-secondary">Pillar Strategy Coverage</span>
              <span className="text-sm font-bold text-text-primary text-right">
                {project.pillars ? Object.keys(project.pillars).length : 0} Core Channels
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-bg-primary">
              <Users className="h-4 w-4 text-text-secondary" />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-text-secondary font-mono">Marketing Capacity Demand</span>
                  <span className="text-[10px] font-bold text-text-primary">{marketingCapacity} FTEs</span>
                </div>
                <div className="w-full bg-border/50 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-400 h-full rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* COO / Post-Sales & Operations Engine */}
        <div className="col-span-1 lg:col-span-2 p-5 rounded-2xl bg-bg-surface/30 border border-border space-y-5 flex flex-col">
          <div className="flex items-center gap-3 border-b border-border/40 pb-3">
            <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Settings className="h-4 w-4 text-orange-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">COO Context</h3>
              <p className="text-[10px] text-text-secondary uppercase tracking-wider font-mono">Operations, Enablement & Execution</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-text-primary mb-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-orange-400" /> Execution Governance
              </h4>
                 <div className="grid grid-cols-2 gap-3 text-xs">
                 <div className="p-3.5 rounded-xl bg-bg-surface/50 border border-border/40">
                    <span className="text-[10px] text-text-secondary font-mono mb-1.5 block">RACI Matrix</span>
                    <div className="font-bold text-text-primary leading-tight">
                      {executionPlan?.governance?.raciAssignment || 'Not Built'}
                    </div>
                 </div>
                 <div className="p-3.5 rounded-xl bg-bg-surface/50 border border-border/40">
                    <span className="text-[10px] text-text-secondary font-mono mb-1.5 block">Review Cadence</span>
                    <div className="font-bold text-text-primary leading-tight">
                      {executionPlan?.governance?.reviewCadence || 'Not Built'}
                    </div>
                 </div>
                 <div className="col-span-2 p-3.5 rounded-xl bg-bg-surface/50 border border-border/40 flex flex-col">
                    <span className="text-[10px] text-text-secondary font-mono mb-1.5 block">
                      Post-Sales Capacity Demand
                    </span>
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-bold text-sm text-text-primary leading-tight">
                        {csCapacity} {csCapacity !== 'N/A' && !csCapacity.includes('FTE') ? 'CS/Support FTEs' : ''}
                      </span>
                      <Users className="h-4 w-4 text-orange-400/50 shrink-0 mt-0.5" />
                    </div>
                 </div>
              </div>
            </div>
            
            <div className="space-y-4">
               <h4 className="text-xs font-bold text-text-primary mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-accent" /> Live Telemetry Overview
              </h4>
              <div className="p-5 rounded-2xl bg-bg-primary shadow-sm border border-border/40 h-full flex flex-col justify-center">

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] text-text-secondary uppercase tracking-wider font-mono">Action Completion</span>
                      <span className="text-xs font-black text-accent">{executionTelemetry.completionRate}%</span>
                    </div>
                    <div className="w-full bg-border/50 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-accent h-full rounded-full transition-all" style={{ width: `${executionTelemetry.completionRate}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] text-text-secondary uppercase tracking-wider font-mono">Avg KPI Attainment</span>
                      <span className="text-xs font-black text-[#00F090]">{executionTelemetry.avgKpiAttainment}%</span>
                    </div>
                    <div className="w-full bg-border/50 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#00F090] h-full rounded-full transition-all" style={{ width: `${executionTelemetry.avgKpiAttainment}%` }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-bg-surface/30 rounded-xl p-3 text-center flex flex-col justify-center gap-1">
                    <span className="text-[15px] font-black text-text-primary block">{executionTelemetry.completedActions}</span>
                    <span className="text-[9px] text-text-secondary uppercase tracking-wider font-mono flex items-center justify-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-400" /> Done
                    </span>
                  </div>
                  <div className="bg-bg-surface/30 rounded-xl p-3 text-center flex flex-col justify-center gap-1">
                    <span className="text-[15px] font-black text-text-primary block">{executionTelemetry.inProgressActions}</span>
                    <span className="text-[9px] text-text-secondary uppercase tracking-wider font-mono flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3 text-accent" /> Active
                    </span>
                  </div>
                  <div className="bg-bg-surface/30 rounded-xl p-3 text-center flex flex-col justify-center gap-1">
                    <span className="text-[15px] font-black text-text-primary block">{executionTelemetry.blockedActions}</span>
                    <span className="text-[9px] text-text-secondary uppercase tracking-wider font-mono flex items-center justify-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-red-400" /> Blocked
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

