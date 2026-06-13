import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Calculator, Target, Zap, TrendingUp, Save, BarChart3, Database, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { GTMOSProject, RevenueDecompositionConfig, RevenueDecompositionData } from './types';
import { supabase } from '../../../lib/supabase';

interface RevenueDecompositionProps {
  project: GTMOSProject;
  updateProject: (updates: Partial<GTMOSProject>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const invokeGtmApi = async (action: string, payload: Record<string, any> = {}) => {
  if (!supabase) throw new Error("Supabase client is not initialized.");
  const { data, error } = await supabase.functions.invoke('gtmos-api', {
    body: { action, ...payload }
  });
  if (error) {
    console.error(`Supabase edge function error for action '${action}':`, error);
    throw error;
  }
  return data;
};

export const RevenueDecomposition: React.FC<RevenueDecompositionProps> = ({ project, updateProject, nextStep, prevStep }) => {
  const existingConfig = project.revenueDecomposition?.config;
  
  const [config, setConfig] = useState<RevenueDecompositionConfig>({
    revenueTarget: existingConfig?.revenueTarget || project.onboarding?.revenueTarget || '',
    timeHorizon: existingConfig?.timeHorizon || project.onboarding?.timeHorizon || '',
    acv: existingConfig?.acv || '',
    winRate: existingConfig?.winRate || project.onboarding?.winRates || project.onboarding?.winRate || '',
    pipelineCoverageRatio: existingConfig?.pipelineCoverageRatio || '4x',
    sqlConversionRate: existingConfig?.sqlConversionRate || '30%',
    mqlConversionRate: existingConfig?.mqlConversionRate || '20%',
    marketingCapacity: existingConfig?.marketingCapacity || project.onboarding?.marketingTeamSize || '',
    salesCapacity: existingConfig?.salesCapacity || project.onboarding?.salesTeamSize || '',
    partnerCapacity: existingConfig?.partnerCapacity || project.onboarding?.partnerTeamSize || '',
    customerSuccessCapacity: existingConfig?.customerSuccessCapacity || project.onboarding?.customerSuccessTeamSize || ''
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const prevOnboardingRef = useRef(project.onboarding || {});

  useEffect(() => {
    const currentOnb = (project.onboarding || {}) as any;
    const prevOnb = prevOnboardingRef.current as any;
    
    let hasChanges = false;
    const updates: Partial<RevenueDecompositionConfig> = {};

    if (currentOnb.revenueTarget !== prevOnb.revenueTarget) {
      updates.revenueTarget = currentOnb.revenueTarget || '';
      hasChanges = true;
    }
    if (currentOnb.timeHorizon !== prevOnb.timeHorizon) {
      updates.timeHorizon = currentOnb.timeHorizon || '';
      hasChanges = true;
    }
    const currentWinRate = currentOnb.winRates || currentOnb.winRate;
    const prevWinRate = prevOnb.winRates || prevOnb.winRate;
    if (currentWinRate !== prevWinRate) {
      updates.winRate = currentWinRate || '';
      hasChanges = true;
    }
    if (currentOnb.marketingTeamSize !== prevOnb.marketingTeamSize) {
      updates.marketingCapacity = currentOnb.marketingTeamSize || '';
      hasChanges = true;
    }
    if (currentOnb.salesTeamSize !== prevOnb.salesTeamSize) {
      updates.salesCapacity = currentOnb.salesTeamSize || '';
      hasChanges = true;
    }
    if (currentOnb.partnerTeamSize !== prevOnb.partnerTeamSize) {
      updates.partnerCapacity = currentOnb.partnerTeamSize || '';
      hasChanges = true;
    }
    if (currentOnb.customerSuccessTeamSize !== prevOnb.customerSuccessTeamSize) {
      updates.customerSuccessCapacity = currentOnb.customerSuccessTeamSize || '';
      hasChanges = true;
    }

    if (hasChanges) {
      setConfig(prevConfig => ({ ...prevConfig, ...updates }));
      prevOnboardingRef.current = currentOnb;
    }
  }, [project.onboarding]);

  const handleManualSync = () => {
    const currentOnb = (project.onboarding || {}) as any;
    const currentWinRate = currentOnb.winRates || currentOnb.winRate;
    
    setConfig(prev => ({
      ...prev,
      revenueTarget: currentOnb.revenueTarget || prev.revenueTarget,
      timeHorizon: currentOnb.timeHorizon || prev.timeHorizon,
      winRate: currentWinRate || prev.winRate,
      marketingCapacity: currentOnb.marketingTeamSize || prev.marketingCapacity,
      salesCapacity: currentOnb.salesTeamSize || prev.salesCapacity,
      partnerCapacity: currentOnb.partnerTeamSize || prev.partnerCapacity,
      customerSuccessCapacity: currentOnb.customerSuccessTeamSize || prev.customerSuccessCapacity
    }));
  };

  const handleConfigChange = (field: keyof RevenueDecompositionConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveConfig = () => {
    const updatedData: RevenueDecompositionData = {
      config,
      result: project.revenueDecomposition?.result || null
    };
    updateProject({ revenueDecomposition: updatedData });
  };

  const generateDecomposition = async () => {
    setIsGenerating(true);
    setErrorMsg('');
    
    // Save latest config before generating
    const updatedData: RevenueDecompositionData = {
      config,
      result: project.revenueDecomposition?.result || null
    };
    updateProject({ revenueDecomposition: updatedData });

    try {
      const response = await invokeGtmApi('generate-revenue-decomposition', { config });
      
      const newRefinedData: RevenueDecompositionData = {
        config,
        result: response
      };
      
      updateProject({ revenueDecomposition: newRefinedData });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to generate revenue decomposition.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-text-primary uppercase tracking-tight flex items-center gap-2">
            <Calculator className="h-6 w-6 text-accent" />
            Revenue Decomposition Engine
          </h2>
          <p className="text-xs text-text-secondary mt-1 max-w-2xl">
            Deconstruct top-level ARR targets into tactical operational metrics (MQLs, SQLs, Pipeline Volume, Capacity) to feed the execution logic.
          </p>
        </div>
        
        <div className="flex gap-2">
           <button 
             onClick={handleSaveConfig}
             title="Save to Supabase"
             className="flex items-center gap-1.5 px-4 py-2 bg-bg-surface border border-border hover:border-accent/50 text-text-primary text-xs font-bold uppercase rounded-lg transition-all"
           >
             <Save className="h-4 w-4" />
             Save
           </button>
           <button 
            onClick={generateDecomposition}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent/10 border border-accent/20 hover:bg-accent hover:text-black text-accent text-xs font-bold uppercase rounded-lg transition-all"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isGenerating ? 'Synthesizing...' : 'Calculate Decomposition'}
          </button>
        </div>
      </div>
      
      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold rounded-lg truncate">
          {errorMsg}
        </div>
      )}

      <div className="flex flex-col gap-8">
        {/* Input Configuration Panel */}
        <div className="p-5 rounded-2xl bg-bg-surface/50 border border-border space-y-5">
           <div className="flex justify-between items-center border-b border-border pb-3">
             <h3 className="font-bold text-xs uppercase text-text-primary flex items-center gap-1.5">
               <Database className="h-4 w-4 text-accent" /> Base Metrics Input
             </h3>
             <div className="flex items-center gap-2">
               <button onClick={handleManualSync} title="Sync from Onboarding" className="text-text-secondary hover:text-accent transition-colors flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-bg-primary/50 border border-border">
                 <RefreshCw className="h-3 w-3" /> Sync
               </button>
               <button onClick={handleSaveConfig} title="Save Base Metrics" className="text-text-secondary hover:text-accent transition-colors">
                 <Save className="h-4 w-4" />
               </button>
             </div>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
             {[
               { field: 'revenueTarget', label: 'Revenue Target (ARR)' },
               { field: 'timeHorizon', label: 'Time Horizon' },
               { field: 'acv', label: 'Expected ACV ($)' },
               { field: 'winRate', label: 'Win Rate (%)' },
               { field: 'pipelineCoverageRatio', label: 'Pipeline Coverage Ratio' },
               { field: 'sqlConversionRate', label: 'SQL -> Opp Conversion' },
               { field: 'mqlConversionRate', label: 'MQL -> SQL Conversion' },
               { field: 'marketingCapacity', label: 'Marketing Team Capacity' },
               { field: 'salesCapacity', label: 'Sales Team Capacity' },
               { field: 'partnerCapacity', label: 'Partner Channel Capacity' },
               { field: 'customerSuccessCapacity', label: 'CS Capacity' },
             ].map(({ field, label }) => (
               <div key={field} className="space-y-1">
                 <label className="text-[10px] font-bold text-text-secondary uppercase">{label}</label>
                 <input 
                   type="text"
                   value={(config as any)[field]}
                   onChange={(e) => handleConfigChange(field as keyof RevenueDecompositionConfig, e.target.value)}
                   onBlur={handleSaveConfig}
                   className="w-full bg-bg-primary/50 text-text-primary text-xs border border-border/80 focus:border-accent/50 rounded-lg px-3 py-2 outline-none font-mono"
                 />
               </div>
             ))}
           </div>
        </div>

        {/* AI Output Generation Panel */}
        <div className="p-6 rounded-2xl bg-bg-surface/50 border border-[url] overflow-hidden space-y-6 shadow-xl w-full">
           <h3 className="font-bold text-sm uppercase text-text-primary flex items-center gap-2 border-b border-border pb-4">
             <BarChart3 className="h-5 w-5 text-accent" /> Decomposition Results
           </h3>
           
           {!project.revenueDecomposition?.result ? (
               <div className="flex flex-col items-center justify-center p-12 text-center text-text-secondary space-y-4 bg-bg-primary/20 rounded-xl border border-dashed border-border">
                  <Target className="h-12 w-12 opacity-20" />
                  <p className="text-sm max-w-md">
                    Enter your base metrics in the workspace above and click "Calculate Decomposition" to generate structural funnel requirements.
                  </p>
               </div>
           ) : (
               <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-left">
                  {Object.entries({
                    'Customers Required': project.revenueDecomposition.result.customersRequired,
                    'Deals Required': project.revenueDecomposition.result.dealsRequired,
                    'Pipeline Required': project.revenueDecomposition.result.pipelineRequired,
                    'Opportunities Required': project.revenueDecomposition.result.opportunitiesRequired,
                    'SQLs Required': project.revenueDecomposition.result.sqlRequired,
                    'MQLs Required': project.revenueDecomposition.result.mqlRequired,
                    'Marketing Capacity': project.revenueDecomposition.result.marketingCapacityRequired,
                    'Sales Capacity': project.revenueDecomposition.result.salesCapacityRequired,
                    'Partner Capacity': project.revenueDecomposition.result.partnerCapacityRequired,
                    'CS Capacity': project.revenueDecomposition.result.customerSuccessCapacityRequired
                  }).map(([label, value], idx) => (
                    <motion.div 
                      key={label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 bg-bg-primary/60 border border-border/50 rounded-xl space-y-2 hover:border-accent/30 transition-colors"
                    >
                      <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider block">{label}</span>
                      <span className="text-base font-medium text-text-primary block tracking-tight">{value}</span>
                    </motion.div>
                  ))}
               </div>
           )}
        </div>
      </div>
    </div>
  );
};
