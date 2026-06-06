import React, { useState } from 'react';
import { StrategyPillar } from './types';
import { Edit2, Plus, Trash2, Check, ArrowLeft, Layers, Sparkles } from 'lucide-react';

interface PillarRefinerProps {
  pillars: Record<string, StrategyPillar>;
  onSavePillars: (updatedPillars: Record<string, StrategyPillar>) => void;
}

export const PillarRefiner: React.FC<PillarRefinerProps> = ({ pillars, onSavePillars }) => {
  const [editingPillarKey, setEditingPillarKey] = useState<string | null>(null);
  const [draftPillar, setDraftPillar] = useState<StrategyPillar | null>(null);
  const [newPointText, setNewPointText] = useState('');

  const keys = Object.keys(pillars);

  const startEdit = (key: string) => {
    setEditingPillarKey(key);
    // Deep copy to prevent mutating father state instantly
    setDraftPillar(JSON.parse(JSON.stringify(pillars[key])));
    setNewPointText('');
  };

  const cancelEdit = () => {
    setEditingPillarKey(null);
    setDraftPillar(null);
  };

  const handleFieldChange = (field: keyof StrategyPillar, val: any) => {
    if (!draftPillar) return;
    setDraftPillar({
      ...draftPillar,
      [field]: val
    });
  };

  const handleMetricChange = (index: number, field: 'label' | 'value', val: string) => {
    if (!draftPillar) return;
    const nextMetrics = [...draftPillar.keyMetrics];
    nextMetrics[index] = {
      ...nextMetrics[index],
      [field]: val
    };
    handleFieldChange('keyMetrics', nextMetrics);
  };

  const deletePoint = (index: number) => {
    if (!draftPillar) return;
    const nextPoints = draftPillar.strategicPoints.filter((_, idx) => idx !== index);
    handleFieldChange('strategicPoints', nextPoints);
  };

  const addPoint = () => {
    if (!draftPillar || !newPointText.trim()) return;
    const nextPoints = [...draftPillar.strategicPoints, newPointText.trim()];
    handleFieldChange('strategicPoints', nextPoints);
    setNewPointText('');
  };

  const savePillarChanges = () => {
    if (!editingPillarKey || !draftPillar) return;
    const nextPillars = {
      ...pillars,
      [editingPillarKey]: draftPillar
    };
    onSavePillars(nextPillars);
    setEditingPillarKey(null);
    setDraftPillar(null);
  };

  if (editingPillarKey && draftPillar) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        {/* Drill down header */}
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <button
            onClick={cancelEdit}
            className="p-2 rounded-xl bg-bg-surface border border-border text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#00F090] font-bold flex items-center gap-1">
              <Layers className="h-3 w-3" />
              Strategic Pillar Tuning
            </div>
            <h3 className="text-base font-black text-text-primary">{draftPillar.title}</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary and Metrics */}
          <div className="lg:col-span-1 space-y-5">
            {/* Summary description */}
            <div className="p-5 rounded-2xl bg-bg-surface/50 border border-border/80 space-y-3">
              <span className="text-xs font-bold text-text-primary tracking-tight">Executive Summary</span>
              <textarea
                value={draftPillar.summary}
                onChange={(e) => handleFieldChange('summary', e.target.value)}
                rows={4}
                className="w-full bg-bg-primary border border-border bg-bg-surface text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/20 rounded-xl p-3 focus:border-accent/40 h-28 resize-none font-sans"
              />
            </div>

            {/* Pillar Metrics */}
            <div className="p-5 rounded-2xl bg-bg-surface/50 border border-border/80 space-y-4">
              <span className="text-xs font-bold text-text-primary tracking-tight">KPI Performance Metrics</span>
              
              <div className="space-y-3.5">
                {draftPillar.keyMetrics.map((met, idx) => (
                  <div key={idx} className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] font-mono text-text-secondary uppercase">Label</span>
                      <input
                        type="text"
                        value={met.label}
                        onChange={(e) => handleMetricChange(idx, 'label', e.target.value)}
                        className="w-full bg-bg-primary border border-border/80 rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent/35 mt-0.5"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-text-secondary uppercase">Value</span>
                      <input
                        type="text"
                        value={met.value}
                        onChange={(e) => handleMetricChange(idx, 'value', e.target.value)}
                        className="w-full bg-bg-primary border border-border/80 rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent/35 mt-0.5"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actionable points */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-bg-surface/50 border border-border/80 space-y-5">
            <span className="text-xs font-bold text-text-primary tracking-tight block">Strategic Focus Points</span>
            
            {/* Interactive Points Lists */}
            <div className="space-y-3">
              {draftPillar.strategicPoints.map((pt, idx) => (
                <div key={idx} className="group p-3 rounded-xl bg-bg-primary/60 border border-border hover:border-red-500/25 flex gap-3.5 items-center justify-between transition-all duration-200">
                  <div className="flex gap-2.5 items-start">
                    <span className="h-5 w-5 rounded-full bg-accent/15 border border-accent/25 text-[10px] font-mono flex items-center justify-center shrink-0 mt-0.5 font-bold text-accent">
                      {idx + 1}
                    </span>
                    <span className="text-xs text-text-primary leading-relaxed font-sans">{pt}</span>
                  </div>

                  <button
                    onClick={() => deletePoint(idx)}
                    className="p-1 px-1.5 rounded-lg border border-transparent hover:border-red-500/20 text-text-secondary hover:text-red-400 group-hover:opacity-100 opacity-40 transition-all"
                    title="Remove strategic constraint"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {draftPillar.strategicPoints.length === 0 && (
                <p className="text-xs text-text-secondary font-sans italic text-center py-6">No active strategy points. Add one below.</p>
              )}
            </div>

            {/* In Line insertion */}
            <div className="pt-2 border-t border-border/40 space-y-2">
              <span className="text-[10px] font-bold text-text-secondary uppercase block">Append Business Constraint</span>
              <div className="flex gap-2.5">
                <input
                  type="text"
                  value={newPointText}
                  onChange={(e) => setNewPointText(e.target.value)}
                  placeholder="e.g. Expand Salesforce AppExchange regional referrals..."
                  className="flex-1 bg-bg-primary border border-border/80 rounded-xl px-4 py-2 text-xs text-text-primary focus:outline-none focus:border-accent/40"
                  onKeyDown={(e) => e.key === 'Enter' && addPoint()}
                />
                <button
                  onClick={addPoint}
                  className="px-4 py-2 bg-bg-surface border border-accent/30 text-accent hover:border-accent hover:text-black hover:bg-accent text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Point
                </button>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-border/40">
              <button
                onClick={cancelEdit}
                className="px-4 py-2.5 border border-border text-text-secondary hover:text-text-primary text-xs font-bold rounded-xl transition-all"
              >
                Discard Revisions
              </button>
              <button
                onClick={savePillarChanges}
                className="px-5 py-2.5 bg-accent text-black hover:scale-[1.03] text-xs font-bold rounded-xl transition-all shadow-md shadow-accent/15 flex items-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                Commit Strategy Pillar Revisions
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 flex gap-2.5">
        <Sparkles className="h-5 w-5 text-accent shrink-0 mt-0.5" />
        <p className="text-xs">
          <span className="font-bold text-accent">Active Refinement Lab (Step 13): </span> 
          Edit quantitative performance triggers, alter descriptions, delete strategic pivots, or insert supplementary points across any of the 9 foundational business pillars.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {keys.map((key) => {
          const pill = pillars[key];
          return (
            <div
              key={key}
              className="p-5 rounded-2xl bg-bg-surface/50 border border-border hover:border-accent/30 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pointer-events-none mb-3">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-accent">
                    {key.replace('_', ' ')}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-accent/10 border border-accent/20 text-[9px] font-mono font-bold text-accent uppercase">
                    Stage {pill.percentageComplete}%
                  </span>
                </div>

                <h4 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-1">
                  {pill.title}
                </h4>
                <p className="text-xs text-text-secondary leading-normal mb-4 font-sans line-clamp-2">
                  {pill.summary}
                </p>

                {/* KPI badges preview */}
                <div className="grid grid-cols-3 gap-2 py-2 bg-bg-primary/40 rounded-xl px-3 border border-border/60 mb-4 h-14 items-center">
                  {pill.keyMetrics.map((met, idx) => (
                    <div key={idx} className="text-center">
                      <div className="text-[8px] font-mono font-bold text-text-secondary uppercase truncate">{met.label}</div>
                      <div className="text-[10px] sm:text-xs font-bold text-text-primary mt-0.5 truncate">{met.value}</div>
                    </div>
                  ))}
                </div>

                {/* Point previews count */}
                <div className="text-[10px] text-text-secondary/60 mb-4 font-mono">
                  {pill.strategicPoints.length} Strategic constraint rules declared.
                </div>
              </div>

              <button
                onClick={() => startEdit(key)}
                className="w-full py-2 bg-bg-primary border border-border select-none text-text-secondary group-hover:text-text-primary hover:border-accent/30 hover:bg-bg-surface text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 group"
              >
                <Edit2 className="h-3.5 w-3.5 text-text-secondary group-hover:text-accent transition-colors" />
                Refine Pillar Logic
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
