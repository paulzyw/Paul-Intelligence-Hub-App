import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Activity, 
  ChevronRight, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Zap, 
  ShieldAlert,
  Loader2,
  RefreshCw,
  Info
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { GTMOSProject, ExecutiveDashboardRollup } from './types';
import { calculateExecutionMetrics } from './executionUtils';

interface ExecutiveDashboardEngineProps {
  project: GTMOSProject;
  onUpdate: (projectId: string, rollup: ExecutiveDashboardRollup) => void;
}

export const ExecutiveDashboardEngine: React.FC<ExecutiveDashboardEngineProps> = ({ project, onUpdate }) => {
  const [data, setData] = useState<ExecutiveDashboardRollup | null>(project.executiveDashboardRollup || null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const gtmStrategyDraft = Object.entries(project.gtmStrategyDraft || {}).map(([key, val]) => `${key}:\n${val.join('\n')}`).join('\n\n');
      
      const response = await supabase.functions.invoke('gtmos-api', {
        body: {
          action: 'generate-executive-dashboard',
          onboardingData: project.onboarding,
          projectName: project.title,
          executionPlan: project.gtmExecutionPlan,
          revenueDecomposition: project.revenueDecomposition,
        }
      });
      
      if (response.error) throw new Error(response.error.message || 'Failed to fetch executive dashboard data.');
      
      const rawRollup = response.data as ExecutiveDashboardRollup;
      const nativeMetrics = calculateExecutionMetrics(project.archivedExecutionPlan || project.gtmExecutionPlan);
      
      // Override LLM hallucinated score with the definitive deterministic model
      const rollupData: ExecutiveDashboardRollup = {
        ...rawRollup,
        section_a_attainment: {
          ...rawRollup.section_a_attainment,
          health_score: nativeMetrics.healthScore
        }
      };

      setData(rollupData);
      onUpdate(project.id, rollupData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred fetching the executive narrative.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if we don't already have cached data
    if (!project.executiveDashboardRollup) {
      fetchDashboardData();
    } else {
      const nativeMetrics = calculateExecutionMetrics(project.archivedExecutionPlan || project.gtmExecutionPlan);
      // Guarantee the deterministic score matches the current live ExecutionDashboard
      setData({
        ...project.executiveDashboardRollup,
        section_a_attainment: {
          ...project.executiveDashboardRollup.section_a_attainment,
          health_score: nativeMetrics.healthScore
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center space-y-4 rounded-2xl border border-border bg-bg-surface/30">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
        <p className="text-sm font-mono text-text-secondary uppercase">Synthesizing Executive Narrative...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center space-y-4 rounded-2xl border border-red-500/20 bg-red-500/5">
        <AlertTriangle className="w-8 h-8 text-red-400" />
        <p className="text-sm text-red-400 max-w-md">{error}</p>
        <button onClick={fetchDashboardData} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-xl transition-colors">
          Retry Synthesis
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center space-y-4 rounded-2xl border border-border bg-bg-surface/30">
        <Building2 className="w-8 h-8 text-text-secondary/50" />
        <p className="text-sm text-text-secondary">No executive data synthesized.</p>
        <button onClick={fetchDashboardData} className="px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent text-xs font-bold rounded-xl transition-colors">
          Generate Narrative
        </button>
      </div>
    );
  }

  // Helper to determine health color
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Helper to dynamically override LLM status with deterministic execution plan state
  const getDynamicStatus = (delta: any) => {
    const plan = project.archivedExecutionPlan || project.gtmExecutionPlan;
    if (!plan || !plan.workstreams) return delta.current_execution_status;

    const searchTarget = delta.strategic_pillar.toLowerCase();
    let bestMatchInitiative: any = null;
    let bestMatchScore = 0;

    plan.workstreams.forEach((ws: any) => {
      ws.initiatives?.forEach((init: any) => {
        const initName = init.initiativeName.toLowerCase();
        let score = 0;
        const searchWords = searchTarget.split(' ').filter((w: string) => w.length > 2);
        searchWords.forEach((w: string) => {
          if (initName.includes(w)) score++;
        });
        if (score > bestMatchScore) {
          bestMatchScore = score;
          bestMatchInitiative = init;
        }
      });
    });

    if (bestMatchInitiative && bestMatchScore > 0) {
      let total = 0;
      let completed = 0;
      let inProgress = 0;
      bestMatchInitiative.actions?.forEach((act: any) => {
        total++;
        if (act.status === 'completed') completed++;
        else if (act.status === 'in_progress') inProgress++;
      });
      if (total === 0) return 'Pending Actions';
      if (completed === total) return 'Completed';
      if (completed > 0 || inProgress > 0) return 'In Progress';
      return 'Not Started';
    }

    return delta.current_execution_status;
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      
      {/* Header / Section A: Where are we? */}
      <div className="border border-border rounded-2xl bg-bg-surface/30 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
           <Building2 className="w-48 h-48" />
        </div>
        <div className="relative z-10 flex-1 space-y-4 w-full text-left">
          <div className="flex items-center gap-2">
             <div className="h-6 w-6 rounded flex items-center justify-center bg-accent/20 text-accent">
               <Activity className="w-3 h-3" />
             </div>
             <h2 className="text-sm font-mono font-bold uppercase tracking-widest text-text-secondary">Sec A. Where Are We?</h2>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-normal text-text-primary leading-tight">
            {data.section_a_attainment.narrative_brief}
          </h1>
          <div className="pt-2 flex items-center gap-4">
            <button onClick={fetchDashboardData} className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition-colors">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
        </div>
        <div className="relative z-10 text-left md:text-right shrink-0">
          <span className="text-[10px] font-mono uppercase text-text-secondary tracking-widest block mb-2">Overall Attainment Health</span>
          <div className={`text-5xl sm:text-6xl font-black tracking-tighter ${getHealthColor(data.section_a_attainment.health_score)}`}>
            {data.section_a_attainment.health_score}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 text-left">
        
        {/* Section B: Strategy vs Execution Delta */}
        <div 
          className="border border-border rounded-2xl bg-bg-surface/30 overflow-hidden relative cursor-pointer group"
          onMouseEnter={() => setActiveSection('B')}
          onMouseLeave={() => setActiveSection(null)}
        >
          <div className="p-4 sm:p-6 border-b border-border/40">
            <h3 className="text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">Sec B. Why are we here?</h3>
            <h4 className="text-base sm:text-lg font-bold text-text-primary">Strategy vs. Execution Delta</h4>
          </div>
          <div className="p-4 sm:p-6 space-y-5">
            {data.section_b_strategic_deltas.map((delta, idx) => {
              const dynamicStatus = getDynamicStatus(delta);
              return (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-text-primary">{delta.strategic_pillar}</span>
                  <span className={`text-[10px] font-mono py-1 px-2 rounded ${
                    (dynamicStatus === 'Ahead' || dynamicStatus === 'Completed') ? 'bg-green-500/10 text-green-400' :
                    (dynamicStatus === 'On Track' || dynamicStatus === 'In Progress') ? 'bg-blue-500/10 text-blue-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>
                    {dynamicStatus}
                  </span>
                </div>
                <div className="text-[10px] text-text-secondary font-mono">Target: {delta.target_metric}</div>
                <AnimatePresence>
                  {activeSection === 'B' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2 mt-2 border-t border-border/40 text-xs text-text-secondary italic leading-relaxed">
                        {delta.variance_explanation}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              );
            })}
          </div>
        </div>

        {/* Section C: Risk Radar */}
        <div 
          className="border border-border rounded-2xl bg-bg-surface/30 overflow-hidden relative cursor-pointer group"
          onMouseEnter={() => setActiveSection('C')}
          onMouseLeave={() => setActiveSection(null)}
        >
          <div className="p-6 border-b border-border/40">
            <h3 className="text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">Sec C. What threatens the goal?</h3>
            <h4 className="text-lg font-bold text-text-primary">Risk Radar & Mitigation</h4>
          </div>
          <div className="p-6 space-y-4">
            {data.section_c_risk_radar.map((risk, idx) => (
              <div key={idx} className={`p-4 rounded-xl border ${risk.severity === 'CRITICAL' ? 'border-red-500/30 bg-red-500/5' : 'border-border/40 bg-bg-primary/50'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-text-primary">{risk.threat_description}</span>
                  <ShieldAlert className={`w-4 h-4 ${risk.severity === 'CRITICAL' ? 'text-red-400' : 'text-yellow-400'}`} />
                </div>
                <div className="text-[10px] text-text-secondary font-mono mb-2">Impact: {risk.impacted_goal}</div>
                <AnimatePresence>
                  {activeSection === 'C' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 pt-2 border-t border-border/40">
                        <span className="text-[10px] font-bold text-accent uppercase tracking-wider block mb-1">Tactical Pivot Plan</span>
                        <p className="text-[11px] text-text-secondary leading-normal">{risk.suggested_mitigation_pivot}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Section D: Predictive Forecast */}
        <div 
          className="lg:col-span-2 border border-border rounded-2xl bg-bg-surface/30 overflow-hidden relative cursor-pointer group"
          onMouseEnter={() => setActiveSection('D')}
          onMouseLeave={() => setActiveSection(null)}
        >
          <div className="p-6 border-b border-border/40 flex justify-between items-end">
            <div>
              <h3 className="text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">Sec D. Where are we going?</h3>
              <h4 className="text-lg font-bold text-text-primary">Predictive Forecasting</h4>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-mono text-text-secondary block mb-1">Predicted Attainment</span>
              <span className="text-2xl font-black text-blue-400">{data.section_d_predictive_forecast.predicted_attainment_percentage}%</span>
            </div>
          </div>
          <div className="p-6">
            <p className="text-sm text-text-primary leading-relaxed mb-6">
              {data.section_d_predictive_forecast.trajectory_narrative}
            </p>
            
            <AnimatePresence>
              {activeSection === 'D' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 mt-4">
                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-2 flex items-center gap-1.5"><TrendingUp className="w-3 h-3" /> Scenario Levers</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {data.section_d_predictive_forecast.scenario_levers.map((lever, idx) => (
                        <div key={idx} className="p-4 bg-bg-primary border border-border/40 rounded-xl">
                          <div className="text-xs font-bold text-text-primary mb-1">{lever.action}</div>
                          <div className="text-[11px] text-text-secondary">{lever.projected_impact}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Section F: Friction Analysis */}
        <div 
          className="border border-border rounded-2xl bg-bg-surface/30 overflow-hidden relative cursor-pointer group"
          onMouseEnter={() => setActiveSection('F')}
          onMouseLeave={() => setActiveSection(null)}
        >
          <div className="p-6 border-b border-border/40 flex justify-between items-end">
            <div>
              <h3 className="text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">Sec E. Operational Bottlenecks</h3>
              <h4 className="text-lg font-bold text-text-primary">Friction Analysis</h4>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-mono text-text-secondary block mb-1">Avg Delay</span>
              <span className="text-xl font-black text-orange-400">{data.section_f_friction_analysis.average_delay_days}d</span>
            </div>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <span className="text-[10px] text-text-secondary uppercase font-mono block mb-1">Primary Bottleneck</span>
              <span className="text-sm font-bold text-text-primary">{data.section_f_friction_analysis.primary_bottleneck_node}</span>
            </div>
            <AnimatePresence>
              {activeSection === 'F' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 pt-4 border-t border-border/40">
                    <span className="text-[10px] font-bold text-accent uppercase tracking-wider block mb-1">Unblocking Action</span>
                    <p className="text-xs text-text-secondary leading-relaxed">{data.section_f_friction_analysis.unblocking_recommendation}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Section G: Market Signals */}
        <div 
          className="border border-border rounded-2xl bg-bg-surface/30 overflow-hidden relative cursor-pointer group"
          onMouseEnter={() => setActiveSection('G')}
          onMouseLeave={() => setActiveSection(null)}
        >
          <div className="p-6 border-b border-border/40">
            <h3 className="text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">Sec F. What is the market doing?</h3>
            <h4 className="text-lg font-bold text-text-primary">External Signals</h4>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-mono text-text-secondary uppercase block mb-1">Competitor Dynamic</span>
                <p className="text-xs font-bold text-text-primary">{data.section_g_market_signals.competitor_dynamic}</p>
              </div>
              <AnimatePresence>
                {activeSection === 'G' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-4 mt-4 pt-4 border-t border-border/40">
                      <div>
                        <span className="text-[10px] font-mono text-red-400 uppercase block mb-1">Pacing Gap</span>
                        <p className="text-[11px] text-text-secondary leading-relaxed">{data.section_g_market_signals.execution_pacing_gap}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-accent uppercase block mb-1">Strategic Pivot</span>
                        <p className="text-[11px] text-text-secondary leading-relaxed">{data.section_g_market_signals.strategic_pivot_recommendation}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
