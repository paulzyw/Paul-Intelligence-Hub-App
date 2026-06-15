import React, { useState, useEffect, useMemo } from 'react';
import { Activity, TrendingUp, Target, Award, Heart, RefreshCw } from 'lucide-react';
import { GTMOSProject } from './types';

// Utility to safely aggressively parse numerical strings with formatting variations
function parseFormattedNumber(val: string | number | undefined, defaultVal: number): number {
  if (val === undefined || val === null || val === '') return defaultVal;
  if (typeof val === 'number') return val;
  const cleaned = val.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return defaultVal;
  
  // Specific catchers for "k" or "m" labels if not stripped perfectly
  if (val.toLowerCase().includes('m') && parsed < 1000) return parsed * 1000000;
  if (val.toLowerCase().includes('k') && parsed < 1000) return parsed * 1000;
  
  return parsed;
}

interface LiveTelemetryProps {
  project: GTMOSProject;
}

export const LiveTelemetry: React.FC<LiveTelemetryProps> = ({ project }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [telemetryData, setTelemetryData] = useState({
    arr: '$24,000,000',
    pipeline: '$72,000,000',
    winRate: '22%',
    retention: '95%',
    csat: '94%'
  });

  // Dynamically aggregate data from Onboarding, Revenue Decomposition, and Execution Engine
  const deriveTelemetryData = () => {
    // Ending ARR RunRate
    let arrRaw = project.gtmExecutionPlan?.revenueGoal || 
                 project.revenueDecomposition?.config?.revenueTarget?.toString() || 
                 project.onboarding?.revenueTarget || 
                 project.onboarding?.ARR || 
                 '$24,000,000';
    
    // Total open Pipeline
    let pipelineRaw = project.revenueDecomposition?.result?.opportunitiesRequired 
                      ? `$${(parseFormattedNumber(project.revenueDecomposition.result.opportunitiesRequired, 120) * (project.simulationConfig.acv || 45000)).toLocaleString()}`
                      : project.onboarding?.pipeline || '$72,000,000';

    // Close win ratio
    let winRateRaw = project.simulationConfig?.winRate 
                     ? `${project.simulationConfig.winRate}%` 
                     : project.revenueDecomposition?.config?.winRate 
                     ? `${project.revenueDecomposition.config.winRate}%`
                     : project.onboarding?.winRate || '22%';

    // Net Retention
    let retentionRaw = project.onboarding?.customerRetention || '95%';

    // CSAT
    let csatRaw = project.onboarding?.customerSatisfaction || '94%';

    return {
      arr: arrRaw.toString().startsWith('$') ? arrRaw : `$${parseFormattedNumber(arrRaw.toString(), 24000000).toLocaleString()}`,
      pipeline: pipelineRaw.toString().startsWith('$') ? pipelineRaw : `$${parseFormattedNumber(pipelineRaw.toString(), 72000000).toLocaleString()}`,
      winRate: winRateRaw.toString().includes('%') ? winRateRaw : `${winRateRaw}%`,
      retention: retentionRaw.toString().includes('%') ? retentionRaw : `${retentionRaw}%`,
      csat: csatRaw
    };
  };

  useEffect(() => {
    setTelemetryData(deriveTelemetryData());
  }, [project.onboarding, project.simulationConfig, project.revenueDecomposition, project.gtmExecutionPlan]);

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setTelemetryData(deriveTelemetryData());
      setIsSyncing(false);
    }, 600);
  };

  const csatPct = parseFloat(telemetryData.csat.replace(/[^0-9.]/g, '')) || 94;

  // Chart random fluctuation effect tied to pipeline
  const pipelineFluctuations = useMemo(() => {
    const base = 50;
    return Array.from({ length: 8 }).map(() => base + Math.floor(Math.random() * 45));
  }, [telemetryData.pipeline]);

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 flex gap-2.5 flex-1">
          <Activity className="h-5 w-5 text-accent shrink-0 mt-0.5 animate-pulse" />
          <p className="text-xs text-text-secondary">
            <span className="font-bold text-accent">Active Telemetry Tracker (Step 18): </span> 
            Displays live pipeline health ratings calculated by comparing active sales velocities against core operational variables inside onboarding Categories 1-8, Revenue Models, and Execution plans.
          </p>
        </div>
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="flex items-center gap-2 px-4 py-2.5 bg-bg-surface border border-border hover:border-accent hover:text-accent text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin text-accent' : ''}`} />
          Force Sync Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { id: 'arr', name: 'Ending ARR RunRate', val: telemetryData.arr, icon: TrendingUp },
          { id: 'pipe', name: 'Total open Pipeline', val: telemetryData.pipeline, icon: Target },
          { id: 'win', name: 'Close win ratio', val: telemetryData.winRate, icon: Award },
          { id: 'ret', name: 'Net Retention Index', val: telemetryData.retention, icon: Heart }
        ].map(ticker => (
          <div key={ticker.id} className="p-4 rounded-2xl bg-bg-surface/50 border border-border flex items-center justify-between group hover:border-accent/40 transition-colors">
            <div>
              <span className="text-[9px] font-mono text-text-secondary uppercase tracking-widest">{ticker.name}</span>
              <div className="text-base font-black text-text-primary mt-1 group-hover:text-accent transition-colors">
                {ticker.val}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/25 group-hover:bg-accent/20 transition-colors">
              <ticker.icon className="h-4 w-4 text-accent" />
            </div>
          </div>
        ))}
      </div>

      {/* Simulated Telemetry charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-bg-surface/50 border border-border space-y-4">
          <span className="text-xs font-bold text-text-primary uppercase tracking-wider block">Daily Active Pipeline Conversion volume</span>
          <div className="h-44 bg-bg-primary/50 rounded-xl border border-border/80 flex items-center justify-center p-4">
            {/* Abstract visual telemetry bars representing metrics */}
            <div className="flex items-end justify-between w-full h-full gap-2.5 font-mono text-[9px] text-accent">
              {pipelineFluctuations.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end items-center h-full">
                  <div className="w-full bg-accent/20 border-t border-accent rounded-t transition-all duration-1000" style={{ height: `${v}%` }} />
                  <div className="text-[8px] text-text-secondary mt-1">D{i+1}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-bg-surface/50 border border-border space-y-4">
          <span className="text-xs font-bold text-text-primary uppercase tracking-wider block">Customer Satisfaction benchmark tracking</span>
          <div className="h-44 bg-bg-primary/50 text-center rounded-xl border border-border/80 flex flex-col items-center justify-center space-y-2">
            <div className="text-3xl font-black text-accent transition-all">
              {telemetryData.csat.includes('%') ? telemetryData.csat : `${telemetryData.csat}%`} CSAT
            </div>
            <p className="text-[10px] text-text-secondary font-sans max-w-xs mx-auto px-4 leading-normal">Satisfactorily matching our priority targeted contract expansions.</p>
            <div className="h-1 bg-border/40 w-40 rounded-full overflow-hidden">
              <div className="bg-[#00F090] h-full transition-all duration-1000" style={{ width: `${Math.min(100, Math.max(0, csatPct))}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
