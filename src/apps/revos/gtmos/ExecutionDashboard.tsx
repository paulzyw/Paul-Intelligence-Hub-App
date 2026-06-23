import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, AlertTriangle, CheckCircle, ShieldAlert, Award, Clock, 
  Map, Activity, Layers, Play, DollarSign, Brain, Target, Users, ArrowUpRight,
  ShieldCheck, ArrowRight, Zap, RefreshCw, BarChart2, MessageSquare, Info
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, ReferenceLine, BarChart, Bar, Cell, LabelList
} from 'recharts';
import { calculateExecutionMetrics } from './executionUtils';
import { GTMOSProject, GTMExecutionPlan, GTMWorkstream, GTMInitiative, GTMActionItem, GTMKPI, GTMRisk } from './types';

interface ExecutionDashboardProps {
  projects: GTMOSProject[];
  currentProjectId: string;
}

export const ExecutionDashboard: React.FC<ExecutionDashboardProps> = ({
  projects,
  currentProjectId
}) => {
  const currentProject = useMemo(() => {
    return projects.find(p => p.id === currentProjectId) || projects[0];
  }, [projects, currentProjectId]);

  const plan = currentProject?.archivedExecutionPlan;

  // State for interactive scenarios
  const [forecastSimulationFactor, setForecastSimulationFactor] = useState<number>(1.0);
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<'all' | 'high' | 'medium'>('all');

  // Parse active metrics safely
  const metrics = useMemo(() => {
    return calculateExecutionMetrics(plan);
  }, [plan]);

  // Process Gauge & Progression Data based on empirical KPI outputs
  const revenueEngineData = useMemo(() => {
    const config = currentProject?.revenueDecomposition?.config;
    
    // Default config values if missing in decomposition
    const parseNumStr = (val: string | undefined, defaultVal: number) => {
      if (!val) return defaultVal;
      let multiplier = 1;
      const lowerVal = val.toLowerCase();
      
      if (lowerVal.match(/[0-9.]\s*m\b/)) multiplier = 1000000;
      else if (lowerVal.match(/[0-9.]\s*k\b/)) multiplier = 1000;
      else if (lowerVal.match(/[0-9.]\s*b\b/)) multiplier = 1000000000;
      else if (lowerVal.includes('million')) multiplier = 1000000;

      const parsed = parseFloat(val.replace(/[^0-9.]/g, ''));
      return isNaN(parsed) ? defaultVal : parsed * multiplier;
    };

    const targetRevenue = parseNumStr(config?.revenueTarget || currentProject?.onboarding?.revenueTarget || plan?.revenueGoal, 1000000);
    const winRate = parseNumStr(config?.winRate, 25);
    const sqlToOpp = parseNumStr(config?.sqlConversionRate, 40);
    const mqlToSql = parseNumStr(config?.mqlConversionRate, 15);
    const acv = parseNumStr(config?.acv, 50000);

    const wrPct = winRate > 1 ? winRate / 100 : winRate;
    const sqlOppPct = sqlToOpp > 1 ? sqlToOpp / 100 : sqlToOpp;
    const mqlSqlPct = mqlToSql > 1 ? mqlToSql / 100 : mqlToSql;
    
    const steps: { name: string, actual: number, target: number, kpiType: string, kpiActual: number, kpiTarget: number }[] = [];

    if (plan && plan.workstreams) {
      plan.workstreams.forEach(ws => {
        ws.initiatives?.forEach(init => {
          const prio = [
            { type: 'Deal', pattern: /\b(deal|deals)\b/i },
            { type: 'Pipeline', pattern: /\bpipeline\b/i },
            { type: 'Opportunities', pattern: /\b(opportunity|opportunities)\b/i },
            { type: 'SQL', pattern: /\b(sql|sqls|sales qualified)\b/i },
            { type: 'MQL', pattern: /\b(mql|mqls|marketing qualified)\b/i }
          ];

          let bestKpi = null;
          let kpiType = '';

          for (const p of prio) {
            const match = init.kpis?.find(k => p.pattern.test(k.kpiName) || p.pattern.test(k.kpiCategory || ''));
            if (match) {
              bestKpi = match;
              kpiType = p.type;
              break;
            }
          }

          if (bestKpi) {
            const actualVal = parseNumStr(bestKpi.currentValue, 0);
            const targetKpiVal = parseNumStr(bestKpi.target, 0);
            
            let attributedRev = 0;
            let targetRev = 0;

            if (kpiType === 'MQL') {
                attributedRev = actualVal * mqlSqlPct * sqlOppPct * wrPct * acv;
                targetRev = targetKpiVal * mqlSqlPct * sqlOppPct * wrPct * acv;
            } else if (kpiType === 'SQL') {
                attributedRev = actualVal * sqlOppPct * wrPct * acv;
                targetRev = targetKpiVal * sqlOppPct * wrPct * acv;
            } else if (kpiType === 'Opportunities') {
                attributedRev = actualVal * wrPct * acv;
                targetRev = targetKpiVal * wrPct * acv;
            } else if (kpiType === 'Pipeline') {
                attributedRev = actualVal * wrPct;
                targetRev = targetKpiVal * wrPct;
            } else if (kpiType === 'Deal') {
                attributedRev = actualVal * acv;
                targetRev = targetKpiVal * acv;
            }

            if (attributedRev > 0 || targetRev > 0) {
              steps.push({
                name: init.initiativeName,
                actual: attributedRev,
                target: targetRev,
                kpiType,
                kpiActual: actualVal,
                kpiTarget: targetKpiVal
              });
            }
          }
        });
      });
    }

    const finalBaseline = parseNumStr(currentProject?.onboarding?.ARR, 0);

    let shiftTotal = finalBaseline;
    steps.forEach(s => { shiftTotal += s.actual; });

    const formatLabel = (val: number, isIncremental: boolean) => {
      if (val === 0) return '0';
      const prefix = isIncremental && val > 0 ? '+' : '';
      if (val >= 1000000) return `${prefix}${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `${prefix}${(val / 1000).toFixed(0)}k`;
      return `${prefix}${Math.round(val)}`;
    };

    return {
       target: targetRevenue,
       projected: shiftTotal,
       baseline: finalBaseline,
       steps,
       formatLabel
    };
  }, [plan, currentProject]);

  // Aggregate simulated baseline vs target revenue projections over 6 quarters
  const revenueChartData = useMemo(() => {
    const rawGoal = plan?.revenueGoal ? parseFloat(plan.revenueGoal.replace(/[^0-9.]/g, '')) : 10;
    const baselineArr = currentProject?.onboarding?.ARR ? parseFloat(currentProject.onboarding.ARR.replace(/[^0-9.]/g, '')) : 5;
    
    const initialARR = isNaN(baselineArr) || baselineArr === 0 ? 5 : baselineArr;
    const targetARR = isNaN(rawGoal) || rawGoal === 0 ? (initialARR * 1.5) : rawGoal;
    
    const qCount = 6;
    const progressFactor = metrics.progressPct / 100;
    const milestoneVelocity = metrics.hasKpis ? (metrics.avgKpiAttainment / 100) : progressFactor;

    return Array.from({ length: qCount }).map((_, idx) => {
      const qNum = idx + 1;
      // Normal compound path to targeted ARR
      const compoundIncrement = (targetARR - initialARR) / (qCount - 1);
      const targetPath = initialARR + (compoundIncrement * idx);
      
      // Actual / Projected path governed by task milestones + user interactive factor
      const impactGap = (targetPath - initialARR) * (1 - milestoneVelocity);
      const actualTrend = (initialARR + (compoundIncrement * idx) - (impactGap * 0.4)) * forecastSimulationFactor;
      
      return {
        quarter: `Q${qNum} '26`,
        'Base Plan': Math.round(initialARR + (targetARR - initialARR) * 0.1 * idx),
        'Target Goal': Math.round(targetPath),
        'Live Execution Projected': Math.round(Math.min(actualTrend, targetARR * 1.3))
      };
    });
  }, [plan, currentProject, metrics, forecastSimulationFactor]);

  // Filtered risks
  const filteredRisks = useMemo(() => {
    return metrics.allRisks.filter(risk => {
      if (selectedRiskFilter === 'high') return risk.impact === 'high' || risk.probability === 'high';
      if (selectedRiskFilter === 'medium') return risk.impact === 'medium' || risk.probability === 'medium';
      return true;
    });
  }, [metrics.allRisks, selectedRiskFilter]);

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Executive Briefing top plate */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-bg-surface/30 p-6 rounded-3xl border border-border/85">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-accent uppercase block">Executive Desk Overview</span>
            <span className="px-2 py-0.5 rounded-full bg-status-success-bg/15 border border-status-success/20 text-[9px] font-mono text-status-success flex items-center gap-1">
              <ShieldCheck className="h-2.5 w-2.5" /> GTM Governance Safe
            </span>
          </div>
          <h2 className="text-xl font-black text-text-primary tracking-tight">Step 17: GTM Strategy Execution Dashboard</h2>
          <p className="text-xs text-text-secondary max-w-3xl leading-relaxed">
            Consolidates active program health indicators, direct milestone progress, ARR forecasting curves, and critical dependency mitigations for executive leadership visibility.
          </p>
        </div>

        {/* Executive Meta Panel */}
        {plan ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-3 bg-bg-surface/60 rounded-2xl border border-border/60 text-[10px] text-text-secondary w-full lg:w-auto">
            <div>Program Sponsor: <span className="text-text-primary font-bold block">{plan.executiveSponsor || 'Not Assigned'}</span></div>
            <div>Launch Windows: <span className="text-text-primary font-bold block">{plan.launchPeriod || 'H2 2026'}</span></div>
            <div className="col-span-2 border-t border-border/40 pt-1.5 flex justify-between">
              <span>Goal: <strong className="text-accent">{plan.businessGoal || 'Expansion'}</strong></span>
              <span>Target Revenue: <strong className="text-text-primary">{plan.revenueGoal || 'H2 ARR'}</strong></span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-text-secondary bg-yellow-500/5 px-4 py-3 rounded-2xl border border-yellow-500/20 max-w-md">
            ⚠️ <strong>No Archived Plan Detected:</strong> Please finalize and archive your action plan inside **Step 15: GTM Execution Engine** first to unlock live executive KPI telemetry. Showing sample baseline modeling below.
          </div>
        )}
      </div>

      {/* Main KPI metrics and Program Health cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Metric 1: Program Health score radial summary */}
        <div className="p-5 rounded-3xl bg-bg-surface/20 border border-border relative overflow-hidden flex flex-col justify-between h-[155px]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono font-bold tracking-wider text-text-secondary uppercase">Program Health Score</span>
              <div className="text-xs font-sans text-text-secondary/90 leading-tight">Compound Governance Index</div>
            </div>
            <span className="p-1.5 rounded-lg bg-accent/10 border border-accent/20">
              <Award className="h-4 w-4 text-accent" />
            </span>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <div className="text-4xl font-black text-text-primary tracking-tighter flex items-baseline">
                {plan ? metrics.healthScore : 84}<span className="text-xs text-text-secondary font-mono tracking-normal">/100</span>
              </div>
              <div className="text-[10px] font-serif tracking-tight text-accent flex items-center gap-1 font-bold">
                <span className="px-1.5 py-0.5 rounded-full bg-accent/10 text-[9px] font-mono">{plan ? metrics.healthGrade : 'A'}</span> 
                {plan ? metrics.healthStatus : 'Optimized Pipeline'}
              </div>
            </div>
            <div className="relative w-12 h-12 shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="none" />
                <circle 
                  cx="24" 
                  cy="24" 
                  r="20" 
                  stroke="var(--color-accent)" 
                  strokeWidth="4" 
                  fill="none" 
                  strokeDasharray="125.6"
                  strokeDashoffset={125.6 - (125.6 * (plan ? metrics.healthScore : 84)) / 100}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-extrabold text-text-primary">
                {plan ? metrics.healthScore : 84}%
              </div>
            </div>
          </div>
        </div>

        {/* Metric 2: Completion of tactile action steps */}
        <div className="p-5 rounded-3xl bg-bg-surface/20 border border-border relative overflow-hidden flex flex-col justify-between h-[155px]">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono font-bold tracking-wider text-text-secondary uppercase">Action Progress</span>
              <div className="text-xs font-sans text-text-secondary/90 leading-tight">Tactical Executed Milestones</div>
            </div>
            <span className="p-1.5 rounded-lg bg-status-success-bg/10 border border-status-success/20">
              <CheckCircle className="h-4 w-4 text-status-success" />
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="text-4xl font-black text-text-primary tracking-tighter">
                {plan ? metrics.progressPct : 45}%
              </div>
              <div className="text-[9px] font-mono text-text-secondary text-right">
                {plan ? `${metrics.completedActions}/${metrics.totalActions}` : '9/20'} milestones
              </div>
            </div>
            <div className="w-full bg-border rounded-full h-2 overflow-hidden">
              <div 
                className="bg-[#00F090] h-full rounded-full transition-all duration-500" 
                style={{ width: `${plan ? metrics.progressPct : 45}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Metric 3: Objective KPI achievement levels */}
        <div className="p-5 rounded-3xl bg-bg-surface/20 border border-border relative overflow-hidden flex flex-col justify-between h-[155px]">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono font-bold tracking-wider text-text-secondary uppercase">KPI Achievement Gaps</span>
              <div className="text-xs font-sans text-text-secondary/90 leading-tight">Direct Attainment of Goals</div>
            </div>
            <span className="p-1.5 rounded-lg bg-accent/10 border border-accent/20">
              <Target className="h-4 w-4 text-accent" />
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="text-4xl font-black text-text-primary tracking-tighter col-span-2">
                {plan ? metrics.avgKpiAttainment : 68}%
              </div>
              <span className="text-[9px] font-mono text-text-secondary">avg. target alignment</span>
            </div>
            <div className="w-full bg-border rounded-full h-2 overflow-hidden">
              <div 
                className="bg-accent h-full rounded-full transition-all duration-500" 
                style={{ width: `${plan ? metrics.avgKpiAttainment : 68}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Metric 4: Integrated Risk Score card */}
        <div className="p-5 rounded-3xl bg-bg-surface/20 border border-border relative overflow-hidden flex flex-col justify-between h-[155px]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono font-bold tracking-wider text-text-secondary uppercase">Risk Exposure Index</span>
              <div className="text-xs font-sans text-text-secondary/90 leading-tight">Aggregate Vulnerability</div>
            </div>
            <span className="p-1.5 rounded-lg bg-red-400/10 border border-red-500/20">
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </span>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <div className="text-4xl font-black text-text-primary tracking-tighter">
                {plan ? metrics.riskScore : 24}%
              </div>
              <div className="text-[10px] font-mono text-text-secondary uppercase">
                {plan ? `${metrics.highRisksCount} critical hazards` : '2 severe threats'}
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
              (plan ? metrics.riskScore : 24) > 40 
                ? 'bg-red-400/15 border border-red-500/25 text-red-400' 
                : 'bg-green-400/15 border border-green-500/25 text-status-success'
            }`}>
              {(plan ? metrics.riskScore : 24) > 40 ? 'High Threat' : 'Safe Zone'}
            </span>
          </div>
        </div>
      </div>

      {/* Charts & Risks Panels wrapper */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left pane: Area chart tracking ARR forecast trend */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-bg-surface/20 border border-border space-y-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-mono font-bold tracking-wider text-accent uppercase">Predictive GTM Modeling</span>
                <span className="px-1.5 py-0.5 rounded-full bg-border text-[8px] font-mono text-text-secondary">KPI Attribution</span>
              </div>
              <h3 className="text-sm font-black text-text-primary">Revenue Attainment (Performance Gauge)</h3>
              <p className="text-[11px] text-text-secondary max-w-xl leading-normal">
                Predictive execution gauge evaluating core baseline revenue against stretch targets, alongside individual initiative performance. Live performance of key indicators triggers dynamic recalculations based on empirical conversion baselines.
              </p>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-8 mt-6 w-full justify-center">
            <div className="flex-1 flex flex-col justify-center items-center">
              {(() => {
                const totalTarget = revenueEngineData.baseline + revenueEngineData.target;
                const maxVal = totalTarget * 1.25; 
                const r = 100;
                const circumference = Math.PI * r;
                
                const baselineLength = (revenueEngineData.baseline / maxVal) * circumference;
                const targetLength = (revenueEngineData.target / maxVal) * circumference;
                const projectedPct = Math.min(revenueEngineData.projected / maxVal, 1);

                let indicatorColor = 'var(--color-status-success)';
                let textColor = 'text-status-success';
                const redThreshold = revenueEngineData.baseline + 0.70 * revenueEngineData.target;
                const yellowThreshold = revenueEngineData.baseline + 0.90 * revenueEngineData.target;
                if (revenueEngineData.projected <= redThreshold) {
                    indicatorColor = '#f21b3f'; // Red
                    textColor = 'text-[#f21b3f]';
                } else if (revenueEngineData.projected < yellowThreshold) {
                    indicatorColor = '#ff9914'; // Yellow
                    textColor = 'text-[#ff9914]';
                } else if (revenueEngineData.projected >= yellowThreshold) {
                    indicatorColor = '#29bf12'; // green
                    textColor = 'text-[#29bf12]';
                }

                return (
                  <div className="relative w-full max-w-[320px] mx-auto aspect-[2/1] overflow-visible">
                    <svg viewBox="0 0 240 130" className="w-full h-full overflow-visible">
                      <path 
                         d="M 20 120 A 100 100 0 0 1 220 120" 
                         fill="none" 
                         stroke="var(--color-gauge-arc)" 
                         className="text-black/5 dark:text-[#333333]"
                         strokeWidth="16"
                      />
                      <path 
                         d="M 20 120 A 100 100 0 0 1 220 120" 
                         fill="none" 
                         stroke="var(--color-gauge-arc)" 
                         className="text-black/10 dark:text-[#555555]"
                         strokeWidth="16"
                         strokeDasharray={`${baselineLength} ${circumference}`}
                      />
                      <path 
                         d="M 20 120 A 100 100 0 0 1 220 120" 
                         fill="none" 
                         stroke="var(--color-accent)" 
                         strokeWidth="16"
                         strokeDasharray={`0 ${baselineLength} ${targetLength} ${circumference}`}
                      />

                      <g style={{ transformOrigin: '120px 120px', transform: `rotate(${-90 + projectedPct * 180}deg)`, transition: 'transform 1s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                         <path d="M 118 120 L 120 25 L 122 120 Z" fill={indicatorColor} />
                         <circle cx="120" cy="120" r="5" fill={indicatorColor} />
                      </g>
                    </svg>
                    <div className="absolute bottom-[-5px] left-0 right-0 flex justify-between px-6 text-[10px] text-text-secondary font-mono">
                       <span>$0</span>
                       <span>${revenueEngineData.formatLabel(maxVal, false)}</span>
                    </div>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center flex flex-col items-center">
                       <div className={`text-[10px] font-mono uppercase font-bold tracking-widest drop-shadow-none dark:drop-shadow-md ${textColor}`}>Projected</div>
                       <div className="text-2xl font-black text-text-primary leading-none">${revenueEngineData.formatLabel(revenueEngineData.projected, false)}</div>
                       {revenueEngineData.projected < totalTarget && (
                           <div className="text-[9px] text-status-warning mt-1 font-mono">Gap: ${revenueEngineData.formatLabel(totalTarget - revenueEngineData.projected, false)}</div>
                       )}
                    </div>
                  </div>
                )
              })()}
              
              <div className="flex gap-4 mt-8 pb-4 text-[10px] font-mono text-text-secondary">
                 <div className="flex items-center gap-1.5 border border-border/50 px-2.5 py-1 rounded-md bg-bg-surface/30">
                    <div className="w-2 h-2 rounded-sm bg-black/20 dark:bg-[#555555]" /> Baseline: ${revenueEngineData.formatLabel(revenueEngineData.baseline, false)}
                 </div>
                 <div className="flex items-center gap-1.5 border border-border/50 px-2.5 py-1 rounded-md bg-bg-surface/30">
                    <div className="w-2 h-2 rounded-sm bg-accent" /> Target: ${revenueEngineData.formatLabel(revenueEngineData.target, false)}
                 </div>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col justify-center space-y-5 px-4 pb-6 mt-4 xl:mt-0 xl:border-l xl:border-border/40 xl:pl-8">
              {revenueEngineData.steps.length > 0 ? revenueEngineData.steps.map((step, i) => {
                 const pct = step.target > 0 ? Math.min(100, Math.round((step.actual / step.target) * 100)) : (step.actual > 0 ? 100 : 0);
                 const overachieved = step.actual > step.target;
                 return (
                   <div key={i} className="flex flex-col mb-4">
                      <div className="text-[10px] text-text-primary uppercase tracking-widest font-bold truncate mb-1 opacity-80" title={step.name}>{step.name}</div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-3xl font-normal text-text-primary leading-[0.8] tracking-tighter">{pct}%</span>
                        <div className="text-[11px] text-text-secondary font-mono">
                          ${revenueEngineData.formatLabel(step.actual, false)} / ${revenueEngineData.formatLabel(step.target, false)}
                        </div>
                      </div>
                      <div className="h-2.5 w-full bg-[#1e1e24] shadow-inner rounded-full overflow-hidden border border-white/5">
                        <div className={`h-full rounded-full transition-all duration-1000 ${overachieved ? 'bg-accent shadow-[0_0_10px_rgba(0,229,255,0.4)]' : 'bg-[#00F090] shadow-[0_0_10px_rgba(0,240,144,0.4)]'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                 );
              }) : (
                 <div className="text-xs text-text-secondary italic text-center">No initiatives structured with pipeline KPIs available for performance prediction.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right pane: Top Hazards Matrix list */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-bg-surface/20 border border-border flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono font-bold tracking-wider text-accent uppercase">Risk Matrix Heatmap</span>
              <div className="flex gap-1.5">
                <button 
                  onClick={() => setSelectedRiskFilter('all')}
                  className={`text-[9px] px-2 py-0.5 rounded-md border font-bold transition-all ${
                    selectedRiskFilter === 'all' 
                      ? 'bg-accent/15 border-accent/20 text-accent' 
                      : 'bg-bg-surface/40 border-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  All
                </button>
                <button 
                  onClick={() => setSelectedRiskFilter('high')}
                  className={`text-[9px] px-2 py-0.5 rounded-md border font-bold transition-all ${
                    selectedRiskFilter === 'high' 
                      ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                      : 'bg-bg-surface/40 border-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  High
                </button>
              </div>
            </div>
            <h3 className="text-sm font-black text-text-primary">GTM Strategy Execution Top Hazards</h3>
            <p className="text-[11px] text-text-secondary leading-normal">
              Active operational flags identified during risk analysis. Filter by importance to target mitigation sprints.
            </p>
          </div>

          {/* Risk grid itemization */}
          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 flex-grow">
            {!plan || filteredRisks.length === 0 ? (
              <div className="py-12 text-center text-xs text-text-secondary border border-dashed border-border rounded-2xl bg-bg-surface/30">
                <ShieldCheck className="h-6 w-6 text-status-success mx-auto mb-2 animate-pulse" />
                <p className="font-bold">No Active Flags Found</p>
                <p className="text-[10px] text-text-secondary/75">Risks have been fully mitigated or are waiting for plan initiation.</p>
              </div>
            ) : (
              filteredRisks.map((risk) => {
                const isHigh = risk.impact === 'high' || risk.probability === 'high';
                const isMed = risk.impact === 'medium' || risk.probability === 'medium';
                const badgeStyle = isHigh 
                  ? 'bg-red-400/15 border-red-500/25 text-red-400' 
                  : isMed
                  ? 'bg-yellow-400/15 border-yellow-500/25 text-accent'
                  : 'bg-bg-surface border-border text-text-secondary';

                return (
                  <div key={risk.id} className="p-3 bg-bg-surface/45 border border-border/80 rounded-xl space-y-1.5 text-[11px] hover:border-accent/40 transition-colors">
                    <div className="flex justify-between items-start gap-1">
                      <h4 className="font-extrabold text-text-primary line-clamp-1">{risk.riskName}</h4>
                      <span className={`px-1.5 py-0.5 rounded font-mono text-[8px] font-bold uppercase tracking-wider shrink-0 ${badgeStyle}`}>
                        {risk.impact} risk
                      </span>
                    </div>
                    {risk.description && (
                      <p className="text-[10px] text-text-secondary leading-normal line-clamp-2">
                        {risk.description}
                      </p>
                    )}
                    {risk.mitigationPlan && (
                      <div className="text-[9px] font-mono p-1.5 bg-bg-primary/50 text-[#00F090] rounded border border-[#00F090]/10 leading-tight">
                        <strong className="uppercase">Mitigation:</strong> {risk.mitigationPlan}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Strategic Alignment Gaps and Velocity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left pane: Workstream Velocity table */}
        <div className="p-6 rounded-3xl bg-bg-surface/20 border border-border space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold tracking-wider text-accent uppercase">Workstream Dashboard</span>
            <h3 className="text-sm font-black text-text-primary">Workstream Operational Velocity Overview</h3>
            <p className="text-[11px] text-text-secondary leading-normal">
              Monitors progression across each tactical category, helping executives balance team priorities and verify rollout pace.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {!plan || metrics.workstreamStats.length === 0 ? (
              <div className="py-12 text-center text-xs text-text-secondary border border-dashed border-border rounded-2xl bg-bg-surface/30">
                <Layers className="h-6 w-6 text-text-secondary/40 mx-auto mb-2" />
                <p className="font-bold">No Workstream Analytics Available</p>
                <p className="text-[10px]">Create an archived execution plan inside step 15 to begin analytics mapping.</p>
              </div>
            ) : (
              metrics.workstreamStats.map((stat) => (
                <div key={stat.id} className="p-3.5 rounded-2xl bg-bg-surface/50 border border-border/80 flex flex-col justify-between gap-3">
                  <div className="flex justify-between items-start gap-1">
                    <div className="space-y-0.5">
                      <div className="text-xs font-black text-text-primary truncate max-w-[250px]">{stat.name}</div>
                      <div className="text-[10px] font-mono text-text-secondary flex items-center gap-1.5">
                        <Users className="h-3 w-3 text-accent" /> Owner: {stat.owner}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-accent shrink-0">
                      {stat.progress}% Completed
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-grow bg-border rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-accent h-full rounded-full transition-all duration-300" 
                        style={{ width: `${stat.progress}%` }} 
                      />
                    </div>
                    <span className="text-[9px] font-mono text-text-secondary shrink-0 shrink-0">
                      {stat.completedActions}/{stat.totalActions} Tasks
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right pane: Recommended Next Actions & AI Briefing */}
        <div className="p-6 rounded-3xl bg-bg-surface/20 border border-border space-y-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold tracking-wider text-accent uppercase">Executive Action Briefing</span>
              <h3 className="text-sm font-black text-text-primary">Executive Intelligence & Prescribed Next Steps</h3>
              <p className="text-[11px] text-text-secondary leading-normal">
                AI prescriptive suggestions generated automatically based on current project telemetry status, risk level, and milestones.
              </p>
            </div>

            <div className="space-y-2.5">
              {metrics.recommendations.map((rec, idx) => {
                const isUrgent = rec.includes('Urgent') || rec.includes('High Hazard');
                const pStyle = isUrgent 
                  ? 'bg-red-400/5 border border-red-500/20 text-red-300' 
                  : 'bg-bg-surface/50 border border-border text-text-secondary';

                return (
                  <div key={idx} className={`p-3 rounded-2xl flex items-start gap-3 text-xs leading-relaxed border ${pStyle}`}>
                    <span className={`p-1 rounded-lg shrink-0 mt-0.5 ${isUrgent ? 'bg-red-400/10 text-red-400' : 'bg-accent/10 text-accent'}`}>
                      <Zap className="h-3.5 w-3.5" />
                    </span>
                    <p className="font-sans font-medium text-text-primary/90">{rec}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Governance summary block (additional details added for executive perspective) */}
          {plan && (
            <div className="p-4 rounded-2xl bg-bg-surface/80 border border-accent/20 space-y-3 text-[11px]">
              <div className="flex items-center gap-1.5 text-text-primary font-bold">
                <Layers className="h-4 w-4 text-accent" />
                <span>RACI & Governance Standardized Procedures</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-text-secondary">
                <div className="p-2 bg-bg-primary/50 rounded-xl space-y-0.5">
                  <span className="font-mono text-[8px] uppercase tracking-wider block">RACI Matrix Alignment</span>
                  <p className="font-sans leading-normal font-bold text-text-primary line-clamp-1">{plan.governance?.raciAssignment || 'Fully configured internally'}</p>
                </div>
                <div className="p-2 bg-bg-primary/50 rounded-xl space-y-0.5">
                  <span className="font-mono text-[8px] uppercase tracking-wider block">Review Cadence</span>
                  <p className="font-sans leading-normal font-bold text-text-primary line-clamp-1">{plan.governance?.reviewCadence || 'Quarterly Review Cycle'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
